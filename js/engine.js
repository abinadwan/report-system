// Report System V2 calculation engine. Pure functions: no DOM or storage.
export const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
export const PRESETS = Object.freeze({year:[1,2,3,4,5,6,7,8,9,10,11,12],h1:[1,2,3,4,5,6],h2:[7,8,9,10,11,12],q1:[1,2,3],q2:[4,5,6],q3:[7,8,9],q4:[10,11,12]});
export const TEMPLATES = {
  general:{label:"تقرير عام",metrics:[{name:"عدد المعاملات",unit:"معاملة",method:"sum"}]},
  "call-center":{label:"مركز الاتصال",metrics:[{name:"المكالمات الواردة",unit:"مكالمة",method:"sum"},{name:"المكالمات المجابة",unit:"مكالمة",method:"sum"},{name:"معدل الإجابة",unit:"%",method:"ratio",numeratorName:"المكالمات المجابة",denominatorName:"المكالمات الواردة",boundedRatio:true}]},
  projects:{label:"إدارة المشاريع",metrics:[{name:"المهام المكتملة",unit:"مهمة",method:"sum"},{name:"المهام الجديدة",unit:"مهمة",method:"sum"}]},
  sales:{label:"المبيعات",metrics:[{name:"إجمالي المبيعات",unit:"ر.س",method:"sum"},{name:"عدد الطلبات",unit:"طلب",method:"sum"}]}
};
export function uid(){return globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);}
export function period(year=new Date().getFullYear()){return {id:uid(),name:"",year,months:[...PRESETS.year]};}
export function metric(name="مؤشر جديد",unit="وحدة",method="sum"){return {id:uid(),name,unit,method};}
export function newReport(){return {schemaVersion:3,title:"تقرير أداء جديد",kind:"comparison",template:"general",periods:[period(),period(new Date().getFullYear()-1)],metrics:[metric("عدد المعاملات","معاملة","sum")],entries:{},sections:["summary","chart","table"]};}
export function applyTemplate(report,key){
 if(!Object.hasOwn(TEMPLATES,key))throw Error("قالب غير معروف");
 const incoming=TEMPLATES[key].metrics.map(m=>metric(m.name,m.unit,m.method));
 incoming.forEach((m,i)=>{const source=TEMPLATES[key].metrics[i];if(source.method==="ratio"){m.numeratorId=incoming.find(x=>x.name===source.numeratorName)?.id;m.denominatorId=incoming.find(x=>x.name===source.denominatorName)?.id;m.boundedRatio=Boolean(source.boundedRatio);}});
 return {...report,template:key,metrics:incoming,entries:{}}; // user must explicitly confirm replacing values
}
export function validate(report){
 if(!report || typeof report!=="object" || report.schemaVersion!==3)throw Error("صيغة التقرير غير مدعومة.");
 if(typeof report.title!=="string" || report.title.length>250)throw Error("العنوان غير صالح.");
 if(!["comparison","periodic","trend","executive"].includes(report.kind))throw Error("هدف التقرير غير معروف.");
 if(!Object.hasOwn(TEMPLATES,report.template))throw Error("القالب غير معروف.");
 if(!Array.isArray(report.periods)||!report.periods.length||report.periods.length>100)throw Error("عدد الفترات غير صالح.");
 if(!Array.isArray(report.metrics)||!report.metrics.length||report.metrics.length>30)throw Error("عدد المؤشرات غير صالح.");
 if(!report.entries||typeof report.entries!=="object"||Array.isArray(report.entries))throw Error("بيانات المؤشرات غير صالحة.");
 if(!Array.isArray(report.sections)||report.sections.some(s=>!["summary","chart","table"].includes(s)))throw Error("أقسام التقرير غير صالحة.");
 const ids=new Set();
 for(const p of report.periods){
   if(typeof p.id!=="string"||!p.id||ids.has(p.id)||typeof p.name!=="string"||p.name.length>100)throw Error("معرّفات الفترات غير صالحة.");
   ids.add(p.id);
   if(!Number.isInteger(Number(p.year))||!/^[0-9]{4}$/.test(String(p.year))||Number(p.year)<1000)throw Error("الرجاء إدخال سنة صحيحة.");
   if(!Array.isArray(p.months)||!p.months.length||p.months.length>12||new Set(p.months).size!==p.months.length||p.months.some(m=>!Number.isInteger(m)||m<1||m>12))throw Error("الأشهر المختارة غير صالحة.");
 }
 for(const m of report.metrics){
   if(typeof m.id!=="string"||!m.id||ids.has(m.id)||typeof m.name!=="string"||!m.name.trim()||m.name.length>100||typeof m.unit!=="string"||m.unit.length>40||!["sum","average","ratio"].includes(m.method))throw Error("تعريف مؤشر غير صالح.");
   ids.add(m.id);
 }
 for(const m of report.metrics){
   if(m.method==="ratio"){
     const numerator=report.metrics.find(x=>x.id===m.numeratorId),denominator=report.metrics.find(x=>x.id===m.denominatorId);
     if(!numerator||!denominator||numerator.id===denominator.id||numerator.method==="ratio"||denominator.method==="ratio")throw Error("اختر مؤشرين أساسيين مختلفين لبسط ومقام النسبة.");
   }
 }
 for(const [key,value] of Object.entries(report.entries)){
   if(key.length>150||!(value===null||value===""||typeof value==="number"&&Number.isFinite(value)&&value>=0))throw Error("قيمة مؤشر غير صالحة.");
 }
 for(const m of report.metrics.filter(m=>m.method==="ratio"&&m.boundedRatio)){
   for(const p of report.periods)for(const month of p.months){
     const numerator=report.entries[keyOf(p.id,month,m.numeratorId)];
     const denominator=report.entries[keyOf(p.id,month,m.denominatorId)];
     if(typeof numerator==="number"&&typeof denominator==="number"&&numerator>denominator){
       throw Error("لا يمكن أن يتجاوز البسط المقام في "+m.name+" ("+p.year+"، "+MONTHS[month-1]+").");
     }
   }
 }
 return report;
}
export function keyOf(periodId,month,metricId){return JSON.stringify([periodId,month,metricId]);}
export function calc(report){
 validate(report);
 return report.metrics.map(m=>({
   metric:m,
   periods:report.periods.map(p=>{
     const months=[...p.months].sort((a,b)=>a-b);
     if(m.method==="ratio"){
       const values=months.map(month=>{
         const n=report.entries[keyOf(p.id,month,m.numeratorId)];
         const d=report.entries[keyOf(p.id,month,m.denominatorId)];
         return {month,value:n==null||n===""||d==null||d===""||d===0?null:n/d*100,numerator:n,denominator:d};
       });
       const valid=values.filter(v=>v.value!==null);
       const numerator=valid.reduce((sum,v)=>sum+v.numerator,0);
       const denominator=valid.reduce((sum,v)=>sum+v.denominator,0);
       const result=denominator>0?numerator/denominator*100:null;
       return {id:p.id,name:p.name.trim()||String(p.year),year:p.year,months,values,result,total:null,average:null,count:valid.length,expected:months.length,complete:valid.length===months.length};
     }
     const values=months.map(month=>{const v=report.entries[keyOf(p.id,month,m.id)];return {month,value:v===null||v===undefined||v===""?null:v};});
     const observed=values.filter(v=>v.value!==null);
     const total=observed.reduce((sum,x)=>sum+x.value,0);
     const average=observed.length?total/observed.length:null;
     const result=observed.length?(m.method==="average"?average:total):null;
     return {id:p.id,name:p.name.trim()||String(p.year),year:p.year,months,values,result,total,average,count:observed.length,expected:months.length,complete:observed.length===months.length};
   })
 }));
}
export function comparison(rows){
 const first=rows[0];
 const baseline=first?.result??null;
 return rows.map(row=>{
   const comparable=Boolean(first?.complete&&row.complete&&first.expected===row.expected);
   const delta=!comparable||baseline===null||baseline===0||row.result===null?null:(row.result-baseline)/Math.abs(baseline)*100;
   return {...row,delta,comparable};
 });
}
export function format(n){return n===null||n===undefined?"—":new Intl.NumberFormat(typeof document!=="undefined"&&document.documentElement.lang==="en"?"en-US":"ar-SA",{maximumFractionDigits:2}).format(n);}
