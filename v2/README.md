# Report System 2.0 — Foundation

A separate, local-first prototype built with HTML, CSS and vanilla JavaScript ES modules. Open through an HTTP server (not file://) so ES modules work reliably.

## Run

From the repository root:

```sh
python -m http.server 5500
```

Open http://localhost:5500/v2/

## Delivered in this foundation

- User-selectable report intent and starter domain template.
- Dynamic period cards with any 4-digit year and flexible month sets; 100-period safety limit.
- One editable, nonnegative numeric metric per report; sum or observed-month average.
- Missing months treated as missing, **not zero**.
- Period totals, monthly averages, comparisons against the first period, simple bar visualization, and mismatch warnings.
- Save draft in browser localStorage, export/import versioned JSON backup, and browser print / Save as PDF.
- No backend, user accounts, external CDN or framework dependencies.
- V1 remains available at the repository root.

## Explicit limitations

- **One metric per report** in this first foundation (not a complete metric builder).
- No Excel/CSV import yet, no templates with field mappings or weighted KPI definitions.
- No daily/date-range granularity yet; monthly periods only.
- This prototype uses localStorage rather than the planned IndexedDB.
- No PDF page-layout certification, automated browser tests, or multi-user sync.
- Start V2 via an HTTP server, not by double-clicking index.html.
- Old V1 reports are not migrated automatically. V1 storage remains untouched.

## Calculation contract

- Sum adds available selected-month values.
- Average is the mean of **available months**, not all selected months.
- Missing months lead to an explicit warning.
- Percentage change compares each computed period result with the **first** period and is omitted if the baseline is zero or either value is missing.
- Comparing periods of different lengths raises a warning. For fair comparisons, use comparable periods and appropriate metric definitions.

## Next milestones

1. Unit tests for period validation and computations.
2. Multiple user-defined metrics and correct weighted KPI aggregation.
3. CSV/Excel import, data mapping, validation, and IndexedDB persistence.
4. Report composer, specialized schemas, and print-quality PDF engine.
5. E2E tests, accessibility audit, and V1 migration utility.
