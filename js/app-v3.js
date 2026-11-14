import {MONTHS,PRESETS,TEMPLATES,uid,metric,period,newReport,applyTemplate,validate,calc,comparison,format,keyOf} from "./engine.js";
import {parseCSV,readFlexibleFormat,encodeCSV} from "./csv.js";
import {writeDraft,readDraft,writeLibrary,readLibrary} from "./storage.js";
import {readXLSX} from "./xlsx.js";
import {makeLibraryBackup,parseLibraryBackup} from "./library-backup.js";
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const KEY="report-system-v2-v3-draft";
const LIBRARY_KEY="report-system-v2-library";
const ACTIVE_KEY="report-system-v2-active";
let report=restoreDraft(),saveTimer;
report.id ||= uid();
let library=loadLibrary();
if(library.length){report=library.find(r=>r.id===localStorage.getItem(ACTIVE_KEY))||library[0];}else{library=[report];}
function loadLibrary(){
 try{
  const parsed=JSON.parse(localStorage.getItem(LIBRARY_KEY));
  if(Array.isArray(parsed)&&parsed.length&&parsed.length<=100){
   const recovered=parsed.flatMap(item=>{try{validate(item);return typeof item.id==="string"&&item.id?[item]:[];}catch{return [];}});
   if(recovered.length)return recovered;
  }
 }catch(e){console.warn("Local library recovery failed",e);}
 // Each saved record is an independent fallback if the library index was corrupted.
 const recovered=[];
 for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i);if(!key?.startsWith("report-system-v2-record:"))continue;
  try{const item=JSON.parse(localStorage.getItem(key));validate(item);if(typeof item.id==="string"&&item.id)recovered.push(item);}catch{}
 }
 return recovered.slice(0,100);
}
function renderLibrary(){const selector=$("reportSelect");selector.innerHTML=library.map(r=>`<option value="${escapeHTML(r.id)}">${escapeHTML(r.title||"تقرير بدون عنوان")}</option>`).join("");selector.value=report.id;renderLibraryCards();}
const VIEWS=["library","data","preview"];
function showView(name){
  const view=VIEWS.includes(name)?name:"library";
  for(const id of VIEWS){
    $("view-"+id).hidden=id!==view;
    const button=$("nav-"+id);
    if(id===view)button.setAttribute("aria-current","page");
    else button.removeAttribute("aria-current");
  }
  if(location.hash!=="#"+view)history.replaceState(null,"","#"+view);
  window.scrollTo({top:0,behavior:"instant"});
}
function renderLibraryCards(){
  const labels={comparison:"مقارنة أداء",periodic:"تقرير دوري",trend:"تحليل اتجاهات",executive:"ملخص تنفيذي"};
  $("reportCards").innerHTML=library.map(r=>`<button type="button" class="report-card ${r.id===report.id?"selected":""}" data-open-report="${escapeHTML(r.id)}">
    <span class="report-card-title">${escapeHTML(r.title||"تقرير بدون عنوان")}</span>
    <span class="report-card-description">${escapeHTML(labels[r.kind]||"تقرير")} · ${r.periods.length} فترة · ${r.metrics.length} مؤشر</span>
    <span class="report-card-meta">${r.id===report.id?"التقرير المحدد":"فتح التقرير وإدخال البيانات ←"}</span>
  </button>`).join("");
}
function openPreview(){
  try{validate(report);if(!saveDraft())return;draw();showView("preview");}
  catch(e){showView("data");status("راجع البيانات قبل عرض المؤشرات: "+e.message);}
}
function newReportAndOpen(){
  if(library.length>=100)return status("الحد الأقصى 100 تقرير.");
  saveDraft();report=newReport();report.id=uid();library.push(report);rerender();showView("data");
}
function restoreDraft(){try{const v=JSON.parse(localStorage.getItem(KEY));return validate(v);}catch{return newReport();}}
function status(text){$("status").textContent=text;$("libraryStatus").textContent=text;}
function saveDraft(){
 try{validate(report);}catch(e){status("راجع البيانات قبل الحفظ: "+e.message);return false;}
 const idx=library.findIndex(r=>r.id===report.id);if(idx<0)library.push(report);else library[idx]=report;
 const snapshot=structuredClone(library);
 // IndexedDB is independent of localStorage quota and stores all reports, not just the active draft.
 writeLibrary(snapshot).catch(e=>status("تعذر تحديث النسخة الاحتياطية في قاعدة البيانات: "+e.message));
 let localSaved=true;
 try{
  localStorage.setItem("report-system-v2-record:"+report.id,JSON.stringify(report));
  localStorage.setItem(KEY,JSON.stringify(report));
  localStorage.setItem(LIBRARY_KEY,JSON.stringify(library));
  localStorage.setItem(ACTIVE_KEY,report.id);
 }catch(e){localSaved=false;status("الحفظ المحلي ممتلئ؛ صدّر نسخة JSON وتحقق من حفظ IndexedDB.");}
 writeDraft(structuredClone(report)).catch(()=>{});
 renderLibrary();if(localSaved)status("تم الحفظ على هذا المتصفح.");
 return true;
}
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
let selectedDataMetricId=null;
function renderData(){
 const base=report.metrics.filter(m=>m.method!=="ratio");
 if(!base.length){$("dataEditors").innerHTML="<p class='hint'>أضف مؤشرًا رقميًا أساسيًا حتى تتمكن من إدخال البيانات.</p>";return;}
 const metric=base.find(m=>m.id===selectedDataMetricId)||base[0];
 selectedDataMetricId=metric.id;
 const activeMonths=[...new Set(report.periods.flatMap(p=>p.months))].sort((a,b)=>a-b);
 const head=report.periods.map((p,i)=>`<th scope="col"><span>${escapeHTML(p.name||"الفترة "+(i+1))}</span><small>${escapeHTML(p.year)}</small></th>`).join("");
 const cells=activeMonths.map((month,row)=>`<tr><th scope="row">${MONTHS[month-1]}</th>${report.periods.map((p,col)=>{
  if(!p.months.includes(month))return '<td class="unused-cell"><span aria-label="شهر غير محدد">—</span></td>';
  const key=keyOf(p.id,month,metric.id),id="entry-"+row+"-"+col;
  return `<td><label class="sr-only" for="${id}">${escapeHTML(metric.name)}، ${escapeHTML(p.name||p.year)}، ${MONTHS[month-1]}</label><input id="${id}" type="number" min="0" step="any" data-entry="${escapeHTML(key)}" placeholder="—" value="${escapeHTML(report.entries[key]??"")}"></td>`;
 }).join("")}</tr>`).join("");
 $("dataEditors").innerHTML=`<div class="metric-tabs" role="group" aria-label="اختر مؤشرًا لإدخال قيمه">
 ${base.map(m=>`<button type="button" class="metric-tab ${m.id===metric.id?"active":""}" data-metric-tab="${escapeHTML(m.id)}" aria-pressed="${m.id===metric.id}">${escapeHTML(m.name)}</button>`).join("")}
 </div><p class="hint">القيم المعروضة للمؤشر: <strong>${escapeHTML(metric.name)}</strong> · ${escapeHTML(metric.unit)}. الخانة الفارغة تعني عدم توفر بيانات، وليست صفرًا.</p>
 <div class="entry-table-wrap"><table class="entry-table"><thead><tr><th scope="col">الشهر</th>${head}</tr></thead><tbody>${cells}</tbody></table></div>`;
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
 if(sections.some(section=>comparison(section.periods).some(p=>!p.comparable)))warnings.push("نسب التغير غير المعروضة تعني أن إحدى الفترات ناقصة البيانات أو أن الفترات مختلفة المدة؛ راجع الأشهر قبل المقارنة.");
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
$("dataEditors").addEventListener("click",e=>{const tab=e.target.closest("[data-metric-tab]");if(tab){selectedDataMetricId=tab.dataset.metricTab;renderData();}});
$("dataEditors").addEventListener("input",e=>{
 if(!e.target.dataset.entry)return;
 const raw=e.target.value;
 if(raw!==""&&(!Number.isFinite(Number(raw))||Number(raw)<0)){status("القيم يجب أن تكون غير سالبة.");return;}
 report.entries[e.target.dataset.entry]=raw===""?null:Number(raw);draw();scheduleSave();
});
function download(name,content,type){
 const url=URL.createObjectURL(new Blob([content],{type}));
 const a=document.createElement("a");a.href=url;a.download=name;
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),10000);
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
$("newReport").onclick=newReportAndOpen;
$("startNewReport").onclick=newReportAndOpen;
$("duplicateReport").onclick=()=>{if(library.length>=100)return status("الحد الأقصى 100 تقرير.");saveDraft();report=structuredClone(report);report.id=uid();report.title+=" (نسخة)";library.push(report);rerender();};
$("deleteReport").onclick=()=>{if(!confirm("حذف هذا التقرير نهائيًا من المكتبة؟"))return;clearTimeout(saveTimer);const deletedId=report.id;library=library.filter(r=>r.id!==deletedId);try{localStorage.removeItem("report-system-v2-record:"+deletedId);}catch{}if(!library.length){report=newReport();report.id=uid();library=[report];}else report=library[0];rerender();};
$("reportSelect").onchange=e=>{const selectedId=e.target.value;saveDraft();const selected=library.find(r=>r.id===selectedId);if(selected){report=selected;syncTop();renderMetrics();renderPeriods();renderData();draw();renderSections();renderLibrary();}};
$("backupAll").onclick=()=>{
 try{
  const json=makeLibraryBackup(library,report);
  // Validate the exact contents of the file before offering it for download.
  parseLibraryBackup(json);
  download("report-system-library-backup.json",json,"application/json;charset=utf-8");
  status("تم تجهيز نسخة احتياطية تضم "+library.length+" تقريرًا. احتفظ بالملف خارج المتصفح.");
 }catch(e){status("تعذر إعداد النسخة الاحتياطية: "+e.message);}
};
let restoringLibrary=false;
$("restoreAll").onchange=async e=>{
 const file=e.target.files?.[0];e.target.value="";if(!file||restoringLibrary)return;
 restoringLibrary=true;
 try{
  if(file.size>8*1024*1024)throw Error("النسخة الاحتياطية أكبر من 8 ميجابايت.");
  const restored=parseLibraryBackup(await file.text());
  if(!confirm("سيتم استبدال "+library.length+" تقريرًا حاليًا بـ "+restored.length+" تقريرًا من النسخة الاحتياطية. تأكد من حفظ نسخة من التقارير الحالية أولًا. هل تتابع؟"))return;
  // Cancel any pending autosave of the old library, and commit the new library
  // before showing a success message or changing the visible report.
  clearTimeout(saveTimer);
  await writeLibrary(restored);
  const previousIds=library.map(item=>item.id);
  library=restored;
  report=restored[0];
  let localSaved=true;
  try{
   localStorage.setItem(LIBRARY_KEY,JSON.stringify(restored));
   localStorage.setItem(KEY,JSON.stringify(report));
   localStorage.setItem(ACTIVE_KEY,report.id);
   for(const entry of restored)localStorage.setItem("report-system-v2-record:"+entry.id,JSON.stringify(entry));
   for(const id of previousIds)if(!restored.some(entry=>entry.id===id))localStorage.removeItem("report-system-v2-record:"+id);
  }catch(storageError){
   localSaved=false;
   // Avoid reading a stale library index on the next page load.
   try{localStorage.removeItem(LIBRARY_KEY);}catch{}
  }
  writeDraft(structuredClone(report)).catch(()=>{});
  syncTop();renderMetrics();renderPeriods();renderData();draw();renderSections();renderLibrary();showView("library");
  status(localSaved?
   "تمت استعادة "+restored.length+" تقريرًا من النسخة الاحتياطية بنجاح.":
   "تمت الاستعادة في IndexedDB، لكن مساحة التخزين الأخرى ممتلئة. احتفظ بملف النسخة الاحتياطية.");
 }catch(err){status("فشلت الاستعادة ولم تُستبدل المكتبة: "+err.message);}
 finally{restoringLibrary=false;}
};
document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>{
  if(button.dataset.view==="preview")openPreview();
  else {if(button.dataset.view==="library")saveDraft();showView(button.dataset.view);}
}));
$("backLibrary").onclick=()=>{saveDraft();showView("library");};
$("backToData").onclick=()=>showView("data");
$("continuePreview").onclick=openPreview;
$("continuePreviewBottom").onclick=openPreview;
$("reportCards").addEventListener("click",e=>{
  const card=e.target.closest("[data-open-report]");if(!card)return;
  const selected=library.find(r=>r.id===card.dataset.openReport);if(!selected)return;
  saveDraft();report=selected;syncTop();renderMetrics();renderPeriods();renderData();draw();renderSections();renderLibrary();
  localStorage.setItem(ACTIVE_KEY,report.id);
  showView("data");
});
$("print").onclick=()=>{try{validate(report);window.print();}catch(e){status(e.message);}};
syncTop();renderMetrics();renderPeriods();renderData();draw();renderSections();renderLibrary();
showView(location.hash.replace("#","")||"library");
// Recover the complete library from IndexedDB if localStorage was cleared or corrupted.
const needsRecovery=loadLibrary().length===0;
if(needsRecovery){
 readLibrary().then(async saved=>{
  const valid=Array.isArray(saved)?saved.flatMap(item=>{try{validate(item);return typeof item.id==="string"&&item.id?[item]:[];}catch{return [];}}):[];
  // The full library must take precedence over the legacy single-draft backup.
  if(valid.length&&!loadLibrary().length){
   library=valid.slice(0,100);
   report=library.find(r=>r.id===localStorage.getItem(ACTIVE_KEY))||library[0];
   syncTop();renderMetrics();renderPeriods();renderData();draw();renderSections();renderLibrary();
   status("تم استرداد مكتبة التقارير من قاعدة البيانات المحلية.");
   return;
  }
  if(valid.length||loadLibrary().length)return;
  const older=await readDraft();
  if(older){report=validate(older);report.id ||= uid();library=[report];
   syncTop();renderMetrics();renderPeriods();renderData();draw();renderSections();renderLibrary();
   status("تم استرداد المسودة القديمة.");
  }
 }).catch(()=>{});
}
