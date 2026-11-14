// Localized UI only. Report names, metric values, IDs, and saved JSON are never translated.
const LANGUAGE_KEY="report-system-language";
const WORDS={
"منصة التقارير المرنة":"Flexible reporting workspace",
"يتناول التقرير":"This report covers",
"أعلى نتيجة لمؤشر":"The highest result for",
"فترة و":"periods and",
"فترة و":"periods and",
"مؤشرًا.":"metrics.",
"تقريرًا.":"reports.",
"نتيجة":"result",
"البيانات":"data",
"مؤشرًا":"metrics",
"الفترة":"Period",
"تقاريري":"My reports",
"إدخال البيانات":"Data entry",
"عرض التقرير":"Report preview",
"عرض المؤشرات":"View insights",
"أنشئ تقريرًا أو افتح أحد تقاريرك السابقة":"Create a new report or open a saved one.",
"إنشاء تقرير":"+ New report",
"+ إنشاء تقرير":"+ New report",
"تقرير جديد":"New report",
"تقرير أداء جديد":"New performance report",
"تقارير محفوظة على هذا الجهاز":"Reports saved on this device",
"محفوظة على هذا الجهاز":"Saved on this device",
"اختر تقريرًا":"Select a report",
"نسخ":"Duplicate",
"حذف":"Delete",
"نسخ احتياطي للكل":"Back up library",
"استعادة المكتبة":"Restore library",
"التقارير محفوظة على هذا الجهاز. احتفظ بنسخة JSON احتياطية.":"Reports are stored on this device. Keep a JSON backup.",
"حدد الهدف والفترات والمؤشرات، ثم أدخل البيانات أو استوردها.":"Set your report goal, periods, and metrics, then enter or import your data.",
"عرض المؤشرات ←":"View insights →",
"اسم التقرير":"Report title",
"الهدف":"Report type",
"مقارنة أداء":"Performance comparison",
"تقرير دوري":"Periodic report",
"تحليل الاتجاهات":"Trend analysis",
"ملخص تنفيذي":"Executive summary",
"القالب":"Template",
"تقرير عام":"General report",
"مركز الاتصال":"Contact center",
"المشاريع":"Projects",
"المبيعات":"Sales",
"1. المؤشرات":"1. Metrics",
"أضف المؤشرات المطلوبة وحدد طريقة حساب كل واحد.":"Add metrics and choose how each one is calculated.",
"+ مؤشر":"+ Metric",
"2. فترات التحليل":"2. Analysis periods",
"اختر أي سنوات وأشهر، ويمكن تكرار السنة لفترات مختلفة.":"Choose any years or months, including overlapping periods.",
"+ فترة":"+ Period",
"3. البيانات":"3. Data",
"أدخل القيم يدويًا أو استورد Excel أو CSV بجدول أعمدته سنة وشهر ومؤشرات، أو بنمط year,month,metric,value.":"Enter monthly values or import a CSV / Excel file containing year, month, and metric columns.",
"استيراد Excel / CSV":"Import Excel / CSV",
"تنزيل CSV":"Export CSV",
"عند استيراد CSV ستُضاف السنوات والمؤشرات الموجودة في الملف تلقائيًا. القيم المتكررة للثلاثية (سنة، شهر، مؤشر) مرفوضة لتجنب الحساب المزدوج.":"CSV import creates the available periods and metrics. Duplicate year/month/metric combinations are rejected.",
"4. محتويات التقرير":"4. Report sections",
"ملخص":"Summary",
"رسوم مقارنة":"Charts",
"جدول تفصيلي":"Detail table",
"5. الحفظ والتصدير":"5. Save and export",
"حفظ":"Save",
"نسخة JSON":"Back up report",
"استيراد JSON":"Import report",
"مسح محتوى التقرير":"Reset this report",
"الحفظ محلي في المتصفح. احتفظ بنسخة احتياطية لأن حذف بيانات المتصفح يحذف التقرير.":"Your data is stored in this browser. Export a backup before clearing browser storage.",
"العودة لتقاريري":"Back to reports",
"راجع النتائج وملاحظات اكتمال البيانات قبل طباعة التقرير.":"Review indicators and data quality notes before exporting.",
"تعديل البيانات":"Edit data",
"تقرير تحليلي":"Analytics report",
"ملخص الأداء":"Performance summary",
"مقارنة المؤشرات":"Metric comparisons",
"تفاصيل المقارنة":"Comparison details",
"طباعة / حفظ PDF":"Print / Save PDF",
"المؤشرات محسوبة من بيانات المستخدم":"Results are calculated from the data you enter",
"تقرير بدون عنوان":"Untitled report",
"التقرير المحدد":"Selected report",
"فتح التقرير وإدخال البيانات ←":"Open report and enter data →",
"فترة":"period",
"فترات":"periods",
"مؤشر":"metric",
"أشهر":"months",
"شهر":"month",
"أشهر مختارة":"selected months",
"الأشهر":"Months",
"عنوان اختياري":"Optional label",
"السنة":"Year",
"سنة كاملة":"Full year",
"النصف الأول":"First half",
"النصف الثاني":"Second half",
"الربع الأول":"First quarter",
"الربع الثاني":"Second quarter",
"الربع الثالث":"Third quarter",
"الربع الرابع":"Fourth quarter",
"تحديد يدوي":"Custom months",
"اسم المؤشر":"Metric name",
"الوحدة":"Unit",
"الحساب":"Calculation",
"مجموع":"Sum",
"متوسط الأشهر":"Monthly average",
"نسبة مرجحة (البسط ÷ المقام)":"Weighted ratio (numerator / denominator)",
"البسط":"Numerator",
"المقام":"Denominator",
"اختر مؤشرًا":"Select metric",
"أضف مؤشرًا رقميًا أساسيًا حتى تتمكن من إدخال البيانات.":"Add at least one numeric metric to enter data.",
"اختر مؤشرًا لإدخال قيمه":"Choose a metric to edit its values",
"القيم المعروضة للمؤشر:":"Values shown for:",
"الخانة الفارغة تعني عدم توفر بيانات، وليست صفرًا.":"Blank cells mean missing data, not zero.",
"شهر غير محدد":"Month not selected",
"أعلى":"Up",
"الأسفل":"Down",
"الرسوم البيانية":"Charts",
"الجداول":"Tables",
"النتيجة":"Result",
"متوسط الشهر":"Monthly average",
"التغير عن الأولى":"Change vs first",
"تغطية البيانات":"Data coverage",
"المؤشر":"Metric",
"خلال":"during",
"كانت":"was",
"لا تتوفر بيانات كافية لصياغة ملخص رقمي. أدخل القيم الشهرية أولًا.":"There is not enough data for a numerical summary. Enter monthly values first.",
"النتائج وصفية ولا تشير وحدها إلى جودة الأداء.":"These figures are descriptive; they do not establish performance quality.",
"هناك أشهر دون بيانات. النتائج تستند إلى الأشهر المدخلة فقط.":"Some months have no data. Results use only the available monthly values.",
"الفترات مختلفة الطول؛ المقارنة بين الإجماليات قد تكون مضللة. استخدم المتوسط الشهري أو فترات متساوية.":"Period lengths differ. Comparing totals may mislead; use equivalent periods or monthly averages.",
"نسب التغير غير المعروضة تعني أن إحدى الفترات ناقصة البيانات أو أن الفترات مختلفة المدة؛ راجع الأشهر قبل المقارنة.":"Missing change percentages indicate incomplete or unequal periods. Review the months before comparing.",
"متوسط الأشهر غير مرجح؛ لا تستخدمه لحساب نسب تشغيلية مجمعة مثل معدل الإجابة.":"Monthly averages are unweighted; do not use them for aggregate operational rates.",
"تحسب النسبة من مجموع البسط ÷ مجموع المقام × 100 للأشهر ذات البيانات المشتركة.":"The ratio is calculated as total numerator / total denominator × 100 for months with both values.",
"مكالمة":"call",
"مهمة":"task",
"معاملة":"transaction",
"ر.س":"SAR",
"طلب":"order",
"عدد المعاملات":"Transactions",
"المكالمات الواردة":"Incoming calls",
"المكالمات المجابة":"Answered calls",
"معدل الإجابة":"Answer rate",
"المهام المكتملة":"Completed tasks",
"المهام الجديدة":"New tasks",
"إجمالي المبيعات":"Total sales",
"عدد الطلبات":"Orders",
"مؤشر جديد":"New metric",
"يناير":"January",
"فبراير":"February",
"مارس":"March",
"أبريل":"April",
"مايو":"May",
"يونيو":"June",
"يوليو":"July",
"أغسطس":"August",
"سبتمبر":"September",
"أكتوبر":"October",
"نوفمبر":"November",
"ديسمبر":"December",
"مثال: النصف الأول":"e.g. First half",
"لا توجد بيانات":"No data",
"تم الحفظ على هذا المتصفح.":"Saved to this browser.",
"راجع البيانات قبل الحفظ:":"Check the data before saving:",
"تعذر تحديث النسخة الاحتياطية في قاعدة البيانات:":"Could not update IndexedDB backup:",
"الحفظ المحلي ممتلئ؛ صدّر نسخة JSON وتحقق من حفظ IndexedDB.":"Browser storage is full. Export a JSON backup and check IndexedDB.",
"راجع البيانات قبل عرض المؤشرات:":"Review data before viewing insights:",
"الحد الأقصى 100 تقرير.":"Maximum 100 reports.",
"الحد الأقصى 100 فترة.":"Maximum 100 periods.",
"الحد الأقصى 30 مؤشرًا.":"Maximum 30 metrics.",
"المؤشر مستخدم في حساب نسبة. عدّل النسبة أولًا.":"This metric is used in a ratio. Edit that ratio first.",
"القيم يجب أن تكون غير سالبة.":"Values must be nonnegative.",
"تم إعداد CSV. لا يتضمن الأشهر الفارغة.":"CSV prepared. Blank months are omitted.",
"تعذر استيراد البيانات:":"Data import failed:",
"تم استيراد النسخة.":"Report imported.",
"تم استرداد مكتبة التقارير من قاعدة البيانات المحلية.":"Report library recovered from IndexedDB.",
"تم استرداد المسودة القديمة.":"Older draft recovered.",
"تمت الاستعادة في IndexedDB، لكن مساحة التخزين الأخرى ممتلئة. احتفظ بملف النسخة الاحتياطية.":"Restored to IndexedDB, but local storage is full. Keep your backup file.",
"فشلت الاستعادة ولم تُستبدل المكتبة:":"Restore failed. The current library was not replaced:",
"تعذر إعداد النسخة الاحتياطية:":"Could not create backup:",
"تم تجهيز نسخة احتياطية تضم":"Prepared a backup containing",
"تقريرًا. احتفظ بالملف خارج المتصفح.":"reports. Store the file outside this browser.",
"تمت استعادة":"Restored",
"تقريرًا من النسخة الاحتياطية بنجاح.":"reports from the backup successfully.",
"استوردت":"Imported",
"قيمة.":"values.",
"عدد الفترات":"Number of periods",
"نوع التقرير":"Report type",
"تغيير القالب سيستبدل جميع المؤشرات والقيم المدخلة. هل تريد المتابعة؟":"Changing the template will replace all metrics and entered values. Continue?",
"سيتم مسح محتوى التقرير الحالي. هل حفظت نسخة احتياطية؟":"Reset this report? Export a backup first if needed.",
"حذف هذا التقرير نهائيًا من المكتبة؟":"Permanently delete this report from the library?",
"سيتم استبدال":"Replace",
"تقريرًا حاليًا بـ":"current reports with",
"تقريرًا من النسخة الاحتياطية. تأكد من حفظ نسخة من التقارير الحالية أولًا. هل تتابع؟":"reports from the backup? Back up the current library first. Continue?",
"استبدال التقرير الحالي بالنسخة الاحتياطية؟":"Replace this report with the selected backup?",
"سيستبدل الاستيراد الفترات والمؤشرات والقيم الحالية. هل تريد المتابعة؟":"Import will replace the current periods, metrics, and values. Continue?",
"تحريك":"Move",
"للأعلى":"up",
"للأسفل":"down",
"لا يمكن أن يتجاوز البسط المقام في":"Numerator cannot exceed denominator in",
"الرجاء إدخال سنة صحيحة.":"Enter a valid year.",
"الأشهر المختارة غير صالحة.":"Selected months are invalid.",
"هذا ليس ملف مكتبة تقارير. استخدم الملف الناتج عن «نسخ احتياطي للكل»، وليس نسخة تقرير منفرد.":"This is not a report-library backup. Select the file created with Back up library, not an individual report backup.",
"ملف النسخة الاحتياطية لا يحتوي على مكتبة تقارير صالحة (1–100 تقرير).":"The backup must contain between 1 and 100 reports.",
"الملف ليس JSON صالحًا. اختر ملف «نسخ احتياطي للكل».":"Invalid JSON. Select a report-library backup file.",
"الملف فارغ.":"The file is empty.",
"الملف كبير جدًا.":"The file is too large.",
"النسخة الاحتياطية أكبر من 8 ميجابايت.":"The backup exceeds the 8 MB size limit.",
"English":"English",
"العربية":"العربية",
"اللغة":"Language",
"رخصة MIT":"MIT License",
"مفتوح المصدر":"Open source",
"© 2026 المساهمون في Report System. متاح بموجب رخصة MIT.":"© 2026 Report System contributors. Licensed under MIT.",
"منصة تقارير تعمل محليًا وتحترم خصوصية البيانات.":"Local-first reporting that keeps your data in your browser."
};
const ENTRIES=Object.entries(WORDS).sort((a,b)=>b[0].length-a[0].length);
let lang;
try{lang=localStorage.getItem(LANGUAGE_KEY)==="en"?"en":"ar";}catch{lang="ar";}
const originalText=new WeakMap();
const originalAttrs=new WeakMap();
const SKIP=new Set(["SCRIPT","STYLE","NOSCRIPT","TEXTAREA","CODE"]);
export function locale(){return lang;}
export function translateText(value){
 const valueString=String(value??"");
 if(lang==="ar")return valueString;
 if(WORDS[valueString])return WORDS[valueString];
 let result=valueString;
 for(const [ar,en] of ENTRIES){
  if(result.includes(ar))result=result.split(ar).join(en);
 }
 return result
  .replace(/Period\s+(\d+)/g,"Period $1")
  .replace(/Metric\s+(\d+)/g,"Metric $1");
}
function translateNode(node){
 const prior=originalText.get(node);
 const current=node.nodeValue;
 const source=prior&&current===prior.last?prior.source:current;
 const output=lang==="ar"?source:translateText(source);
 originalText.set(node,{source,last:output});
 if(current!==output)node.nodeValue=output;
}
function translateAttribute(element,attr){
 const old=originalAttrs.get(element)||{};
 const current=element.getAttribute(attr);
 if(current===null)return;
 const prior=old[attr];
 const source=prior&&prior.last===current?prior.source:current;
 const output=lang==="ar"?source:translateText(source);
 old[attr]={source,last:output};originalAttrs.set(element,old);
 if(current!==output)element.setAttribute(attr,output);
}
function translateSubtree(root){
 if(root.nodeType===Node.TEXT_NODE){translateNode(root);return;}
 if(root.nodeType!==Node.ELEMENT_NODE||SKIP.has(root.tagName)||root.hasAttribute("data-no-i18n"))return;
 for(const attr of ["placeholder","aria-label","title","alt"])translateAttribute(root,attr);
 for(const child of root.childNodes)translateSubtree(child);
}
let translating=false;
export function applyLocale(){
 if(translating)return;
 translating=true;
 document.documentElement.lang=lang;
 document.documentElement.dir=lang==="ar"?"rtl":"ltr";
 document.title=lang==="ar"?"Report System — منصة التقارير":"Report System — Reporting Workspace";
 document.querySelectorAll("[data-lang-label]").forEach(el=>{el.textContent=lang==="ar"?"English":"العربية";});
 translateSubtree(document.body);
 translating=false;
}
export function setLocale(next){
 if(next!== "ar"&&next!=="en")return;
 lang=next;
 try{localStorage.setItem(LANGUAGE_KEY,lang);}catch{}
 applyLocale();
}
export function startLocalization(){
 applyLocale();
 const observer=new MutationObserver(records=>{
  if(translating)return;
  translating=true;
  for(const item of records){
   if(item.type==="characterData"){
    if(item.target.parentElement?.closest("[data-no-i18n],script,style,noscript,textarea,code"))continue;
    translateNode(item.target);
   }else if(item.type==="attributes"){
    if(!item.target.closest("[data-no-i18n]"))translateAttribute(item.target,item.attributeName);
   }else for(const child of item.addedNodes){
    if(child.parentElement?.closest("[data-no-i18n]"))continue;
    translateSubtree(child);
   }
  }
  translating=false;
 });
 observer.observe(document.body,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["placeholder","aria-label","title","alt"]});
}
