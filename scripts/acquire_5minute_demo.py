#!/usr/bin/env python3
"""Download REAL JPL Horizons 5-minute Sun/Earth angles for the demo window.

UTC 2026-12-20 00:00 through 2026-12-25 00:00, inclusive; 1441 epochs per site.
No synthetic astronomy, no interpolation in time, no declared mission pass.
Independent full terrain/vertical frame/eclipses remain NOT validated.
"""
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen, Request
import csv
import hashlib
import io
import json
import math
import os
import tempfile

ROOT=Path(__file__).resolve().parents[1]
API="https://ssd.jpl.nasa.gov/api/horizons.api"
START=datetime(2026,12,20,tzinfo=timezone.utc)
STOP=datetime(2026,12,25,tzinfo=timezone.utc)
STEP=timedelta(minutes=5)
N=int((STOP-START)/STEP)+1
COLUMNS=["utc","sun_azimuth_deg","sun_elevation_deg","earth_azimuth_deg","earth_elevation_deg","sun_distance_au","sun_far_skyline_deg","sun_clearance_deg","earth_far_skyline_deg","earth_clearance_deg","source_status"]
STATUS="NASA_5MIN__PROVISIONAL_5M_PLUS_80M_LOLA__NOT_A_VERIFIED_WINDOW"

def atomic(path,text):
    fd,tmp=tempfile.mkstemp(prefix="jpl-",suffix=".tmp",dir=path.parent)
    os.close(fd)
    try:Path(tmp).write_text(text,encoding="utf-8");os.replace(tmp,path)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)

def fetch(site,latitude,longitude,altitude,body):
    params={"format":"text","COMMAND":f"'{body}'","CENTER":"'coord@301'",
        "COORD_TYPE":"'GEODETIC'","SITE_COORD":f"'{longitude},{latitude},{altitude:.12f}'",
        "MAKE_EPHEM":"'YES'","EPHEM_TYPE":"'OBSERVER'",
        "START_TIME":"'2026-12-20'","STOP_TIME":"'2026-12-25'",
        "STEP_SIZE":"'5m'","QUANTITIES":"'4,20'" if body==10 else "'4'",
        "CSV_FORMAT":"'YES'","OBJ_DATA":"'NO'","TIME_TYPE":"'UT'",
        "APPARENT":"'AIRLESS'","RANGE_UNITS":"'AU'","SUPPRESS_RANGE_RATE":"'YES'"}
    url=API+"?"+urlencode(params)
    with urlopen(Request(url,headers={"User-Agent":"LunarWindow-SpaceApps-2026"}),timeout=150) as r:raw=r.read().decode("utf-8")
    if "$$SOE" not in raw or "$$EOE" not in raw or "Center pole/equ : MEAN_ME" not in raw or "NO (AIRLESS)" not in raw:
        raise ValueError("Unexpected JPL lunar observer or airless output")
    rows=[]
    for line in csv.reader(io.StringIO(raw.split("$$SOE",1)[1].split("$$EOE",1)[0].strip())):
        t=datetime.strptime(line[0].strip(),"%Y-%b-%d %H:%M").replace(tzinfo=timezone.utc)
        az,el=float(line[3]),float(line[4])
        if not (math.isfinite(az) and math.isfinite(el) and 0<=az<360 and -90<=el<=90):raise ValueError("Invalid JPL angles")
        dist=float(line[5]) if body==10 else None
        if body==10 and not(.9<dist<1.1):raise ValueError("Invalid original Sun AU range")
        rows.append((t,az,el,dist))
    if len(rows)!=N or rows[0][0]!=START or rows[-1][0]!=STOP:
        raise ValueError("Unexpected JPL row/time range")
    if any((b[0]-a[0])!=STEP for a,b in zip(rows,rows[1:])):raise ValueError("Missing/repeated JPL 5-minute timestamps")
    return rows,raw,{"url":url,"sha256":hashlib.sha256(raw.encode()).hexdigest(),"epoch_count":len(rows),"params":params}

def horizon(bins,az):
    j=int(math.floor(az))
    if not 0<=az<360:raise ValueError("Bad azimuth")
    r=az-j;return bins[j]*(1-r)+bins[(j+1)%360]*r

def acquire(site):
    folder=ROOT/"data"/(site.lower()+"_audit")
    site_meta=json.loads((folder/"metadata.json").read_text())
    far_meta=json.loads((folder/"far_lola_meta.json").read_text())
    if far_meta["site"]!=site or not far_meta["mission_status"].startswith("INSUFFICIENT_DATA"):
        raise ValueError("No NASA far terrain evidence or unreviewed model status")
    lat=float(site_meta["latitude_deg"])
    lon=float(site_meta["east_longitude_deg"])
    alt=float(site_meta["provisional_horizons_altitude_km"])
    # Compact 80m+5m original NASA terrain maxima, bearing bins 0..359.
    with (folder/"far_lola_horizon.csv").open(newline="") as f:
        terrain=list(csv.DictReader(f))
    if len(terrain)!=360 or any(int(x["azimuth_deg"])!=i for i,x in enumerate(terrain)):
        raise ValueError("Bad NASA LOLA bearing coverage")
    bins=[float(x["combined_sampled_max_deg"]) for x in terrain]
    sun,sun_raw,sun_info=fetch(site,lat,lon,alt,10)
    earth,earth_raw,earth_info=fetch(site,lat,lon,alt,399)
    out=io.StringIO()
    writer=csv.writer(out,lineterminator="\n");writer.writerow(COLUMNS)
    for a,b in zip(sun,earth):
        if a[0]!=b[0]:raise ValueError("NASA Sun/Earth time mismatch")
        sh,eh=horizon(bins,a[1]),horizon(bins,b[1])
        writer.writerow([a[0].isoformat().replace("+00:00","Z"),a[1],a[2],b[1],b[2],a[3],
                         f"{sh:.9f}",f"{a[2]-sh:.9f}",f"{eh:.9f}",f"{b[2]-eh:.9f}",STATUS])
    atomic(folder/"fine_5m_sun_raw.txt",sun_raw)
    atomic(folder/"fine_5m_earth_raw.txt",earth_raw)
    atomic(folder/"fine_5m_dec2026.csv",out.getvalue())
    meta={"site_id":site,"actual_epochs":N,"cadence_seconds":300,"start_utc":START.isoformat(),
          "end_utc":STOP.isoformat(),"nasa_sun":sun_info,"nasa_earth":earth_info,
          "far_lola_original_sha256":far_meta["cog_sha256"],
          "far_lola_bearing_table_sha256":hashlib.sha256((folder/"far_lola_horizon.csv").read_bytes()).hexdigest(),
          "site_altitude_provisional_km":alt,
          "model_status":STATUS,"physical_time_margin":"UNKNOWN",
          "note":"5min original JPL samples; not certified continuous sunlight, Earth RF link, terrain/eclipse/far-field error"}
    atomic(folder/"fine_5m_meta.json",json.dumps(meta,indent=2))
    print(site,N,"REAL JPL 5-minute samples, no fabricated points, NO mission certification")

if __name__=="__main__":
    for name in ("Site01","Site04"):acquire(name)
