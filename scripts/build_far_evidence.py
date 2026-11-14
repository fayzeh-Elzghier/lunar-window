#!/usr/bin/env python3
"""Build reproducible browser data from ACTUAL JPL 745-epoch source tables,
NASA LOLA 5 m local and 80 m up-to-300 km far terrain, and real local RMS map.

The output is an audit/screening bundle ONLY: not full line-of-sight certainty,
not actual power and not continuous mission windows or true Time Margin.
Never synthesizes astronomical observations or interpolates between epochs.
"""
import csv
import datetime as dt
import hashlib
import json
import math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SITES={"Site01":(-89.4632,222.51,"Connecting Ridge"),
       "Site04":(-89.7668,188.13,"Shackleton Rim")}
SOURCE_COLS=["utc","sun_azimuth_deg","sun_elevation_deg","earth_azimuth_deg",
"earth_elevation_deg","sun_distance_au","sun_local_skyline_deg",
"sun_local_clearance_deg","earth_local_skyline_deg","earth_local_clearance_deg","source_validation"]
SCREEN_COLS=["utc","site_id","sun_azimuth_deg","sun_elevation_deg",
"earth_azimuth_deg","earth_elevation_deg","sun_distance_au",
"sun_combined_skyline_deg","sun_faraware_clearance_deg",
"earth_combined_skyline_deg","earth_faraware_clearance_deg","scientific_status"]
SCIENTIFIC="PROVISIONAL_LOLA_NEAR_PLUS_FAR_300KM__NOT_OPERATIONALLY_VALIDATED"
MODEL="lunar-window-evidence-v4"

def parse_csv(path,expected_cols):
    with path.open(newline="") as f:
        r=csv.DictReader(f)
        if r.fieldnames!=expected_cols:raise ValueError("Unexpected NASA source schema "+str(path))
        rows=list(r)
    return rows

def checked_sources(site):
    directory=ROOT/"data"/(site.lower()+"_audit")
    e=parse_csv(directory/"extended_dec2026.csv",SOURCE_COLS)
    if len(e)!=745:raise ValueError("Expected 745 original NASA UTC epochs")
    last=None
    for r in e:
        t=r["utc"]
        if not t.endswith("Z"):raise ValueError("UTC-Z required")
        now=dt.datetime.fromisoformat(t.replace("Z","+00:00"))
        if last is not None and now-last!=dt.timedelta(hours=1):raise ValueError("Astronomical time discontinuity")
        last=now
        if r["source_validation"]!="PROVISIONAL_LOLA_HORIZON__NO_OPERATION_CERTIFICATION":
            raise ValueError("Unexpected scientific source attestation")
    meta=json.loads((directory/"extended_dec2026_meta.json").read_text())
    far=json.loads((directory/"far_lola_meta.json").read_text())
    local=json.loads((directory/"local_horizon_meta.json").read_text())
    if meta["site_id"]!=site or far["site"]!=site or local["site_id"]!=site:
        raise ValueError("NASA site metadata mismatch")
    if not far["mission_status"].startswith("INSUFFICIENT_DATA") or not meta["scientific_status"].startswith("PROVISIONAL"):
        raise ValueError("Do not silently turn provisional sources into passed claims")
    for body in ("sun","earth"):
        actual=(directory/("extended_"+body+"_raw.txt")).read_bytes()
        if hashlib.sha256(actual).hexdigest()!=meta["ephemeris_provenance"][body]["sha256"]:
            raise ValueError("Original NASA Horizons text hash invalid")
    terrain=parse_csv(directory/"far_lola_horizon.csv",
        ["azimuth_deg","local_5m_max_deg","far_80m_max_deg",
         "far_obstacle_distance_m","combined_sampled_max_deg","far_coverage_m","status"])
    if len(terrain)!=360 or any(int(x["azimuth_deg"])!=i for i,x in enumerate(terrain)):
        raise ValueError("Missing exact NASA terrain azimuth")
    for r in terrain:
        if r["status"]!="FAR_FIELD_PARTIAL_NOT_CERTIFIED":raise ValueError("Far data improperly certified")
    bins=[float(r["combined_sampled_max_deg"]) for r in terrain]
    if any(not math.isfinite(x) or x<-90 or x>90 for x in bins):
        raise ValueError("Invalid NASA DEM angular skyline")
    return e,bins,meta,far,local

def interp(az,bins):
    a=float(az);i=int(math.floor(a))
    if not 0<=a<360:raise ValueError("Invalid NASA azimuth")
    q=a-i;return bins[i]*(1-q)+bins[(i+1)%360]*q

def main():
    package={"schema":MODEL,"generated_at":"2026-11-14","cadence_seconds":3600,
     "range_start_utc":"2026-12-01T00:00:00Z","range_end_utc":"2027-01-01T00:00:00Z",
     "science_status":SCIENTIFIC,
     "limitations":["5m local + 80m far field only, up to approx 300km",
       "full lunar horizon beyond coverage unknown",
       "NASA LOLA DE421 and Horizons lunar frame alignment still needs independent validation",
       "LOLA local height RMS is not a far-field error confidence bound",
       "hourly ephemerides cannot certify continuous operation",
       "finite sun disc, eclipse, solar panel losses and RF link are not certified",
       "true physical Time Margin unknown"],"sites":{}}
    for site,(lat,lon,name) in SITES.items():
        e,bins,meta,far,local=checked_sources(site)
        records=[];csvrows=[]
        for r in e:
            sa,se,ea,ee,AU=(float(r[k]) for k in ["sun_azimuth_deg","sun_elevation_deg","earth_azimuth_deg","earth_elevation_deg","sun_distance_au"])
            if not .9<AU<1.1:raise ValueError("NASA original observer Sun distance invalid")
            sh,eh=interp(sa,bins),interp(ea,bins)
            sd,ed=se-sh,ee-eh
            if not all(math.isfinite(x) for x in (sd,ed)):raise ValueError("Nonfinite true-source diagnostic")
            records.append([r["utc"],sa,se,ea,ee,sh,sd,eh,ed,AU])
            csvrows.append([r["utc"],site,sa,se,ea,ee,AU,f"{sh:.9f}",f"{sd:.9f}",f"{eh:.9f}",f"{ed:.9f}",SCIENTIFIC])
        directory=ROOT/"data"/(site.lower()+"_audit")
        with (directory/"far_screen_dec2026.csv").open("w",newline="") as f:
            wr=csv.writer(f,lineterminator="\n");wr.writerow(SCREEN_COLS);wr.writerows(csvrows)
        package["sites"][site]={"name":name,"lat":lat,"lon_east":lon,"rows":records,
        "columns":["utc","sun_az_deg","sun_el_deg","earth_az_deg","earth_el_deg",
                   "combined_sampled_skyline_sun_deg","sun_faraware_clearance_deg",
                   "combined_sampled_skyline_earth_deg","earth_faraware_clearance_deg","sun_distance_au"],
        "meta":{"sun_source_url":meta["ephemeris_provenance"]["sun"]["url"],
          "earth_source_url":meta["ephemeris_provenance"]["earth"]["url"],
          "sun_sha256":meta["ephemeris_provenance"]["sun"]["sha256"],
          "earth_sha256":meta["ephemeris_provenance"]["earth"]["sha256"],
          "terrain_source_url":far["source_url"],"terrain_sha256":far["cog_sha256"],
          "local_terrain_source_url":local["lola_source_url"],
          "local_terrain_sha256":local["raster_sha256"],
          "terrain_coverage":"original NASA LOLA local 5m 16km + broad 80m up to about 300km; farther areas unknown",
          "science_status":SCIENTIFIC}}
    target=ROOT/"docs/data"
    target.mkdir(parents=True,exist_ok=True)
    encoded=json.dumps(package,separators=(",",":"),allow_nan=False,ensure_ascii=True)
    (target/"mission_dataset_far.json").write_text(encoded,encoding="utf-8")
    (target/"mission_dataset_far.js").write_text("/* Source-verified NASA data. No mission passes. */\nwindow.LUNAR_DATA="+encoded+";\n",encoding="utf-8")
    print("Built",sum(len(v["rows"]) for v in package["sites"].values()),"NASA original UTC site-samples with provisional sampled 5m+80m far skyline, NO mission pass")

if __name__=="__main__":main()
