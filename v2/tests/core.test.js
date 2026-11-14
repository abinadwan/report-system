import test from "node:test";
import assert from "node:assert/strict";
import {newReport,validateReport,computeReport,compareResults,PRESETS} from "../js/core.js";

test("supports three different years with custom month sets",()=>{
 const report=newReport();
 report.periods=[
  {id:"a",name:"",year:2024,months:[1,2,3],values:{1:10,2:20,3:30}},
  {id:"b",name:"",year:2025,months:[1,2,3],values:{1:20,2:20,3:20}},
  {id:"c",name:"",year:2026,months:[1,2,3],values:{1:30,2:40,3:50}}
 ];
 const rows=compareResults(computeReport(report));
 assert.deepEqual(rows.map(r=>r.result),[60,60,120]);
 assert.deepEqual(rows.map(r=>r.change),[0,0,100]);
});
test("half-year comparison works without fixed dates",()=>{
 const report=newReport();
 report.periods=[{id:"a",name:"H1",year:2030,months:PRESETS.h1,values:Object.fromEntries(PRESETS.h1.map(m=>[m,2]))},
 {id:"b",name:"H2",year:2030,months:PRESETS.h2,values:Object.fromEntries(PRESETS.h2.map(m=>[m,3]))}];
 assert.deepEqual(computeReport(report).map(r=>r.result),[12,18]);
});
test("missing values are not silently replaced by zero",()=>{
 const report=newReport();report.periods=[{id:"a",name:"",year:2027,months:[1,2,3],values:{1:10,2:"",3:0}}];
 const row=computeReport(report)[0];
 assert.equal(row.total,10);assert.equal(row.available,2);assert.equal(row.complete,false);
 report.metric.aggregation="average";assert.equal(computeReport(report)[0].result,5);
});
test("reject invalid year, duplicate months and negative numbers",()=>{
 const report=newReport();report.periods=[{id:"a",name:"",year:26,months:[1],values:{1:3}}];
 assert.throws(()=>validateReport(report),/سنة/);
 report.periods[0].year=2026;report.periods[0].months=[1,1];
 assert.throws(()=>validateReport(report),/أشهر/);
 report.periods[0].months=[1];report.periods[0].values[1]=-1;
 assert.throws(()=>validateReport(report),/سالبة/);
});
test("percentage change does not divide by zero",()=>{
 const report=newReport();report.periods=[
  {id:"a",name:"",year:2025,months:[1],values:{1:0}},
  {id:"b",name:"",year:2026,months:[1],values:{1:20}}
 ];
 assert.deepEqual(compareResults(computeReport(report)).map(r=>r.change),[null,null]);
});
