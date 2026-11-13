# Official and related NASA sources — provenance first

## Challenge and challenge-referenced interactive resources

- [NASA Space Apps 2026: Lunar Landing Site Navigator](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/): authoritative mission prompt. Interactive site/date comparison, Sun/Earth position relative to lunar horizon, dynamic timelines, sunlight/power and direct-to-Earth visibility opportunities.
- [LROC QuickMap (ASU/NASA LRO data)](https://quickmap.lroc.asu.edu/): terrain and imagery context; **reference only**, no numerical QuickMap results ingested in this repository.
- [NASA Moon Trek](https://trek.nasa.gov/moon/): lunar surface visualization and independent coordinate/context inspection; **reference only**, not a terrain-horizon dataset consumed by the code.
- [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/app.html): ephemeris tool; **actually used** for Site04 with raw Sun (10) and Earth (399) records in `data/site04_audit`.
- [Canadian Space Agency — Moon Exploration](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/): broader lunar exploration context; **not** a numerical scientific input.

## Additional NASA technical resources used or planned

- [NASA Lunar Surface Data Book Revision A, Table A2-2, printed page 58](https://ntrs.nasa.gov/api/citations/20230007818/downloads/ACD-50044%20Lunar%20Surface%20Data%20Book%20Rev%20A.pdf#page=58): published representative Site01/Site04 feature centers. Neither is a landing-safety certification.
- [NASA Planetary Geodesy Data Archive: LOLA 5 m/pixel](https://pgda.gsfc.nasa.gov/products/78): **actually used** for one Site04 pixel in the first audit, but full horizon/vertical reference remain unverified. Data: [Site04 GeoTIFF](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/Site04/Site04_final_adj_5mpp_surf.tif), [README](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README).
- [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) and [manual](https://ssd.jpl.nasa.gov/horizons/manual.html): reproducible coordinates, observer choice, time units and output convention. Actual request URLs and hashes in `data/site04_audit/queries.json`.
- [NASA SmallSat power subsystem review](https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/): theoretical reference for solar conversion, not a measured output for fictional hardware.

## Verified and pending site metadata

| Site | NASA-listed latitude | East longitude | Current evidence |
|---|---:|---:|---|
| Site04 / Shackleton Rim (R04) | -89.7668° | 188.13° E | Site04 169 hourly Horizons epochs, Dec 1–8 2026; provisional surface altitude, no validated terrain visibility |
| Site01 / Connecting Ridge (R01) | -89.4632° | 222.51° E | Published feature-center coordinates only; no imported site-specific Horizons/LOLA evidence |

These are **NASA-calculated predictions for a future date**, not measurements of a lunar landing. The public challenge page's Resources section can change: revisit the official page before submission.

## Outstanding science checks

Reconcile vertical geodetic reference and ME frame/DE version; DEM nodata, terrain curvature, slope, observer height, remote obstacles beyond 16 km local tile; independent horizon/ephemeris check; documented incident-angle/solar-distance/irradiance model; eclipse and edge/partial-disc assumptions; near-transition finer cadence and timing uncertainty; second-site audit.

Until those checks pass, no time margin or rescued mission outcome should be advertised as scientifically valid. Do not download or commit massive NASA rasters, undocumented third-party assets, or credentials.
