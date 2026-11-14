#!/usr/bin/env python3
"""Audit genuine NASA/LOLA total-Z RMS error at observer and local horizon points.

NASA product 78 provides *measured/source-derived RMS uncertainty raster*,
not synthetic terrain. This is a preliminary geometric RMS propagation, not
an independent confidence bound or proof of full Sun/Earth visibility.
No artificial ephemeris samples or made-up Z errors.

Run on networked machine: pip install rasterio numpy
    python scripts/audit_lola_uncertainty.py
"""
from __future__ import annotations
import csv
import hashlib
import json
import math
import os
import tempfile
from pathlib import Path
from urllib.request import Request,urlopen

import rasterio
from rasterio.crs import CRS
from rasterio.warp import transform

ROOT=Path(__file__).resolve().parents[1]
SITES={"Site01":(-89.4632,-137.49),"Site04":(-89.7668,-171.87)}
R=1737400.0
SOURCE="https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/{site}/{site}_final_adj_5mpp_toterr.tif"

def download(site):
    folder=ROOT/"data"/(site.lower()+"_audit")
    folder.mkdir(parents=True,exist_ok=True)
    uri=SOURCE.format(site=site)
    outfile=folder/(site+"_final_adj_5mpp_toterr.tif")
    if not outfile.exists():
        request=Request(uri,headers={"User-Agent":"LunarWindow-Research/1.0"})
        with urlopen(request,timeout=180) as res:payload=res.read()
        if len(payload)<1000000:raise ValueError("NASA total Z RMS GeoTIFF suspiciously short")
        fd,temp=tempfile.mkstemp(dir=folder,prefix="lola-",suffix=".tif");os.close(fd)
        try:
            Path(temp).write_bytes(payload)
            with rasterio.open(temp) as ds:
                if ds.width!=3200 or ds.height!=3200 or ds.count!=1:
                    raise ValueError("Unexpected LOLA site total-Z RMS geometry")
            os.replace(temp,outfile)
        finally:
            if os.path.exists(temp):os.unlink(temp)
    return outfile,uri,hashlib.sha256(outfile.read_bytes()).hexdigest()

def xyz_destination(lat_deg,lon_deg,az_deg,d):
    lat=math.radians(lat_deg);lon=math.radians(lon_deg);az=math.radians(az_deg)
    up=(math.cos(lat)*math.cos(lon),math.cos(lat)*math.sin(lon),math.sin(lat))
    north=(-math.sin(lat)*math.cos(lon),-math.sin(lat)*math.sin(lon),math.cos(lat))
    east=(-math.sin(lon),math.cos(lon),0)
    tangent=tuple(north[i]*math.cos(az)+east[i]*math.sin(az) for i in range(3))
    beta=d/R
    v=tuple(up[i]*math.cos(beta)+tangent[i]*math.sin(beta) for i in range(3))
    return math.degrees(math.asin(max(-1,min(1,v[2])))),math.degrees(math.atan2(v[1],v[0]))

def execute(site):
    lat,lon=SITES[site]
    dpath,src,sha=download(site)
    folder=ROOT/"data"/(site.lower()+"_audit")
    horizon=list(csv.DictReader((folder/"local_horizon.csv").open(newline="")))
    if len(horizon)!=360:raise ValueError("Only 360 real LOLA direction rows accepted")
    with rasterio.open(dpath) as ds:
        if abs(ds.res[0]-5)>.001 or abs(ds.res[1]-5)>.001:raise ValueError("Wrong LOLA total error pixel scale")
        geographic=CRS.from_proj4("+proj=longlat +R=1737400 +no_defs")
        x0,y0=transform(geographic,ds.crs,[lon],[lat])
        center=ds.sample([(x0[0],y0[0])],masked=True)
        z0=next(center)[0]
        if hasattr(z0,"mask") and z0.mask is not False and bool(z0.mask):raise ValueError("Missing center RMS")
        z0=float(z0)
        if not math.isfinite(z0) or z0<0:raise ValueError("Invalid NASA center RMS")
        rows=[]
        for i,h in enumerate(horizon):
            az=float(h["azimuth_deg"])
            if az!=i:raise ValueError("Nonuniform horizon bin")
            distance=float(h["obstructing_distance_m"])
            destlat,destlon=xyz_destination(lat,lon,az,distance)
            ox,oy=transform(geographic,ds.crs,[destlon],[destlat])
            sample=next(ds.sample([(ox[0],oy[0])],masked=True))[0]
            if hasattr(sample,"mask") and bool(sample.mask):
                rows.append([i,distance,z0,"","","MISSING_NASA_ERROR_PIXEL"]);continue
            s=float(sample)
            if not math.isfinite(s) or s<0:raise ValueError("Invalid NASA obstacle RMS")
            # Approximate angular RMS using independent-error simplification.
            # Correlation, model and datum error NOT included; this is NOT a bound.
            sigma_angle=math.degrees(math.atan2(math.hypot(z0,s),distance))
            rows.append([i,distance,z0,s,f"{sigma_angle:.9f}","APPROX_LOCAL_RMS_ONLY"])
    csvpath=folder/"lola_z_rms_screen.csv"
    with csvpath.open("w",newline="") as out:
        wr=csv.writer(out,lineterminator="\n")
        wr.writerow(["azimuth_deg","local_obstruction_distance_m","observer_z_rms_m",
                     "terrain_z_rms_m","approx_independent_angular_rms_deg","status"])
        wr.writerows(rows)
    computed=[float(r[4]) for r in rows if r[4]!=""]
    metadata={"site_id":site,"nasa_source":src,"raster_sha256":sha,"observer_z_rms_m":z0,
      "records":len(rows),"computed":len(computed),
      "angular_rms_degrees_max":max(computed) if computed else None,
      "approximation":"uncorrelated two-point Z-error projection, not validated uncertainty bound",
      "excluded":"DEM correlations, frame/datum, distant terrain, panel/eclipse, hourly temporal crossing",
      "scientific_status":"PROVISIONAL_ONLY__NO_MISSION_PASS"}
    (folder/"lola_z_rms_meta.json").write_text(json.dumps(metadata,indent=2,allow_nan=False))
    print(site,"NASA LOLA original total-Z RMS raster audited:",len(computed),"sampled horizon directions. No certified visibility.")
def main():
    for site in SITES:execute(site)
if __name__=="__main__":main()
