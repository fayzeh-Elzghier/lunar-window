> Current workflow: empty initial inputs; optional **Load example**, then **Compare plans**; **Clear inputs** clears results. See [current review](CURRENT_REVIEW.md). Earlier defaults/reset descriptions below are historical.

# Current English-only demonstration

This is an illustrative operation: Site01, 21 December 2026, 00:00 UTC, six hours at 100 W, with geometric Earth visibility required and 72 hours maximum delay. Fixed panel assumptions: 1.5 m², 25% efficiency, 60° tilt, 90° azimuth. NASA provides ephemerides and terrain, not these hypothetical hardware settings.

1. Open the local planner and select **Load example**, then **Compare plans**.
2. Read the original conflict: minimum modeled power is 50.156 W, below the 100 W demand.
3. Compare the **earliest nominal candidate** at 12:40 UTC: 100.283 W nominal, but 82.531 W under the declared sensitivity test.
4. Compare the candidate meeting that test at 17:45 UTC: 120.094 W nominal and 100.250 W under the test. Its reserve is only 0.250 W. It requires 5 h 05 min more delay than the nominal candidate; 54 h 15 min remain.
5. Select **Inspect sensitivity candidate**. The form and original comparison stay unchanged. The power chart uses actual five-minute points from 17:45 through 23:40 within the requested interval ending 23:45 UTC. The dashed lower envelope is the lowest of nine orientations at each point, not one physical panel trajectory.
6. Open **Sun, Earth & horizon**. The sky markers and both sites use the exact same source timestamp. Move the time slider to another genuine record.
7. Open **Model & sources** for the single evidence disclosure and JSON/selected-case CSV/print exports. Only **Use as new plan** changes the operation and reduces remaining delay, preserving the original latest permitted start.
8. Edit demand. The old results and exports become unavailable until **Compare options** runs again.

The unchanged engine finds 153 nominal candidates, 92 meeting the ±1° profile and none meeting ±5°. Both profiles use 10% lower output and nine orientation combinations. Near-edge cases are retained for review rather than presented as candidates.

Do not claim continuous operation, a validated full lunar horizon, an RF link or safe landing. Raw-source/numerical checks are implementation verification, not independent physical validation. Human usability results remain pending.

The old bilingual interface and published recordings are historical. They are not screenshots or evidence of the current local redesign. [Current changes and test results](DEMO_REDESIGN.md) · [Scientific review](SCIENCE_REVIEW.md).
