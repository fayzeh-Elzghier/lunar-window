# Timing definitions and sampled operating slack

Start delay measures a change relative to the original evaluated start. Remaining start-delay allowance measures permission to start later, not additional operating time. Both retain timestamp precision internally. Applying a candidate preserves the absolute latest permitted start.

Operation convention: [start, finish). A six-hour interval on five-minute records contains 72 included points; the finish record must exist but is excluded from operation minima. The final included point is not the requested finish. A failing finish record can bracket the nominal run end without changing this discrete convention. It does not prove continuity before that finish.

Sample-based operating slack uses strictly positive Sun clearance, Earth clearance when required, and nominal reference power at least equal to demand. It excludes terrain-edge candidate qualification and sensitivity qualification. It is therefore weaker than a candidate's full screening criteria. It is secondary evidence only.

For the first later failing record B and preceding passing record A, slack = max(0, A - requested finish), reported in minutes. A and B are observed source endpoints, not a proven unique physical crossing; intermediate crossings may be missed. If B is the finish record, the descriptive clipped slack is zero and the bracket remains explicit in exported sampledModelWindow. Physical margin is never derived from this clipping.

Missing/gapped records, a failing initial operation, unavailable boundaries or no later observed failure yield null/unknown, never an invented zero. Coverage ending is not a sunset. Continuous operating margin not established.

The historical 30-degree-panel 24 h 20 m example is archived in archive/workflow-before-scoped-comparison/TIME_MARGIN_METHOD.md. It is not the current default or a certified operating window. Source files and verification scripts are preserved.
