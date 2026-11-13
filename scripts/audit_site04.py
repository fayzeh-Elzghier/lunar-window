"""Reproduce Site04 first data audit; no terrain visibility or power claims.
Dependencies: numpy, rasterio. Outputs are NASA data and audit metadata.
"""
import csv, hashlib, json, math, pathlib, urllib.parse, urllib.request
from datetime import datetime, timezone
import rasterio
from rasterio.crs import CRS
from rasterio.warp import transform
ROOT = pathlib.Path("data/site04_audit")
ROOT.mkdir(parents=True, exist_ok=True)
DEM_URL = "https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/Site04/Site04_final_adj_5mpp_surf.tif"
dem = ROOT / "Site04.tif"
if not dem.exists():
    with urllib.request.urlopen(DEM_URL, timeout=90) as response:
        dem.write_bytes(response.read())
with rasterio.open(dem) as ds:
    x,y=transform(CRS.from_proj4("+proj=longlat +R=1737400 +no_defs"),ds.crs,[-171.87],[-89.7668])
    row,col=ds.index(x[0],y[0])
    assert 0<=row<ds.height and 0<=col<ds.width
    z=float(next(ds.sample([(x[0],y[0])]))[0])
    assert math.isfinite(z)
    # Provisional vertical interpretation; source CRS defines horizontal sphere,
    # not by itself a complete vertical datum. Keep explicit pending review.
    altitude_km=(z+2)/1000
    metadata=dict(latitude_deg=-89.7668,east_longitude_deg=188.13,
        dem_url=DEM_URL,dem_sha256=hashlib.sha256(dem.read_bytes()).hexdigest(),
        crs_wkt=ds.crs.to_wkt(),bounds_m=list(ds.bounds),resolution_m=list(ds.res),
        projected_x_m=x[0],projected_y_m=y[0],row=row,col=col,
        nearest_pixel_surface_value_m=z,observer_height_above_surface_m=2,
        provisional_horizons_altitude_km=altitude_km,
        vertical_status="provisional: confirm Z radial reference before terrain validation",
        terrain_horizon_status="not computed")
queries={}
def fetch(name,target,longitude=188.13,start="2026-12-01",stop="2026-12-08",step="1h"):
    params=dict(format="text",COMMAND=f"'{target}'",CENTER="'coord@301'",
        COORD_TYPE="'GEODETIC'",SITE_COORD=f"'{longitude},-89.7668,{altitude_km:.12f}'",
        MAKE_EPHEM="'YES'",EPHEM_TYPE="'OBSERVER'",START_TIME=f"'{start}'",
        STOP_TIME=f"'{stop}'",STEP_SIZE=f"'{step}'",QUANTITIES="'4'",
        CSV_FORMAT="'YES'",OBJ_DATA="'NO'")
    url="https://ssd.jpl.nasa.gov/api/horizons.api?"+urllib.parse.urlencode(params)
    raw=urllib.request.urlopen(url,timeout=60).read().decode()
    assert "$$SOE" in raw and "$$EOE" in raw,raw
    assert "Moon (301)" in raw and "NO (AIRLESS)" in raw
    (ROOT/f"{name}.txt").write_text(raw)
    queries[name]=dict(url=url,parameters=params,retrieved_utc=datetime.now(timezone.utc).isoformat(),
        sha256=hashlib.sha256(raw.encode()).hexdigest())
    rows=[]
    for fields in csv.reader(raw.split("$$SOE")[1].split("$$EOE")[0].strip().splitlines()):
        utc=datetime.strptime(fields[0].strip(),"%Y-%b-%d %H:%M").replace(tzinfo=timezone.utc)
        az,el=float(fields[3]),float(fields[4])
        assert 0<=az<360 and -90<=el<=90
        rows.append([utc.isoformat().replace("+00:00","Z"),az,el])
    return rows
sun=fetch("sun",10)
earth=fetch("earth",399)
assert len(sun)==len(earth)==169
assert all(a[0]==b[0] for a,b in zip(sun,earth))
# Independent request checks longitude normalization, not independent ephemeris physics.
signed=fetch("sun_signed_longitude_check",10,longitude=-171.87,stop="2026-12-01 01:00")
delta=max(abs(signed[0][i]-sun[0][i]) for i in (1,2))
assert delta<=1e-6
metadata["checks"]={"hourly_rows_per_body":169,"aligned_times":True,
    "signed_longitude_max_difference_deg":delta,
    "independent_physical_validation":"pending"}
with (ROOT/"sample.csv").open("w",newline="") as f:
    w=csv.writer(f);w.writerow(["utc","sun_azimuth_deg","sun_elevation_deg","earth_azimuth_deg","earth_elevation_deg"])
    w.writerows([a+b[1:] for a,b in zip(sun,earth)])
(ROOT/"metadata.json").write_text(json.dumps(metadata,indent=2,allow_nan=False))
(ROOT/"queries.json").write_text(json.dumps(queries,indent=2))
print(json.dumps(metadata,indent=2))
print("First sample:",sun[0],earth[0])
