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
 return rows.map((r,i)=>{if(r.length!==headers.length)throw Error("اختلاف عدد الأعمدة في الصف "+(i+2));return Object.fromEntries(headers.map((h,j)=>[h,r[j].trim()]));});
}
export const EXAMPLE_HEADER="year,month,metric,value";
export function readLongFormat(rows){
 // Enforced explicit, documented schema avoids silently guessing user columns.
 if(!rows.length)throw Error("لا توجد صفوف.");
 for(const h of ["year","month","metric","value"])if(!Object.hasOwn(rows[0],h))throw Error("عمود مفقود: "+h);
 return rows.map((r,i)=>{
  const year=Number(r.year),month=Number(r.month);
  if(!/^\d{4}$/.test(r.year)||year<1000||!Number.isInteger(month)||month<1||month>12||!r.metric.trim())throw Error("السنة أو الشهر أو اسم المؤشر غير صالح في الصف "+(i+2));
  if(r.value===""||!Number.isFinite(Number(r.value))||Number(r.value)<0)throw Error("القيمة غير صالحة في الصف "+(i+2));
  return {year,month,metric:r.metric.trim(),value:Number(r.value)};
 });
}
export function encodeCSV(rows){
 const q=s=>'"'+String(s??"").replaceAll('"','""')+'"';
 return [EXAMPLE_HEADER,...rows.map(r=>[r.year,r.month,r.metric,r.value].map(q).join(","))].join("\r\n");
}
