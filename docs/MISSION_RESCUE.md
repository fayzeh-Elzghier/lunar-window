> Historical development snapshot. For the current corrected terrain model, demo settings and release status, read [current objectives](OBJECTIVES_AND_RELEASE_GATES.md) and [current demo](SUBMISSION_DEMO.md). Earlier numerical results may differ.

# Mission Rescue — ZENITH innovation

Our distinctive contribution is **explainable rescue of a lunar operating plan**: compare the original site/start against permitted delays and alternate sites; show exactly *why* a plan fails; and quantify **time margin** without implying that a lunar landing, radio contact, or power system is certified.

This extends the official [2026 Lunar Landing Site Navigator objectives](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/), which emphasize interactive site/date comparisons, Sun/Earth horizon positions, time dynamics, power opportunities, and communication opportunities.

## Real scenarios supported by the decision architecture

- Original site and start, same site with delayed start, other site at same start, other site with delayed start.
- Power insufficiency, Earth occultation, both at once, power and Earth windows without sufficient continuous overlap.
- Earth visibility optional during the experiment; the Earth timeline remains visible.
- Exactly sufficient duration, extra margin if the physical end is validated, or unknown margin at a data boundary.
- Multiple alternatives prioritized by **keep site**, **earliest start** or **largest verified delay margin**.
- No valid alternative inside the user-provided delay limit: do **not** relax requirements automatically.
- One site missing/unequal terrain coverage: no unsupported site ranking.
- Near-horizon transitions: verify at finer cadence and report time uncertainty.
- Unsupported separate post-operation downlink scheduling: do not silently accept.

## Formal time-margin definition

For a verified usable window `[a,b)`, operating duration `D`, and valid start `s`:

```
latest_physical_start = b - D
window_delay_margin = b - D - s
latest_allowed_start = min(user_start + max_delay, b - D)
```

The margin is **null** if the last observed `b` is a *dataset cutoff* rather than a scientifically established end to the condition. Even when a full duration fits inside coverage, never invent sunset, Earthset or additional free margin. The code stores the latest known start separately from the physically verified margin.

## Scientific evidence gate

`src/mission_rescue.py` accepts **only continuous, already-validated time intervals** from an independent NASA-derived science pipeline. Each site must supply NASA provenance URLs, a confirmed terrain-aware model, a documented validation status, and intervals with a `source_id`, minimum power, visibility state, and time uncertainty.

The engine does not compute ephemerides or terrain. Merely setting `verified=true` in a file is **not proof**: independently corroborate LOLA horizon, elevations, reference frames, crossing times, Sun incidence and eclipse assumptions first.

**Current state (2026-11-14):** Site04 hourly NASA/JPL Horizons geometry and one provisional LOLA pixel are already audited in `docs/data-audit.md`. Site01 is still awaiting ephemeris and terrain analysis. Zero mission windows have passed independent physical validation. Therefore the interface says **INSUFFICIENT DATA** rather than making up a rescue outcome.

## Fair comparisons and honest scope

Compare the same duration, electrical demand, panel area/efficiency/orientation and Earth-visibility requirement across sites. Hourly sampled directions do **not** prove a continuously lit period. Geometric Earth-center visibility is only a **communication opportunity**, not radio-link confirmation or reserved ground-station contact.

Battery discharge, eclipse corrections not independently screened, arbitrary custom coordinates without DEM coverage, relay links, landing/trajectory safety, specific ground-station scheduling, and multi-experiment scheduling are not part of the MVP.

## Acceptance

The 26 IDs in `docs/STEP_01.md` and `docs/SCENARIO_MATRIX.md` define expected behaviors; they are **not passed scientific test cases**. Validation status is NOT TESTED until checked against NASA-derived data with traceable input sources and independently validated interval boundaries. Reproducible input checks are separate from actual science validation.

## Roles

**:** NASA data, science calculations, horizon analysis, evidence contract, alternatives, time margins, validity.

**** interface, timeline, side-by-side comparison, cases, explanations, source drawer and accessibility.

**Joint:** scientific review, user tests, integration, submission and demo story. Choose a real successful scenario from results, not vice versa.
