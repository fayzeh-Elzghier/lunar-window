# Lunar Window — NASA Space Apps 2026 | Submission Brief & Verified Demo

> **Research prototype, not flight-qualified lunar mission software.** This brief describes features actually present in GitHub on 2026-11-14, plus the scientific validation that must not be falsely claimed.

## Challenge alignment

NASA's [2026 Lunar Landing Site Navigator](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/) asks for a simple, rapid way to compare lunar locations/dates and visualize Sun and Earth relative to the local horizon to reason about sunlight and direct-to-Earth communication. It specifically discusses changed launch dates and evaluating alternate sites.

**Our innovation: Explainable Mission Rescue.** Instead of only showing astronomical lines, the tool screens a user's mission constraints and compares:
- Original site/start;
- Same site with allowable departure from the requested start;
- Switching to another NASA-curated south-pole site;
- Switching site *and* time;
- Failures caused simultaneously by inadequate preliminary Sun clearance, Earth clearance and the unshadowed panel reference;
- User priorities and the **remaining user-defined schedule delay allowance**;
- A separate, scientifically gated **physical Time Margin**: currently UNKNOWN until continuous, fully validated windows exist.

## Exactly what is real now

| Component | Real source | State |
|---|---|---|
| Site01 Connecting Ridge (R01) and Site04 Shackleton Rim (R04) | NASA Lunar Surface Data Book, table A2-2 | Both curated points included |
| Sun and Earth angles | JPL Horizons (target IDs 10/399, Moon observer) | **745 actual UTC hourly epochs/site**, 1 Dec 2026–1 Jan 2027 |
| Sun distance | Horizons observer-range quantity 20, AU | Actual Sun-distance field available at all 745 epochs/site |
| Sampled near+far terrain skyline | NASA LRO/LOLA landing-site 5 m DEM and **NASA south-pole large-area 80 m DEM** | 360 actual NASA-derived direction profiles/site, screening local obstacles and far relief out to approximately 300 km; **provisional**, not a certified whole-Moon horizon |
| Local RMS elevation screening | NASA LRO/LOLA 5 m total-height RMS GeoTIFF | 360 azimuth-specific *approximate* angular RMS values per site, **not** a formal confidence bound |
| Panel reference | NASA Goddard TSI reference ~1361 W/m² at 1 AU × inverse-square Sun distance correction × fixed panel dot-product | Unshadowed geometric reference, **not available operating electrical power** |
| Multi-case Mission Rescue | Actual above hourly outputs, entered constraints | Working **research screening only**; no certified feasibility or physical Time Margin |
| Interface | GitHub Pages | [Mission Rescue Console](https://fayzeh-elzghier.github.io/lunar-window/mission-console.html) + original NASA explorer |

## The actual NASA-derived walkthrough

This demo uses **the original NASA ephemeris series**; the engineering parameters are clearly **user-selected requirements, not NASA hardware specs**.

Scenario requirements:
- Select **Site01 — Connecting Ridge**.
- UTC start: **2026-12-21 00:00**.
- Duration: **6 hours**.
- Required power: **100 W**.
- Panel area: **1.5 m²**, efficiency **25%**, tilt **30°**, azimuth **90°**.
- Require geometrically unobstructed Earth during operation: **Yes**.
- Maximum start delay: **72 hours**.
- Priority: earliest screened alternative.

### Original plan (real dated NASA ephemeris + provisional LOLA)

At 2026-12-21 00:00 UTC, the unshadowed, distance-adjusted panel **reference** computes around **32.82 W**, less than the user-entered 100 W. By 05:00 UTC it rises to about **44.29 W**. This is a transparent indication of **orientation shortfall under our reference model**, not actual verified electricity at the landing site. The preliminary Sun local clearance is around +0.32 to +0.35°, and Earth local clearance around +4.69 to +4.72° during those sampled hours. Far terrain and temporal continuity remain unresolved.

### Proposed site/time change for further scientific review

At **2026-12-22 06:00 UTC** (30 hours after the requested start), the NASA-derived six-hour sampled reference reaches at least **100.18 W** with positive sampled local Sun and Earth clearances. It is an **edge-review / research candidate**, NOT a confirmed mission rescue: NASA LOLA RMS review bands, distant mountains, eclipse, vertical datum and continuous-crossing checks are still outstanding.

The remaining *user-defined delay allowance* would be **72 − 30 = 42 hours** at this candidate. That is **not** the physical Time Margin or time until sunset/Earthset. Physical Time Margin remains **UNKNOWN**.

A meaningful innovation story is thus **original constraints → traceable cause → alternative date within user delay → uncertainty/what remains → decision-maker does not receive an invented approval.**

### 60–75 second screen-recording narration

1. **0–12 s — Problem:** “Lunar south-pole missions face severe sunlight and Earth-visibility constraints. Separate NASA tools make rapid comparison difficult.”
2. **12–26 s — Evidence:** “We use NASA's actual JPL Horizons Sun/Earth geometry and original LOLA topography for two curated south-pole sites. Every number has source provenance.”
3. **26–43 s — Initial plan:** “Here is a six-hour experiment requiring 100 watts and Earth visibility. The selected original start has an orientation-based reference power shortfall.”
4. **43–58 s — Our innovation:** “Mission Rescue checks allowable time shifts and alternate sites, explains constraints, and lists candidates prioritized by the user's requirements.”
5. **58–75 s — Integrity and impact:** “It proposes a later research candidate, but does not call it a confirmed operating window. Missing scientific validation and the physical time margin are shown as unknown. That traceability is essential for trustworthy mission planning.”

**Do not show a 'MISSION SUCCESS' banner or claim full compliance with 26 acceptance cases.** The 26-case matrix specifies desired acceptance behavior, not completed physical verification.

## Source links for judges

- [Official NASA challenge](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/)
- [JPL Horizons UI](https://ssd.jpl.nasa.gov/horizons/app.html) and [API manual](https://ssd-api.jpl.nasa.gov/doc/horizons.html)
- [NASA LOLA site DEM and RMS error products](https://pgda.gsfc.nasa.gov/products/78)
- [NASA LOLA larger south-pole DEMs](https://pgda.gsfc.nasa.gov/products/90)
- [NASA Goddard Solar Irradiance Reference](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science)
- [Actual Sun/Earth/solar AU source for Site01](../data/site01_audit/extended_dec2026.csv), [Site04](../data/site04_audit/extended_dec2026.csv)
- [Actual LOLA RMS angular audit for Site01](../data/site01_audit/lola_z_rms_screen.csv), [Site04](../data/site04_audit/lola_z_rms_screen.csv)
- [All exact original JPL source parameters/hashes for Site01](../data/site01_audit/extended_dec2026_meta.json), [Site04](../data/site04_audit/extended_dec2026_meta.json)
- [Computational and safety tests](../scripts/verify_console.cjs) and [GitHub Actions](https://github.com/fayzeh-Elzghier/lunar-window/actions)

## Completion gate — protect judging validity

Scientifically **unfinished**, and therefore still requiring actual evidence, not a paper checkmark:
1. Independently reconcile site DEM vertical Z conventions and MOON_ME / DE421 vs Horizons observer frame and local slopes.
2. Validate the *whole* terrain horizon, including distant lunar topography, and corresponding error / DEM correlations.
3. Refine JPL ephemerides near actual Sun/Earth threshold crossings, model partial solar-disc and eclipse effects and timing uncertainty.
4. Establish corrected, physically validated **continuous** direct-sun irradiance/available panel power and geometric Earth-center windows (not guaranteed RF communications).
5. Feed validated continuous windows to `src/mission_rescue.py`, then prove the actual physical time margin. A sample at a dataset boundary cannot establish window end.
6. Verify UI in target browsers and capture the final on-screen result/video; record judges' exact current-year criteria before asserting weights.

No fabricated data, unproven site ranking, or hidden relaxation of mission constraints is permitted.

## Ownership — both roles covered by the implementation

**Fayzeh track:** original NASA data, provenance, real Sun-distance reference, local terrain and RMS audit, scientific gates, candidate-screening engine and scenario explanations.

**Ala track:** responsive website, accessible mission form, location comparisons, Sun/Earth timeline graphs, interactive analysis, explicit result states and report export.

**Joint:** automatic source / JS / Python verification, GitHub Pages, official challenge resources and presentation narrative.
