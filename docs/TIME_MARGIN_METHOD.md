# Time Margin — original NASA sampled-reference calculation

**Release:** 2026-11-14. **Status:** implemented for Mission Rescue research screening; NOT a validated continuous spacecraft operating margin.

## What is actually calculated?

Two separate quantities are now shown, and **must never be confused**:

1. **Sampled-reference slack (minutes, calculated only when a later original NASA sample explicitly witnesses model failure).** For a user-selected start `t0` and duration `D`, the system walks the true 5-minute JPL Horizons source records for the same site and the unchanged user-specified requirements. If all actual sample points during `[t0, t0+D)` meet the *provisional reference screening criteria*, it continues reading genuine JPL samples until the **first explicitly failing sample**. Let `t_last` be the time of the last passing original NASA sample. We report:
   
   `sampled_reference_slack = max(0, t_last - (t0 + D))`
   
   This is a **discrete sampled-run measure**, not the true natural transition time. We do not interpolate a fictional failure instant or invent an ephemeris timestamp. It is not verified that the system remains usable between samples.
2. **Physical Time Margin:** the actual verified end of an uninterrupted, engineering-valid lunar operational window minus `(t0 + D)`. This remains **UNKNOWN**. We have not independently validated the full terrain horizon, solar eclipses/finite discs, observer coordinate datum/frame consistency, actual power-system output, ground-station RF links or true between-sample continuity.

A third, unrelated number is **remaining user delay allowance**, calculated as `user_maximum_delay - chosen_start_delay`. It is not either type of operating-window margin.

## Actual NASA-derived demonstration, not an illustrative invented window

- **Site:** NASA-listed Site01 / Connecting Ridge (representative reference point).
- **Start:** 2026-12-22 **06:00:00 UTC**.
- **Requested duration:** 6 hours, so the nominal required operation ends at **2026-12-22 12:00 UTC**.
- **User-entered engineering assumptions:** required 100 W, panel 1.5 m², 25% efficiency, tilt 30°, azimuth 90°, Earth geometric visibility required.
- **True source:** NASA JPL Horizons at five-minute cadence, 20–25 December 2026, with real Sun/Earth angles and Sun AU range, and actual NASA LOLA sampled 5 m near plus 80 m far topography. Source files and hashes are preserved in `data/site01_audit/fine_5m_*` and `docs/data/mission_dataset_fine.json`.
- **Minimum six-hour unshadowed Sun-distance-adjusted panel reference:** approximately **100.183 W** across the 72 original NASA sample times. This is **not measured or validated electrical power**.
- **Last model-passing actual NASA record:** 2026-12-23 **12:20:00 UTC**.
- **First model-failing actual NASA record:** 2026-12-23 **12:25:00 UTC**.

Thus:

```
Candidate start             22 Dec 2026 06:00 UTC
Required duration           6 h
Required operation end      22 Dec 2026 12:00 UTC
Last passing NASA sample    23 Dec 2026 12:20 UTC
First failing NASA sample   23 Dec 2026 12:25 UTC
--------------------------  --------------------
SAMPLED REFERENCE SLACK     24 h 20 min
PHYSICAL TIME MARGIN       UNKNOWN (not certified)
```

The sampled-reference test allows **strictly positive** sampled Sun/Earth clearance above the *incomplete* 5 m + 80 m LOLA screen and `P_reference ≥ requiredW` at the exact NASA timestamps, with actual Sun-distance correction. It **does not** certify that the Sun/Earth is clear between samples or beyond the sampled terrain coverage. An additional NASA local RMS edge-review warning is presented separately and may put the candidate into the **EDGE REVIEW** class; therefore this 24h20 value is **optimistic research-screening evidence only**, not guaranteed usable time.

## Release safety gates and edge cases

- If any sample in the requested period fails the reference screen, sampled slack is **UNKNOWN/not computed**, not forced to a positive value.
- If the request starts/ends off the exact NASA cadence, it is **insufficient data**; no synthetic timestamp is inserted.
- If timestamps are missing/gapped, sampled slack is **UNKNOWN**.
- If there is no later original NASA sample that fails before the source series ends, sampled slack is **UNKNOWN (right-censored)**; dataset termination must not masquerade as sunset or a validated natural window end.
- No result is allowed to set `marginSeconds`, `physicalWindowEndKnown`, or `certifiedAlternativeCount` to a positive certified status. Physical Time Margin stays UNKNOWN.
- The output JSON includes the precise last-passing and first-failing source UTC records, source hashes and explicit limitations.

## Reproduce

Open [Mission Rescue Console](https://fayzeh-elzghier.github.io/lunar-window/mission-console.html), choose Site01, 21 December 2026 00:00 UTC, 6 hours, 100 W, 72 hours allowed delay, 1.5 m² at 25%, tilt 30°, azimuth 90° and Earth required; run the screen. The later Site01 candidate at 22 December 06:00 UTC has 24h20 of **screened reference slack**, but *not* proven real-world time margin. The public source and code are in [the repo](https://github.com/fayzeh-Elzghier/lunar-window).

Run `node scripts/verify_console.cjs` for an automated, source-traceable regression covering exactly this 24h20 example and censored data cases.

**Science that remains unverified:** observer datum and Moon frame reconciliation, far-field DEM errors, finite solar/Earth disc and eclipse effects, accurate terrain-horizon crossing times, thermal and electrical losses, and a genuine direct-to-Earth radio link. The fully physical Time Margin cannot responsibly be supplied from the current evidence.
