# Step 03 — Real NASA Sun/Earth angles vs local LOLA terrain (provisional)

**Date:** 2026-11-14. **Source basis:** actual NASA Horizons Sun/Earth ephemerides and NASA/LOLA Site01/Site04 5 m DEM rasters already acquired and checked into this repository as derived horizon tables.

This is a **scientific screening diagnostic**, **not proof of direct solar power, unobstructed Earth visibility, or successful lunar mission operations**. Our output remains `INSUFFICIENT_DATA` for feasibility and Time Margin.

## Official challenge objective

The [2026 Lunar Landing Site Navigator challenge](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/) asks for a clear way to compare lunar sites and dates, visualize the Sun and Earth relative to the horizon, and inspect possible solar-power and geometric Earth communication opportunities. This comparison advances the **horizon-visualization** objective with authentic NASA source angles and terrain. It does NOT yet fulfill the scientifically validated operating-window objective.

## Actual numeric inputs

- [Site01 Connecting Ridge: JPL Horizons 169 hourly UTC epochs](../data/site01_audit/sample.csv), 2026-12-01 00:00 through 2026-12-08 00:00.
- [Site04 Shackleton Rim: JPL Horizons 169 hourly UTC epochs](../data/site04_audit/sample.csv), same UTC interval.
- [Site01 360 real LOLA-derived local azimuth skyline bins](../data/site01_audit/local_horizon.csv).
- [Site04 360 real LOLA-derived local azimuth skyline bins](../data/site04_audit/local_horizon.csv).
- [Site01 local terrain source audit](../data/site01_audit/local_horizon_meta.json) and [Site04 source audit](../data/site04_audit/local_horizon_meta.json).
- Actual original JPL Horizons query URLs, timestamps and SHA256 hashes in each site's `queries.json`.
- Original NASA topographic data: [NASA PGDA LOLA landing site elevation DEMs](https://pgda.gsfc.nasa.gov/products/78). The 5 m raster for each site was used to derive **local** terrain sky elevations, corrected for spherical lunar curvature and 2 m assumed observing height.

The original LOLA product includes DEM uncertainty maps, which should be used in further scientific validation. Its documentation describes a MOON_ME/DE421 frame, requiring consistency checking against our JPL Horizons observer configurations.

## Computation

For a Sun or Earth direction at exact JPL time `t` and azimuth `A(t)`:

```
local_skyline(A) = linear interpolation of adjacent ORIGINAL 1° LOLA skyline samples
local_clearance(t) = JPL_app_elevation(t) - local_skyline(A(t))
```

Interpolation is **only in angle** across already-computed NASA terrain bins, never in time. Each output epoch exactly matches a real JPL Horizons hourly row.

`clearance < 0`: candidate local obstacle, subject to terrain/frame validation.
`clearance > 0`: above the **sampled local** obstruction only. It does **not** prove clear line of sight (distant terrain may block).
`|clearance| ≤ 0.25°`: additional caution marker. **0.25° is a deliberately chosen review band, not an estimated angular error bound or scientific uncertainty calculation.**

All cases remain marked `INSUFFICIENT_DATA`.

## Measured-from-source screening counts (169 hourly samples per site)

| Site | Sun below local by >0.25° | Sun within review band ±0.25° | Sun above local by >0.25° | Earth below local by >0.25° |
|---|---:|---:|---:|---:|
| Site01 — Connecting Ridge | 17 | 62 | 90 | 169 |
| Site04 — Shackleton Rim | 169 | 0 | 0 | 169 |

These are **sample counts**, NOT continuous hours, mission feasibility claims or observation time fractions. The source time range is the chosen future demo interval, NOT measured lunar operations. The Sun passes just above the sampled local horizon at many Site01 epochs, but the unseen distant terrain and unresolved local height/frame issues prevent declaring illumination.

You can inspect the actual [Site01 screening CSV](../data/site01_audit/terrain_screen_hourly.csv) and [Site04 screening CSV](../data/site04_audit/terrain_screen_hourly.csv) and recreate them with:

```bash
python scripts/compare_local_skyline.py
python -m unittest discover -s tests -v
```

## Why we are not yet activating Mission Rescue

1. Our 16 × 16 km tiles do not cover all far field mountains and hills.
2. LOLA vertical height reference and Horizons frame/observer definitions need independent crosschecks.
3. DEM measurement/interpolation uncertainty, local slope and observer geometry still need quantitative propagation.
4. Solar-center and Earth-center geometry is not full-disc, eclipse, or engineering RF-link analysis.
5. Hourly ephemeris does not certify uninterrupted 6-hour operation; refine near crossings and track error bounds.
6. Panel angular incidence at an assumed 1 AU is a transparent **reference**, not verified on-site power. Energy storage is out of MVP scope.
7. Physical window ends and margins must not be guessed from the end of the dataset.

For our innovation: eventually, scientific data will yield **verified continuous constraints**, allowing the [Mission Rescue engine](../src/mission_rescue.py) to show reasons, allowed delayed starts/site changes, and `Time Margin = verified_window_end - duration - selected_start`. Not before.

## Practical role split

- **Fayzeh:** evidence completeness, datum check, long-range skyline, high-cadence crossing checks, power/distance/eclipse treatment, verified interval construction, Mission Rescue integration.
- **Ala:** show real point-specific JPL/LOLA diagnostics with synchronized timestamps, explicit below/near/above local states, warning banners, citations, and user-friendly comparisons. Keep unvalidated states clearly labeled.

### Core NASA sources
- [NASA/JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html)
- [NASA PGDA LOLA 5 m landing-site product](https://pgda.gsfc.nasa.gov/products/78)
- [NASA PGDA south pole mosaic](https://pgda.gsfc.nasa.gov/products/81) — possible future far-terrain data **not yet integrated**; 3.3 GB for 5 m mosaic, avoid downloading unnecessarily.
- [NASA PGDA large-area South Pole products](https://pgda.gsfc.nasa.gov/products/90) — possible less-heavy distant terrain coverage and crosscheck, **not yet integrated**.
