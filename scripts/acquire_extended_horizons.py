#!/usr/bin/env python3
"""Acquire genuine extended NASA/JPL Horizons Sun/Earth data for both lunar sites.

Uses actual NASA observer geometry; no generated astronomy samples. Computes
a transparent distance-adjusted *UNSHADOWED REFERENCE* irradiance (not actual
panel electric power or terrain-verified visibility).
Requires existing authentic NASA site metadata and local LOLA horizon tables.

Run in networked environment: python scripts/acquire_extended_horizons.py
Output: data/site01_audit/extended_dec2026.csv and site04 analogue,
original Horizons text, source URLs, hashes and validation metadata.

Public JPL Horizons reference: https://ssd.jpl.nasa.gov/horizons/manual.html
Quantity 4 = apparent AZ/EL; quantity 20 = observer-target range delta.
"""
from __future__ import annotations
import csv
import datetime as dt
import hashlib
import io
import json
import math
import os
import tempfile
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parents[1]
API="https://ssd.jpl.nasa.gov/api/horizons.api"
START=dt.datetime(2026,12,1,tzinfo=dt.timezone.utc)
STOP=dt.datetime(2027,1,1,tzinfo=dt.timezone.utc)
COUNT=int((STOP-START).total_seconds()/3600)+1
FIELDS=["utc","sun_azimuth_deg","sun_elevation_deg","earth_azimuth_deg","earth_elevation_deg","sun_distance_au","sun_local_skyline_deg","sun_local_clearance_deg","earth_local_skyline_deg","earth_local_clearance_deg","source_validation"]
NO_CERT="PROVISIONAL_LOLA_HORIZON__NO_OPERATION_CERTIFICATION"

def atomic(path,text):
    fd,tmp=tempfile.mkstemp(dir=path.parent,prefix="nasa-",suffix=".tmp")
    os.close(fd)
    try:Path(tmp).write_text(text,encoding="utf-8");os.replace(tmp,path)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)

def fetch(site,site_lon,site_lat,site_alt,body,require_range):
    pars={"format":"text","COMMAND":f"'{body}'","CENTER":"'coord@301'",
      "COORD_TYPE":"'GEODETIC'","SITE_COORD":f"'{site_lon},{site_lat},{site_alt:.12f}'",
      "MAKE_EPHEM":"'YES'","EPHEM_TYPE":"'OBSERVER'",
      "START_TIME":"'2026-12-01'","STOP_TIME":"'2027-01-01'","STEP_SIZE":"'1h'",
      "QUANTITIES":"'4,20'" if require_range else "'4'",
      "CSV_FORMAT":"'YES'","OBJ_DATA":"'NO'","APPARENT":"'AIRLESS'",
      "RANGE_UNITS":"'AU'","SUPPRESS_RANGE_RATE":"'YES'","TIME_TYPE":"'UT'"}
    url=API+"?"+urlencode(pars)
    with urlopen(Request(url,headers={"User-Agent":"LunarWindow-Student-Research/1.0"}),timeout=150) as response:
        raw=response.read().decode("utf-8")
    if "$$SOE" not in raw or "$$EOE" not in raw or "Atmos refraction: NO (AIRLESS)" not in raw:
        raise ValueError("JPL observer target/airless output missing")
    if "MOON" not in raw.upper():raise ValueError("JPL not using lunar observer")
    before=raw.split("$$SOE",1)[0]
    if require_range and "delta" not in before:
        raise ValueError("No original Sun observer range quantity in JPL response")
    rows=[]
    bodytxt=raw.split("$$SOE",1)[1].split("$$EOE",1)[0].strip()
    for r in csv.reader(io.StringIO(bodytxt)):
        try:utc=dt.datetime.strptime(r[0].strip(),"%Y-%b-%d %H:%M").replace(tzinfo=dt.timezone.utc)
        except (ValueError,IndexError) as ex:raise ValueError("Bad JPL UTC table") from ex
        az,el=float(r[3]),float(r[4])
        if not (0<=az<360 and -90<=el<=90 and math.isfinite(az) and math.isfinite(el)):
            raise ValueError("Invalid JPL azimuth/elevation")
        row=[utc,az,el]
        if require_range:
            distance=float(r[5])
            if not .9<distance<1.1:raise ValueError("Invalid JPL solar observer range AU")
            row.append(distance)
        rows.append(row)
    if len(rows)!=COUNT or rows[0][0]!=START or rows[-1][0]!=STOP or any((b[0]-a[0])!=dt.timedelta(hours=1) for a,b in zip(rows,rows[1:])):
        raise ValueError("JPL returned unexpected UTC cadence or number of epochs for "+site)
    return rows,raw,{"url":url,"params":pars,"sha256":hashlib.sha256(raw.encode()).hexdigest(),"rows":len(rows),"science_status":NO_CERT}

def lerp(bins,az):
    j=int(math.floor(az));f=az-j
    return bins[j]*(1-f)+bins[(j+1)%360]*f

def run(site):
    folder=ROOT/"data"/(site.lower()+"_audit")
    meta=json.loads((folder/"metadata.json").read_text())
    terrainmeta=json.loads((folder/"local_horizon_meta.json").read_text())
    if meta["site_id"]!=site or terrainmeta["visibility_status"]!="NOT VALIDATED":
        raise ValueError("Site source metadata unsafe or absent")
    lat=meta["latitude_deg"];lon=meta["east_longitude_deg"]
    alt=meta["provisional_horizons_altitude_km"]
    with (folder/"local_horizon.csv").open(newline="") as inp:
        reader=csv.DictReader(inp);terrain=list(reader)
    if len(terrain)!=360 or any(int(row["azimuth_deg"])!=i for i,row in enumerate(terrain)):
        raise ValueError("LOLA skyline angular coverage incorrect")
    bins=[float(x["local_max_elevation_deg"]) for x in terrain]
    sun,sunraw,sunquery=fetch(site,lon,lat,alt,10,True)
    earth,earthraw,earthquery=fetch(site,lon,lat,alt,399,False)
    out=io.StringIO();writer=csv.writer(out,lineterminator="\n");writer.writerow(FIELDS)
    for a,b in zip(sun,earth):
        if a[0]!=b[0]:raise ValueError("NASA Sun/Earth UTC time mismatch")
        sunh=lerp(bins,a[1]);earthh=lerp(bins,b[1])
        writer.writerow([a[0].isoformat().replace("+00:00","Z"),a[1],a[2],b[1],b[2],a[3],
                f"{sunh:.9f}",f"{a[2]-sunh:.9f}",f"{earthh:.9f}",f"{b[2]-earthh:.9f}",NO_CERT])
    atomic(folder/"extended_sun_raw.txt",sunraw)
    atomic(folder/"extended_earth_raw.txt",earthraw)
    atomic(folder/"extended_dec2026.csv",out.getvalue())
    atometa={"site_id":site,"utc_start":START.isoformat(),"utc_end":STOP.isoformat(),
      "cadence_seconds":3600,"epochs":COUNT,
      "ephemeris_provenance":{"sun":sunquery,"earth":earthquery},
      "local_lola_horizon_sha256":hashlib.sha256((folder/"local_horizon.csv").read_bytes()).hexdigest(),
      "local_lola_raster_sha256":terrainmeta["raster_sha256"],
      "distance_adjusted_reference":"1361 W/m2 / sun_distance_au^2, unshadowed",
      "scientific_status":NO_CERT,"margin_status":"UNKNOWN",
      "uncertainty":"Sun distance actual JPL; local terrain far field/DE frame/eclipse/crossing not validated",
      "independent_validation":"PENDING"}
    atomic(folder/"extended_dec2026_meta.json",json.dumps(atometa,indent=2))
    print(site,COUNT,"true NASA future ephemeris epochs, with Sun target-observer AU range, NO mission passes")

def main():
    for site in ["Site01","Site04"]:run(site)
if __name__=="__main__":main()
