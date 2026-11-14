# Lunar Window — Mission Rescue 🌙

**NASA Space Apps Challenge 2026 — Lunar Landing Site Navigator**

An evidence-first web application to explore real lunar south-pole Sun and Earth geometry, compare candidate locations and dates, and ultimately **rescue a constrained operating plan** when the original site/start does not meet its requirements.

**Our creativity and innovation:** an *explainable multi-case Mission Rescue* decision workflow: identify all causes of failed power and geometric Earth-visibility requirements, test permitted site/start changes, rank valid alternatives by user priority, and display the **time margin** before a verified window ends. Not just a pretty lunar map.

> **Scientific status:** Real JPL Horizons ephemerides for **both Site01 and Site04** (169 true UTC epochs each) are present. Local LOLA horizon screening is available for both sites, but distant terrain, independent frame validation, actual available power, continuous operation windows and verified rescue alternatives remain **incomplete**. The live dashboard correctly reports **INSUFFICIENT DATA**, not an invented win.

## Quick start

Open [the interactive HTML dashboard](docs/index.html) in a browser. It contains **169 actual JPL Horizons timestamps per site (338 site-time records total)**, 2026-12-01 00:00 to 2026-12-08 00:00 UTC, for the two NASA-listed south-pole locations. Use the slider to inspect the actual azimuth/elevation of the Sun and Earth; the reference zero line is **local horizontal, not the verified LOLA terrain horizon**.

GitHub Pages may optionally be enabled by the repository owner with **Settings → Pages → Deploy from branch → main → /docs**. A public live deployment is not claimed until enabled and verified.

To check NASA source integrity and safety guards:

```bash
python -m unittest discover -s tests -v
python scripts/rebuild_site04_dashboard.py
```

The dashboard builder uses **only** `data/site04_audit/sample.csv`; it rejects timestamp gaps, nonfinite angles, unexpected coverage or changed schema. It never fills in missing astronomy data.

## Repository structure

| Path | Description |
|---|---|
| [docs/index.html](docs/index.html) | Interactive real-Horizons exploration and Mission Rescue UI with strict science gate |
| [src/mission_rescue.py](src/mission_rescue.py) | Multiple case analysis, simultaneous failures, allowed time shifts, site changes, explicit missing-data status, physically bounded margins |
| [tests/test_real_data_and_guards.py](tests/test_real_data_and_guards.py) | NASA source integrity and no-fabrication safety checks, **not science acceptance** |
| [scripts/rebuild_site04_dashboard.py](scripts/rebuild_site04_dashboard.py) | Rebuilds embedded HTML source data from the already-audited real CSV |
| [scripts/audit_site04.py](scripts/audit_site04.py) | Original NASA retrieval/audit script; requires `numpy`, `rasterio` and network access |
| [data/site04_audit/](data/site04_audit/) | Original JPL Horizons raw Sun/Earth outputs, query parameters, metadata and hourly CSV |
| [docs/data-audit.md](docs/data-audit.md) | What has actually been scientifically inspected and remains unresolved |
| [docs/MISSION_RESCUE.md](docs/MISSION_RESCUE.md) | Our innovation, cases, time margin and scientific limitations |
| [docs/SCENARIO_MATRIX.md](docs/SCENARIO_MATRIX.md) | All 26 acceptance cases; science state not tested |
| [docs/NASA_RESOURCES.md](docs/NASA_RESOURCES.md) | Challenge resource references, actual-versus-planned use of NASA tools |
| [docs/OBJECTIVES_AND_RELEASE_GATES.md](docs/OBJECTIVES_AND_RELEASE_GATES.md) | Link between official 2026 objectives and verified functionality |
| [docs/STEP_01.md](docs/STEP_01.md) | Initial frozen MVP specification and engineering ownership |

## Implementation update — November 14, 2026

**Real code pushed; see [scientific status and reproducibility audit](docs/SCIENTIFIC_STATUS.md).**

- **NASA Site01 acquisition**: [script](scripts/acquire_site01.py) requests original site-specific JPL Horizons Sun/Earth angles and NASA LOLA Site01 LDEM. The [GitHub Actions pipeline](.github/workflows/nasa-science.yml) is configured to run that acquisition and commit only structurally verified source files. **Acquisition succeeded and its original 169-row Site01 CSV, raw Sun/Earth outputs and query provenance are now in the repository.**
- **Terrain horizon**: [lunar-curvature-corrected local skyline script](scripts/compute_local_horizon.py) samples original NASA LOLA pixels in all azimuths and reports unknown distant terrain explicitly. Local-tile results are **provisional**, NOT independently verified full horizons.
- **Solar orientation**: [panel incidence model](src/solar_geometry.py) and the Site04 dashboard show a **1 AU unshadowed irradiance reference** from real JPL angular data and user-defined panel geometry, using [NASA Goddard's ~1361 W/m² reference](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science). The [169-row NASA-derived reference CSV](data/site04_audit/panel_1au_reference.csv) and [calculation audit](docs/SITE04_POWER_GEOMETRY.md) are committed. Not actual solar power or a reason for a mission pass.
- **Site01 browser integration**: [source hash verifier/embedder](scripts/embed_site01_data.py) has imported 169 actual Site01 NASA records. The interface now visualizes both sites and their **provisional** local terrain-screening angles without presenting these as validated visibility or power.
- **No synthetic astronomy**. The 26-case register remains a requirements checklist, not 26 passed scientific tests.

### Automated NASA source workflow

[Check or run the NASA data workflow](https://github.com/fayzeh-Elzghier/lunar-window/actions/workflows/nasa-science.yml). If your GitHub Actions installation has network and write permissions, it downloads and audits NASA records, emits an artifact and commits the real time series and **labeled provisional** horizon outputs. If it does not run, follow the exact documented commands below in a networked Python environment:

```bash
python -m pip install numpy rasterio
python scripts/acquire_site01.py
python scripts/compute_local_horizon.py --site Site01
python scripts/compute_local_horizon.py --site Site04
python scripts/embed_site01_data.py
python -m unittest discover -s tests -v
```

Site01 source data and both provisional local LOLA horizon tables are committed. The [NASA Horizons vs LOLA comparison](docs/STEP_03_TERRAIN_SCREEN.md) and [Site01](data/site01_audit/terrain_screen_hourly.csv) / [Site04](data/site04_audit/terrain_screen_hourly.csv) hourly diagnostic files are also committed. This does **not** certify continuous operation windows, ground-station radio contact, or physical Time Margin.

## Core calculation, once upstream science is verified

The upstream pipeline must determine time-varying Sun/Earth geometry versus a physically validated lunar terrain horizon, fixed panel incidence, estimated direct solar power, and continuous condition intervals. The decision engine checks

```text
estimated_panel_power(t) >= required_power
AND (Earth-center visible(t) OR visibility_not_required)
for every instant in the requested contiguous duration
```

For a validated physically bounded window `[a,b)`, required duration `D`, and start `s`, the **time margin** is `b-D-s`. At a data cutoff the true remaining margin is **unknown**, not zero and not a fabricated Earthset.

No batteries, lander trajectory/landing safety certification, specific Earth ground-station radio link guarantee, or arbitrary-coordinate coverage is claimed.

## NASA resources and credits

This work uses source material and data from **NASA/JPL Horizons**, **NASA LRO/LOLA PGDA**, and the **NASA Lunar Surface Data Book**. The official challenge also references **LROC QuickMap**, **NASA Moon Trek**, and lunar exploration agency context; see [the detailed source register](docs/NASA_RESOURCES.md). **Reference links are not a claim of numerical integration.**

This is an independent student project and not NASA-endorsed, flight-certified or a substitute for mission engineering review.

**Roles:** Fayzeh — scientific data and mission logic; Ala — interface and user experience; joint scientific review and integration.
