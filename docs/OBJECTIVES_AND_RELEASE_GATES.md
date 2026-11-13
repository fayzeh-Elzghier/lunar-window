# NASA 2026 objectives → Lunar Window delivery map

Based on the team's attached **2026 Lunar Landing Site Navigator** PDF, pages 3–5. The prompt says these features **may** be included; it does not require every suggested 3D/mobile/custom-coordinate extension. The team's **2025 local rubric** is context (Impact, Creativity, Validity, Relevance, Presentation), not evidence of exact 2026 weights.

| Challenge objective | Currently present | Essential truthfulness gate |
|---|---|---|
| Interactive curated lunar site selection and comparison | Site04 and Site01 site selector; NASA representative coordinates | Site01 site-specific ephemeris missing; cannot claim complete science comparison |
| Date/time selection and exploration | 169 true Site04 hourly Horizons epochs, Dec 1–8 2026 | User-requested arbitrary date must not be extrapolated |
| Sun/Earth position relative to horizon | NASA azimuth/elevation relative to local horizontal | LOLA local terrain horizon not verified yet; zero line is not terrain |
| Power / Earth-communication opportunity | Requested constraints displayed, evidence gating active | Physical panel incidence and terrain visibility not yet independently checked; don't claim link or watts |
| Multiple visualizations | Two elevation curves, geometry metrics, time slider, scenario cards | Curves join real samples visually; no claimed between-sample measurements |
| Temporal dynamics | UTC hourly time slider | No unsupported exact crossing times |
| Accessibility across skill levels | Plain-language failure and warning messages | Maintain scientific assumptions and terms in source drawer |
| Creative decision aid | Explainable multi-case Mission Rescue engine and time-margin definition | Only enable recommendations on fully verified continuous data |

## Release gates

1. **Traceability:** all numerical source data has exact originating NASA URL, request parameters, model/coordinates, time basis and retrieval record.
2. **Science:** independently validate LOLA vertical/terrain horizon and one epoch; provide comprehensive hazard and far-terrain limitations.
3. **Windows:** validate continuous intervals and threshold transitions; distinguish dataset cutoffs and physical endpoints.
4. **Power:** distance-adjusted solar irradiance convention, fixed panel normal/dot product, shadow and eclipse treatment documented.
5. **Comparisons:** both sites have comparable data and assumptions; unknown is never false, absent data never zero.
6. **Rescue:** alternatives only inside time and hardware limits; multiple causes; margin only for physically bounded windows.
7. **UI:** loading, no-coverage, stale-request, no-alternative, verified/pass/fail labels; source provenance and UTC.
8. **Submission:** a demo story using an actually computed and independently validated case, no invented winner or NASA endorsement.

Current scientific release: **BLOCKED**. Site04 real geometry is available; mission-feasibility claims are not.
