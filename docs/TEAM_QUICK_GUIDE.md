# Lunar Window — 10-minute team briefing (Fayzeh + Ala)
# شرح المشروع لفايزة وآلاء قبل إنهاء التنفيذ

**Last reviewed: 2026-11-14.** This file describes the repository state, **not** a fully validated lunar mission model.

## A. What NASA asks for — المطلوب الأصلي

The [official challenge: Lunar Landing Site Navigator](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/) asks for an **intuitive comparison tool** to choose lunar sites and dates and visualize the Sun and Earth **relative to the horizon**, to understand solar power potential and direct-to-Earth communication opportunity. The detailed site selection, custom coordinates, 3D, animations and alternatives are suggestions (*may include*), not all mandatory obligations.

Our innovation is **Mission Rescue**: explain why a plan fails, evaluate changes in location/start time under user constraints, compare multiple cases and show a **verified time margin** rather than an arbitrary score.

## B. The science in four steps — من أين يبدأ الرقم؟

1. **Coordinates**: a NASA published reference location for Site04 Shackleton Rim (R04). Site01 Connecting Ridge (R01) is listed for eventual comparison. These feature centers are not safe landing certifications. [NASA Lunar Surface Data Book](https://ntrs.nasa.gov/api/citations/20230007818/downloads/ACD-50044%20Lunar%20Surface%20Data%20Book%20Rev%20A.pdf#page=58).
2. **Angles over time**: [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/app.html) answers: *At this location and UTC time, in which azimuth/elevation direction are the Sun and Earth?* The raw Site04 output is `data/site04_audit/sun.txt`, `earth.txt`, combined by timestamp in `sample.csv` (169 hourly times from Dec 1 to Dec 8, 2026). Real **NASA-computed future ephemerides**, not fabricated samples or actual lunar-mission measurements. [Queries and parameters](../data/site04_audit/queries.json).
3. **Terrain horizon**: [NASA LRO/LOLA](https://pgda.gsfc.nasa.gov/products/78) provides actual surface elevations. The audit obtained a Site04 raster and read the local elevation, but has **not** computed or verified the skyline in every direction. A 0° local-horizontal line is **NOT** the true terrain horizon.
4. **Mission assessment**: only after independent horizon/physics verification can we calculate Sun illumination, estimated electrical Watts from the user's *assumed* panel, geometric Earth opportunity, continuous windows, and valid rescue alternatives/time margins. **Not completed**.

### Real example — قراءة أصلية، بدون اختلاق

At **2026-12-01 00:00 UTC** for Site04, JPL Horizons reported:
- Sun azimuth **91.939769°**, elevation **+1.462253°** above the provisional local horizontal.
- Earth azimuth **178.539374°**, elevation **−1.843399°** relative to that same provisional local horizontal.

These numbers DO NOT yet prove that the Sun is unshadowed by actual terrain, that a panel generates a certain number of watts, or that a radio link exists.

## C. Official challenge Resources — الفرق بين مستخدم ومرجعي

| Challenge-linked resource | Actual role in our repository |
|---|---|
| [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/app.html) | **Used numerically**: Site04 Sun/Earth directions; raw text and request provenance committed |
| [LROC QuickMap](https://quickmap.lroc.asu.edu/) | **Reference only**: terrain imagery and map cross-check; no numerical data integration |
| [NASA Moon Trek](https://trek.nasa.gov/moon/) | **Reference only**: terrain exploration / visual comparison; no numerical data integration |
| [Canadian Space Agency lunar exploration](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/) | **Context reference**, not a numeric source |

**Additional NASA source recommended by the challenge's Technical Approach**, not one of the four linked Resource cards: [NASA LRO/LOLA 5 m/pixel product](https://pgda.gsfc.nasa.gov/products/78). Already used for a provisional Site04 surface measurement; the complete horizon is still unverified.

No rule requires downloading all four linked resources, and claiming a resource is "used" when only its webpage was read would hurt scientific validity. The key is **real NASA data materially supporting the analysis**.

## D. What the current website does — الموجود في الواجهة

Open [index.html](index.html):
- Shows two named NASA candidate site cards. **Both Site01 and Site04 now have genuine NASA Horizons angular datasets** (169 hourly times each); neither has scientifically validated continuous operation windows.
- A slider explores exactly 169 **actual Horizons timestamps**, and two elevation curves plot Sun and Earth. Connecting lines are a visualization, not extra NASA measurements.
- Displays actual Site04 azimuth and elevation numbers at the chosen timestamp.
- Accepts operation duration, power demand, assumed panel area/efficiency/orientation, Earth-visibility requirement, maximum start delay, priority and a delay preview. **These are user assumptions, not NASA measurements.**
- Shows the Mission Rescue multi-case concept but returns **INSUFFICIENT DATA** for actual mission suitability, alternatives and true margin until upstream science is complete.
- Explains resources and limitations so a judge is not misled.

The [mission_rescue.py](../src/mission_rescue.py) algorithm is an initial programmatic decision engine, **not yet connected to independently validated terrain-aware windows**. The 26 scenarios in [SCENARIO_MATRIX.md](SCENARIO_MATRIX.md) are **scientific acceptance requirements**, not completed NASA-driven passing tests.

## E. What makes it creative? — الفرق بيننا وبين مجرد خريطة

Conventional display: "Sun is at elevation X; Earth is at elevation Y."

Our intended verified decision flow:
1. User says: selected site, start, duration, Watts and whether continuous Earth visibility is necessary.
2. Scientific engine checks both physical conditions and their **continuous overlap**. If inadequate, it reports every confirmed cause with affected UTC intervals.
3. Rescue examines the same site at later starts and the other site within the **user's allowed delay**, without changing hardware settings behind the scenes.
4. Alternatives are sorted by **keep site**, **start earliest**, or **largest verified margin**, with source evidence and uncertainty.
5. A window end must be physically established before calculating `margin = window_end − duration − selected_start`. If data simply end, true margin is **unknown**.

This is a **planning aid within its model**, not proof a lander can land safely or radio to a named ground station.

## F. The shortest honest completion plan — الأولوية حسب الوقت

**Priority 1 — SCIENCE (Fayzeh):** finish / independently check terrain horizon and altitude/coordinate-frame conventions for Site04, including coverage of distant obstacles. Do **not** pretend a small local raster proves the entire skyline. Confirm eclipse handling and panel incidence assumptions. If validation is not possible, keep those outputs explicitly unavailable.

**Priority 2 — COMPARISON (Fayzeh):** Site01 Sun/Earth and local LOLA sources are now obtained. **Next:** validate far terrain, height/frame consistency and crossings before scientific illumination/visibility conclusions. Align both sites' coverage before claiming any winner.

**Priority 3 — RESCUE (Fayzeh + Ala):** connect verified continuous windows to `mission_rescue.py` and then to the website. Make 4 cases actually selectable: original, delayed same site, changed site, changed site + delay. Report simultaneous failures and verified time margin; never auto-relax constraints.

**Priority 4 — SUBMIT (both):** run scientific checks and software tests; choose an *actual* verified example, prepare a short demo: data → environmental geometry → failure reason → tested alternative → margin → limitations. Publish the accessible website and traceable GitHub source. No manufactured success story.

**Do not prioritize now:** decorative 3D globe, extra random sites, battery model, thermal model, post-operation downlink scheduler, autonomous spacecraft planning, fake positive examples.

## G. Two-minute explanation for the team

> فايزة بتأخذ موقعًا موثقًا من NASA، وبتستخدم JPL Horizons لحساب اتجاه الشمس والأرض حسب الوقت. بعدين بتحتاج نموذج LOLA لتحسب إذا الجبال بتحجبهم، ومنه تحسب القدرة الشمسية التقديرية وفترات رؤية الأرض. آلاء بتعرض كل هذا برسوم سهلة ومقارنة بين المواقع والتواريخ. ابتكارنا Mission Rescue بفحص الخطة، بفسر الفشل، وبدور على تغيير موقع أو وقت ضمن شروط المستخدم وبعرض هامش الوقت لما نقدر نثبته علميًا. الآن البيانات الفلكية الحقيقية لـSite04 موجودة؛ لكن التحقق من أفق التضاريس والمقارنة والتوصيات لم يكتمل.

## H. What NOT to say to judges

- NOT "We verified all 26 cases" (they are an acceptance matrix).
- NOT "This produces 100 W at Site04" (100 W is only a requested load).
- NOT "We guarantee Earth communication" (at best, geometric opportunity).
- NOT "All NASA resources have been integrated" (Horizons and provisional LOLA terrain screening only; QuickMap/Moon Trek remain reference links).
- NOT "6 hours always work" or "the best landing site is X" without real evidence.

The challenge also mentions public/educator usability and comparison of dates; retain plain language and a time slider. The [2025 local rubric](https://www.spaceappschallenge.org/) categories are broadly relevant, but no fixed 2026 weights were confirmed.
