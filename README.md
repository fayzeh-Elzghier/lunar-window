# Lunar Window — Mission Rescue

NASA Space Apps · Lunar Landing Site Navigator · Fayzeh and Ala

Explore lunar south-pole Sun/Earth geometry, estimate direct panel power, and find alternative site/start combinations when a planned operation encounters a conflict. Requirements stay unchanged during the search.

- [Open the project](https://fayzeh-elzghier.github.io/lunar-window/)
- [Launch the mission console](https://fayzeh-elzghier.github.io/lunar-window/mission-console.html)
- [Seven-slide presentation](https://fayzeh-elzghier.github.io/lunar-window/judges-slides.html)
- [Current objectives, evidence and limits](docs/OBJECTIVES_AND_RELEASE_GATES.md)
- [Current demonstration and handoff](docs/SUBMISSION_DEMO.md)

## What works

Two NASA-listed sites, a UTC timeline, Sun/Earth azimuth and elevation, local terrain silhouette, terrain-clearance and power plots, next sampled sunset/Earthset brackets, same-time site comparison, constrained alternative search, and CSV/JSON evidence exports. Near-edge review cases are separated from research candidates. Changed inputs invalidate old results.

Original JPL Horizons data: **745 hourly epochs per site** from December 1, 2026 through January 1, 2027, plus **1,441 five-minute epochs per site** from December 20–25. These are calculated ephemerides for scenario dates, not measurements from a landed mission. Raw responses, parameters and SHA256 fingerprints are retained.

Terrain: NASA LOLA 5 m local DEMs combined with an 80 m regional DEM. The corrected regional scan starts at 5 km and uses 40 m radial steps to approximately 300 km; a guard verifies overlap with every local ray. This removes an earlier coverage gap, but does not prove a complete, independently validated horizon.

## Reproduce the demonstration

Click **Load Sara’s delayed-operation example**. Assumptions: Site01, December 21 00:00 UTC, 6 hours, 100 W, maximum delay 72 hours, 1.5 m² panel, 25% efficiency, tilt **60°**, azimuth 90°, Earth visibility required. All hardware values are illustrative user inputs.

The original model has a power shortfall. The five-minute search evaluates 1,730 site/start combinations, finds 153 preliminary candidates and separates 560 near-edge review cases. The earliest candidate is Site01 on **December 21 at 12:40 UTC**. These reproducible counts depend on the exact settings and current sampled model; they are not mission-certification results. The old 30°/24h20m example is a historical uncertainty regression, not the current demonstration.

## What changed after the judging review

The first nominal candidate is fragile: its minimum modeled 100.283 W drops to 82.531 W under an illustrative 10% output reduction and ±1° tilt/azimuth offsets. A later candidate at **December 21, 17:45 UTC** yields 100.250 W in that same stress exercise. 92 of 153 nominal candidates meet this profile; none meets the wider ±5° profile. These are discrete sensitivity tests, not validated uncertainty bounds. No mission requirements are relaxed. [Calculation evidence](docs/NUMERICAL_VERIFICATION.md) · [judges’ brief](docs/JUDGES_BRIEF.md).

## Run checks

Python 3.11+ and Node 22; the offline checks need no third-party Python packages:

```bash
python -m compileall -q src scripts tests
python scripts/check_dashboard_js.py
python -m unittest discover -s tests -v
node scripts/verify_console.cjs
node scripts/verify_extended.cjs
python scripts/verify_numerics.py
```

GitHub Actions also runs desktop/mobile browser acceptance. Open `docs/index.html` directly for offline viewing, or serve `docs/` with a static file server.

To rebuild bundles from committed cached evidence:

```bash
python scripts/build_far_evidence.py
python scripts/rebuild_cached_fine.py
python scripts/build_5minute_evidence.py
python scripts/build_horizon_profiles.py
```

Recomputing terrain requires `numpy`, `rasterio`, NASA source DEMs and the acquisition scripts; large TIFFs are deliberately excluded from git. `scripts/audit_far_lola.py` records retrieval provenance and scan settings. Legacy 169-row builders now target `docs/legacy-explorer.html`, never the current home page.

## Model boundaries

Estimated power is `1361 / distance_AU² × panel_area × efficiency × max(0, panel_normal·sun_direction)`, set to zero when the Sun center is blocked by the sampled terrain. It excludes batteries, eclipses, partial solar-disk illumination, thermal/electrical losses and terrain slope correction. Local RMS review bands are not full uncertainty bounds. Earth-center visibility is a geometric proxy, not a ground-station RF link budget. Set times are sample brackets; continuous visibility and physical Time Margin are not certified. Landing safety is outside this prototype.

## Code map

| Location | Purpose |
|---|---|
| `docs/mission-console.js` | Active browser decision engine and request validation |
| `docs/mission-explorer.js` | Horizon, power, event and comparison views |
| `docs/data/` | Reproducible source-derived browser bundles |
| `data/site01_audit/`, `data/site04_audit/` | Raw NASA records and derived evidence |
| `scripts/verify_extended.cjs` | Corruption guards, fairness, model and scenario regressions |
| `src/mission_rescue.py` | Separate strict continuous-window reference engine; not the console engine |

## Credits and transparency

NASA/JPL Horizons; NASA LRO/LOLA PGDA; NASA Lunar Surface Data Book. [NASA resources](docs/NASA_RESOURCES.md). AI assisted code, documentation and testing. No AI-generated ephemerides are used. Synthetic analytical fixtures exist only in tests. Independent student project; no NASA endorsement or guaranteed competition outcome.
