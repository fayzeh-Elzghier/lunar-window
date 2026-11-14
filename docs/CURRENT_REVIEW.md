# Current scoped-comparison review

The page prefills the editable example once, following the later request to restore previous data as defaults; it does not calculate a result automatically. Load example explicitly restores those editable assumptions without evaluating them. Compare plans validates current inputs and captures the evaluated request. Clear inputs removes all inputs and both comparisons, stops playback and disables exports. Missing values are not zero. Supported UTC coverage is shown before submission; panel completeness remains visible when collapsed.

The full comparison uses one common cadence across both sites. If the full search extends outside five-minute coverage, it uses hourly records. Inspect five-minute subset explicitly opens a separate bounded comparison in the interface: its assessed start range and original deadline are shown. Return to full-range comparison preserves the main report and form. JSON, CSV and print identify the active scope. Inputs invalidate both scopes. Fine and hourly candidates are never combined into one ranking.

Both-site summaries are calculated over all eligible candidates before truncation. Duplicate site/start plans merge their roles. Inspection never edits the form. Use as new plan explicitly preserves the original absolute latest permitted start, including when inspecting a subset.

The current implementation includes an in-app fine scope with explicit return, preservation of the original full request/deadline in both scopes and exports, complete-set both-site summaries, schedule/slack/continuity explanations and uncertainty marker semantics. The follow-up adds explicit scope/case identity in the 3D header, sampled slack and unknown-state explanations beside operation statistics, and slack metadata in CSV and print. Invalid comparison submissions clear both stored reports. Applying a candidate uses the report's captured absolute start deadline. No source data, power formula or sensitivity thresholds changed.

The scene keeps schematic/illustrative labels. Above, blocked and uncertain are distinct marker states. Direct light is withheld for uncertain samples explicitly because visibility is uncertain; this does not calculate an intermediate power or a probability. Markers drawn over terrain are direction guides only.

## Verification on this revision

Tests and browser verification were not run at the user's request. Changes were reviewed statically only. No runtime, numerical or browser-compatibility outcome is claimed for this follow-up. Existing test files were preserved. Historical runs are preserved in archive/workflow-before-scoped-comparison/CURRENT_REVIEW.md and do not establish this revision's compatibility. The existing browser runner and its commands below are documentation, not evidence of execution on this revision.

Run: python -m http.server 8765 --bind 127.0.0.1 --directory docs . Open http://127.0.0.1:8765/mission-console.html . Use node scripts/browser_current.cjs for the focused browser flow.

## Remaining evidence

SPICE comparison, terrain-resolution convergence, continuous-window verification, RF-link verification and human usability remain pending. Arithmetic agreement on shared data is not independent physical validation. See SCIENCE_REVIEW.md for prerequisites and limits. Scope correctness does not make procedural 3D terrain scientifically accurate.

## Human evaluation (no observations recorded)

Use HUMAN_EVALUATION.md. Ask unfamiliar participants to enter a valid operation, explain the original result, select and justify an alternative, distinguish remaining delay from operating slack, and identify continuity/RF limitations. Record unaided completion, time to a justified decision, input errors, help and misconceptions. Freeze the build and criteria before sessions. Do not infer success rates from automation.

| Anonymous participant | Task | Completed unaided | Seconds to justified decision | Input errors | Correct interpretation | Uncertainty/RF misconception | Help |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Strict provisional assessment

No numerical weighting or total is assigned. Impact is plausible but unmeasured; creativity lies in explicit constrained decisions and scope separation; validity has source/arithmetic checks but substantial physical gaps; relevance covers the actual site/time/power/geometry questions with only two curated sites; presentation still needs human comprehension evidence. A defensible 97/100 claim is not supported.
