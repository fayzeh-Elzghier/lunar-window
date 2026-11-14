> Historical development snapshot. For the current corrected terrain model, demo settings and release status, read [current objectives](OBJECTIVES_AND_RELEASE_GATES.md) and [current demo](SUBMISSION_DEMO.md). Earlier numerical results may differ.

# NASA Space Apps 2026 — Ready-to-Paste Submission Fields

**Project title:** Lunar Window — Mission Rescue

**Selected challenge:** Lunar Landing Site Navigator

**Public project demo (exactly seven accessible slides):** https://fayzeh-elzghier.github.io/lunar-window/judges-slides.html

**Live final project:** https://fayzeh-elzghier.github.io/lunar-window/mission-console.html

**Source code and reproducibility:** https://github.com/fayzeh-Elzghier/lunar-window

**Language:** English (including all slide content). The software is an independent student research prototype.

## 1. Short project summary

Lunar Window is an evidence-first interactive research prototype for exploring solar power potential and direct-to-Earth geometric visibility at two NASA-curated lunar south-pole candidate sites. Using original NASA/JPL Horizons Sun and Earth ephemerides and NASA LRO/LOLA topographic measurements, it displays time-dependent terrain-clearance diagnostics, compares sites, and explains the potential conflicts in a user's operating plan. Our innovation, **Mission Rescue**, screens alternative sites and permissible start delays under unchanged user constraints, clearly distinguishes sampled candidates from verified operating windows, and keeps physical Time Margin UNKNOWN when science evidence cannot yet establish it.

## 2. The problem and our solution

South-pole mission planners need to check multiple time-dependent environmental factors. Sun elevation relative to a smooth horizontal plane is not enough because nearby ridges and distant lunar relief may block sunlight. Earth-center elevation does not guarantee a direct-to-Earth RF link. A mission that requires simultaneous adequate power and geometric Earth opportunity needs a truly **continuous** overlap.

Lunar Window brings these components into one intuitive interface. It presents NASA-authored geometry and source-traceable near/far terrain-screening data, lets users specify an operation duration, assumed panel geometry/efficiency, required watts, continuous Earth-visibility option and maximum allowed start delay, and screens the original case and alternate site/timing cases without silently changing the constraints.

Our distinctive contribution is an explainable decision workflow. It reports all detected sampled conflict reasons and UTC intervals, explores potential rescue cases, allows user priorities, and separates **remaining user schedule allowance** from **true physical operating-window Time Margin**. The latter stays unknown unless independently validated continuous endpoints exist.

## 3. How the original NASA data is used

- **NASA/JPL Horizons:** Sun (target 10) and Earth (target 399) azimuth/elevation at the two published lunar locations; 745 original hourly UTC epochs per site from 2026-12-01 through 2027-01-01, plus **1,441 original five-minute UTC epochs/site** from 2026-12-20 through 2026-12-25. Sun range in astronomical units (AU) is also derived from Horizons. The original request URLs, source outputs and SHA256 hashes are kept in the repository.
- **NASA Lunar Surface Data Book, table A2-2:** representative coordinates of Site01 Connecting Ridge and Site04 Shackleton Rim.
- **NASA LRO/LOLA site DEMs (PGDA Product 78):** genuine 5 m local surface elevations for sampled terrain silhouettes and separate local total-height RMS error products for conservative near-edge review.
- **NASA LRO/LOLA south-pole large-area DEMs (PGDA Product 90):** original 80 m south-polar elevation data sampled outward to approximately 300 km, combined with local 5 m silhouettes. This is not a validated full-skyline guarantee.
- **Solar model:** NASA Goddard's approximately 1361 W/m² 1 AU total-solar-irradiance reference, scaled with the actual Sun range and a fixed-panel incidence dot product, with explicitly user-selected area/tilt/azimuth/efficiency. This is a **distance-adjusted unshadowed reference** and NOT a measurement of actual lunar electrical output.

Source references:
https://ssd.jpl.nasa.gov/horizons/app.html
https://ssd.jpl.nasa.gov/horizons/manual.html
https://pgda.gsfc.nasa.gov/products/78
https://pgda.gsfc.nasa.gov/products/90
https://ntrs.nasa.gov/citations/20230007818
https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science

NASA-related challenge references used for research/visual cross-check rather than numerical integration:
https://quickmap.lroc.asu.edu/
https://trek.nasa.gov/moon/

Other space agency context (non-numerical):
https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/

## 4. Innovation: multi-case Mission Rescue

The system screens: original site and start, delayed operation at the same site, original date at a second NASA-curated site, and site changes with delayed starts. It reports multiple simultaneous potential causes rather than hiding one behind another. It checks duration, maximum delay and optional Earth constraint without automatically weakening a user requirement. It uses actual NASA timestamps only: if the requested boundary is not represented, it shows insufficient data rather than fabricating an intermediate NASA observation.

The demo uses Site01, December 21 2026 00:00 UTC, 6 hours, 100 W requested, continuous Earth visibility, 72-hour maximum start delay and assumed 1.5 m²/25%/30°/90° panel. The first 6-hour request has distance-corrected unshadowed reference power below the input requirement across its 72 authentic five-minute samples. A later UTC window starting December 22 06:00 is a scientifically **unverified research candidate** that satisfies a sampled reference-watt threshold but has most of its Sun clearance near the provisional NASA LOLA height-error review band. The remaining **42 hours** is only unused user schedule-delay allowance; physical Time Margin is UNKNOWN.

## 5. Current scope and limitations

The challenge application is an **interactive research demonstrator, not lunar mission certification**. Critical unresolved science includes: independent alignment of LOLA vertical/frame conventions and Horizons, far-field topographic errors and completeness, treatment of solar disc and eclipses, continuous between-sample behavior, instrument conversion/losses, and ground-station RF link engineering.

Earth-center geometric opportunity is explicitly not guaranteed radio communication. The app does not certify safe landing or spacecraft trajectories, schedule multiple experiments, model batteries, or accept arbitrary coordinates without matched science data. No scientifically verified physical Time Margin is currently claimed.

## 6. Software and tools

HTML, CSS and JavaScript; Python for reproducible NASA API/DEM acquisition and terrain screening; numpy/rasterio for NASA GeoTIFF processing; GitHub Actions for data integrity, automated source checking and deployment; GitHub Pages for the public application. Public original-source metadata and hashes let reviewers inspect the scientific provenance.

## 7. AI / SI tools disclosure — please copy this field

We used **ChatGPT (OpenAI)** as an AI-assisted development tool for code drafting, interface design, explanatory text, algorithm review, test construction and documentation. All astronomical and terrain input data displayed by the scientific prototype are derived from original NASA/JPL Horizons and NASA LRO/LOLA sources; we did **not** use AI-generated astronomical measurements, artificial lunar terrain, simulated spacecraft mission success, or AI-generated NASA imagery. The panel area, efficiency and operating load are transparent user assumptions rather than NASA hardware specifications. Generated code, calculations and scientific interpretations require independent human review, and unvalidated results are marked as preliminary.

## 8. Accessibility and demo

The public seven-slide demo has keyboard left/right navigation and print-to-PDF styles. The interactive application is publicly accessible, with a UTC slider, two sites, source citations, cause explanations, optional Earth constraint and exportable JSON screening reports. All source links should be checked in a private/incognito browsing window before submission.

## 9. Submission readiness checklist

- [x] Project title, short summary, detailed description and NASA source references drafted.
- [x] Public interactive project link and source repository available.
- [x] Seven-slide HTML demo prepared; also downloadable PDF/PPTX deck provided in chat.
- [x] AI tool-use disclosure drafted.
- [x] Original NASA 5-minute source data and JPL output hashes imported.
- [x] No fabricated NASA observations or false 'verified operating window' shown.
- [ ] Have both teammates open the public links in an incognito window and inspect on mobile.
- [ ] Confirm the exact registered team and challenge on the official NASA Space Apps project page.
- [ ] Paste the text into your team's **Project** tab, supply the public demo/final links, agree to terms and actually press **Submit** by 2026-11-15 23:59 local time.
- [ ] Confirm the website displays **Submitted**, then preserve that confirmation. A GitHub commit does not submit the project.

## Eligibility integrity note

The 2026 NASA Space Apps organizers have stated that working on the project before the November 14 start may put eligibility at risk; early review of challenge resources is allowed. Repository history should **not** be rewritten or misrepresented. If the organizers ask about development chronology, provide the true dates and ask them to interpret the rule for your team. Do not claim a project submission or final judging approval that has not occurred.

**Official confirmation:** https://www.spaceappschallenge.org/2026/
**Organizers' guidance:** https://github.com/nasa/spaceapps/discussions/1858 and https://github.com/nasa/spaceapps/discussions/1973
