const REPORTS_KEY = "report_builder_lite_reports_v2";
const ACTIVE_REPORT_KEY = "report_builder_lite_active_id_v2";
const monthLabels = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
let callsChart;
let q1Chart;
let autosaveTimer;

const $ = (id) => document.getElementById(id);
const n = (value, max = Number.POSITIVE_INFINITY) => Math.min(max, Math.max(0, Number(value) || 0));
const f = (value) => Number(value || 0).toLocaleString("ar-SA");
const today = () => new Date().toLocaleDateString("ar-SA");

const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

function safeJsonParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function updateLogoUI(report) {
  const hasLogo = Boolean(report.logoDataUrl);
  const headerLogo = $("headerLogo");
  const reportHeader = document.querySelector(".report-header");
  if (hasLogo) {
    headerLogo.src = report.logoDataUrl;
    headerLogo.hidden = false;
    reportHeader.classList.remove("no-logo");
    $("logoStatus").textContent = "تم تحميل شعار لهذا التقرير";
  } else {
    headerLogo.removeAttribute("src");
    headerLogo.hidden = true;
    reportHeader.classList.add("no-logo");
    $("logoStatus").textContent = "لا يوجد شعار مرفوع لهذا التقرير";
  }
}

function setActiveReportLogo(logoDataUrl) {
  const reports = getReports();
  const idx = reports.findIndex((r) => r.id === getActiveId());
  if (idx < 0) return;
  reports[idx].logoDataUrl = logoDataUrl;
  reports[idx].updatedAt = new Date().toISOString();
  saveReports(reports);
  renderReportList();
  updateReportPreview();
  $("autosaveStatus").textContent = "تم حفظ الشعار";
}

function handleLogoUpload(file) {
  if (!file) return;
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    alert("حجم الشعار كبير جدًا. الحد الأقصى هو 2 ميجابايت.");
    return;
  }

  const fileType = file.type.toLowerCase();
  const fileExt = file.name.split(".").pop()?.toLowerCase();
  const validExt = ["png", "jpg", "jpeg", "svg", "webp"].includes(fileExt || "");
  if (!ALLOWED_LOGO_TYPES.has(fileType) && !validExt) {
    alert("صيغة الشعار غير مدعومة. يرجى استخدام PNG أو JPG أو SVG أو WEBP.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") setActiveReportLogo(reader.result);
  };
  reader.onerror = () => {
    alert("تعذر قراءة ملف الشعار. حاول مرة أخرى.");
  };
  reader.readAsDataURL(file);
}

function createReport(seedName = "تقرير جديد") {
  const now = new Date().toISOString();
  return {
    id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`),
    name: seedName,
    createdAt: now,
    updatedAt: now,
    general: { title: "تقرير تنفيذي داخلي", subtitle: "ملخص أداء مركز الاتصال", establishedDate: "", scope: "" },
    calls2025: new Array(12).fill(0),
    q1_2026: { jan: 0, feb: 0, mar: 0 },
    kpis: { answerRate2026: 0, averageResponseSpeed: 0 },
    theme: "sdaia",
    logoDataUrl: ""
  };
}

function getReports() {
  const parsed = safeJsonParse(localStorage.getItem(REPORTS_KEY) || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
}
function saveReports(reports) { localStorage.setItem(REPORTS_KEY, JSON.stringify(reports)); }
function getActiveId() { return localStorage.getItem(ACTIVE_REPORT_KEY); }
function setActiveId(id) { localStorage.setItem(ACTIVE_REPORT_KEY, id); }

function ensureInit() {
  let reports = getReports();
  if (!reports.length) {
    reports = [createReport("التقرير الافتراضي")];
    saveReports(reports);
    setActiveId(reports[0].id);
  }
  if (!reports.some((r) => r.id === getActiveId())) setActiveId(reports[0].id);
}

function activeReport() {
  const reports = getReports();
  return reports.find((r) => r.id === getActiveId()) || reports[0];
}

function buildMonths2025() {
  const wrap = $("months2025");
  monthLabels.forEach((m, i) => {
    const div = document.createElement("div");
    div.className = "month-input";
    div.innerHTML = `<label for="m2025_${i}">${m} 2025</label><input id="m2025_${i}" type="number" min="0" />`;
    wrap.appendChild(div);
  });
}

function renderReportList() {
  const wrap = $("reportList");
  wrap.innerHTML = "";
  const aid = getActiveId();
  getReports().forEach((report) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = report.id === aid ? "active" : "";
    btn.textContent = `${report.name} (${new Date(report.updatedAt).toLocaleDateString("ar-SA")})`;
    btn.onclick = () => { setActiveId(report.id); hydrateForm(); renderReportList(); updateReportPreview(); };
    wrap.appendChild(btn);
  });
}

function hydrateForm() {
  const r = activeReport();
  $("reportName").value = r.name;
  $("title").value = r.general.title;
  $("subtitle").value = r.general.subtitle;
  $("establishedDate").value = r.general.establishedDate;
  $("scope").value = r.general.scope;
  $("themeSelect").value = r.theme;
  r.calls2025.forEach((v, i) => { $(`m2025_${i}`).value = v || ""; });
  $("q1Jan").value = r.q1_2026.jan || "";
  $("q1Feb").value = r.q1_2026.feb || "";
  $("q1Mar").value = r.q1_2026.mar || "";
  $("answerRate2026").value = r.kpis.answerRate2026 || "";
  $("averageResponseSpeed").value = r.kpis.averageResponseSpeed || "";
}

function readFormIntoReport(report) {
  report.name = $("reportName").value.trim() || "تقرير بدون اسم";
  report.general.title = $("title").value.trim() || "تقرير تنفيذي داخلي";
  report.general.subtitle = $("subtitle").value.trim() || "ملخص أداء مركز الاتصال";
  report.general.establishedDate = $("establishedDate").value;
  report.general.scope = $("scope").value.trim();
  report.theme = $("themeSelect").value;
  report.calls2025 = monthLabels.map((_, i) => n($(`m2025_${i}`).value));
  report.q1_2026.jan = n($("q1Jan").value);
  report.q1_2026.feb = n($("q1Feb").value);
  report.q1_2026.mar = n($("q1Mar").value);
  report.kpis.answerRate2026 = n($("answerRate2026").value, 100);
  report.kpis.averageResponseSpeed = n($("averageResponseSpeed").value);
  report.updatedAt = new Date().toISOString();
}

function saveActiveReport(statusText = "تم الحفظ تلقائيًا") {
  const reports = getReports();
  const idx = reports.findIndex((r) => r.id === getActiveId());
  if (idx < 0) return;
  readFormIntoReport(reports[idx]);
  saveReports(reports);
  $("autosaveStatus").textContent = statusText;
  renderReportList();
}

function scheduleAutosave() {
  $("autosaveStatus").textContent = "جاري الحفظ...";
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    saveActiveReport("تم الحفظ تلقائيًا");
    updateReportPreview();
  }, 400);
}

function makeExecutiveSummary(data) {
  const q1 = [data.q1_2026.jan, data.q1_2026.feb, data.q1_2026.mar];
  const q1Total = q1.reduce((a, b) => a + b, 0);
  const q1Avg = q1Total / 3;
  const avg2025 = data.calls2025.reduce((a, b) => a + b, 0) / 12;
  const diff = avg2025 ? ((q1Avg - avg2025) / avg2025) * 100 : 0;
  const maxIdx = q1.indexOf(Math.max(...q1));
  const trend = diff >= 0 ? `بارتفاع قدره ${diff.toFixed(1)}٪` : `بانخفاض قدره ${Math.abs(diff).toFixed(1)}٪`;
  return `يعرض التقرير أن إجمالي مكالمات الربع الأول لعام 2026 بلغ ${f(q1Total)} مكالمة، بمتوسط شهري ${f(Math.round(q1Avg))} مكالمة. وبالمقارنة مع متوسط عام 2025 الشهري البالغ ${f(Math.round(avg2025))} مكالمة، يظهر الأداء ${trend}. وقد سجّل شهر ${monthLabels[maxIdx]} أعلى حجم ضمن الربع الأول. كما بلغ معدل الإجابة ${data.kpis.answerRate2026.toFixed(2)}٪، فيما وصل متوسط سرعة الرد إلى ${f(data.kpis.averageResponseSpeed)} ثانية.`;
}

function canRenderCharts() {
  return typeof window.Chart === "function";
}

function updateCharts(report) {
  if (!canRenderCharts()) return;

  const calls = report.calls2025;
  const q1 = [report.q1_2026.jan, report.q1_2026.feb, report.q1_2026.mar];
  const styles = getComputedStyle(document.body);
  const c1 = styles.getPropertyValue("--chart-1").trim();
  const c2 = styles.getPropertyValue("--chart-2").trim();
  const c3 = styles.getPropertyValue("--chart-3").trim();

  if (!callsChart) {
    callsChart = new Chart($("callsChart"), { type: "bar", data: { labels: monthLabels, datasets: [{ data: calls, backgroundColor: c1, borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
  } else {
    callsChart.data.datasets[0].data = calls;
    callsChart.data.datasets[0].backgroundColor = c1;
    callsChart.update();
  }

  if (!q1Chart) {
    q1Chart = new Chart($("q1Chart"), { type: "doughnut", data: { labels: monthLabels.slice(0, 3), datasets: [{ data: q1, backgroundColor: [c1, c2, c3] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } } });
  } else {
    q1Chart.data.datasets[0].data = q1;
    q1Chart.data.datasets[0].backgroundColor = [c1, c2, c3];
    q1Chart.update();
  }
}

function updateReportPreview() {
  const r = activeReport();
  if (!r) return;
  document.body.dataset.theme = r.theme;
  const q1 = [r.q1_2026.jan, r.q1_2026.feb, r.q1_2026.mar];
  const total25 = r.calls2025.reduce((a, b) => a + b, 0);
  const avg25 = total25 / 12;
  const totalQ1 = q1.reduce((a, b) => a + b, 0);
  const avgQ1 = totalQ1 / 3;

  $("rTitle").textContent = r.general.title;
  $("rSubtitle").textContent = r.general.subtitle;
  $("rScope").textContent = `نطاق التقرير: ${r.general.scope || "—"}`;
  $("rEstablished").textContent = `تاريخ التأسيس: ${r.general.establishedDate || "—"}`;
  $("rUpdatedAt").textContent = `آخر تحديث: ${new Date(r.updatedAt).toLocaleString("ar-SA")}`;
  $("total2025").textContent = f(total25);
  $("avg2025").textContent = f(Math.round(avg25));
  $("q12026").textContent = f(totalQ1);
  $("avgQ1").textContent = f(Math.round(avgQ1));
  $("rate2026").textContent = `${r.kpis.answerRate2026.toFixed(2)}%`;
  $("speed2026").textContent = `${f(r.kpis.averageResponseSpeed)} ث`;
  $("execSummary").textContent = makeExecutiveSummary(r);
  $("reportNameFooter").textContent = r.name;
  $("today").textContent = `تاريخ العرض: ${today()}`;
  updateLogoUI(r);
  updateCharts(r);
}

function newReport() {
  const reports = getReports();
  const report = createReport(`تقرير ${reports.length + 1}`);
  reports.push(report);
  saveReports(reports);
  setActiveId(report.id);
  hydrateForm();
  renderReportList();
  updateReportPreview();
}

function duplicateReport() {
  const source = activeReport();
  const canUseStructuredClone = typeof structuredClone === "function";
  const copy = canUseStructuredClone ? structuredClone(source) : JSON.parse(JSON.stringify(source));
  copy.id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  copy.name = `${source.name} (نسخة)`;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = copy.createdAt;
  const reports = getReports();
  reports.push(copy);
  saveReports(reports);
  setActiveId(copy.id);
  hydrateForm(); renderReportList(); updateReportPreview();
}

function deleteReport() {
  const reports = getReports();
  if (reports.length === 1) {
    alert("لا يمكن حذف آخر تقرير. يمكنك استخدام إعادة الضبط.");
    return;
  }
  const current = activeReport();
  if (!confirm(`هل تريد حذف التقرير: ${current.name}؟`)) return;
  const filtered = reports.filter((r) => r.id !== current.id);
  saveReports(filtered);
  setActiveId(filtered[0].id);
  hydrateForm(); renderReportList(); updateReportPreview();
}

function resetCurrent() {
  if (!confirm("سيتم مسح بيانات التقرير الحالي وإعادته للوضع الافتراضي. متابعة؟")) return;
  const reports = getReports();
  const idx = reports.findIndex((r) => r.id === getActiveId());
  const old = reports[idx];
  reports[idx] = createReport(old.name);
  reports[idx].id = old.id;
  reports[idx].createdAt = old.createdAt;
  saveReports(reports);
  hydrateForm(); renderReportList(); updateReportPreview();
}

function resizeChartsForLayout() {
  if (callsChart) callsChart.resize();
  if (q1Chart) q1Chart.resize();
}

function beforePrintHandler() {
  saveActiveReport("تم الحفظ تلقائيًا");
  updateReportPreview();
  document.body.classList.add("print-mode");
  resizeChartsForLayout();
}

function afterPrintHandler() {
  document.body.classList.remove("print-mode");
  resizeChartsForLayout();
}

function init() {
  buildMonths2025();
  ensureInit();
  hydrateForm();
  renderReportList();
  updateReportPreview();

  if (!canRenderCharts()) {
    $("autosaveStatus").textContent = "تنبيه: تعذر تحميل مكتبة الرسوم البيانية، سيتم عرض التقرير بدون مخططات.";
  }

  const inputs = document.querySelectorAll("input, select");
  inputs.forEach((el) => el.addEventListener("input", scheduleAutosave));
  $("newReportBtn").onclick = newReport;
  $("saveReportBtn").onclick = () => { saveActiveReport("تم الحفظ تلقائيًا"); updateReportPreview(); };
  $("duplicateReportBtn").onclick = duplicateReport;
  $("deleteReportBtn").onclick = deleteReport;
  $("resetCurrentBtn").onclick = resetCurrent;
  $("savePdfBtn").onclick = () => {
    beforePrintHandler();
    window.print();
  };
  $("uploadLogoBtn").onclick = () => $("logoUploadInput").click();
  $("logoUploadInput").onchange = (event) => {
    handleLogoUpload(event.target.files?.[0]);
    event.target.value = "";
  };
  $("removeLogoBtn").onclick = () => setActiveReportLogo("");
}

window.addEventListener("beforeprint", beforePrintHandler);
window.addEventListener("afterprint", afterPrintHandler);

document.addEventListener("DOMContentLoaded", init);
