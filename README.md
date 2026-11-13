# Lunar Window — Mission Rescue 🌙

**NASA Space Apps Challenge 2026 — Lunar Landing Site Navigator**

An evidence-first web application to explore real lunar south-pole Sun and Earth geometry, compare candidate locations and dates, and ultimately **rescue a constrained operating plan** when the original site/start does not meet its requirements.

**Our creativity and innovation:** an *explainable multi-case Mission Rescue* decision workflow: identify all causes of failed power and geometric Earth-visibility requirements, test permitted site/start changes, rank valid alternatives by user priority, and display the **time margin** before a verified window ends. Not just a pretty lunar map.

> **Scientific status:** A real NASA/JPL Horizons Site04 dataset and source audit are present. The full LOLA terrain horizon, site-specific power estimate, Site01 geometry, continuous operations windows and scientifically validated rescue recommendations are **not yet complete**. The live dashboard correctly reports **INSUFFICIENT DATA**, not an invented win.

## Quick start

Open [the interactive HTML dashboard](docs/index.html) in a browser. It contains **169 actual calculated JPL Horizons timestamps**, 2026-12-01 00:00 through 2026-12-08 00:00 UTC, at an audited representative Shackleton Rim site point. Use the slider to inspect the actual azimuth/elevation of the Sun and Earth; the reference zero line is **local horizontal, not the verified LOLA terrain horizon**.

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
