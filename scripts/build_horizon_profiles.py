"""Export existing NASA-derived horizon bins for the sky visualization."""
import csv, hashlib, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
out={"schema":"lunar-window-horizon-profile-v1","sites":{}}
for site in ("Site01","Site04"):
    p=ROOT/"data"/(site.lower()+"_audit")/"far_lola_horizon.csv"
    rows=list(csv.DictReader(p.open()))
    assert len(rows)==360 and all(int(r["azimuth_deg"])==i for i,r in enumerate(rows))
    out["sites"][site]={"elevation_deg":[float(r["combined_sampled_max_deg"]) for r in rows],"bearing_table_sha256":hashlib.sha256(p.read_bytes()).hexdigest()}
(ROOT/"docs/data/horizon_profiles.js").write_text("window.LUNAR_HORIZONS="+json.dumps(out,separators=(",",":"))+";\n")
