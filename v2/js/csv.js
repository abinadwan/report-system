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
export const EXAMPLE_HEADER="period,year,month,metric,value";
export function readLongFormat(rows){
 // Enforced explicit, documented schema avoids silently guessing user columns.
 if(!rows.length)throw Error("لا توجد صفوف.");
 for(const h of ["year","month","metric","value"])if(!Object.hasOwn(rows[0],h))throw Error("عمود مفقود: "+h);
 return rows.map((r,i)=>{
  const year=Number(r.year),month=Number(r.month);
  if(!/^\d{4}$/.test(r.year)||year<1000||!Number.isInteger(month)||month<1||month>12||!r.metric.trim())throw Error("السنة أو الشهر أو اسم المؤشر غير صالح في الصف "+(i+2));
  if(r.value===""||!Number.isFinite(Number(r.value))||Number(r.value)<0)throw Error("القيمة غير صالحة في الصف "+(i+2));
  return {period:(r.period||String(year)).trim(),year,month,metric:r.metric.trim(),value:Number(r.value)};
 });
}
export function encodeCSV(rows){
 const q=s=>'"'+String(s??"").replaceAll('"','""')+'"';
 return [EXAMPLE_HEADER,...rows.map(r=>[r.period??String(r.year),r.year,r.month,r.metric,r.value].map(q).join(","))].join("\r\n");
}

const AR_MONTHS=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DIGITS="٠١٢٣٤٥٦٧٨٩";
function ascii(value){return String(value??"").replace(/[٠-٩]/g,ch=>String(DIGITS.indexOf(ch))).replace(/[۰-۹]/g,ch=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(ch)));}
function recognized(row,aliases){return Object.keys(row).find(k=>aliases.includes(k.trim().toLowerCase()));}
export function readFlexibleFormat(rows){
 if(!rows.length)throw Error("لا توجد صفوف للاستيراد.");
 const first=rows[0],yearCol=recognized(first,["year","السنة","سنه"]),monthCol=recognized(first,["month","الشهر"]),dateCol=recognized(first,["date","التاريخ"]);
 const metricCol=recognized(first,["metric","المؤشر"]),valueCol=recognized(first,["value","القيمة"]),periodCol=recognized(first,["period","الفترة"]);
 if(metricCol&&valueCol){
  const normalized=rows.map(r=>({
   year:ascii(r[yearCol||"year"]),month:ascii(r[monthCol||"month"]),metric:r[metricCol],value:ascii(r[valueCol]),
   ...(periodCol?{period:r[periodCol]}:{})
  }));
  return readLongFormat(normalized);
 }
 if((!yearCol||!monthCol)&&!dateCol)throw Error("يلزم عمودا Year وMonth، أو عمود Date، مع أعمدة المؤشرات.");
 const ignored=new Set([yearCol,monthCol,dateCol,periodCol].filter(Boolean));
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
     month=AR_MONTHS.indexOf(raw)+1;
     if(month===0)month=Number(raw);
   }
   if(!Number.isInteger(year)||year<1000||year>9999||!Number.isInteger(month)||month<1||month>12)throw Error("السنة أو الشهر غير صالح في الصف "+(index+2));
   const period=(periodCol?row[periodCol]:String(year))||String(year);
   for(const col of columns){
     if(row[col]==="")continue;
     const value=Number(ascii(row[col]));
     if(!Number.isFinite(value)||value<0)throw Error("قيمة غير صالحة للمؤشر "+col+" في الصف "+(index+2));
     out.push({period:String(period).trim(),year,month,metric:col,value});
   }
 });
 if(!out.length)throw Error("لا توجد قيم رقمية في الملف.");
 return out;
}
