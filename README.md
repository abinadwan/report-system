# Internal Executive Reporting System

## Project overview
Internal Executive Reporting System is a lightweight internal reporting and executive dashboard generator for operational performance reporting. It is designed for teams that need a quick, editable, and printable Arabic RTL report without backend complexity.

## Features
- Multi-report management (create, duplicate, delete, reset).
- LocalStorage persistence per browser.
- Live KPI calculations and instant preview updates.
- Executive summary generation in Arabic.
- Dynamic charts using Chart.js.
- Theme support (SDAIA, Light, Dark Executive).
- PDF export through native browser print.
- Responsive layout for desktop and mobile.
- Dynamic logo upload and removal per report.
- Print optimization for one-page A4 output.
- Full Arabic RTL support and typography tuning.
- Demo data loader for realistic sample reporting.

## Technologies used
- HTML
- CSS
- Vanilla JavaScript
- Chart.js
- LocalStorage API

## File structure
- `index.html`  
  Main page layout, control panel, report preview, and semantic structure.
- `style.css`  
  Theme variables, responsive styles, print styles, and executive visual polish.
- `app.js`  
  Logic for storage, report rendering, chart updates, export workflow, and utilities.
- `assets/`  
  Reserved directory for future static assets (logos, screenshots, brand files).

## How to run
1. Download or clone the repository.
2. Open `index.html` directly in any modern browser.
3. Start editing report data from the control panel.

No installation, package manager, backend, or build steps are required.

### GitHub Pages compatibility
The project is fully static and works directly on GitHub Pages with no extra configuration.

## How PDF export works
PDF export uses the browser print engine:
1. Click **تصدير PDF**.
2. Choose **Save as PDF**.
3. Recommended settings:
   - **Margins: None**
   - Disable **Headers and footers**
   - Keep paper size at **A4 Portrait**

The print stylesheet forces a clean white output theme for consistent executive documents.

## Theme system
Themes are implemented through CSS custom properties (`--bg`, `--surface`, `--text`, `--chart-*`, etc.) and applied using `body[data-theme="..."]`.

Available themes:
- `sdaia`
- `light`
- `dark-executive`

For printing, theme values are overridden to white-page output for maximum PDF consistency.

## Data persistence
All reports are saved in the browser via LocalStorage:
- Report list and content are serialized as JSON.
- Active report ID is stored separately.
- Autosave triggers when fields are edited.

Data remains available between sessions on the same browser/device unless LocalStorage is cleared.

## Future roadmap
Planned next phases:
- AI insights and recommendation layer.
- Forecasting and trend projection modules.
- Advanced analytics KPIs.
- Template builder for custom executive formats.
- Organization profile management.
- Optional API integration for system-to-system data feeds.

## Design philosophy
- Lightweight and immediate (no setup friction).
- Editable by non-technical teams.
- Print-first quality for executive sharing.
- Executive-focused structure and wording.
- No backend complexity for internal fast adoption.

## Screenshots
> Placeholder — to be added in future updates.

- `![Dashboard Screenshot Placeholder](assets/screenshots/dashboard-placeholder.png)`
- `![Print PDF Placeholder](assets/screenshots/print-placeholder.png)`

## License
MIT-style placeholder:

```
MIT License

Copyright (c) [Year] [Organization]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```
