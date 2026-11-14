"""Evidence and input guard checks. No synthetic NASA geometry is generated.

These are software checks, NOT scientific mission-window acceptance tests.
Run: python -m unittest discover -s tests -v
"""
import csv
import pathlib
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"src"))
from mission_rescue import request, evaluate, rescue, scenario_matrix
from solar_geometry import unshadowed_reference_1au_w, panel_incidence_factor
from scripts.rebuild_site04_dashboard import source_rows

def constraints():
    # Operator-selected demo requirements, NOT NASA spacecraft observations.
    return dict(site_id="Site04",requested_start_utc="2026-12-01T00:00:00Z",
        duration_s=21600,required_power_w=100,
        require_continuous_earth_visibility=True,max_start_delay_s=86400,
        priority="earliest_start",panel=dict(area_m2=1,efficiency=.25,
        tilt_deg=30,azimuth_deg=90,height_above_surface_m=2),
        earth_observer_height_m=2)

class RealDataAndSafetyTests(unittest.TestCase):
    def test_real_nasa_source_has_expected_hourly_provenance(self):
        rows=source_rows(ROOT/"data/site04_audit/sample.csv")
        self.assertEqual(len(rows),169)
        self.assertEqual(rows[0]["t"],"2026-12-01T00:00:00Z")
        self.assertEqual(rows[-1]["t"],"2026-12-08T00:00:00Z")
        self.assertAlmostEqual(rows[0]["se"],1.462253)
        self.assertAlmostEqual(rows[0]["ee"],-1.843399)

    def test_unvalidated_actual_audit_cannot_claim_success(self):
        req=request(constraints())
        data=dict(site_id="Site04",data_kind="nasa_derived",
                  model_mode="geometric_baseline",validation_status="unverified",
                  provenance_urls=["https://ssd.jpl.nasa.gov/horizons/app.html"],
                  intervals=[])
        result=evaluate(req,data)
        self.assertEqual(result["status"],"insufficient_data")
        self.assertIn("TERRAIN_UNVERIFIED",result["reasons"])
        self.assertIn("CONTINUOUS_INTERVALS_MISSING",result["reasons"])

    def test_no_evidence_no_rescue(self):
        out=rescue(request(constraints()),{})
        self.assertEqual(out["status"],"insufficient_data")
        self.assertEqual(out["alternatives"],[])

    def test_site_and_delay_cases_require_real_scientific_intervals(self):
        req=request(constraints())
        placeholder=dict(site_id="Site04",data_kind="nasa_derived",
                   model_mode="geometric_baseline",validation_status="unverified",
                   provenance_urls=["https://ssd.jpl.nasa.gov/horizons/app.html"],
                   intervals=[])
        matrix=scenario_matrix(req,{"Site04":placeholder},[0,1800])
        self.assertEqual(matrix["count"],2)
        self.assertTrue(all(x["assessment"]["status"]=="insufficient_data" for x in matrix["scenarios"]))

    def test_invalid_panel_efficiency_fails_closed(self):
        form=constraints();form["panel"]["efficiency"]=1.5
        with self.assertRaises(ValueError):request(form)

    def test_no_fake_sampling_at_site01(self):
        req=request(constraints())
        self.assertEqual(evaluate(req,{"site_id":"Site01"})["status"],"insufficient_data")

class NASAEvidenceIntegrityTests(unittest.TestCase):
    def test_original_site04_raw_responses_match_recorded_hashes(self):
        import json
        import hashlib
        directory=ROOT/"data/site04_audit"
        entries=json.loads((directory/"queries.json").read_text())
        for name in ("sun","earth"):
            record=entries[name]
            raw=(directory/(name+".txt")).read_bytes()
            self.assertEqual(hashlib.sha256(raw).hexdigest(),record["sha256"])
            self.assertIn("ssd.jpl.nasa.gov/api/horizons.api",record["url"])
            self.assertIn(b"$$SOE",raw)
            self.assertIn(b"$$EOE",raw)

    def test_panel_geometry_uses_actual_nasa_sun_angles(self):
        actual=source_rows(ROOT/"data/site04_audit/sample.csv")[0]
        watts=unshadowed_reference_1au_w(actual["sa"],actual["se"],1,.25,30,90)
        self.assertGreater(watts,0)
        self.assertLessEqual(watts,1361*.25)
        # These are a 1 AU reference and actual Horizons angles, NOT lunar power.
        away=unshadowed_reference_1au_w(actual["sa"],actual["se"],1,.25,90,270)
        self.assertEqual(away,0)

    def test_invalid_1au_panel_reference_is_rejected(self):
        actual=source_rows(ROOT/"data/site04_audit/sample.csv")[0]
        with self.assertRaises(ValueError):
            unshadowed_reference_1au_w(actual["sa"],actual["se"],1,1.5,30,90)

if __name__=="__main__":unittest.main()
