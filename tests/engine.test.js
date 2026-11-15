import test from "node:test";
import assert from "node:assert/strict";
import {newReport,period,metric,calc,validate,comparison,keyOf,PRESETS,applyTemplate,sanitize,uid,format} from "../js/engine.js";
import {parseCSV,readLongFormat,readFlexibleFormat,encodeCSV,buildImportedData} from "../js/csv.js";

test("three-year, two-metric comparison",()=>{
 const r=newReport();
 r.periods=[2024,2025,2026].map(year=>({...period(year),id:String(year),months:[1,2,3]}));
 r.metrics=[{...metric("Calls","calls","sum"),id:"calls"},{...metric("Duration","s","average"),id:"duration"}];
 for(const [i,p] of r.periods.entries())for(const month of p.months){
  r.entries[keyOf(p.id,month,"calls")]=(i+1)*10;
  r.entries[keyOf(p.id,month,"duration")]=month*5;
 }
 const result=calc(r);
 assert.deepEqual(result[0].periods.map(p=>p.result),[30,60,90]);
 assert.deepEqual(result[1].periods.map(p=>p.result),[10,10,10]);
 assert.equal(comparison(result[0].periods)[2].delta,200);
});
test("half-year comparisons and missing month",()=>{
 const r=newReport();r.periods=[{...period(2025),id:"h1",months:PRESETS.h1},{...period(2026),id:"h2",months:PRESETS.h2}];
 const m=r.metrics[0];
 for(const month of PRESETS.h1)r.entries[keyOf("h1",month,m.id)]=10;
 for(const month of PRESETS.h2.slice(0,5))r.entries[keyOf("h2",month,m.id)]=20;
 const [a,b]=calc(r)[0].periods;
 assert.equal(a.result,60);assert.equal(a.complete,true);
 assert.equal(b.result,100);assert.equal(b.complete,false);assert.equal(b.count,5);
});
test("reject invalid input and schema",()=>{
 const r=newReport();r.periods[0].months=[1,1];
 assert.throws(()=>validate(r),/أشهر/);
 r.periods[0].months=[1];
 r.entries[keyOf(r.periods[0].id,1,r.metrics[0].id)]=-1;
 assert.throws(()=>validate(r),/قيمة/);
 assert.throws(()=>validate({...r,schemaVersion:2}),/صيغة/);
});
test("template changes create independent metric IDs",()=>{
 const r=applyTemplate(newReport(),"call-center");
 assert.equal(r.metrics.length,3);
 assert.notEqual(r.metrics[0].id,r.metrics[1].id);
 assert.equal(r.metrics[2].method,"ratio");
 assert.equal(Object.keys(r.entries).length,0);
});
test("CSV with quoted comma and newline parses safely",()=>{
 const rows=parseCSV('year,month,metric,value\r\n2026,1,"Calls, total",2\r\n2026,2,Duration,5');
 assert.equal(readLongFormat(rows)[0].metric,"Calls, total");
 assert.equal(readLongFormat(rows)[1].month,2);
});
test("CSV named periods keep overlapping years distinct",()=>{
 const rows=[{period:"H1 2026",year:2026,month:1,metric:"Calls",value:10},{period:"Q1 2026",year:2026,month:1,metric:"Calls",value:20}];
 const parsed=readLongFormat(parseCSV(encodeCSV(rows)));
 assert.deepEqual(parsed,rows.map(r=>({...r,periodId:""})));
});
test("CSV rejects invalid numeric values",()=>{
 assert.throws(()=>readLongFormat(parseCSV("year,month,metric,value\n2026,1,Calls,-1")),/القيمة/);
 assert.throws(()=>parseCSV('year,month,metric,value\n"2026,1,Calls,30'),/مغلق/);
});

test("wide CSV accepts user-defined metric columns",()=>{
 const rows=parseCSV("Year,Month,Calls,Answered\n2025,1,100,90\n2025,2,120,110");
 const result=readFlexibleFormat(rows);
 assert.equal(result.length,4);
 assert.deepEqual(result.map(x=>x.metric),["Calls","Answered","Calls","Answered"]);
 assert.equal(result[3].value,110);
});
test("Arabic CSV headers and Arabic month names work",()=>{
 const rows=parseCSV("السنة,الشهر,المعاملات\n٢٠٢٦,يناير,٣٠\n٢٠٢٦,فبراير,٤٥");
 const result=readFlexibleFormat(rows);
 assert.deepEqual(result.map(x=>x.month),[1,2]);
 assert.deepEqual(result.map(x=>x.value),[30,45]);
});
test("ISO monthly date column is accepted",()=>{
 const rows=parseCSV("Date,Orders\n2027-03,42\n2027-04-12,25");
 assert.deepEqual(readFlexibleFormat(rows).map(x=>x.month),[3,4]);
});

test("weighted rate uses total numerator / total denominator",()=>{
 const r=applyTemplate(newReport(),"call-center");
 r.periods=[{...period(2026),id:"p",months:[1,2]}];
 const [calls,answered,rate]=r.metrics;
 r.entries[keyOf("p",1,calls.id)]=100;
 r.entries[keyOf("p",1,answered.id)]=90;
 r.entries[keyOf("p",2,calls.id)]=10;
 r.entries[keyOf("p",2,answered.id)]=5;
 const result=calc(r).find(x=>x.metric.id===rate.id).periods[0];
 assert.ok(Math.abs(result.result-(95/110*100))<1e-9);
 assert.equal(result.count,2);
});
test("invalid ratio references fail validation",()=>{
 const r=applyTemplate(newReport(),"call-center");
 r.metrics[2].denominatorId="missing";
 assert.throws(()=>validate(r),/بسط ومقام/);
});

test("does not claim growth when the baseline has missing months",()=>{
 const r=newReport();
 r.periods=[{...period(2025),id:"a",months:[1,2]},{...period(2026),id:"b",months:[1,2]}];
 const id=r.metrics[0].id;
 r.entries[keyOf("a",1,id)]=10;
 r.entries[keyOf("b",1,id)]=20;
 r.entries[keyOf("b",2,id)]=20;
 const result=comparison(calc(r)[0].periods);
 assert.equal(result[0].complete,false);
 assert.equal(result[1].delta,null);
 assert.equal(result[1].comparable,false);
});
test("blocks impossible bounded operational ratio",()=>{
 const r=applyTemplate(newReport(),"call-center");
 r.periods=[{...period(2026),id:"p",months:[1]}];
 const [offered,answered]=r.metrics;
 r.entries[keyOf("p",1,offered.id)]=10;
 r.entries[keyOf("p",1,answered.id)]=20;
 assert.throws(()=>validate(r),/البسط المقام/);
});
test("unbounded ratios may legitimately exceed one hundred percent",()=>{
 const r=newReport();
 const a={...metric("current","unit","sum"),id:"a"};
 const b={...metric("reference","unit","sum"),id:"b"};
 const ratio={...metric("growth multiple","%","ratio"),id:"c",numeratorId:"a",denominatorId:"b"};
 r.metrics=[a,b,ratio];r.periods=[{...period(2026),id:"p",months:[1]}];
 r.entries[keyOf("p",1,"a")]=20;r.entries[keyOf("p",1,"b")]=10;
 assert.equal(calc(r)[2].periods[0].result,200);
});

test("report designs default to executive and reject unknown values",()=>{
 const report=newReport();
 assert.equal(report.design,"executive");
 for(const design of ["executive","analytical","formal","modern"]){
  assert.doesNotThrow(()=>validate({...report,design}));
 }
 assert.doesNotThrow(()=>validate({...report,design:undefined}));
 assert.throws(()=>validate({...report,design:"unknown"}),/تصميم التقرير/);
});


test("reject repeated sections and strip unknown foreign JSON keys",()=>{
 const r=newReport();
 r.sections=["summary","summary"];
 assert.throws(()=>validate(r),/أقسام/);
 r.sections=["summary","table"];
 r.scope="custom";r.periods[0].scope="custom";r.metrics[0].unexpected="anything";
 const cleaned=sanitize(r);
 assert.equal("scope" in cleaned,false);
 assert.equal("scope" in cleaned.periods[0],false);
 assert.equal("unexpected" in cleaned.metrics[0],false);
 assert.doesNotThrow(()=>validate(cleaned));
});

test("CSV round-trip keeps same-year unnamed periods distinct with stable IDs",()=>{
 const r=newReport();r.periods=[{id:"one",name:"",year:2026,months:[1]},{id:"two",name:"",year:2026,months:[1]}];
 const rows=[{periodId:"one",period:"",year:2026,month:1,metric:"Calls",value:13},{periodId:"two",period:"",year:2026,month:1,metric:"Calls",value:29}];
 const parsed=readFlexibleFormat(parseCSV(encodeCSV(rows)));
 const imported=buildImportedData(parsed);
 assert.deepEqual(imported.periods,r.periods);
 assert.equal(imported.metrics.length,1);
 assert.equal(imported.entries[keyOf("one",1,imported.metrics[0].id)],13);
 assert.equal(imported.entries[keyOf("two",1,imported.metrics[0].id)],29);
 assert.equal(Object.keys(imported.entries).length,2);
});

test("CSV import rejects duplicates and conflicting period IDs",()=>{
 const rows=[{periodId:"first",period:"",year:2026,month:1,metric:"Calls",value:10}];
 assert.throws(()=>buildImportedData([...rows,{...rows[0],value:20}]),/مكرر/);
 assert.throws(()=>buildImportedData([...rows,{...rows[0],year:2027}]),/معرّف الفترة/);
 assert.throws(()=>buildImportedData([...rows,{...rows[0],period:"another"}]),/معرّف الفترة/);
});

test("legacy CSV without periodId still imports correctly",()=>{
 const rows=readFlexibleFormat(parseCSV("year,month,metric,value\n2026,1,Calls,10\n2027,1,Calls,20"));
 const imported=buildImportedData(rows);
 assert.equal(imported.periods.length,2);
 assert.deepEqual(imported.periods.map(p=>p.name),["2026","2027"]);
 assert.equal(Object.keys(imported.entries).length,2);
});

test("Arabic and Levantine month aliases and numeric formatting",()=>{
 const rows=readFlexibleFormat(parseCSV("السنة,الشهر,المعاملات\n٢٠٢٦,تشرين الأول,٤٢\n٢٠٢٦,آذار,١٢"));
 assert.deepEqual(rows.map(r=>r.month),[10,3]);
 assert.ok(format(1234.5,"en").includes("1,234"));
 assert.ok(typeof uid()==="string"&&uid().length>=16);
});
