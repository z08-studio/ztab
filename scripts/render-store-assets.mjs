import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { Resvg } from "@resvg/resvg-js";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = join(projectRoot, "store-listing", "source");
const finalDirectory = join(projectRoot, "store-listing", "assets", "final");
const screenshotSourceDirectory = join(
  projectRoot,
  "store-listing",
  "assets",
  "source",
  "screenshots",
);
const screenshotFinalDirectory = join(finalDirectory, "screenshots");
const fontFiles = ["Medium", "Bold", "ExtraBold"].map((weight) =>
  join(sourceDirectory, "fonts", `Manrope-${weight}.otf`),
);

function renderSvg(svg, outputPath, width, { removeAlpha = false } = {}) {
  const renderer = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      fontFiles,
      loadSystemFonts: false,
      defaultFontFamily: "Manrope",
    },
  });

  const rendered = renderer.render().asPng();
  const output = removeAlpha
    ? PNG.sync.write(PNG.sync.read(rendered), {
        colorType: 2,
        inputColorType: 6,
      })
    : rendered;

  return writeFile(outputPath, output);
}

function escapeDataUri(buffer) {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function windowMotif({ x, y, width, height, opacity = 1 }) {
  return `<g transform="translate(${x} ${y})" opacity="${opacity}">
    <rect width="${width}" height="${height}" rx="16" fill="#111C47" stroke="#506397" stroke-width="2"/>
    <path d="M0 46H${width}" stroke="#506397" stroke-width="2"/>
    <rect x="20" y="17" width="25" height="12" rx="4" fill="#FF846E"/>
    <rect x="53" y="17" width="25" height="12" rx="4" fill="#A58AFF"/>
    <rect x="86" y="17" width="25" height="12" rx="4" fill="#73DCC7"/>
    <rect x="20" y="67" width="${width - 40}" height="20" rx="6" fill="#263765"/>
    <rect x="20" y="101" width="${width - 78}" height="8" rx="4" fill="#506397"/>
    <rect x="20" y="124" width="${width - 108}" height="8" rx="4" fill="#3C4E7F"/>
  </g>`;
}

function promoSvg({ width, height, small, iconDataUri }) {
  if (small) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="smallShade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#070E2A"/>
            <stop offset="1" stop-color="#1B2456"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#smallShade)"/>
        <circle cx="421" cy="0" r="134" fill="none" stroke="#A58AFF" stroke-opacity=".15" stroke-width="26"/>
        <image href="${iconDataUri}" x="30" y="27" width="45" height="45"/>
        <text x="87" y="61" fill="#F3F6FF" font-family="Manrope" font-size="33" font-weight="800" letter-spacing="-1">Ztab</text>
        <text x="32" y="125" fill="#FFFFFF" font-family="Manrope" font-size="29" font-weight="800" letter-spacing="-.9">
          <tspan x="32" dy="0">Another excellent</tspan>
          <tspan x="32" dy="38" fill="#B7CCFF" font-size="27">tab manager for Chrome.</tspan>
        </text>
        <path d="M32 193H408" stroke="#677BAF" stroke-opacity=".35"/>
        <g font-family="Manrope" font-size="15" font-weight="700" fill="#DCE6FF">
          <circle cx="37" cy="228" r="4" fill="#FF846E"/><text x="50" y="233">Windows</text>
          <circle cx="183" cy="228" r="4" fill="#A58AFF"/><text x="196" y="233">Pins</text>
          <circle cx="293" cy="228" r="4" fill="#73DCC7"/><text x="306" y="233">Shortcuts</text>
        </g>
      </svg>`;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="marqueeShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#070E2A"/>
          <stop offset="1" stop-color="#1B2456"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#marqueeShade)"/>
      <circle cx="1200" cy="58" r="250" fill="#A58AFF" opacity=".05"/>
      <image href="${iconDataUri}" x="64" y="52" width="50" height="50"/>
      <text x="128" y="90" fill="#F3F6FF" font-family="Manrope" font-size="37" font-weight="800" letter-spacing="-1.2">Ztab</text>
      <text x="64" y="197" fill="#FFFFFF" font-family="Manrope" font-size="51" font-weight="800" letter-spacing="-1.7">
        <tspan x="64" dy="0">Another excellent</tspan>
        <tspan x="64" dy="66" fill="#B7CCFF">tab manager for Chrome.</tspan>
      </text>
      <text x="67" y="321" fill="#C6D4FA" font-family="Manrope" font-size="22" font-weight="500">A little more order. A lot less tab juggling.</text>
      ${windowMotif({ x: 939, y: 62, width: 320, height: 179, opacity: 0.65 })}
      ${windowMotif({ x: 875, y: 163, width: 320, height: 179 })}
      <path d="M1217 242v27a30 30 0 0 1-30 30h-18" fill="none" stroke="#73DCC7" stroke-width="3" stroke-linecap="round"/>
      <path d="m1178 290-10 9 10 9" fill="none" stroke="#73DCC7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${[
        { x: 64, color: "#FF846E", title: "Across windows", description: "View, move, and merge tabs across windows." },
        { x: 495, color: "#A58AFF", title: "Pinned tabs, in sync", description: "Keep your pinned apps close in every window." },
        { x: 926, color: "#73DCC7", title: "Made to move quickly", description: "Fast shortcuts. Thoughtful interactions." },
      ].map(({ x, color, title, description }) => `
        <rect x="${x}" y="410" width="410" height="101" rx="14" fill="#101B42" stroke="#344673"/>
        <rect x="${x + 23}" y="435" width="5" height="48" rx="2.5" fill="${color}"/>
        <text x="${x + 44}" y="453" fill="#F3F6FF" font-family="Manrope" font-size="22" font-weight="700" letter-spacing="-.4">${title}</text>
        <text x="${x + 44}" y="482" fill="#B9C9EC" font-family="Manrope" font-size="14" font-weight="500">${description}</text>
      `).join("")}
    </svg>`;
}

// Sources capture the actual native side-panel rendering surface through CDP.
// Check its measured viewport before writing any assets; no browser frame is added.
const screenshotCapture = {
  width: 360,
  height: 665,
};

function screenshotSvg({
  screenshotDataUri, sourceWidth, sourceHeight, headlineLead,
  headlineAccent, supporting, pillar, accent, steps = [], keyboard = false,
  footnote, iconDataUri,
}) {
  const productScale = Math.min(520 / sourceWidth, 688 / sourceHeight);
  const productWidth = sourceWidth * productScale;
  const productHeight = sourceHeight * productScale;
  const productX = 700 + (520 - productWidth) / 2;
  const productY = 88 + (688 - productHeight) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#070E2A"/>
        <stop offset="1" stop-color="#1B2456"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-5%" width="120%" height="115%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000619" flood-opacity=".4"/>
      </filter>
      <clipPath id="productClip"><rect x="${productX}" y="${productY}" width="${productWidth}" height="${productHeight}" rx="16"/></clipPath>
    </defs>
    <rect width="1280" height="800" fill="url(#background)"/>
    <circle cx="1190" cy="50" r="205" fill="${accent}" opacity=".055"/>
    <circle cx="17" cy="14" r="58" fill="none" stroke="${accent}" stroke-width="18" opacity=".14"/>
    <image href="${iconDataUri}" x="60" y="31" width="42" height="42"/>
    <text x="116" y="60" fill="#DCE6FF" font-family="Manrope" font-size="25" font-weight="800" letter-spacing="-.6">Ztab</text>
    <text x="1220" y="58" text-anchor="end" fill="#B9C9EC" font-family="Manrope" font-size="14" font-weight="700" letter-spacing="1.2">${pillar}</text>
    <text x="60" y="177" fill="#FFFFFF" font-family="Manrope" font-size="50" font-weight="800" letter-spacing="-1.7">
      <tspan x="60">${headlineLead}</tspan>
      <tspan x="60" dy="64" fill="#B7CCFF">${headlineAccent}</tspan>
    </text>
    <text x="63" y="305" fill="#C6D4FA" font-family="Manrope" font-size="22" font-weight="500">
      ${supporting.map((line, index) => `<tspan x="63" dy="${index ? 33 : 0}">${line}</tspan>`).join("")}
    </text>
    ${steps.map(({ key, title, detail }, index) => {
      const y = 394 + index * 103;
      return keyboard ? `
        <rect x="62" y="${y}" width="158" height="62" rx="11" fill="#233158" stroke="#5A6E9F"/>
        <path d="M76 ${y + 55}H206" stroke="#0D1737" stroke-width="2" stroke-linecap="round"/>
        <text x="141" y="${y + 37}" text-anchor="middle" fill="#F3F6FF" font-family="Manrope" font-size="17" font-weight="700">${key}</text>
        <text x="242" y="${y + 23}" fill="#F3F6FF" font-family="Manrope" font-size="21" font-weight="700">${title}</text>
        <text x="242" y="${y + 50}" fill="#B9C9EC" font-family="Manrope" font-size="15" font-weight="500">${detail}</text>` : `
        <rect x="62" y="${y + 5}" width="4" height="49" rx="2" fill="${accent}"/>
        <text x="86" y="${y + 23}" fill="#F3F6FF" font-family="Manrope" font-size="22" font-weight="700">${title}</text>
        <text x="86" y="${y + 54}" fill="#B9C9EC" font-family="Manrope" font-size="18" font-weight="500">${detail}</text>`;
    }).join("")}
    <text x="63" y="738" fill="#8FA5D3" font-family="Manrope" font-size="14" font-weight="500">${footnote}</text>
    <rect x="${productX}" y="${productY}" width="${productWidth}" height="${productHeight}" rx="16" fill="#071033" filter="url(#shadow)"/>
    <g clip-path="url(#productClip)">
      <image href="${screenshotDataUri}" x="${productX}" y="${productY}" width="${productWidth}" height="${productHeight}"/>
    </g>
    <rect x="${productX + 0.5}" y="${productY + 0.5}" width="${productWidth - 1}" height="${productHeight - 1}" rx="15.5" fill="none" stroke="#8EA8EF" stroke-opacity=".45"/>
  </svg>`;
}

const screenshotSpecs = [
  {
    source: "side-panel-raw.png",
    output: "screenshot-01-side-panel.png",
    headlineLead: "All your tabs.",
    headlineAccent: "One clear view.",
    supporting: ["Recent tabs first. Your windows together.", "Move, close, or merge without the tab hunt."],
    pillar: "01 / ACROSS WINDOWS",
    accent: "#FF846E",
    steps: [
      { title: "Across your windows", detail: "Open, move, close, or merge from one list." },
      { title: "Recently used first", detail: "Keep active work near the top." },
      { title: "Your order when you need it", detail: "Switch to Manual to arrange tabs yourself." },
    ],
    footnote: "Actual tabs from multiple Chrome windows.",
  },
  {
    source: "pinned-tabs-raw.png",
    output: "screenshot-02-pinned-tabs.png",
    headlineLead: "Pin once.",
    headlineAccent: "Ready in every window.",
    supporting: ["Keep your everyday apps", "close in each Chrome window."],
    pillar: "02 / PINNED TABS IN SYNC",
    accent: "#A58AFF",
    steps: [
      { title: "Your apps, kept in sync", detail: "Pinned copies follow you across windows." },
      { title: "Always easy to find", detail: "Pinned tabs stay together at the top." },
      { title: "A quieter view when you want it", detail: "Hide the pinned list while sync continues." },
    ],
    footnote: "Pinned-tab sync applies to eligible Chrome windows.",
  },
  {
    source: "keyboard-raw.png",
    output: "screenshot-03-keyboard.png",
    headlineLead: "Fast keys.",
    headlineAccent: "Thoughtful details.",
    supporting: ["Keep your hands on the keyboard.", "Reach the right tab in a few keystrokes."],
    pillar: "03 / KEYS AND INTERACTIONS",
    accent: "#73DCC7",
    keyboard: true,
    steps: [
      { key: "Your shortcut", title: "Open the side panel", detail: "Customize the opener in Chrome." },
      { key: "Up / Down", title: "Focus a tab", detail: "Move through the visible list." },
      { key: "Enter", title: "Switch to that tab", detail: "Bring its window into focus." },
    ],
    footnote: "Arrow keys and Enter work while the tab list is focused.",
  },
  {
    source: "groups-bulk-raw.png",
    output: "screenshot-04-groups-bulk.png",
    headlineLead: "Related tabs.",
    headlineAccent: "Together at last.",
    supporting: ["Bring related work into a Ztab group.", "Select several tabs and act on them together."],
    pillar: "04 / GROUPS AND BULK ACTIONS",
    accent: "#A58AFF",
    steps: [
      { title: "Drag tabs together", detail: "Group related pages across windows." },
      { title: "Select once, act together", detail: "Group, move, close, or save selected tabs." },
      { title: "Your windows stay in place", detail: "Grouping does not move the actual tabs." },
    ],
    footnote: "Groups belong to Ztab and are independent of Chrome tab groups.",
  },
  {
    source: "saved-raw.png",
    output: "screenshot-05-saved.png",
    headlineLead: "Worth keeping?",
    headlineAccent: "Save it for later.",
    supporting: ["Give useful pages a place of their own.", "Keep them handy after their tabs are closed."],
    pillar: "05 / YOUR SAVED PAGES",
    accent: "#73DCC7",
    steps: [
      { title: "Save a page in a moment", detail: "Use a tab menu or Save current tab." },
      { title: "Find it when you need it", detail: "Search saved titles and website addresses." },
      { title: "Keep useful collections", detail: "Organize pages in your own local library." },
    ],
    footnote: "Saved uses Ztab's local library, separate from Chrome bookmarks.",
  },
];

const screenshots = await Promise.all(screenshotSpecs.map(async (spec) => {
  const source = await readFile(join(screenshotSourceDirectory, spec.source));
  const decoded = PNG.sync.read(source);
  if (decoded.width !== screenshotCapture.width || decoded.height !== screenshotCapture.height)
    throw new Error(`${spec.source}: expected ${screenshotCapture.width}×${screenshotCapture.height}, got ${decoded.width}×${decoded.height}. Recheck the native side-panel viewport and screenshotCapture contract.`);
  return { ...spec, screenshotDataUri: escapeDataUri(source), sourceWidth: decoded.width, sourceHeight: decoded.height };
}));

const iconSvg = await readFile(join(sourceDirectory, "icon.svg"), "utf8");
const smallIconSvg = await readFile(
  join(sourceDirectory, "icon-small.svg"),
  "utf8",
);

await Promise.all([
  renderSvg(smallIconSvg, join(projectRoot, "icons", "icon16.png"), 16),
  renderSvg(iconSvg, join(projectRoot, "icons", "icon32.png"), 32),
  renderSvg(iconSvg, join(projectRoot, "icons", "icon48.png"), 48),
  renderSvg(iconSvg, join(projectRoot, "icons", "icon128.png"), 128),
]);

const renderedIcon = await readFile(join(projectRoot, "icons", "icon128.png"));
const iconDataUri = escapeDataUri(renderedIcon);

await mkdir(screenshotFinalDirectory, { recursive: true });

const screenshotRenders = screenshots.map((spec) => renderSvg(
  screenshotSvg({ ...spec, iconDataUri }),
  join(screenshotFinalDirectory, spec.output),
  1280,
  { removeAlpha: true },
));

await Promise.all([
  renderSvg(
    promoSvg({
      width: 440,
      height: 280,
      small: true,
      iconDataUri,
    }),
    join(finalDirectory, "promo-small-440x280.png"),
    440,
    { removeAlpha: true },
  ),
  renderSvg(
    promoSvg({
      width: 1400,
      height: 560,
      small: false,
      iconDataUri,
    }),
    join(finalDirectory, "promo-marquee-1400x560.png"),
    1400,
    { removeAlpha: true },
  ),
  ...screenshotRenders,
]);

console.log("Rendered extension icons and Chrome Web Store artwork.");
