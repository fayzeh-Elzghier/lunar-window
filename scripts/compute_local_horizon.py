#!/usr/bin/env python3
"""Compute a *LOCAL / PROVISIONAL* lunar skyline from actual NASA LOLA 5m DEM.

Samples radial lunar terrain with curvature using the published ME coordinates.
The local tile covers only about 16 km, so distant obstructing mountains are
UNKNOWN. Vertical reference/ephemeris-frame alignment need independent checks.
DO NOT use this output as a verified visibility interval or Mission Rescue pass.

Usage: pip install numpy rasterio
  python scripts/compute_local_horizon.py --site Site01
  python scripts/compute_local_horizon.py --site Site04
"""
import argparse
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path
import tempfile
from urllib.request import Request,urlopen

import numpy as np
import rasterio
from rasterio.crs import CRS
from rasterio.warp import transform

ROOT=Path(__file__).resolve().parents[1]
LUNAR_REFERENCE_RADIUS_M=1737400.0
SITE_INFO={
 "Site01":{"lat":-89.4632,"signed_lon":-137.49,"east_lon":222.51,
     "url":"https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/Site01/Site01_final_adj_5mpp_surf.tif"},
 "Site04":{"lat":-89.7668,"signed_lon":-171.87,"east_lon":188.13,
     "url":"https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/Site04/Site04_final_adj_5mpp_surf.tif"}
}

def downloaded_raster(site):
    info=SITE_INFO[site]
    folder=ROOT/"data"/(site.lower()+"_audit")
    folder.mkdir(parents=True,exist_ok=True)
    p=folder/(site+"_final_adj_5mpp_surf.tif")
    if not p.exists():
        request=Request(info["url"],headers={"User-Agent":"LunarWindow-Research/1.0"})
        with urlopen(request,timeout=180) as r:content=r.read()
        if len(content)<1000000:raise ValueError("LOLA raster unexpectedly small")
        fd,temp=tempfile.mkstemp(dir=folder,suffix=".tif")
        os.close(fd)
        try:
            Path(temp).write_bytes(content)
            with rasterio.open(temp) as ds:
                if ds.count<1 or ds.width<100:raise ValueError("Invalid LOLA GeoTIFF")
            os.replace(temp,p)
        finally:
            if os.path.exists(temp):os.unlink(temp)
    digest=hashlib.sha256(p.read_bytes()).hexdigest()
    existing=folder/"metadata.json"
    if existing.exists():
        previous=json.loads(existing.read_text())
        expected=previous.get("sha256") or previous.get("dem_sha256")
        if expected and digest!=expected:raise ValueError("LOLA raster SHA256 differs from existing audit")
    return p,digest

def calculate_local_skyline(site,step_m=5,step_az_deg=1,height_m=2):
    info=SITE_INFO[site]
    if step_m<5 or step_m>50 or 360%step_az_deg!=0:
        raise ValueError("Select 5..50m step and azimuth bin evenly dividing 360")
    p,digest=downloaded_raster(site)
    lat=math.radians(info["lat"])
    lon=math.radians(info["signed_lon"])
    up=np.array([math.cos(lat)*math.cos(lon),math.cos(lat)*math.sin(lon),math.sin(lat)])
    east=np.array([-math.sin(lon),math.cos(lon),0.0])
    north=np.array([-math.sin(lat)*math.cos(lon),-math.sin(lat)*math.sin(lon),math.cos(lat)])
    target_crs=CRS.from_proj4("+proj=longlat +R=1737400 +no_defs")
    with rasterio.open(p) as ds:
        if abs(ds.res[0]-5)>0.001 or abs(ds.res[1]-5)>0.001:raise ValueError("Not 5m LOLA tile")
        x,y=transform(target_crs,ds.crs,[info["signed_lon"]],[info["lat"]])
        row,col=ds.index(x[0],y[0])
        if not(0<=row<ds.height and 0<=col<ds.width):raise ValueError("Site center outside tile")
        image=ds.read(1,masked=True)
        z0=float(image[row,col])
        if not math.isfinite(z0) or np.ma.is_masked(image[row,col]):
            raise ValueError("Missing center terrain elevation")
        original_radius=LUNAR_REFERENCE_RADIUS_M+z0+height_m
        distance=np.arange(step_m,25000+step_m,step_m,dtype=np.float64)
        delta=distance/LUNAR_REFERENCE_RADIUS_M
        cosd=np.cos(delta);sind=np.sin(delta)
        result=[]
        for az in range(0,360,step_az_deg):
            angle=math.radians(az)
            tangent=north*math.cos(angle)+east*math.sin(angle)
            ray=up[:,None]*cosd[None,:]+tangent[:,None]*sind[None,:]
            target_lat=np.rad2deg(np.arcsin(np.clip(ray[2],-1,1)))
            target_lon=np.rad2deg(np.arctan2(ray[1],ray[0]))
            tx,ty=transform(target_crs,ds.crs,target_lon.tolist(),target_lat.tolist())
            # Raster row/column conversion is vectorized; no invented missing pixels.
            cc=np.floor((np.asarray(tx)-ds.transform.c)/ds.transform.a).astype(int)
            rr=np.floor((np.asarray(ty)-ds.transform.f)/ds.transform.e).astype(int)
            inside=(rr>=0)&(cc>=0)&(rr<ds.height)&(cc<ds.width)
            if not inside.any():raise ValueError("No terrain coverage along azimuth "+str(az))
            first_out=np.where(~inside)[0]
            usable_n=int(first_out[0]) if len(first_out) else len(distance)
            if usable_n<1:raise ValueError("Insufficient near-site DEM coverage")
            z=np.ma.asarray(image[rr[:usable_n],cc[:usable_n]])
            good=(~np.ma.getmaskarray(z)) & np.isfinite(np.asarray(z))
            if not good.all():
                ix=np.where(~good)[0]
                usable_n=int(ix[0])
                if usable_n<1:raise ValueError("Missing near-site elevations")
                z=z[:usable_n]
            radii=LUNAR_REFERENCE_RADIUS_M+np.asarray(z,dtype=float)
            vertical=radii*cosd[:usable_n]-original_radius
            horizontal=radii*sind[:usable_n]
            elevations=np.rad2deg(np.arctan2(vertical,horizontal))
            if not np.all(np.isfinite(elevations)):raise ValueError("Nonfinite local elevation angle")
            idx=int(np.argmax(elevations))
            result.append({
              "azimuth_deg":az,
              "local_max_elevation_deg":float(elevations[idx]),
              "obstructing_distance_m":float(distance[idx]),
              "tile_covered_range_m":float(distance[usable_n-1]),
              "far_terrain_status":"UNKNOWN_BEYOND_TILE",
              "scientific_validation":"PROVISIONAL_ONLY"})
    folder=ROOT/"data"/(site.lower()+"_audit")
    path=folder/"local_horizon.csv"
    with path.open("w",newline="") as out:
        writer=csv.DictWriter(out,fieldnames=list(result[0]))
        writer.writeheader();writer.writerows(result)
    metadata={"site_id":site,"lola_source_url":info["url"],"raster_sha256":digest,
      "latitude_deg":info["lat"],"east_longitude_deg":info["east_lon"],
      "center_z_m":z0,"observer_height_m":height_m,
      "sampling_step_m":step_m,"azimuth_step_deg":step_az_deg,
      "reference_radius_m":LUNAR_REFERENCE_RADIUS_M,
      "method":"great-circle radial lunar LOS + local DEM sampled maxima",
      "frame":"provisional ME; verify DEM Z datum/DE421 vs Horizons DE441",
      "uncertainty":"not quantified; LOLA Z errors, pixel sampling, far obstacles unmodelled",
      "coverage":"finite local LOLA tile; all skyline directions incomplete at distant ranges",
      "mission_feasibility":"INSUFFICIENT_DATA",
      "visibility_status":"NOT VALIDATED"}
    (folder/"local_horizon_meta.json").write_text(json.dumps(metadata,indent=2,allow_nan=False))
    print(site,len(result),"provisional local horizon azimuths ->",path)
    print("IMPORTANT: NEVER use local tile skyline alone to certify Sun or Earth visibility")
    return result

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--site",required=True,choices=sorted(SITE_INFO))
    parser.add_argument("--sample-step-m",type=int,default=5)
    parser.add_argument("--azimuth-step-deg",type=int,default=1)
    a=parser.parse_args()
    calculate_local_skyline(a.site,a.sample_step_m,a.azimuth_step_deg)
