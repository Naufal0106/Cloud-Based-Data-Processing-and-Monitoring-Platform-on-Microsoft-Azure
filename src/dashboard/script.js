const DEFAULT_API_BASE = "/api";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const SUPPORTED_UPLOAD_EXTENSIONS = [".json", ".csv", ".xlsx", ".xls"];
const AUTO_REFRESH_MS = 30000;
const AUTH_TOKEN_KEY = "k11_auth_token_v2";
const AUTH_USER_KEY = "k11_auth_user_v2";
const LEGACY_AUTH_KEYS = ["k11_auth_token", "k11_auth_user"];
const LOCAL_PREVIEW_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const CONFIG = {
  API_BASE: normalizeApiBase(window.DATA_API_BASE || DEFAULT_API_BASE),
  AUTO_REFRESH_MS,
};

const state = {
  allData: [],
  chart: null,
  scienceCharts: {},
  adminTrafficChart: null,
  selectedFile: null,
  analysis: null,
  selectedFileAnalysis: null,
  isBusy: false,
  apiOnline: false,
  authMode: "login",
  authToken: "",
  currentUser: null,
  isPreviewSession: false,
  refreshTimer: null,
  lastMode: "",
};

const el = {};

function init() {
  cacheElements();
  bindEvents();
  state.authMode = getRequestedAuthMode() || state.authMode;
  startClock();
  initChart();
  updateUploadButton();
  clearLegacySession();

  const previewRole = getLocalPreviewRole();
  if (previewRole) {
    startPreviewSession(previewRole);
    return;
  }

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
    authMessage: document.getElementById("auth-message"),
    nameField: document.getElementById("name-field"),
    tabLogin: document.getElementById("tab-login"),
    tabRegister: document.getElementById("tab-register"),
    pageEyebrow: document.getElementById("page-eyebrow"),
    pageTitle: document.getElementById("page-title"),
    pageSubtitle: document.getElementById("page-subtitle"),
    connectionPill: document.getElementById("connection-pill"),
    connectionLabel: document.getElementById("connection-label"),
    btnRefresh: document.getElementById("btnRefresh"),
    btnDataRefresh: document.getElementById("btnDataRefresh"),
    btnClearLog: document.getElementById("btnClearLog"),
    btnUpload: document.getElementById("btnUpload"),
    btnCleanUpload: document.getElementById("btnCleanUpload"),
    btnRawUpload: document.getElementById("btnRawUpload"),
    btnAnalyticsRefresh: document.getElementById("btnAnalyticsRefresh"),
    btnLogout: document.getElementById("btnLogout"),
    btnAdminRefresh: document.getElementById("btnAdminRefresh"),
    currentUserLabel: document.getElementById("current-user-label"),
    adminPanel: document.getElementById("admin-panel"),
    adminPanelTitle: document.getElementById("admin-panel-title"),
    adminPanelSubtitle: document.getElementById("admin-panel-subtitle"),
    adminManagementGrid: document.getElementById("admin-management-grid"),
    adminManagementLayout: document.getElementById("admin-management-layout"),
    adminTotalUsers: document.getElementById("admin-total-users"),
    adminTotalUsersSub: document.getElementById("admin-total-users-sub"),
    adminActiveUsers: document.getElementById("admin-active-users"),
    adminActiveUsersSub: document.getElementById("admin-active-users-sub"),
    adminPrivilegedUsers: document.getElementById("admin-privileged-users"),
    adminPrivilegedUsersSub: document.getElementById("admin-privileged-users-sub"),
    adminTotalRecords: document.getElementById("admin-total-records"),
    adminTotalRecordsSub: document.getElementById("admin-total-records-sub"),
    adminDataIssues: document.getElementById("admin-data-issues"),
    adminDataIssuesSub: document.getElementById("admin-data-issues-sub"),
    adminGovernanceStatus: document.getElementById("admin-governance-status"),
    adminGovernanceHealth: document.getElementById("admin-governance-health"),
    adminDataStatus: document.getElementById("admin-data-status"),
    adminDataHealth: document.getElementById("admin-data-health"),
    developerMetricsGrid: document.getElementById("developer-metrics-grid"),
    developerMonitoringLayout: document.getElementById("developer-monitoring-layout"),
    adminUsersSection: document.getElementById("admin-users-section"),
    userStatsSection: document.getElementById("user-stats-section"),
    userWorkbenchSection: document.getElementById("user-workbench-section"),
    sciencePanel: document.getElementById("science-panel"),
    dataPanel: document.getElementById("data-panel"),
    adminCpuUsage: document.getElementById("admin-cpu-usage"),
    adminCpuSub: document.getElementById("admin-cpu-sub"),
    adminMemoryUsage: document.getElementById("admin-memory-usage"),
    adminMemorySub: document.getElementById("admin-memory-sub"),
    adminRequestRate: document.getElementById("admin-request-rate"),
    adminRequestRateSub: document.getElementById("admin-request-rate-sub"),
    adminLatency: document.getElementById("admin-latency"),
    adminLatencySub: document.getElementById("admin-latency-sub"),
    adminErrorRate: document.getElementById("admin-error-rate"),
    adminErrorRateSub: document.getElementById("admin-error-rate-sub"),
    adminCloudflareStatus: document.getElementById("admin-cloudflare-status"),
    adminAzureStatus: document.getElementById("admin-azure-status"),
    adminOpsHealth: document.getElementById("admin-ops-health"),
    adminTrafficChart: document.getElementById("adminTrafficChart"),
    adminUsersBody: document.getElementById("admin-users-tbody"),
    fileInput: document.getElementById("fileInput"),
    dropzone: document.getElementById("dropzone"),
    fileInfo: document.getElementById("file-info"),
    previewWrap: document.getElementById("json-preview"),
    previewContent: document.getElementById("preview-content"),
    filterStatus: document.getElementById("filter-status"),
    filterCategory: document.getElementById("filter-category"),
    chartUpdated: document.getElementById("chart-updated"),
    scienceSource: document.getElementById("science-source"),
    dsQualityScore: document.getElementById("ds-quality-score"),
    dsMissingCells: document.getElementById("ds-missing-cells"),
    dsDuplicateRows: document.getElementById("ds-duplicate-rows"),
    dsNumericColumns: document.getElementById("ds-numeric-columns"),
    scienceIssuesList: document.getElementById("science-issues-list"),
    scienceColumnsBody: document.getElementById("science-columns-tbody"),
    scienceStatusChart: document.getElementById("scienceStatusChart"),
    scienceMissingChart: document.getElementById("scienceMissingChart"),
    scienceNumericChart: document.getElementById("scienceNumericChart"),
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
  el.tabLogin.addEventListener("click", () => setAuthMode("login", { syncUrl: true }));
  el.tabRegister.addEventListener("click", () => setAuthMode("register", { syncUrl: true }));
  el.btnLogout.addEventListener("click", logout);
  el.btnRefresh.addEventListener("click", fetchAll);
  el.btnDataRefresh.addEventListener("click", fetchData);
  el.btnClearLog.addEventListener("click", clearLog);
  el.btnUpload.addEventListener("click", analyzeFile);
  el.btnCleanUpload.addEventListener("click", () => uploadFile(true));
  el.btnRawUpload.addEventListener("click", () => uploadFile(false));
  el.btnAnalyticsRefresh.addEventListener("click", fetchAnalytics);
  el.btnAdminRefresh.addEventListener("click", refreshRolePanel);
  el.adminUsersBody.addEventListener("click", handleAdminUserAction);
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

  window.addEventListener("hashchange", () => {
    const requestedMode = getRequestedAuthMode();
    if (requestedMode && !el.authScreen.hidden) {
      setAuthMode(requestedMode);
    }
  });
}

function setAuthMode(mode, options = {}) {
  state.authMode = mode;
  const isRegister = mode === "register";

  el.tabLogin.classList.toggle("active", !isRegister);
  el.tabRegister.classList.toggle("active", isRegister);
  el.nameField.hidden = !isRegister;
  el.authName.required = isRegister;
  el.authSubmit.textContent = isRegister ? "Register" : "Login";
  el.authPassword.autocomplete = "off";
  setAuthMessage("");

  if (options.syncUrl) {
    updateAuthUrl(mode);
  }
}

function getRequestedAuthMode() {
  const params = new URLSearchParams(window.location.search);
  const authMode = String(params.get("auth") || window.location.hash.replace("#", "")).toLowerCase();
  return authMode === "register" || authMode === "login" ? authMode : "";
}

function updateAuthUrl(mode) {
  if (!window.history?.replaceState) return;

  const url = new URL(window.location.href);
  url.searchParams.set("auth", mode);
  url.hash = "";
  window.history.replaceState({}, "", url);
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
    setAuthMessage(error.message, "error");
  } finally {
    setAuthLoading(false);
  }
}

function startPreviewSession(role) {
  const isAdminPreview = role === "admin";
  const isDevPreview = role === "dev";
  state.authToken = `preview-${role}`;
  state.currentUser = {
    id: isAdminPreview ? "preview-admin" : isDevPreview ? "preview-dev" : "preview-user",
    name: isAdminPreview ? "Preview Admin" : isDevPreview ? "Preview Developer" : "Preview User",
    email: isAdminPreview
      ? "admin@kelompok11cc.my.id"
      : isDevPreview
        ? "dev@kelompok11cc.my.id"
      : "user@kelompok11cc.my.id",
    role,
  };
  state.isPreviewSession = true;
  showApp();
}

function saveSession(token, user, isPreviewSession) {
  state.authToken = token;
  state.currentUser = user;
  state.isPreviewSession = isPreviewSession;
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify({ ...user, isPreviewSession }));
}

function restoreSession() {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = sessionStorage.getItem(AUTH_USER_KEY);
  if (!token || !rawUser) return;

  try {
    const user = JSON.parse(rawUser);
    state.authToken = token;
    state.currentUser = user;
    state.isPreviewSession = Boolean(user.isPreviewSession);
  } catch {
    clearSession();
  }
}

function clearLegacySession() {
  removeAuthStorage(LEGACY_AUTH_KEYS);
}

function clearSession() {
  state.authToken = "";
  state.currentUser = null;
  state.isPreviewSession = false;
  state.apiOnline = false;
  removeAuthStorage([AUTH_TOKEN_KEY, AUTH_USER_KEY, ...LEGACY_AUTH_KEYS]);
}

function removeAuthStorage(keys) {
  keys.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

function showAuth() {
  el.authScreen.hidden = false;
  el.appView.hidden = true;
  setAuthMode(state.authMode);
  resetAuthForm();
}

function resetAuthForm() {
  el.authForm.reset();
  el.authName.value = "";
  el.authEmail.value = "";
  el.authPassword.value = "";
  setAuthMessage("");
}

function showApp() {
  el.authScreen.hidden = true;
  el.appView.hidden = false;
  updateRoleUi();
  addLog("info", `Login sebagai ${state.currentUser?.email || "user"}.`);
  if (isDev()) {
    fetchDeveloperMonitoring();
  } else if (isAdmin()) {
    fetchAdminPanel();
  } else {
    fetchAll();
  }

  if (!state.refreshTimer) {
    state.refreshTimer = setInterval(fetchAll, CONFIG.AUTO_REFRESH_MS);
  }
}

function logout() {
  clearSession();
  resetSelectedFile();
  }
}

function logout() {
  clearSession();
  resetSelectedFile();
  setConnection("", "Checking");
  updateRoleUi();
  showAuth();
}

function updateRoleUi() {
  const name = state.currentUser?.name || "User";
  const role = state.currentUser?.role || "user";
  el.currentUserLabel.textContent = state.currentUser
    ? `${name} · ${role}`
    : "";
  const admin = isAdmin();
  const dev = isDev();
  el.adminPanel.hidden = !(admin || dev);
  el.adminManagementGrid.hidden = !admin;
  el.adminManagementLayout.hidden = !admin;
  el.developerMetricsGrid.hidden = !dev;
  el.developerMonitoringLayout.hidden = !dev;
  el.adminUsersSection.hidden = !admin;
  el.adminPanelTitle.textContent = dev ? "Developer Monitoring" : "Admin Operations";
  el.adminPanelSubtitle.textContent = dev
    ? "CPU, memory, request rate, latency, error rate, dan centralized logging."
    : "Pantau akses, role, data operasional, dan kontrol platform.";
  el.btnAdminRefresh.textContent = dev ? "Reload Monitoring" : "Reload Admin";
  el.userStatsSection.hidden = admin || dev;
  el.userWorkbenchSection.hidden = admin || dev;
  el.sciencePanel.hidden = admin || dev;
  el.dataPanel.hidden = admin || dev;
  el.pageEyebrow.textContent = dev
    ? "Developer monitoring dashboard"
    : admin
      ? "Admin access dashboard"
      : "Cloud monitoring dashboard";
  el.pageTitle.textContent = dev
    ? "Developer Monitoring"
    : admin
      ? "Admin Operations"
      : "Realtime Data Processing";
  el.pageSubtitle.textContent = dev
    ? "Pantau CPU, memory, request rate, latency, error rate, dan centralized logging Azure."
    : admin
      ? "Kelola akses, role, dan ringkasan operasional tanpa fitur data processing."
    : "Frontend berjalan di Cloudflare Pages, backend dan data pipeline berjalan di Microsoft Azure.";

  // Peningkatan UI: Info Bar & Badge Dinamis
  const infoBar = document.getElementById("role-info-bar");
  const infoText = document.getElementById("role-info-text");
  const adminBadge = document.getElementById("admin-source-badge");

  if (infoBar && infoText) {
    infoBar.classList.remove("admin-theme", "dev-theme");
    if (admin) {
      infoBar.classList.add("admin-theme");
      infoText.innerHTML = `🔑 <strong>Mode Administrator Aktif:</strong> Anda memiliki otoritas penuh untuk mengelola daftar akun pengguna, mengubah peran/hak akses platform (User, Developer, Admin), serta memantau data operasional global di database Azure Cosmos DB.`;
      if (adminBadge) {
        adminBadge.textContent = "Cosmos DB Users";
        adminBadge.className = "source-badge badge-cosmos";
      }
    } else if (dev) {
      infoBar.classList.add("dev-theme");
      infoText.innerHTML = `📊 <strong>Mode Developer Monitoring Aktif:</strong> Dashboard ini dirancang khusus untuk memantau metrik performa infrastruktur serverless Azure Functions (CPU, Memory, Latency) dan trafik jaringan CDN Cloudflare via API GraphQL secara real-time.`;
      if (adminBadge) {
        adminBadge.textContent = "Azure Monitor & Cloudflare";
        adminBadge.className = "source-badge badge-azure-monitor";
      }
    } else {
      infoText.innerHTML = `📥 <strong>Mode Standard User Aktif:</strong> Anda dapat mengunggah berkas data telemetri (JSON, CSV, atau Excel) untuk dianalisis kualitas datanya menggunakan pemicu serverless Azure Functions sebelum disimpan ke database Cosmos DB.`;
    }
  }

  if (!dev) {
    renderAdminOpsEmpty("Akses developer diperlukan");
  }
}

function refreshRolePanel() {
  if (isDev()) {
    fetchDeveloperMonitoring();
    return;
  }
  if (isAdmin()) {
    fetchAdminPanel();
  }
}

function isAdmin() {
  return state.currentUser?.role === "admin";
}

function isDev() {
  return state.currentUser?.role === "dev";
}

function getLocalPreviewRole() {
  if (!LOCAL_PREVIEW_HOSTS.has(window.location.hostname)) return "";

  const role = new URLSearchParams(window.location.search).get("preview");
  return role === "admin" || role === "dev" || role === "user" ? role : "";
}

function setAuthLoading(isLoading) {
  el.authSubmit.disabled = isLoading;
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

function setBusy(isBusy) {
  state.isBusy = isBusy;
  el.btnRefresh.disabled = isBusy;
  el.btnDataRefresh.disabled = isBusy;
  el.btnAnalyticsRefresh.disabled = isBusy;
  el.btnAdminRefresh.disabled = isBusy;
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

function normalizeApiBase(rawBase) {
  const base = String(rawBase || DEFAULT_API_BASE).trim();
  if (!base.startsWith("/") || base.startsWith("//")) {
    return DEFAULT_API_BASE;
  }

  return `/${base.replace(/^\/+|\/+$/g, "") || "api"}`;
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
  if (!options.skipAuth && state.authToken && !state.isPreviewSession) {
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
  if (isDev()) {
    await fetchDeveloperMonitoring();
  } else if (isAdmin()) {
    await fetchAdminPanel();
  } else {
    await Promise.allSettled([fetchStats(), fetchData(), fetchAnalytics()]);
  }
  setBusy(false);
}

async function fetchAdminPanel() {
  await Promise.allSettled([fetchAdminSummary(), fetchAdminUsers()]);
}

async function fetchAdminSummary() {
  if (!isAdmin()) return;

  if (state.isPreviewSession) {
    renderAdminSummary(getPreviewAdminSummary());
    return;
  }

  try {
    const payload = await apiGet("management/summary");
    renderAdminSummary(payload.summary || {});
  } catch (error) {
    renderAdminSummaryEmpty(`Gagal memuat ringkasan admin: ${error.message}`);
    addLog("warn", `Admin summary gagal dimuat. ${error.message}`);
  }
}

async function fetchStats() {
  if (state.isPreviewSession) {
    state.apiOnline = false;
    loadPreviewStats();
    setConnection("offline", "Preview");
    updateUploadButton();
    return;
  }

  try {
    const { stats } = await apiGet("stats");
    state.apiOnline = true;
    renderStats(stats);
    setConnection("online", "Proxy API");
    el.chartUpdated.textContent = new Date().toLocaleTimeString("id-ID");
    logModeOnce("online", "success", `Stats tersinkron. Total: ${stats.total_records || 0} record.`);
  } catch (error) {
    state.apiOnline = false;
    renderEmptyStats();
    setConnection("offline", "API offline");
    updateUploadButton();
    logModeOnce("api-error", "warn", `Backend proxy belum terhubung. ${error.message}`);
  }
}

async function fetchData() {
  if (state.isPreviewSession) {
    state.allData = getPreviewData();
    renderTable(getFilteredData());
    return;
  }

  try {
    const status = el.filterStatus.value;
    const payload = await apiGet("data", { status, limit: 100 });
    state.allData = Array.isArray(payload.data) ? payload.data : [];
  } catch (error) {
    state.allData = [];
    addLog("warn", `Gagal mengambil data dari backend proxy. ${error.message}`);
  }

  renderTable(getFilteredData());
}

async function fetchAnalytics() {
  if (state.isPreviewSession) {
    renderScienceAnalysis(buildPreviewScienceAnalysis());
    return;
  }

  if (!state.authToken) return;

  try {
    el.btnAnalyticsRefresh.disabled = true;
    const payload = await apiGet("analytics", { limit: 200 });
    renderScienceAnalysis(payload);
  } catch (error) {
    renderScienceEmpty("Analitik belum tersedia");
    addLog("warn", `Gagal memuat analitik data science. ${error.message}`);
  } finally {
    el.btnAnalyticsRefresh.disabled = false;
  }
}

async function fetchDeveloperMonitoring() {
  if (!isDev()) return;
  await fetchAdminOps();
}

async function fetchAdminOps() {
  if (!isDev()) {
    renderAdminOpsEmpty("Akses developer diperlukan");
    return;
  }

  if (state.isPreviewSession) {
    renderAdminOps(getPreviewOpsSummary());
    return;
  }

  if (!state.authToken) return;

  try {
    const payload = await apiGet("dev/ops-summary");
    renderAdminOps(payload);
    addLog("success", "Developer monitoring tersinkron dari Azure dan Cloudflare.");
  } catch (error) {
    renderAdminOpsEmpty(`Gagal memuat developer monitoring: ${error.message}`);
    addLog("warn", `Developer monitoring gagal dimuat. ${error.message}`);
  }
}

async function fetchAdminUsers() {
  if (!isAdmin()) {
    renderAdminUsers([]);
    return;
  }

  if (state.isPreviewSession) {
    renderAdminUsers(getPreviewUsers());
    return;
  }

  try {
    el.btnAdminRefresh.disabled = true;
    const payload = await apiGet("management/users");
    renderAdminUsers(Array.isArray(payload.users) ? payload.users : []);
  } catch (error) {
    el.adminUsersBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty">Gagal memuat user: ${escapeHtml(error.message)}</td>
      </tr>
    `;
    addLog("warn", `Admin users gagal dimuat. ${error.message}`);
  } finally {
    el.btnAdminRefresh.disabled = false;
  }
}

function renderAdminSummary(summary = {}) {
  const users = summary.users || {};
  const telemetry = summary.telemetry || {};
  const controls = summary.controls || {};
  const privileged = toNumber(users.admin) + toNumber(users.dev);
  const issues = toNumber(telemetry.anomaly) + toNumber(telemetry.error);

  el.adminTotalUsers.textContent = formatCompact(users.total);
  el.adminActiveUsers.textContent = formatCompact(users.recent_login);
  el.adminPrivilegedUsers.textContent = formatCompact(privileged);
  el.adminTotalRecords.textContent = formatCompact(telemetry.total);
  el.adminDataIssues.textContent = formatCompact(issues);

  el.adminTotalUsersSub.textContent = `${formatCompact(users.regular)} user biasa`;
  el.adminActiveUsersSub.textContent = "Login 7 hari terakhir";
  el.adminPrivilegedUsersSub.textContent = `${formatCompact(users.admin)} admin, ${formatCompact(users.dev)} dev`;
  el.adminTotalRecordsSub.textContent = `${formatCompact(telemetry.processed)} processed`;
  el.adminDataIssuesSub.textContent = `${formatCompact(telemetry.anomaly)} anomaly, ${formatCompact(telemetry.error)} error`;

  el.adminGovernanceStatus.textContent = "Ready";
  el.adminDataStatus.textContent = "Ready";
  el.adminGovernanceHealth.innerHTML = [
    { label: "Register publik", value: `Role ${controls.public_register_role || "user"}`, tone: "ready" },
    { label: "Admin self-demotion guard", value: controls.admin_role_protected ? "Aktif" : "Perlu cek", tone: controls.admin_role_protected ? "ready" : "warn" },
    { label: "User data scope", value: controls.user_data_scoped ? "Per akun" : "Global", tone: controls.user_data_scoped ? "ready" : "warn" },
    { label: "Management API", value: controls.management_route || "/api/management", tone: "ready" },
  ].map(renderOpsHealthRow).join("");

  el.adminDataHealth.innerHTML = [
    { label: "Processed", value: formatCompact(telemetry.processed), tone: "ready" },
    { label: "Anomaly", value: formatCompact(telemetry.anomaly), tone: toNumber(telemetry.anomaly) > 0 ? "warn" : "ready" },
    { label: "Error", value: formatCompact(telemetry.error), tone: toNumber(telemetry.error) > 0 ? "warn" : "ready" },
    { label: "Issue ratio", value: formatPercent(toNumber(telemetry.total) ? (issues / toNumber(telemetry.total)) * 100 : 0), tone: issues > 0 ? "warn" : "ready" },
  ].map(renderOpsHealthRow).join("");

  addLog("success", "Admin operations tersinkron dari Azure Cosmos DB.");
}

function renderAdminSummaryEmpty(message) {
  el.adminTotalUsers.textContent = "-";
  el.adminActiveUsers.textContent = "-";
  el.adminPrivilegedUsers.textContent = "-";
  el.adminTotalRecords.textContent = "-";
  el.adminDataIssues.textContent = "-";
  el.adminTotalUsersSub.textContent = message;
  el.adminActiveUsersSub.textContent = "Login activity";
  el.adminPrivilegedUsersSub.textContent = "Admin + developer";
  el.adminTotalRecordsSub.textContent = "Cosmos DB";
  el.adminDataIssuesSub.textContent = "Anomaly + error";
  el.adminGovernanceStatus.textContent = "-";
  el.adminDataStatus.textContent = "-";
  el.adminGovernanceHealth.innerHTML = renderOpsHealthRow({ label: message, value: "-", tone: "warn" });
  el.adminDataHealth.innerHTML = renderOpsHealthRow({ label: "Data operations", value: "-", tone: "warn" });
}

function renderAdminOps(payload = {}) {
  const azure = payload.azure || {};
  const cloudflare = payload.cloudflare || {};
  const azureTotals = azure.totals || {};

  el.adminCpuUsage.textContent = formatCpu(azureTotals);
  el.adminMemoryUsage.textContent = formatMemory(azureTotals);
  el.adminRequestRate.textContent = `${formatRate(azureTotals.function_request_rate_per_minute)}/m`;
  el.adminLatency.textContent = formatSeconds(azureTotals.function_avg_response_time);
  el.adminErrorRate.textContent = formatPercent(azureTotals.function_error_rate);

  el.adminCpuSub.textContent = azureTotals.cpu_usage_percent
    ? "VM Percentage CPU"
    : "Function CPU time";
  el.adminMemorySub.textContent = azureTotals.memory_working_set_bytes
    ? "Function working set"
    : "VM available memory";
  el.adminRequestRateSub.textContent = `${formatCompact(azureTotals.function_requests)} request/24 jam`;
  el.adminLatencySub.textContent = "Average response time";
  el.adminErrorRateSub.textContent = `${formatCompact(azureTotals.function_5xx)} HTTP 5xx/24 jam`;
  el.adminCloudflareStatus.textContent = statusLabel(cloudflare);
  el.adminAzureStatus.textContent = statusLabel(azure);

  // Render Cloudflare CDN Analytics in detail (UPR Project specific)
  const cfTotals = cloudflare.totals || {};
  const cfWindow = cloudflare.window || "7d";

  const elCfWindow = document.getElementById("cf-analytics-window");
  const elCfRequests = document.getElementById("cf-total-requests");
  const elCfViews = document.getElementById("cf-page-views");
  const elCfVisitors = document.getElementById("cf-unique-visitors");
  const elCfRatio = document.getElementById("cf-cache-ratio");
  const elCfThreats = document.getElementById("cf-threats");

  if (elCfWindow) elCfWindow.textContent = cfWindow;
  if (elCfRequests) elCfRequests.textContent = cloudflare.configured ? formatCompact(cfTotals.requests) : "-";
  if (elCfViews) elCfViews.textContent = cloudflare.configured ? formatCompact(cfTotals.page_views) : "-";
  if (elCfVisitors) elCfVisitors.textContent = cloudflare.configured ? formatCompact(cfTotals.unique_visitors) : "-";
  if (elCfRatio) elCfRatio.textContent = cloudflare.configured ? formatPercent(cfTotals.cache_ratio) : "-";
  if (elCfThreats) elCfThreats.textContent = cloudflare.configured ? formatCompact(cfTotals.threats) : "-";

  renderAdminTrafficChart(azure);
  renderAdminOpsHealth(azure, cloudflare);
}

function renderAdminOpsEmpty(message) {
  el.adminCpuUsage.textContent = "-";
  el.adminMemoryUsage.textContent = "-";
  el.adminRequestRate.textContent = "-";
  el.adminLatency.textContent = "-";
  el.adminErrorRate.textContent = "-";
  el.adminCpuSub.textContent = message;
  el.adminMemorySub.textContent = "Azure Monitor";
  el.adminRequestRateSub.textContent = "Request/menit";
  el.adminLatencySub.textContent = "Average response";
  el.adminErrorRateSub.textContent = "HTTP 5xx";
  el.adminCloudflareStatus.textContent = "-";
  el.adminAzureStatus.textContent = "-";

  const elCfRequests = document.getElementById("cf-total-requests");
  const elCfViews = document.getElementById("cf-page-views");
  const elCfVisitors = document.getElementById("cf-unique-visitors");
  const elCfRatio = document.getElementById("cf-cache-ratio");
  const elCfThreats = document.getElementById("cf-threats");

  if (elCfRequests) elCfRequests.textContent = "-";
  if (elCfViews) elCfViews.textContent = "-";
  if (elCfVisitors) elCfVisitors.textContent = "-";
  if (elCfRatio) elCfRatio.textContent = "-";
  if (elCfThreats) elCfThreats.textContent = "-";

  renderAdminTrafficChart({});
  el.adminOpsHealth.innerHTML = `
    <div class="ops-health-item">
      <span>${escapeHtml(message)}</span>
      <strong>-</strong>
    </div>
  `;
}

function renderAdminTrafficChart(azure) {
  if (!el.adminTrafficChart || !window.Chart) return;
  if (state.adminTrafficChart) {
    state.adminTrafficChart.destroy();
  }

  const functionMetrics = getAzureResourceMetrics(azure, "function");
  const requestPoints = metricPoints(functionMetrics.Requests);
  const errorPoints = metricPoints(functionMetrics.Http5xx);
  const labels = requestPoints.length
    ? requestPoints.map((item) => formatPointTime(item.time))
    : ["Belum ada data"];
  const requests = requestPoints.length
    ? requestPoints.map((item) => Number((toNumber(item.value) / 60).toFixed(2)))
    : [0];
  const errors = errorPoints.length ? errorPoints.map((item) => toNumber(item.value)) : [0];

  state.adminTrafficChart = new Chart(el.adminTrafficChart.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Request/min",
          data: requests,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          fill: true,
          tension: 0.32,
        },
        {
          label: "HTTP 5xx",
          data: errors,
          borderColor: "#dc2626",
          backgroundColor: "rgba(220, 38, 38, 0.1)",
          fill: true,
          tension: 0.32,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { boxWidth: 10, color: "#475569" },
        },
      },
      scales: {
        x: {
          ticks: { color: "#64748b", maxRotation: 0, autoSkip: true },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#64748b", precision: 0 },
          grid: { color: "rgba(100, 116, 139, 0.18)" },
        },
      },
    },
  });
}

function renderAdminOpsHealth(azure, cloudflare) {
  const totals = azure.totals || {};
  const cfTotals = cloudflare.totals || {};
  const rows = [
    {
      label: "Centralized logging",
      value: azure.configured ? "Azure Monitor + Log Analytics" : "Belum konfigurasi",
      tone: azure.status,
    },
    {
      label: "CPU usage",
      value: formatCpu(totals),
      tone: toNumber(totals.cpu_usage_percent) >= 80 ? "warn" : "ready",
    },
    {
      label: "Memory",
      value: formatMemory(totals),
      tone: "ready",
    },
    {
      label: "Request rate",
      value: `${formatRate(totals.function_request_rate_per_minute)}/menit`,
      tone: "ready",
    },
    {
      label: "Latency",
      value: formatSeconds(totals.function_avg_response_time),
      tone: toNumber(totals.function_avg_response_time) > 2 ? "warn" : "ready",
    },
    {
      label: "Error rate",
      value: formatPercent(totals.function_error_rate),
      tone: toNumber(totals.function_error_rate) > 1 ? "warn" : "ready",
    },
    {
      label: "Storage transactions",
      value: formatCompact(totals.storage_transactions),
      tone: "ready",
    },
    {
      label: "Cosmos DB requests",
      value: formatCompact(totals.cosmos_requests),
      tone: "ready",
    },
    {
      label: "Cosmos availability",
      value: totals.cosmos_availability ? `${Number(totals.cosmos_availability).toFixed(2)}%` : "-",
      tone: toNumber(totals.cosmos_availability) >= 99 ? "ready" : "warn",
    },
    {
      label: "Cloudflare CDN",
      value: cloudflare.configured ? `${formatCompact(cfTotals.requests)} request` : "Belum konfigurasi",
      tone: cloudflare.status,
    },
  ];

  el.adminOpsHealth.innerHTML = rows
    .map(renderOpsHealthRow)
    .join("");
}

function renderOpsHealthRow(row) {
  return `
    <div class="ops-health-item ops-${safeToken(row.tone || "unknown")}">
      <span>${escapeHtml(row.label)}</span>
      <strong>${escapeHtml(row.value)}</strong>
    </div>
  `;
}

function renderAdminUsers(users) {
  if (!isAdmin()) {
    el.adminUsersBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty">Hanya admin yang dapat melihat daftar user.</td>
      </tr>
    `;
    return;
  }

  if (!users.length) {
    el.adminUsersBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty">Belum ada user.</td>
      </tr>
    `;
    return;
  }

  el.adminUsersBody.innerHTML = users
    .map((user) => {
      const role = user.role || "user";
      const nextRole = nextRoleFor(role);
      const isCurrentUser = user.id === state.currentUser?.id;
      const isPreviewAdminPanel = state.isPreviewSession;
      const disableDemoteSelf = isCurrentUser && nextRole === "user";
      const disableAction = isPreviewAdminPanel || disableDemoteSelf;
      const createdAt = user.created_at ? new Date(user.created_at).toLocaleString("id-ID") : "-";
      const lastLoginAt = user.last_login_at ? new Date(user.last_login_at).toLocaleString("id-ID") : "-";

      return `
        <tr>
          <td>${escapeHtml(user.name || "-")}</td>
          <td class="mono">${escapeHtml(user.email || "-")}</td>
          <td><span class="badge badge-${safeToken(role)}">${escapeHtml(role)}</span></td>
          <td class="mono">${escapeHtml(createdAt)}</td>
          <td class="mono">${escapeHtml(lastLoginAt)}</td>
          <td>
            <button
              class="btn btn-secondary btn-sm"
              type="button"
              data-user-role-action
              data-user-id="${escapeHtml(user.id)}"
              data-next-role="${escapeHtml(nextRole)}"
              ${disableAction ? "disabled" : ""}
            >
              ${isPreviewAdminPanel ? "Preview" : `Jadikan ${escapeHtml(nextRole)}`}
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function handleAdminUserAction(event) {
  const button = event.target.closest("[data-user-role-action]");
  if (!button || button.disabled) return;

  const userId = button.dataset.userId;
  const nextRole = button.dataset.nextRole;

  try {
    button.disabled = true;
    button.textContent = "Menyimpan...";
    const payload = await apiPost(`management/users/${encodeURIComponent(userId)}/role`, {
      role: nextRole,
    });
    showToast(payload.message || "Role user diperbarui.", "success");
    addLog("success", `Role ${payload.user?.email || "user"} menjadi ${payload.user?.role}.`);
    fetchAdminPanel();
  } catch (error) {
    showToast(`Gagal update role: ${error.message}`, "error");
    addLog("error", `Update role gagal: ${error.message}`);
    fetchAdminPanel();
  }
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

function renderScienceAnalysis(payload = {}) {
  const profile = payload.profile || {};
  const quality = payload.quality || {};
  const charts = payload.charts || {};
  const recordCount = toNumber(profile.record_count);
  const columnCount = toNumber(profile.column_count);

  state.analysis = payload;
  el.scienceSource.textContent = payload.source_file
    ? `${payload.source_file} - ${recordCount} row, ${columnCount} kolom`
    : "Analitik data tersimpan";
  el.dsQualityScore.textContent = Number.isFinite(Number(quality.score))
    ? `${quality.score}/100`
    : "-";
  el.dsMissingCells.textContent = toNumber(quality.missing_cells ?? profile.missing_cells)
    .toLocaleString("id-ID");
  el.dsDuplicateRows.textContent = toNumber(quality.duplicate_rows ?? profile.duplicate_rows)
    .toLocaleString("id-ID");
  el.dsNumericColumns.textContent = Array.isArray(profile.numeric_columns)
    ? profile.numeric_columns.length.toLocaleString("id-ID")
    : "-";

  renderScienceIssues(quality.issues || [], payload.recommendations || []);
  renderScienceColumns(profile.columns || []);
  renderScienceCharts(charts);
}

function renderScienceEmpty(reason) {
  state.analysis = null;
  el.scienceSource.textContent = reason;
  el.dsQualityScore.textContent = "-";
  el.dsMissingCells.textContent = "-";
  el.dsDuplicateRows.textContent = "-";
  el.dsNumericColumns.textContent = "-";
  el.scienceIssuesList.innerHTML = `<li>${escapeHtml(reason)}</li>`;
  el.scienceColumnsBody.innerHTML = `
    <tr>
      <td colspan="5" class="empty">Belum ada profil data.</td>
    </tr>
  `;
  renderScienceCharts({});
}

function renderScienceIssues(issues, recommendations) {
  const items = issues.length
    ? issues.map((issue) => `${issue.severity || "info"}: ${issue.message}`)
    : recommendations;

  el.scienceIssuesList.innerHTML = (items.length ? items : ["Data siap diproses."])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function renderScienceColumns(columns) {
  if (!columns.length) {
    el.scienceColumnsBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty">Belum ada profil data.</td>
      </tr>
    `;
    return;
  }

  el.scienceColumnsBody.innerHTML = columns
    .map((column) => {
      const missing = `${toNumber(column.missing_count).toLocaleString("id-ID")} (${toNumber(column.missing_pct)}%)`;
      return `
        <tr>
          <td class="mono">${escapeHtml(column.name)}</td>
          <td><span class="badge badge-${safeToken(column.data_type)}">${escapeHtml(column.data_type)}</span></td>
          <td>${escapeHtml(missing)}</td>
          <td>${toNumber(column.unique_count).toLocaleString("id-ID")}</td>
          <td>${escapeHtml(formatColumnSummary(column))}</td>
        </tr>
      `;
    })
    .join("");
}

function formatColumnSummary(column) {
  if (column.numeric) {
    return `min ${column.numeric.min}, mean ${column.numeric.mean}, max ${column.numeric.max}`;
  }

  const topValues = Array.isArray(column.top_values)
    ? column.top_values.map((item) => `${item.value} (${item.count})`).join(", ")
    : "";
  return topValues || "-";
}

function renderScienceCharts(charts) {
  const statusChart = chartOrFallback(
    charts.status_distribution,
    "Belum ada status",
  );
  const categoryChart = chartOrFallback(
    charts.category_distribution,
    "Belum ada kategori",
  );
  const missingChart = chartOrFallback(
    charts.missing_by_column,
    "Tidak ada missing",
  );
  const histogram = Array.isArray(charts.numeric_histograms)
    ? charts.numeric_histograms[0]
    : null;
  const numericChart = chartOrFallback(histogram, "Tidak ada numeric");

  replaceScienceChart("status", el.scienceStatusChart, {
    type: "bar",
    data: {
      labels: statusChart.labels.length ? statusChart.labels : categoryChart.labels,
      datasets: [
        {
          label: "Jumlah",
          data: statusChart.data.length ? statusChart.data : categoryChart.data,
          backgroundColor: "#2563eb",
          borderRadius: 6,
        },
      ],
    },
    options: scienceChartOptions(),
  });

  replaceScienceChart("missing", el.scienceMissingChart, {
    type: "bar",
    data: {
      labels: missingChart.labels,
      datasets: [
        {
          label: "Kosong",
          data: missingChart.data,
          backgroundColor: "#d97706",
          borderRadius: 6,
        },
      ],
    },
    options: scienceChartOptions(),
  });

  replaceScienceChart("numeric", el.scienceNumericChart, {
    type: "line",
    data: {
      labels: numericChart.labels,
      datasets: [
        {
          label: histogram?.column || "Distribusi",
          data: numericChart.data,
          borderColor: "#0f766e",
          backgroundColor: "rgba(15, 118, 110, 0.14)",
          fill: true,
          tension: 0.32,
        },
      ],
    },
    options: scienceChartOptions(),
  });
}

function chartOrFallback(chart, fallbackLabel) {
  if (chart && Array.isArray(chart.labels) && chart.labels.length) {
    return chart;
  }
  return { labels: [fallbackLabel], data: [0] };
}

function replaceScienceChart(key, canvas, config) {
  if (!canvas || !window.Chart) return;
  if (state.scienceCharts[key]) {
    state.scienceCharts[key].destroy();
  }
  state.scienceCharts[key] = new Chart(canvas.getContext("2d"), config);
}

function scienceChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: "#64748b", maxRotation: 0, autoSkip: true },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#64748b", precision: 0 },
        grid: { color: "rgba(100, 116, 139, 0.18)" },
      },
    },
  };
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
  state.analysis = null;
  state.selectedFileAnalysis = null;
  el.fileInfo.textContent = `${file.name} (${formatBytes(file.size)})`;
  updateUploadButton();
  renderScienceEmpty("File dipilih, klik Analisis Data");
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

async function analyzeFile() {
  if (!state.selectedFile) return;

  try {
    if (!state.apiOnline) {
      throw new Error("Backend proxy belum aktif");
    }
    setBusy(true);
    el.btnUpload.textContent = "Menganalisis...";
    addLog("info", `Menganalisis kualitas ${state.selectedFile.name}.`);

    const formData = new FormData();
    formData.append("file", state.selectedFile, state.selectedFile.name);

    const payload = await apiPostForm("analyze", formData);
    state.selectedFileAnalysis = payload;
    renderScienceAnalysis(payload);
    updateUploadButton();

    const issueCount = toNumber(payload.quality?.issue_count);
    if (payload.quality?.dirty) {
      showToast(`${issueCount} issue data ditemukan. Pilih Bersihkan & Proses.`, "warn");
      addLog("warn", `Analisis selesai: ${issueCount} issue data ditemukan.`);
    } else {
      showToast("Data terlihat bersih dan siap diproses.", "success");
      addLog("success", "Analisis selesai: data siap diproses.");
    }
  } catch (error) {
    showToast(`Gagal analisis: ${error.message}`, "error");
    addLog("error", `Analisis gagal: ${error.message}`);
  } finally {
    setBusy(false);
    updateUploadButton();
  }
}

async function uploadFile(cleanData = false) {
  if (!state.selectedFile) return;

  try {
    if (!state.apiOnline) {
      throw new Error("Backend proxy belum aktif");
    }
    setBusy(true);
    el.btnUpload.textContent = "Memproses...";
    el.btnCleanUpload.textContent = cleanData ? "Membersihkan..." : "Bersihkan & Proses";
    addLog(
      "info",
      cleanData
        ? `Membersihkan dan mengupload ${state.selectedFile.name}.`
        : `Mengupload ${state.selectedFile.name} tanpa cleaning otomatis.`,
    );

    const formData = new FormData();
    formData.append("file", state.selectedFile, state.selectedFile.name);

    const payload = await apiPostForm("upload", formData, {
      params: cleanData ? { clean: "true" } : {},
    });
    renderScienceAnalysis(payload);
    showToast(payload.message || "Data berhasil diproses.", "success");
    addLog("success", payload.message || "Data berhasil disimpan ke Cosmos DB.");
    resetSelectedFile({ keepAnalysis: true });
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
  const hasFile = Boolean(state.selectedFile);
  const hasAnalysis = Boolean(state.selectedFileAnalysis);

  if (!state.apiOnline) {
    el.btnUpload.disabled = true;
    el.btnUpload.textContent = "Backend Belum Aktif";
    el.btnRawUpload.disabled = true;
    el.btnCleanUpload.disabled = true;
    return;
  }

  el.btnUpload.disabled = state.isBusy || !hasFile;
  el.btnRawUpload.disabled = state.isBusy || !hasFile;
  el.btnCleanUpload.disabled = state.isBusy || !hasFile || !hasAnalysis;
  el.btnUpload.textContent = state.isBusy ? "Memproses..." : "Analisis Data";
  el.btnRawUpload.textContent = "Proses Apa Adanya";
  el.btnCleanUpload.textContent = hasAnalysis && state.selectedFileAnalysis?.quality?.dirty
    ? "Bersihkan & Proses"
    : "Proses Data Bersih";
}

function resetSelectedFile(options = {}) {
  state.selectedFile = null;
  state.selectedFileAnalysis = null;
  if (!options.keepAnalysis) {
    state.analysis = null;
  }
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

function renderEmptyStats() {
  renderStats({
    total_records: 0,
    processed: 0,
    anomaly: 0,
    errors: 0,
  });
  el.chartUpdated.textContent = "-";
}

function loadPreviewStats() {
  const stats = {
    total_records: 142,
    processed: 128,
    anomaly: 9,
    errors: 5,
  };
  renderStats(stats);
  el.chartUpdated.textContent = "Preview";
}

function getPreviewData() {
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

function getPreviewUsers() {
  const now = new Date().toISOString();
  return [
    {
      id: "preview-admin",
      name: "Preview Admin",
      email: "admin@kelompok11cc.my.id",
      role: "admin",
      created_at: now,
      last_login_at: now,
    },
    {
      id: "preview-dev",
      name: "Preview Developer",
      email: "dev@kelompok11cc.my.id",
      role: "dev",
      created_at: now,
      last_login_at: now,
    },
    {
      id: "preview-user",
      name: "Preview User",
      email: "user@kelompok11cc.my.id",
      role: "user",
      created_at: now,
      last_login_at: now,
    },
    {
      id: "preview-operator",
      name: "Operator Data",
      email: "operator@kelompok11cc.my.id",
      role: "user",
      created_at: now,
      last_login_at: "",
    },
  ];
}

function getPreviewAdminSummary() {
  const users = getPreviewUsers();
  const telemetry = getPreviewData();
  const countStatus = (status) => telemetry.filter((item) => item.status === status).length;
  return {
    users: {
      total: users.length,
      admin: users.filter((item) => item.role === "admin").length,
      dev: users.filter((item) => item.role === "dev").length,
      regular: users.filter((item) => item.role === "user").length,
      recent_login: users.filter((item) => item.last_login_at).length,
    },
    telemetry: {
      total: telemetry.length,
      processed: countStatus("processed"),
      anomaly: countStatus("anomaly"),
      error: countStatus("error"),
    },
    controls: {
      public_register_role: "user",
      admin_role_protected: true,
      user_data_scoped: true,
      management_route: "/api/management",
    },
  };
}

function nextRoleFor(role) {
  if (role === "user") return "dev";
  if (role === "dev") return "admin";
  return "user";
}

function getPreviewOpsSummary() {
  const today = new Date();
  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      date: date.toISOString().slice(0, 10),
      requests: 420 + index * 64,
      page_views: 180 + index * 31,
      unique_visitors: 72 + index * 9,
      bandwidth_bytes: 14_000_000 + index * 1_700_000,
      cached_bytes: 9_500_000 + index * 1_200_000,
      threats: index === 5 ? 2 : 0,
    };
  });

  return {
    success: true,
    generated_at: today.toISOString(),
    cloudflare: {
      configured: true,
      status: "ready",
      message: "Preview Cloudflare Analytics",
      totals: {
        requests: daily.reduce((sum, item) => sum + item.requests, 0),
        page_views: daily.reduce((sum, item) => sum + item.page_views, 0),
        unique_visitors: daily.reduce((sum, item) => sum + item.unique_visitors, 0),
        bandwidth_bytes: daily.reduce((sum, item) => sum + item.bandwidth_bytes, 0),
        cached_bytes: daily.reduce((sum, item) => sum + item.cached_bytes, 0),
        cache_ratio: 68.5,
        threats: 2,
      },
      daily,
    },
    azure: {
      configured: true,
      status: "ready",
      message: "Preview Azure Monitor",
      totals: {
        function_requests: 1280,
        function_5xx: 3,
        function_avg_response_time: 0.42,
        function_request_rate_per_minute: 0.89,
        function_error_rate: 0.23,
        cpu_usage_percent: 37.4,
        cpu_time_seconds: 82,
        memory_working_set_bytes: 284_000_000,
        available_memory_bytes: 1_240_000_000,
        storage_transactions: 842,
        cosmos_requests: 1550,
        cosmos_availability: 99.99,
      },
      resources: [
        {
          key: "function",
          label: "Azure Functions",
          status: "ready",
          metrics: {
            Requests: {
              points: daily.map((item) => ({
                time: `${item.date}T00:00:00Z`,
                value: item.requests,
              })),
            },
            Http5xx: {
              points: daily.map((item, index) => ({
                time: `${item.date}T00:00:00Z`,
                value: index === 5 ? 2 : index === 6 ? 1 : 0,
              })),
            },
          },
        },
      ],
    },
  };
}

function buildPreviewScienceAnalysis() {
  const records = getPreviewData();
  const columns = ["id", "processed_at", "deviceId", "category", "status", "summary", "source_file"];

  return {
    source_file: "preview-data",
    profile: {
      record_count: records.length,
      column_count: columns.length,
      missing_cells: 0,
      duplicate_rows: 0,
      numeric_columns: [],
      categorical_columns: columns,
      columns: columns.map((column) => ({
        name: column,
        data_type: column === "processed_at" ? "datetime" : "text",
        missing_count: 0,
        missing_pct: 0,
        unique_count: new Set(records.map((record) => record[column])).size,
        top_values: topValues(records.map((record) => record[column])),
      })),
    },
    quality: {
      score: 100,
      dirty: false,
      issue_count: 0,
      missing_cells: 0,
      duplicate_rows: 0,
      issues: [],
    },
    charts: {
      status_distribution: countChart(records, "status"),
      category_distribution: countChart(records, "category"),
      missing_by_column: { labels: [], data: [] },
      numeric_histograms: [],
      top_values: [],
    },
    recommendations: ["Preview lokal siap diproses."],
  };
}

function countChart(records, field) {
  const counts = records.reduce((acc, record) => {
    const key = record[field] || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    labels: Object.keys(counts),
    data: Object.values(counts),
  };
}

function topValues(values) {
  const counts = values.reduce((acc, value) => {
    const key = value === undefined || value === null ? "null" : String(value);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([value, count]) => ({ value, count }));
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

function formatCpu(totals = {}) {
  const cpuPercent = toNumber(totals.cpu_usage_percent);
  if (cpuPercent > 0) return `${cpuPercent.toFixed(1)}%`;
  const cpuTime = toNumber(totals.cpu_time_seconds);
  return cpuTime > 0 ? `${cpuTime.toFixed(0)} s` : "-";
}

function formatMemory(totals = {}) {
  const workingSet = toNumber(totals.memory_working_set_bytes);
  if (workingSet > 0) return formatBytes(workingSet);
  const available = toNumber(totals.available_memory_bytes);
  return available > 0 ? formatBytes(available) : "-";
}

function formatCompact(value) {
  return toNumber(value).toLocaleString("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

function formatRate(value) {
  return toNumber(value).toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  });
}

function formatPercent(value) {
  return `${toNumber(value).toFixed(1)}%`;
}

function formatSeconds(value) {
  const seconds = toNumber(value);
  if (seconds <= 0) return "-";
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  return `${seconds.toFixed(2)} s`;
}

function statusLabel(payload = {}) {
  if (payload.status === "ready") return "Ready";
  if (payload.status === "error") return "Error";
  if (payload.status === "missing_config") return "Belum konfigurasi";
  return payload.configured ? "Ready" : "Belum konfigurasi";
}

function getAzureResourceMetrics(azure = {}, key) {
  const resource = Array.isArray(azure.resources)
    ? azure.resources.find((item) => item.key === key)
    : null;
  return resource?.metrics || {};
}

function metricPoints(metric = {}) {
  return Array.isArray(metric.points) ? metric.points : [];
}

function formatPointTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
