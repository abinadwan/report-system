import test from "node:test";
import assert from "node:assert/strict";
import {newReport,keyOf} from "../js/engine.js";
import {makeLibraryBackup,parseLibraryBackup} from "../js/library-backup.js";

test("full-library backup round-trips all report values and edits",()=>{
 const first={...newReport(),id:"report-a",title:"2024"};
 const second={...newReport(),id:"report-b",title:"2025"};
 const m=first.metrics[0],p=first.periods[0];
 first.entries[keyOf(p.id,1,m.id)]=5;
 second.entries[keyOf(second.periods[0].id,2,second.metrics[0].id)]=30;
 const edited={...second,title:"2025 updated"};
 const backedUp=makeLibraryBackup([first,second],edited);
 const recovered=parseLibraryBackup(backedUp);
 assert.equal(recovered.length,2);
 assert.equal(recovered[0].entries[keyOf(p.id,1,m.id)],5);
 assert.equal(recovered[1].entries[keyOf(second.periods[0].id,2,second.metrics[0].id)],30);
 assert.equal(recovered[1].title,"2025 updated");
});

test("old v2.1 library JSON format remains supported",()=>{
 const report={...newReport(),id:"one"};
 const old=JSON.stringify({schemaVersion:3,reports:[report]});
 assert.equal(parseLibraryBackup(old)[0].id,"one");
 assert.equal(parseLibraryBackup("\uFEFF"+old)[0].id,"one");
});

test("single-report JSON has a clear error",()=>{
 assert.throws(()=>parseLibraryBackup(JSON.stringify({...newReport(),id:"one"})),/ليس ملف مكتبة/);
});

test("duplicate IDs, empty libraries, and invalid reports are rejected",()=>{
 const report={...newReport(),id:"one"};
 assert.throws(()=>parseLibraryBackup(JSON.stringify({schemaVersion:3,reports:[]})),/لا يحتوي/);
 assert.throws(()=>parseLibraryBackup(JSON.stringify({schemaVersion:3,reports:[report,report]})),/مكرر/);
 assert.throws(()=>makeLibraryBackup([{...report,periods:[]}],report),/غير صالح/);
});
