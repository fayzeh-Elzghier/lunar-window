#!/usr/bin/env python3
"""Embed provenance-checked NASA Site01 Horizons data into offline HTML.
Never makes up angles or interpolated timestamps. Does NOT enable mission passes.
"""
import csv
import datetime as dt
import hashlib
import json
import math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"data/site01_audit"
HTML=ROOT/"docs/index.html"
COLS=["utc","sun_azimuth_deg","sun_elevation_deg","earth_azimuth_deg","earth_elevation_deg"]

def rows_and_checks():
    meta=json.loads((SITE/"metadata.json").read_text())
    q=json.loads((SITE/"queries.json").read_text())
    if (meta.get("site_id")!="Site01" or meta.get("latitude_deg")!=-89.4632
      or meta.get("east_longitude_deg")!=222.51
      or meta.get("terrain_horizon_status")!="not computed"):
        raise ValueError("NASA Site01 metadata inconsistent or scientific status unexpectedly changed")
    for key in ("sun","earth"):
        raw=(SITE/(key+".txt")).read_bytes()
        if hashlib.sha256(raw).hexdigest()!=q[key]["sha256"]:
            raise ValueError("NASA raw source hash mismatch: "+key)
        if not q[key]["url"].startswith("https://ssd.jpl.nasa.gov/api/horizons.api?"):
            raise ValueError("Unrecognized Horizons source endpoint")
    with (SITE/"sample.csv").open(newline="") as f:
        reader=csv.DictReader(f)
        if reader.fieldnames!=COLS:raise ValueError("NASA source schema mismatch")
        data=[];last=None
        for record in reader:
            t=record["utc"]
            if not t.endswith("Z"):raise ValueError("NASA timestamp not UTC")
            epoch=dt.datetime.fromisoformat(t.replace("Z","+00:00"))
            if last and epoch-last!=dt.timedelta(hours=1):
                raise ValueError("Gaps or duplicates in NASA Horizons data")
            last=epoch
            v=[float(record[k]) for k in COLS[1:]]
            if not all(math.isfinite(x) for x in v):
                raise ValueError("NASA Horizons non-finite angle")
            if not(0<=v[0]<360 and -90<=v[1]<=90 and 0<=v[2]<360 and -90<=v[3]<=90):
                raise ValueError("NASA Horizons angle out of bounds")
            data.append(dict(t=t,sa=v[0],se=v[1],ea=v[2],ee=v[3]))
    if len(data)!=169 or data[0]["t"]!="2026-12-01T00:00:00Z" or data[-1]["t"]!="2026-12-08T00:00:00Z":
        raise ValueError("Unexpected NASA Site01 date coverage")
    return data

def main():
    rows=rows_and_checks()
    source=HTML.read_text(encoding="utf-8")
    import re
    inline=json.dumps(rows,separators=(",",":"),ensure_ascii=True,allow_nan=False).replace("<","\\u003c")
    pattern=r"const site01Rows=(?:null|\[.*?\]); // Patched only by validated NASA Site01 ingestion tool"
    replacement="const site01Rows="+inline+"; // Patched only by validated NASA Site01 ingestion tool"
    updated,count=re.subn(pattern,lambda _:replacement,source,count=1,flags=re.S)
    if count!=1:raise ValueError("Site01 HTML source slot not found")
    updated=updated.replace("NASA coordinate verified · angles not imported yet",
                            "169 original NASA Horizons hourly epochs · terrain validation pending")
    if updated.count('"t":"2026-12-')!=338:raise ValueError("Wrong embedded NASA epoch count")
    HTML.write_text(updated,encoding="utf-8")
    print("Embedded 169 REAL Site01 NASA ephemeris epochs. Terrain/time-window checks STILL pending.")

if __name__=="__main__":main()
