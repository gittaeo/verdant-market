# Design audit · 2026-10-31

Target: `web/index.html`, its real stylesheet `public/refined.css`, and dynamic UI templates in `public/refined.js`.

Tools:
- Impeccable 4.8.0 (`npx --yes impeccable@4.8.0 detect --json ...`). Official source inspected at pbakaus/impeccable commit b7a89176e4e87422b40f98adabceb051dbb5448b.
- Hallmark `skills/hallmark/scripts/sloplint.mjs`, Nutlope/hallmark commit 4f6a46c6dc325d40ab268c93e25c7b96676ebccd.

Both tools were actually executed. No suppressions, ignore configuration, fabricated Hallmark stamp, or theme waiver was added.

## Shared findings addressed first

| Finding | Before | After |
| --- | ---: | ---: |
| Impeccable kicker-above-heading | 5 | 0 |
| Hallmark gate 54 (redundant heading labels) | 7 | 0 |
| Impeccable undersized functional text | 77 | 0 |
| Impeccable tiny body text | 17 | 0 |
| Impeccable low contrast (static estimate) | 17 | 0 |
| Impeccable dark glow | 3 | 0 |
| Impeccable all findings | 127 | 3 |
| Hallmark FAIL findings | 481 | 430 |

Counts use `*-resolved-*.json`: an audit-only copy of the actual HTML with `/refined.css` substituted by its CSS content in the same cascade position. The `before` input uses git commit 4242924. This avoids a known file-scan path issue: Impeccable resolves the root-relative stylesheet to `web/refined.css` when reading the original file from disk. Direct source scan reports are also retained as `impeccable-before/after.json` and `hallmark-before/after.json`; they have a narrower CSS view and must not be compared to resolved counts.

## Changes

Removed redundant heading labels from both static HTML and dynamic result/modal templates, rather than hiding them with CSS. Investment horizons and source dates are retained in headings or normal metadata. Deleted orphaned heading-label styles. Removed colored glow, decorative pulsing and sweep/stripe effects; simplified candidate surfaces and hover treatment. Increased text below 12px to 12px or larger, improved muted text contrast, and moved the overriding stylesheet after the base styles. Preserved all existing HTML IDs and research actions.

## Remaining findings and verification limits

Impeccable still flags three cramped-padding instances (two legacy market items and the price-chart bottom edge). Hallmark retains token, theme/stamp, spacing-scale, label/caps and other findings. This is a focused correction of overlapping problems, not a claim that the whole page passes either tool.

Static checks only: no `--render`, browser automation or viewport screenshot review was run. Dynamic templates were checked for remaining heading-label markup and JavaScript syntax; all data/research tests (27) passed. No price, scoring, forecasting or API credential behavior was changed.

## Re-run

From the repository, with Node/npm available and the Hallmark clone outside the repo:

```powershell
npx --yes impeccable@4.8.0 detect --json web/index.html
node ../.design-tools/hallmark/skills/hallmark/scripts/sloplint.mjs web/index.html public/refined.css --json
```

For the resolved comparison, substitute the stylesheet link in a temporary copy with the stylesheet text, then give the same temporary HTML to both tools. Source tool exit codes indicating findings are expected; they do not mean that the scan failed to execute.
