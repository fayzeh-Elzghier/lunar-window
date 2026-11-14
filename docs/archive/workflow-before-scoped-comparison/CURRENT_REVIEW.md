# Current local review — 2026-11-14

Empty fields remain the initial state. **Load example** is optional, editable, and does not run a calculation. **Clear inputs** removes results and stops playback. Compare plans uses the captured request, not example constants.

The main comparison now shows site, exact start, delay, nominal and sensitivity minima, Earth-screen status, cadence/point coverage and overall classification. Identical site/start plans merge their roles in one row. No candidate is fabricated when a role is unavailable. Whole-operation metrics remain separate from instantaneous source-sample values.

The full search continues to use one common cadence for both sites. Extending the full horizon beyond fine coverage deliberately selects hourly data. An explicit **Inspect fine-data subset (JSON)** action provides a separate bounded five-minute comparison where the original start and operation fit fine coverage. It preserves the original request/deadline as metadata and never mixes its ranking with the hourly comparison or changes the form. Partial search coverage is flagged in main results.

Start-delay allowance is not operating slack. The source-backed nominal slack method uses weaker criteria than candidate terrain-edge qualification and does not include sensitivity constraints. Missing coverage/no later failure is unknown, never an invented event. Continuous operation, RF contact and landing safety remain unverified.

The scene visibly labels schematic scale and illustrative terrain. Body direction markers are not unobstructed sight lines; above/blocked/uncertain classification is attached to the marker. Numerical power remains engine-derived. A syntax issue encountered during the new renderer check was corrected before browser verification.

Source parsing and separate vector arithmetic checks share upstream records/terrain; their agreement is implementation verification, not independent physical validation. SPICE comparison and terrain convergence remain NOT RUN: required kernels, SPICE software and source rasters are absent; frame/datum matching remains unresolved. No new physical validation is claimed.

Official NASA descriptions were revisited: [Moon Trek](https://trek.nasa.gov/moon/jpl/config/textAbout.html) includes mission planning, lighting, elevation and slope analysis; [Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html) supplies observer ephemerides. ZENITH's contribution is focused constrained-plan comparison, sensitivity trade-offs and inspectable evidence, not an asserted lack of those capabilities in NASA tools.

## Human pilot — pending

Recruit six unfamiliar English-reading participants, obtain consent, and provide no coaching. Tasks: enter a supported operation; explain the original result; select and justify an alternative; distinguish remaining start delay from operating slack; identify a limitation and explain geometric visibility versus RF contact. Success is a correct unaided completion/explanation against the actual request and model, with a four-minute task timeout. Record time to justified decision, completion, input errors, help, and misconceptions. Predeclare at least five of six completing the planning tasks and all distinguishing RF/continuity limitations; report unmet criteria as well. These pilot criteria do not justify population-wide impact claims.

Empty results template:

| Anonymous participant | Task | Completed unaided | Seconds | Input errors | Help | Explanation correct | Uncertainty/RF misconception |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

No participants, observations, benefits or success rates have been recorded.

## Provisional judging assessment

No numeric weighting or total is assigned. Impact is plausible but unmeasured; creativity rests on the constrained decision workflow; validity has source/arithmetic evidence but material physical-validation gaps; relevance directly covers site/date/power/geometry with two curated sites; presentation is more inspectable but human comprehension remains untested. Evidence does not support a defensible 97/100 claim.

## Verification record

Executed console/source verifier, 20 extended engine checks and numerical verifier: pass, including 2,882 original records and 8,646 vector comparisons, maximum error 1.137e-13 W. Reference outputs remain 50.156 W original, 12:40 candidate at 100.283/82.531 W, 17:45 candidate at 120.094/100.250 W, 153 nominal/560 near-edge/92 ±1°/0 ±5° candidates. These are computed regression results, not physical certification. Browser verification outcomes are reported separately in the final handoff; a renderer syntax check alone does not establish browser compatibility.


Current HTTP browser verification: `node scripts/browser_current.cjs` passed in installed headless Chrome and Edge. Executed flows: empty initial form, optional example, 153/560/92/0 computed counts, WebGL canvas creation, independent case inspection, actual-record playback, JSON provenance, explicit application with 54.25 hours remaining, stale exports, clear, zero delay, unsupported hourly fraction, no candidate and mobile page overflow. An initial renderer failure and subsequent mobile overflow failure were corrected and the focused flow rerun successfully. This verifies these automated flows, not subjective visual quality, full accessibility or human usability. `node scripts/verify_timing_focus.cjs` passed the missing-finish, negative-allowance, exact-start-deadline/later-finish, finish-failure bracket, unknown slack and empty-sensitivity guards. Seven existing ZENITH checks passed, including the genuine 20-minute hourly-versus-fine onset difference; sub-five-minute convergence is not established. `git diff --check` passed.

Files changed in this review: `mission-console.html/js/css` (optional onboarding, defensive empty/slack sensitivity handling and compact table containment); `decision-brief.js` (visible site/plan table, merged duplicate roles and partial coverage); `zenith-ui.js` (separate fine subset export); `lunar-three.js` (syntax correction and visible marker classification); README, current objectives, judges brief, defaults/timing and submission walkthrough (current-workflow guidance); existing `judges-slides.html` (explicit onboarding); `CURRENT_REVIEW.md` (this handoff and pending human template); `browser_current.cjs` and `verify_timing_focus.cjs` (focused executed checks). Older browser scripts retain historical selectors and are not the current acceptance command.
