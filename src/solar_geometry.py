"""Geometry-based panel reference calculation using actual Horizons Sun directions.

Source for 1 AU reference irradiance:
https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science
NASA Goddard reports ~1361 W/m². This quantity is NOT the actual Site01/Site04
Sun-distance-corrected irradiance on a given 2026 lunar date.

No terrain shadow, eclipse, partial solar disk, panel degradation, or battery is
included. This is a *geometry/1 AU reference*, NEVER confirmed available power.
"""
import math

SOLAR_REFERENCE_1AU_W_M2=1361.0

def _number(x,name,minimum=None,maximum=None,strict_min=False):
    if isinstance(x,bool) or not isinstance(x,(float,int)) or not math.isfinite(x):
        raise ValueError(name+" must be a finite numeric value")
    v=float(x)
    if minimum is not None and (v<=minimum if strict_min else v<minimum):
        raise ValueError(name+" below allowed minimum")
    if maximum is not None and v>maximum:
        raise ValueError(name+" above allowed maximum")
    return v

def panel_incidence_factor(sun_azimuth_deg,sun_elevation_deg,panel_tilt_deg,panel_azimuth_deg):
    """Dot product of unit Sun direction and fixed panel normal (ENU basis).

    Azimuth clockwise from local North; tilt is normal inclination from Up.
    Returns clipped direct-beam geometric factor in [0,1].
    """
    az=_number(sun_azimuth_deg,"Sun azimuth",0)
    if az>=360:raise ValueError("Sun azimuth must be < 360")
    el=_number(sun_elevation_deg,"Sun elevation",-90,90)
    tilt=_number(panel_tilt_deg,"Panel tilt",0,90)
    pointing=_number(panel_azimuth_deg,"Panel azimuth",0)
    if pointing>=360:raise ValueError("Panel azimuth must be < 360")
    az,el,tilt,pointing=map(math.radians,(az,el,tilt,pointing))
    incidence=(math.cos(tilt)*math.sin(el)
       +math.sin(tilt)*math.cos(el)*math.cos(az-pointing))
    return min(1.0,max(0.0,incidence))

def unshadowed_reference_1au_w(sun_azimuth_deg,sun_elevation_deg,
                                panel_area_m2,efficiency,panel_tilt_deg,
                                panel_azimuth_deg):
    """Illustrative physical reference, NOT terrain-confirmed solar generation."""
    area=_number(panel_area_m2,"Panel area",0,strict_min=True)
    eff=_number(efficiency,"Panel efficiency",0,1,strict_min=True)
    incidence=panel_incidence_factor(sun_azimuth_deg,sun_elevation_deg,
                      panel_tilt_deg,panel_azimuth_deg)
    return SOLAR_REFERENCE_1AU_W_M2*area*eff*incidence
