# Lunar Window — judges’ evidence brief

## The problem and the contribution

Sara, an illustrative lunar operations planner, needs a six-hour payload run at 100 W with geometric Earth visibility. Her planned start has a power shortfall. Changing time can help, but the earliest nominal solution may have too little reserve for even small changes in assumptions.

Lunar Window connects NASA geometry and terrain to an explicit decision: diagnose the original conflict, compare allowed site/start changes under fixed requirements, test sensitivity, and export the evidence. The creativity lies in this constrained, explainable decision workflow. We do not claim a new ephemeris algorithm or that no other planner has attempted robust optimization.

## What a judge can reproduce

1. Open the console and load Sara’s example.
2. Original start: December 21, 2026 at 00:00 UTC, minimum modeled power **50.156 W**.
3. Earliest nominal candidate: **12:40 UTC**, minimum **100.283 W**. Under illustrative 10% lower output and nine combinations of ±1°/0° tilt and azimuth offsets, its minimum becomes **82.531 W**.
4. First candidate meeting that profile: **17:45 UTC**, nominal minimum **120.094 W**, stress minimum **100.250 W**. The extra delay is **5 h 05 m** relative to the first candidate; all requested operation constraints stay fixed.
5. Widen the declared sensitivity profile to ±5°: **zero** candidates survive. We show this limitation rather than inventing a rescue.
6. Inspect the candidate and export its source-linked JSON. The remaining delay is reduced, preserving the original latest permitted start.

The sensitivity parameters are illustrative design questions, not NASA hardware measurements, formal confidence intervals, or a full reliability analysis.

## Relationship to established tools

| Resource | Documented role | Our use / contribution |
|---|---|---|
| [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html) | Ephemerides and observer geometry | Supplies original Sun/Earth azimuth, elevation and Sun distance |
| [NASA LOLA PGDA](https://pgda.gsfc.nasa.gov/products/78) | Lunar terrain products | Supplies sampled terrain and local height-error inputs |
| [NASA Moon Trek](https://trek.nasa.gov/moon/jpl/config/textAbout.html) | Lunar visualization, mission planning and analyses including elevation, lighting and slope | Complementary exploration tool; we do not claim it lacks planning or illumination features |
| Lunar Window | Narrow, two-site operating-plan demonstration | Fixed-constraint alternatives, explicit sensitivity trade-offs, uncertainty separation and traceable decision exports |

This is not an exhaustive competitor benchmark or evidence of unique market novelty. Our advantage is an inspectable workflow tailored to this challenge and beginner-friendly explanation of a specific decision.

## Rubric evidence

- **Impact:** clear operations/education use case; no measured time-saving or expert adoption claim. Human validation remains pending.
- **Creativity:** exposes a meaningful trade-off between earliest start and tolerance to declared perturbations; does not silently relax requirements.
- **Validity:** original NASA provenance, source parity, a separately implemented vector calculation and browser regression gates. See [numerical verification](NUMERICAL_VERIFICATION.md).
- **Relevance:** NASA data drive site, time, horizon, power and Earth-visibility calculations directly.
- **Presentation:** one decision summary, three compared cases, a reproducible narrative, and inspectable supporting evidence.

## What remains unproven

Independent scientific validation, full-horizon/coordinate uncertainty, continuous illumination, eclipses, real hardware losses/storage, RF ground-station contact and landing safety. The numerical check is by a separate implementation within this project, not an independent external reviewer.

## Fayzeh + Ala: 90-second local pitch

**Fayzeh, 0–30s:** “Sara needs six hours at 100 watts while keeping Earth visible. At her planned start, our model gives only 50 watts. NASA tells us where the Sun and Earth are; LOLA tells us what terrain blocks them.”

**Ala, 30–65s:** “The earliest candidate starts at 12:40, but it has almost no power reserve. When we test 10% lower output and1° mounting offsets, it fails. At17:45, the same requirements survive that declared test. If offsets reach5°, our search finds no suitable candidate.” Show the three cards, then inspect the later candidate.

**Fayzeh, 65–90s:** “Our contribution is explaining which change helps and how fragile the result is. Every decision retains its assumptions and NASA sources. We verified 8,646 power calculations with a separate implementation, but we do not claim mission certification or a working radio link.”

## بالعربي — الفكرة التي لازم توصل

أول وقت يعطي100واط مش بالضرورة الخيار الأقوى. البداية12:40 تمرّ بالنموذج الاسمي، لكن فرضية انخفاض الخرج10% وانحراف اللوح درجة واحدة بتخليها تفشل. تأخير إضافي لوقت17:45 يحقق نفس المتطلبات ضمن اختبار الحساسية المحدد. ولما نوسّع الانحراف لخمس درجات، ما بنلاقي بديل. إحنا بنشرح القرار وحدوده، مش بنوعد بنجاح مهمة حقيقية.

## Honest human-validation plan (not completed)

Ask one person unfamiliar with the project to load the example, identify why 12:40 is fragile, find the later candidate, and explain Earth visibility versus RF contact. Record completion time, errors, assistance needed and their explanation. Repeat with the previous interface only if a fair comparison is possible; counterbalance order. Report observed results and sample size, never invented success rates. Expert validation and user interviews have not been performed.
