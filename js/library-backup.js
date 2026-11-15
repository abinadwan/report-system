// Full-library JSON backup format. Keep the existing schemaVersion:3 format
// compatible with backup files exported by Report System 2.1.
import {validate,sanitize} from "./engine.js";

export function normalizeLibrary(reports){
 if(!Array.isArray(reports)||reports.length<1||reports.length>100){
  throw Error("ملف النسخة الاحتياطية لا يحتوي على مكتبة تقارير صالحة (1–100 تقرير).");
 }
 const ids=new Set();
 return reports.map((item,index)=>{
  const clean=sanitize(item);
  try{validate(clean);}catch(e){throw Error("التقرير رقم "+(index+1)+" غير صالح: "+e.message);}
  if(typeof clean.id!=="string"||!clean.id.trim()||ids.has(clean.id)){
   throw Error("معرّف التقرير رقم "+(index+1)+" مفقود أو مكرر.");
  }
  ids.add(clean.id);
  return clean;
 });
}

export function makeLibraryBackup(library,activeReport){
 const reports=library.map(item=>item.id===activeReport.id?activeReport:item);
 const normalized=normalizeLibrary(reports);
 return JSON.stringify({schemaVersion:3,reports:normalized},null,2);
}

export function parseLibraryBackup(source){
 if(typeof source!=="string"||!source.trim())throw Error("الملف فارغ.");
 let data;
 try{data=JSON.parse(source.replace(/^\uFEFF/,""));}
 catch{throw Error("الملف ليس JSON صالحًا. اختر ملف «نسخ احتياطي للكل».");}
 if(data?.schemaVersion!==3||!Array.isArray(data.reports)){
  throw Error("هذا ليس ملف مكتبة تقارير. استخدم الملف الناتج عن «نسخ احتياطي للكل»، وليس نسخة تقرير منفرد.");
 }
 // JSON.parse gives a fresh value that is safe to validate before replacing user data.
 return normalizeLibrary(data.reports);
}
