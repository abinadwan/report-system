# Report System

**منصة تقارير مرنة ومفتوحة المصدر — A flexible, open-source reporting workspace**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) ![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow) ![Languages](https://img.shields.io/badge/UI-Arabic%20%7C%20English-2563a6)

<p align="center"><img src="assets/report-system-mark.svg" width="110" alt="Report System logo"></p>

**[العربية](#العربية) | [English](#english)**

---

## العربية

### نبذة عن المشروع

**Report System** تطبيق ويب مفتوح المصدر لإنشاء تقارير أداء دورية، ومقارنات متعددة الفترات، وتحليل الاتجاهات، والملخصات التنفيذية. يمكنك البدء بقالب عام أو باستخدام قوالب مركز الاتصال وإدارة المشاريع والمبيعات، ثم تخصيص المؤشرات والفترات حسب احتياجك.

المشروع مبني على **HTML5 وCSS3 وJavaScript (ES Modules)** دون React أو خادم خلفي أو اعتماديات تشغيل تُحمّل من شبكة خارجية. يخزن التقارير محليًا داخل المتصفح ولا يرفع محتواها إلى خادم التطبيق.

### الميزات الأساسية

- **واجهة عربية وإنجليزية:** تبديل اللغة من أعلى الصفحة، مع تغيير الاتجاه تلقائيًا بين RTL وLTR، وتذكر الاختيار محليًا. لغة الواجهة لا تغيّر أسماء التقارير أو بيانات المستخدم الأصلية.
- **ثلاث مراحل عمل:** «تقاريري» لإدارة التقارير، «إدخال البيانات» للتحرير والاستيراد، و«عرض التقرير» لمراجعة المؤشرات والتصدير.
- **فترات مرنة:** سنوات كاملة، نصف سنوية، أرباع سنوية، أو مجموعة أشهر مخصصة؛ يمكن اختيار فترات مختلفة داخل السنة نفسها أو مقارنة ثلاث سنوات وأكثر.
- **مؤشرات ديناميكية:** إنشاء مؤشرات للجمع، أو المتوسط الشهري للقيم المتاحة، أو النسب المرجّحة باستخدام بسط ومقام.
- **جدول إدخال شبيه بالجداول الإلكترونية:** الأشهر في صفوف، والفترات في أعمدة، مع إمكانية التبديل بين المؤشرات.
- **قوالب ابتدائية:** تقرير عام، مركز اتصال، إدارة مشاريع، ومبيعات. القوالب قابلة للتعديل وليست قيودًا على التحليل.
- **البيانات:** إدخال يدوي أو استيراد CSV وملفات XLSX المدعومة، مع تصدير CSV.
- **النتائج:** ملخص وصفي، بطاقات مؤشرات، مخططات شريطية وجداول، مع تنبيهات للبيانات الناقصة أو المقارنات غير المتكافئة.
- **النسخ الاحتياطي:** نسخ JSON لتقرير واحد أو للمكتبة كاملة، واستعادة المكتبة من ملف متوافق.
- **تصدير PDF:** عبر ميزة الطباعة أو «حفظ PDF» في المتصفح، مع تنسيق طباعة خاص.
- **بدون حساب مستخدم:** يعمل التطبيق من متصفح حديث وعلى عنوان محلي أو استضافة ملفات ثابتة.

### التشغيل على الجهاز

**المتطلبات:** متصفح حديث مثل Chrome أو Edge أو Firefox، وPython 3 لتشغيل خادم HTTP محلي بسيط.

```bash
git clone https://github.com/abinadwan/report-system.git
cd report-system
python -m http.server 5500
```

افتح العنوان: **http://localhost:5500/**.

إذا كان الأمر `python` غير متوفر على Windows فجرّب `py -m http.server 5500`. على macOS أو Linux قد تحتاج `python3 -m http.server 5500`.

**مهم:** لا تفتح `index.html` باستخدام المسار `file://`؛ استخدم خادم HTTP حتى تعمل وحدات JavaScript بصورة موثوقة. الاستضافة على GitHub Pages ممكنة دون Backend.

### إنشاء تقرير جديد

1. افتح **تقاريري** واضغط «إنشاء تقرير».
2. أدخل العنوان وحدد هدف التقرير والقالب المطلوب.
3. أنشئ المؤشرات وحدد وحدة القياس وطريقة الاحتساب.
4. أضف السنوات أو الفترات، واختر الأشهر المطلوبة لكل فترة.
5. أدخل القيم في الجدول، أو استورد ملف Excel/CSV.
6. انتقل إلى **عرض التقرير** لمراجعة الحسابات والتنبيهات، ثم اطبع أو احفظ PDF.
7. يمكنك العودة لتعديل البيانات في أي وقت؛ يتم حفظ المسودة في المتصفح.

### تصاميم عرض التقرير

تحتوي شاشة **عرض التقرير** على أربعة تصاميم مستقلة، مع معاينة مباشرة قبل الطباعة:

| التصميم | الاستخدام المقترح |
|---|---|
| **تنفيذي (Executive)** | عرض مؤشرات الأداء للإدارة عبر بطاقات واضحة وملخصات مختصرة؛ وهو الشكل الافتراضي |
| **تحليلي (Analytical)** | إبراز الرسوم والمقارنات بألوان تركوازية وتفاصيل تحليلية أوضح |
| **رسمي (Formal)** | مستند بألوان محايدة وجداول واضحة يناسب الطباعة الرسمية |
| **عصري (Modern)** | توزيع بصري حديث وألوان بنفسجية وزرقاء وبطاقات بارزة |

يستطيع المستخدم تغيير التصميم مباشرة، ويُحفظ الاختيار **داخل التقرير نفسه** وينتقل معه في ملفات النسخ الاحتياطي JSON. لا يؤثر التصميم في الأرقام أو الحسابات أو اختيار السنوات والفترات، وتطبّق إعداداته على معاينة الصفحة وملف PDF عند استخدام الطباعة. التقارير القديمة التي لا تحتوي على خاصية تصميم تعرض الشكل التنفيذي افتراضيًا دون ترحيل بيانات.

**الحقوق:** يظهر تذييل المنصة حقوق النشر ورابط المستودع فقط، بينما يبقى ملف [LICENSE](LICENSE) الأصلي في GitHub ولا يظهر رابط الرخصة في الصفحة العامة.

### استيراد CSV وExcel

**صيغة CSV الطويلة (Long format):** كل صف يمثل قيمة مؤشر واحدة في شهر واحد:

```csv
periodId,period,year,month,metric,value
p-2025,2025,2025,1,Calls,120
p-2025,2025,2025,2,Calls,135
p-2026-h1,H1 2026,2026,1,Calls,150
```

يُصدر النظام عمود `periodId` الثابت تلقائيًا حتى لا تندمج الفترات غير المسماة أو المتشابهة عند إعادة استيراد CSV. العمود اختياري عند **استيراد الملفات القديمة**؛ بدون `periodId` يعتمد التجميع على `(period, year)` ولا يمكن التمييز بين فترتين غير مسمّاتين من السنة نفسها. تبقى أسماء الفترات الفارغة فارغة عند التصدير والاستيراد الحديث. يمكن استخدام أسماء أعمدة عربية مثل `السنة` و`الشهر`، كما تُقبل مرادفات الأشهر العربية الشائعة.

**صيغة الأعمدة المتعددة (Wide format):**

```csv
Year,Month,Calls,Answered
2025,1,120,100
2025,2,135,122
2026,1,150,132
```

يدعم الاستيراد أيضًا العمود `Date` مع تواريخ من نمط `YYYY-MM` أو `YYYY-MM-DD`. تتم قراءة الورقة الأولى فقط من ملفات XLSX المدعومة. تُرفض الصفوف المكررة لنفس الفترة/السنة/الشهر/المؤشر في البيانات الطويلة. قد تحتاج ملفات Excel المتقدمة أو غير الشائعة إلى حفظها أولًا بصيغة CSV.

**انتبه:** الاستيراد يحل محل فترات التقرير ومؤشراته وقيمه الحالية بعد تأكيدك؛ أنشئ نسخة احتياطية قبل الاستبدال.

### تعريف المؤشرات وصحة المقارنات

| الطريقة | كيفية الحساب |
|---|---|
| المجموع (Sum) | مجموع القيم المتوفرة للأشهر المختارة |
| المتوسط (Average) | مجموع القيم ÷ عدد الأشهر التي تحتوي على قيم فعلية |
| نسبة مرجّحة (Ratio) | مجموع البسط ÷ مجموع المقام × 100، للأشهر التي تملك بيانات مشتركة ويكون فيها المقام موجبًا |

القيمة الفارغة **ليست صفرًا**. لا يُعرض التغير المئوي بين فترتين عند نقص بيانات إحداهما أو اختلاف عدد الأشهر. وتطبق بعض القوالب تحققًا إضافيًا، مثل منع زيادة المكالمات المجابة على المكالمات الواردة في قالب مركز الاتصال.

هذا لا يضمن صحة البيانات التي أدخلها المستخدم؛ راجع مصادر البيانات وتعريف المؤشرات قبل الاعتماد الرسمي.

### التخزين والنسخ الاحتياطي والخصوصية

- يخزّن التطبيق مكتبة التقارير في **localStorage** ويحتفظ بنسخة في **IndexedDB** حيث يتوفر ذلك.
- البيانات محصورة بالمتصفح وعنوان الموقع (Origin)؛ لا تتزامن تلقائيًا بين الأجهزة.
- زر **نسخ احتياطي للكل** يصدّر ملف `report-system-library-backup.json` يتضمن التقارير وقيمها وإعداداتها.
- زر **استعادة المكتبة** يقرأ ملف النسخة الاحتياطية، ويتحقق من بنيته، ثم **يستبدل المكتبة الحالية** بعد مطالبتك بالتأكيد. لا يدمج الملف بالتقارير الموجودة.
- **نسخة JSON** داخل محرر التقرير تخص التقرير الحالي، ولا تصلح لاستعادة المكتبة الكاملة.
- حذف بيانات المتصفح أو تشغيل الموقع من عنوان مختلف قد يمنع الوصول إلى التقارير القديمة؛ احتفظ بنسخ JSON خارج المتصفح.

**خصوصية البيانات:** لا يتضمن التطبيق الحالي تسجيل دخول أو خادمًا يستقبل بيانات التقارير أو تحليلاً سحابيًا. لا ترسل الملفات إلى جهة خارجية إلا إذا اخترت مشاركتها بنفسك.

### تطوير المشروع واختباره

```bash
npm install
npm run check
npm test
npx playwright install chromium
npm run test:browser
```

`npm` وPlaywright مطلوبان للاختبارات والتطوير فقط؛ تشغيل الموقع للمستخدم النهائي لا يتطلب Node أو تثبيت حزم. تقوم GitHub Actions بتشغيل فحوص الصياغة والاختبارات الآلية والمتصفح عند تحديثات المشروع.

**أهم الملفات:**

```text
index.html                  # الصفحة الرئيسية
styles.css                  # التصميم العام والاتجاهات
report-designs.css          # تصاميم التقارير الأربعة والطباعة
assets/report-system-mark.svg # الشعار المتجهي
js/app-v3.js                # سير العمل وإدارة حالة الواجهة
js/i18n.js                  # العربية والإنجليزية واتجاه الصفحة
js/engine.js                # المؤشرات والحسابات
js/csv.js                   # استيراد وتصدير CSV
js/xlsx.js                  # قراءة XLSX
js/storage.js               # IndexedDB
js/library-backup.js        # النسخ الاحتياطي والاستعادة
tests/                     # اختبارات Node والمتصفح
LICENSE                    # رخصة MIT
```

### الحدود الحالية وخارطة التطوير

- اختيار النطاق الزمني يجري على **مستوى الأشهر**؛ لا تتوفر مقارنة بتاريخ يومي مخصص بعد.
- قارئ XLSX يدعم جداول شائعة من الورقة الأولى، وليس جميع صيغ Excel أو وحداته الإضافية.
- يعتمد PDF على طباعة المتصفح؛ لم يُعتمد تنسيق موحد لجميع المتصفحات أو التقارير الطويلة.
- التطبيق محلي أولًا ولا يوفر مزامنة مشتركة أو تسجيل دخول أو صلاحيات فرق.
- لا تدعم المؤشرات الأساسية حاليًا القيم السالبة أو جميع أنواع المعادلات المالية والمرجحة.
- الترجمة تخص واجهة الاستخدام، ولا تترجم النصوص التي أدخلها المستخدم أو محتويات الملفات المستوردة.

### الرخصة والمساهمة

المشروع مفتوح المصدر وفق **[رخصة MIT](LICENSE)**. يمكنك استخدامه وتعديله وإعادة نشره، بما في ذلك الاستخدام التجاري، بشرط الاحتفاظ بإشعار حقوق النشر ونص الرخصة. مساهمات تحسين الجودة، وإتاحة الوصول، والاستيراد، وتغطية الاختبارات مرحب بها عبر Issues وPull Requests.

---

## English

### Overview

**Report System** is an open-source, browser-based reporting workspace for monthly and annual performance reviews, period comparisons, trends, and executive summaries. It works with customizable periods and metrics, plus starter templates for contact centers, projects, sales, and general reporting.

It uses **HTML5, CSS3, and vanilla JavaScript ES modules** — no React, mandatory backend, account registration, or runtime CDN dependencies. Reports stay in your browser unless you explicitly export or share them.

### Core features

- **Arabic and English interface:** Language switch in the header, automatic RTL/LTR direction, saved language preference, and localized numeric display. User-entered names and values are not altered when switching languages.
- **Three-step workflow:** Report library → Data entry → Report preview.
- **Dynamic periods:** Full years, half-years, quarters, and selected months. Compare multiple years or overlapping named periods.
- **Custom metrics:** Sum, observed-month average, and weighted ratios calculated from numerator and denominator data.
- **Editable input grid:** Months as rows, reporting periods as columns, and a tab for each base metric.
- **Starter templates:** General, contact center, project management, and sales.
- **Imports and exports:** Manual entry, UTF-8 CSV long/wide formats, supported first-sheet XLSX, CSV export, JSON backups, and browser PDF printing.
- **Data quality guidance:** Highlights missing observations and suppresses unsupported percentage comparisons.
- **Local-first saving:** Report library in browser storage, IndexedDB recovery copy, and full-library JSON backup and restore.

### Local setup

You need a modern browser and a local HTTP server, such as Python 3:

```bash
git clone https://github.com/abinadwan/report-system.git
cd report-system
python -m http.server 5500
```

Visit **http://localhost:5500/** and use the header language toggle to select English. On macOS/Linux, use `python3` if needed; on Windows, `py` may be available.

Do not open the application directly as `file://index.html`: ES module imports work reliably when served over HTTP(S). The repository can also be hosted as static files on GitHub Pages.

### How to create a report

1. Open **My reports** and select **New report**.
2. Enter a title, report type, and optional starter template.
3. Configure metrics and aggregation methods.
4. Add as many valid reporting periods as needed, choosing their years and months.
5. Enter data in the monthly grid or import CSV/XLSX.
6. Open **View insights** to review metrics, charts, warnings, and tables.
7. Print or save the resulting report as PDF, or return to adjust the data.

### Report display designs

The **Report preview** screen offers four switchable report layouts with live previews:

| Style | Best for |
|---|---|
| **Executive** (default) | KPI cards and management summaries |
| **Analytical** | Chart-focused comparisons and performance analysis |
| **Formal** | Monochrome, table-led documents intended for print |
| **Modern** | Editorial typography, bold cards, and purple/blue accents |

Selecting a style changes **presentation only**. Calculations, metrics, source data, and period selections are unchanged. Each report retains its own chosen style across reloads, individual JSON exports, and full-library backups. Existing reports with no stored design remain in the Executive layout. Browser print / Save as PDF uses the same style applied to the preview. The website footer shows copyright and a repository link; the [MIT license](LICENSE) remains in the GitHub repository, rather than in the public footer.

Report-specific styling is isolated in `report-designs.css`; the underlying reporting engine is shared across all layouts.

### CSV and Excel formats

Long-format example:

```csv
periodId,period,year,month,metric,value
p-2024,2024,2024,1,Calls,120
p-2025,2025,2025,1,Calls,150
p-2026-h1,2026 H1,2026,1,Calls,180
```

`periodId` is exported as a stable identifier, preventing same-year or unnamed periods from merging during a CSV round-trip. Older files without `periodId` remain supported and are grouped by `(period, year)`; that legacy format **cannot distinguish two unnamed periods in the same year**. An empty period name stays empty when the stable ID is present. The importer also accepts wide-format columns, such as:

```csv
Year,Month,Calls,Answered
2025,1,120,115
2025,2,100,98
2026,1,130,121
```

Arabic headers and Arabic numerals are supported for several fields, along with ISO-like `Date` columns. XLSX import is limited to supported formats in the **first worksheet**, and some workbooks may need conversion to CSV.

**Warning:** Data import replaces the current periods, metrics, and observations after confirmation.

### Metric semantics

| Method | Definition |
|---|---|
| Sum | Sum of available values over selected months |
| Average | Mean over *observed* months only |
| Weighted ratio | Sum(numerator) / Sum(denominator) × 100 across months with both inputs and positive denominators |

Missing is different from zero. Period-over-period percentage change is hidden when a period is incomplete or when compared periods have unequal month counts. Certain metric templates enforce additional bounds (for example, answered calls must not exceed offered calls).

### Backups, restoration, and security

- Browser data is scoped to the browser profile and website origin; there is no built-in cross-device synchronization.
- **Back up library** downloads `report-system-library-backup.json` containing all currently saved reports and values.
- **Restore library** validates a compatible library backup and **replaces your current library** after explicit confirmation. It does not merge.
- **Back up report** generates a separate single-report JSON file. Do not use this file with the full-library restore control.
- IndexedDB provides a recovery copy where supported, but it is not a substitute for independent backups.
- Clearing browser storage, changing browsers, or changing the origin may make locally stored data inaccessible. Export backups before making such changes.

The application has no server endpoint that collects uploaded reports. You remain responsible for handling and protecting any sensitive content in exported files.

### Development and tests

```bash
npm install
npm run check
npm test
npx playwright install chromium
npm run test:browser
```

Node.js is used for developer tooling and browser tests, not for running the static application in production. See the file structure and feature details in the Arabic section above.

### Known limitations

This release focuses on browser-based monthly data, standard first-sheet XLSX files, locally saved reports, and browser print/PDF. It does not currently provide arbitrary daily periods, collaborative cloud workspaces, authentication, a dedicated PDF rendering engine, or comprehensive support for negative financial measures.

### License and contributing

Licensed under the **[MIT License](LICENSE)**. You may use, modify, distribute, and commercially deploy this project while keeping the copyright and license notice. Issues and pull requests are welcome.

---

© 2026 Report System contributors. Licensed under MIT.
