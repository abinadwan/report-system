import {readFile} from "node:fs/promises";
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

test("backup button download restores all reports and their values after deletion and reload",async ({page})=>{
 await page.locator("#title").fill("التقرير الأول");
 await page.locator("#dataEditors [data-entry]").first().fill("123");
 await page.locator("#save").click();
 await page.locator("#nav-library").click();
 await page.locator("#newReport").click();
 await page.locator("#title").fill("التقرير الثاني");
 await page.locator("#dataEditors [data-entry]").first().fill("456");
 await page.locator("#save").click();
 await page.locator("#nav-library").click();

 // Use the real downloaded file rather than fabricating the JSON structure.
 const [download]=await Promise.all([
  page.waitForEvent("download"),
  page.locator("#backupAll").click()
 ]);
 const backup=await readFile(await download.path());
 const parsed=JSON.parse(backup.toString("utf8"));
 expect(parsed.schemaVersion).toBe(3);
 expect(parsed.reports).toHaveLength(2);
 expect(parsed.reports.map(r=>r.title)).toEqual(["التقرير الأول","التقرير الثاني"]);

 page.on("dialog",dialog=>dialog.accept());
 await page.locator("#deleteReport").click();
 await expect(page.locator("#reportCards .report-card")).toHaveCount(1);
 await page.locator("#restoreAll").setInputFiles({
   name:"report-system-library-backup.json",mimeType:"application/json",buffer:backup
 });
 await expect(page.locator("#libraryStatus")).toContainText("تمت استعادة 2 تقرير");
 await expect(page.locator("#reportCards .report-card")).toHaveCount(2);
 await page.reload();
 await expect(page.locator("#reportCards .report-card")).toHaveCount(2);
 for(const [name,value] of [["التقرير الأول","123"],["التقرير الثاني","456"]]){
  await page.locator("#reportCards .report-card").filter({hasText:name}).click();
  await expect(page.locator("#title")).toHaveValue(name);
  await expect(page.locator("#dataEditors [data-entry]").first()).toHaveValue(value);
  await page.locator("#nav-library").click();
 }
});

test("invalid library backup does not replace existing reports",async ({page})=>{
 await page.locator("#title").fill("يبقى محفوظًا");
 await page.locator("#save").click();
 await page.locator("#nav-library").click();
 await page.locator("#restoreAll").setInputFiles({
  name:"invalid.json",mimeType:"application/json",
  buffer:Buffer.from(JSON.stringify({schemaVersion:3,reports:[]}))
 });
 await expect(page.locator("#libraryStatus")).toContainText("فشلت الاستعادة");
 await expect(page.locator("#reportCards")).toContainText("يبقى محفوظًا");
});

test("brand header displays original logo and repository keeps MIT license",async ({page})=>{
 await expect(page.locator(".brand-lockup img")).toHaveAttribute("src","./assets/report-system-mark.svg");
 const response=await page.request.get("/assets/report-system-mark.svg");
 expect(response.ok()).toBeTruthy();
 expect(await response.text()).toContain("<svg");
 await expect(page.locator(".site-footer")).not.toContainText("MIT");
 const license=await page.request.get("/LICENSE");
 expect(license.ok()).toBeTruthy();
 expect(await license.text()).toContain("MIT License");
});

test("switches Arabic and English with matching text direction without losing data",async ({page})=>{
 await expect(page.locator("html")).toHaveAttribute("lang","ar");
 await expect(page.locator("html")).toHaveAttribute("dir","rtl");
 const originalTitle="تقرير المستخدم 2026";
 await page.locator("#title").fill(originalTitle);
 await page.locator("#dataEditors [data-entry]").first().fill("42");
 await page.locator("#save").click();
 await page.locator("#languageToggle").click();
 await expect(page.locator("html")).toHaveAttribute("lang","en");
 await expect(page.locator("html")).toHaveAttribute("dir","ltr");
 await expect(page.locator("#nav-data")).toHaveText("Data entry");
 await expect(page.locator("#data-heading")).toHaveText("Data entry");
 await expect(page.locator("#nav-library")).toHaveText("My reports");
 await expect(page.locator("#languageToggle")).toContainText("العربية");
 await expect(page.locator("#title")).toHaveValue(originalTitle);
 await expect(page.locator("#dataEditors [data-entry]").first()).toHaveValue("42");
 await expect(page.locator("#dataEditors")).toContainText("January");
 await page.locator("#continuePreview").click();
 await expect(page.locator("#preview-heading")).toHaveText("View insights");
 await expect(page.locator("#previewTitle")).toHaveText(originalTitle);
 await page.reload();
 await expect(page.locator("html")).toHaveAttribute("lang","en");
 await expect(page.locator("#nav-library")).toHaveText("My reports");
 await page.locator("#languageToggle").click();
 await expect(page.locator("html")).toHaveAttribute("dir","rtl");
 await expect(page.locator("#nav-library")).toHaveText("تقاريري");
 await expect(page.locator("#title")).toHaveValue(originalTitle);
});

test("English confirmation and status messages are localized",async ({page})=>{
 await page.locator("#languageToggle").click();
 await page.locator("#save").click();
 await expect(page.locator("#status")).toContainText("Saved to this browser");
 let dialogText="";
 page.once("dialog",async dialog=>{dialogText=dialog.message();await dialog.dismiss();});
 await page.locator("#clear").click();
 expect(dialogText).toMatch(/Reset this report/);
});

test("English is responsive on small screens and direction returns to Arabic",async ({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.locator("#languageToggle").click();
 await expect(page.locator(".brand-lockup img")).toBeVisible();
 await expect(page.locator("#nav-library")).toBeVisible();
 await expect(page.locator("#nav-preview")).toBeVisible();
 await expect(page.locator(".site-footer")).toBeVisible();
 await page.locator("#languageToggle").click();
 await expect(page.locator("html")).toHaveAttribute("dir","rtl");
});

test("four report display designs update preview immediately and survive reload",async ({page})=>{
 await page.locator("#continuePreview").click();
 await expect(page.locator("#view-preview")).toBeVisible();
 for(const id of ["executive","analytical","formal","modern"]){
  await page.locator('input[name="report-design"][value="'+id+'"]').check();
  await expect(page.locator("#preview")).toHaveAttribute("data-design",id);
  const accent=await page.locator("#preview .preview-header").evaluate(el=>getComputedStyle(el).backgroundImage);
  if(id==="formal")expect(accent).toBe("none");
  else expect(accent).not.toBe("none");
 }
 await page.locator("#save").evaluate(el=>el.click());
 await page.reload();
 await page.locator("#nav-preview").click();
 await expect(page.locator('input[name="report-design"][value="modern"]')).toBeChecked();
 await expect(page.locator("#preview")).toHaveAttribute("data-design","modern");
});

test("design is independent for each saved report and preserved by library backup",async ({page})=>{
 await page.locator("#continuePreview").click();
 await page.locator('input[name="report-design"][value="formal"]').check();
 await page.locator("#nav-library").click();
 await page.locator("#newReport").click();
 await page.locator("#continuePreview").click();
 await expect(page.locator("#preview")).toHaveAttribute("data-design","executive");
 await page.locator('input[name="report-design"][value="analytical"]').check();
 await page.locator("#nav-library").click();
 const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#backupAll").click()]);
 const backup=JSON.parse((await (await import("node:fs/promises")).readFile(await download.path())).toString("utf8"));
 expect(backup.reports.map(x=>x.design)).toEqual(["formal","analytical"]);
 await page.locator("#reportCards .report-card").first().click();
 await page.locator("#nav-preview").click();
 await expect(page.locator("#preview")).toHaveAttribute("data-design","formal");
});

test("report-only themes apply in print and public footer omits license",async ({page})=>{
 await page.locator("#continuePreview").click();
 await page.locator('input[name="report-design"][value="formal"]').check();
 const style=await page.locator("#preview").evaluate(el=>getComputedStyle(el).getPropertyValue("--report-accent-dark").trim());
 expect(style).toBe("#252d37");
 await page.emulateMedia({media:"print"});
 await expect(page.locator(".report-design-picker")).toBeHidden();
 await expect(page.locator("#preview")).toBeVisible();
 await expect(page.locator(".site-footer")).toBeHidden();
 await page.emulateMedia({media:"screen"});
 const footer=await page.locator(".site-footer").innerText();
 expect(footer).not.toMatch(/MIT|رخصة/);
 await expect(page.locator('.site-footer a[href*="github.com"]')).toHaveCount(1);
 const response=await page.request.get("/LICENSE");
 expect(response.ok()).toBeTruthy();
});

test("report design options translate to English without changing chosen theme",async ({page})=>{
 await page.locator("#continuePreview").click();
 await page.locator('input[name="report-design"][value="analytical"]').check();
 await page.locator("#languageToggle").click();
 await expect(page.locator("#design-picker-heading")).toHaveText("Report design");
 await expect(page.locator('input[name="report-design"][value="analytical"]')).toBeChecked();
 await expect(page.locator(".design-option").filter({has:page.locator('input[value="formal"]')})).toContainText("Formal");
 await expect(page.locator("#preview")).toHaveAttribute("data-design","analytical");
});
