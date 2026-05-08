const REPORTS_KEY = "report_builder_reports_v3";
const ACTIVE_REPORT_KEY = "report_builder_active_id_v3";
const monthLabels = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
let callsChart;
let q1Chart;
let autosaveTimer;

const $ = (id) => document.getElementById(id);
const n = (value, max = Number.POSITIVE_INFINITY) => Math.min(max, Math.max(0, Number(value) || 0));
const f = (value) => Number(value || 0).toLocaleString("ar-SA");
const today = () => new Date().toLocaleDateString("ar-SA");
const dash = (value) => (value === null || value === undefined || Number.isNaN(value) ? "—" : value);
const safeJsonParse = (raw, fallback) => { try { return JSON.parse(raw) ?? fallback; } catch { return fallback; } };

const demoData = {
  name: "تقرير الأداء التشغيلي - نسخة تجريبية",
  general: { title: "تقرير تنفيذي داخلي", subtitle: "متابعة الأداء التشغيلي لمركز الاتصال", establishedDate: "2024-03-01", scope: "قطاع الخدمات المشتركة - الربع الأول" },
  calls2025: [16200, 17130, 16880, 17640, 18420, 18960, 19310, 18850, 18140, 18620, 19400, 20110],
  q1_2026: { jan: 20680, feb: 21310, mar: 22570 },
  kpis: { answerRate2026: 96.2, averageResponseSpeed: 14.7 }
};

const storage = {
  getReports() {
    const parsed = safeJsonParse(localStorage.getItem(REPORTS_KEY) || "[]", []);
    return Array.isArray(parsed) ? parsed : [];
  },
  saveReports(reports) { localStorage.setItem(REPORTS_KEY, JSON.stringify(reports)); },
  getActiveId() { return localStorage.getItem(ACTIVE_REPORT_KEY); },
  setActiveId(id) { localStorage.setItem(ACTIVE_REPORT_KEY, id); }
};

function createReport(seedName = "تقرير جديد") {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`, name: seedName, createdAt: now, updatedAt: now,
    general: { title: "تقرير تنفيذي داخلي", subtitle: "ملخص أداء مركز الاتصال", establishedDate: "", scope: "" },
    calls2025: new Array(12).fill(0), q1_2026: { jan: 0, feb: 0, mar: 0 }, kpis: { answerRate2026: 0, averageResponseSpeed: 0 }, theme: "sdaia", logoDataUrl: "" };
}
function ensureInit() {
  let reports = storage.getReports();
  if (!reports.length) { reports = [createReport("التقرير الافتراضي")]; Object.assign(reports[0], demoData); storage.saveReports(reports); storage.setActiveId(reports[0].id); }
  if (!reports.some((r) => r.id === storage.getActiveId())) storage.setActiveId(reports[0].id);
}
const activeReport = () => storage.getReports().find((r) => r.id === storage.getActiveId()) || storage.getReports()[0];

function buildMonths2025() {
  const wrap = $("months2025");
  monthLabels.forEach((m, i) => {
    const div = document.createElement("div");
    div.className = "month-input";
    div.innerHTML = `<label for="m2025_${i}">${m} 2025</label><input id="m2025_${i}" type="number" min="0" />`;
    wrap.appendChild(div);
  });
}
function hydrateForm() {
  const r = activeReport();
  $("reportName").value = r.name; $("title").value = r.general.title; $("subtitle").value = r.general.subtitle;
  $("establishedDate").value = r.general.establishedDate; $("scope").value = r.general.scope; $("themeSelect").value = r.theme;
  r.calls2025.forEach((v, i) => { $(`m2025_${i}`).value = v || ""; });
  $("q1Jan").value = r.q1_2026.jan || ""; $("q1Feb").value = r.q1_2026.feb || ""; $("q1Mar").value = r.q1_2026.mar || "";
  $("answerRate2026").value = r.kpis.answerRate2026 || ""; $("averageResponseSpeed").value = r.kpis.averageResponseSpeed || "";
}
function readFormIntoReport(report) {
  report.name = $("reportName").value.trim() || "تقرير بدون اسم";
  report.general.title = $("title").value.trim() || "تقرير تنفيذي داخلي";
  report.general.subtitle = $("subtitle").value.trim() || "ملخص أداء مركز الاتصال";
  report.general.establishedDate = $("establishedDate").value; report.general.scope = $("scope").value.trim(); report.theme = $("themeSelect").value;
  report.calls2025 = monthLabels.map((_, i) => n($(`m2025_${i}`).value));
  report.q1_2026 = { jan: n($("q1Jan").value), feb: n($("q1Feb").value), mar: n($("q1Mar").value) };
  report.kpis = { answerRate2026: n($("answerRate2026").value, 100), averageResponseSpeed: n($("averageResponseSpeed").value) };
  report.updatedAt = new Date().toISOString();
}
function saveActiveReport(statusText = "تم الحفظ تلقائيًا") {
  const reports = storage.getReports(); const idx = reports.findIndex((r) => r.id === storage.getActiveId()); if (idx < 0) return;
  readFormIntoReport(reports[idx]); storage.saveReports(reports); $("autosaveStatus").textContent = statusText; renderReportList();
}
function renderReportList() {
  const wrap = $("reportList"); wrap.innerHTML = ""; const aid = storage.getActiveId();
  storage.getReports().forEach((report) => {
    const btn = document.createElement("button"); btn.type = "button"; btn.className = report.id === aid ? "active" : "";
    btn.textContent = `${report.name} (${new Date(report.updatedAt).toLocaleDateString("ar-SA")})`;
    btn.onclick = () => { storage.setActiveId(report.id); hydrateForm(); renderReportList(); updateReportPreview(); };
    wrap.appendChild(btn);
  });
}

function makeExecutiveSummary(data) {
  const q1 = [data.q1_2026.jan, data.q1_2026.feb, data.q1_2026.mar]; const q1Total = q1.reduce((a, b) => a + b, 0); const q1Avg = q1Total / 3;
  const total25 = data.calls2025.reduce((a, b) => a + b, 0); const avg2025 = total25 / 12; const diff = avg2025 ? ((q1Avg - avg2025) / avg2025) * 100 : 0;
  const bestMonthIndex = q1.indexOf(Math.max(...q1));
  const trendText = diff >= 0 ? `بمعدل نمو يقدر بنحو ${Math.abs(diff).toFixed(1)}٪` : `بتراجع محدود يقدر بنحو ${Math.abs(diff).toFixed(1)}٪`;
  return `يعكس هذا التقرير أداءً تشغيليًا مستقرًا خلال الربع الأول من عام 2026، حيث بلغ إجمالي المكالمات الواردة ${f(q1Total)} مكالمة، بمتوسط شهري قدره ${f(Math.round(q1Avg))} مكالمة. وبالمقارنة مع متوسط عام 2025 الشهري البالغ ${f(Math.round(avg2025))} مكالمة، تشير النتائج إلى ${trendText}. وقد تصدّر شهر ${monthLabels[bestMonthIndex]} حجم الطلب ضمن الربع محل القياس. كما سُجّل معدل إجابة عند ${data.kpis.answerRate2026.toFixed(1)}٪، في حين بلغ متوسط سرعة الرد ${f(data.kpis.averageResponseSpeed)} ثانية، بما يدعم جاهزية التشغيل واستمرارية جودة الخدمة.`;
}

function updateLogoUI(report) {
  const hasLogo = Boolean(report.logoDataUrl); const logo = $("headerLogo"); const header = document.querySelector(".report-header");
  if (hasLogo) { logo.src = report.logoDataUrl; logo.hidden = false; header.classList.remove("no-logo"); $("logoStatus").textContent = "تم تحميل شعار لهذا التقرير"; }
  else { logo.removeAttribute("src"); logo.hidden = true; header.classList.add("no-logo"); $("logoStatus").textContent = "لا يوجد شعار مرفوع لهذا التقرير"; }
}

function chartOptions(themeColor) {
  return { color: themeColor, font: { family: "Markazi Text", size: 17, weight: "600" } };
}
function updateCharts(report) {
  if (typeof window.Chart !== "function") return;
  const styles = getComputedStyle(document.body);
  const c1 = styles.getPropertyValue("--chart-1").trim(); const c2 = styles.getPropertyValue("--chart-2").trim(); const c3 = styles.getPropertyValue("--chart-3").trim();
  const textColor = styles.getPropertyValue("--text").trim(); const gridColor = styles.getPropertyValue("--border").trim();
  const commonPlugins = { legend: { labels: chartOptions(textColor) } };

  const callsConfig = { type: "bar", data: { labels: monthLabels, datasets: [{ label: "المكالمات", data: report.calls2025, backgroundColor: c1, borderRadius: 6, maxBarThickness: 20 }] },
    options: { responsive: true, maintainAspectRatio: false, layout: { padding: 6 }, plugins: { ...commonPlugins, legend: { display: false } }, scales: { x: { ticks: chartOptions(textColor), grid: { display: false } }, y: { beginAtZero: true, ticks: chartOptions(textColor), grid: { color: gridColor } } } } };
  const q1Config = { type: "doughnut", data: { labels: monthLabels.slice(0, 3), datasets: [{ data: [report.q1_2026.jan, report.q1_2026.feb, report.q1_2026.mar], backgroundColor: [c1, c2, c3], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, layout: { padding: 6 }, plugins: { ...commonPlugins, legend: { position: "bottom", labels: chartOptions(textColor) } } } };
  if (!callsChart) callsChart = new Chart($("callsChart"), callsConfig); else { callsChart.data = callsConfig.data; callsChart.options = callsConfig.options; callsChart.update(); }
  if (!q1Chart) q1Chart = new Chart($("q1Chart"), q1Config); else { q1Chart.data = q1Config.data; q1Chart.options = q1Config.options; q1Chart.update(); }
}

function updateReportPreview() {
  const r = activeReport(); if (!r) return; document.body.dataset.theme = r.theme;
  const q1 = [r.q1_2026.jan, r.q1_2026.feb, r.q1_2026.mar]; const total25 = r.calls2025.reduce((a, b) => a + b, 0); const avg25 = total25 / 12;
  const totalQ1 = q1.reduce((a, b) => a + b, 0); const avgQ1 = totalQ1 / 3;
  $("rTitle").textContent = r.general.title || "—"; $("rSubtitle").textContent = r.general.subtitle || "—";
  $("rScope").textContent = `نطاق التقرير: ${r.general.scope || "—"}`; $("rEstablished").textContent = `تاريخ التأسيس: ${r.general.establishedDate || "—"}`;
  $("rUpdatedAt").textContent = `آخر تحديث: ${new Date(r.updatedAt).toLocaleString("ar-SA")}`;
  $("total2025").textContent = total25 > 0 ? f(total25) : "—"; $("avg2025").textContent = total25 > 0 ? f(Math.round(avg25)) : "—";
  $("q12026").textContent = totalQ1 > 0 ? f(totalQ1) : "—"; $("avgQ1").textContent = totalQ1 > 0 ? f(Math.round(avgQ1)) : "—";
  $("rate2026").textContent = r.kpis.answerRate2026 > 0 ? `${r.kpis.answerRate2026.toFixed(1)}%` : "—";
  $("speed2026").textContent = r.kpis.averageResponseSpeed > 0 ? `${f(r.kpis.averageResponseSpeed)} ث` : "—";
  $("execSummary").textContent = total25 > 0 || totalQ1 > 0 ? makeExecutiveSummary(r) : "لا تتوفر بيانات كافية بعد لإصدار ملخص تنفيذي. يرجى إدخال القيم أو تحميل بيانات تجريبية.";
  $("reportNameFooter").textContent = r.name || "—"; $("today").textContent = `تاريخ العرض: ${today()}`;
  updateLogoUI(r); updateCharts(r);
}

function scheduleAutosave() { $("autosaveStatus").textContent = "جاري الحفظ..."; clearTimeout(autosaveTimer); autosaveTimer = setTimeout(() => { saveActiveReport(); updateReportPreview(); }, 350); }
function applyDemoData() { const reports = storage.getReports(); const idx = reports.findIndex((r) => r.id === storage.getActiveId()); if (idx < 0) return; Object.assign(reports[idx], { ...demoData, updatedAt: new Date().toISOString() }); storage.saveReports(reports); hydrateForm(); renderReportList(); updateReportPreview(); $("autosaveStatus").textContent = "تم تحميل بيانات تجريبية"; }
function setActiveReportLogo(logoDataUrl) { const reports = storage.getReports(); const idx = reports.findIndex((r) => r.id === storage.getActiveId()); if (idx < 0) return; reports[idx].logoDataUrl = logoDataUrl; reports[idx].updatedAt = new Date().toISOString(); storage.saveReports(reports); renderReportList(); updateReportPreview(); }
function handleLogoUpload(file) {
  if (!file) return; if (file.size > MAX_LOGO_SIZE_BYTES) return alert("حجم الشعار كبير جدًا. الحد الأقصى هو 2 ميجابايت.");
  const ext = file.name.split(".").pop()?.toLowerCase(); const okExt = ["png", "jpg", "jpeg", "svg", "webp"].includes(ext || "");
  if (!ALLOWED_LOGO_TYPES.has(file.type.toLowerCase()) && !okExt) return alert("صيغة الشعار غير مدعومة.");
  const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === "string") setActiveReportLogo(reader.result); }; reader.readAsDataURL(file);
}

function init() {
  buildMonths2025(); ensureInit(); hydrateForm(); renderReportList(); updateReportPreview();
  document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", scheduleAutosave));
  $("newReportBtn").onclick = () => { const reports = storage.getReports(); const report = createReport(`تقرير ${reports.length + 1}`); reports.push(report); storage.saveReports(reports); storage.setActiveId(report.id); hydrateForm(); renderReportList(); updateReportPreview(); };
  $("saveReportBtn").onclick = () => { saveActiveReport(); updateReportPreview(); };
  $("duplicateReportBtn").onclick = () => { const source = activeReport(); const copy = JSON.parse(JSON.stringify(source)); copy.id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`; copy.name = `${source.name} (نسخة)`; copy.createdAt = new Date().toISOString(); copy.updatedAt = copy.createdAt; const reports = storage.getReports(); reports.push(copy); storage.saveReports(reports); storage.setActiveId(copy.id); hydrateForm(); renderReportList(); updateReportPreview(); };
  $("deleteReportBtn").onclick = () => { const reports = storage.getReports(); if (reports.length === 1) return alert("لا يمكن حذف آخر تقرير."); const current = activeReport(); if (!confirm(`هل تريد حذف التقرير: ${current.name}؟`)) return; const filtered = reports.filter((r) => r.id !== current.id); storage.saveReports(filtered); storage.setActiveId(filtered[0].id); hydrateForm(); renderReportList(); updateReportPreview(); };
  $("resetCurrentBtn").onclick = () => { const reports = storage.getReports(); const idx = reports.findIndex((r) => r.id === storage.getActiveId()); const old = reports[idx]; reports[idx] = createReport(old.name); reports[idx].id = old.id; reports[idx].createdAt = old.createdAt; storage.saveReports(reports); hydrateForm(); renderReportList(); updateReportPreview(); };
  $("loadDemoBtn").onclick = applyDemoData;
  $("savePdfBtn").onclick = () => { saveActiveReport(); updateReportPreview(); document.body.classList.add("print-mode"); window.print(); };
  $("uploadLogoBtn").onclick = () => $("logoUploadInput").click();
  $("logoUploadInput").onchange = (e) => { handleLogoUpload(e.target.files?.[0]); e.target.value = ""; };
  $("removeLogoBtn").onclick = () => setActiveReportLogo("");
  window.addEventListener("afterprint", () => document.body.classList.remove("print-mode"));
}

document.addEventListener("DOMContentLoaded", init);
