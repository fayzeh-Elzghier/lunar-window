# Mission decision dashboard — current presentation

Updated 2026-11-14. This is the local, statically reviewed dashboard redesign. No tests, browser verification, builds, linters, benchmarks, numerical suites or preview servers were run. No commit, push, publication or deployment was performed. Earlier redesign claims are preserved separately under archive/mission-dashboard-before-cards-*.md; they are historical and do not establish behavior or compatibility of this revision.

## Decision first

The result hero identifies the original plan's engine status, principal conflict or nominal outcome, duration, required power and Earth-visibility requirement. Conflict, unresolved terrain-edge review and insufficient coverage remain different states. Initial, invalid, missing-source, busy and stale states have their own messages; old cards and exports are unavailable when results are invalidated.

Three meaningful roles are presented as cards: original plan, first nominal option under the captured priority, and the declared-sensitivity option. The current form retains its existing earliest-start priority. Candidate search and ranking are unchanged. Identical site/start plans merge their roles instead of appearing as independent alternatives; missing roles show assessed-search empty states, with partial coverage disclosed. Inspect case opens exploration without editing the form. Applying an option remains explicit and uses the existing absolute start deadline.

The recommendation follows the evaluated request's existing priority and distinguishes nominal screening from the declared power sensitivity test. A small reserve is called limited headroom, not a safety guarantee. The small-reserve display cue uses the existing max(1 W, 1% of demand) convention; it is not a new scientific qualification threshold.

What changes between the options compares nominal and sensitivity minimum power against the same demand marker, start delay, remaining start allowance, site retention/change and minimum Sun terrain clearance. All values come from the current report; no example outcomes are hard-coded.

## Timing and margins

The compact timing panel follows the selected case and separates start delay, remaining delay allowance, sample-based operating slack and physical continuous time margin. Missing/censored slack is Not established; an actual calculated zero remains zero. Physical continuous margin is always Not established. Expandable definitions retain the original start/deadline, nominal-reference criteria, excluded terrain-edge/sensitivity qualification and lack of between-sample continuity. TIME_MARGIN_METHOD.md remains authoritative and unchanged.

## Explore on demand

The scene, source-time controls and charts open after an explicit Inspect case action. New comparisons and scope switches return to the decision view; input edits invalidate results and stop playback through the existing events. Delayed 3D loading cannot restore a cleared request because the existing latest-data guard remains in use.

Overview and local surface detail remain separate. The overview camera is closer to the lander without changing Sun/Earth directions, panel assumptions or source epochs. Large overlay readouts have been replaced by compact object markers with full accessible names and click details. Below the scene, three compact chips identify selected-time panel power/demand/difference, Sun elevation/terrain state and Earth elevation/geometric terrain state. Whole-operation minimum power is labeled separately.

The existing timeline now sits directly beneath the scene and shares the existing sourceIndex with the charts and exports. It still uses genuine source records, not interpolated ephemerides. Playback, keyboard tabs, reduced-motion behavior, camera focus controls, daylight paths and Earth-to-site guide are preserved. The sensitivity curve remains a pointwise lower envelope across orientations, not one physical panel trajectory.

One short visible note qualifies the scene. Scene limitations retains the schematic/non-scale labels, illustrative terrain/orientation, display lighting, direction-only guides, source coverage and RF limitations. WebGL/file-loading failures open that disclosure to reveal the existing recovery instructions. Numeric exploration remains available if 3D cannot load.

## Configuration and evidence

The form groups Location & time, Mission requirements and collapsed Solar panel setup. Source coverage is accessible in a disclosure; live validation and missing-field guidance remain visible beside Compare plans. Existing initial example values, explicit Load example, Clear inputs, UTC/cadence validation and zero-delay/zero-angle treatment are retained. Scientific inputs are not substituted or relaxed.

The collapsed evidence area retains NASA links, model assumptions, terrain and sensitivity limitations, both-site coverage summaries, fine-subset inspection, verification documentation, AI disclosure and JSON/CSV/print actions. Hourly and five-minute reports remain separate, with active scope identified in results, exploration and exports. The old eight-column primary table and unused table presentation styles were removed rather than hidden.

## Files changed

- mission-console.html: grouped form, hero, options, trade-offs, timing, scene/timeline/disclosures and evidence hierarchy.
- mission-console.css: dashboard typography, card/metric grids, statuses, form spacing, responsive layouts and preserved chart/print styles.
- decision-brief.js: report-derived verdicts, merged cards, current-priority recommendation, trade-offs and selected-case timing.
- mission-console.js: UI-only inspection-open state; engine, validation, request capture, ranking and deadline logic remain unchanged.
- mission-explorer.js: waits for explicit inspection; original plot and sensitivity calculations retained.
- zenith-ui.js: closes inspection when changing comparison scope; export calculations and payload bindings retained.
- lunar-scene.js: compact instantaneous chips and separated operation minima; original playback and engine calls retained.
- lunar-three.js: compact markers, click details, nearer overview framing, and visible loading-error recovery.
- lunar-scene.css: smaller scene footprint and compact markers/chips.
- DEMO_REDESIGN.md: this untested handoff, replacing the historical active guide.

## Review and remaining limits

Changes were reviewed statically only. No runtime outcome, browser compatibility, screen-reader behavior, mobile fit, visual correctness or measured 5–10 second comprehension is claimed. Existing test files were not edited, deleted or disabled. Later authorized verification should exercise the new Inspect case entry, duplicate-role cards, missing/partial coverage, fine/main scope switching, playback, stale-state invalidation, exports, keyboard focus and mobile layouts.

Scientific sources, source records, terrain profiles, panel power formulas, candidate algorithms, sensitivity assumptions and numerical pass thresholds were not modified. Independent physical validation, continuous-operation evidence, RF-link analysis, terrain convergence and human usability evidence remain outside this presentation change.

Tests and browser verification were not run at the user's request. Changes were reviewed statically only.
