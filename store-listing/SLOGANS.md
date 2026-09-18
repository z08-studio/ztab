# Ztab slogan options

The approved visual identity is **B1, Tab Hub, in P2 indigo**: `#493567` and `#A996CC`. The slogan remains open for selection. The promo previews currently use **A**; this does not finalize the wording in the listing or options page.

| Option | English | 中文意译 | Tone |
| --- | --- | --- | --- |
| A | **The last tab manager you’ll need.** | 用过，就不想再换的标签页管理器。 | 自信直接，最贴近原始定位 |
| B | **The tab manager you’ll want to keep.** | 让你愿意一直用下去的标签页管理器。 | 温和，强调长期使用 |
| C | **Every tab. Every window. In order.** | 每个标签，每个窗口，都井井有条。 | 功能清晰，突出跨窗口管理 |
| D | **Less tab chaos. More focus.** | 少些标签纷扰，多些专注。 | 简短，强调用户收益 |
| E | **Your tabs, thoughtfully managed.** | 每个标签，都被用心打理。 | 成熟克制，呼应交互细节 |
| F | **Your browser, a little more organized.** | 让你的浏览器，多一分井然有序。 | 轻松友好，保留亲和力 |

**Recommendation:** A is closest to the requested long-term, definitive-choice positioning. E is the quieter alternative and fits the restrained P2 visual identity. C can also work as supporting copy beneath a brand slogan.

Use **tab manager**, not **top manager**, in English product copy. The Chinese lines are adaptations of the meaning rather than mandatory literal translations.

## Review assets

- `assets/review/slogan-options.png`: six options with Chinese explanations.
- `assets/review/slogans/slogan-A-440x280.png` through `slogan-F-440x280.png`: each option in the actual small promo layout.
- `assets/final/promo-small-440x280.png` and `promo-marquee-1400x560.png`: previews using the candidate named by `previewCandidate`.
- `assets/review/screenshots-overview.png`: the five feature screenshots, whose headlines are independent of the brand slogan.

Candidate text and line breaks live in `source/slogans.json`. Run `pnpm assets:store` after changing the preview candidate. Once wording is selected, update this status, the positioning and opening line in `LISTING.md`, the README positioning, and the options-page tagline together.

The Store summary can remain descriptive: “Manage tabs across Chrome windows, keep pinned tabs in sync, and move faster with keyboard shortcuts.” This keeps the listing clear even when the brand slogan is more expressive.
