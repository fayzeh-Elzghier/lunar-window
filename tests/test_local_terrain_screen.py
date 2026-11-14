"""End-to-end scientific-release guards using ONLY actual NASA-derived files.

Zero made-up ephemerides or terrain fixtures. Recalculate and compare the
committed provisional screening values byte-for-byte, and ensure no pass claim.
"""
import csv
import importlib.util
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location("compare_local_skyline",ROOT/"scripts/compare_local_skyline.py")
module=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)

class ActualNASATerrainScreenTests(unittest.TestCase):
    def test_two_sites_sources_reproduce_output_exactly(self):
        for site in ("Site01","Site04"):
            expected=module.compute(site)
            self.assertEqual(len(expected),169)
            with (ROOT/"data"/(site.lower()+"_audit")/"terrain_screen_hourly.csv").open(newline="") as f:
                reader=csv.reader(f)
                self.assertEqual(next(reader),module.OUT_COLS)
                actual=list(reader)
            self.assertEqual(actual,expected)
            for r in actual:
                self.assertEqual(r[13],"INSUFFICIENT_DATA")
                self.assertEqual(r[12],"LOCAL_TILE_ONLY__DISTANT_TERRAIN_UNKNOWN")

    def test_only_actual_nasa_timesteps_are_present(self):
        for site in ("Site01","Site04"):
            with (ROOT/"data"/(site.lower()+"_audit")/"sample.csv").open(newline="") as f:
                original=list(csv.DictReader(f))
            compared=module.compute(site)
            self.assertEqual([r["utc"] for r in original],[r[0] for r in compared])
            self.assertEqual([float(r["sun_elevation_deg"]) for r in original],
                             [float(r[3]) for r in compared])
            self.assertEqual([float(r["earth_elevation_deg"]) for r in original],
                             [float(r[8]) for r in compared])

    def test_no_scientific_pass_in_hourly_screens(self):
        for site in ("Site01","Site04"):
            for r in module.compute(site):
                self.assertIn(r[6],{
                    "EDGE_REVIEW__NO_VISIBILITY_CLAIM",
                    "POSSIBLE_OBSTRUCTION_BY_LOCAL_LOLA__UNVERIFIED",
                    "ABOVE_SAMPLED_LOCAL_SKYLINE__FAR_UNKNOWN"})
                self.assertIn(r[11],{
                    "EDGE_REVIEW__NO_VISIBILITY_CLAIM",
                    "POSSIBLE_OBSTRUCTION_BY_LOCAL_LOLA__UNVERIFIED",
                    "ABOVE_SAMPLED_LOCAL_SKYLINE__FAR_UNKNOWN"})
                self.assertNotIn("requirements_met",r)

    def test_actual_site01_edge_sensitivity_is_visible(self):
        site01=module.compute("Site01")
        # This is a property of original source tables for Dec 1–8, not an
        # invented example. Treat near-edge values as uncertain, never as pass.
        self.assertTrue(any(r[6]=="EDGE_REVIEW__NO_VISIBILITY_CLAIM" for r in site01))
        self.assertTrue(all(r[13]=="INSUFFICIENT_DATA" for r in site01))

if __name__=="__main__":
    unittest.main()
