# Report System — phase 2.1 reporting workflow

Built with **HTML + CSS + vanilla JavaScript ES modules**, without React or a frontend build system. The previous application code has been removed from the repository; the migration utility reads V1 browser data if present.

## Run locally

Run from repository root:

```sh
python -m http.server 5500
```

Then visit `http://localhost:5500/` in a modern browser.

## Workflow

The browser app now has three focused screens:

1. **تقاريري** — select, create, duplicate, back up, or migrate reports.
2. **إدخال البيانات** — configure periods and metrics, then enter or import source values.
3. **عرض التقرير** — review KPIs, chart/table sections, warnings, and print PDF.

The data-entry screen uses an editable **month-by-period table**, with metric tabs and horizontally scrollable columns for large comparisons. Navigation stays on the same origin without reloading the app. Saved reports are mirrored to IndexedDB as a complete library for recovery; per-report localStorage records are also retained. The library can be backed up and restored using JSON. Period-to-period changes are not calculated when either selected period is incomplete or their month counts differ.

## Available features

- Report intent: periodic, comparison, trends or executive. Periodic/trend modes display month-level bars; other modes compare period aggregates. Advanced layouts remain on the roadmap.
- General, call center, project and sales starter metric presets, including a weighted answer-rate ratio for the call-center preset. Selecting another preset explicitly clears existing metric values.
- Add, edit or delete up to 30 metrics per report. Each metric can calculate sum or average of **observed months**.
- Any four-digit year and up to 100 named periods, with annual, half-year, quarterly or custom month selection. Overlapping periods are supported.
- Manual monthly values, missing-data warnings, multi-metric totals and comparison percentages against the first period.
- Import/export UTF-8 CSV in long format: `period,year,month,metric,value`. The `period` column is optional for import. Period names distinguish multiple periods within the same year.
- Import first-sheet XLSX or wide CSV with `Year,Month,Calls,Answered` or `Date,Orders` and arbitrary metric columns; Arabic `السنة`, `الشهر`, Arabic numerals and Arabic month names are also supported.
- Multiple saved reports (create, duplicate, switch, delete), JSON backup of the active report or the whole library, local browser storage, and print / Save to PDF.
- No third-party runtime scripts, external CDN, backend or login.

## Limitations and caveats

- Supports sum, unweighted observed-month average, and ratio KPIs derived from matching numerator/denominator monthly values. **Do not use simple average for weighted operational rates.**
- CSV import replaces the current periods and data after confirmation. Export only includes entered values, not blank months.
- Native `.xlsx` import reads the **first worksheet** with standard shared/inline strings and numeric values, subject to ZIP and sheet-size limits. Some uncommon Excel formats may require saving as CSV.
- Drafts are saved to `localStorage` and mirrored to IndexedDB where available; backup JSON remains recommended. Another browser or origin does not share them.
- Current PDF uses browser print and is not visually certified across browsers.
- GitHub Actions runs engine, CSV and Chromium browser regression tests; accessibility and multi-browser audits are not complete.
- V1 reports can be migrated **on demand** using “استيراد تقارير V1” when both apps share an origin. Original V1 browser data remains untouched; legacy rate KPI metadata is preserved, not falsely recomputed.
- The app is designed for nonnegative measures; rates, negative financial values and computed metrics need additional metric types.

## Testing

GitHub Actions runs:

```sh
npm run check
npm test
```

V2 is the default application at the repository root. The earlier V1 pages are no longer in the current source tree. Git history retains earlier versions.
