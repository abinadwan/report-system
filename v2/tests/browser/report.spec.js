import {test,expect} from "@playwright/test";

test.beforeEach(async ({page})=>{
 await page.goto("/v2/");
});

test("user can create three years and several metrics",async ({page})=>{
 await expect(page.locator("#metricEditors .period-card")).toHaveCount(1);
 await page.locator("#addMetric").click();
 await expect(page.locator("#metricEditors .period-card")).toHaveCount(2);
 await page.locator("#addPeriod").click();
 await expect(page.locator("#periodEditors .period-card")).toHaveCount(3);
 await page.locator("#periodEditors .period-card").nth(2).locator('[data-field="year"]').fill("2024");
 await page.locator("#periodEditors .period-card").nth(2).locator('[data-field="year"]').dispatchEvent("change");
 await expect(page.locator("#dataEditors .data-block")).toHaveCount(3);
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
 await page.locator("#dataEditors .data-block").first().locator('[data-entry]').first().fill("25");
 await expect(page.locator("#summaryCards .metric").first().locator("strong")).toContainText("٢٥");
 await page.locator("#save").click();
 await page.reload();
 await expect(page.locator("#dataEditors .data-block").first().locator('[data-entry]').first()).toHaveValue("25");
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
