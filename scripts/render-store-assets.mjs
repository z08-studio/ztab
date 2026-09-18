import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { Resvg } from "@resvg/resvg-js";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = join(projectRoot, "store-listing", "source");
const finalDirectory = join(projectRoot, "store-listing", "assets", "final");
const reviewDirectory = join(projectRoot, "store-listing", "assets", "review");
const capturesRoot = join(projectRoot, "store-listing", "assets", "source", "screenshots");
const fontFiles = ["Medium", "Bold", "ExtraBold"].map((weight) => join(sourceDirectory, "fonts", `Manrope-${weight}.otf`));
const colors = { bg: "#F7F5FA", paper: "#FFFFFF", ink: "#292535", primary: "#493567", secondary: "#A996CC", muted: "#80728D", line: "#E3DBEC", wash: "#EEE8F5" };
const escapeXml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const dataUri = (buffer) => `data:image/png;base64,${buffer.toString("base64")}`;
const text = (x, y, value, size = 22, fill = colors.ink, weight = 500, extra = "") =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="Manrope" font-size="${size}" font-weight="${weight}" ${extra}>${escapeXml(value)}</text>`;

async function render(svg, path, width, { opaque = false, chinese = false } = {}) {
  const renderer = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { fontFiles, loadSystemFonts: chinese, defaultFontFamily: "Manrope" },
  });
  const png = renderer.render().asPng();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, opaque ? PNG.sync.write(PNG.sync.read(png), { colorType: 2, inputColorType: 6 }) : png);
}

const provenance = JSON.parse(await readFile(join(capturesRoot, "capture-provenance.json"), "utf8"));
const captures = {};
// Verify all privacy-cropped inputs before replacing generated assets.
for (const capture of provenance.captures) {
  const buffer = await readFile(join(capturesRoot, capture.file));
  const decoded = PNG.sync.read(buffer);
  if (decoded.width !== capture.width || decoded.height !== capture.height) {
    throw new Error(`${capture.file}: expected ${capture.width}×${capture.height}, got ${decoded.width}×${decoded.height}. Recheck capture provenance.`);
  }
  captures[capture.file] = { ...capture, uri: dataUri(buffer) };
}
const slogans = JSON.parse(await readFile(join(sourceDirectory, "slogans.json"), "utf8"));
const previewSlogan = slogans.candidates.find(({ id }) => id === slogans.previewCandidate);
if (!previewSlogan) throw new Error("The preview slogan must match a candidate.");
const iconSvg = await readFile(join(sourceDirectory, "icon.svg"), "utf8");
const smallIconSvg = await readFile(join(sourceDirectory, "icon-small.svg"), "utf8");
for (const size of [16, 32, 48, 128]) {
  await render(size <= 32 ? smallIconSvg : iconSvg, join(projectRoot, "icons", `icon${size}.png`), size);
}
const iconUri = dataUri(await readFile(join(projectRoot, "icons", "icon128.png")));

function brand(x, y, size = 44, wordSize = 32) {
  return `<image href="${iconUri}" x="${x}" y="${y}" width="${size}" height="${size}"/>${text(x + size + 10, y + size * 0.77, "Ztab", wordSize, colors.ink, 800, 'letter-spacing="-1"')}`;
}

function page(width, height, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#493567" flood-opacity=".12"/></filter></defs>
    <rect width="${width}" height="${height}" fill="${colors.bg}"/>${content}</svg>`;
}

function captureImage(capture, x, y, width, frame = true) {
  const height = width * capture.height / capture.width;
  return `${frame ? `<rect x="${x - 1}" y="${y - 1}" width="${width + 2}" height="${height + 2}" rx="4" fill="${colors.paper}" stroke="${colors.line}" filter="url(#shadow)"/>` : ""}
    <image href="${capture.uri}" x="${x}" y="${y}" width="${width}" height="${height}"/>`;
}

const specs = [
  {
    source: "side-panel-raw.png", output: "screenshot-01-side-panel.png", pillar: "ACROSS WINDOWS",
    title: ["Every window.", "One clear view."], supporting: ["Your open pages, together in one", "live side panel."],
    benefits: [["See every window", "Find open pages in one live list."], ["Switch, move, or close", "Manage tabs across your windows."], ["Bring windows together", "Merge another window into this one."]],
    imageY: 176, footnote: "Real Ztab panel · Public sites in two Chrome windows",
  },
  {
    source: "pinned-tabs-raw.png", output: "screenshot-02-pinned-tabs.png", pillar: "PINNED TABS",
    title: ["Pin once.", "Ready in every", "window."], supporting: ["Keep your everyday sites close", "as you move between windows."],
    benefits: [["Your everyday sites", "One pinned set within your Chrome profile."], ["Pin and unpin once", "Let the other eligible windows follow."], ["Keep browsing your way", "Regular tabs stay in their own windows."]],
    imageY: 270, caption: "Wikipedia pinned in two Chrome windows", footnote: "Pinned-tab sync stays within the same Chrome profile",
  },
  {
    source: "keyboard-raw.png", output: "screenshot-03-keyboard.png", pillar: "KEYBOARD SHORTCUTS",
    title: ["Find your tab.", "Keep your flow."], supporting: ["Open, search, and switch with", "familiar keyboard shortcuts."],
    benefits: [["Open with a shortcut", "Use the current Chrome assignment."], ["Find the next page", "Search, then use the arrow keys."], ["Switch with Enter", "Open the focused tab from the list."]],
    imageY: 126, imageWidth: 566, frame: false, footnote: "Mac shortcuts shown · Panel shortcut can be customized",
  },
  {
    source: "groups-bulk-raw.png", output: "screenshot-04-groups-bulk.png", pillar: "BULK ACTIONS",
    title: ["Select together.", "Act together."], supporting: ["Choose several tabs, even across", "windows. Take the next step once."],
    benefits: [["Select across windows", "Choose several regular tabs together."], ["Group or move them", "Organize related work in one action."], ["Close or save in bulk", "Clear a batch, or keep useful pages."]],
    imageY: 145, toolbar: true, footnote: "Pinned tabs are excluded from bulk selection",
  },
  {
    source: "saved-raw.png", output: "screenshot-05-saved.png", pillar: "SAVED PAGES",
    title: ["Save it now.", "Find it later."], supporting: ["Give useful pages a place to stay", "after their tabs are closed."],
    benefits: [["Keep pages for later", "Save useful links as you browse."], ["Make your own collections", "Give related pages a place together."], ["Find them again", "Search saved titles and website addresses."]],
    imageY: 220, caption: "A collection of real public pages, saved locally", footnote: "Saved is Ztab’s local library, separate from Chrome bookmarks",
  },
];

function screenshotSvg(spec, index) {
  const capture = captures[spec.source];
  const imageX = 654;
  const imageWidth = spec.imageWidth ?? 570;
  const imageHeight = capture.height / capture.width * imageWidth;
  const supportingY = 197 + (spec.title.length - 1) * 68 + 58;
  const benefitsY = supportingY + (spec.supporting.length - 1) * 31 + 80;
  return page(1280, 800, `
    <circle cx="1170" cy="95" r="245" fill="${colors.wash}"/>
    <rect x="625" y="114" width="626" height="612" rx="30" fill="${colors.wash}" fill-opacity=".66"/>
    ${brand(50, 37)}
    ${text(1227, 67, `${String(index + 1).padStart(2, "0")} / ${spec.pillar}`, 12, colors.muted, 700, 'text-anchor="end" letter-spacing="1.4"')}
    ${spec.title.map((line, i) => text(56, 197 + i * 68, line, 58, i ? colors.primary : colors.ink, 800, 'letter-spacing="-1.7"')).join("")}
    ${spec.supporting.map((line, i) => text(58, supportingY + i * 31, line, 22, colors.muted)).join("")}
    ${spec.benefits.map(([title, description], i) => `<rect x="58" y="${benefitsY + i * 72 - 18}" width="4" height="43" rx="2" fill="${colors.secondary}"/>
      ${text(78, benefitsY + i * 72, title, 20, colors.primary, 700)}${text(78, benefitsY + i * 72 + 28, description, 16.5, colors.muted)}`).join("")}
    ${captureImage(capture, imageX, spec.imageY, imageWidth, spec.frame !== false)}
    ${spec.caption ? text(imageX + imageWidth / 2, spec.imageY + imageHeight + 34, spec.caption, 13, colors.muted, 500, 'text-anchor="middle"') : ""}
    ${spec.toolbar ? `${text(imageX, 579, "ACTION BAR · SAME SELECTION", 11, colors.muted, 700, 'letter-spacing="1.1"')}${captureImage(captures["bulk-toolbar-raw.png"], imageX, 596, imageWidth)}` : ""}
    ${text(56, 765, "Ztab 2.0 · Chrome tab manager", 12, colors.muted)}
    ${text(1226, 765, spec.footnote, 11.5, colors.muted, 500, 'text-anchor="end"')}
  `);
}

function promoSvg(slogan, small) {
  if (small) return page(440, 280, `
    <circle cx="419" cy="21" r="105" fill="${colors.wash}"/>${brand(23, 22, 38, 29)}
    ${slogan.lines.map((line, i) => text(29, 132 + i * 39, line, 28, i ? colors.primary : colors.ink, 800, 'letter-spacing="-.75"')).join("")}
    <path d="M30 207H408" stroke="${colors.line}"/>${text(30, 247, "Windows  ·  Pins  ·  Shortcuts", 15, colors.muted, 700)}
  `);
  return page(1400, 560, `
    <circle cx="1290" cy="60" r="300" fill="${colors.wash}"/>${brand(55, 38, 48, 36)}
    ${slogan.lines.map((line, i) => text(64, 224 + i * 65, line, 49, i ? colors.primary : colors.ink, 800, 'letter-spacing="-1.5"')).join("")}
    ${text(67, 355, "Your Chrome windows, brought together.", 22, colors.muted)}
    ${["Across windows", "Shared pins", "Fast shortcuts"].map((label, i) => `<rect x="${64 + i * 199}" y="420" width="185" height="57" rx="12" fill="${colors.wash}"/>${text(156.5 + i * 199, 455, label, 16, colors.primary, 700, 'text-anchor="middle"')}`).join("")}
    ${captureImage(captures["side-panel-raw.png"], 827, 75, 510)}
  `);
}

for (const [index, spec] of specs.entries()) {
  await render(screenshotSvg(spec, index), join(finalDirectory, "screenshots", spec.output), 1280, { opaque: true });
}
await render(promoSvg(previewSlogan, true), join(finalDirectory, "promo-small-440x280.png"), 440, { opaque: true });
await render(promoSvg(previewSlogan, false), join(finalDirectory, "promo-marquee-1400x560.png"), 1400, { opaque: true });
for (const slogan of slogans.candidates) {
  await render(promoSvg(slogan, true), join(reviewDirectory, "slogans", `slogan-${slogan.id}-440x280.png`), 440, { opaque: true });
}

const sloganBoard = page(1760, 1350, `
  ${brand(45, 38, 48, 38)}${text(216, 76, "Slogan · 6 directions", 32, colors.ink, 700)}
  <text x="48" y="128" font-family="Heiti SC" font-size="23" fill="${colors.muted}">A 最贴近原意；E 更成熟克制。配图预览暂用 A，等待最终选择。</text>
  ${slogans.candidates.map((slogan, i) => {
    const x = 48 + (i % 2) * 848;
    const y = 178 + Math.floor(i / 2) * 374;
    return `<g transform="translate(${x} ${y})"><rect width="816" height="346" rx="22" fill="${colors.paper}" stroke="${colors.line}"/>
      <rect x="28" y="28" width="42" height="38" rx="10" fill="${colors.wash}"/>${text(49, 55, slogan.id, 23, colors.primary, 800, 'text-anchor="middle"')}
      <text x="91" y="54" font-family="Heiti SC" font-size="21" fill="${colors.muted}">${escapeXml(slogan.tone)}</text>
      ${slogan.lines.map((line, j) => text(32, 137 + j * 55, line, 42, colors.primary, 800, 'letter-spacing="-1.1"')).join("")}
      <path d="M32 241H784" stroke="${colors.line}"/>
      <text x="32" y="291" font-family="Heiti SC" font-size="23" fill="${colors.muted}">${escapeXml(slogan.chinese)}</text>
    </g>`;
  }).join("")}
`);
await render(sloganBoard, join(reviewDirectory, "slogan-options.png"), 1760, { opaque: true, chinese: true });

const thumbnails = await Promise.all(specs.map(async (spec) => dataUri(await readFile(join(finalDirectory, "screenshots", spec.output)))));
const overview = page(1368, 1632, `
  ${brand(36, 35, 44, 34)}${text(216, 70, "Chrome Web Store · Artwork review", 27, colors.ink, 700)}
  ${text(40, 119, "B + P2  /  Real Chrome captures  /  1280 × 800 each", 18, colors.muted)}
  ${thumbnails.map((uri, i) => {
    const x = 32 + (i % 2) * 672;
    const y = 164 + Math.floor(i / 2) * 476;
    return `<rect x="${x - 1}" y="${y - 1}" width="642" height="402" fill="${colors.paper}" stroke="${colors.line}"/><image href="${uri}" x="${x}" y="${y}" width="640" height="400"/>${text(x + 12, y + 435, `${i + 1}. ${specs[i].pillar}`, 17, colors.primary, 700)}`;
  }).join("")}
  <rect x="704" y="1116" width="640" height="400" rx="22" fill="${colors.wash}"/>${brand(805, 1160, 72, 48)}
  ${text(764, 1291, "A clearer view of", 35, colors.primary, 800)}${text(764, 1342, "what Ztab can do.", 35, colors.primary, 800)}
  ${text(764, 1420, "Slogan candidates are reviewed separately.", 20, colors.muted)}
  ${text(40, 1600, "Review sheet only. Upload the five individual screenshots.", 17, colors.muted)}
`);
await render(overview, join(reviewDirectory, "screenshots-overview.png"), 1368, { opaque: true });
console.log(`Rendered approved P2 icons, five real-site screenshots, promo previews, and ${slogans.candidates.length} slogan options (${slogans.status}).`);
