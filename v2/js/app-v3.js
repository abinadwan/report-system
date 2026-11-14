import {MONTHS,PRESETS,TEMPLATES,uid,metric,period,newReport,applyTemplate,validate,calc,comparison,format,keyOf} from "./engine.js";
import {parseCSV,readFlexibleFormat,encodeCSV} from "./csv.js";
import {writeDraft,readDraft} from "./storage.js";
import {readXLSX} from "./xlsx.js";
import {migrateLegacyReports} from "./migrate.js";
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const KEY="report-system-v2-v3-draft";
const LIBRARY_KEY="report-system-v2-library";
const ACTIVE_KEY="report-system-v2-active";
let report=restoreDraft(),saveTimer;
report.id ||= uid();
let library=loadLibrary();
if(library.length){report=library.find(r=>r.id===localStorage.getItem(ACTIVE_KEY))||library[0];}else{library=[report];}
function loadLibrary(){try{const parsed=JSON.parse(localStorage.getItem(LIBRARY_KEY));if(Array.isArray(parsed)&&parsed.length&&parsed.length<=100){return parsed.map(r=>{validate(r);if(typeof r.id!=="string"||!r.id)throw Error("Invalid report ID");return r;});}}catch(e){console.warn("Library recovery failed",e);}return [];}
function renderLibrary(){const selector=$("reportSelect");selector.innerHTML=library.map(r=>`<option value="${escapeHTML(r.id)}">${escapeHTML(r.title||"تقرير بدون عنوان")}</option>`).join("");selector.value=report.id;}
function restoreDraft(){try{const v=JSON.parse(localStorage.getItem(KEY));return validate(v);}catch{return newReport();}}
function status(text){$("status").textContent=text;}
function saveDraft(){try{validate(report);localStorage.setItem(KEY,JSON.stringify(report));
 const idx=library.findIndex(r=>r.id===report.id);if(idx<0)library.push(report);else library[idx]=report;
 localStorage.setItem(LIBRARY_KEY,JSON.stringify(library));
 localStorage.setItem(ACTIVE_KEY,report.id);
 writeDraft(structuredClone(report)).catch(()=>{});renderLibrary();status("تم الحفظ على هذا المتصفح.");}catch(e){status("تعذر الحفظ: "+e.message);}}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveDraft,650);}
function syncTop(){$("title").value=report.title;$("kind").value=report.kind;$("template").value=report.template;document.querySelectorAll("[data-section]").forEach(el=>el.checked=report.sections.includes(el.dataset.section));}
function renderSections(){
 const names={summary:"ملخص الأداء",chart:"الرسوم البيانية",table:"الجداول"};
 const nodes={summary:$("summarySection"),chart:$("chartSection"),table:$("tableSection")};
 $("sectionOrder").innerHTML=report.sections.map((id,index)=>`<div class="section-order-row" data-section-id="${id}"><span>${names[id]}</span><div><button type="button" class="btn secondary" data-move="-1" ${index===0?"disabled":""} aria-label="تحريك ${names[id]} للأعلى">↑</button><button type="button" class="btn secondary" data-move="1" ${index===report.sections.length-1?"disabled":""} aria-label="تحريك ${names[id]} للأسفل">↓</button></div></div>`).join("");
 report.sections.forEach(id=>$("preview").insertBefore(nodes[id],$("warnings")));
}
function presetOf(p){if(p.scope==="custom")return "custom";return Object.entries(PRESETS).find(([,months])=>months.length===p.months.length&&months.every(m=>p.months.includes(m)))?.[0]||"custom";}
function renderMetrics(){
 $("metricEditors").innerHTML=report.metrics.map((m,i)=>{
  const bases=report.metrics.filter(x=>x.method!=="ratio"&&x.id!==m.id);
  const choices=(field)=>`<select data-field="${field}"><option value="">اختر مؤشرًا</option>${bases.map(b=>`<option value="${escapeHTML(b.id)}" ${m[field]===b.id?"selected":""}>${escapeHTML(b.name)}</option>`).join("")}</select>`;
  return `<section class="period-card" data-metric="${escapeHTML(m.id)}">
   <div class="period-head"><h3>المؤشر ${i+1}</h3><button class="btn ghost" data-action="deleteMetric" type="button" ${report.metrics.length===1?"disabled":""}>حذف</button></div>
   <div class="two-cols"><div><label>اسم المؤشر</label><input data-field="name" maxlength="100" value="${escapeHTML(m.name)}"></div><div><label>الوحدة</label><input data-field="unit" maxlength="40" value="${escapeHTML(m.unit)}"></div></div>
   <label>الحساب</label><select data-field="method"><option value="sum" ${m.method==="sum"?"selected":""}>مجموع</option><option value="average" ${m.method==="average"?"selected":""}>متوسط الأشهر</option><option value="ratio" ${m.method==="ratio"?"selected":""}>نسبة مرجحة (البسط ÷ المقام)</option></select>
   ${m.method==="ratio"?`<div class="two-cols"><div><label>البسط</label>${choices("numeratorId")}</div><div><label>المقام</label>${choices("denominatorId")}</div></div><p class="hint">تحسب النسبة من مجموع البسط ÷ مجموع المقام × 100 للأشهر ذات البيانات المشتركة.</p>`:""}
  </section>`;
 }).join("");
}
function renderPeriods(){
 $("periodEditors").innerHTML=report.periods.map((p,i)=>`<section class="period-card" data-period="${escapeHTML(p.id)}">
 <div class="period-head"><h3>الفترة ${i+1}</h3><button data-action="deletePeriod" class="btn ghost" type="button" ${report.periods.length===1?"disabled":""}>حذف</button></div>
 <div class="two-cols"><div><label>عنوان اختياري</label><input data-field="name" maxlength="100" value="${escapeHTML(p.name)}" placeholder="النصف الأول"></div><div><label>السنة</label><input data-field="year" type="number" min="1000" max="9999" step="1" value="${escapeHTML(p.year)}"></div></div>
 <label>الأشهر</label><select data-field="preset">${[["year","سنة كاملة"],["h1","النصف الأول"],["h2","النصف الثاني"],["q1","الربع الأول"],["q2","الربع الثاني"],["q3","الربع الثالث"],["q4","الربع الرابع"],["custom","تحديد يدوي"]].map(([key,label])=>`<option value="${key}" ${presetOf(p)===key?"selected":""}>${label}</option>`).join("")}</select>
 <div class="month-checks">${MONTHS.map((month,j)=>`<label><input type="checkbox" data-month="${j+1}" ${p.months.includes(j+1)?"checked":""}>${month}</label>`).join("")}</div><p class="hint">${p.months.length} شهر</p>
 </section>`).join("");
}
function renderData(){
 $("dataEditors").innerHTML=report.periods.map((p,i)=>`<section class="data-block"><h3>${escapeHTML(p.name||"الفترة "+(i+1))} — ${escapeHTML(p.year)}</h3>
 ${report.metrics.filter(m=>m.method!=="ratio").map(m=>`<div class="data-metric"><h4>${escapeHTML(m.name)} <small>${escapeHTML(m.unit)}</small></h4><div class="data-grid">
 ${[...p.months].sort((a,b)=>a-b).map(month=>{const key=keyOf(p.id,month,m.id);return `<div><label>${MONTHS[month-1]}</label><input type="number" min="0" step="any" data-entry="${escapeHTML(key)}" placeholder="غير متوفر" value="${escapeHTML(report.entries[key]??"")}"></div>`}).join("")}
 </div></div>`).join("")}</section>`).join("");
}
function draw(){
 $("previewTitle").textContent=report.title.trim()||"تقرير جديد";
 $("previewSubtitle").textContent=({comparison:"مقارنة أداء",periodic:"تقرير دوري",trend:"تحليل اتجاهات",executive:"ملخص تنفيذي"})[report.kind]+" · "+TEMPLATES[report.template].label;
 let sections;
 try{sections=calc(report);}catch(e){$("warnings").textContent="راجع المدخلات: "+e.message;return;}
 $("summarySection").hidden=!report.sections.includes("summary");
 $("chartSection").hidden=!report.sections.includes("chart");
 $("tableSection").hidden=!report.sections.includes("table");
 $("summaryCards").innerHTML=sections.flatMap(s=>s.periods.map((p,i)=>`<div class="metric"><small>${escapeHTML(s.metric.name)} · ${escapeHTML(p.name||p.year)}</small><strong>${format(p.result)}</strong><small>${escapeHTML(s.metric.unit)} · ${p.count}/${p.expected} أشهر</small></div>`)).join("");
 const lead=sections[0];
 const leadRows=lead?comparison(lead.periods):[];
 const complete=leadRows.filter(p=>p.result!==null);
 const best=complete.length?complete.reduce((a,b)=>a.result>=b.result?a:b):null;
 $("narrative").textContent=best?
   "يتناول التقرير "+report.periods.length+" فترة و"+report.metrics.length+" مؤشرًا. أعلى نتيجة لمؤشر "+lead.metric.name+" كانت "+format(best.result)+" "+lead.metric.unit+" خلال "+(best.name||best.year)+". النتائج وصفية ولا تشير وحدها إلى جودة الأداء.":
   "لا تتوفر بيانات كافية لصياغة ملخص رقمي. أدخل القيم الشهرية أولًا.";
 $("charts").innerHTML=sections.map(section=>{
 const monthly=report.kind==="trend"||report.kind==="periodic";
 const values=monthly?section.periods.flatMap(p=>p.values.map(e=>e.value)):section.periods.map(p=>p.result);
 const max=Math.max(0,...values.filter(v=>v!==null));
 const rows=monthly?section.periods.flatMap(p=>p.values.map(e=>({label:(p.name||p.year)+" · "+MONTHS[e.month-1],value:e.value}))):section.periods.map(p=>({label:p.name||p.year,value:p.result}));
 return `<div class="chart-group"><h4>${escapeHTML(section.metric.name)} <small>${escapeHTML(section.metric.unit)}</small></h4>${rows.map(row=>`<div class="bar-row"><span>${escapeHTML(row.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${max>0&&row.value!==null?(100*row.value/max).toFixed(2):0}%"></div></div><strong>${format(row.value)}</strong></div>`).join("")}</div>`;
 }).join("");
 $("tables").innerHTML=sections.map(s=>`<h4>${escapeHTML(s.metric.name)} <small>${escapeHTML(s.metric.unit)}</small></h4><div class="table-scroll"><table><thead><tr><th>الفترة</th><th>النتيجة</th><th>متوسط الشهر</th><th>التغير عن الأولى</th><th>تغطية البيانات</th></tr></thead><tbody>
 ${comparison(s.periods).map(p=>`<tr><td>${escapeHTML(p.name||p.year)}</td><td>${format(p.result)}</td><td>${format(p.average)}</td><td>${p.delta===null?"—":(p.delta>0?"+":"")+format(p.delta)+"%"}</td><td>${p.count}/${p.expected}</td></tr>`).join("")}
 </tbody></table></div>`).join("");
 const warnings=[];
 if(sections.some(s=>s.periods.some(p=>!p.complete)))warnings.push("هناك أشهر دون بيانات. النتائج تستند إلى الأشهر المدخلة فقط.");
 if(new Set(report.periods.map(p=>p.months.length)).size>1)warnings.push("الفترات مختلفة الطول؛ المقارنة بين الإجماليات قد تكون مضللة. استخدم المتوسط الشهري أو فترات متساوية.");
 if(report.metrics.some(m=>m.method==="average"))warnings.push("متوسط الأشهر غير مرجح؛ لا تستخدمه لحساب نسب تشغيلية مجمعة مثل معدل الإجابة.");
 $("warnings").textContent=warnings.join(" ");
}
function rerender(){syncTop();renderMetrics();renderPeriods();renderData();draw();renderSections();renderLibrary();scheduleSave();}
function changeTop(id,property){$(id).addEventListener("input",e=>{report[property]=e.target.value;draw();scheduleSave();});}
changeTop("title","title");changeTop("kind","kind");
$("template").addEventListener("change",e=>{
 if(!confirm("تغيير القالب سيستبدل جميع المؤشرات والقيم المدخلة. هل تريد المتابعة؟")){e.target.value=report.template;return;}
 report=applyTemplate(report,e.target.value);rerender();
});
document.querySelectorAll("[data-section]").forEach(el=>el.addEventListener("change",()=>{const chosen=Array.from(document.querySelectorAll("[data-section]:checked"),e=>e.dataset.section);report.sections=[...report.sections.filter(id=>chosen.includes(id)),...chosen.filter(id=>!report.sections.includes(id))];draw();renderSections();scheduleSave();}));
$("sectionOrder").addEventListener("click",e=>{const button=e.target.closest("[data-move]");if(!button)return;const id=button.closest("[data-section-id]")?.dataset.sectionId;const index=report.sections.indexOf(id),next=index+Number(button.dataset.move);if(index<0||next<0||next>=report.sections.length)return;[report.sections[index],report.sections[next]]=[report.sections[next],report.sections[index]];renderSections();scheduleSave();});
$("addMetric").onclick=()=>{if(report.metrics.length>=30)return status("الحد الأقصى 30 مؤشرًا.");report.metrics.push(metric());rerender();};
$("addPeriod").onclick=()=>{if(report.periods.length>=100)return status("الحد الأقصى 100 فترة.");report.periods.push(period());rerender();};
$("metricEditors").addEventListener("change",e=>{
 const node=e.target.closest("[data-metric]");const m=report.metrics.find(m=>m.id===node?.dataset.metric);
 if(!m)return;if(e.target.dataset.field){m[e.target.dataset.field]=e.target.value;
  if(e.target.dataset.field==="method"&&e.target.value==="ratio"){const bases=report.metrics.filter(x=>x.id!==m.id&&x.method!=="ratio");m.numeratorId=bases[0]?.id||"";m.denominatorId=bases[1]?.id||"";m.unit="%";}
 }
 rerender();
});
$("metricEditors").addEventListener("input",e=>{
 if(!e.target.dataset.field||e.target.dataset.field==="method")return;
 const node=e.target.closest("[data-metric]");const m=report.metrics.find(m=>m.id===node?.dataset.metric);
 if(m){m[e.target.dataset.field]=e.target.value;draw();scheduleSave();}
});
$("metricEditors").addEventListener("click",e=>{
 if(e.target.dataset.action!=="deleteMetric"||report.metrics.length<=1)return;
 const id=e.target.closest("[data-metric]")?.dataset.metric;
 if(report.metrics.some(x=>x.method==="ratio"&&(x.numeratorId===id||x.denominatorId===id)))return status("المؤشر مستخدم في حساب نسبة. عدّل النسبة أولًا.");
 report.metrics=report.metrics.filter(m=>m.id!==id);
 for(const k of Object.keys(report.entries)){try{if(JSON.parse(k)[2]===id)delete report.entries[k];}catch{}}
 rerender();
});
$("periodEditors").addEventListener("input",e=>{
 if(e.target.dataset.field!=="name")return;const p=report.periods.find(p=>p.id===e.target.closest("[data-period]")?.dataset.period);
 if(p){p.name=e.target.value;draw();scheduleSave();}
});
$("periodEditors").addEventListener("change",e=>{
 const node=e.target.closest("[data-period]");const p=report.periods.find(p=>p.id===node?.dataset.period);if(!p)return;
 if(e.target.dataset.field==="name")p.name=e.target.value;
 if(e.target.dataset.field==="year")p.year=Number(e.target.value);
 if(e.target.dataset.field==="preset"){p.scope=e.target.value;if(e.target.value!=="custom")p.months=[...PRESETS[e.target.value]];}
 if(e.target.dataset.month){const month=Number(e.target.dataset.month);p.scope="custom";p.months=e.target.checked?[...new Set([...p.months,month])].sort((a,b)=>a-b):p.months.filter(m=>m!==month);}
 rerender();
});
$("periodEditors").addEventListener("click",e=>{
 if(e.target.dataset.action!=="deletePeriod"||report.periods.length<=1)return;
 const id=e.target.closest("[data-period]")?.dataset.period;report.periods=report.periods.filter(p=>p.id!==id);
 for(const k of Object.keys(report.entries)){try{if(JSON.parse(k)[0]===id)delete report.entries[k];}catch{}}
 rerender();
});
$("dataEditors").addEventListener("input",e=>{
 if(!e.target.dataset.entry)return;
 const raw=e.target.value;
 if(raw!==""&&(!Number.isFinite(Number(raw))||Number(raw)<0)){status("القيم يجب أن تكون غير سالبة.");return;}
 report.entries[e.target.dataset.entry]=raw===""?null:Number(raw);draw();scheduleSave();
});
function download(name,content,type){
 const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
$("downloadCsv").onclick=()=>{
 try{
  validate(report);
  const rows=[];
  for(const p of report.periods)for(const month of p.months)for(const m of report.metrics.filter(m=>m.method!=="ratio")){
   const value=report.entries[keyOf(p.id,month,m.id)];
   if(value!==undefined&&value!==null&&value!=="")rows.push({period:p.name||p.id,year:p.year,month,metric:m.name,value});
  }
  download("report-data.csv","\uFEFF"+encodeCSV(rows),"text/csv;charset=utf-8");status("تم إعداد CSV. لا يتضمن الأشهر الفارغة.");
 }catch(e){status(e.message);}
};
$("importCsv").onchange=async e=>{
 const file=e.target.files?.[0];e.target.value="";if(!file)return;
 try{
  if(file.size>8*1024*1024)throw Error("حجم الملف يتجاوز 8 ميجابايت.");
  const data=readFlexibleFormat(file.name.toLowerCase().endsWith(".xlsx")?await readXLSX(await file.arrayBuffer()):parseCSV(await file.text()));
  const seen=new Set();for(const r of data){const k=JSON.stringify([r.period,r.year,r.month,r.metric]);if(seen.has(k))throw Error("صف مكرر لنفس السنة والشهر والمؤشر.");seen.add(k);}
  const keys=[...new Set(data.map(r=>JSON.stringify([r.period,r.year])))];
  const names=[...new Set(data.map(r=>r.metric))];
  if(keys.length>100||names.length>30)throw Error("الملف يتجاوز الحد الأقصى للفترات أو المؤشرات.");
  if(!confirm("سيستبدل الاستيراد الفترات والمؤشرات والقيم الحالية. هل تريد المتابعة؟"))return;
  const periods=keys.map(k=>{const [name,year]=JSON.parse(k);return {...period(year),name,months:[...new Set(data.filter(r=>r.year===year&&r.period===name).map(r=>r.month))].sort((a,b)=>a-b)};});
  const metrics=names.map(name=>metric(name,"","sum"));
  const entries={};
  for(const r of data){const p=periods.find(p=>p.year===r.year&&p.name===r.period),m=metrics.find(m=>m.name===r.metric);entries[keyOf(p.id,r.month,m.id)]=r.value;}
  const next={...report,periods,metrics,entries};
  validate(next);report=next;rerender();status("استوردت "+data.length+" قيمة.");
 }catch(err){status("تعذر استيراد البيانات: "+err.message);}
};
$("save").onclick=saveDraft;
$("backup").onclick=()=>{try{validate(report);download("report-system-v2.json",JSON.stringify(report,null,2),"application/json");}catch(e){status(e.message);}};
$("restore").onchange=async e=>{
 const file=e.target.files?.[0];e.target.value="";if(!file)return;
 try{if(file.size>5*1024*1024)throw Error("الملف كبير جدًا.");const data=validate(JSON.parse(await file.text()));if(!confirm("استبدال التقرير الحالي بالنسخة الاحتياطية؟"))return;report={...data,id:report.id};rerender();status("تم استيراد النسخة.");}catch(err){status("تعذر الاستيراد: "+err.message);}
};
$("clear").onclick=()=>{if(!confirm("سيتم مسح محتوى التقرير الحالي. هل حفظت نسخة احتياطية؟"))return;const id=report.id;report=newReport();report.id=id;rerender();};
$("newReport").onclick=()=>{if(library.length>=100)return status("الحد الأقصى 100 تقرير.");saveDraft();report=newReport();report.id=uid();library.push(report);rerender();};
$("duplicateReport").onclick=()=>{if(library.length>=100)return status("الحد الأقصى 100 تقرير.");saveDraft();report=structuredClone(report);report.id=uid();report.title+=" (نسخة)";library.push(report);rerender();};
$("deleteReport").onclick=()=>{if(!confirm("حذف هذا التقرير نهائيًا من المكتبة؟"))return;clearTimeout(saveTimer);library=library.filter(r=>r.id!==report.id);if(!library.length){report=newReport();report.id=uid();library=[report];}else report=library[0];rerender();};
$("reportSelect").onchange=e=>{const selectedId=e.target.value;saveDraft();const selected=library.find(r=>r.id===selectedId);if(selected){report=selected;syncTop();renderMetrics();renderPeriods();renderData();draw();renderLibrary();}};
$("backupAll").onclick=()=>{try{library.forEach(validate);download("report-system-v2-library.json",JSON.stringify({schemaVersion:3,reports:library},null,2),"application/json");}catch(e){status(e.message);}};
$("migrateV1").onclick=()=>{
 try{
  const old=JSON.parse(localStorage.getItem("report_builder_reports_v3")||"[]");
  if(!Array.isArray(old)||!old.length)return status("لا توجد تقارير V1 محفوظة في هذا المتصفح.");
  const existing=new Set(library.map(r=>r.legacyId).filter(Boolean));
  const migrated=migrateLegacyReports(old).filter(r=>!r.legacyId||!existing.has(r.legacyId));
  if(!migrated.length)return status("جميع التقارير القديمة موجودة بالفعل.");
  if(library.length+migrated.length>100)return status("تجاوزت التقارير الحد الأقصى للمكتبة.");
  if(!confirm("استيراد "+migrated.length+" تقريرًا من V1؟ ستظل بيانات V1 الأصلية دون تعديل."))return;
  saveDraft();library.push(...migrated);report=migrated[0];rerender();status("تم ترحيل "+migrated.length+" تقريرًا. احتفظ بنسخة احتياطية.");
 }catch(e){status("تعذر ترحيل V1: "+e.message);}
};
$("print").onclick=()=>{try{validate(report);window.print();}catch(e){status(e.message);}};
syncTop();renderMetrics();renderPeriods();renderData();draw();renderSections();renderLibrary();
if(!localStorage.getItem(KEY)){
 readDraft().then(saved=>{if(saved&&!localStorage.getItem(KEY)){report=validate(saved);report.id ||= uid();library=[report];syncTop();renderMetrics();renderPeriods();renderData();draw();renderLibrary();status("تم استرداد المسودة من قاعدة البيانات المحلية.");}}).catch(()=>{});
}
