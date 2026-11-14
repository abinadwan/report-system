import test from "node:test";
import assert from "node:assert/strict";
import {migrateLegacyReports} from "../js/migrate.js";
import {calc} from "../js/engine.js";
test("old V1 reports migrate without losing monthly calls",()=>{
 const old=[{id:"v1",name:"تقرير قديم",general:{title:"العنوان"},calls2025:[10,20,30],q1_2026:{jan:40,feb:50,mar:60},kpis:{answerRate2026:96}}];
 const reports=migrateLegacyReports(old);
 assert.equal(reports.length,1);
 assert.equal(reports[0].legacyId,"v1");
 assert.equal(reports[0].legacyMetadata.kpis.answerRate2026,96);
 const result=calc(reports[0])[0].periods;
 assert.equal(result[0].result,60);
 assert.equal(result[0].complete,false);
 assert.equal(result[1].result,150);
});
test("invalid V1 reports cannot be imported",()=>{
 assert.throws(()=>migrateLegacyReports({}),/صيغة/);
 assert.throws(()=>migrateLegacyReports([null]),/غير صالح/);
});
