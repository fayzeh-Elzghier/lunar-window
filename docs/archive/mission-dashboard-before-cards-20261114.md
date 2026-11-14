# ZENITH demo redesign — local review

Updated 2026-11-14. This English-only interface supersedes the earlier bilingual delivery. No commit, push, deployment or remote change was made.

## What was removed

The oversized home/console marketing sections, slogans, promotional sample counts, generic feature grids, decorative artwork/background effects, duplicate navigation, language switcher and Arabic content from the active demo and presentation.

The console no longer loads a translation observer or alternate-language slide content. The old bilingual slide script remains unreferenced as an earlier local artifact. Unused active markup and event handlers were removed, rather than hiding an obsolete interface with CSS.

Also removed from the active workflow: the 30-minute shortcut, duplicate power/Earth mode buttons, ranking selector, month-wide overview control, simultaneous large charts, nearly identical five-minute alternative lists, next-set cards, oversized unknown-margin result, raw hash displays and repeated limitation cards. The engine's other ranking/event methods remain preserved and tested; no NASA evidence or historical scientific documentation was deleted.

## What changed and why

The default route now goes straight to the planner. A compact header shows the approved logo/name, descriptor and one Model & sources link. Configuration is beside the results on desktop and before them on phones. Panel assumptions are collapsed with a visible live summary.

One primary Compare options action and one Load example action replace competing workflows. Both sites are ranked by earliest allowed start under unchanged requirements. Supported date ranges and the selected common cadence appear before submission. Field-level errors identify unsupported boundaries/durations and do not silently round or change an input. Cross-boundary searches use common hourly data; missing fine data are disclosed as hourly-only availability.

A single decision section explains the original conflict and compares three meaningful roles: original plan, earliest nominal candidate and a candidate meeting the declared sensitivity exercise. Each shows the exact UTC interval, site, nominal minimum and difference from demand, sensitivity minimum and short interpretation. Additional delay and remaining schedule allowance are explicit. The marginal example's reserve stays visible as 0.250 W.

Inspecting a case updates the charts without changing the form, original report or latest permitted start. Use as new plan is a separate action, reduces remaining delay by the exact applied delay and recalculates. On phones, comparison/inspection brings the corresponding result into view.

Power over time and Sun, Earth & horizon are keyboard-operable tabs. The power plot defaults to the selected operation rather than the full month. It shows nominal power, the declared sensitivity lower envelope, demand and actual source-time markers. The lower envelope takes the minimum over nine orientations separately at each epoch; it is explicitly not one physical panel trajectory. The horizon view retains azimuth/elevation, sampled terrain and the same-time two-site comparison. Plot labels render at their actual responsive size instead of shrinking a wide desktop SVG on phones.

One visible preliminary-model notice and short decision-critical qualifications replace repeated warnings. The single Evidence & assumptions disclosure holds model details, source links, verification scope and current JSON/CSV/print actions. All exports are disabled and the print content cleared immediately when inputs change.

The seven-slide presentation uses the same restrained identity and English content. Displayed scenario values are computed from the existing engine and source bundles. No successful result is hard-coded.

## Files for review

| File | Purpose in this redesign |
|---|---|
| index.html | Direct default route to the active planner |
| docs/index.html | Preserve home route while directing it to the same planner; remove competing marketing home |
| docs/mission-console.html | New compact form, one comparison, two focused views, one evidence disclosure |
| docs/mission-console.css | Shared palette/spacing/typography, responsive cards, accessible controls and print treatment; remove decorative effects/RTL |
| docs/mission-console.js | Replace only the DOM adapter; preserve the scientific engine prefix exactly; validate, invalidate, inspect and explicitly apply |
| docs/decision-brief.js | Render the three actual result roles with exact values and meaningful distinctions |
| docs/mission-explorer.js | Selected-operation curves, real source-time slider, responsive axes and common-time horizon/site view |
| docs/zenith-ui.js | English-only current-context JSON/CSV and print evidence; remove translation handlers |
| docs/judges-slides.html | Focused seven-slide English story |
| docs/judges-slides.css | Responsive presentation styling using the shared design tokens |
| docs/judges-slides.js | Source-derived scenario values and accessible navigation |
| scripts/verify_console.cjs | Update intentional UI label changes; strengthen DOM-ID checks across all active modules |
| scripts/verify_zenith.cjs | Keep the seven engine tests and sampling diagnostic; update contrast pairs to the redesigned palette |
| scripts/browser_acceptance.cjs | Retain numerical/source assertions with the redesigned walkthrough, independent inspection and explicit application |
| scripts/browser_zenith.cjs | English-only responsive/state/export/keyboard/source-failure acceptance |
| README.md | Current entry points, controls and local commands |
| docs/OBJECTIVES_AND_RELEASE_GATES.md | Map the current interface to the challenge without stale UI claims |
| docs/SUBMISSION_DEMO.md | Current English walkthrough, source-time behavior and limitations |
| docs/JUDGES_BRIEF.md | Align judging directions with inspection versus application and the English-only workflow |
| docs/HUMAN_EVALUATION.md | Keep results pending; adapt tasks to the English-only inspection/application design |
| docs/ZENITH_DELIVERY.md | Mark the earlier bilingual handoff as historical |
| docs/DEMO_REDESIGN.md | This review, actual checks and remaining gaps |

Previous local edits were inspected and preserved before modification. Snapshots of the earlier active files and baseline browser scripts are in ignored artifacts/redesign/before/. The scientific engine prefix was compared byte-for-byte before and after; it is unchanged. A baseline fingerprint manifest confirms all 54 files under data/ and docs/data/ are unchanged by this redesign. Existing uncommitted changes and historical evidence remain intact. The approved logo pixels, original records, provenance, citations and AI disclosure are retained.

## Validation

Baseline before redesign:
- 17 Python source/reference/legacy tests: pass.
- Active console verifier: pass.
- 20 extended engine regressions: pass.
- Seven ZENITH engine regressions and temporal/contrast diagnostics: pass.
- Separate numerical verifier: 2,882 raw records and 8,646 power comparisons pass; max difference 1.137e-13 W.
- Earlier real-browser acceptance: pass; saved as the pre-redesign baseline.

After redesign:
- The same scientific/source checks pass. The engine and evidence have not been corrected or retuned.
- Original example retains 50.156 W original nominal minimum, 12:40 nominal candidate at 100.283 W / 82.531 W under the declared test, and 17:45 candidate at 120.094 W / 100.250 W. Candidate counts stay 153 nominal, 92 passing ±1°, zero passing ±5°. Both tests include 10% lower output and nine orientation combinations.
- Chrome walkthrough verifies these numbers, exact times, JSON provenance, independent inspection, explicit application/deadline preservation, stale results, site changes, mobile layout and seven-slide navigation.
- Detailed Chrome checks at 1440, 1024, 390 and 320 px cover initial/valid/no-candidate/invalid/insufficient/stale/missing-evidence states, fractional-duration guards, genuine five-minute duration support, fine/hourly boundary handling, late partial coverage without changing delay, missing fine-bundle fallback, corrupt provenance rejection, tab/slider/disclosure keyboard controls, focus visibility, exports, print command and real PDF rendering.
- Both sites and all visible markers use the exact selected source epoch. The plotted sensitivity lower-envelope minimum agrees with the engine within the existing 0.000501 W rounding threshold. No interpolated ephemerides are generated.
- No horizontal overflow, clipped labels, failed assets or browser exceptions were detected in the tested layouts. Source-time slider announcements use actual UTC timestamps, not just numeric indices.
- Direct-file/offline use and default route redirects pass. Generated artifacts stay outside source data.
- Python compilation, JavaScript syntax, legacy dashboard checks and git diff whitespace checks pass.

Print-command tests suppress the OS dialog and separately exercise Chromium's real print CSS/PDF output. They do not claim a physical printer was tested. Screenshots and the current decision PDF are in artifacts/redesign/; the main walkthrough saves artifacts/browser/. New numerical evidence is artifacts/redesign/current-numerics.md. No new video was recorded. Declared contrast pairs exceed 4.5:1; this is not a complete accessibility conformance audit.

## Remaining science and usability gaps

This is preliminary screening using an ideal fixed-panel model and binary Sun-center terrain blocking. It does not establish continuous operation, complete battery behavior, eclipses/partial-disk effects, thermal/electrical losses, station-specific RF contact, a physical time margin or landing safety.

Frame/datum reconciliation and independent terrain/horizon validation remain incomplete. Terrain radial/angular convergence and a reproducible SPICE/Horizons comparison remain NOT RUN for the reasons recorded in SCIENCE_REVIEW.md. Temporal investigation uses genuine hourly versus five-minute data; sub-five-minute convergence is inconclusive.

The power envelope adds a faithful view of the declared exercise, not independent physical evidence. The prototype still offers two curated sites and fixed demonstrative sensitivity profiles. Firefox/Safari, screen readers, domain-expert review and real human task evaluation are not verified here. A cleaner layout is not evidence of measured comprehension, impact or time saving.

## Judging reassessment

These are qualitative engineering judgments, with no numerical weights or score.

| Criterion | Current assessment | Remaining evidence |
|---|---|---|
| Impact | Clear operation-specific conflict, alternatives and reserve help frame a real planning question | Actual usefulness, comprehension and time saving remain unmeasured |
| Creativity | Fixed-requirement alternatives, explicit sensitivity and inspect/apply distinction make the decision explainable | No claim of unique algorithms or superiority to existing NASA tools |
| Validity | Unchanged engine/data, original regression preserved, exact source timestamps and explicit model limits | Independent physical validation and continuity remain unproven |
| Relevance | Site/date, Sun/Earth/terrain, solar-power potential and geometric visibility remain directly usable | Only two curated sites and the declared model are covered |
| Presentation | One comparison and focused tabs offer a clearer first-view hierarchy with supporting evidence secondary | One-minute comprehension is a design objective, not a measured human outcome |

## Preview in VS Code

From the workspace root:

~~~powershell
python -m http.server 8765 --bind 127.0.0.1 --directory docs
~~~

Open http://127.0.0.1:8765/mission-console.html or http://127.0.0.1:8765/. Presentation: http://127.0.0.1:8765/judges-slides.html. Opening docs/index.html directly also works offline.

With that server running and the existing Playwright installation available:

~~~powershell
node scripts/browser_acceptance.cjs
node scripts/browser_zenith.cjs
~~~

The tests use installed Windows Chrome here. Other environments can provide BROWSER_EXECUTABLE or install Playwright's Chromium. No installation, publishing or remote synchronization is required for ordinary offline operation.
