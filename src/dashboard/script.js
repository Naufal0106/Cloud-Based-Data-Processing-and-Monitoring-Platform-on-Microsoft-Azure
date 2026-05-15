const DEFAULT_API_BASE = "/api";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const SUPPORTED_UPLOAD_EXTENSIONS = [".json", ".csv", ".xlsx", ".xls"];
const AUTO_REFRESH_MS = 30000;
const AUTH_TOKEN_KEY = "k11_auth_token";
const AUTH_USER_KEY = "k11_auth_user";

const CONFIG = {
  API_BASE: (window.DATA_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, ""),
  AUTO_REFRESH_MS,
};

const state = {
  allData: [],
  chart: null,
  selectedFile: null,
  isBusy: false,
  apiOnline: false,
  authMode: "login",
  authToken: "",
  currentUser: null,
  isDemoSession: false,
  refreshTimer: null,
  lastMode: "",
};

const el = {};

function init() {
  cacheElements();
  bindEvents();
  startClock();
  initChart();
  updateBackendLabel();
  updateUploadButton();
  restoreSession();

  if (state.authToken) {
    showApp();
  } else {
    showAuth();
  }
}

function cacheElements() {
  Object.assign(el, {
    clock: document.getElementById("clock"),
    authScreen: document.getElementById("auth-screen"),
    appView: document.getElementById("app-view"),
    authForm: document.getElementById("auth-form"),
    authName: document.getElementById("auth-name"),
    authEmail: document.getElementById("auth-email"),
    authPassword: document.getElementById("auth-password"),
    authSubmit: document.getElementById("auth-submit"),
    authDemo: document.getElementById("auth-demo"),
    authMessage: document.getElementById("auth-message"),
    nameField: document.getElementById("name-field"),
    tabLogin: document.getElementById("tab-login"),
    tabRegister: document.getElementById("tab-register"),
    connectionPill: document.getElementById("connection-pill"),
    connectionLabel: document.getElementById("connection-label"),
    backendModeLabel: document.getElementById("backend-mode-label"),
    lastSync: document.getElementById("last-sync"),
    btnRefresh: document.getElementById("btnRefresh"),
    btnDataRefresh: document.getElementById("btnDataRefresh"),
    btnClearLog: document.getElementById("btnClearLog"),
    btnUpload: document.getElementById("btnUpload"),
    btnLogout: document.getElementById("btnLogout"),
    currentUserLabel: document.getElementById("current-user-label"),
    fileInput: document.getElementById("fileInput"),
    dropzone: document.getElementById("dropzone"),
    fileInfo: document.getElementById("file-info"),
    previewWrap: document.getElementById("json-preview"),
    previewContent: document.getElementById("preview-content"),
    filterStatus: document.getElementById("filter-status"),
    filterCategory: document.getElementById("filter-category"),
    chartUpdated: document.getElementById("chart-updated"),
    tableBody: document.getElementById("data-tbody"),
    logStream: document.getElementById("log-stream"),
    toast: document.getElementById("toast"),
    statTotal: document.getElementById("s-total"),
    statProcessed: document.getElementById("s-processed"),
    statAnomaly: document.getElementById("s-anomaly"),
    statError: document.getElementById("s-error"),
  });
}

function bindEvents() {
  el.authForm.addEventListener("submit", handleAuthSubmit);
  el.authDemo.addEventListener("click", startDemoSession);
  el.tabLogin.addEventListener("click", () => setAuthMode("login"));
  el.tabRegister.addEventListener("click", () => setAuthMode("register"));
  el.btnLogout.addEventListener("click", logout);
  el.btnRefresh.addEventListener("click", fetchAll);
  el.btnDataRefresh.addEventListener("click", fetchData);
  el.btnClearLog.addEventListener("click", clearLog);
  el.btnUpload.addEventListener("click", uploadFile);
  el.dropzone.addEventListener("click", () => el.fileInput.click());
  el.fileInput.addEventListener("change", (event) => {
    handleFile(event.target.files[0]);
  });

  el.filterStatus.addEventListener("change", fetchData);
  el.filterCategory.addEventListener("change", applyFilter);

  el.dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    el.dropzone.classList.add("drag-over");
  });
  el.dropzone.addEventListener("dragleave", () => {
    el.dropzone.classList.remove("drag-over");
  });
  el.dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    el.dropzone.classList.remove("drag-over");
    handleFile(event.dataTransfer.files[0]);
  });
}

function setAuthMode(mode) {
  state.authMode = mode;
  const isRegister = mode === "register";

  el.tabLogin.classList.toggle("active", !isRegister);
  el.tabRegister.classList.toggle("active", isRegister);
  el.nameField.hidden = !isRegister;
  el.authName.required = isRegister;
  el.authSubmit.textContent = isRegister ? "Register" : "Login";
  el.authPassword.autocomplete = isRegister ? "new-password" : "current-password";
  setAuthMessage("");
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  const payload = {
    email: el.authEmail.value.trim(),
    password: el.authPassword.value,
  };

  if (state.authMode === "register") {
    payload.name = el.authName.value.trim();
  }

  try {
    setAuthLoading(true);
    const response = await apiPost(state.authMode, payload, { skipAuth: true });
    saveSession(response.token, response.user, false);
    showToast(response.message || "Autentikasi berhasil.", "success");
    showApp();
  } catch (error) {
    setAuthMessage(`${error.message}. Gunakan Masuk Demo untuk simulasi lokal.`, "error");
  } finally {
    setAuthLoading(false);
  }
}

function startDemoSession() {
  saveSession(
    "demo-session",
    {
      id: "demo-user",
      name: "Demo User",
      email: "demo@kelompok11cc.my.id",
      role: "demo",
    },
    true,
  );
  showToast("Masuk sebagai demo user.", "success");
  showApp();
}

function saveSession(token, user, isDemoSession) {
  state.authToken = token;
  state.currentUser = user;
  state.isDemoSession = isDemoSession;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ ...user, isDemoSession }));
}

function restoreSession() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  if (!token || !rawUser) return;

  try {
    const user = JSON.parse(rawUser);
    state.authToken = token;
    state.currentUser = user;
    state.isDemoSession = Boolean(user.isDemoSession);
  } catch {
    clearSession();
  }
}

function clearSession() {
  state.authToken = "";
  state.currentUser = null;
  state.isDemoSession = false;
  state.apiOnline = false;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function showAuth() {
  el.authScreen.hidden = false;
  el.appView.hidden = true;
  setAuthMode(state.authMode);
}

function showApp() {
  el.authScreen.hidden = true;
  el.appView.hidden = false;
  el.currentUserLabel.textContent = state.currentUser?.name || "User";
  addLog("info", `Login sebagai ${state.currentUser?.email || "user"}.`);
  fetchAll();

  if (!state.refreshTimer) {
    state.refreshTimer = setInterval(fetchAll, CONFIG.AUTO_REFRESH_MS);
  }
}

function logout() {
  clearSession();
  resetSelectedFile();
  setConnection("", "Checking");
  showAuth();
}

function setAuthLoading(isLoading) {
  el.authSubmit.disabled = isLoading;
  el.authDemo.disabled = isLoading;
  el.authSubmit.textContent = isLoading
    ? "Memproses..."
    : state.authMode === "register"
      ? "Register"
      : "Login";
}

function setAuthMessage(message, type = "info") {
  el.authMessage.textContent = message;
  el.authMessage.className = `auth-message ${safeToken(type)}`;
}

function startClock() {
  const tick = () => {
    el.clock.textContent = new Date().toLocaleTimeString("id-ID");
  };
  tick();
  setInterval(tick, 1000);
}

function updateBackendLabel() {
  el.backendModeLabel.textContent = CONFIG.API_BASE.startsWith("/")
    ? "Same-origin proxy"
    : "External proxy";
}

function setBusy(isBusy) {
  state.isBusy = isBusy;
  el.btnRefresh.disabled = isBusy;
  el.btnDataRefresh.disabled = isBusy;
  updateUploadButton();
}

function setConnection(status, label) {
  el.connectionPill.classList.remove("online", "offline");
  if (status) {
    el.connectionPill.classList.add(status);
  }
  el.connectionLabel.textContent = label;
}

function buildUrl(path, params = {}) {
  const cleanPath = path.replace(/^\/+/, "");
  const url = new URL(`${CONFIG.API_BASE}/${cleanPath}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function apiGet(path, params, options = {}) {
  return apiRequest(path, { ...options, params });
}

async function apiPost(path, body, options = {}) {
  return apiRequest(path, { ...options, method: "POST", body });
}

async function apiPostForm(path, formData, options = {}) {
  return apiRequest(path, { ...options, method: "POST", body: formData });
}

async function apiRequest(path, options = {}) {
  const headers = new Headers({ Accept: "application/json" });
  const isFormData = options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }
  if (!options.skipAuth && state.authToken && !state.isDemoSession) {
    headers.set("Authorization", `Bearer ${state.authToken}`);
  }

  const response = await fetch(buildUrl(path, options.params), {
    method: options.method || "GET",
    headers,
    body: buildRequestBody(options.body, isFormData),
  });
  const payload = await parseJsonResponse(response);
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `HTTP ${response.status}`);
  }
  return payload;
}

function buildRequestBody(body, isFormData) {
  if (body === undefined) return undefined;
  return isFormData ? body : JSON.stringify(body);
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: text.slice(0, 180) };
  }
}

async function fetchAll() {
  setBusy(true);
  await Promise.allSettled([fetchStats(), fetchData()]);
  setBusy(false);
}

async function fetchStats() {
  if (state.isDemoSession) {
    state.apiOnline = false;
    loadDemoStats();
    setConnection("offline", "Demo");
    updateUploadButton();
    return;
  }

  try {
    const { stats } = await apiGet("stats");
    state.apiOnline = true;
    renderStats(stats);
    setConnection("online", "Proxy API");
    el.lastSync.textContent = new Date().toLocaleString("id-ID");
    el.chartUpdated.textContent = new Date().toLocaleTimeString("id-ID");
    logModeOnce("online", "success", `Stats tersinkron. Total: ${stats.total_records || 0} record.`);
  } catch (error) {
    state.apiOnline = false;
    loadDemoStats();
    setConnection("offline", "Demo");
    updateUploadButton();
    logModeOnce("demo-error", "warn", `Backend proxy belum terhubung. Mode demo aktif. ${error.message}`);
  }
}

async function fetchData() {
  if (state.isDemoSession) {
    state.allData = getDemoData();
    renderTable(getFilteredData());
    return;
  }

  try {
    const status = el.filterStatus.value;
    const payload = await apiGet("data", { status, limit: 100 });
    state.allData = Array.isArray(payload.data) ? payload.data : [];
  } catch (error) {
    state.allData = getDemoData();
    addLog("warn", `Gagal mengambil data dari backend proxy. Demo ditampilkan. ${error.message}`);
  }

  renderTable(getFilteredData());
}

function applyFilter() {
  renderTable(getFilteredData());
}

function getFilteredData() {
  const status = el.filterStatus.value;
  const category = el.filterCategory.value;

  return state.allData.filter((record) => {
    const statusMatch = status ? record.status === status : true;
    const categoryMatch = category ? record.category === category : true;
    return statusMatch && categoryMatch;
  });
}

function initChart() {
  const ctx = document.getElementById("statusChart").getContext("2d");
  state.chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Processed", "Anomaly", "Error"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: ["#16a34a", "#d97706", "#dc2626"],
          borderColor: "#ffffff",
          borderWidth: 4,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#475569",
            font: { family: "Inter", size: 12, weight: "700" },
            usePointStyle: true,
            pointStyle: "rectRounded",
          },
        },
      },
    },
  });
}

function renderStats(stats) {
  const total = toNumber(stats.total_records);
  const processed = toNumber(stats.processed);
  const errors = toNumber(stats.errors);
  const anomaly = toNumber(stats.anomaly ?? stats.anomalies ?? Math.max(0, total - processed - errors));

  el.statTotal.textContent = total.toLocaleString("id-ID");
  el.statProcessed.textContent = processed.toLocaleString("id-ID");
  el.statAnomaly.textContent = anomaly.toLocaleString("id-ID");
  el.statError.textContent = errors.toLocaleString("id-ID");

  updateChart({ processed, anomaly, errors });
}

function updateChart(stats) {
  state.chart.data.datasets[0].data = [
    toNumber(stats.processed),
    toNumber(stats.anomaly),
    toNumber(stats.errors),
  ];
  state.chart.update();
}

function renderTable(data) {
  if (!data.length) {
    el.tableBody.innerHTML = `<tr><td colspan="7" class="empty">Belum ada data.</td></tr>`;
    return;
  }

  el.tableBody.innerHTML = data
    .map((record) => {
      const status = safeToken(record.status || "unknown");
      const id = record.id ? `${String(record.id).slice(0, 8)}...` : "-";
      const time = record.processed_at ? new Date(record.processed_at).toLocaleString("id-ID") : "-";
      const source = record.source_file ? String(record.source_file).split("/").pop() : "-";

      return `
        <tr>
          <td class="mono">${escapeHtml(id)}</td>
          <td class="mono">${escapeHtml(time)}</td>
          <td class="mono">${escapeHtml(record.deviceId || "-")}</td>
          <td>${escapeHtml(record.category || "-")}</td>
          <td><span class="badge badge-${status}">${escapeHtml(record.status || "unknown")}</span></td>
          <td class="record-summary">${escapeHtml(record.summary || "-")}</td>
          <td class="mono">${escapeHtml(source)}</td>
        </tr>
      `;
    })
    .join("");
}

function handleFile(file) {
  if (!file) return;

  const extension = getFileExtension(file.name);
  if (!SUPPORTED_UPLOAD_EXTENSIONS.includes(extension)) {
    resetSelectedFile();
    showToast("File harus berformat .json, .csv, .xlsx, atau .xls", "error");
    return;
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    resetSelectedFile();
    showToast("Ukuran file maksimal 5 MB", "error");
    return;
  }

  state.selectedFile = file;
  el.fileInfo.textContent = `${file.name} (${formatBytes(file.size)})`;
  updateUploadButton();
  addLog("info", `File dipilih: ${file.name}`);

  if ([".xlsx", ".xls"].includes(extension)) {
    el.previewContent.textContent = [
      `Nama file: ${file.name}`,
      `Ukuran: ${formatBytes(file.size)}`,
      "Format: Excel workbook",
      "Preview isi Excel akan diproses di backend.",
    ].join("\n");
    el.previewWrap.hidden = false;
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const text = event.target.result;
      if (extension === ".json") {
        const parsed = JSON.parse(text);
        if (!isValidPayload(parsed)) {
          throw new Error("JSON harus berupa object atau array");
        }
        el.previewContent.textContent = buildPreview(parsed);
      } else {
        el.previewContent.textContent = buildTextPreview(text);
      }

      el.previewWrap.hidden = false;
    } catch (error) {
      resetSelectedFile();
      showToast(`File tidak valid: ${error.message}`, "error");
    }
  };
  reader.readAsText(file);
}

async function uploadFile() {
  if (!state.selectedFile) return;

  try {
    if (!state.apiOnline) {
      throw new Error("Backend proxy belum aktif");
    }
    setBusy(true);
    el.btnUpload.textContent = "Memproses...";
    addLog("info", `Mengupload ${state.selectedFile.name}.`);

    const formData = new FormData();
    formData.append("file", state.selectedFile, state.selectedFile.name);

    const payload = await apiPostForm("upload", formData);
    showToast(payload.message || "Data berhasil diproses.", "success");
    addLog("success", payload.message || "Data berhasil disimpan ke Cosmos DB.");
    resetSelectedFile();
    setTimeout(fetchAll, 800);
  } catch (error) {
    showToast(`Gagal upload: ${error.message}`, "error");
    addLog("error", `Upload gagal: ${error.message}`);
  } finally {
    setBusy(false);
    updateUploadButton();
  }
}

function updateUploadButton() {
  if (!state.apiOnline) {
    el.btnUpload.disabled = true;
    el.btnUpload.textContent = "Backend Belum Aktif";
    return;
  }

  el.btnUpload.disabled = state.isBusy || !state.selectedFile;
  el.btnUpload.textContent = state.isBusy ? "Memproses..." : "Upload & Proses";
}

function resetSelectedFile() {
  state.selectedFile = null;
  el.fileInput.value = "";
  el.fileInfo.textContent = "Belum ada file";
  el.previewWrap.hidden = true;
  el.previewContent.textContent = "";
  updateUploadButton();
}

function addLog(type, message) {
  const line = document.createElement("div");
  const time = document.createElement("span");
  const text = document.createElement("span");

  line.className = "log-line";
  time.className = "log-time";
  text.className = `log-${safeToken(type)}`;
  time.textContent = new Date().toLocaleTimeString("id-ID");
  text.textContent = message;

  line.append(time, text);
  el.logStream.appendChild(line);

  while (el.logStream.children.length > 60) {
    el.logStream.removeChild(el.logStream.firstElementChild);
  }

  el.logStream.scrollTop = el.logStream.scrollHeight;
}

function clearLog() {
  el.logStream.innerHTML = "";
  addLog("info", "Log dibersihkan.");
}

function logModeOnce(mode, type, message) {
  if (state.lastMode === mode) return;
  state.lastMode = mode;
  addLog(type, message);
}

function showToast(message, type = "success") {
  el.toast.className = `show ${safeToken(type)}`;
  el.toast.textContent = message;
  setTimeout(() => {
    el.toast.className = "";
  }, 3600);
}

function loadDemoStats() {
  const stats = {
    total_records: 142,
    processed: 128,
    anomaly: 9,
    errors: 5,
  };
  renderStats(stats);
  el.chartUpdated.textContent = "Demo";
  el.lastSync.textContent = "Mode demo";
}

function getDemoData() {
  const now = new Date().toISOString();
  return [
    {
      id: "a1b2c3d4-0001",
      deviceId: "sensor-01",
      processed_at: now,
      category: "sensor",
      status: "processed",
      summary: "Suhu: 32 C",
      source_file: "sensor_data.json",
    },
    {
      id: "a1b2c3d4-0002",
      deviceId: "sensor-02",
      processed_at: now,
      category: "sensor",
      status: "anomaly",
      summary: "Suhu: 85 C",
      source_file: "sensor_data.json",
    },
    {
      id: "a1b2c3d4-0003",
      deviceId: "app-server-01",
      processed_at: now,
      category: "log",
      status: "error",
      summary: "[ERROR] Koneksi database timeout",
      source_file: "app_log.json",
    },
    {
      id: "a1b2c3d4-0004",
      deviceId: "backup-node",
      processed_at: now,
      category: "log",
      status: "processed",
      summary: "[INFO] Backup selesai",
      source_file: "app_log.json",
    },
    {
      id: "a1b2c3d4-0005",
      deviceId: "unknown-device",
      processed_at: now,
      category: "generic",
      status: "processed",
      summary: "Record dari batch-upload.json",
      source_file: "batch-upload.json",
    },
  ];
}

function buildPreview(value) {
  const text = JSON.stringify(value, null, 2);
  return text.length > 1600 ? `${text.slice(0, 1600)}\n... preview dipotong` : text;
}

function buildTextPreview(value) {
  const lines = String(value || "").split(/\r?\n/).slice(0, 12);
  const text = lines.join("\n").trim();
  return text
    ? `${text}\n... preview baris awal`
    : "File teks kosong atau tidak dapat dipreview.";
}

function getFileExtension(filename) {
  const dotIndex = String(filename).lastIndexOf(".");
  return dotIndex >= 0 ? String(filename).slice(dotIndex).toLowerCase() : "";
}

function isValidPayload(value) {
  return value !== null && (Array.isArray(value) || typeof value === "object");
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function safeToken(value) {
  return String(value || "unknown").toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
