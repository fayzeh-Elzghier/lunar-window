> Updated judging story: after inspecting the first nominal candidate, compare the sensitivity-tested 17:45 UTC candidate. See [judges’ brief](JUDGES_BRIEF.md) and [numerical verification](NUMERICAL_VERIFICATION.md).

# Current demonstration — Sara’s operation

Sara is a fictional lunar surface operations planner. Her team wants to operate a hypothetical lander payload at Site 01 for six hours starting December 21, 2026 at 00: 00 UTC, drawing 100 W while maintaining geometric Earth visibility. A launch or commissioning delay forces her to reconsider the start time. The scenario and hardware assumptions are illustrative; the ephemerides and terrain inputs are NASA data.

## Live walkthrough

1. Open `mission-console.html` and load Sara’s example. State the assumptions: 1.5 m² panel, 25% efficiency, 60° tilt, east-facing azimuth 90°, maximum delay 72 h.
2. Explain the original power shortfall: the model estimates approximately 50.2 W at the first sample, below 100 W.
3. Inspect the horizon silhouette, power curve, Sun/Earth clearance and next sampled set brackets.
4. Explain the search: 1, 730 combinations, 153 preliminary candidates, 560 unresolved near-edge cases kept separate.
5. Inspect the earliest candidate: Site 01, December 21 at 12: 40 UTC, delay 12 h 40m, unchanged hardware and requirements. Minimum modeled direct power is approximately 100.3 W. Research candidate does not mean certified continuous operation.
6. Change power demand or delay and rerun. Show that old findings are invalidated.
7. Export JSON for source hashes/assumptions/results and CSV for the selected site's hourly model. Close with model limits and future validation.

The hourly sky explorer snaps to the nearest hourly sample; the report retains the exact five-minute candidate start. Avoid describing the plotted hourly marker as the exact candidate instant.

## بالعربي — القصة والتوزيع

سارة شخصية افتراضية بتخطط لتشغيل جهاز على مركبة قمرية. بدها ست ساعات تشغيل بقدرة100واط مع رؤية هندسية للأرض. قيم اللوح افتراضات للتجربة، أما مواقع الشمس والأرض والتضاريس فمن بيانات ناسا. البداية الأصلية فيها نقص بالطاقة حسب النموذج. النظام يبحث عن تغيير بالوقت أو الموقع ضمن التأخير المسموح، من غير ما يغيّر متطلبات المهمة سرًا.

فايزة: اشرحي المشكلة، مصدر البيانات، فرضيات القدرة، والفرق بين رؤية الأرض وضمان الاتصال. آلاء: اعرضي الواجهة والمقارنة، افحصي بديل12: 40، غيّري مطلبًا، ثم صدّري التقرير. القرار النهائي بحثي أولي؛ لا نقول إن الهبوط آمن أو الاتصال والطاقة مضمونان.

The earlier 30° panel/24 h 20m example remains a historical regression and is not the current default demo. Previously generated videos or downloaded decks must be regenerated before submission if they show those old settings.
