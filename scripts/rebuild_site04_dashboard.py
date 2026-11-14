"""Rebuild the dashboard's embedded dataset from ORIGINAL Site04 Horizons CSV.

No fake samples or interpolation. The output HTML retains real JPL source
timestamps exactly and must be reviewed before deploying via GitHub Pages.

Run from repository root:
    python scripts/rebuild_site04_dashboard.py
"""
import csv
import datetime as dt
import json
import math
import pathlib
import re

ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT/"data/site04_audit/sample.csv"
TARGET=ROOT/"docs/index.html"
FIELDS=["utc","sun_azimuth_deg","sun_elevation_deg","earth_azimuth_deg","earth_elevation_deg"]

def source_rows(path=SOURCE):
    with path.open(encoding="utf-8-sig",newline="") as stream:
        reader=csv.DictReader(stream)
        if reader.fieldnames!=FIELDS:raise ValueError("Unrecognized NASA CSV schema")
        output=[];previous=None
        for count,row in enumerate(reader,2):
            value=row["utc"]
            if not value.endswith("Z"):raise ValueError("UTC-Z timestamp required")
            epoch=dt.datetime.fromisoformat(value[:-1]+"+00:00")
            if previous is not None and epoch-previous!=dt.timedelta(hours=1):
                raise ValueError("NASA source has time gaps or duplicates at CSV line "+str(count))
            previous=epoch
            nums=[float(row[k]) for k in FIELDS[1:]]
            if not all(math.isfinite(x) for x in nums):raise ValueError("Nonfinite source value")
            if not (0<=nums[0]<360 and 0<=nums[2]<360 and -90<=nums[1]<=90 and -90<=nums[3]<=90):
                raise ValueError("Out-of-range ephemeris coordinate")
            output.append(dict(t=value,sa=nums[0],se=nums[1],ea=nums[2],ee=nums[3]))
    if not output:raise ValueError("NASA CSV empty")
    return output

def rebuild():
    rows=source_rows()
    if len(rows)!=169 or rows[0]["t"]!="2026-12-01T00:00:00Z" or rows[-1]["t"]!="2026-12-08T00:00:00Z":
        raise ValueError("Unexpected source provenance or coverage; audit before changing site/time labels")
    html=TARGET.read_text(encoding="utf-8")
    replacement="const site04Rows="+json.dumps(rows,separators=(",",":"),allow_nan=False).replace("<","\\u003c")+";\nconst site01Rows="
    html,count=re.subn(r"const site04Rows=.*?;\s*const site01Rows=",lambda _:replacement,html,count=1,flags=re.S)
    if count!=1:raise ValueError("Cannot find embedded NASA dataset; do not overwrite dashboard")
    TARGET.write_text(html,encoding="utf-8")
    print("Rebuilt dashboard with",len(rows),"unchanged source timestamps from",SOURCE)

if __name__=="__main__":rebuild()
