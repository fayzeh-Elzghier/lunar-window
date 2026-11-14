#!/usr/bin/env python3
"""Build 5-minute browser evidence exclusively from ORIGINAL NASA JPL outputs.

This dataset is a more finely sampled *research screen* and does NOT certify
continuous visibility, lunar electric power, Earth RF contacts, or Time Margin.
All source 5m epochs are preserved exactly and joined to audited near/far LOLA.
"""
from pathlib import Path
import csv, hashlib, json, datetime as dt, math
ROOT=Path(__file__).resolve().parents[1]
LABEL="NASA_5MIN__PROVISIONAL_5M_PLUS_80M_LOLA__NOT_A_VERIFIED_WINDOW"
COLS=["utc","sun_azimuth_deg","sun_elevation_deg","earth_azimuth_deg","earth_elevation_deg","sun_distance_au","sun_far_skyline_deg","sun_clearance_deg","earth_far_skyline_deg","earth_clearance_deg","source_status"]
NAME={"Site01":"Connecting Ridge","Site04":"Shackleton Rim"}

def main():
    bundle={"schema":"lunar-window-real-five-minute-v1","cadence_seconds":300,
      "science_status":"ORIGINAL_JPL_HORIZONS__PROVISIONAL_LOLA__NOT_CONTINUOUSLY_VALIDATED",
      "range_start_utc":"2026-12-20T00:00:00Z","range_end_utc":"2026-12-25T00:00:00Z",
      "not_certified":["full terrain visibility","solar eclipses or disc fractions",
                       "actual electrical power","ground station RF links","physical time margin"],
      "sites":{}}
    for site,name in NAME.items():
        folder=ROOT/"data"/(site.lower()+"_audit")
        md=json.loads((folder/"fine_5m_meta.json").read_text(encoding="utf-8"))
        if md["site_id"]!=site or md["actual_epochs"]!=1441 or md["model_status"]!=LABEL:
            raise ValueError("NASA source metadata invalid")
        for body in ("sun","earth"):
            raw=(folder/("fine_5m_"+body+"_raw.txt")).read_bytes()
            if hashlib.sha256(raw).hexdigest()!=md["nasa_"+body]["sha256"] or b"$$SOE" not in raw:
                raise ValueError("NASA raw Horizons provenance mismatch")
        with (folder/"fine_5m_dec2026.csv").open(newline="") as f:
            r=csv.DictReader(f)
            if r.fieldnames!=COLS:raise ValueError("Unexpected NASA 5m CSV")
            entries=list(r)
        if len(entries)!=1441:raise ValueError("JPL row count missing")
        rows=[];prev=None
        for x in entries:
            t=x["utc"]
            if not t.endswith("Z") or x["source_status"]!=LABEL:raise ValueError("Unverified JPL row")
            ms=dt.datetime.fromisoformat(t.replace("Z","+00:00"))
            if prev is not None and ms-prev!=dt.timedelta(minutes=5):raise ValueError("JPL 5m time gap")
            prev=ms
            nums=[float(x[k]) for k in COLS[1:-1]]
            if any(not math.isfinite(n) for n in nums) or not .9<nums[4]<1.1:
                raise ValueError("Invalid JPL source field")
            if abs((nums[1]-nums[5])-nums[6])>2e-8 or abs((nums[3]-nums[7])-nums[8])>2e-8:
                raise ValueError("Terrain clearance doesn't equal the original source elevation difference")
            rows.append([t,nums[0],nums[1],nums[2],nums[3],nums[5],nums[6],nums[7],nums[8],nums[4]])
        if rows[0][0]!=bundle["range_start_utc"] or rows[-1][0]!=bundle["range_end_utc"]:
            raise ValueError("Expected JPL dates absent")
        # Historical full-month sample consistency (same published NASA request geometry).
        with (folder/"extended_dec2026.csv").open(newline="") as f:hourly=list(csv.DictReader(f))
        lookup={r["utc"]:r for r in hourly}
        max_angular_discrepancy=0
        for row in rows[::12]:
            previous=lookup.get(row[0])
            if previous is None:raise ValueError("Original hourly NASA epoch absent")
            for val,k in [(row[1],"sun_azimuth_deg"),(row[2],"sun_elevation_deg"),
                         (row[3],"earth_azimuth_deg"),(row[4],"earth_elevation_deg")]:
                diff=abs(val-float(previous[k]))
                if k.endswith("azimuth_deg"):diff=min(diff,360-diff)
                max_angular_discrepancy=max(max_angular_discrepancy,diff)
        if max_angular_discrepancy>.02:
            raise ValueError("5m and hourly JPL output unexpectedly disagree; investigate before publishing")
        srcfar=json.loads((folder/"far_lola_meta.json").read_text())
        bundle["sites"][site]={"name":name,"rows":rows,
            "columns":["utc","sun_az_deg","sun_el_deg","earth_az_deg","earth_el_deg",
                "sun_local_far_skyline_deg","sun_clearance_deg",
                "earth_local_far_skyline_deg","earth_clearance_deg","sun_distance_au"],
            "meta":{"sun_sha256":md["nasa_sun"]["sha256"],"earth_sha256":md["nasa_earth"]["sha256"],
              "lola_raster_sha256":srcfar["cog_sha256"],"sun_source_url":md["nasa_sun"]["url"],
              "earth_source_url":md["nasa_earth"]["url"],
              "hourly_agreement_max_deg":max_angular_discrepancy,
              "certification":"NOT_CERTIFIED"}}
    folder=ROOT/"docs/data";folder.mkdir(exist_ok=True,parents=True)
    contents=json.dumps(bundle,separators=(",",":"),allow_nan=False)
    (folder/"mission_dataset_fine.json").write_text(contents,encoding="utf-8")
    (folder/"mission_dataset_fine.js").write_text(
      "/* Original NASA 5m Horizons. Terrain screening provisional. Not a mission-pass. */\nwindow.LUNAR_FINE_DATA="+contents+";\n",encoding="utf-8")
    print("PASS: 2882 actual 5-minute NASA site-epochs, matched against original hourly NASA ephemerides; no certified windows")

if __name__=="__main__":main()
