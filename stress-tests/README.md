# OSER Stress Tests

Small, versionable stress-test inputs for OSER. These cases are designed to expose current behavior and gaps without fixing them during the test run. Generated outputs should stay out of git.

## Cases

- `cases/bad-heading-hierarchy.md`: exercises heading hierarchy diagnostics with a small Markdown document.

## Validate

```sh
npm run validate -- stress-tests/cases/bad-heading-hierarchy.md
```

## Render HTML

```sh
npm run render:html -- stress-tests/cases/bad-heading-hierarchy.md stress-tests/outputs/bad-heading-hierarchy.html --profile examples/profiles/report.json --manifest stress-tests/outputs/bad-heading-hierarchy.manifest.json
```

## Export PDF Optional

```sh
npm run render:pdf -- stress-tests/cases/bad-heading-hierarchy.md stress-tests/outputs/bad-heading-hierarchy.pdf --profile examples/profiles/report.json --manifest stress-tests/outputs/bad-heading-hierarchy-pdf.manifest.json
```

## Manual Result Log

When running a case, record observations in a manual note or issue with:

- input path
- command used
- generated output path
- observed failure
- severity
- likely cause
- suggested issue

Do not commit generated HTML, PDF, screenshots, or large derived artifacts.
