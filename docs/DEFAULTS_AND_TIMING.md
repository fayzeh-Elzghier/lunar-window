# Form state and timing

The page initializes the editable configuration once from EXAMPLE_CONFIGURATION in mission-console.js, following the later request to restore the previous values as defaults. It does not calculate a result on load. Load example explicitly restores that configuration without evaluating it. Compare plans validates current inputs and captures the evaluated request. Clear inputs removes all input values and both comparisons, stops playback and disables exports. Empty fields stay empty during rendering, site changes and scene interaction. Missing values are not zero. Supported UTC coverage is shown before submission; panel completeness remains visible when collapsed.

The full comparison uses one common cadence across both sites. If the full search extends outside five-minute coverage, it uses hourly records. Inspect five-minute subset explicitly opens a separate bounded comparison in the interface: its assessed start range and original deadline are shown. Return to full-range comparison preserves the main report and form. JSON, CSV and print identify the active scope. Inputs invalidate both scopes. Fine and hourly candidates are never combined into one ranking.

Both-site summaries are calculated over all eligible candidates before truncation. Duplicate site/start plans merge their roles. Inspection never edits the form. Use as new plan explicitly preserves the original absolute latest permitted start, including when inspecting a subset.

The initial configuration and explicitly loadable example are Site01, 2026-12-21 00:00 UTC, 6 h, 100 W, 72 h maximum delay, Earth required, panel 1.5 m2, efficiency 25%, tilt 60 degrees, azimuth 90 degrees. These are illustrative assumptions, not NASA hardware specifications. No result is hard-coded.

Start delay = selected start minus original evaluated start. Remaining start-delay allowance = original latest permitted start minus selected start. The latest permitted start = evaluated start plus allowed start delay; it is not a finish deadline. Negative allowance is invalid. Zero allowance remains valid. Changing form inputs cannot mix new settings with old results.

The scene header identifies the active comparison scope, selected case, site and exact source UTC timestamp. Selected-operation statistics display start delay, remaining allowance, the original start deadline, sample-based nominal-reference operating slack and the statement that continuous margin is not established. Unknown sampled slack remains unknown; it is not replaced with zero. JSON retains the engine's timing definitions and sampled boundary evidence. CSV includes slack/status and its limited criteria; print includes the same timing explanation.

Tests and browser verification were not run at the user's request. Changes were reviewed statically only.

See TIME_MARGIN_METHOD.md for operating slack and CURRENT_REVIEW.md for version-specific executed checks.
