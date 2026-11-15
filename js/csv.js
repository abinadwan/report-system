import {metric,uid,keyOf} from "./engine.js";
// RFC4180-style CSV parser with quoted fields, escaped quotes and embedded newlines.
export function parseCSV(text){
 if(typeof text!=="string"||!text.trim())throw Error("ملف CSV فارغ.");
 const rows=[];let row=[],value="",quoted=false;
 const input=text.charCodeAt(0)===0xFEFF?text.slice(1):text;
 for(let i=0;i<input.length;i++){
  const c=input[i],next=input[i+1];
  if(c==='"'){if(quoted&&next==='"'){value+='"';i++;}else if(quoted){quoted=false;}else if(!value){quoted=true;}else throw Error("علامات الاقتباس في CSV غير صالحة.");}
  else if(c===","&&!quoted){row.push(value);value="";}
  else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&next==="\n")i++;row.push(value);value="";if(row.some(v=>v!==""))rows.push(row);row=[];}
  else value+=c;
 }
 if(quoted)throw Error("حقل مقتبس غير مغلق في CSV.");
 row.push(value);if(row.some(v=>v!==""))rows.push(row);
 if(rows.length<2)throw Error("ملف CSV لا يحتوي على صف بيانات.");
 const headers=rows.shift().map(x=>x.trim());
 if(new Set(headers).size!==headers.length)throw Error("أسماء أعمدة مكررة.");
 if(rows.length>36000)throw Error("ملف CSV يتجاوز حد 36000 صف.");
 return rows.map((r,i)=>{if(r.length!==headers.length)throw Error("اختلاف عدد الأعمدة في الصف "+(i+2));return Object.fromEntries(headers.map((h,j)=>[h,r[j].trim()]));});
}
export const EXAMPLE_HEADER="periodId,period,year,month,metric,value";
export function readLongFormat(rows){
 // Enforced explicit, documented schema avoids silently guessing user columns.
 if(!rows.length)throw Error("لا توجد صفوف.");
 for(const h of ["year","month","metric","value"])if(!Object.hasOwn(rows[0],h))throw Error("عمود مفقود: "+h);
 return rows.map((r,i)=>{
  const year=Number(r.year),month=Number(r.month);
  if(!/^\d{4}$/.test(r.year)||year<1000||!Number.isInteger(month)||month<1||month>12||!r.metric.trim())throw Error("السنة أو الشهر أو اسم المؤشر غير صالح في الصف "+(i+2));
  if(r.value===""||!Number.isFinite(Number(r.value))||Number(r.value)<0)throw Error("القيمة غير صالحة في الصف "+(i+2));
  // periodId is an optional stable identifier (present in exported files); legacy files fall back to the name.
  const periodId=String(r.periodId??"").trim();
  if(periodId.length>100)throw Error("معرّف الفترة طويل جدًا في الصف "+(i+2));
  return {period:periodId?String(r.period??"").trim():String(r.period||String(year)).trim(),periodId,year,month,metric:r.metric.trim(),value:Number(r.value)};
 });
}
export function encodeCSV(rows){
 const q=s=>'"'+String(s??"").replaceAll('"','""')+'"';
 // The stable periodId column keeps same-named or same-year periods distinct across an export/import round trip.
 return [EXAMPLE_HEADER,...rows.map(r=>[r.periodId??"",r.period??String(r.year),r.year,r.month,r.metric,r.value].map(q).join(","))].join("\r\n");
}

const AR_MONTHS=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
// Case-insensitive English aliases and common Arabic spelling variants (e.g. without hamza).
const MONTH_ALIASES={"يناير":1,"كانون الثاني":1,"january":1,"jan":1,"فبراير":2,"شباط":2,"february":2,"feb":2,"مارس":3,"آذار":3,"اذار":3,"march":3,"mar":3,"أبريل":4,"ابريل":4,"نيسان":4,"april":4,"apr":4,"مايو":5,"أيار":5,"ايار":5,"may":5,"يونيو":6,"حزيران":6,"june":6,"jun":6,"يوليو":7,"تموز":7,"july":7,"jul":7,"أغسطس":8,"اغسطس":8,"آب":8,"اب":8,"august":8,"aug":8,"سبتمبر":9,"أيلول":9,"ايلول":9,"september":9,"sep":9,"sept":9,"أكتوبر":10,"اكتوبر":10,"تشرين الأول":10,"تشرين الاول":10,"october":10,"oct":10,"نوفمبر":11,"تشرين الثاني":11,"november":11,"nov":11,"ديسمبر":12,"كانون الأول":12,"كانون الاول":12,"december":12,"dec":12};
function monthFromText(raw){
 const normalized=String(raw??"").trim().toLowerCase();
 if(!normalized)return null;
 const byArabic=AR_MONTHS.indexOf(normalized)+1;
 if(byArabic)return byArabic;
 return MONTH_ALIASES[normalized]??null;
}
const DIGITS="٠١٢٣٤٥٦٧٨٩";
function ascii(value){return String(value??"").replace(/[٠-٩]/g,ch=>String(DIGITS.indexOf(ch))).replace(/[۰-۹]/g,ch=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(ch)));}
function recognized(row,aliases){return Object.keys(row).find(k=>aliases.includes(k.trim().toLowerCase()));}
export function readFlexibleFormat(rows){
 if(!rows.length)throw Error("لا توجد صفوف للاستيراد.");
 const first=rows[0],yearCol=recognized(first,["year","السنة","سنه"]),monthCol=recognized(first,["month","الشهر"]),dateCol=recognized(first,["date","التاريخ"]);
 const metricCol=recognized(first,["metric","المؤشر"]),valueCol=recognized(first,["value","القيمة"]),periodCol=recognized(first,["period","الفترة"]);
 const periodIdCol=recognized(first,["periodid","period_id","معرّف الفترة","معرف الفترة"]);
 if(metricCol&&valueCol){
  const normalized=rows.map(r=>({
   year:ascii(r[yearCol||"year"]),month:ascii(r[monthCol||"month"]),metric:r[metricCol],value:ascii(r[valueCol]),
   ...(periodCol?{period:r[periodCol]}:{}),
   ...(periodIdCol?{periodId:r[periodIdCol]}:{})
  }));
  return readLongFormat(normalized);
 }
 if((!yearCol||!monthCol)&&!dateCol)throw Error("يلزم عمودا Year وMonth، أو عمود Date، مع أعمدة المؤشرات.");
 const ignored=new Set([yearCol,monthCol,dateCol,periodCol,periodIdCol].filter(Boolean));
 const columns=Object.keys(first).filter(k=>!ignored.has(k));
 if(!columns.length)throw Error("لا توجد أعمدة مؤشرات.");
 const out=[];
 rows.forEach((row,index)=>{
   let year,month;
   if(dateCol){
     const match=ascii(row[dateCol]).match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/);
     if(!match)throw Error("التاريخ غير صالح في الصف "+(index+2)+"؛ استخدم YYYY-MM أو YYYY-MM-DD.");
     year=Number(match[1]);month=Number(match[2]);
   }else{
     year=Number(ascii(row[yearCol]));
     const raw=ascii(row[monthCol]).trim();
     month=monthFromText(raw)??Number(raw);
   }
   if(!Number.isInteger(year)||year<1000||year>9999||!Number.isInteger(month)||month<1||month>12)throw Error("السنة أو الشهر غير صالح في الصف "+(index+2));
   const period=periodIdCol?(periodCol?row[periodCol]:""):(periodCol?row[periodCol]:String(year))||String(year);
   const periodId=periodIdCol?String(row[periodIdCol]??"").trim():"";
   if(periodId.length>100)throw Error("معرّف الفترة طويل جدًا في الصف "+(index+2));
   for(const col of columns){
     if(row[col]==="")continue;
     const value=Number(ascii(row[col]));
     if(!Number.isFinite(value)||value<0)throw Error("قيمة غير صالحة للمؤشر "+col+" في الصف "+(index+2));
     out.push({period:String(period).trim(),periodId,year,month,metric:col,value});
   }
 });
 if(!out.length)throw Error("لا توجد قيم رقمية في الملف.");
 return out;
}

// Build a report from parsed CSV/XLSX rows without relying on UI state.
// New exports group by stable periodId; legacy files group by their label and year.
export function buildImportedData(data){
 if(!Array.isArray(data)||!data.length)throw Error("لا توجد بيانات للاستيراد.");
 const groups=new Map(),metricsByName=new Map(),seen=new Set();
 for(const row of data){
  const periodId=String(row.periodId||"");
  const year=Number(row.year),month=Number(row.month);
  const name=String(row.period??"");
  const metricName=String(row.metric??"").trim();
  if(!Number.isInteger(year)||year<1000||year>9999||!Number.isInteger(month)||month<1||month>12||!metricName||metricName.length>100||name.length>100||periodId.length>100||!Number.isFinite(row.value)||row.value<0)throw Error("صف استيراد غير صالح.");
  const key=periodId?"id:"+periodId:"legacy:"+JSON.stringify([name,year]);
  if(!groups.has(key)){
   const id=periodId||uid();
   groups.set(key,{id,name,year,months:new Set()});
  }
  const p=groups.get(key);
  if(p.year!==year||p.name!==name)throw Error("معرّف الفترة مستخدم مع سنة أو اسم مختلف.");
  const triple=JSON.stringify([key,month,metricName]);
  if(seen.has(triple))throw Error("صف مكرر لنفس الفترة والشهر والمؤشر.");
  seen.add(triple);p.months.add(month);
  if(!metricsByName.has(metricName))metricsByName.set(metricName,metric(metricName,"","sum"));
 }
 if(groups.size>100||metricsByName.size>30)throw Error("الملف يتجاوز الحد الأقصى للفترات أو المؤشرات.");
 // Avoid collisions if an external file mixes generated legacy IDs with explicit IDs.
 const reserved=new Set(data.map(r=>r.periodId).filter(Boolean));
 for(const [key,p] of groups)if(key.startsWith("legacy:")){while(reserved.has(p.id))p.id=uid();reserved.add(p.id);}
 const periods=[...groups.values()].map(p=>({id:p.id,name:p.name,year:p.year,months:[...p.months].sort((a,b)=>a-b)}));
 const metrics=[...metricsByName.values()];
 const entries={};
 for(const row of data){
  const key=row.periodId?"id:"+row.periodId:"legacy:"+JSON.stringify([row.period,row.year]);
  const p=groups.get(key),m=metricsByName.get(row.metric.trim());
  entries[keyOf(p.id,Number(row.month),m.id)]=row.value;
 }
 return {periods,metrics,entries};
}
