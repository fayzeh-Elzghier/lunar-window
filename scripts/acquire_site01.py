#!/usr/bin/env python3
"""Acquire actual NASA LOLA and JPL Horizons data for Site01 (Connecting Ridge).

No invented coordinates, altitudes, angles, shadow masks, power, or mission results.
The 2 m observer/antenna offset is an explicitly chosen engineering assumption.
Altitude (DEM Z + 2m) is PROVISIONAL until vertical datum and frame are validated.
Run from repo root: pip install rasterio numpy && python scripts/acquire_site01.py
The 5m NASA GeoTIFF is large and intentionally excluded from version control.
"""
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path
import tempfile
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode
from urllib.request import Request, urlopen

try:
    import rasterio
    from rasterio.crs import CRS
    from rasterio.warp import transform
except ImportError as exc:
    raise SystemExit("Requires pip install rasterio numpy") from exc

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"site01_audit"
OUT.mkdir(parents=True,exist_ok=True)
LAT=-89.4632
LON_SIGNED=-137.49
LON_EAST=222.51
MOON_R_M=1737400.0
HEIGHT_M=2.0
SOURCE="https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/Site01/Site01_final_adj_5mpp_surf.tif"
API="https://ssd.jpl.nasa.gov/api/horizons.api"
START=datetime(2026,12,1,tzinfo=timezone.utc)
STOP=datetime(2026,12,8,tzinfo=timezone.utc)
COLUMNS=("utc","sun_azimuth_deg","sun_elevation_deg","earth_azimuth_deg","earth_elevation_deg")

def get_bytes(url,timeout=120):
    with urlopen(Request(url,headers={"User-Agent":"LunarWindow-Research/1.0"}),timeout=timeout) as response:
        return response.read()

def checksum(payload):
    return hashlib.sha256(payload).hexdigest()

def ensure_dem():
    path=OUT/"Site01_final_adj_5mpp_surf.tif"
    if not path.exists():
        payload=get_bytes(SOURCE,timeout=180)
        if len(payload)<1000000:raise ValueError("NASA LDEM download suspiciously small")
        fd,temp=tempfile.mkstemp(prefix="lola-",suffix=".tif",dir=OUT)
        os.close(fd)
        try:
            Path(temp).write_bytes(payload)
            with rasterio.open(temp) as ds:
                if ds.count<1 or ds.width<100 or ds.height<100:raise ValueError("NASA LDEM invalid geometry")
            os.replace(temp,path)
        finally:
            if os.path.exists(temp):os.unlink(temp)
    with rasterio.open(path) as ds:
        if not ds.crs or not ds.transform:raise ValueError("LDEM georeferencing missing")
        if abs(ds.res[0]-5)>0.001 or abs(ds.res[1]-5)>0.001:
            raise ValueError("Not a 5m NASA LDEM")
        x,y=transform(CRS.from_proj4("+proj=longlat +R=1737400 +no_defs"),ds.crs,[LON_SIGNED],[LAT])
        row,col=ds.index(x[0],y[0])
        if not (0<=row<ds.height and 0<=col<ds.width):raise ValueError("NASA point outside DEM")
        z=float(next(ds.sample([(x[0],y[0])]))[0])
        if not math.isfinite(z) or (ds.nodata is not None and z==ds.nodata):
            raise ValueError("NASA point is nodata")
        meta={"source_url":SOURCE,"sha256":checksum(path.read_bytes()),"latitude_deg":LAT,
          "east_longitude_deg":LON_EAST,"signed_longitude_deg":LON_SIGNED,
          "site_id":"Site01","moon_reference_radius_m":MOON_R_M,
          "shape_px":[ds.height,ds.width],"resolution_m":list(ds.res),
          "bounds_m":list(ds.bounds),"crs_wkt":ds.crs.to_wkt(),
          "projected_xy_m":[x[0],y[0]],"pixel_row_col":[row,col],
          "containing_pixel_surface_z_m":z,"device_height_above_surface_m":HEIGHT_M,
          "provisional_horizons_altitude_km":(z+HEIGHT_M)/1000,
          "vertical_datum_status":"provisional; DEM Z definition and DE421/DE441 alignment need independent verification",
          "terrain_horizon_status":"not computed",
          "site_comparison_status":"unverified"}
    return meta

def fetch_body(body,label,altitude_km):
    params=dict(format="text",COMMAND=f"'{body}'",CENTER="'coord@301'",
        COORD_TYPE="'GEODETIC'",
        SITE_COORD=f"'{LON_EAST},{LAT},{altitude_km:.12f}'",
        MAKE_EPHEM="'YES'",EPHEM_TYPE="'OBSERVER'",
        START_TIME="'2026-12-01'",STOP_TIME="'2026-12-08'",
        STEP_SIZE="'1h'",TIME_TYPE="'UT'",
        QUANTITIES="'4'",CSV_FORMAT="'YES'",OBJ_DATA="'NO'")
    url=API+"?"+urlencode(params)
    raw=get_bytes(url,timeout=120).decode("utf-8")
    if "$$SOE" not in raw or "$$EOE" not in raw:
        raise ValueError("JPL Horizons returned no usable ephemeris for "+label+":"+raw[:300])
    if "Moon (301)" not in raw or "NO (AIRLESS)" not in raw:
        raise ValueError("Horizons lunar observer/airless mode not confirmed")
    parsed=[]
    body_text=raw.split("$$SOE",1)[1].split("$$EOE",1)[0].strip()
    for values in csv.reader(io.StringIO(body_text)):
        epoch=datetime.strptime(values[0].strip(),"%Y-%b-%d %H:%M").replace(tzinfo=timezone.utc)
        az=float(values[3]);el=float(values[4])
        if not (math.isfinite(az) and math.isfinite(el) and 0<=az<360 and -90<=el<=90):
            raise ValueError("Invalid NASA angle at "+str(epoch))
        parsed.append([epoch,az,el])
    if len(parsed)!=169 or parsed[0][0]!=START or parsed[-1][0]!=STOP:
        raise ValueError("Unexpected Horizons time coverage for "+label)
    if any((b[0]-a[0])!=timedelta(hours=1) for a,b in zip(parsed,parsed[1:])):
        raise ValueError("Gaps/duplicates in NASA time series for "+label)
    q={"url":url,"parameters":params,"retrieved_utc":datetime.now(timezone.utc).isoformat(),
       "sha256":checksum(raw.encode()),"rows":len(parsed),
       "observer_vertical_reference":"provisional; not certified terrain-aware"}
    return parsed,raw,q

def write_atomic(path,text):
    fd,temp=tempfile.mkstemp(dir=path.parent,prefix="nasa-",suffix=".tmp")
    os.close(fd)
    try:
        Path(temp).write_text(text,encoding="utf-8")
        os.replace(temp,path)
    finally:
        if os.path.exists(temp):os.unlink(temp)

def main():
    meta=ensure_dem()
    sun,sun_raw,sun_query=fetch_body("10","Sun",meta["provisional_horizons_altitude_km"])
    earth,earth_raw,earth_query=fetch_body("399","Earth",meta["provisional_horizons_altitude_km"])
    if any(a[0]!=b[0] for a,b in zip(sun,earth)):raise ValueError("NASA body timestamps do not align")
    table=io.StringIO()
    writer=csv.writer(table,lineterminator="\n")
    writer.writerow(COLUMNS)
    for a,b in zip(sun,earth):
        writer.writerow([a[0].isoformat().replace("+00:00","Z"),a[1],a[2],b[1],b[2]])
    meta["horizons"]={"start_utc":START.isoformat(),"stop_utc":STOP.isoformat(),
       "step_minutes":60,"aligned_epochs":169,"status":"ephemeris angles only",
       "scientific_mission_assessment":"INSUFFICIENT_DATA",
       "independent_validation":"pending"}
    # Only publish after BOTH NASA responses and the DEM pass structural checks.
    write_atomic(OUT/"sun.txt",sun_raw)
    write_atomic(OUT/"earth.txt",earth_raw)
    write_atomic(OUT/"sample.csv",table.getvalue())
    write_atomic(OUT/"metadata.json",json.dumps(meta,indent=2,allow_nan=False))
    write_atomic(OUT/"queries.json",json.dumps({"sun":sun_query,"earth":earth_query},indent=2))
    print("Site01 NASA source retrieval succeeded:",len(sun),"real Sun/Earth ephemeris epochs")
    print("NASA LOLA source:",SOURCE)
    print("MISSION RESCUE / TERRAIN POWER VALIDATION: NOT COMPLETE")

if __name__=="__main__":main()
