export const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
export const PRESETS = {year:[1,2,3,4,5,6,7,8,9,10,11,12],h1:[1,2,3,4,5,6],h2:[7,8,9,10,11,12],q1:[1,2,3],q2:[4,5,6],q3:[7,8,9],q4:[10,11,12]};
export const TEMPLATES = {
  general:{label:"عام",metric:"عدد المعاملات",unit:"معاملة",aggregation:"sum"},
  "call-center":{label:"مركز الاتصال",metric:"المكالمات الواردة",unit:"مكالمة",aggregation:"sum"},
  projects:{label:"إدارة المشاريع",metric:"المهام المنجزة",unit:"مهمة",aggregation:"sum"},
  sales:{label:"المبيعات",metric:"إجمالي المبيعات",unit:"ر.س",aggregation:"sum"}
};
export const makePeriod = (year = new Date().getFullYear()) => ({id:globalThis.crypto?.randomUUID?.() ?? String(Date.now())+"-"+Math.random(),name:"",year,months:[...PRESETS.year],values:{}});
export const newReport = () => ({version:2,title:"تقرير الأداء",type:"comparison",template:"general",metric:{name:"عدد المعاملات",unit:"معاملة",aggregation:"sum"},periods:[makePeriod(),makePeriod(new Date().getFullYear()-1)]});
export function validYear(year){return Number.isInteger(Number(year)) && Number(year)>=1000 && Number(year)<=9999 && /^\d{4}$/.test(String(year));}
export function validateReport(report){
 if(!report || report.version!==2 || !Array.isArray(report.periods) || !report.periods.length)throw new Error("صيغة التقرير غير صالحة.");
 if(report.periods.length>100)throw new Error("عدد الفترات كبير جدًا.");
 if(!["sum","average"].includes(report.metric?.aggregation))throw new Error("طريقة حساب غير معروفة.");
 if(!TEMPLATES[report.template] || !["comparison","periodic","trend","executive"].includes(report.type))throw new Error("نوع التقرير أو القالب غير معروف.");
 const ids=new Set();
 for(const p of report.periods){
  if(typeof p.id!=="string"||ids.has(p.id))throw new Error("معرّفات الفترات غير صالحة.");ids.add(p.id);
  if(!validYear(p.year))throw new Error("الرجاء إدخال سنة صحيحة من أربعة أرقام.");
  if(!Array.isArray(p.months)||!p.months.length||new Set(p.months).size!==p.months.length||p.months.some(m=>!Number.isInteger(m)||m<1||m>12))throw new Error("اختر أشهرًا صحيحة لكل فترة.");
  for(const m of p.months){const value=p.values?.[m];if(value!==""&&value!=null&&(!Number.isFinite(Number(value))||Number(value)<0))throw new Error("القيم يجب أن تكون أرقامًا غير سالبة.");}
 }
 return report;
}
export function computeReport(report){
 validateReport(report);
 return report.periods.map(p=>{
  const months=[...p.months].sort((a,b)=>a-b);
  const entries=months.map(month=>({month,value:p.values?.[month]===undefined||p.values?.[month]===""||p.values?.[month]===null?null:Number(p.values[month])}));
  const valid=entries.filter(e=>e.value!==null);
  const total=valid.reduce((sum,e)=>sum+e.value,0);
  const monthlyAverage=valid.length?total/valid.length:null;
  const result=valid.length?(report.metric.aggregation==="average"?monthlyAverage:total):null;
  return {id:p.id,label:p.name.trim()||String(p.year)+" — "+(months.length===12?"سنة كاملة":months.map(m=>MONTHS[m-1]).join("، ")),year:p.year,months,entries,result,total,monthlyAverage,available:valid.length,expected:months.length,complete:valid.length===months.length};
 });
}
export function compareResults(rows){
 const base=rows[0]?.result;
 return rows.map(r=>({...r,change:base===null||base===undefined||r.result===null||r.result===undefined||base===0?null:((r.result-base)/Math.abs(base))*100}));
}
export function formatNumber(value){return value===null||value===undefined?"—":new Intl.NumberFormat("ar-SA",{maximumFractionDigits:2}).format(value);}
