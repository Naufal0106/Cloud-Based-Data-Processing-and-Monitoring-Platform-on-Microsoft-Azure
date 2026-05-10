import azure.functions as func
import logging
import json
import os
import uuid
from datetime import datetime, timezone
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

app = func.FunctionApp()

# ──────────────────────────────────────────────
# HELPER: Koneksi Ke Cosmos (Lazy Loading)
# ──────────────────────────────────────────────
def get_cosmos_container():
    """
    Mengambil koneksi Cosmos DB hanya saat fungsi dijalankan. 
    Mencegah crash saat indexing di Azure Portal.
    """
    try:
        # Ambil URL & Nama dari Environment Variables
        key_vault_url = os.environ.get("KEY_VAULT_URL")
        db_name = os.environ.get("COSMOS_DATABASE")
        container_name = os.environ.get("COSMOS_CONTAINER")

        credential = DefaultAzureCredential()
        secret_client = SecretClient(vault_url=key_vault_url, credential=credential)
        
        # Ambil secret connection string dari Key Vault
        cosmos_conn_str = secret_client.get_secret("cosmos-connection-string").value
        
        client = CosmosClient.from_connection_string(cosmos_conn_str)
        return client.get_database_client(db_name).get_container_client(container_name)
    except Exception as e:
        logging.error(f"[Critical] Gagal inisialisasi koneksi: {str(e)}")
        raise e

# ──────────────────────────────────────────────
# FUNCTION 1: Blob Trigger (Proses File JSON Otomatis)
# ──────────────────────────────────────────────
@app.blob_trigger(
    arg_name="myblob", 
    path="raw-data/{name}", 
    connection="AzureWebJobsStorage"
)
def process_blob(myblob: func.InputStream):
    blob_name = myblob.name
    logging.info(f"[BlobTrigger] File masuk: {blob_name}")

    try:
        # 1. Baca & Parse
        raw_content = myblob.read().decode("utf-8")
        data = json.loads(raw_content)
        
        # 2. Proses & Enrichment 
        processed_list = _process_data(data, source_file=blob_name)
        
        # 3. Simpan ke Cosmos
        container = get_cosmos_container()
        for record in processed_list:
            container.upsert_item(record)
            logging.info(f"[Cosmos] Berhasil simpan ID: {record['id']}")
            
    except Exception as e:
        logging.error(f"[BlobTrigger] Error memproses {blob_name}: {str(e)}")

# ──────────────────────────────────────────────
# FUNCTION 2: HTTP Trigger — GET Data
# ──────────────────────────────────────────────
@app.route(route="data", methods=["GET"], auth_level=func.AuthLevel.FUNCTION)
def get_data(req: func.HttpRequest) -> func.HttpResponse:
    try:
        container = get_cosmos_container()
        limit = int(req.params.get("limit", 50))
        status_filter = req.params.get("status")

        query = f"SELECT TOP {limit} * FROM c ORDER BY c.processed_at DESC"
        if status_filter:
            query = f"SELECT TOP {limit} * FROM c WHERE c.status = '{status_filter}' ORDER BY c.processed_at DESC"

        items = list(container.query_items(query=query, enable_cross_partition_query=True))
        return func.HttpResponse(
            json.dumps({"success": True, "count": len(items), "data": items}),
            mimetype="application/json", status_code=200
        )
    except Exception as e:
        return func.HttpResponse(json.dumps({"success": False, "error": str(e)}), status_code=500)

# ──────────────────────────────────────────────
# FUNCTION 3: HTTP Trigger — GET Stats
# ──────────────────────────────────────────────
@app.route(route="stats", methods=["GET"], auth_level=func.AuthLevel.FUNCTION)
def get_stats(req: func.HttpRequest) -> func.HttpResponse:
    try:
        container = get_cosmos_container()
        total_q   = list(container.query_items("SELECT VALUE COUNT(1) FROM c", enable_cross_partition_query=True))
        success_q = list(container.query_items("SELECT VALUE COUNT(1) FROM c WHERE c.status = 'processed'", enable_cross_partition_query=True))
        error_q   = list(container.query_items("SELECT VALUE COUNT(1) FROM c WHERE c.status = 'error'", enable_cross_partition_query=True))

        stats = {
            "total_records": total_q[0] if total_q else 0,
            "processed":     success_q[0] if success_q else 0,
            "errors":        error_q[0] if error_q else 0,
            "generated_at":  datetime.now(timezone.utc).isoformat()
        }
        return func.HttpResponse(json.dumps({"success": True, "stats": stats}), mimetype="application/json")
    except Exception as e:
        return func.HttpResponse(json.dumps({"success": False, "error": str(e)}), status_code=500)

# ──────────────────────────────────────────────
# FUNCTION 4: HTTP Trigger — Upload & proses JSON Langsung
# ──────────────────────────────────────────────
@app.route(route="upload", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
def upload_data(req: func.HttpRequest) -> func.HttpResponse:
    try:
        data = req.get_json()
        processed = _process_data(data, source_file="http-upload")
        
        container = get_cosmos_container()
        for record in processed:
            container.upsert_item(record)

        return func.HttpResponse(
            json.dumps({"success": True, "message": f"{len(processed)} record disimpan."}),
            mimetype="application/json", status_code=201
        )
    except Exception as e:
        return func.HttpResponse(json.dumps({"success": False, "error": str(e)}), status_code=500)

# ──────────────────────────────────────────────
# FUNCTION 5: Health Check (Biar yakin indexing jalan)
# ──────────────────────────────────────────────
@app.route(route="hello")
def hello(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("K11 Monitoring Engine is ONLINE!", status_code=200)

# ──────────────────────────────────────────────
# LOGIKA INTERNAL: Proses & Enrichment 
# ──────────────────────────────────────────────
def _process_data(data, source_file: str) -> list:
    records = data if isinstance(data, list) else [data]
    processed = []

    for item in records:
        record = {
            "id":           str(uuid.uuid4()),
            "source_file":  source_file,
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "status":       "processed",
            "raw":          item,
        }

        # --- LOGIKA ENRICHMENT (Deteksi Sensor & Log) ---
        if "temperature" in item:
            record["category"] = "sensor"
            record["summary"] = f"Suhu: {item['temperature']}°C"
            if float(item['temperature']) > 80:
                record["status"] = "anomaly"
                record["alert"]  = "Suhu kritis (>80°C)"

        elif "level" in item and "message" in item:
            record["category"] = "log"
            record["summary"]  = f"[{item['level']}] {item['message']}"
            if item.get("level") in ("ERROR", "CRITICAL"):
                record["status"] = "error"
        else:
            record["category"] = "generic"
            record["summary"]  = f"Record dari {source_file}"

        processed.append(record)

    return processed