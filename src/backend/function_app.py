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

# test CI/CD pipeline

# ──────────────────────────────────────────────
# Helper: ambil Cosmos DB connection string dari Key Vault
# ──────────────────────────────────────────────
def get_cosmos_client():
    key_vault_url = os.environ["KEY_VAULT_URL"]  # e.g. https://<vault-name>.vault.azure.net/
    credential = DefaultAzureCredential()
    secret_client = SecretClient(vault_url=key_vault_url, credential=credential)
    cosmos_conn_str = secret_client.get_secret("cosmos-connection-string").value
    return CosmosClient.from_connection_string(cosmos_conn_str)


# ──────────────────────────────────────────────
# FUNCTION 1: Blob Trigger
# Terpicu saat file JSON baru masuk ke container "raw-data"
# ──────────────────────────────────────────────
@app.blob_trigger(
    arg_name="myblob",
    path="raw-data/{name}",
    connection="AzureWebJobsStorage"
)
def process_blob(myblob: func.InputStream):
    blob_name = myblob.name
    logging.info(f"[BlobTrigger] File baru terdeteksi: {blob_name} | Ukuran: {myblob.length} bytes")

    # 1. Baca konten blob
    raw_content = myblob.read().decode("utf-8")

    # 2. Parse JSON
    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError as e:
        logging.error(f"[BlobTrigger] Gagal parse JSON dari {blob_name}: {e}")
        return

    # 3. Proses & enrichment data
    processed = _process_data(data, source_file=blob_name)

    # 4. Simpan ke Cosmos DB
    _save_to_cosmos(processed)
    logging.info(f"[BlobTrigger] Selesai memproses {blob_name} → {len(processed)} record disimpan.")


# ──────────────────────────────────────────────
# FUNCTION 2: HTTP Trigger — GET semua data
# Endpoint: GET /api/data?limit=50
# ──────────────────────────────────────────────
@app.route(route="data", methods=["GET"], auth_level=func.AuthLevel.FUNCTION)
def get_data(req: func.HttpRequest) -> func.HttpResponse:
    limit = int(req.params.get("limit", 50))
    status_filter = req.params.get("status")  # opsional: filter by status

    try:
        client = get_cosmos_client()
        db = client.get_database_client(os.environ["COSMOS_DATABASE"])
        container = db.get_container_client(os.environ["COSMOS_CONTAINER"])

        query = f"SELECT TOP {limit} * FROM c ORDER BY c.processed_at DESC"
        if status_filter:
            query = f"SELECT TOP {limit} * FROM c WHERE c.status = '{status_filter}' ORDER BY c.processed_at DESC"

        items = list(container.query_items(query=query, enable_cross_partition_query=True))
        return func.HttpResponse(
            json.dumps({"success": True, "count": len(items), "data": items}),
            mimetype="application/json",
            status_code=200
        )
    except Exception as e:
        logging.error(f"[GET /data] Error: {e}")
        return func.HttpResponse(
            json.dumps({"success": False, "error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


# ──────────────────────────────────────────────
# FUNCTION 3: HTTP Trigger — GET statistik
# Endpoint: GET /api/stats
# ──────────────────────────────────────────────
@app.route(route="stats", methods=["GET"], auth_level=func.AuthLevel.FUNCTION)
def get_stats(req: func.HttpRequest) -> func.HttpResponse:
    try:
        client = get_cosmos_client()
        db = client.get_database_client(os.environ["COSMOS_DATABASE"])
        container = db.get_container_client(os.environ["COSMOS_CONTAINER"])

        total_q   = list(container.query_items("SELECT VALUE COUNT(1) FROM c", enable_cross_partition_query=True))
        success_q = list(container.query_items("SELECT VALUE COUNT(1) FROM c WHERE c.status = 'processed'", enable_cross_partition_query=True))
        error_q   = list(container.query_items("SELECT VALUE COUNT(1) FROM c WHERE c.status = 'error'", enable_cross_partition_query=True))

        stats = {
            "total_records": total_q[0] if total_q else 0,
            "processed":     success_q[0] if success_q else 0,
            "errors":        error_q[0] if error_q else 0,
            "generated_at":  datetime.now(timezone.utc).isoformat()
        }
        return func.HttpResponse(
            json.dumps({"success": True, "stats": stats}),
            mimetype="application/json",
            status_code=200
        )
    except Exception as e:
        logging.error(f"[GET /stats] Error: {e}")
        return func.HttpResponse(
            json.dumps({"success": False, "error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


# ──────────────────────────────────────────────
# FUNCTION 4: HTTP Trigger — Upload & proses JSON langsung
# Endpoint: POST /api/upload
# Body: JSON array atau object
# ──────────────────────────────────────────────
@app.route(route="upload", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
def upload_data(req: func.HttpRequest) -> func.HttpResponse:
    try:
        data = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"success": False, "error": "Body harus berformat JSON"}),
            mimetype="application/json",
            status_code=400
        )

    processed = _process_data(data, source_file="http-upload")
    _save_to_cosmos(processed)

    return func.HttpResponse(
        json.dumps({"success": True, "message": f"{len(processed)} record berhasil diproses & disimpan."}),
        mimetype="application/json",
        status_code=201
    )


# ──────────────────────────────────────────────
# Helper internal: proses & enrichment data
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

        # Enrichment: deteksi field umum sensor/log
        if "temperature" in item:
            record["category"] = "sensor"
            record["summary"] = f"Suhu: {item['temperature']}°C"
            # Validasi anomali
            if float(item["temperature"]) > 80:
                record["status"] = "anomaly"
                record["alert"]  = "Suhu melebihi batas aman (80°C)"

        elif "level" in item and "message" in item:
            record["category"] = "log"
            record["summary"]  = f"[{item['level']}] {item['message']}"
            if item.get("level") in ("ERROR", "CRITICAL"):
                record["status"] = "error"
                record["alert"]  = "Log level kritis terdeteksi"

        else:
            record["category"] = "generic"
            record["summary"]  = f"Record dari {source_file}"

        processed.append(record)

    return processed


# ──────────────────────────────────────────────
# Helper internal: simpan ke Cosmos DB
# ──────────────────────────────────────────────
def _save_to_cosmos(records: list):
    client    = get_cosmos_client()
    db        = client.get_database_client(os.environ["COSMOS_DATABASE"])
    container = db.get_container_client(os.environ["COSMOS_CONTAINER"])

    for record in records:
        container.upsert_item(record)
        logging.info(f"[Cosmos] Disimpan: id={record['id']} | status={record['status']}")
