# Objectives, judging evidence and release gates

Current implementation audit · 2026-11-14. This file supersedes earlier development snapshots. Functional coverage is distinct from scientific certification.

| Challenge objective | Implementation | Verification / boundary |
|---|---|---|
| Quickly compare locations and dates | Two curated south-pole sites, UTC timeline, same-time comparison | Actual NASA samples, common settings |
| Understand Sun/Earth relative to horizon | Azimuth/elevation, 360° terrain silhouette, clearance timeline | Sampled LOLA horizon, not independent full-horizon validation |
| Assess power potential | Fixed-panel incidence, actual Sun distance, binary terrain blocking, demand line | Ideal direct-power estimate; no battery or eclipse model |
| Assess direct-to-Earth opportunities | Earth-center terrain clearance, required-visibility constraint | No RF/link-budget or ground-station guarantee |
| Understand changes and next setting events | Sample brackets and elapsed-time ranges for next above-to-below transitions | No invented event at coverage end; intermediate crossings may be missed |
| Support changed mission dates/sites | Search allowed starts and both sites under unchanged constraints | One common cadence per search; original unaligned start is explicitly insufficient |
| Accessible educational exploration | Source labels, demo story, explanatory controls, keyboard focus, responsive layout | Two curated sites; custom coordinates and 3D are future extensions |

## Judging rubric evidence

| Criterion | Concrete evidence |
|---|---|
| Impact | Helps an operator identify why a fixed operation conflicts with power/visibility, then inspect alternatives |
| Creativity | Mission Rescue preserves requirements and explains each conflict; unresolved edge cases are not promoted to recommendations |
| Validity | Original NASA responses, hashes, cadence checks, terrain overlap guard, source-linked exports and analytical regression tests |
| Relevance | Site/date, illumination, terrain horizon, Earth geometry and operating-window workflow directly address the challenge |
| Presentation | Guided Sara example, live graphs, inspectable alternatives, source exports and seven-slide story |

No invented numeric rubric weights or winning score is assigned.

## Release gates

- Offline Python and JavaScript checks must pass.
- Fine and hourly data must retain original raw provenance and regular cadence.
- Both sites must be compared at a common cadence and fixed requirements.
- Near/far terrain scans must overlap for every bearing; exported skyline hashes must match tables.
- Missing data, invalid dates and cutoff events must not produce a mission pass.
- Input edits must invalidate previous findings.
- Browser acceptance checks desktop/mobile operation, exports, charts, stale results and slide navigation.

## Remaining science work

Independent validation of frame/vertical consistency and the full terrain horizon, far-field error propagation, sub-sample event refinement, solar-disk/eclipses, realistic power storage/losses and ground-station RF analysis remain necessary for mission use. The project implements a transparent preliminary planning model, not a certified lander design.

## Added after rubric review

- Three-case decision summary: original, first nominal candidate, and first candidate meeting an explicit sensitivity profile.
- Nine orientation combinations with 10% lower output at ±1° and ±5°; no hidden relaxation of mission requirements.
- Separate vector-based numerical verification against raw NASA records: [report](NUMERICAL_VERIFICATION.md). This is implementation verification, not independent scientific validation.
- [Judges’ evidence brief and bilingual delivery guide](JUDGES_BRIEF.md), including honest comparison with existing NASA tools and a pending human evaluation protocol.
