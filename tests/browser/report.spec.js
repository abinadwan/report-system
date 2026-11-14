import {execFileSync} from "node:child_process";
import {test,expect} from "@playwright/test";

test.beforeEach(async ({page})=>{
 await page.goto("/");
 await page.locator("#nav-data").click();
});

test("user can create three years and several metrics",async ({page})=>{
 await expect(page.locator("#metricEditors .period-card")).toHaveCount(1);
 await page.locator("#addMetric").click();
 await expect(page.locator("#metricEditors .period-card")).toHaveCount(2);
 await page.locator("#addPeriod").click();
 await expect(page.locator("#periodEditors .period-card")).toHaveCount(3);
 await page.locator("#periodEditors .period-card").nth(2).locator('[data-field="year"]').fill("2024");
 await page.locator("#periodEditors .period-card").nth(2).locator('[data-field="year"]').dispatchEvent("change");
 await expect(page.locator("#dataEditors .entry-table thead th")).toHaveCount(4);
 await expect(page.locator("#summaryCards .metric")).toHaveCount(6);
});

test("month selection preserves nonconsecutive custom months",async ({page})=>{
 const period=page.locator("#periodEditors .period-card").first();
 await period.locator('[data-field="preset"]').selectOption("h1");
 await expect(period.locator('[data-month]:checked')).toHaveCount(6);
 await period.locator('[data-month="2"]').uncheck();
 await expect(period.locator('[data-month]:checked')).toHaveCount(5);
 await expect(period.locator('[data-field="preset"]')).toHaveValue("custom");
});

test("manual input updates preview and survives reload",async ({page})=>{
 await page.locator("#dataEditors [data-entry]").first().fill("25");
 await expect(page.locator("#summaryCards .metric").first().locator("strong")).toContainText("٢٥");
 await page.locator("#save").click();
 await page.reload();
 await expect(page.locator("#dataEditors [data-entry]").first()).toHaveValue("25");
});

test("malicious markup in title is rendered as text",async ({page})=>{
 await page.locator("#title").fill("<img src=x onerror=alert(1)>");
 await expect(page.locator("#previewTitle")).toHaveText("<img src=x onerror=alert(1)>");
 await expect(page.locator("#previewTitle img")).toHaveCount(0);
});

test("CSV import creates periods and metrics dynamically",async ({page})=>{
 page.on("dialog",dialog=>dialog.accept());
 const csv="period,year,month,metric,value\nA,2025,1,Calls,10\nB,2026,1,Calls,20\nB,2026,2,Calls,25\n";
 await page.locator("#importCsv").setInputFiles({name:"data.csv",mimeType:"text/csv",buffer:Buffer.from(csv)});
 await expect(page.locator("#metricEditors .period-card")).toHaveCount(1);
 await expect(page.locator("#periodEditors .period-card")).toHaveCount(2);
 await expect(page.locator("#summaryCards .metric").last().locator("strong")).toContainText("٤٥");
});

test("multiple saved reports can be created and switched without losing data",async ({page})=>{
 await page.locator("#title").fill("الأول");
 await page.locator("#save").click();
 await page.locator("#nav-library").click();
 await page.locator("#newReport").click();
 await expect(page.locator("#view-data")).toBeVisible();
 await page.locator("#title").fill("الثاني");
 await page.locator("#save").click();
 await page.locator("#nav-library").click();
 await expect(page.locator("#reportSelect option")).toHaveCount(2);
 await page.locator("#reportSelect").selectOption({index:0});
 await page.locator("#nav-data").click();
 await expect(page.locator("#title")).toHaveValue("الأول");
 await page.locator("#nav-library").click();
 await page.locator("#reportSelect").selectOption({index:1});
 await page.locator("#nav-data").click();
 await expect(page.locator("#title")).toHaveValue("الثاني");
 await page.reload();
 await expect(page.locator("#reportSelect option")).toHaveCount(2);
});
test("Excel XLSX first sheet imports wide-format metrics",async ({page})=>{
 page.on("dialog",dialog=>dialog.accept());
 const workbook='<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="Sheet1" sheetId="1"/></sheets></workbook>';
 const sheet='<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Year</t></is></c><c r="B1" t="inlineStr"><is><t>Month</t></is></c><c r="C1" t="inlineStr"><is><t>Calls</t></is></c></row><row r="2"><c r="A2"><v>2025</v></c><c r="B2"><v>1</v></c><c r="C2"><v>44</v></c></row></sheetData></worksheet>';
 const python=[
  "import io,zipfile,sys",
  "b=io.BytesIO()",
  "with zipfile.ZipFile(b,\"w\",zipfile.ZIP_DEFLATED) as z:",
  " z.writestr(\"xl/workbook.xml\",sys.argv[1])",
  " z.writestr(\"xl/worksheets/sheet1.xml\",sys.argv[2])",
  "sys.stdout.buffer.write(b.getvalue())"
 ].join(String.fromCharCode(10));
 const buffer=execFileSync("python3",["-c",python,workbook,sheet]);
 await page.locator("#importCsv").setInputFiles({name:"data.xlsx",mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",buffer});
 await expect(page.locator("#metricEditors .period-card")).toHaveCount(1);
 await expect(page.locator("#periodEditors .period-card")).toHaveCount(1);
 await expect(page.locator("#summaryCards .metric strong")).toContainText("٤٤");
});

test("legacy report migration preserves V1 and creates V2 report",async ({page})=>{
 await page.locator("#nav-library").click();
 const old={id:"original",name:"سجل قديم",general:{title:"تقرير البيانات القديم"},calls2025:[10,20],q1_2026:{jan:30,feb:40,mar:50},kpis:{answerRate2026:96}};
 await page.evaluate(value=>localStorage.setItem("report_builder_reports_v3",JSON.stringify([value])),old);
 page.on("dialog",dialog=>dialog.accept());
 await page.locator("#migrateV1").click();
 await expect(page.locator("#reportSelect option")).toHaveCount(2);
 await expect(page.locator("#title")).toHaveValue("تقرير البيانات القديم");
 const original=await page.evaluate(()=>JSON.parse(localStorage.getItem("report_builder_reports_v3")));
 expect(original[0].id).toBe("original");
});

test("report sections can be reordered and saved",async ({page})=>{
 const rows=page.locator("#sectionOrder .section-order-row");
 await expect(rows).toHaveCount(3);
 await rows.nth(1).locator('[data-move="-1"]').click();
 await expect(rows.first()).toHaveAttribute("data-section-id","chart");
 await page.locator("#save").click();
 await page.reload();
 await expect(rows.first()).toHaveAttribute("data-section-id","chart");
});

test("separate data entry and results views keep the same report state",async ({page})=>{
 await expect(page.locator("#view-data")).toBeVisible();
 await expect(page.locator("#view-preview")).toBeHidden();
 await page.locator("#title").fill("مقارنة سنوية");
 await page.locator("#continuePreview").click();
 await expect(page.locator("#view-data")).toBeHidden();
 await expect(page.locator("#view-preview")).toBeVisible();
 await expect(page.locator("#previewTitle")).toHaveText("مقارنة سنوية");
 await page.locator("#backToData").click();
 await expect(page.locator("#title")).toHaveValue("مقارنة سنوية");
 await page.locator("#nav-library").click();
 await expect(page.locator("#reportCards .report-card")).toHaveCount(1);
 await page.locator("#reportCards .report-card").first().click();
 await expect(page.locator("#view-data")).toBeVisible();
});
test("recovers full library from IndexedDB after localStorage loss",async ({page})=>{
 await page.locator("#nav-library").click();
 await page.locator("#newReport").click();
 await page.locator("#title").fill("نسخة مستردة");
 await page.locator("#save").click();
 await expect(page.locator("#reportSelect option")).toHaveCount(2);
 // IndexedDB writes complete asynchronously; wait until the saved library is committed.
 await expect.poll(()=>page.evaluate(async()=>{
   const request=indexedDB.open("report-system-v2",2);
   const db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
   const tx=db.transaction("libraries","readonly");
   const records=await new Promise((resolve,reject)=>{const q=tx.objectStore("libraries").get("all");q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
   db.close();return records?.length||0;
 })).toBe(2);
 await page.evaluate(()=>localStorage.clear());
 await page.reload();
 await expect(page.locator("#reportSelect option")).toHaveCount(2);
});

test("switching input metric tabs preserves previous values",async ({page})=>{
 await page.locator("#addMetric").click();
 await page.locator("#dataEditors [data-entry]").first().fill("75");
 await page.locator("#dataEditors [data-metric-tab]").nth(1).click();
 await expect(page.locator("#dataEditors [data-entry]").first()).toHaveValue("");
 await page.locator("#dataEditors [data-metric-tab]").first().click();
 await expect(page.locator("#dataEditors [data-entry]").first()).toHaveValue("75");
});
