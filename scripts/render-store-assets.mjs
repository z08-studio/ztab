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
const fontFiles = [
  "Manrope-Medium.otf",
  "Manrope-Bold.otf",
  "InstrumentSerif-Regular.ttf",
  "ZtabEditorialSC-Semibold.ttf",
].map((file) => join(sourceDirectory, "fonts", file));
const cjkCoverage = JSON.parse(await readFile(join(sourceDirectory, "fonts", "cjk-coverage.json"), "utf8"));
const cjkCharacters = new Set(cjkCoverage.characters);
const colors = {
  paper: "#F5F2ED",
  ink: "#292535",
  primary: "#493567",
  secondary: "#A996CC",
  muted: "#746E77",
  line: "#D4CDC7",
  lilac: "#E8E0ED",
  night: "#382B47",
  light: "#F5F0EA",
  lightMuted: "#CFC3D8",
  darkLine: "#6E5E7E",
};
const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const dataUri = (buffer) => `data:image/png;base64,${buffer.toString("base64")}`;

function text(x, y, value, { size = 22, fill = colors.ink, weight = 500, family = "Manrope", tracking = 0, anchor = "start" } = {}) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${tracking}" text-anchor="${anchor}">${escapeXml(value)}</text>`;
}
const label = (x, y, value, options = {}) => text(x, y, value, { size: 11, weight: 700, tracking: 1.6, fill: colors.muted, ...options });
const headline = (x, y, value, options = {}) => text(x, y, value, { size: 88, weight: 400, family: "Instrument Serif", tracking: -0.8, ...options });
function chinese(x, y, value, options = {}) {
  const missing = [...value].filter((character) => !cjkCharacters.has(character));
  if (missing.length) {
    throw new Error(`Chinese artwork font is missing ${[...new Set(missing)].join("")}. Rebuild its subset as described in source/fonts/README.md.`);
  }
  return text(x, y, value, { size: 30, weight: 600, family: "Ztab Editorial SC", ...options });
}
const rule = (x1, y1, x2, y2, color = colors.line) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}"/>`;

function page(width, height, content, background = colors.paper) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${background}"/>${content}</svg>`;
}

async function render(svg, path, width, { opaque = true } = {}) {
  const renderer = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "Manrope" },
  });
  const png = renderer.render().asPng();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, opaque ? PNG.sync.write(PNG.sync.read(png), { colorType: 2, inputColorType: 6 }) : png);
}

const provenance = JSON.parse(await readFile(join(capturesRoot, "capture-provenance.json"), "utf8"));
const captures = {};
// Validate the approved, privacy-cropped sources before regenerating deliverables.
for (const capture of provenance.captures) {
  const buffer = await readFile(join(capturesRoot, capture.file));
  const decoded = PNG.sync.read(buffer);
  if (decoded.width !== capture.width || decoded.height !== capture.height) {
    throw new Error(`${capture.file}: expected ${capture.width}×${capture.height}, got ${decoded.width}×${decoded.height}. Recheck capture provenance.`);
  }
  captures[capture.file] = { ...capture, uri: dataUri(buffer) };
}
const slogan = JSON.parse(await readFile(join(sourceDirectory, "slogan.json"), "utf8"));
if (slogan.status !== "approved" || slogan.lines.join(" ") !== slogan.text || slogan.heroLines.join(" ") !== slogan.text) {
  throw new Error("Marketing artwork requires approved, consistent slogan text.");
}
const marks = {};
for (const variant of ["wordmark", "wordmark-light"]) {
  const svg = await readFile(join(sourceDirectory, `${variant}.svg`), "utf8");
  marks[variant] = svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"));
}
// Crop only the original lockup's outer whitespace; its outlined geometry stays intact.
function brand(x, y, width = 144, dark = false) {
  return `<svg x="${x}" y="${y}" width="${width}" height="${width / 3}" viewBox="35 40 480 160">${marks[dark ? "wordmark-light" : "wordmark"]}</svg>`;
}

function captureImage(name, x, y, width, { border = true } = {}) {
  const capture = captures[name];
  const height = width * capture.height / capture.width;
  return `${border ? `<rect x="${x - 1}" y="${y - 1}" width="${width + 2}" height="${height + 2}" fill="#FFFFFF" stroke="#BFB5C8"/>` : ""}
    <image href="${capture.uri}" x="${x}" y="${y}" width="${width}" height="${height}"/>`;
}

function storeHeader(number, title, dark = false) {
  return `${brand(48, 32, 144, dark)}
    ${label(1232, 64, `${number} / ${title}`, { anchor: "end", fill: dark ? colors.lightMuted : colors.muted })}`;
}

function storeFooter(note, { dark = false, hero = false } = {}) {
  const fill = dark ? colors.lightMuted : colors.muted;
  return `${rule(48, 736, 1232, 736, dark ? colors.darkLine : colors.line)}
    ${text(48, 768, hero ? "Ztab 2.0 / Built for Chrome" : slogan.text, { size: 14, fill })}
    ${text(1232, 768, note, { size: 11, fill, anchor: "end" })}`;
}

const screenshots = [
  {
    file: "screenshot-01-side-panel.png",
    title: "Across windows",
    svg: () => page(1280, 800, `
      ${storeHeader("01", "ACROSS WINDOWS")}
      ${slogan.heroLines.map((line, i) => headline(52, 211 + i * 89, line, { size: 96, fill: i === 2 ? colors.primary : colors.ink })).join("")}
      ${text(56, 469, "Every window, in view.", { size: 25, weight: 700 })}
      ${text(56, 508, "Find, move and close your open tabs", { size: 18, fill: colors.muted })}
      ${text(56, 536, "from one live side panel.", { size: 18, fill: colors.muted })}
      ${rule(56, 586, 558, 586)}
      ${["Windows", "Pinned tabs", "Keyboard"].map((value, i) => `${label(56 + i * 176, 624, `0${i + 1}`)}${text(56 + i * 176, 655, value, { size: 17, weight: 700, fill: colors.primary })}`).join("")}
      ${rule(611, 144, 611, 695)}
      ${captureImage("side-panel-raw.png", 650, 160, 584)}
      ${label(650, 694, "PUBLIC PAGES / TWO CHROME WINDOWS", { size: 10, tracking: 1.2 })}
      ${storeFooter("Across windows · Shared pins · Keyboard shortcuts", { hero: true })}
    `),
  },
  {
    file: "screenshot-02-pinned-tabs.png",
    title: "Pinned tabs",
    svg: () => page(1280, 800, `
      ${storeHeader("02", "PINNED TABS", true)}
      ${headline(52, 210, "Pin once.", { size: 110, fill: colors.light })}
      ${text(758, 151, "Keep your everyday sites", { size: 24, fill: colors.light })}
      ${text(758, 185, "in every window.", { size: 24, fill: colors.light })}
      ${text(758, 225, "One pinned set. One Chrome profile.", { size: 14, fill: colors.lightMuted })}
      ${captureImage("pinned-tabs-raw.png", 198, 268, 884)}
      ${storeFooter("Wikipedia, pinned in two real windows", { dark: true })}
    `, colors.night),
  },
  {
    file: "screenshot-03-keyboard.png",
    title: "Keyboard shortcuts",
    svg: () => page(1280, 800, `
      ${storeHeader("03", "KEYBOARD SHORTCUTS")}
      ${headline(52, 218, "Stay in flow.", { size: 91 })}
      ${text(56, 278, "The next page is a few keystrokes away.", { size: 21, fill: colors.muted })}
      ${[
        ["Open the panel", "Use your assigned Chrome shortcut."],
        ["Find your page", "Search, then move with the arrow keys."],
        ["Press Enter", "Switch straight to the focused tab."],
      ].map(([title, detail], i) => `
        ${rule(56, 349 + i * 112, 574, 349 + i * 112)}
        ${label(56, 394 + i * 112, `0${i + 1}`, { fill: colors.primary })}
        ${text(107, 395 + i * 112, title, { size: 24, weight: 700 })}
        ${text(107, 426 + i * 112, detail, { size: 16, fill: colors.muted })}
      `).join("")}
      ${captureImage("keyboard-raw.png", 675, 141, 549, { border: false })}
      ${storeFooter("Mac example · Customize the panel shortcut in Chrome")}
    `),
  },
  {
    file: "screenshot-04-groups-bulk.png",
    title: "Bulk actions",
    svg: () => page(1280, 800, `
      ${storeHeader("04", "BULK ACTIONS")}
      ${headline(52, 210, "A little less", { size: 89 })}
      ${headline(52, 298, "tab juggling.", { size: 89, fill: colors.primary })}
      ${text(56, 378, "Select across windows. Group, move,", { size: 21, fill: colors.muted })}
      ${text(56, 411, "close or save in one go.", { size: 21, fill: colors.muted })}
      ${rule(56, 479, 557, 479, "#C9BDCF")}
      ${headline(53, 607, "4", { size: 130, fill: colors.primary })}
      ${text(139, 561, "tabs selected", { size: 25, weight: 700 })}
      ${text(139, 598, "across two windows", { size: 18, fill: colors.muted })}
      ${label(56, 674, "ONE SELECTION. A FEW GOOD OPTIONS.", { size: 10, tracking: 1.2 })}
      ${captureImage("groups-bulk-raw.png", 650, 139, 574)}
      ${label(650, 575, "ACTION BAR / SAME SELECTION", { size: 10, tracking: 1.2 })}
      ${captureImage("bulk-toolbar-raw.png", 650, 597, 574)}
      ${storeFooter("Pinned tabs stay outside bulk selection")}
    `, colors.lilac),
  },
  {
    file: "screenshot-05-saved.png",
    title: "Saved pages",
    svg: () => page(1280, 800, `
      ${storeHeader("05", "SAVED PAGES")}
      ${headline(52, 207, "Worth keeping.", { size: 99 })}
      ${text(803, 156, "A home for useful pages,", { size: 22, fill: colors.muted })}
      ${text(803, 189, "after their tabs are closed.", { size: 22, fill: colors.muted })}
      ${captureImage("saved-raw.png", 56, 255, 702)}
      ${[
        ["Save", "Keep a page for later."],
        ["Collect", "Make room for a topic."],
        ["Find again", "Search your saved pages."],
      ].map(([title, detail], i) => `
        ${rule(841, 292 + i * 135, 1224, 292 + i * 135)}
        ${headline(838, 351 + i * 135, title, { size: 48, fill: colors.primary })}
        ${text(841, 388 + i * 135, detail, { size: 17, fill: colors.muted })}
      `).join("")}
      ${storeFooter("Your local page library · Separate from Chrome bookmarks")}
    `),
  },
];

function smallPromo() {
  return page(440, 280, `
    ${brand(24, 23, 121, true)}
    ${slogan.lines.map((line, i) => headline(26, 142 + i * 48, line, { size: 45, fill: colors.light, tracking: -0.2 })).join("")}
    ${rule(28, 223, 412, 223, "#847092")}
    ${label(28, 251, "WINDOWS / PINS / KEYBOARD", { size: 10, tracking: 1.5, fill: colors.lightMuted })}
  `, colors.primary);
}

function marqueePromo() {
  return page(1400, 560, `
    ${brand(48, 27, 150, true)}
    ${slogan.heroLines.map((line, i) => headline(51, 190 + i * 92, line, { size: 101, fill: colors.light })).join("")}
    ${rule(56, 435, 659, 435, colors.darkLine)}
    ${label(56, 479, "ACROSS WINDOWS / SHARED PINS / KEYBOARD SHORTCUTS", { size: 11, tracking: 1, fill: colors.lightMuted })}
    ${rule(738, 49, 738, 512, colors.darkLine)}
    ${captureImage("side-panel-raw.png", 811, 56, 520)}
  `, colors.night);
}

function socialHeader(number, title, dark = false) {
  return `${brand(64, 43, 174, dark)}
    ${label(1016, 84, `${number} / 05`, { size: 16, anchor: "end", fill: dark ? colors.lightMuted : colors.muted })}
    ${label(64, 157, title, { size: 14, fill: dark ? colors.lightMuted : colors.primary })}`;
}

function socialFooter(dark = false) {
  const fill = dark ? colors.lightMuted : colors.muted;
  return `${rule(64, 1367, 1016, 1367, dark ? colors.darkLine : colors.line)}
    ${text(64, 1409, slogan.text, { size: 21, fill })}
    ${label(1016, 1409, "ZTAB 2.0", { size: 12, fill, anchor: "end" })}`;
}

const socialCards = [
  {
    file: "01-跨窗口管理.png",
    title: "跨窗口管理",
    svg: () => page(1080, 1440, `
      ${socialHeader("01", "CHROME / TABS IN ORDER")}
      ${chinese(60, 267, "标签页，", { size: 75 })}
      ${chinese(60, 365, "终于理顺了。", { size: 75, fill: colors.primary })}
      ${slogan.lines.map((line, i) => headline(62, 438 + i * 50, line, { size: 54 })).join("")}
      ${captureImage("side-panel-raw.png", 100, 548, 880)}
      ${socialFooter()}
    `),
  },
  {
    file: "02-固定标签同步.png",
    title: "固定标签同步",
    svg: () => page(1080, 1440, `
      ${socialHeader("02", "PIN ONCE. READY IN EVERY WINDOW.", true)}
      ${chinese(60, 278, "常用网站，", { size: 77, fill: colors.light })}
      ${chinese(60, 381, "固定一次就好。", { size: 77, fill: colors.light })}
      ${chinese(64, 473, "换个窗口，常用网站还在。", { size: 31, fill: colors.lightMuted })}
      ${captureImage("pinned-tabs-raw.png", 64, 572, 952)}
      ${rule(64, 1141, 1016, 1141, colors.darkLine)}
      ${chinese(64, 1200, "截图里，Wikipedia 已固定在两个窗口。", { size: 28, fill: colors.light })}
      ${chinese(64, 1257, "同一 Chrome 配置下的窗口，共享固定标签。", { size: 25, fill: colors.lightMuted })}
      ${socialFooter(true)}
    `, colors.night),
  },
  {
    file: "03-键盘快捷操作.png",
    title: "键盘快捷操作",
    svg: () => page(1080, 1440, `
      ${socialHeader("03", "STAY IN FLOW")}
      ${chinese(60, 267, "找页面，", { size: 72 })}
      ${chinese(60, 359, "也能不离开键盘。", { size: 72 })}
      ${chinese(64, 431, "打开侧栏 → 搜索 → 回车切换", { size: 29, fill: colors.muted })}
      ${captureImage("keyboard-raw.png", 154, 488, 772, { border: false })}
      ${chinese(64, 1320, "Mac 快捷键示例，打开侧栏的快捷键可自定义。", { size: 24, fill: colors.muted })}
      ${socialFooter()}
    `),
  },
  {
    file: "04-稍后再看.png",
    title: "稍后再看",
    svg: () => page(1080, 1440, `
      ${socialHeader("04", "WORTH KEEPING")}
      ${chinese(60, 267, "现在先存下，", { size: 75 })}
      ${chinese(60, 365, "以后慢慢看。", { size: 75, fill: colors.primary })}
      ${chinese(64, 443, "把值得留的页面，收进 Saved。", { size: 31, fill: colors.muted })}
      ${captureImage("saved-raw.png", 64, 523, 952)}
      ${chinese(64, 1225, "按主题收进集合，关掉标签也找得到。", { size: 31 })}
      ${chinese(64, 1284, "Saved 是独立的本地收藏库。", { size: 25, fill: colors.muted })}
      ${socialFooter()}
    `),
  },
  {
    file: "05-批量整理.png",
    title: "批量整理",
    svg: () => page(1080, 1440, `
      ${socialHeader("05", "LESS TAB JUGGLING")}
      ${chinese(60, 267, "一次选中，", { size: 75 })}
      ${chinese(60, 365, "一起整理。", { size: 75, fill: colors.primary })}
      ${chinese(64, 443, "跨窗口多选，分组、移动、关闭或保存。", { size: 29, fill: colors.muted })}
      ${captureImage("groups-bulk-raw.png", 103, 492, 874)}
      ${chinese(103, 1144, "同一次选择的底部操作栏 · 单独截取", { size: 21, fill: colors.muted })}
      ${captureImage("bulk-toolbar-raw.png", 103, 1167, 874)}
      ${socialFooter()}
    `, colors.lilac),
  },
];

const iconSvg = await readFile(join(sourceDirectory, "icon.svg"), "utf8");
const smallIconSvg = await readFile(join(sourceDirectory, "icon-small.svg"), "utf8");
for (const size of [16, 32, 48, 128]) {
  await render(size <= 32 ? smallIconSvg : iconSvg, join(projectRoot, "icons", `icon${size}.png`), size, { opaque: false });
}
for (const spec of screenshots) {
  await render(spec.svg(), join(finalDirectory, "screenshots", spec.file), 1280);
}
await render(smallPromo(), join(finalDirectory, "promo-small-440x280.png"), 440);
await render(marqueePromo(), join(finalDirectory, "promo-marquee-1400x560.png"), 1400);
for (const spec of socialCards) {
  await render(spec.svg(), join(finalDirectory, "xiaohongshu", spec.file), 1080);
}

const screenshotThumbnails = await Promise.all(screenshots.map(async (spec) => dataUri(await readFile(join(finalDirectory, "screenshots", spec.file)))));
const promoSvg = smallPromo();
await render(page(1368, 1530, `
  ${brand(32, 27, 144)}${headline(230, 66, slogan.text, { size: 41 })}
  ${label(32, 115, "CHROME WEB STORE / FINAL ARTWORK")}
  ${screenshotThumbnails.map((uri, i) => {
    const x = 32 + (i % 2) * 672;
    const y = 155 + Math.floor(i / 2) * 451;
    return `<image href="${uri}" x="${x}" y="${y}" width="640" height="400"/>${label(x, y + 426, `0${i + 1} / ${screenshots[i].title.toUpperCase()}`, { size: 12 })}`;
  }).join("")}
  <svg x="704" y="1057" width="629" height="400" viewBox="0 0 440 280">${promoSvg.slice(promoSvg.indexOf(">") + 1, promoSvg.lastIndexOf("</svg>"))}</svg>
  ${label(704, 1483, "06 / SMALL PROMOTIONAL TILE", { size: 12 })}
`, "#E3DDD6"), join(reviewDirectory, "screenshots-overview.png"), 1368);

const socialThumbnails = await Promise.all(socialCards.map(async (spec) => dataUri(await readFile(join(finalDirectory, "xiaohongshu", spec.file)))));
await render(page(1780, 606, `
  ${brand(28, 24, 128)}${label(1752, 58, "XIAOHONGSHU / FINAL ARTWORK", { anchor: "end", size: 13 })}
  ${socialThumbnails.map((uri, i) => `<image href="${uri}" x="${28 + i * 348}" y="105" width="332" height="443"/>${chinese(28 + i * 348, 584, socialCards[i].title, { size: 19 })}`).join("")}
`, "#E3DDD6"), join(reviewDirectory, "xiaohongshu-overview.png"), 1780);

const marqueeThumbnail = dataUri(await readFile(join(finalDirectory, "promo-marquee-1400x560.png")));
await render(page(1400, 1230, `
  <image href="${marqueeThumbnail}" x="0" y="0" width="1400" height="560"/>
  ${label(56, 628, "COLOR / P2 WITH PAPER & INK")}
  ${[colors.primary, colors.secondary, colors.paper, colors.ink].map((fill, i) => `<rect x="${56 + i * 326}" y="659" width="302" height="82" fill="${fill}" stroke="#D4CDC7"/>${label(56 + i * 326, 773, fill)}`).join("")}
  ${rule(56, 819, 1344, 819)}
  ${label(56, 872, "TYPE / INSTRUMENT SERIF")}
  ${headline(53, 964, "A little room to think.", { size: 79 })}
  ${label(827, 872, "DETAIL / MANROPE")}
  ${text(827, 933, "Clear windows. Familiar keys.", { size: 25 })}
  ${text(827, 976, "Ztab — the everyday essentials.", { size: 20, fill: colors.muted })}
  ${rule(56, 1041, 1344, 1041)}
  ${label(56, 1096, "CHINESE / NOTO SERIF SC")}
  ${chinese(56, 1171, "让标签页，回到井井有条。", { size: 44 })}
`, colors.paper), join(reviewDirectory, "brand-overview.png"), 1400);

console.log("Rendered approved P2 icons, five Store screenshots, two promo tiles, five Xiaohongshu cards, and three overview sheets using the final A slogan.");
