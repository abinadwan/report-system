const STORAGE_KEY = "executive_report_v1";
const monthLabels = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const q1Labels = ["يناير", "فبراير", "مارس"];
let callsChart;
let q1Chart;

const clamp = (v, min = 0, max = Number.POSITIVE_INFINITY) => Math.min(max, Math.max(min, Number(v) || 0));
const f = (n) => Number(n || 0).toLocaleString("ar-SA");

function buildMonthInputs() {
  const wrap = document.getElementById("months2025");
  monthLabels.forEach((m, i) => {
    const div = document.createElement("div");
    div.className = "month-input";
    div.innerHTML = `<label for="m2025_${i}">${m} 2025</label><input id="m2025_${i}" type="number" min="0"/>`;
    wrap.appendChild(div);
  });
}

function get2025() { return monthLabels.map((_, i) => clamp(document.getElementById(`m2025_${i}`).value)); }
function getQ1() { return ["jan2026", "feb2026", "mar2026"].map((id) => clamp(document.getElementById(id).value)); }

function saveState() {
  const data = {};
  document.querySelectorAll("input").forEach((i) => data[i.id] = i.value);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const data = JSON.parse(raw);
  Object.entries(data).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
}

function makeSummary({ total25, totalQ1, avg25, avgQ1, rate, speed, change }) {
  const trend = change >= 0 ? `ارتفاعًا بنسبة ${change.toFixed(1)}٪` : `انخفاضًا بنسبة ${Math.abs(change).toFixed(1)}٪`;
  return `يوضح هذا التقرير الأداء التشغيلي لمركز الاتصال، حيث بلغ إجمالي مكالمات عام 2025 عدد ${f(total25)} مكالمة بمتوسط شهري ${f(Math.round(avg25))} مكالمة. وخلال الربع الأول من عام 2026 تم تسجيل ${f(totalQ1)} مكالمة بمتوسط ${f(Math.round(avgQ1))} مكالمة شهريًا، ما يعكس ${trend} مقارنة بخط الأساس لعام 2025. كما بلغ معدل الإجابة ${rate.toFixed(2)}٪ بمتوسط سرعة رد قدره ${f(speed)} ثانية، وهو ما يدعم الاستمرار في تحسين كفاءة الخدمة وجودة الاستجابة.`;
}

function updateReport() {
  const v25 = get2025();
  const vQ1 = getQ1();
  const total25 = v25.reduce((a, b) => a + b, 0);
  const totalQ1 = vQ1.reduce((a, b) => a + b, 0);
  const avg25 = total25 / 12;
  const avgQ1 = totalQ1 / 3;
  const change = avg25 ? ((avgQ1 - avg25) / avg25) * 100 : 0;
  const rate = clamp(document.getElementById("answerRate").value, 0, 100);
  const speed = clamp(document.getElementById("avgSpeed").value);

  document.getElementById("rTitle").textContent = document.getElementById("title").value || "تقرير تنفيذي داخلي";
  document.getElementById("rSubtitle").textContent = document.getElementById("subtitle").value || "ملخص أداء مركز الاتصال";
  document.getElementById("total2025").textContent = f(total25);
  document.getElementById("avg2025").textContent = f(Math.round(avg25));
  document.getElementById("q12026").textContent = f(totalQ1);
  document.getElementById("avgQ1").textContent = f(Math.round(avgQ1));
  document.getElementById("rate2026").textContent = `${rate.toFixed(2)}%`;
  document.getElementById("speed2026").textContent = `${f(speed)} ث`;
  document.getElementById("growthNote").textContent = change >= 0 ? `نمو ${change.toFixed(1)}%` : `تراجع ${Math.abs(change).toFixed(1)}%`;
  document.getElementById("execSummary").textContent = makeSummary({ total25, totalQ1, avg25, avgQ1, rate, speed, change });
  document.getElementById("today").textContent = `تاريخ الإنشاء: ${new Date().toLocaleDateString("ar-SA")}`;

  if (callsChart && q1Chart) {
    callsChart.data.datasets[0].data = v25;
    callsChart.update();
    q1Chart.data.datasets[0].data = vQ1;
    q1Chart.update();
  }

  saveState();
}

function initCharts() {
  if (typeof Chart === "undefined") return;
  callsChart = new Chart(document.getElementById("callsChart"), {
    type: "bar",
    data: { labels: monthLabels, datasets: [{ data: get2025(), backgroundColor: "#2F6FED", borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { ticks: { maxRotation: 0, minRotation: 0 } } } }
  });

  q1Chart = new Chart(document.getElementById("q1Chart"), {
    type: "doughnut",
    data: { labels: q1Labels, datasets: [{ data: getQ1(), backgroundColor: ["#0F9D8A", "#5B3FD6", "#F2994A"] }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
  });
}

function resetData() {
  document.querySelectorAll("input").forEach((i) => i.value = "");
  localStorage.removeItem(STORAGE_KEY);
  updateReport();
}

function init() {
  buildMonthInputs();
  restoreState();
  initCharts();
  document.querySelectorAll("input").forEach((el) => el.addEventListener("input", updateReport));
  document.getElementById("savePdfBtn").addEventListener("click", () => window.print());
  document.getElementById("resetBtn").addEventListener("click", resetData);
  updateReport();
}

document.addEventListener("DOMContentLoaded", init);
