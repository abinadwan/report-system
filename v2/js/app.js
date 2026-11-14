import {MONTHS,PRESETS,TEMPLATES,newReport,makePeriod,validateReport,computeReport,compareResults,formatNumber,validYear} from "./core.js";
const STORE_KEY="report-system-v2-draft";
const $=id=>document.getElementById(id);
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let state=load();
let messageTimer;
function load(){try{const raw=localStorage.getItem(STORE_KEY);if(raw){const result=JSON.parse(raw);validateReport(result);return result;}}catch(e){console.warn("Saved report could not be restored",e);}return newReport();}
function status(message){$("status").textContent=message;clearTimeout(messageTimer);messageTimer=setTimeout(()=>$("status").textContent="",5000);}
function persist(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state));status("تم الحفظ محليًا.");}catch(e){status("تعذر الحفظ؛ صدّر ملف JSON للاحتفاظ بالبيانات.");}}
function syncMain(){$("reportTitle").value=state.title;$("reportType").value=state.type;$("template").value=state.template;$("metricName").value=state.metric.name;$("metricUnit").value=state.metric.unit;$("aggregation").value=state.metric.aggregation;}
function scope(p){if(p.scope==="custom")return "custom";const value=Object.entries(PRESETS).find(([,months])=>months.length===p.months.length&&months.every(m=>p.months.includes(m)));return value?.[0]??"custom";}
function renderEditors(){
 $("periodEditors").innerHTML=state.periods.map((p,i)=>`<section class="period-card" data-id="${safe(p.id)}">
   <div class="period-head"><h3>الفترة ${i+1}</h3><button type="button" data-action="remove" class="btn ghost" ${state.periods.length===1?"disabled":""}>حذف</button></div>
   <div class="two-cols"><div><label>اسم اختياري</label><input data-field="name" value="${safe(p.name)}" placeholder="مثال: النصف الأول"></div>
   <div><label>السنة</label><input data-field="year" type="number" min="1000" max="9999" step="1" value="${safe(p.year)}"></div></div>
   <label>نطاق الأشهر</label><select data-field="scope">
    ${[["year","سنة كاملة"],["h1","النصف الأول"],["h2","النصف الثاني"],["q1","الربع الأول"],["q2","الربع الثاني"],["q3","الربع الثالث"],["q4","الربع الرابع"],["custom","أشهر مخصصة"]].map(([v,t])=>`<option value="${v}" ${scope(p)===v?"selected":""}>${t}</option>`).join("")}
   </select>
   <div class="month-checks">${MONTHS.map((m,idx)=>`<label><input type="checkbox" data-month="${idx+1}" ${p.months.includes(idx+1)?"checked":""}>${m}</label>`).join("")}</div>
   <p class="hint">${p.months.length} شهر مختار</p>
 </section>`).join("");
 $("dataEditors").innerHTML=state.periods.map((p,i)=>`<section class="data-block" data-id="${safe(p.id)}"><h3>${safe(p.name||"الفترة "+(i+1))} — ${safe(p.year)}</h3><div class="data-grid">
 ${[...p.months].sort((a,b)=>a-b).map(m=>`<div><label for="v-${safe(p.id)}-${m}">${MONTHS[m-1]}</label><input type="number" min="0" step="any" id="v-${safe(p.id)}-${m}" data-value-month="${m}" placeholder="لا توجد بيانات" value="${safe(p.values[m]??"")}"></div>`).join("")}
 </div></section>`).join("");
}
function renderPreview(){
 const title=state.title.trim()||"تقرير بدون عنوان";
 $("previewTitle").textContent=title;
 $("previewDescription").textContent=({comparison:"مقارنة الأداء",periodic:"استعراض الأداء",trend:"تحليل الاتجاهات",executive:"ملخص تنفيذي"})[state.type]+" · "+TEMPLATES[state.template].label+" · "+state.metric.name;
 let rows;try{rows=compareResults(computeReport(state));}catch(e){$("previewMetrics").textContent="";$("comparisonChart").textContent="";$("detailsTable").textContent="";$("previewNotes").textContent=e.message;return;}
 $("previewMetrics").innerHTML=rows.map(r=>`<div class="metric"><small>${safe(r.label)}</small><strong>${formatNumber(r.result)}</strong><small>${safe(state.metric.unit)} · ${r.available}/${r.expected} أشهر</small></div>`).join("");
 const max=Math.max(0,...rows.map(r=>r.result??0));
 $("comparisonChart").innerHTML=rows.map(r=>`<div class="bar-row"><span>${safe(r.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${max>0&&r.result!==null?(r.result/max*100).toFixed(2):0}%"></div></div><strong>${formatNumber(r.result)}</strong></div>`).join("");
 $("detailsTable").innerHTML=`<div class="table-scroll"><table><thead><tr><th>الفترة</th><th>القيمة</th><th>المتوسط الشهري</th><th>التغير عن الأولى</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${safe(r.label)}</td><td>${formatNumber(r.result)}</td><td>${formatNumber(r.monthlyAverage)}</td><td>${r.change===null?"—":(r.change>0?"+":"")+formatNumber(r.change)+"%"}</td></tr>`).join("")}</tbody></table></div>`;
 const messages=[];
 if(rows.some(r=>!r.complete))messages.push("بعض الأشهر بلا بيانات؛ المجاميع والمتوسطات محسوبة على القيم المدخلة فقط.");
 if(new Set(rows.map(r=>r.expected)).size>1)messages.push("الفترات مختلفة الطول؛ لا تقارن الإجماليات مباشرة، وراجع المتوسطات الشهرية.");
 if(rows.length>1&&state.type==="periodic")messages.push("تم إدخال أكثر من فترة لتقرير دوري؛ يمكنك أيضًا اختيار وضع المقارنة.");
 $("previewNotes").textContent=messages.join(" ");
}
function redraw(){renderEditors();renderPreview();}
function refresh(){renderPreview();}
$("periodEditors").addEventListener("change",e=>{
 const card=e.target.closest("[data-id]");if(!card)return;const p=state.periods.find(p=>p.id===card.dataset.id);if(!p)return;
 if(e.target.dataset.field==="scope"){const chosen=e.target.value;p.scope=chosen;if(chosen!=="custom")p.months=[...PRESETS[chosen]];}
 if(e.target.dataset.month){const m=Number(e.target.dataset.month);p.scope="custom";p.months=e.target.checked?[...new Set([...p.months,m])].sort((a,b)=>a-b):p.months.filter(x=>x!==m);}
 if(e.target.dataset.field==="year")p.year=Number(e.target.value);
 if(e.target.dataset.field==="name")p.name=e.target.value;
 redraw();
});
$("periodEditors").addEventListener("input",e=>{
 if(e.target.dataset.field!=="name")return;const card=e.target.closest("[data-id]");const p=state.periods.find(p=>p.id===card?.dataset.id);if(p){p.name=e.target.value;renderPreview();}
});
$("periodEditors").addEventListener("click",e=>{
 if(e.target.dataset.action!=="remove")return;const card=e.target.closest("[data-id]");if(state.periods.length<2)return;state.periods=state.periods.filter(p=>p.id!==card?.dataset.id);redraw();
});
$("dataEditors").addEventListener("input",e=>{
 const m=Number(e.target.dataset.valueMonth);if(!m)return;const box=e.target.closest("[data-id]");const p=state.periods.find(p=>p.id===box?.dataset.id);if(!p)return;
 const raw=e.target.value;if(raw!==""&&(!Number.isFinite(Number(raw))||Number(raw)<0)){status("أدخل قيمة غير سالبة.");return;}
 p.values[m]=raw===""?"":Number(raw);refresh();
});
for(const [id,change] of Object.entries({
 reportTitle:v=>state.title=v,reportType:v=>state.type=v,metricName:v=>state.metric.name=v,
 metricUnit:v=>state.metric.unit=v,aggregation:v=>state.metric.aggregation=v,
 template:v=>{state.template=v;state.metric={...TEMPLATES[v]};syncMain();}
})){
 $(id).addEventListener("input",e=>{change(e.target.value);refresh();});
}
$("addPeriod").addEventListener("click",()=>{if(state.periods.length>=100)return status("الحد الأقصى 100 فترة في التقرير الواحد.");state.periods.push(makePeriod());redraw();});
$("save").addEventListener("click",()=>{try{validateReport(state);persist();}catch(e){status(e.message);}});
$("exportJson").addEventListener("click",()=>{try{
 validateReport(state);const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="report-system-v2-backup.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status("تم تجهيز النسخة الاحتياطية.");
}catch(e){status(e.message);}});
$("importJson").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error("الملف أكبر من 5 ميجابايت.");const parsed=JSON.parse(await file.text());validateReport(parsed);state=parsed;syncMain();redraw();persist();}catch(err){status("تعذر الاستيراد: "+err.message);}e.target.value="";});
$("reset").addEventListener("click",()=>{if(!confirm("إنشاء تقرير جديد واستبدال المسودة الحالية؟ صدّر نسخة احتياطية أولًا إذا لزم."))return;state=newReport();syncMain();redraw();persist();});
$("print").addEventListener("click",()=>{try{validateReport(state);window.print();}catch(e){status(e.message);}});
syncMain();redraw();
