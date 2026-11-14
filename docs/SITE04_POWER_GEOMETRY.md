# Site04: actual NASA ephemerides → panel incidence reference (not available power)

**Date of derived file:** 2026-11-14. **Scientific status:** informative geometry/reference calculation ONLY.

## Original source

The 169 hourly rows in [NASA Site04 source CSV](../data/site04_audit/sample.csv) were derived from *real JPL Horizons calculations* for the published Shackleton Rim feature representative point:

- Site04 latitude: -89.7668 deg, east longitude: 188.13 deg.
- UTC: 2026-12-01 00:00 through 2026-12-08 00:00, 169 sample epochs.
- NASA/JPL Sun and Earth directions at a **provisional** lunar observer height of DEM pixel elevation + 2 m.
- Original JPL queries, output hashes and retrieval records: [queries.json](../data/site04_audit/queries.json).
- Source coordinate reference: [NASA Lunar Surface Data Book, table A2-2](https://ntrs.nasa.gov/api/citations/20230007818/downloads/ACD-50044%20Lunar%20Surface%20Data%20Book%20Rev%20A.pdf#page=58).

### Engineering model used for *geometric comparison only*

Site04 astronomical Sun angles are genuine NASA ephemerides. The panel model uses **operator-selected demonstration assumptions**, not NASA hardware specs:

- Panel area `A = 1.0 m²`.
- Panel electrical conversion efficiency `η = 0.25`.
- Panel normal tilts `30°` from local Up, toward azimuth `90°` (east).
- NASA Goddard's approximate measured total solar irradiance reference at **1 AU** `S_ref = 1361 W/m²`, https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science .

Local East/North/Up panel normal and Sun vector:
```
n = (sin(tilt)*sin(panel_az), sin(tilt)*cos(panel_az), cos(tilt))
s = (cos(sun_el)*sin(sun_az), cos(sun_el)*cos(sun_az), sin(sun_el))
incident = max(0, dot(n,s))
P_ref_1AU = 1361 * area * efficiency * incident
```

Azimuth is clockwise from local north. The calculation uses only the real NASA Sun-angle samples. It is a reproducible reference at 1 AU with no terrain screening.

## Actual computed output from the 169 published-project NASA samples

[Download the source-traceable CSV](../data/site04_audit/panel_1au_reference.csv).

For the user-assumed panel above:

| UTC | NASA Sun azimuth | NASA Sun elevation | Geometric 1 AU reference |
|---|---:|---:|---:|
| 2026-12-01 00:00Z | 91.939769° | +1.462253° | 177.491514 W |
| 2026-12-08 00:00Z | 6.683824° | +1.674184° | 28.401351 W |

This contrast explains why panel **orientation** matters, even when the Sun remains at a similar elevation above local horizontal.

**These values do not indicate the panel would actually produce 177 W or 28 W on the Moon.** The model has not established solar eclipse, Sun-distance scaling for these epochs, terrain shading, local slopes, temperature, dust, panel losses/degradation, battery, electronics, or solar-disc fraction. Even if a reference exceeds the user's load, **no actual power-pass or Time Margin is asserted**.

## Why local LOLA is not enough

NASA's [LOLA 5 m product](https://pgda.gsfc.nasa.gov/products/78) includes large interpolation fractions and height/slope uncertainty maps. A 16 × 16 km site tile cannot prove no distant obstruction exists. Our [local horizon tool](../scripts/compute_local_horizon.py) uses spherical lunar curvature but marks every azimuth's far terrain **unknown**. It is not a visibility proof.

A valid solar power timeline ultimately requires NASA-derived Sun distance, verified terrain skyline, timestamp-refined near-horizon crossings and uncertainty propagation; then the [Mission Rescue engine](../src/mission_rescue.py) may act on verified continuous intervals.
