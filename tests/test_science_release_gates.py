"""Science release guards: only real NASA source records, no fake space inputs."""
import csv
import hashlib
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]

class ReleaseGuardTests(unittest.TestCase):
    def test_site04_ephemerides_preserved_in_ui(self):
        html=(ROOT/"docs/legacy-explorer.html").read_text(encoding="utf-8")
        with (ROOT/"data/site04_audit/sample.csv").open(newline="") as f:
            source=list(csv.DictReader(f))
        self.assertEqual(len(source),169)
        self.assertIn('"t":"'+source[0]["utc"]+'"',html)
        self.assertIn('"t":"'+source[-1]["utc"]+'"',html)
        self.assertIn("INSUFFICIENT DATA",html)
        self.assertIn("NOT terrain-aware available power",html)
        self.assertIn("let rows=site04Rows;",html)

    def test_no_local_tile_horizon_certification(self):
        for name in ("site01","site04"):
            p=ROOT/"data"/(name+"_audit")/"local_horizon_meta.json"
            if p.exists():
                info=json.loads(p.read_text())
                self.assertEqual(info["mission_feasibility"],"INSUFFICIENT_DATA")
                self.assertEqual(info["visibility_status"],"NOT VALIDATED")
                self.assertIn("finite local LOLA tile",info["coverage"])

    def test_site01_if_available_is_authentic_source(self):
        folder=ROOT/"data/site01_audit"
        data=folder/"sample.csv"
        if not data.exists():
            self.skipTest("NASA Site01 acquisition has not yet produced verified source files")
        meta=json.loads((folder/"metadata.json").read_text())
        queries=json.loads((folder/"queries.json").read_text())
        self.assertEqual(meta["site_id"],"Site01")
        self.assertEqual(meta["horizons"]["aligned_epochs"],169)
        for body in ("sun","earth"):
            self.assertEqual(hashlib.sha256((folder/(body+".txt")).read_bytes()).hexdigest(),
                             queries[body]["sha256"])
        with data.open(newline="") as f:
            rows=list(csv.DictReader(f))
        self.assertEqual(len(rows),169)
        self.assertEqual(rows[0]["utc"],"2026-12-01T00:00:00Z")
        self.assertEqual(rows[-1]["utc"],"2026-12-08T00:00:00Z")

    def test_reference_power_csv_never_reports_mission_pass(self):
        with (ROOT/"data/site04_audit/panel_1au_reference.csv").open(newline="") as f:
            rows=list(csv.DictReader(f))
        self.assertEqual(len(rows),169)
        for row in rows:
            self.assertEqual(row["mission_assessment_status"],"INSUFFICIENT_DATA")
            self.assertEqual(row["terrain_shadow_status"],"UNKNOWN")
            self.assertEqual(row["site_id"],"Site04")

if __name__=="__main__":
    unittest.main()
