#!/usr/bin/env python3
"""Join ACTUAL NASA/JPL Horizons UTC samples with NASA/LOLA local skyline samples.

This produces **diagnostic angular differences** only, NOT scientifically verified
illumination, visibility, electrical power, communication or mission windows.
An incomplete local terrain tile can support a *possible local obstruction* but
cannot prove unobstructed visibility; frame/vertical reference and distant terrain
are not independently validated. A 0.25-degree edge band is a REVIEW FLAG ONLY,
not a measured numerical uncertainty.

Run from repo root after authentic NASA files exist:
    python scripts/compare_local_skyline.py

No synthetic ephemerides/terrain, fabricated times or interpolation in time.
The angle interpolation is between adjacent TRUE sampled 1-degree terrain bins.
"""
from __future__ import annotations
import csv
import hashlib
import json
import math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
COLS=["utc","sun_azimuth_deg","sun_elevation_deg","earth_azimuth_deg","earth_elevation_deg"]
HORIZON_COLS=["azimuth_deg","local_max_elevation_deg","obstructing_distance_m",
              "tile_covered_range_m","far_terrain_status","scientific_validation"]
OUT_COLS=["utc","site_id","sun_azimuth_deg","sun_elevation_deg","sun_local_horizon_deg",
          "sun_clearance_deg","sun_local_screen","earth_azimuth_deg","earth_elevation_deg",
          "earth_local_horizon_deg","earth_clearance_deg","earth_local_screen",
          "terrain_scope","mission_assessment"]
REVIEW_BAND_DEG=0.25  # conservative display prompt; NOT verified uncertainty
TERRAIN_SCOPE="LOCAL_TILE_ONLY__DISTANT_TERRAIN_UNKNOWN"
MISSION_STATUS="INSUFFICIENT_DATA"

def source_file(directory,name):
    return directory/name

def read_sources(site):
    if site not in {"Site01","Site04"}:raise ValueError("Unsupported curated site")
    directory=ROOT/"data"/(site.lower()+"_audit")
    metadata=json.loads(source_file(directory,"local_horizon_meta.json").read_text())
    if metadata["site_id"]!=site or metadata["mission_feasibility"]!=MISSION_STATUS:
        raise ValueError("Provisional skyline metadata status mismatch")
    if metadata["visibility_status"]!="NOT VALIDATED" or not metadata["coverage"].startswith("finite local LOLA tile"):
        raise ValueError("Do not elevate local coverage into global visibility")
    acquisition=json.loads(source_file(directory,"metadata.json").read_text())
    if site=="Site01":
        demhash=acquisition["sha256"]
    else:
        demhash=acquisition["dem_sha256"]
    if demhash!=metadata["raster_sha256"]:
        raise ValueError("LOLA DEM provenance mismatch")
    queries=json.loads(source_file(directory,"queries.json").read_text())
    for body in ("sun","earth"):
        original=source_file(directory,body+".txt").read_bytes()
        if hashlib.sha256(original).hexdigest()!=queries[body]["sha256"]:
            raise ValueError("Original NASA Horizons source hash mismatch")
    with source_file(directory,"local_horizon.csv").open(newline="") as f:
        h=csv.DictReader(f)
        if h.fieldnames!=HORIZON_COLS:raise ValueError("Invalid skyline schema")
        terrain=list(h)
    if len(terrain)!=360:raise ValueError("Require 360 1-degree local terrain bins")
    for i,row in enumerate(terrain):
        if float(row["azimuth_deg"])!=i:raise ValueError("Missing/duplicate azimuth bin")
        angle=float(row["local_max_elevation_deg"])
        if not math.isfinite(angle) or not -90<=angle<=90:
            raise ValueError("Invalid terrain skyline angle")
        if row["far_terrain_status"]!="UNKNOWN_BEYOND_TILE" or row["scientific_validation"]!="PROVISIONAL_ONLY":
            raise ValueError("Missing provisional/distant-terrain warnings")
    with source_file(directory,"sample.csv").open(newline="") as f:
        e=csv.DictReader(f)
        if e.fieldnames!=COLS:raise ValueError("Invalid NASA ephemeris schema")
        samples=list(e)
    if len(samples)!=169 or samples[0]["utc"]!="2026-12-01T00:00:00Z" or samples[-1]["utc"]!="2026-12-08T00:00:00Z":
        raise ValueError("Unrecognized NASA Horizons time interval")
    from datetime import datetime,timezone,timedelta
    last=None
    for row in samples:
        epoch=datetime.fromisoformat(row["utc"].replace("Z","+00:00"))
        if not row["utc"].endswith("Z") or (last is not None and epoch-last!=timedelta(hours=1)):
            raise ValueError("NASA Horizons time sequence not 1h UTC")
        last=epoch
        for key in COLS[1:]:
            num=float(row[key])
            if not math.isfinite(num):raise ValueError("Invalid NASA field "+key)
            if "azimuth" in key and not 0<=num<360:raise ValueError("Invalid azimuth")
            if "elevation" in key and not -90<=num<=90:raise ValueError("Invalid elevation")
    return samples,[float(row["local_max_elevation_deg"]) for row in terrain]

def local_interp(azimuth_deg,h):
    """Periodic linear interpolation in AZIMUTH only; no invented time sample."""
    a=float(azimuth_deg)
    if not math.isfinite(a) or not 0<=a<360:raise ValueError("Invalid azimuth")
    lower=int(math.floor(a));ratio=a-lower
    return h[lower]*(1-ratio)+h[(lower+1)%360]*ratio

def label(delta):
    if abs(delta)<=REVIEW_BAND_DEG:
        return "EDGE_REVIEW__NO_VISIBILITY_CLAIM"
    if delta<0:return "POSSIBLE_OBSTRUCTION_BY_LOCAL_LOLA__UNVERIFIED"
    return "ABOVE_SAMPLED_LOCAL_SKYLINE__FAR_UNKNOWN"

def compute(site):
    samples,terrain=read_sources(site)
    result=[]
    for row in samples:
        ang=[]
        for body in ("sun","earth"):
            az=float(row[body+"_azimuth_deg"])
            el=float(row[body+"_elevation_deg"])
            h=local_interp(az,terrain)
            difference=el-h
            ang.extend([row[body+"_azimuth_deg"],row[body+"_elevation_deg"],
                       format(h,".9f"),format(difference,".9f"),label(difference)])
        result.append([row["utc"],site,*ang,TERRAIN_SCOPE,MISSION_STATUS])
    return result

def main():
    for site in ("Site01","Site04"):
        rows=compute(site)
        path=ROOT/"data"/(site.lower()+"_audit")/"terrain_screen_hourly.csv"
        with path.open("w",newline="") as out:
            writer=csv.writer(out,lineterminator="\n")
            writer.writerow(OUT_COLS);writer.writerows(rows)
        counts={}
        for row in rows:
            for body,index in (("Sun",6),("Earth",11)):
                key=body+" "+row[index]
                counts[key]=counts.get(key,0)+1
        print(site,":",len(rows),"NASA sample times / real LOLA 1-degree bins",counts)
        print("NO MISSION PASS. Time margin and full/continuous visibility are UNKNOWN.")
if __name__=="__main__":
    main()
