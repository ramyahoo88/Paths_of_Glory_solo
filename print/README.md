# Rebuilding the print files

Run these commands from the repository root after setting up the engine with `sim/setup_engine.sh`:

```
node app/build_app.js
node print/build.js
python3 print/check_print.py
```

The default PDF renderer is Google Chrome; Pandoc converts the rules booklet to HTML. For an environment without Chrome, install Python's WeasyPrint package and use:

```
GS_PDF_ENGINE=weasyprint node print/build.js
```

The v1.0.0 PDFs were generated with WeasyPrint 70.0. Either renderer uses the same HTML sources. `NO_PDF=1 node print/build.js` rebuilds only the HTML. The cards are US Letter, six 2.5 × 3.5-inch cards per face page, followed by their optional backs.
