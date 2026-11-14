# ZENITH scientific review — 2026-11-14

## Predeclared comparison methods

The existing numerical verifier checks every five-minute record at both sites (2,882 records), original four raw-file hashes and source fields. It compares three panel orientations (8,646 calculations) against a separate Python vector dot product. Acceptance is <1e-9 W, comfortably above floating-point arithmetic error; skyline clearance tolerance is <2e-8 degrees to allow stored decimal rounding. Both candidate sensitivity minima must agree within 0.000501 W, accounting for output rounded to 0.001 W. These thresholds existed before this audit inspected results.

The new temporal check uses the unchanged reference request on genuine hourly and five-minute source records. Before comparison it sets a 0–60 minute expected discretization difference between first nominal starts. This investigates sampled threshold behavior; it cannot establish convergence below five minutes. `node scripts/verify_zenith.cjs` writes its result under `artifacts/audit/temporal.json`.

## Completed implementation checks

Original regression is retained: 50.156 W original minimum; 12:40 UTC nominal candidate at 100.283 W and 82.531 W under ±1°/10% reduction; 17:45 UTC at 120.094 W nominal and 100.250 W under that profile. There are 153 nominal candidates, 92 passing ±1° and none passing ±5°. Each profile has nine tilt/azimuth combinations and 10% lower output. The later candidate's reserve is only about 0.25 W. The request is not modified to obtain these results.

All 2,882 source records and 8,646 vector comparisons pass; maximum difference is 1.137e-13 W. This is separate implementation verification within this project using the same ephemerides and terrain, not independent model validation.

Windows Git checkout initially converted LF evidence to CRLF and broke raw-byte fingerprints. Committed blobs were checked against recorded hashes before restoring only newline-transformed checkout files. `.gitattributes` now preserves evidence bytes (`-text`), including source tables originally committed with CRLF. No source values or recorded hashes were changed. Audit scripts no longer rewrite the published numerical report or screenshot during routine checks.

## NOT RUN: terrain convergence

The workspace has the original source-derived tables and provenance, but no source GeoTIFF rasters; `rasterio` is unavailable. Consequently angular/radial convergence was not computed. Near/far overlap checks pass, but that proves only overlap along sampled rays. It cannot exclude narrow obstacles between the 1° azimuth rays.

Required reproducible study: use the recorded raster SHA256s and unchanged observer coordinates/height, compare nested azimuth spacing 1°, 0.5°, 0.25° and local radial steps 5, 2.5, 1.25 m; compare far radial steps 40, 20, 10 m. Include every bearing traversed by Sun/Earth during the original, nominal and sensitivity-passing operations, plus ±2° around each. Retain per-bearing maxima and obstruction distances in separate artifacts. Predeclare a diagnostic target <0.01° change over the final two refinements, and flag every pass/fail change; this target is not an uncertainty guarantee. Interpolated DEM pixels, unresolved features and residual far terrain still require review.

## INCONCLUSIVE: temporal convergence

Real five-minute records refine the hourly decision grid. No genuine sub-five-minute records are present. A passing 5-minute run does not exclude crossings, partial-disc changes or eclipses between samples. Future acquisition must retain official raw records, queries, corrections and hashes; do not synthesize missing NASA timestamps.

## NOT RUN: SPICE versus Horizons

`spiceypy`, SPK trajectory kernels, a lunar binary PCK and a leap-second kernel are absent. No numerical SPICE comparison or success is claimed. A frame kernel alone cannot calculate ephemerides.

The official [NAIF frame kernel](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_de440_250416.tf) specifies DE440 PA and ME realizations and names the compatible `moon_pa_de440_200625.bpc`. MOON_ME, MOON_PA and IAU_MOON are not interchangeable. Original Horizons responses declare MEAN_ME and DE441; local DEM provenance mentions ME/DE421. This frame/datum relationship remains unresolved. The exact original observer longitude, latitude and provisional height are recorded in each `fine_5m_meta.json` query (Site01 height 1.946632568359 km in the request). Do not replace this with a bare 2 m geodetic altitude: 2 m is the model's height above local terrain.

A defensible future comparison needs an explicit transformation of the same physical observer, spherical/radial versus geodetic conventions, UTC-to-TDB conversion, matching light-time/stellar-aberration choices and airless apparent directions from the [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html). It must record kernel versions/hashes, all corrections and justified angular thresholds before comparison. Separate programs using shared JPL upstream models are not wholly independent physical evidence.

## Boundaries and contribution

Ideal fixed-panel direct power; binary Sun-center terrain blocking; no complete battery, eclipse, partial solar disk, thermal or electrical-loss model. Earth-center visibility is not station-specific RF contact. Sampled success is not continuous operation or landing-safety certification. Local RMS review bands do not quantify full far-terrain uncertainty.

[Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html) provides observer ephemerides. [LOLA PGDA](https://pgda.gsfc.nasa.gov/products/78) provides terrain and height uncertainty products; nominal pixel size does not imply all pixels were directly measured. [Moon Trek](https://trek.nasa.gov/moon/jpl/config/textAbout.html) supports mission planning, elevation, lighting and slope analyses. ZENITH contributes a narrow, inspectable constrained-decision workflow with declared sensitivity exercises and accessible explanation. No uniqueness or superiority claim is established.
