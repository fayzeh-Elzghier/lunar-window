"""Separate vector implementation and original-source parity audit.

Not an independent ephemeris or terrain validation. No scientific libraries or
application calculation functions are imported into the Python calculation.
"""
import csv, hashlib, io, json, math, subprocess
from pathlib import Path
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parents[1]
def vector(az,el):
    a,e=map(math.radians,(az,el))
    return math.cos(e)*math.sin(a),math.cos(e)*math.cos(a),math.sin(e)
def power(row,q):
    normal=vector(q['azimuth'],90-q['tilt'])
    sun=vector(row[1],row[2])
    cosine=max(0,sum(a*b for a,b in zip(normal,sun)))
    return 1361/row[9]**2*q['area']*q['efficiency']*cosine if row[6]>0 else 0.0
def raw_rows(path):
    text=path.read_text().split('$$SOE')[1].split('$$EOE')[0]
    return list(csv.reader(io.StringIO(text.strip())))
def main():
    js=json.loads(subprocess.check_output(['node','scripts/verification_driver.cjs'],cwd=ROOT,text=True))
    max_error=0.;checks=0;epoch_count=0;max_terrain_error=0.;hashes={}
    for site in ('Site01','Site04'):
        folder=ROOT/'data'/(site.lower()+'_audit')
        meta=json.loads((folder/'fine_5m_meta.json').read_text())
        sources={}
        for body in ('sun','earth'):
            path=folder/f'fine_5m_{body}_raw.txt'
            digest=hashlib.sha256(path.read_bytes()).hexdigest()
            assert digest==meta['nasa_'+body]['sha256']
            hashes[site+'_'+body]=digest;sources[body]=raw_rows(path)
        with (folder/'far_lola_horizon.csv').open() as f:
            skyline=[float(r['combined_sampled_max_deg']) for r in csv.DictReader(f)]
        def horizon(az):
            j=math.floor(az);f=az-j
            return skyline[j]*(1-f)+skyline[(j+1)%360]*f
        assert len(js['sites'][site])==len(sources['sun'])==len(sources['earth'])==1441
        for i,sample in enumerate(js['sites'][site]):
            row=sample['row'];sun=sources['sun'][i];earth=sources['earth'][i]
            expected_time=datetime.strptime(sun[0].strip(),'%Y-%b-%d %H:%M').replace(tzinfo=timezone.utc).isoformat().replace('+00:00','Z')
            assert row[0]==expected_time and sun[0].strip()==earth[0].strip()
            expected=[float(sun[3]),float(sun[4]),float(earth[3]),float(earth[4])]
            assert all(abs(a-b)<1e-9 for a,b in zip(row[1:5],expected))
            assert abs(row[9]-float(sun[5]))<1e-12
            for az,el,clear in ((row[1],row[2],row[6]),(row[3],row[4],row[8])):
                error=abs(el-horizon(az)-clear);max_terrain_error=max(max_terrain_error,error)
                assert error<2e-8
            for q,actual in zip(js['configs'],sample['power']):
                error=abs(power(row,q)-actual);max_error=max(max_error,error);checks+=1
                assert error<1e-9
            epoch_count+=1
    # Independent analytical check: zenith-facing 1 m², 25%, 1AU = 340.25W.
    assert abs(power(['t',0,90,0,0,0,1,0,1,1],{'tilt':0,'azimuth':0,'area':1,'efficiency':.25})-340.25)<1e-10
    s=js['summary'];first=s['first'];robust=s['resilient']
    assert first['startUtc']=='2026-12-21T12:40:00.000Z'
    assert robust['startUtc']=='2026-12-21T17:45:00.000Z'
    # Recompute stress minima without browser formula, over original source epochs.
    for case in (first,robust):
        rows=[v['row'] for v in js['sites'][case['site']] if case['startUtc'][:16]<=v['row'][0][:16]<case['finishUtc'][:16]]
        assert len(rows)==72
        for key,offset in [('sensitivity',1),('severeSensitivity',5)]:
            values=[]
            for dt in (-offset,0,offset):
                for da in (-offset,0,offset):
                    q=dict(js['configs'][0],tilt=60+dt,azimuth=90+da)
                    values.extend(power(row,q)*.9 for row in rows)
            assert abs(min(values)-case[key]['minimumPowerW'])<=.000501
            assert (min(values)>=100)==case[key]['passes']
    report=f'''# Numerical verification — reproducible evidence

Run `python scripts/verify_numerics.py` with Python 3.11+ and Node 22.

**PASS:** {epoch_count:,} original NASA site-time records checked against raw responses; {checks:,} panel-power comparisons across three panel orientations. Maximum Python/vector versus browser difference: **{max_error:.3e} W** (acceptance: <1e-9 W). Maximum recomputed skyline-clearance difference: **{max_terrain_error:.3e}°** (acceptance: <2e-8°, allows stored decimal rounding).

## What was actually checked

- SHA256 of all four original five-minute JPL responses matches the recorded provenance.
- UTC, Sun/Earth angles and Sun distance in the browser match original records.
- Displayed terrain clearance matches circular interpolation of the committed horizon table.
- A separately written Python 3D vector dot product agrees with the browser's trigonometric panel calculation, including terrain blocking.
- An analytical perpendicular 1 m², 25%-efficient panel at 1 AU yields 340.25 W under the 1361 W/m² reference.
- Both demo candidates' nine-combination sensitivity minima agree between Python and JavaScript to stored 0.001 W precision, for ±1° and ±5° profiles.

## Decision demonstration (illustrative hardware)

| Case | Start UTC on Dec 21, 2026 | Minimum nominal W | Minimum W at 10% lower output, ±1° offsets | Interpretation |
|---|---|---:|---:|---|
| First candidate | 12:40 | {first['minEstimatedPowerW']:.3f} | {first['sensitivity']['minimumPowerW']:.3f} | Nominal pass, stress failure |
| Later candidate | 17:45 | {robust['minEstimatedPowerW']:.3f} | {robust['sensitivity']['minimumPowerW']:.3f} | Meets both sampled criteria |

Of {s['count']} nominal candidates, {s['stress']} meet the ±1°/10%-reduction profile and {s['severe']} meet the ±5°/10%-reduction profile. Both profiles are illustrative, not measured hardware tolerances or formal confidence bounds. The requested6h/100W/Earth-visibility conditions remain unchanged.

## Scope — do not overclaim

This is a **separate implementation check**, written within this project. It uses the same NASA source records and terrain table. It does **not** independently validate JPL ephemerides, DEM accuracy, coordinate alignment, complete horizons, eclipse conditions, continuous windows, hardware performance or radio contact. It is not an external expert review or measured field validation. Numerical agreement cannot remove a shared model error.

Sources: [NASA JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html), [NASA solar irradiance reference](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science), [NASA LOLA local data](https://pgda.gsfc.nasa.gov/products/78).

## Source fingerprints

'''
    report+='\n'.join(f'- `{k}`: `{v}`' for k,v in hashes.items())+'\n'
    (ROOT/'docs/NUMERICAL_VERIFICATION.md').write_text(report.replace('requested6h/100W/','requested 6h/100W/'))
    print(f'PASS {epoch_count} raw NASA records; {checks} vector comparisons; two sensitivity profiles; max error {max_error:.3e} W')
if __name__=='__main__':main()
