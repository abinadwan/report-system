import {newReport,period,metric,keyOf,validate} from "./engine.js";
const numbers=values=>Array.isArray(values)?values:[];
const clean=value=>typeof value==="number"&&Number.isFinite(value)&&value>=0?value:null;
// Converts V1 call volumes; other V1 fields are preserved as metadata for traceability.
export function migrateLegacyReports(input){
 if(!Array.isArray(input))throw Error("صيغة تقارير V1 غير صالحة.");
 if(input.length>100)throw Error("عدد التقارير القديمة كبير جدًا.");
 return input.map((old,i)=>{
  if(!old||typeof old!=="object")throw Error("تقرير قديم غير صالح.");
  const report=newReport();
  report.title=String(old.general?.title||old.name||"تقرير من النسخة السابقة").slice(0,250);
  report.kind="comparison";
  report.template="call-center";
  report.periods=[{...period(2025),months:[1,2,3,4,5,6,7,8,9,10,11,12],name:"2025"},{...period(2026),months:[1,2,3],name:"الربع الأول 2026"}];
  report.metrics=[metric("المكالمات الواردة","مكالمة","sum")];
  report.entries={};
  const m=report.metrics[0],full=report.periods[0],quarter=report.periods[1];
  numbers(old.calls2025).slice(0,12).forEach((v,index)=>{const n=clean(v);if(n!==null)report.entries[keyOf(full.id,index+1,m.id)]=n;});
  const q=old.q1_2026||{};
  [q.jan,q.feb,q.mar].forEach((v,index)=>{const n=clean(v);if(n!==null)report.entries[keyOf(quarter.id,index+1,m.id)]=n;});
  report.legacyId=typeof old.id==="string"?old.id:null;
  report.legacyMetadata={source:"report-system-v1",name:old.name||"",general:old.general||{},kpis:old.kpis||{},createdAt:old.createdAt||null,updatedAt:old.updatedAt||null,theme:old.theme||null};
  return validate(report);
 });
}
