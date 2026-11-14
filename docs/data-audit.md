> Historical development snapshot. For the current corrected terrain model, demo settings and release status, read [current objectives](OBJECTIVES_AND_RELEASE_GATES.md) and [current demo](SUBMISSION_DEMO.md). Earlier numerical results may differ.

# Site04 NASA data audit / أول تسليم لفايزة

## Status / الحالة
Data acquisition and structural checks completed. Terrain-horizon calculation, independent physical validation, power calculation and mission recommendations are NOT completed.
تم استخراج البيانات وفحص بنيتها. لا نعتبر هذه النتائج إثباتًا لرؤية الشمس أو الأرض فوق التضاريس أو لصلاحية المهمة.

## 1. Coordinate source
NASA Lunar Surface Data Book, Revision A, Table A2-2, printed page 58:
https://ntrs.nasa.gov/api/citations/20230007818/downloads/ACD-50044%20Lunar%20Surface%20Data%20Book%20Rev%20A.pdf#page=58

R04 / Site04 Shackleton Rim:
- Latitude: -89.7668 degrees.
- Longitude: -171.87 degrees, normalized to 188.13 degrees east for Horizons.
- This is a published feature representative coordinate, NOT an approved safe landing point.
- The preceding table introduction describes feature centers derived from PGDA DEMs; do not infer sub-meter positional accuracy from decimal formatting.

## 2. Terrain source and extraction
NASA product: https://pgda.gsfc.nasa.gov/products/78
Download listing: https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/
README: https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README
Raster: https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/Site04/Site04_final_adj_5mpp_surf.tif

Downloaded 40,980,806 bytes. SHA-256 in metadata.json. Raster is 3200 x 3200, 5 m per pixel, south-polar stereographic. Product documentation specifies MOON_ME / DE421; GeoTIFF horizontal sphere radius is 1,737,400 m.
Coverage: X -9000 to 7000 m, Y -15000 to 1000 m (16 x 16 km).
Point projects to X=-1000.036606 m, Y=-7000.345565 m, raster row 1600, column 1599 (zero indexed).
Nearest containing-pixel surface value: 771.043212890625 m.
No bilinear terrain interpolation, local surface-normal estimation or surrounding horizon has been computed yet.

### Vertical-reference caution
For this preliminary ephemeris run, surface value + 2 m gives provisional Horizons altitude 0.773043212890625 km above its 1737.4 km reference sphere.
NASA's related polar illumination documentation explicitly uses elevation relative to a 1737.4 km sphere:
https://pgda.gsfc.nasa.gov/products/69
However, the Site04 README says surface height Z without a full vertical definition. Its projection radius alone is not a complete vertical-datum specification. Confirm the precise Site04 Z convention and ME-frame alignment before declaring terrain-validated results.

قراءة الارتفاع من الملف ليست بحد ذاتها تحققًا من مرجعه الرأسي. ارتفاع الراصد المستخدم مبدئي ومعلن، ولا نستخدمه بعد لإصدار توصيات.

## 3. Horizons request
Web interface: https://ssd.jpl.nasa.gov/horizons/app.html
Manual: https://ssd.jpl.nasa.gov/horizons/manual.html
API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html

- Observer center: coord@301 (Moon).
- Targets: Sun 10, Earth 399.
- Coordinate type: GEODETIC; longitude 188.13 E; latitude -89.7668.
- Altitude: provisional 0.773043212890625 km.
- Interval: 2026-12-01 00:00 through 2026-12-08 00:00 UT, endpoints included.
- Step: 1 hour, 169 samples per target.
- Quantity 4: airless apparent azimuth/elevation in degrees.
- Header confirms Moon (301), MEAN_ME, reference radii 1737.4 km, NO (AIRLESS), target ephemeris DE441.
- These are predictions for a future interval, not observed mission measurements.

Raw responses, complete URLs, parameters, retrieval timestamps and hashes are in ../data/site04_audit/.
Horizons does not apply our LOLA terrain horizon to these angles.

## 4. Small sample / عينة
| UTC | Sun azimuth deg | Sun elevation deg | Earth azimuth deg | Earth elevation deg |
|---|---|---|---|---|
|2026-12-01T00:00:00Z|91.939769|1.462253|178.539374|-1.843399|
|2026-12-01T06:00:00Z|88.89987|1.47324|178.627315|-2.22333|
|2026-12-01T12:00:00Z|85.859521|1.484286|178.694084|-2.594851|
|2026-12-02T00:00:00Z|79.777487|1.50641|178.767082|-3.308284|
|2026-12-08T00:00:00Z|6.683824|1.674184|175.263144|-6.951413|

At the first epoch, the Sun center is about 1.462253 degrees above the local horizontal and the Earth center about 1.843399 degrees below it under this provisional observer model.
This is not a terrain-visibility decision. A negative elevation alone is not a universal terrain-horizon test for an elevated observer.

## 5. Checks actually performed
- Confirmed coordinate in the NASA table.
- Read raster CRS/extent and confirmed coordinate inside the file.
- Confirmed finite sampled terrain value.
- Parsed 169 matching hourly timestamps for each target.
- Checked azimuth/elevation numerical ranges.
- Confirmed lunar observer and airless mode in response headers.
- Issued a separate Sun request at longitude -171.87 rather than +188.13 for the first epoch: azimuth/elevation difference 0.0 degrees at returned precision.

The longitude check validates request normalization, NOT independent astronomy. Independent physical validation remains pending. No power or visibility acceptance case is marked passed by these checks.

## 6. Next scientific work
1. Resolve Site04 vertical convention and frame alignment.
2. Compare containing-pixel vs interpolated surface height and document uncertainty.
3. Build horizon with lunar curvature and sufficient near/far terrain coverage; the local 16 km patch is not automatically sufficient.
4. Validate a selected direction and epoch independently.
5. Add Sun geometry for panel incidence, documented irradiance, and eclipse handling.
6. Only then compute terrain-aware visibility, power and mission windows.

## 7. Reproduction
Install Python dependencies numpy and rasterio.
Run: python scripts/audit_site04.py

The script downloads the DEM if absent; it is not stored as a large binary in GitHub. Output raw text and metadata are checked into data/site04_audit/.
Script network requests require access to NASA endpoints.

## 8. What Fayzeh should open / شو تفتحي أنتِ
1. NASA Data Book page 58: find R04 / Site04 to see the coordinate.
2. LOLA listing: scroll to Site04, inspect LDEM and total Z uncertainty links.
3. Horizons app: choose observer table, Sun or Earth, and a user-defined lunar observer.
4. Open the CSV in this repository to compare the actual extracted rows.

You do not need to install GIS software to read the sources or CSV.
