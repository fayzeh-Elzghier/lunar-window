#!/usr/bin/env python3
"""Optional far-terrain NASA LOLA audit from the official Product 90 large-area DEM.

Discovers the actual GeoTIFF link from the official NASA PGDA product page;
never guesses a download URL, and never substitutes synthetic lunar heights.
Uses spherical Moon geometry to sample 80m approximate far-field skyline
beyond the existing 5m small tile. Does NOT certify the complete lunar horizon
or continuous operating windows: DEM alignment, error correlation, eclipse and
far-field coverage still need independent investigation.

Run on a well-connected, memory-adequate GitHub Actions runner:
  pip install numpy rasterio
  python scripts/audit_far_lola.py
"""
from __future__ import annotations
import csv
import hashlib
import json
import math
import os
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin,urlsplit
from urllib.request import Request,urlopen
import numpy as np
import rasterio
from rasterio.crs import CRS
from rasterio.warp import transform

ROOT=Path(__file__).resolve().parents[1]
PRODUCT="https://pgda.gsfc.nasa.gov/products/90"
FILENAME="LDEM_80S_80MPP_ADJ.TIF"
R=1737400.0
SITES={"Site01":(-89.4632,-137.49),"Site04":(-89.7668,-171.87)}
START_M=12000
END_M=300000
STEP_M=240

class Links(HTMLParser):
    def __init__(self):super().__init__();self.hrefs=[]
    def handle_starttag(self,tag,attrs):
        if tag.lower()=="a":
            for k,v in attrs:
                if k=="href" and v:self.hrefs.append(v)
def nasa_get(url):
    return urlopen(Request(url,headers={"User-Agent":"LunarWindow-Research/1.0"}),timeout=180)

def resolve_actual_nasa_cog():
    with nasa_get(PRODUCT) as r:html=r.read().decode("utf-8",errors="replace")
    parser=Links();parser.feed(html)
    links=[urljoin(PRODUCT,ref) for ref in parser.hrefs if FILENAME.lower() in ref.lower()]
    approved=[link for link in links if urlsplit(link).hostname=="pgda.gsfc.nasa.gov" and urlsplit(link).path.upper().endswith(FILENAME)]
    if not approved:
        raise ValueError("Official NASA Product90 page did not expose an exact link to "+FILENAME+"; no fabricated link used")
    return approved[0]

def acquire(url):
    folder=ROOT/"data"/"far_lola"
    folder.mkdir(parents=True,exist_ok=True)
    target=folder/FILENAME
    if not target.exists():
        fd,temp=tempfile.mkstemp(dir=folder,suffix=".tif");os.close(fd)
        try:
            length=0
            with nasa_get(url) as source,open(temp,"wb") as out:
                while True:
                    buf=source.read(1024*1024)
                    if not buf:break
                    out.write(buf);length+=len(buf)
                    if length>350_000_000:raise ValueError("NASA DEM unexpectedly large; abort download")
            if length<10_000_000:raise ValueError("NASA large-area DEM unexpectedly small")
            with rasterio.open(temp) as ds:
                if ds.count!=1 or not ds.crs:raise ValueError("NASA GeoTIFF missing georeference")
            os.replace(temp,target)
        finally:
            if os.path.exists(temp):os.unlink(temp)
    sha=hashlib.sha256(target.read_bytes()).hexdigest()
    return target,sha

def geo_points(lat,lon,az,distances):
    lat=math.radians(lat);lon=math.radians(lon);az=math.radians(az)
    up=np.array([math.cos(lat)*math.cos(lon),math.cos(lat)*math.sin(lon),math.sin(lat)])
    east=np.array([-math.sin(lon),math.cos(lon),0])
    north=np.array([-math.sin(lat)*math.cos(lon),-math.sin(lat)*math.sin(lon),math.cos(lat)])
    tangent=north*math.cos(az)+east*math.sin(az)
    delta=distances/R
    q=up[:,None]*np.cos(delta)[None,:]+tangent[:,None]*np.sin(delta)[None,:]
    return np.degrees(np.arcsin(np.clip(q[2],-1,1))),np.degrees(np.arctan2(q[1],q[0]))

def audit(ds,site,arr,hashval,source):
    lat,lon=SITES[site];folder=ROOT/"data"/(site.lower()+"_audit")
    local=list(csv.DictReader((folder/"local_horizon.csv").open(newline="")))
    if len(local)!=360:raise ValueError("Local source not 360 azimuths")
    meta=json.loads((folder/"local_horizon_meta.json").read_text())
    if meta["site_id"]!=site or meta["visibility_status"]!="NOT VALIDATED":
        raise ValueError("Existing LOLA local-source provenance invalid")
    ref=CRS.from_proj4("+proj=longlat +R=1737400 +no_defs")
    obsrad=R+meta["center_z_m"]+meta["observer_height_m"]
    distances=np.arange(START_M,END_M+STEP_M,STEP_M,dtype=np.float64)
    out=[]
    for az in range(360):
        targetlat,targetlon=geo_points(lat,lon,az,distances)
        xx,yy=transform(ref,ds.crs,targetlon.tolist(),targetlat.tolist())
        cc=np.floor((np.array(xx)-ds.transform.c)/ds.transform.a).astype(int)
        rr=np.floor((np.array(yy)-ds.transform.f)/ds.transform.e).astype(int)
        inside=(rr>=0)&(cc>=0)&(rr<ds.height)&(cc<ds.width)
        idx=np.where(~inside)[0]
        stop=int(idx[0]) if len(idx) else len(distances)
        if stop:
            subset=arr[rr[:stop],cc[:stop]]
            good=(~np.ma.getmaskarray(subset)) & np.isfinite(np.asarray(subset))
            if not good.all():
                bad=np.where(~good)[0]
                stop=min(stop,int(bad[0]))
        maximum=None;where=None
        if stop:
            radii=R+np.asarray(arr[rr[:stop],cc[:stop]],dtype=float)
            beta=distances[:stop]/R
            elev=np.degrees(np.arctan2(radii*np.cos(beta)-obsrad,radii*np.sin(beta)))
            ind=int(np.argmax(elev))
            maximum=float(elev[ind]);where=float(distances[ind])
        localangle=float(local[az]["local_max_elevation_deg"])
        combined=max(localangle,maximum) if maximum is not None else localangle
        out.append([az,f"{localangle:.9f}","" if maximum is None else f"{maximum:.9f}",
          "" if where is None else f"{where:.1f}",f"{combined:.9f}",
          f"{float(distances[stop-1]):.1f}" if stop else "0.0",
          "FAR_FIELD_PARTIAL_NOT_CERTIFIED"])
    csvpath=folder/"far_lola_horizon.csv"
    with csvpath.open("w",newline="") as f:
        writer=csv.writer(f,lineterminator="\n")
        writer.writerow(["azimuth_deg","local_5m_max_deg","far_80m_max_deg","far_obstacle_distance_m",
                         "combined_sampled_max_deg","far_coverage_m","status"])
        writer.writerows(out)
    result={"site":site,"official_product":PRODUCT,"source_url":source,"cog_sha256":hashval,
      "site_local_source_sha256":meta["raster_sha256"],
      "far_step_m":STEP_M,"far_start_m":START_M,"far_target_end_m":END_M,
      "far_checked_bins":sum(bool(r[2]) for r in out),
      "model":"radial spherical Moon terrain skylines (5m site local + 80m NASA South Pole DEM)",
      "uncertainty":"far-field error raster, datum matching, lunar shape and sun/earth disc not yet independently checked",
      "mission_status":"INSUFFICIENT_DATA__NOT_A_VERIFIED_SUN_EARTH_WINDOW"}
    (folder/"far_lola_meta.json").write_text(json.dumps(result,indent=2))
    print(site,":",result["far_checked_bins"],"provisional NASA far-field directions. NO certified mission pass.")

def main():
    source=resolve_actual_nasa_cog()
    raster,sha=acquire(source)
    with rasterio.open(raster) as ds:
        if abs(ds.res[0]-80)>1 or abs(ds.res[1]-80)>1:raise ValueError("Not an 80-m NASA South Pole DEM")
        array=ds.read(1,masked=True)
        for site in SITES:audit(ds,site,array,sha,source)
if __name__=="__main__":main()
