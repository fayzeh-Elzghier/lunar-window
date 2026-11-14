# Judges' evidence brief

The page opens with empty inputs and no calculated result. Load example is optional: it fills editable assumptions without evaluating them. Compare plans validates current inputs and captures the evaluated request. Clear inputs removes both comparisons, stops playback and disables exports. Missing values are not zero. Supported UTC coverage is shown before submission; panel completeness remains visible when collapsed.

The full comparison uses one common cadence across both sites. If the full search extends outside five-minute coverage, it uses hourly records. Inspect five-minute subset explicitly opens a separate bounded comparison in the interface: its assessed start range and original deadline are shown. Return to full-range comparison preserves the main report and form. JSON, CSV and print identify the active scope. Inputs invalidate both scopes. Fine and hourly candidates are never combined into one ranking.

Both-site summaries are calculated over all eligible candidates before truncation. Duplicate site/start plans merge their roles. Inspection never edits the form. Use as new plan explicitly preserves the original absolute latest permitted start, including when inspecting a subset.

Problem: an operation may nominally meet demand while retaining very little tolerance to stated assumptions. Contribution: constrained-plan comparison, explicit sensitivity trade-offs, source evidence and inspectable explanations. No new ephemeris algorithm, unique planner claim or superiority benchmark is established.

Use SUBMISSION_DEMO.md for the reproducible example and CURRENT_REVIEW.md for executed checks. Separate-vector arithmetic reuses the same ephemerides and terrain; it is implementation verification, not full independent scientific validation. No successful SPICE comparison or terrain convergence is claimed.

NASA Moon Trek already supports mission planning, lighting, elevation and slope analysis: https://trek.nasa.gov/moon/jpl/config/textAbout.html . Horizons supplies observer ephemerides: https://ssd.jpl.nasa.gov/horizons/manual.html . ZENITH focuses on the constrained decision workflow.

Judging answers: nominal pass is not continuous operation; geometric Earth visibility is not a radio link; sensitivity assumptions are illustrative rather than validated uncertainty bounds; partial coverage is not evidence that no feasible real operation exists. Human usability results are pending, not inferred from browser checks. Protocol and empty template: HUMAN_EVALUATION.md and CURRENT_REVIEW.md.
