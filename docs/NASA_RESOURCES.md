# Official and related NASA sources — provenance first

## Challenge and challenge-referenced interactive resources

- [NASA Space Apps 2026: Lunar Landing Site Navigator](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/): authoritative mission prompt. Interactive site/date comparison, Sun/Earth position relative to lunar horizon, dynamic timelines, sunlight/power and direct-to-Earth visibility opportunities.
- [LROC QuickMap (ASU/NASA LRO data)](https://quickmap.lroc.asu.edu/): terrain and imagery context; **reference only**, no numerical QuickMap results ingested in this repository.
- [NASA Moon Trek](https://trek.nasa.gov/moon/): lunar surface visualization and independent coordinate/context inspection; **reference only**, not a terrain-horizon dataset consumed by the code.
- [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/app.html): ephemeris tool; **actually used** for Site01 AND Site04 with raw Sun (10) and Earth (399) records in each site's `data/*_audit` directory.
- [Canadian Space Agency — Moon Exploration](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/): broader lunar exploration context; **not** a numerical scientific input.

## Additional NASA technical resources used or planned

- [NASA Lunar Surface Data Book Revision A, Table A2-2, printed page 58](https://ntrs.nasa.gov/api/citations/20230007818/downloads/ACD-50044%20Lunar%20Surface%20Data%20Book%20Rev%20A.pdf#page=58): published representative Site01/Site04 feature centers. Neither is a landing-safety certification.
- [NASA Planetary Geodesy Data Archive: LOLA 5 m/pixel](https://pgda.gsfc.nasa.gov/products/78): **actually used** for local 5m terrain skylines for both sites and original NASA LOLA total-Z RMS error maps. Independent frame/datum and global visibility validation remain incomplete. Data: [Site04 GeoTIFF](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/Site04/Site04_final_adj_5mpp_surf.tif), [README](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README).
- [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) and [manual](https://ssd.jpl.nasa.gov/horizons/manual.html): reproducible coordinates, observer choice, time units and output convention. Actual request URLs and hashes in `data/site04_audit/queries.json`.
- [NASA SmallSat power subsystem review](https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/): theoretical reference for solar conversion, not a measured output for fictional hardware.

- [NASA PGDA LOLA south-pole large-area DEMs](https://pgda.gsfc.nasa.gov/products/90): **actually used**. Its official 80 m/pixel [LDEM_80S_80MPP_ADJ.TIF](https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_80MPP_ADJ.TIF) was downloaded by GitHub Actions with SHA256 `82030dcbdd7c4bb0c7d858e9b4b293b9f2cda5a543ba31ec0f42784bd6beee5a`, and combined with 5m local DEM to screen lunar sky obstruction out to approximately 300 km. **Not a validated global horizon**: vertical/frame alignment, error and distances beyond the raster remain unresolved. [Site01 record](../data/site01_audit/far_lola_meta.json), [Site04 record](../data/site04_audit/far_lola_meta.json).
- [Actual month-long Horizons Sun/Earth including solar range](../data/site01_audit/extended_dec2026.csv): source request parameters and raw SHA256 hashes in [Site01 metadata](../data/site01_audit/extended_dec2026_meta.json) and [Site04 metadata](../data/site04_audit/extended_dec2026_meta.json). Used by the new Mission Rescue Console.
- [NASA LOLA height-error maps](../data/site01_audit/lola_z_rms_meta.json): actually used for local RMS sensitivity screen (not a quantified global confidence interval). [Site04 audit](../data/site04_audit/lola_z_rms_meta.json).

## Verified and pending site metadata

| Site | NASA-listed latitude | East longitude | Current evidence |
|---|---:|---:|---|
| Site04 / Shackleton Rim (R04) | -89.7668° | 188.13° E | 745 true hourly Horizons epochs, Dec 1 2026–Jan 1 2027, plus real Sun range and preliminary near+far LOLA terrain screening; no certified window |
| Site01 / Connecting Ridge (R01) | -89.4632° | 222.51° E | 745 true hourly Horizons epochs, Dec 1 2026–Jan 1 2027, plus real Sun range and preliminary near+far LOLA terrain screening; no certified window |

These are **NASA-calculated predictions for a future date**, not measurements of a lunar landing. The public challenge page's Resources section can change: revisit the official page before submission.

## Outstanding science checks

Reconcile vertical geodetic reference and ME frame/DE version; DEM nodata, terrain curvature, slope, observer height, residual terrain beyond ~300 km and far 80m raster uncertainty; independent horizon/ephemeris check; documented incident-angle/solar-distance/irradiance model; eclipse and edge/partial-disc assumptions; near-transition finer cadence and timing uncertainty; second-site audit.

Until those checks pass, no time margin or rescued mission outcome should be advertised as scientifically valid. Do not download or commit massive NASA rasters, undocumented third-party assets, or credentials.
