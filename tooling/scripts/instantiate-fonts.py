"""Explicit one-time asset preparation; never called by checks or runtime.

Usage: Python with fonttools==4.66.1 on PYTHONPATH, followed by input directory
and output directory. Inputs are the pinned Google Fonts variable TTFs recorded
in apps/client/assets/provenance.json. No network or installation side effects.
"""

import sys
from pathlib import Path

import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

if fontTools.__version__ != "4.66.1":
    raise RuntimeError("Use the recorded fonttools 4.66.1 asset preparation tool")

source = Path(sys.argv[1])
destination = Path(sys.argv[2])
for input_name, output_name in [
    ("nunito-variable.ttf", "nunito-750.ttf"),
    ("tamil-variable.ttf", "noto-sans-tamil-750.ttf"),
]:
    font = TTFont(source / input_name)
    axes = {axis.axisTag: axis.defaultValue for axis in font["fvar"].axes}
    axes["wght"] = 750
    instance = instantiateVariableFont(font, axes, inplace=False)
    assert "fvar" not in instance
    assert instance["OS/2"].usWeightClass == 750
    instance.save(destination / output_name)
