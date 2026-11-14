# ZENITH local delivery — 2026-11-14

> Historical delivery for the earlier bilingual interface. The user's later English-only redesign supersedes that UI. See [current redesign and tests](DEMO_REDESIGN.md). Source evidence and scientific boundaries remain preserved.

Lunar Landing Site Navigator · See the Horizon. Plan the Mission.

Implemented locally without commits, pushes, deployment, pull requests or remote changes. The initial working tree was clean. Repository history and active entry points were inspected before edits. Root HTML files still redirect to `docs/`; `docs/mission-console.js` is the active browser engine. `src/mission_rescue.py` and the archived explorer are separate reference/legacy implementations.

## Behavior delivered

- Full-month hourly overview and genuine five-minute decision view are explicitly distinguished. The selected 17:45 source timestamp drives geometry, terrain/power markers, same-time site comparison and exports. The operating interval is shaded on the power graph; demand is a separate labeled threshold.
- A common source cadence is selected for the entire search and both sites. Start and finish must match genuine timestamps. Incompatible duration/coverage is explained before submission and returns an insufficient-data state without an exhaustive unevaluable search. A compatible, evaluable search with no candidates has a distinct message. Users can explicitly choose whole-hour monthly durations or move their full search into Dec 20–25; inputs are never silently changed.
- Original, first ranked nominal and first ranked sensitivity-passing results retain fixed mission requirements. Inspection reduces remaining delay to preserve the original latest permitted start. The declared profile reserve is displayed to 0.001 W.
- English/Arabic switching, RTL, local font fallbacks, translated workflow messages, coordinate/panel guide and print summaries. Language switching preserves current inputs and report. Settings invalidate both JSON and print outputs. Technical identifiers and UTC remain explicit. Human Arabic-language review is still pending.
- Printable brief includes exact intervals, settings, ranking results, nominal/sensitivity minima, source cadence/coverage, raw source identifiers/hashes and model limits. It identifies ephemerides as predictions and does not call report preparation a NASA observation.
- Approved PNG used unchanged for hero/presentation; the navbar displays its symbol region. The favicon is an SVG viewport wrapper embedding that same symbol region, not an invented vector logo. No original vector SVG logo was supplied. Inter/Tajawal/Noto Sans Arabic are preferred when installed; system fonts provide offline fallbacks without a font-service dependency.
- Seven-slide English/Arabic presentation with live source-derived charts, the small 0.250 W reserve, wider-profile failure and clear verification limits. Historical videos/screenshots remain archived and are explicitly not evidence of the current ZENITH UI.

## Files changed and purpose

| File | Purpose |
|---|---|
| `.gitattributes` | Preserve byte-sensitive evidence on Windows; stable source line endings |
| `README.md` | ZENITH identity, local status, documentation and verification entry points |
| `index.html` | Rebrand existing home redirect title |
| `mission-console.html` | Rebrand existing planner redirect title |
| `judges-slides.html` | Rebrand existing slide redirect title |
| `docs/index.html` | Home identity, supplied logo, favicon, remove named attribution |
| `docs/mission-console.html` | Brand, cadence/coverage notices, overview control, language/print controls, coordinate guide |
| `docs/mission-console.css` | Reusable palette tokens, offline font fallbacks, RTL/mobile and print styles |
| `docs/mission-console.js` | Common-cadence assessment, distinct evaluation states, exact source-time selection, original sensitivity results |
| `docs/mission-explorer.js` | Common decision bundle for charts/sites/CSV, operating-interval shading |
| `docs/decision-brief.js` | Three-decimal evidence, additional delay, remaining budget and declared-profile reserve |
| `docs/zenith-ui.js` | Offline English/Arabic presentation layer and current-report print renderer |
| `docs/judges-slides.html` | Brand, approved lockup, source-derived chart values, reserve and local app links |
| `docs/slides-ar.js` | Seven Arabic slide narratives and switching without changing slide index |
| `docs/assets/zenith-logo.png` | Unmodified approved user-supplied asset |
| `docs/assets/zenith-favicon.svg` | Symbol viewport using approved PNG pixels |
| `docs/legacy-explorer.html` | Archived page's visible identity/title only |
| `scripts/browser_acceptance.cjs` | Run with installed Chrome, keep screenshot artifacts outside source, optional video |
| `scripts/browser_zenith.cjs` | Real-browser regressions for changed workflow, layouts, printing and offline use |
| `scripts/verify_zenith.cjs` | Cadence/boundary/requirement tests, genuine temporal sampling comparison, contrast checks |
| `scripts/verify_numerics.py` | Explicit output option; default audit report goes to artifacts instead of overwriting documentation |
| `docs/JUDGES_BRIEF.md` | Identity, reserve, judging answers, remove named role assignments and link human protocol |
| `docs/NASA_RESOURCES.md` | Official-source recheck and accurate Moon Trek positioning |
| `docs/OBJECTIVES_AND_RELEASE_GATES.md` | Current local behavior, checks and historical-artifact status |
| `docs/SCIENTIFIC_STATUS.md` | Point historical snapshot to current audit and remove named team attribution |
| `docs/SCIENCE_REVIEW.md` | Completed checks, predefined methods and precise unrun/inconclusive science work |
| `docs/HUMAN_EVALUATION.md` | Ready-to-run six-person pilot with tasks, metrics and predefined reporting criteria |
| `docs/ZENITH_DELIVERY.md` | This reviewable handoff |
| `docs/MISSION_RESCUE.md` | Visible identity update |
| `docs/STEP_01.md` | Remove named roles and obsolete synthetic-display instruction |
| `docs/STEP_03_TERRAIN_SCREEN.md` | Visible identity update |
| `docs/SUBMISSION_DEMO.md` | Remove named presentation assignments |
| `docs/SUBMISSION_READY_2026.md` | Visible identity update |
| `docs/TEAM_QUICK_GUIDE.md` | Remove named attribution and rebrand walkthrough |
| `docs/data-audit.md` | Identity and removal of named handoff attribution |

Raw evidence and browser bundles are byte-identical to their committed Git blobs. Initial hash failures came from Windows newline conversion; restoration was limited to files proved identical after reversing that conversion. Source values, schemas, recorded hashes, public repository URLs and model assumptions are preserved.

## Tests and actual results

| Check | Result / scope |
|---|---|
| Initial baseline | Python: 2 failures + 4 errors from raw-byte hashes; console verifier passed; extended suite stopped at a CRLF skyline hash mismatch |
| `python -m compileall -q src scripts tests` | PASS |
| `python -m unittest discover -s tests -v` | PASS, 17 tests; separate reference/legacy logic and evidence guards |
| `python scripts/check_dashboard_js.py` | PASS; archived explorer JavaScript and 338 site-epochs, not active engine acceptance |
| `node scripts/verify_console.cjs` | PASS; active engine, NASA parity, validation, no-certification gates and DOM IDs |
| `node scripts/verify_extended.cjs` | PASS, 20 active-engine corruption/science/scenario regressions |
| `node scripts/verify_zenith.cjs` | PASS, 7 added engine tests; temporal and contrast diagnostics |
| `python scripts/verify_numerics.py` | PASS, 2,882 raw records, 8,646 vector comparisons, both sensitivity profiles; max error 1.137e-13 W |
| `node scripts/browser_acceptance.cjs` | PASS, actual Chrome desktop/mobile, original demonstration, JSON export, charts, stale results and slide navigation; video not recorded |
| `node scripts/browser_zenith.cjs` | PASS, actual Chrome 1366/390px: 17:45 synchronization, both sites, latest start, bilingual/RTL, print PDFs, stale print protection, cadence rejection, no-candidate, CSV, keyboard focus, overflow and slide switching |
| `git diff --check` | PASS |

Core foreground/background contrast ratios: white/deep space 17.28:1; silver/panel 11.81:1; dark/amber action 10.68:1; dark/cyan action 10.06:1; muted/panel 8.14:1. Each exceeds 4.5:1. This checks declared text pairs, not every pixel/gradient or a complete WCAG audit. Sun/Earth remain amber/cyan with text labels; candidate states also have explicit text. Saved screenshots and English/Arabic PDFs are under `artifacts/zenith/`; existing acceptance screenshots are under `artifacts/browser/`. Generated numerical/temporal/contrast evidence is under `artifacts/audit/`.

## Science and remaining evidence

Reference outputs remain 50.156 W original, nominal 12:40 at 100.283 W / 82.531 W sensitivity, and 17:45 at 120.094 W / 100.250 W sensitivity. Counts remain 153 nominal, 92 passing ±1°, zero passing ±5°. Only **0.250 W** reserve under that illustrative profile is available at the later candidate.

The genuine hourly first candidate is 13:00; genuine five-minute first candidate is 12:40, a 20-minute difference. This passes the predeclared 0–60 minute sampling diagnostic. Sub-five-minute temporal convergence is **INCONCLUSIVE**. Terrain angular/radial convergence is **NOT RUN**: rasters and rasterio are absent. SPICE/Horizons comparison is **NOT RUN**: spiceypy and complete kernels are absent, and frame/datum mapping remains unresolved. No physical/model validation or human usability result is invented. See [science review](SCIENCE_REVIEW.md) for reproducible follow-up methods.

Human Arabic review, pilot task performance, expert frame/terrain/power review, screen-reader review and testing in Firefox/Safari remain pending. The 4.4 MB supplied PNG is retained at full fidelity; an approved optimized/vector asset would improve loading. No battery autonomy, continuous operation, RF link or landing safety is certified.

## Run in VS Code

From the workspace root in the VS Code terminal:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory docs
```

Open `http://127.0.0.1:8765/mission-console.html`, home at `http://127.0.0.1:8765/`, and slides at `http://127.0.0.1:8765/judges-slides.html`. The page also works by opening `docs/mission-console.html` directly without a server.

For browser tests, keep the server running in one terminal. Playwright is installed locally in ignored `artifacts/qa/`; tests fall back to it and auto-detect installed Windows Chrome. On another machine install it there or provide the ordinary Playwright dependency:

```powershell
npm install --no-save --package-lock=false --prefix artifacts/qa playwright
node scripts/browser_acceptance.cjs
node scripts/browser_zenith.cjs
```

Set `BROWSER_EXECUTABLE` when using another installed Chromium binary. Otherwise Playwright's own installed Chromium is used on other systems. Neither browser check should be called a human evaluation. Numerical report output can be selected with `python scripts/verify_numerics.py --output artifacts/audit/current-numerics.md`.

## Reassessment against judging criteria

No numeric total or weighting is assigned: the evidence does not support a defensible 97/100 claim.

| Criterion | Assessment grounded in current evidence |
|---|---|
| Impact | Plausible educational/operations decision aid; measured comprehension, time saving and adoption are pending |
| Creativity | Clear fixed-requirement decision and sensitivity trade-off; no claim of unique algorithms or superiority over NASA tools |
| Validity | Stronger implementation/provenance evidence; full terrain/frame/continuity and independent physical validation remain material weaknesses |
| Relevance | Direct use of NASA ephemerides and terrain for site/date, power and Earth-visibility questions; scope remains two curated sites |
| Presentation | Consistent supplied identity, exact timestamps, bilingual workflow/slides, inspectable print/export evidence; human language/accessibility review still needed |
