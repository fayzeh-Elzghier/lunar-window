#!/usr/bin/env python3
"""Validate the OFFLINE dashboard's real NASA data and JavaScript syntax.

Uses Node's built-in `--check` parser; no npm packages, no simulated ephemeris,
and no scientific validity claims. Run: python scripts/check_dashboard_js.py
"""
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
HTML=ROOT/"docs/index.html"

def main():
    html=HTML.read_text(encoding="utf-8")
    if html.count("<script>")!=1 or html.count("</script>")!=1:
        raise ValueError("Expected exactly one inline JavaScript block")
    js=html.split("<script>",1)[1].split("</script>",1)[0]
    required=["site04Rows","site01Rows","terrainSite04","terrainSite01"]
    data={}
    for name in required:
        pat=r"const "+name+r"=(\[.*?\]);"
        found=re.search(pat,js,re.S)
        if not found:raise ValueError("Missing actual NASA-backed array: "+name)
        data[name]=json.loads(found.group(1))
        if len(data[name])!=169:
            raise ValueError("Source "+name+" must have exactly 169 original hourly epochs")
    for site in ("01","04"):
        ephem=data["site"+site+"Rows"]
        terrain=data["terrainSite"+site]
        if any(row["t"]!=tr[0] for row,tr in zip(ephem,terrain)):
            raise ValueError("NASA ephemeris/LOLA sample timestamps do not align for Site"+site)
        if not any(row["t"]=="2026-12-01T00:00:00Z" for row in ephem):
            raise ValueError("Unexpected source start for Site"+site)
        if ephem[-1]["t"]!="2026-12-08T00:00:00Z":
            raise ValueError("Unexpected source end for Site"+site)
    if "INSUFFICIENT DATA" not in html or "terrain beyond the 16 km LOLA tile is unknown" not in html:
        raise ValueError("Science warnings disappeared; do not deploy")
    ids=set(re.findall(r'\bid="([^"]+)"',html))
    static_lookups=set(re.findall(r'\$\("([A-Za-z0-9_-]+)"\)',js))
    missing=sorted(static_lookups-ids)
    if missing:raise ValueError("Missing UI elements referenced from JavaScript: "+str(missing))
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/"dashboard.js"
        p.write_text(js,encoding="utf-8")
        subprocess.run(["node","--check",str(p)],check=True)
    print("Dashboard JS parses; 338 real NASA site-epochs and 338 aligned LOLA screening rows; science gates remain visible.")

if __name__=="__main__":
    main()
