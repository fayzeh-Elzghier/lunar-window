> Historical development snapshot. For the current corrected terrain model, demo settings and release status, read [current objectives](OBJECTIVES_AND_RELEASE_GATES.md) and [current demo](SUBMISSION_DEMO.md). Earlier numerical results may differ.

# Scientific implementation status (2026-11-14)

**This document distinguishes committed executable code from completed observations/calculations. No synthetic astronomical data have been added.**

## What has *actually* been obtained

- ✅ Official NASA Lunar Surface Data Book reference coordinates: Site04 Shackleton Rim (-89.7668, 188.13 E), Site01 Connecting Ridge (-89.4632, 222.51 E); see table A2-2.
- ✅ Site01 and Site04 real JPL Horizons raw outputs for Sun (10), Earth (399), **169 hourly UTC epochs per site, 2026-12-01 to 2026-12-08**, in `data/site01_audit/` and `data/site04_audit/`. These are **ephemeris predictions**, not spacecraft measurements. Original URLs/hashes in `queries.json`.
- ✅ Site04 NASA LOLA 5 m LDEM containing-pixel elevation obtained and audited, **vertical datum provisional**; local horizon has not been verified.
- ✅ Interactive offline HTML plots both sites' original Sun/Earth angles, plus their source-derived provisional local LOLA skyline clearance over time.
- ✅ `src/mission_rescue.py`: constraint checks, multi-case search architecture, simultaneous failure reporting and bounded margin logic, guarded against missing/unverified scientific evidence. It is not wired to independently verified mission windows.
- ✅ `src/solar_geometry.py` and the dashboard compute a transparent **unoccluded 1 AU incidence-based reference** from actual NASA Sun angles and user-set panel geometry. This is **NOT available lunar electrical power** or a mission-pass claim. NASA Goddard irradiance reference: https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science .

## Successfully generated source files and science pipeline (not yet independently validated)

- `scripts/acquire_site01.py`: downloads the actual Site01 NASA LOLA 5m DEM and requests both Sun/Earth Horizons tables; rejects missing/invalid/misaligned data and writes original raw responses, CSV, query provenance and hashes.
- `scripts/embed_site01_data.py`: checks raw file hashes and timestamps; only then inserts actual Site01 angles into offline `docs/index.html`.
- `scripts/compute_local_horizon.py`: computes a **tile-limited** skyline from the actual LOLA DEM using local ENU geometry, radial lunar curvature and 5m samples; marks **distant terrain UNKNOWN** in every direction. It must not be used as a certified global skyline.
- `.github/workflows/nasa-science.yml`: automated source acquisition, code compilation, checks, reproducible artifacts and conditional commit. It may depend on GitHub Actions settings/network/write permissions. **Do not claim it ran or that data were acquired until the generated files and workflow success are observed.**

### Check actual GitHub workflow execution

[Open the NASA source workflow](https://github.com/fayzeh-Elzghier/lunar-window/actions/workflows/nasa-science.yml). A successful run should create:

- `data/site01_audit/{sun.txt, earth.txt, sample.csv, queries.json, metadata.json}`
- `data/site01_audit/local_horizon.csv` and `data/site04_audit/local_horizon.csv`
- The updated offline `docs/index.html` with 169 real Site01 angular samples in addition to Site04.

These source files and the two local-horizon CSVs have now been individually confirmed on GitHub. The [hourly provisional terrain screen](STEP_03_TERRAIN_SCREEN.md) and CSVs are published for both sites, but do not certify physical windows. If the automation is unavailable, run the same scripts on a networked Python 3.11 environment with `numpy` and `rasterio`.

## Independent science gates not yet passed

1. Confirm LOLA DEM vertical Z datum relative to 1737.4 km sphere and JPL `MEAN_ME`; reconcile the published LDEM `MOON_ME / DE421` and Horizons `DE441` observer frames.
2. Independently check observer height and local slope; combine near terrain with **additional distant topography** and compare a selected horizon direction to an external NASA map/analysis.
3. Obtain high-cadence ephemerides around actual threshold crossings, quantify height/angle/timing uncertainty, and document handling of eclipses/solar disc and lunar curvature.
4. For each site, derive time-varying and **continuously validated** irradiance, fixed-panel incidence and surface-blocked Sun/Earth visibility, rather than treating hourly samples as continuous truth. Use lunar-Sun distance correction and documented assumptions.
5. Load both sites' **scientifically verified** interval data into `src/mission_rescue.py`, integrate real site/date/priority/case comparisons with UI, and review all 26 acceptance cases. Keep no-result/insufficient-data states honest.
6. Verify CI, test on multiple browsers, enable and inspect public GitHub Pages, complete demo and presentation only from actual validated results.

## Current decision

Until full horizon/power/continuous visibility verification, the correct operation result is **INSUFFICIENT DATA**. No physical Time Margin or "best landing site" claim may be issued. Scientific uncertainty and missing coverage are *not* equivalent to guaranteed failure.

## Team roles

- Fayzeh: NASA provenance, coordinates, ephemerides, LOLA, physics, Mission Rescue and science validation.
- Ala: 2D visualizations and interaction, accurate source labels, comparison presentation, synchronized timelines, user feedback and accessibility.
- Both: integrate, science review, test, deploy and present the final reproducible result.
