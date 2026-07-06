#!/usr/bin/env python3
"""
Uganda Raster Time-Series Cube Pipeline
========================================
Builds a monthly NDVI / EVI / MOISTURE_INDEX xarray cube clipped to Uganda's
national boundary using Sentinel Hub WMS, then saves it as NetCDF.

Usage:
    python cube_pipeline.py [--layers NDVI EVI MOISTURE_INDEX] [--months 12]
                            [--output uganda_time_series_cube.nc]
                            [--width 512] [--height 512]

Env vars (override .env values):
    SENTINEL_INSTANCE_ID
    SENTINEL_CLIENT_ID
    SENTINEL_CLIENT_SECRET

Progress is written to stdout as JSON lines so the Node.js wrapper can stream
it back to the frontend:
    {"status":"running","step":"NDVI 2025-07","progress":14,"total":39}
    {"status":"done","output":"uganda_time_series_cube.nc","layers":["NDVI","EVI","MOISTURE_INDEX"]}
    {"status":"error","message":"..."}
"""

import os
import sys
import json
import argparse
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ── Dependency guard ──────────────────────────────────────────────────────────
MISSING = []
try:
    from sentinelhub import SHConfig, WmsRequest, MimeType, CRS, BBox
except ImportError:
    MISSING.append("sentinelhub")

try:
    import geopandas as gpd
except ImportError:
    MISSING.append("geopandas")

try:
    import rasterio
    from rasterio.mask import mask as rasterio_mask
    from rasterio.transform import from_bounds
except ImportError:
    MISSING.append("rasterio")

try:
    import numpy as np
except ImportError:
    MISSING.append("numpy")

try:
    import xarray as xr
except ImportError:
    MISSING.append("xarray")

if MISSING:
    msg = (
        f"Missing Python packages: {', '.join(MISSING)}. "
        "Run: pip install sentinelhub geopandas rasterio numpy xarray"
    )
    print(json.dumps({"status": "error", "message": msg}), flush=True)
    sys.exit(1)

# ── Uganda constants ──────────────────────────────────────────────────────────
UGANDA_BBOX_COORDS = (29.5, -1.5, 35.0, 4.2)   # (minx, miny, maxx, maxy)
UGANDA_CENTER      = (1.3733, 32.2903)

# Default boundary file — bundled with the project
SCRIPT_DIR         = Path(__file__).parent
DEFAULT_BOUNDARY   = SCRIPT_DIR / "../../frontend/public/data/uganda-boundary.geojson"
OUTPUT_DIR         = SCRIPT_DIR / "output"


def emit(obj: dict):
    """Write a single JSON-line progress event to stdout."""
    print(json.dumps(obj), flush=True)


def load_uganda_geometry(boundary_path: Path):
    """Load Uganda polygon and return (geometry_list, bbox_tuple)."""
    if boundary_path.exists():
        emit({"status": "info", "message": f"Loading boundary from {boundary_path}"})
        gdf = gpd.read_file(str(boundary_path)).to_crs("EPSG:4326")
        geom_list = [gdf.geometry.unary_union]
        minx, miny, maxx, maxy = gdf.total_bounds
    else:
        emit({
            "status": "warn",
            "message": "uganda-boundary.geojson not found — using hardcoded bounding box",
        })
        minx, miny, maxx, maxy = UGANDA_BBOX_COORDS
        geom_list = None          # no polygon clipping, bbox only

    return geom_list, (minx, miny, maxx, maxy)


def build_config() -> "SHConfig":
    """Build Sentinel Hub config from environment variables."""
    cfg = SHConfig()
    cfg.instance_id       = os.environ.get("SENTINEL_INSTANCE_ID", "")
    cfg.sh_client_id      = os.environ.get("SENTINEL_CLIENT_ID",    "")
    cfg.sh_client_secret  = os.environ.get("SENTINEL_CLIENT_SECRET", "")

    if not cfg.instance_id:
        raise ValueError(
            "SENTINEL_INSTANCE_ID is not set. "
            "Add it to backend/.env or export it as an environment variable."
        )
    return cfg


def generate_monthly_intervals(months: int):
    """Return list of (start, end) string pairs for the past `months` months."""
    end   = datetime.now(timezone.utc)
    start = end - timedelta(days=30 * months)
    dates = [start + timedelta(days=30 * i) for i in range(months + 1)]
    return [
        (dates[i].strftime("%Y-%m-%d"), dates[i + 1].strftime("%Y-%m-%d"))
        for i in range(len(dates) - 1)
    ]


def fetch_layer_timeseries(
    layer: str,
    intervals,
    bbox: "BBox",
    bbox_coords: tuple,
    geom_list,
    config: "SHConfig",
    width: int,
    height: int,
    tmpdir: str,
    total_steps: int,
    step_offset: int,
) -> "np.ndarray":
    """
    Fetch monthly WMS tiles for one layer and clip each to Uganda polygon.
    Returns stacked numpy array of shape (months, height, width).
    """
    minx, miny, maxx, maxy = bbox_coords
    time_series = []

    for idx, (t_start, t_end) in enumerate(intervals):
        global_step = step_offset + idx
        emit({
            "status":   "running",
            "step":     f"{layer} {t_start[:7]}",
            "progress": global_step,
            "total":    total_steps,
        })

        request = WmsRequest(
            layer          = layer,
            bbox           = bbox,
            width          = width,
            height         = height,
            config         = config,
            image_format   = MimeType.TIFF,
            time           = (t_start, t_end),
        )

        images = request.get_data()
        if not images:
            # Fill with NaN slice if no data returned (e.g. 100% cloud cover)
            emit({"status": "warn", "message": f"No data for {layer} {t_start}/{t_end} — filling with NaN"})
            time_series.append(np.full((height, width), np.nan, dtype=np.float32))
            continue

        data = images[0].astype(np.float32)
        if data.ndim == 3:
            data = data[:, :, 0]          # take first band if multi-band

        # Clip to Uganda polygon if GeoJSON was loaded
        if geom_list is not None:
            tmp_tif = os.path.join(tmpdir, f"tmp_{layer}_{idx}.tif")
            transform = from_bounds(minx, miny, maxx, maxy, data.shape[1], data.shape[0])
            with rasterio.open(
                tmp_tif, "w",
                driver="GTiff", height=data.shape[0], width=data.shape[1],
                count=1, dtype=data.dtype, crs="EPSG:4326", transform=transform,
            ) as dst:
                dst.write(data, 1)

            with rasterio.open(tmp_tif) as src:
                out_img, _ = rasterio_mask(src, geom_list, crop=False, nodata=np.nan)
            data = out_img[0]

        time_series.append(data)

    return np.stack(time_series)           # shape: (months, H, W)


def run(
    layers:  list,
    months:  int,
    width:   int,
    height:  int,
    output:  str,
    boundary: Path,
):
    emit({"status": "start", "layers": layers, "months": months})

    # Validate credentials
    try:
        config = build_config()
    except ValueError as exc:
        emit({"status": "error", "message": str(exc)})
        sys.exit(1)

    # Load Uganda boundary
    geom_list, bbox_coords = load_uganda_geometry(boundary)
    minx, miny, maxx, maxy = bbox_coords
    ug_bbox = BBox(bbox=[minx, miny, maxx, maxy], crs=CRS.WGS84)

    # Time intervals
    intervals   = generate_monthly_intervals(months)
    total_steps = len(layers) * len(intervals)
    emit({"status": "info", "message": f"{len(intervals)} monthly intervals × {len(layers)} layers = {total_steps} tiles"})

    # Output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / output

    cube_data = {}

    with tempfile.TemporaryDirectory() as tmpdir:
        for layer_idx, layer in enumerate(layers):
            step_offset = layer_idx * len(intervals)
            arr = fetch_layer_timeseries(
                layer       = layer,
                intervals   = intervals,
                bbox        = ug_bbox,
                bbox_coords = bbox_coords,
                geom_list   = geom_list,
                config      = config,
                width       = width,
                height      = height,
                tmpdir      = tmpdir,
                total_steps = total_steps,
                step_offset = step_offset,
            )

            dates = [
                datetime.strptime(t_start, "%Y-%m-%d")
                for t_start, _ in intervals
            ]
            cube_data[layer] = xr.DataArray(
                arr,
                dims   = ["time", "y", "x"],
                coords = {"time": dates},
                attrs  = {
                    "long_name":   layer,
                    "source":      "Sentinel Hub WMS",
                    "bbox":        f"{minx},{miny},{maxx},{maxy}",
                    "crs":         "EPSG:4326",
                    "clipped_to":  "Uganda national boundary",
                    "created_at":  datetime.now(timezone.utc).isoformat(),
                },
            )

    # Build dataset
    dataset = xr.Dataset(
        cube_data,
        attrs={
            "title":       "Uganda Agricultural Raster Time-Series Cube",
            "institution": "Uganda DDSS / AgriSmart",
            "source":      "Copernicus Sentinel-2 via Sentinel Hub WMS",
            "layers":      ", ".join(layers),
            "bbox":        f"{minx},{miny},{maxx},{maxy}",
            "temporal_resolution": "monthly",
            "months":      months,
        },
    )

    dataset.to_netcdf(str(output_path))

    emit({
        "status":   "done",
        "output":   str(output_path),
        "size_mb":  round(output_path.stat().st_size / 1_048_576, 2),
        "layers":   layers,
        "months":   months,
        "intervals": len(intervals),
    })


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Uganda Raster Time-Series Cube Builder")
    parser.add_argument("--layers",   nargs="+", default=["NDVI", "EVI", "MOISTURE-INDEX"],
                        help="Sentinel Hub layer names")
    parser.add_argument("--months",   type=int,  default=12,
                        help="Number of past months to include")
    parser.add_argument("--width",    type=int,  default=512)
    parser.add_argument("--height",   type=int,  default=512)
    parser.add_argument("--output",   default="uganda_time_series_cube.nc")
    parser.add_argument("--boundary", default=str(DEFAULT_BOUNDARY),
                        help="Path to Uganda boundary GeoJSON")

    args = parser.parse_args()

    run(
        layers   = args.layers,
        months   = args.months,
        width    = args.width,
        height   = args.height,
        output   = args.output,
        boundary = Path(args.boundary),
    )
