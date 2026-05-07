const defaults2025 = Array.from({ length: 12 }, () => "");
const monthLabels = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const q1Labels = ["يناير", "فبراير", "مارس"];
let callsChart;
let q1Chart;

function clampNumber(value, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ar-SA");
}

function buildMonthInputs() {
  const container = document.getElementById("months2025");
  container.innerHTML = "";
  monthLabels.forEach((label, index) => {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.id = `m2025_${index}`;
    input.value = defaults2025[index];
    input.placeholder = label;
    input.addEventListener("input", updateReport);
    container.appendChild(input);
  });
}

function get2025Values() {
  return monthLabels.map((_, index) => clampNumber(document.getElementById(`m2025_${index}`).value));
}

function getQ1Values() {
  return ["jan2026", "feb2026", "mar2026"].map((id) => clampNumber(document.getElementById(id).value));
}

function calcAverage(values) {
  return values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : 0;
}

function updateReport() {
  const requiredFields = ["title", "subtitle", "established", "scope", "jan2026", "feb2026", "mar2026", "answerRate", "avgSpeed"];
  const hasRequiredData = requiredFields.every((id) => document.getElementById(id).value.toString().trim() !== "")
    && monthLabels.every((_, index) => document.getElementById(`m2025_${index}`).value.toString().trim() !== "");
  document.getElementById("report").classList.toggle("ready", hasRequiredData);
  if (!hasRequiredData) return;

  const values2025 = get2025Values();
  const valuesQ1 = getQ1Values();
  const total25 = values2025.reduce((sum, n) => sum + n, 0);
  const totalQ1 = valuesQ1.reduce((sum, n) => sum + n, 0);
  const avg25 = calcAverage(values2025);
  const avgQ1 = calcAverage(valuesQ1);
  const change = avg25 ? ((avgQ1 - avg25) / avg25) * 100 : 0;
  const topIndex = valuesQ1.indexOf(Math.max(...valuesQ1));
  const answerRate = clampNumber(document.getElementById("answerRate").value, { min: 0, max: 100 });
  const avgSpeed = clampNumber(document.getElementById("avgSpeed").value);

  document.getElementById("rTitle").textContent = document.getElementById("title").value;
  document.getElementById("rSubtitle").textContent = document.getElementById("subtitle").value;
  document.getElementById("rEstablished").textContent = `تأسس مركز الاتصال في ${document.getElementById("established").value}. ${document.getElementById("scope").value}`;
  document.getElementById("total2025").textContent = formatNumber(total25);
  document.getElementById("q12026").textContent = formatNumber(totalQ1);
  document.getElementById("rate2026").textContent = `${answerRate.toFixed(2)}%`;
  document.getElementById("speed2026").textContent = `${formatNumber(avgSpeed)} ث`;
  document.getElementById("avg2025").textContent = formatNumber(Math.round(avg25));
  document.getElementById("avgQ1").textContent = formatNumber(Math.round(avgQ1));
  document.getElementById("growthNote").textContent = change >= 0 ? `ارتفاع ${change.toFixed(1)}%` : `انخفاض ${Math.abs(change).toFixed(1)}%`;
  document.getElementById("topMonth").textContent = `${q1Labels[topIndex]} — ${formatNumber(valuesQ1[topIndex])}`;
  document.getElementById("today").textContent = new Date().toLocaleDateString("ar-SA");
  document.getElementById("autoInsight").textContent = `ملخص تنفيذي: بلغ إجمالي مكالمات الربع الأول من عام 2026 عدد ${formatNumber(totalQ1)} مكالمة، بمتوسط شهري ${formatNumber(Math.round(avgQ1))} مكالمة. ويعكس ذلك ${change >= 0 ? "نموًا" : "انخفاضًا"} قدره ${Math.abs(change).toFixed(1)}% مقارنة بمتوسط عام 2025، مع تسجيل ${q1Labels[topIndex]} أعلى حجم مكالمات خلال الربع.`;

  if (callsChart && q1Chart) {
    callsChart.data.datasets[0].data = values2025;
    callsChart.update();
    q1Chart.data.datasets[0].data = valuesQ1;
    q1Chart.update();
  }
}

function initCharts() {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js failed to load; charts are disabled.");
    return;
  }

  callsChart = new Chart(document.getElementById("callsChart"), {
    type: "bar",
    data: {
      labels: monthLabels,
      datasets: [{ label: "عدد المكالمات", data: get2025Values(), borderWidth: 0, borderRadius: 9, backgroundColor: "#2f6fed" }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { ticks: { font: { family: "Markazi Text", size: 14 } } } } }
  });

  q1Chart = new Chart(document.getElementById("q1Chart"), {
    type: "doughnut",
    data: {
      labels: q1Labels,
      datasets: [{ data: getQ1Values(), backgroundColor: ["#0f9d8a", "#2f6fed", "#5b3fd6"], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { family: "Markazi Text", size: 16 } } } } }
  });
}

function resetData() {
  document.querySelectorAll("input, textarea").forEach((el) => (el.value = ""));
  defaults2025.forEach((value, index) => (document.getElementById(`m2025_${index}`).value = value));
  updateReport();
}

function init() {
  buildMonthInputs();
  initCharts();
  document.querySelectorAll("input, textarea").forEach((el) => el.addEventListener("input", updateReport));
  document.getElementById("savePdfBtn").addEventListener("click", () => window.print());
  document.getElementById("resetBtn").addEventListener("click", resetData);
  updateReport();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
