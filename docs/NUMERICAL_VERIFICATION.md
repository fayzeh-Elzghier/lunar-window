# Numerical verification — reproducible evidence

Run `python scripts/verify_numerics.py` with Python 3.11+ and Node 22.

**PASS:** 2,882 original NASA site-time records checked against raw responses; 8,646 panel-power comparisons across three panel orientations. Maximum Python/vector versus browser difference: **1.137e-13 W** (acceptance: <1e-9 W). Maximum recomputed skyline-clearance difference: **5.000e-10°** (acceptance: <2e-8°, allows stored decimal rounding).

## What was actually checked

- SHA256 of all four original five-minute JPL responses matches the recorded provenance.
- UTC, Sun/Earth angles and Sun distance in the browser match original records.
- Displayed terrain clearance matches circular interpolation of the committed horizon table.
- A separately written Python 3D vector dot product agrees with the browser's trigonometric panel calculation, including terrain blocking.
- An analytical perpendicular 1 m², 25%-efficient panel at 1 AU yields 340.25 W under the 1361 W/m² reference.
- Both demo candidates' nine-combination sensitivity minima agree between Python and JavaScript to stored 0.001 W precision, for ±1° and ±5° profiles.

## Decision demonstration (illustrative hardware)

| Case | Start UTC on Dec 21, 2026 | Minimum nominal W | Minimum W at 10% lower output, ±1° offsets | Interpretation |
|---|---|---:|---:|---|
| First candidate | 12:40 | 100.283 | 82.531 | Nominal pass, stress failure |
| Later candidate | 17:45 | 120.094 | 100.250 | Meets both sampled criteria |

Of 153 nominal candidates, 92 meet the ±1°/10%-reduction profile and 0 meet the ±5°/10%-reduction profile. Both profiles are illustrative, not measured hardware tolerances or formal confidence bounds. The requested 6h/100W/Earth-visibility conditions remain unchanged.

## Scope — do not overclaim

This is a **separate implementation check**, written within this project. It uses the same NASA source records and terrain table. It does **not** independently validate JPL ephemerides, DEM accuracy, coordinate alignment, complete horizons, eclipse conditions, continuous windows, hardware performance or radio contact. It is not an external expert review or measured field validation. Numerical agreement cannot remove a shared model error.

Sources: [NASA JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html), [NASA solar irradiance reference](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science), [NASA LOLA local data](https://pgda.gsfc.nasa.gov/products/78).

## Source fingerprints

- `Site01_sun`: `4058658b4d47ea1c423905c76a4b35383d98e4cea5606a342672d637bc1e041e`
- `Site01_earth`: `cbcc1aa90a6c60fab5b0d47acb2e34f1268d3cc688c6599087f14fcd0f19232f`
- `Site04_sun`: `3702fe5bba8a7df8a39b6d096f9d363aa8b3faba92ea902ddeda9cf9d3cf5393`
- `Site04_earth`: `73931e563d386db9f9857a97d9e2a8a230052d69d8b124906bad6dd62b8d7d57`
