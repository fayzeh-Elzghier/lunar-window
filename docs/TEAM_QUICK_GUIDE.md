# ZENITH — 3-minute walkthrough  🌙

**Updated November 14, 2026.** This is the CURRENT project handoff for both scientific and frontend contributions. Older descriptions saying Site01 data were missing are obsolete.

## Open the working project

- **Live mission website:** https://fayzeh-elzghier.github.io/lunar-window/mission-console.html
- **Original Horizons explorer:** https://fayzeh-elzghier.github.io/lunar-window/
- **Repo:** https://github.com/fayzeh-Elzghier/lunar-window
- **Source-driven demo story:** [SUBMISSION_DEMO.md](SUBMISSION_DEMO.md)

## How it works — simple explanation

1. **NASA coordinates:** Site01 Connecting Ridge and Site04 Shackleton Rim are published lunar south-pole reference points.
2. **NASA/JPL Horizons:** Original future astronomical calculations tell us the direction (azimuth/elevation) to Sun and Earth and the Sun's range in AU for **745 hourly timestamps per site** from 1 December 2026 to 1 January 2027.
3. **NASA LOLA topography:** Authentic 5 m site terrain plus 80 m large-area South Pole DEM data provide preliminary **terrain sky-obstruction angles**, sampled outward to ~300 km. The observer height, coordinate frame, distant coverage and error are NOT independently validated into a complete physical horizon.
4. **NASA LOLA RMS:** An additional genuine NASA raster provides local-height uncertainty. Our **review heuristic** uses an approximate 3× propagated RMS plus a 0.25° floor; this is NOT a formal 3-sigma physical confidence interval and excludes error in the far terrain.
5. **Panel model:** Given the user's *assumed* area/efficiency/tilt/azimuth, a simple orientation dot product and NASA Sun distance give an unshadowed **solar reference**, not verified operating watts.
6. **Our innovation — Mission Rescue:** Try the original plan and allowed site/time changes; show point-sample causes and possible candidates, but **NO certified mission pass and NO known physical Time Margin** until uninterrupted, scientifically verified windows are built.

## Demo to reproduce from ORIGINAL NASA records

Open the Console and use the already selected example:

| Input | Value |
|---|---|
| Original site | Connecting Ridge / Site01 |
| Original time | 2026-12-21 00:00 UTC |
| Operation duration | 6 hours |
| Requested power | 100 W |
| Max allowed start delay | 72 hours |
| Panel | Area 1.5 m², efficiency 25%, tilt 30°, azimuth 90° |
| Earth during operation | Required |
| Priority | Earliest screened start |

Click **Run multi-case screening**. The original six sampled hours show a modeled **unshadowed Sun-distance-corrected reference** around 32.82–44.29 W (under the assumed 100 W requirement). The tool then examines later UTC timestamps and the alternate site under the same assumptions.

An early **candidate needing extra scientific verification** appears around **December 22, 06:00 UTC**, 30 h later; its 6-hour reference minimum is ~100.18 W with positive *sampled* Sun/Earth clearance, but it is **near the NASA local error review band**. It is NOT a physically validated 100-W operation.

The candidate has **42 h remaining inside the USER'S maximum 72 h scheduling-delay allowance**, but that is **NOT physical Time Margin**. The true physical Time Margin is UNKNOWN because the verified complete window end has not been established.

You can switch to power-only and other dates to see additional, authentic site-time cases. No programmatic fake astronomical data are included.

## Implemented components

**Scientific implementation:** Original NASA extraction, UTC/time/hash checks, 745×2 Horizons ephemerides with Sun AU distances, LOLA 5 m local 360-bin horizon, NASA 80 m up-to-300-km sampled skyline, NASA local height RMS screening, unshadowed panel orientation/reference, multi-case selection, provenance and CI validation.

**Interface implementation:** Responsive, keyboard-accessible Mission Rescue Console; two sites; UTC time slider; color-coded real Sun/Earth geometry and terrain-clearance graphs; mission settings; changed-setting invalidation; multi-case alternatives with explanations; user-delay budget versus unknown physical margin; JSON source-traceable export; real NASA resource links; original explorer retained.

## Honest science limitations — be prepared if judges ask

- No independent scientific reconciliation of LOLA MOON_ME / DE421 frame with Horizons DE441 ephemeris and site local normal/vertical datum.
- Far terrain has been sampled out to ~300 km with an 80 m DEM, **not all lunar obstacles**; far-field error raster and correlations remain unquantified.
- Hourly values cannot certify continuous 6-hour sunlight/communications.
- Sun/Earth centers are not finite-disc eclipse-aware, and Earth-center geometry is not a guaranteed ground-station RF link.
- Panel reference is not actual electrical system output; batteries, thermal and landing safety are outside MVP.
- The remaining physical Time Margin is **UNKNOWN**, as is any certified feasible alternative.

## Source and execution proof

- [NASA source register](NASA_RESOURCES.md).
- [Actual combined 5m+80m screen, Site01](../data/site01_audit/far_screen_dec2026.csv) and [Site04](../data/site04_audit/far_screen_dec2026.csv).
- [NASA original JPL monthly provenance Site01](../data/site01_audit/extended_dec2026_meta.json) and [Site04](../data/site04_audit/extended_dec2026_meta.json).
- [Code/unit checks](../scripts/verify_console.cjs) and [Github CI](https://github.com/fayzeh-Elzghier/lunar-window/actions/workflows/verify.yml).
- [Challenge page](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/).

**Team presentation rule:** describe the feature as *explainable scientific screening and research-candidate rescue*, not NASA-certified power availability, flight readiness or actual continuous-window optimization. Record the screen only from the live tool with truthful statuses; never substitute an invented successful scenario.
