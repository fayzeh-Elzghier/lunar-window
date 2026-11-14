"""Evidence-gated Lunar Window Mission Rescue, v0.3.

Expects continuously verified NASA-derived, terrain-aware intervals supplied by a
separately audited scientific pipeline. NEVER converts hourly Horizons angle samples
directly into operational pass intervals. Missing evidence => INSUFFICIENT_DATA.
All times UTC and intervals [start,end).
"""
from __future__ import annotations
import datetime as dt
import math
from dataclasses import dataclass
from typing import Mapping

UTC=dt.timezone.utc
PRIORITIES={"keep_site","earliest_start","largest_delay_margin"}

def utc(s):
    if not isinstance(s,str) or not s.endswith("Z"): raise ValueError("UTC ISO8601 timestamp ending Z required")
    v=dt.datetime.fromisoformat(s[:-1]+"+00:00")
    if v.utcoffset()!=dt.timedelta(): raise ValueError("UTC required")
    return v

def stamp(t):return t.astimezone(UTC).isoformat(timespec="seconds").replace("+00:00","Z")
def finite(v,name,low=None,high=None,strict=False):
    if isinstance(v,bool) or not isinstance(v,(float,int)) or not math.isfinite(v):raise ValueError(name+" must be finite number")
    if low is not None and (v<=low if strict else v<low):raise ValueError(name+" outside allowed range")
    if high is not None and v>high:raise ValueError(name+" outside allowed range")
    return float(v)

@dataclass(frozen=True)
class Request:
    site_id:str
    start:dt.datetime
    duration:float
    watts:float
    earth_required:bool
    delay:float
    priority:str

def request(payload):
    p=payload["panel"]
    finite(p["area_m2"],"panel area",0,strict=True)
    finite(p["efficiency"],"panel efficiency",0,1,strict=True)
    finite(p["tilt_deg"],"panel tilt",0,90)
    az=finite(p["azimuth_deg"],"panel azimuth",0)
    if az>=360:raise ValueError("panel azimuth must be below 360")
    finite(p["height_above_surface_m"],"panel height",0)
    finite(payload["earth_observer_height_m"],"Earth observer height",0)
    sid=payload["site_id"]; priority=payload.get("priority","earliest_start")
    earth=payload["require_continuous_earth_visibility"]
    if not isinstance(sid,str) or not sid.strip():raise ValueError("site ID required")
    if priority not in PRIORITIES:raise ValueError("unknown priority")
    if not isinstance(earth,bool):raise ValueError("Earth requirement must be boolean")
    return Request(sid,utc(payload["requested_start_utc"]),
        finite(payload["duration_s"],"duration",0,strict=True),
        finite(payload["required_power_w"],"power requirement",0,strict=True),earth,
        finite(payload["max_start_delay_s"],"max delay",0),priority)

def checked_intervals(data,site):
    """Validation flags are upstream attestations, not independent proof by this file."""
    errors=[]
    if data.get("site_id")!=site:errors.append("SITE_MISMATCH")
    if data.get("data_kind")!="nasa_derived":errors.append("NASA_PROVENANCE_REQUIRED")
    if data.get("model_mode")!="terrain_aware":errors.append("TERRAIN_UNVERIFIED")
    if data.get("validation_status")!="verified_for_documented_scope":errors.append("INDEPENDENT_SCIENCE_CHECK_PENDING")
    if not isinstance(data.get("provenance_urls"),list) or not data["provenance_urls"]:errors.append("PROVENANCE_MISSING")
    raw=data.get("intervals")
    if not isinstance(raw,list) or not raw:errors.append("CONTINUOUS_INTERVALS_MISSING")
    if errors:return [],errors
    out=[]
    for e in raw:
        a,b=utc(e["start_utc"]),utc(e["end_utc"])
        if b<=a:raise ValueError("invalid evidence interval")
        for key in ("power_ok","earth_visible"):
            if e.get(key) is not None and not isinstance(e[key],bool):raise ValueError(key+" must be bool or null")
        mw=e.get("min_power_w")
        if mw is not None:finite(mw,"min_power_w",0)
        if e.get("power_ok") is True and mw is None:raise ValueError("minimum power required for pass")
        if e.get("verified") is not True:errors.append("UNVERIFIED_INTERVAL")
        source=e.get("source_id")
        if not isinstance(source,str) or not source:errors.append("MISSING_SOURCE_ID")
        uncertainty=finite(e.get("uncertainty_s"),"time uncertainty",0)
        out.append((a,b,e.get("power_ok"),e.get("earth_visible"),mw,source,uncertainty))
    out.sort(key=lambda x:x[0])
    if any(x[1]>y[0] for x,y in zip(out,out[1:])):errors.append("OVERLAPPING_INTERVALS")
    return out,sorted(set(errors))

def _covers(rows,a,b):
    cursor=a; out=[]
    for r in rows:
        if r[1]<=cursor:continue
        if r[0]>=b:break
        if r[0]>cursor:
            out.append((cursor,min(r[0],b),None));cursor=min(r[0],b)
        left=max(cursor,r[0]);right=min(b,r[1])
        if right>left:out.append((left,right,r));cursor=right
        if cursor>=b:break
    if cursor<b:out.append((cursor,b,None))
    return out

def _intervals(items):
    out=[]
    for a,b in items:
        if out and out[-1][1]==a:out[-1]=(out[-1][0],b)
        else:out.append((a,b))
    return [{"start_utc":stamp(a),"end_utc":stamp(b)} for a,b in out]

def evaluate(req,data):
    """Report ALL confirmed failure reasons plus missing-coverage warning."""
    try:rows,errors=checked_intervals(data,req.site_id)
    except (TypeError,KeyError,ValueError) as ex:return {"status":"invalid_input","errors":[str(ex)]}
    if errors:return {"status":"insufficient_data","reasons":errors}
    end=req.start+dt.timedelta(seconds=req.duration)
    fails={"POWER_BELOW_REQUIREMENT":[],"EARTH_OCCLUDED":[],"INSUFFICIENT_COVERAGE":[]}
    good=[]
    for a,b,r in _covers(rows,req.start,end):
        if r is None or r[2] is None or (req.earth_required and r[3] is None):
            fails["INSUFFICIENT_COVERAGE"].append((a,b));continue
        power_bad=(r[2] is False or (r[4] is not None and r[4]<req.watts))
        earth_bad=req.earth_required and r[3] is False
        if power_bad:fails["POWER_BELOW_REQUIREMENT"].append((a,b))
        if earth_bad:fails["EARTH_OCCLUDED"].append((a,b))
        if not power_bad and not earth_bad:good.append((a,b))
    known_fail=bool(fails["POWER_BELOW_REQUIREMENT"] or fails["EARTH_OCCLUDED"])
    unknown=bool(fails["INSUFFICIENT_COVERAGE"])
    status="requirements_not_met" if known_fail else ("insufficient_data" if unknown else "requirements_met")
    reasons=[{"code":k,"intervals":_intervals(v)} for k,v in fails.items() if v]
    if known_fail:
        # Even if there is no overlap at all, explain that a continuous
        # window cannot satisfy the mission. Separate power/Earth failures
        # remain present with their full UTC intervals.
        groups=_intervals(good)
        longest=max((utc(g["end_utc"])-utc(g["start_utc"])).total_seconds() for g in groups) if groups else 0.0
        if longest<req.duration:
            reasons.append({"code":"NO_CONTIGUOUS_WINDOW",
                            "intervals":groups,
                            "explanation":"No uninterrupted overlap satisfies the requested duration"})
    return {"status":status,"start_utc":stamp(req.start),"end_utc":stamp(end),
            "site_id":req.site_id,"reasons":reasons,"earth_requirement_enabled":req.earth_required}

def rescue(req,site_evidence:Mapping[str,dict]):
    """Rescue candidates and margins — no guessing at physical window end."""
    if not site_evidence:
        return {"status":"insufficient_data","alternatives":[],"unassessed_sites":[],
                "comparative_winner_supported":False,"warning":"No verified NASA-derived site evidence"}
    end_search=req.start+dt.timedelta(seconds=req.delay)
    found=[];unassessed=[]
    for site,data in site_evidence.items():
        try:rows,errors=checked_intervals(data,site)
        except (TypeError,KeyError,ValueError) as ex:rows=[];errors=[str(ex)]
        if errors:unassessed.append({"site_id":site,"reasons":errors});continue
        if rows[0][0]>req.start or rows[-1][1]<end_search+dt.timedelta(seconds=req.duration):
            unassessed.append({"site_id":site,"reasons":["PARTIAL_SEARCH_COVERAGE"]})
        streak=[];groups=[]
        for r in rows:
            good=r[2] is True and r[4] is not None and r[4]>=req.watts and (not req.earth_required or r[3] is True)
            if good and streak and streak[-1][1]!=r[0]:groups.append(streak);streak=[]
            if good:streak.append(r)
            elif streak:groups.append(streak);streak=[]
        if streak:groups.append(streak)
        for group in groups:
            a,b=group[0][0],group[-1][1]
            earliest=max(a,req.start)
            latest=min(end_search,b-dt.timedelta(seconds=req.duration))
            if latest<earliest:continue
            next_row=next((r for r in rows if r[0]==b),None)
            physical_end=next_row is not None and next_row[2] is not None and (
                next_row[2] is False or next_row[4] is not None and next_row[4]<req.watts or req.earth_required and next_row[3] is False)
            margin=(b-dt.timedelta(seconds=req.duration)-earliest).total_seconds() if physical_end else None
            found.append({"site_id":site,"start_utc":stamp(earliest),
                "finish_utc":stamp(earliest+dt.timedelta(seconds=req.duration)),
                "delay_s":(earliest-req.start).total_seconds(),
                "known_latest_start_utc":stamp(latest),
                "window_delay_margin_s":margin,
                "physical_window_end_known":physical_end,
                "changed_fields":(["site_id"] if site!=req.site_id else []) + (["start"] if earliest!=req.start else []),
                "source_ids":sorted({r[5] for r in group}),
                "time_precision_s":max(r[6] for r in group)})
    if req.priority=="keep_site":found.sort(key=lambda x:(x["site_id"]!=req.site_id,x["delay_s"],x["site_id"]))
    elif req.priority=="earliest_start":found.sort(key=lambda x:(x["delay_s"],x["site_id"]!=req.site_id,x["site_id"]))
    else:found.sort(key=lambda x:(x["window_delay_margin_s"] is None,-(x["window_delay_margin_s"] or 0),x["delay_s"],x["site_id"]))
    return {"status":"candidates_found" if found else ("insufficient_data" if unassessed else "no_alternative_within_constraints"),
            "priority":req.priority,"alternatives":found,"unassessed_sites":unassessed,
            "comparative_winner_supported":not bool(unassessed),
            "warning":"Incomplete or unequal site coverage prevents best-site claim" if unassessed else None}

def scenario_matrix(req,site_evidence,delays_s):
    """Evaluate user-chosen site/delay cases. No synthetic astronomical input."""
    scenarios=[]
    for delay in delays_s:
        shift=finite(delay,"scenario delay",0,req.delay)
        for site,data in site_evidence.items():
            m=Request(site,req.start+dt.timedelta(seconds=shift),req.duration,req.watts,
                      req.earth_required,req.delay,req.priority)
            scenarios.append({"site_id":site,"delay_s":shift,"assessment":evaluate(m,data)})
    return {"count":len(scenarios),"scenarios":scenarios}
