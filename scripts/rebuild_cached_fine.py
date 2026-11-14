"""Rejoin existing, hash-verified original JPL samples to the current terrain.

Does not download new astronomy or interpolate time. Run after terrain changes.
"""
import csv, hashlib, io, json
from datetime import datetime, timezone
from pathlib import Path
from acquire_5minute_demo import COLUMNS, STATUS, horizon
ROOT=Path(__file__).resolve().parents[1]

def main():
    for site in ("Site01","Site04"):
        p=ROOT/"data"/(site.lower()+"_audit")
        meta=json.loads((p/"fine_5m_meta.json").read_text())
        series={}
        for body in ("sun","earth"):
            raw=(p/f"fine_5m_{body}_raw.txt").read_bytes()
            assert hashlib.sha256(raw).hexdigest()==meta[f"nasa_{body}"]["sha256"]
            text=raw.decode().split("$$SOE")[1].split("$$EOE")[0].strip()
            rows=[]
            for r in csv.reader(io.StringIO(text)):
                utc=datetime.strptime(r[0].strip(),"%Y-%b-%d %H:%M").replace(tzinfo=timezone.utc).isoformat().replace("+00:00","Z")
                rows.append([utc,float(r[3]),float(r[4])]+([float(r[5])] if body=="sun" else []))
            assert len(rows)==1441
            series[body]=rows
        with (p/"far_lola_horizon.csv").open() as f: terrain=list(csv.DictReader(f))
        bins=[float(r["combined_sampled_max_deg"]) for r in terrain]
        with (p/"fine_5m_dec2026.csv").open("w",newline="") as f:
            w=csv.writer(f,lineterminator="\n");w.writerow(COLUMNS)
            for s,e in zip(series["sun"],series["earth"]):
                assert s[0]==e[0]
                sh,eh=horizon(bins,s[1]),horizon(bins,e[1])
                w.writerow([s[0],s[1],s[2],e[1],e[2],s[3],f"{sh:.9f}",f"{s[2]-sh:.9f}",f"{eh:.9f}",f"{e[2]-eh:.9f}",STATUS])
        meta["far_lola_bearing_table_sha256"]=hashlib.sha256((p/"far_lola_horizon.csv").read_bytes()).hexdigest()
        (p/"fine_5m_meta.json").write_text(json.dumps(meta,indent=2))
        print(site,"rejoined original NASA samples to current terrain")
if __name__=="__main__":main()
