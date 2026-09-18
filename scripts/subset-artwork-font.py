"""Prepare the licensed Chinese artwork face when its copy gains new characters.

Requires fonttools. Pass the original Noto Serif SC variable TTF as argv[1].
The normal pnpm assets:store command uses the already bundled static subset.
"""

import hashlib
import json
import sys
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1])
fonts = root / "store-listing/source/fonts"
copy = (root / "scripts/render-store-assets.mjs").read_text()
copy += (root / "store-listing/source/slogan.json").read_text()

# A static face avoids platform-dependent variable-font weight selection.
font = instantiateVariableFont(TTFont(source), {"wght": 600}, inplace=True)
font.recalcTimestamp = False
options = Options()
options.name_IDs = ["*"]
options.name_legacy = True
options.name_languages = ["*"]
subsetter = Subsetter(options=options)
subsetter.populate(text="".join(sorted(set(copy))) + "".join(chr(i) for i in range(32, 127)))
subsetter.subset(font)
names = {
    1: "Ztab Editorial SC", 2: "SemiBold", 3: "ZtabEditorialSC-Semibold-20260918",
    4: "Ztab Editorial SC SemiBold", 6: "ZtabEditorialSC-Semibold",
    16: "Ztab Editorial SC", 17: "SemiBold",
}
for record in font["name"].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font.save(fonts / "ZtabEditorialSC-Semibold.ttf")
metadata = {
    "family": "Ztab Editorial SC",
    "weight": 600,
    "source": "https://github.com/google/fonts/blob/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
    "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "characters": "".join(chr(codepoint) for codepoint in sorted(font.getBestCmap())),
}
(fonts / "cjk-coverage.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
print(f"Prepared static Noto Serif SC subset with {len(metadata['characters'])} characters")
