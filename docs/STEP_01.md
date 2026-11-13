# Step 01 — Mission Rescue implementation brief
# الخطوة الأولى — مرجع بدء التنفيذ

Status: specification only. No scientific implementation or validation is claimed by this document.
الحالة: مواصفات تنفيذ. جميع الحسابات والتحققات أدناه لم تُنجز بعد.

## 1. First milestone / أول هدف

Deliver one traceable site scenario from inputs to a visible result before adding automatic rescue recommendations.
أول هدف: حالة واحدة من مدخلات واضحة إلى نتيجة يمكن مراجعتها، ثم التوسع للمقارنة والبدائل.

Fayzeh owns science, data, calculations and integration. Ala owns interface, interaction, explanations and demo flow. Both review the integrated result.
فايزة: البيانات والحسابات والتحقق والدمج. آلاء: الواجهة والتفاعل وتفسير النتائج. المراجعة النهائية مشتركة.

### Fayzeh's first deliverable / أول تسليم لفايزة

Create docs/data-audit.md with:
- One exact coordinate in Shackleton Rim (LOLA Site04), its authoritative source, latitude, east-positive longitude, coordinate frame and vertical reference.
- Surface elevation from the selected terrain model; panel and observer height above local surface stored separately.
- Candidate interval: 2026-12-01T00:00:00Z to 2026-12-08T00:00:00Z. This is a future demonstration interval, not an observed mission. It need not produce a successful window.
- NASA Horizons Sun and Earth requests and raw outputs for that coordinate; record query, retrieval time, units, frame, time convention and sampling.
- LOLA file URL, metadata, coverage and planned horizon method. Identify distant-terrain coverage limitations.
- A small sample table of time, Sun azimuth/elevation and Earth azimuth/elevation.
- Verification notes: independently check at least one epoch and distinguish verified facts from unresolved assumptions.
Do not silently reuse the earlier zero-reference-altitude prototype as a terrain-validated observer.

التسليم الأول: نقطة موثقة، فترة زمنية، ملفات المصدر، جدول صغير، وسجل تحقق. لا نعتبر بيانات النموذج السابق ذات ارتفاع مرجعي صفري تحققًا للتضاريس.

### Ala's first deliverable / أول تسليم لآلاء

Create docs/ui-flow.md with a simple wireframe or written layout:
1. Inputs: site/date/time, duration, power requirement, panel geometry, continuous Earth-visibility toggle.
2. Site result: horizon view, synchronized time control, estimated power plot with requirement line, Earth-visibility timeline.
3. Decision: requirements met / not met / insufficient data; all relevant reasons.
4. Alternatives area: reserved until the engine is validated.
5. Sources and assumptions drawer.

Start with explicitly labeled SYNTHETIC fixtures. Never present fixture numbers as NASA results.
Include loading, invalid input, missing data, calculation failure and stale-result states.

التسليم الأول لآلاء: ترتيب شاشة المدخلات والرسوم والنتيجة وحالات الخطأ. أي أرقام مؤقتة تحمل عبارة «بيانات تجريبية اصطناعية».

### First review gate / شرط اجتياز المرحلة

- One exact coordinate and reference conventions documented.
- One reproducible NASA request and sample output.
- UI input fields match the agreed data contract below.
- Unknown terrain/altitude issues remain visible and prevent terrain-validated claims.
- No invented successful rescue result.

## 2. Frozen MVP / النطاق المعتمد

Two curated points, one in Shackleton Rim (Site04), one in Connecting Ridge (Site01). Exact coordinates must be verified before calculations. Do not equate a regional name with a point.

Compare sites/dates, Sun and Earth relative to the horizon, estimated solar power, Earth visibility, contiguous operating windows, failure reasons, alternative site/start time and delay margin.
Use cached data with clear validity limits. All timestamps UTC.

نقارن موقعين وموعدين، نحسب القدرة التقديرية ورؤية الأرض، ونفسّر النتيجة ونبحث عن بديل ضمن قيود المستخدم.

No batteries, thermal model, dust/degradation model, landing safety assessment, trajectory planning, RF link budget, named-ground-station contact guarantee, relay scheduling, multiple-experiment scheduler or arbitrary-coordinate support in the MVP.
Height optimization is deferred. Panel and observer heights may be fixed documented presets; do not expose unsupported heights as working controls.

## 3. Demonstration assumptions / افتراضات المثال

Fictional planner Sara requests:
- 6 continuous operating hours.
- Constant 100 W load.
- Panel area 1 m² and assumed efficiency 0.25.
- Fixed panel tilt and azimuth, explicitly selected and recorded; do not infer them from site latitude.
- Panel and Earth observer reference heights: 2 m above local surface.
- Continuous Earth visibility required by default; user may disable this constraint.
- Alternative starts from requested start through +24 hours, inclusive.
- Same hardware settings across candidate sites.
These are demonstration assumptions, not NASA mission specifications or measured hardware performance.
Load data beyond the latest allowed start by at least the requested duration. A seven-day display does not authorize a seven-day rescue search.

## 4. Scientific definitions / تعريف الحسابات

Azimuth: clockwise from local north. Elevation: above local horizontal. Panel tilt: normal tilted from local vertical, 0° means horizontal panel. Panel azimuth: direction toward which the normal tilts. Use an explicit supported tilt range of 0–90° for MVP.
Use airless lunar geometry and a consistently defined lunar coordinate frame.

Power:
P(t) = S(t) * area_m2 * efficiency * max(0, dot(panel_normal, sun_unit_vector)) * sun_visible(t).

S(t) must have a documented physical source and distance convention. Do not invent or hide its value.
Binary Sun-center visibility is an approximation, not partial-disc illumination. Document eclipse handling; unless implemented, restrict the demo to an interval verified not to require an eclipse correction.
Visibility does not include terrain-reflected light or panel self-shadowing.

Earth visibility: Earth-center direction above the calculated local terrain/spherical horizon at the observer. Not a confirmed ground station contact or a data-rate estimate.
Check separate horizons if panel and Earth observer heights differ.

Operating condition:
power_estimate >= requested_power AND (Earth_visible OR continuous_Earth_not_required).
A period must satisfy the condition continuously, not merely in summed disconnected samples.
Near crossings refine sampling and document interpolation/time precision; do not promise sub-minute accuracy from hourly data.

For a usable window [a,b], duration D and valid start s:
latest_start = b - D
window_delay_margin = latest_start - s
Also report allowed delay limited by the user's search bounds. Boundary-truncated windows have unknown final end/margin, not invented sunset times.

Terrain audit must cover reference frames, surface/observer heights, lunar curvature, interpolation, coverage and distant obstacles. Missing coverage must not be treated as zero-height terrain.

## 5. Data contract v0.1 / شكل البيانات المتفق عليه

This is a design contract, not an implemented API.

Request:
- request_id: string
- site_ids: string[]
- requested_start_utc: ISO timestamp ending Z
- duration_s: positive number
- required_power_w: positive number
- panel: area_m2 (>0), efficiency (0<eta<=1), tilt_deg (0..90), azimuth_deg (0..360 exclusive), height_above_surface_m
- earth_observer_height_m
- require_continuous_earth_visibility: boolean
- max_start_delay_s: nonnegative number
- priority: keep_site | earliest_start | largest_delay_margin

Result:
- request_id and complete input snapshot
- data_kind: synthetic | nasa_derived
- model_mode: geometric_baseline | terrain_aware
- validation_status: unverified | verified_for_documented_scope
- status: requirements_met | requirements_not_met | insufficient_data | invalid_input | calculation_error
- site metadata and provenance references
- samples[]: utc, sun_azimuth_deg, sun_elevation_deg, earth_azimuth_deg, earth_elevation_deg, sun_horizon_deg, earth_horizon_deg, sun_visible, earth_visible, estimated_power_w
- suitable_windows[]: start_utc, end_utc (nullable), start_truncated, end_truncated
- reasons[]: code, start_utc, end_utc, explanation
- alternatives[]: site_id, start_utc, finish_utc, changed_fields, minimum_estimated_power_w, delay_margin_s (nullable), explanation
- warnings[] and data coverage bounds

Unknown numerical values are null with a reason, never zero. No NaN/Infinity in JSON.
Reason codes include POWER_BELOW_REQUIREMENT, EARTH_OCCLUDED, NO_CONTIGUOUS_WINDOW, INSUFFICIENT_COVERAGE.
Return all applicable failures, including simultaneous power and Earth failures.
Only show a result when its request_id matches the current inputs.

## 6. Acceptance register / قائمة القبول

Every item below is NOT TESTED. Specification completion is not a test pass.

| ID | Case | Expected behavior |
|---|---|---|
| A01 | Power and Earth satisfy entire requested interval | Requirements met |
| A02 | Sun visible but power too low | Power failure with interval |
| A03 | Power adequate, Earth occulted | Earth failure when required |
| A04 | Both constraints fail | Both reasons shown |
| A05 | Conditions individually available but overlap too short | Explain insufficient continuous overlap |
| A06 | 3h + gap + 3h for 6h request | Reject as discontinuous |
| A07 | Earth constraint disabled | Evaluate power; still display Earth timeline |
| A08 | Exactly 6h usable for 6h task | Accept within stated precision, zero margin |
| A09 | 8h usable, 6h task starts at beginning | 2h window delay margin |
| A10 | Start delayed past latest feasible start | Recompute and fail correctly |
| A11 | Later valid start within +24h | Return start and change amount |
| A12 | Valid start outside +24h only | No valid alternative within constraints |
| A13 | Multiple alternatives | Explain sorting and ties; no opaque score |
| A14 | No alternative | Do not silently relax requirements |
| A15 | Missing interval/terrain coverage | Insufficient data; no fabricated pass |
| A16 | Dataset ends while visibility continues | End truncated; do not report dataset edge as sunset |
| A17 | Panel faces away from Sun | Zero modeled direct power |
| A18 | Negative duration, invalid area/efficiency/angles | Reject before calculation |
| A19 | Input changes mid-computation | Stale result cannot replace current result |
| A20 | NASA endpoint unavailable | Valid cached data or clear unavailable state |
| A21 | Unequal coverage between sites | No misleading winner |
| A22 | Horizon/threshold crossing | Refine, verify, expose time precision |
| A23 | User asks for post-operation downlink scheduling | Explicitly unsupported in MVP |
| A24 | Synthetic data in interface | Persistent synthetic label |
| A25 | Alternative hardware settings accidentally differ | Prevent comparison or disclose explicitly |
| A26 | Same request, cached inputs and model version | Reproducible output |

Synthetic unit fixtures and NASA-derived scientific checks are separate evidence categories.

## 7. Core sources / المصادر

- Challenge: https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/
- Horizons manual: https://ssd.jpl.nasa.gov/horizons/manual.html
- Horizons API: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- LOLA site products: https://pgda.gsfc.nasa.gov/products/78
- LOLA files: https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/
- NASA power overview: https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/

Read and record the relevant technical definitions during implementation. This brief does not assert the data have already been downloaded or validated.

## 8. Review standard / معيار المراجعة

Relevance: site/date comparison and Sun/Earth horizon view remain central.
Creativity: explain failure and compare allowed changes with timing margin.
Validity: traceable inputs, explicit assumptions, independently checked outputs.
Impact: observe whether a new user can identify a failed plan and choose a valid alternative.
Presentation: one real calculated case, no fabricated improvement claims.

The supplied 2025 local judging template does not establish fixed weights for this event.
No competition result or complete mission feasibility is guaranteed.
