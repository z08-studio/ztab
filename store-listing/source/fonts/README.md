# Artwork fonts

All production artwork uses the bundled files with system-font loading disabled. The captured interface retains its original text as screenshot pixels.

| Face | Use | License / source |
| --- | --- | --- |
| Manrope Medium and Bold | Explanations, small labels | `OFL.txt`; [Manrope](https://github.com/sharanda/manrope) |
| Manrope ExtraBold | Historical artwork, retained source | `OFL.txt` |
| Instrument Serif Regular | English display headlines | `InstrumentSerif-OFL.txt`; [Google Fonts source](https://github.com/google/fonts/tree/main/ofl/instrumentserif) |
| Ztab Editorial SC SemiBold | Chinese headlines and captions | `NotoSerifSC-OFL.txt`; static subset of [Noto Serif SC](https://github.com/google/fonts/tree/main/ofl/notoserifsc), weight 600 |

Instrument Serif and Noto Serif SC were retrieved from the Google Fonts repository on 2026-09-18. The Chinese derivative has a distinct family name. Its copyright and license remain intact; this is a size-reduced subset, not a newly designed typeface.

## Updating Chinese copy

The included static Chinese face contains the characters used by the renderer, plus basic Latin. `cjk-coverage.json` records coverage and the SHA-256 of the original variable font. The renderer fails with an actionable error if Chinese copy needs a missing character instead of silently producing tofu or using an arbitrary system fallback.

To extend the subset, obtain the original Noto Serif SC variable TTF from the linked official source, install `fonttools` into a local Python environment, then run:

```sh
python scripts/subset-artwork-font.py /path/to/NotoSerifSC-variable.ttf
pnpm assets:store
```

The helper fixes the weight at 600, subsets the renderer and slogan source text, preserves license metadata, renames the derivative, and records coverage. It is an authoring utility only; the normal asset build does not need Python or a font download.
