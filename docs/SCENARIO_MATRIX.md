# Mission Rescue scenario acceptance matrix

All cases are **NOT TESTED against validated NASA-derived continuous intervals** as of 2026-11-14. Do not report a passed science case based only on Python smoke tests, on hourly point samples, or on user-entered assumed hardware requirements.

| ID | Case | Correct behavior |
|---|---|---|
| A01 | Power and Earth available for whole requested interval | Requirements met, evidence trace |
| A02 | Sun above local horizontal but panel yields inadequate power | Power failure, not a false sun=watts pass |
| A03 | Power adequate, Earth horizon blocked | Earth failure when required |
| A04 | Both conditions fail simultaneously | Both causes with affected times |
| A05 | Each condition holds separately but overlap too short | Report lack of continuous overlap |
| A06 | 3h + gap + 3h for 6h operation | Reject disconnected periods |
| A07 | Earth requirement disabled | Power-only decision, Earth timeline still shown |
| A08 | Window exactly as long as operation | Pass only with scientifically established edges; zero delay margin |
| A09 | Window longer than operation | Correct physical time margin when both edges established |
| A10 | Proposed start after latest valid start | Fail and explain |
| A11 | Valid delayed start within allowed limit | Show change, delay and justification |
| A12 | Valid start only outside allowed delay | Exclude as valid rescue |
| A13 | Several alternatives | Explicit priority/sorting and trade-offs |
| A14 | None satisfy user constraints | No valid alternative, no automatic weakening |
| A15 | Missing period/terrain coverage | Insufficient data |
| A16 | Conditions hold to last available sample | Dataset end ≠ sunset/Earthset; true margin unknown |
| A17 | Panel normal faces away from Sun | Zero modelled direct irradiance power |
| A18 | Invalid values | Input error, no calculation |
| A19 | Inputs change during computation | Reject stale result by request identity |
| A20 | NASA endpoint unavailable | Valid cached provenance or unavailable state |
| A21 | One site has missing evidence | No false best-site choice |
| A22 | Sun/Earth very near terrain threshold | Finer verified crossing and reported uncertainty |
| A23 | Separate post-operation downlink requested | Explain unsupported in MVP |
| A24 | UI shows source/validation status | Clearly label real NASA vs incomplete |
| A25 | Hardware settings differ across sites | Prevent unfair comparison |
| A26 | Same input/source/model version | Deterministic reproducibility |

These are requirements to implement and verify, not invented lunar observations.
