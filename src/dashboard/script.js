// ────────────────────────────────────────────────
// CONFIG — ganti sesuai deployment
// ────────────────────────────────────────────────
const CONFIG = {
  // Base URL Azure Functions (ganti setelah deploy)
  // Contoh: ***REMOVED_AZURE_FUNCTION_URL***
  API_BASE:
    window.AZURE_FUNCTION_URL ||
    "***REMOVED_AZURE_FUNCTION_URL***",
  // Function Key (dari Azure Portal > Functions > App Keys)
  FUNCTION_KEY: window.AZURE_FUNCTION_KEY || "GANTI_DENGAN_FUNCTION_KEY",
  AUTO_REFRESH_MS: 30000,
};

// ────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────
let allData = [];
let statusChart = null;
let selectedFile = null;
let refreshTimer = null;

// ────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  startClock();
  initChart();
  fetchAll();
  setupDragDrop();
  refreshTimer = setInterval(fetchAll, CONFIG.AUTO_REFRESH_MS);
  addLog("info", "Dashboard aktif — auto-refresh setiap 30 detik");
});

// ────────────────────────────────────────────────
// CLOCK
// ────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById("clock");
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString("id-ID");
  };
  tick();
  setInterval(tick, 1000);
}

// ────────────────────────────────────────────────
// API CALLS
// ────────────────────────────────────────────────
async function apiGet(path) {
  const url = `${CONFIG.API_BASE}/${path}&code=${CONFIG.FUNCTION_KEY}`;
  const res = await fetch(url.replace("&&", "?").replace("?&", "?"));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const url = `${CONFIG.API_BASE}/${path}?code=${CONFIG.FUNCTION_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchAll() {
  await Promise.all([fetchStats(), fetchData()]);
}

async function fetchStats() {
  try {
    const { stats } = await apiGet("stats?");
    document.getElementById("s-total").textContent = stats.total_records;
    document.getElementById("s-processed").textContent = stats.processed;
    document.getElementById("s-error").textContent = stats.errors;
    const anomaly = stats.total_records - stats.processed - stats.errors;
    document.getElementById("s-anomaly").textContent = Math.max(0, anomaly);
    document.getElementById("chart-updated").textContent =
      new Date().toLocaleTimeString("id-ID");
    updateChart(stats);
    addLog(
      "success",
      `Stats diperbarui — Total: ${stats.total_records} record`,
    );
  } catch (e) {
    // Demo mode: pakai data dummy
    loadDemoStats();
    addLog("warn", "Mode demo — API tidak terhubung");
  }
}

async function fetchData() {
  const status = document.getElementById("filter-status").value;
  try {
    const path = status ? `data?status=${status}&limit=100` : `data?limit=100`;
    const res = await apiGet(path);
    allData = res.data || [];
  } catch (e) {
    allData = getDemoData();
  }
  renderTable(allData);
}

function applyFilter() {
  renderTable(allData);
}

// ────────────────────────────────────────────────
// CHART
// ────────────────────────────────────────────────
function initChart() {
  const ctx = document.getElementById("statusChart").getContext("2d");
  statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Processed", "Anomaly", "Error"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
          borderColor: "#111827",
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#94a3b8",
            font: { family: "Space Mono", size: 11 },
          },
        },
      },
      cutout: "68%",
    },
  });
}

function updateChart(stats) {
  const anomaly = Math.max(
    0,
    stats.total_records - stats.processed - stats.errors,
  );
  statusChart.data.datasets[0].data = [stats.processed, anomaly, stats.errors];
  statusChart.update();
}

// ────────────────────────────────────────────────
// TABLE
// ────────────────────────────────────────────────
function renderTable(data) {
  const tbody = document.getElementById("data-tbody");
  const filter = document.getElementById("filter-status").value;
  const filtered = filter ? data.filter((r) => r.status === filter) : data;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">Belum ada data.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (r) => `
    <tr>
      <td class="mono">${r.id ? r.id.slice(0, 8) + "…" : "—"}</td>
      <td class="mono">${r.processed_at ? new Date(r.processed_at).toLocaleString("id-ID") : "—"}</td>
      <td>${r.category || "—"}</td>
      <td><span class="badge badge-${r.status}">${r.status}</span></td>
      <td>${r.summary || "—"}</td>
      <td class="mono">${r.source_file ? r.source_file.split("/").pop() : "—"}</td>
    </tr>
  `,
    )
    .join("");
}

// ────────────────────────────────────────────────
// UPLOAD
// ────────────────────────────────────────────────
function handleFile(file) {
  if (!file) return;
  selectedFile = file;
  document.getElementById("file-info").textContent =
    `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  document.getElementById("btnUpload").disabled = false;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const preview = document.getElementById("preview-content");
      preview.textContent =
        JSON.stringify(parsed, null, 2).slice(0, 1500) +
        "\n// ... (preview dipotong)";
      document.getElementById("json-preview").style.display = "block";
      addLog("info", `File dipilih: ${file.name}`);
    } catch {
      showToast("File bukan JSON valid!", "error");
    }
  };
  reader.readAsText(file);
}

async function uploadFile() {
  if (!selectedFile) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      addLog("info", `Mengupload ${selectedFile.name}...`);
      const btn = document.getElementById("btnUpload");
      btn.disabled = true;
      btn.textContent = "Memproses...";

      const res = await apiPost("upload?", data);
      showToast(res.message || "Berhasil diproses!", "success");
      addLog(
        "success",
        res.message || "Data berhasil diproses & disimpan ke Cosmos DB",
      );
      setTimeout(fetchAll, 1000);
    } catch (e) {
      showToast("Gagal upload: " + e.message, "error");
      addLog("error", "Upload gagal: " + e.message);
    } finally {
      const btn = document.getElementById("btnUpload");
      btn.disabled = false;
      btn.textContent = "⬆ Upload & Proses";
    }
  };
  reader.readAsText(selectedFile);
}

// ────────────────────────────────────────────────
// DRAG & DROP
// ────────────────────────────────────────────────
function setupDragDrop() {
  const zone = document.getElementById("dropzone");
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
}

// ────────────────────────────────────────────────
// LOG
// ────────────────────────────────────────────────
function addLog(type, msg) {
  const el = document.getElementById("log-stream");
  const time = new Date().toLocaleTimeString("id-ID");
  const line = document.createElement("div");
  line.className = "log-line";
  line.innerHTML = `<span class="log-time">${time}</span><span class="log-${type}">${msg}</span>`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}
function clearLog() {
  document.getElementById("log-stream").innerHTML = "";
}

// ────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const el = document.getElementById("toast");
  el.className = `show ${type}`;
  el.innerHTML = (type === "success" ? "✅ " : "❌ ") + msg;
  setTimeout(() => (el.className = ""), 3500);
}

// ────────────────────────────────────────────────
// DEMO DATA (saat API belum terhubung)
// ────────────────────────────────────────────────
function loadDemoStats() {
  document.getElementById("s-total").textContent = 142;
  document.getElementById("s-processed").textContent = 128;
  document.getElementById("s-anomaly").textContent = 9;
  document.getElementById("s-error").textContent = 5;
  statusChart.data.datasets[0].data = [128, 9, 5];
  statusChart.update();
}

function getDemoData() {
  return [
    {
      id: "a1b2c3d4-0001",
      processed_at: new Date().toISOString(),
      category: "sensor",
      status: "processed",
      summary: "Suhu: 32°C",
      source_file: "sensor_data.json",
    },
    {
      id: "a1b2c3d4-0002",
      processed_at: new Date().toISOString(),
      category: "sensor",
      status: "anomaly",
      summary: "Suhu: 85°C",
      source_file: "sensor_data.json",
    },
    {
      id: "a1b2c3d4-0003",
      processed_at: new Date().toISOString(),
      category: "log",
      status: "error",
      summary: "[ERROR] Koneksi database timeout",
      source_file: "app_log.json",
    },
    {
      id: "a1b2c3d4-0004",
      processed_at: new Date().toISOString(),
      category: "log",
      status: "processed",
      summary: "[INFO] Backup selesai",
      source_file: "app_log.json",
    },
    {
      id: "a1b2c3d4-0005",
      processed_at: new Date().toISOString(),
      category: "generic",
      status: "processed",
      summary: "Record dari batch-upload.json",
      source_file: "batch-upload.json",
    },
  ];
}
