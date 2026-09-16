import test from "node:test";
import assert from "node:assert/strict";
import { findWindowDisplay, normalizeDisplays } from "../src/shared/displays.js";
import { buildTabTreeModel, getMoveTargets, getPinnedTabs } from "../src/shared/tab-tree.js";
import { getDisplays } from "../src/background/chrome-api.js";
import { createDisplayReader } from "../src/display-info.js";

const primary = {
  id: "primary", name: "Studio Display", isPrimary: true,
  bounds: { left: 0, top: 0, width: 1920, height: 1080 }
};
const left = {
  id: "left", name: "DELL U2723QE",
  bounds: { left: -2560, top: -200, width: 2560, height: 1440 }
};
const displays = normalizeDisplays([left, primary]);

test("display matching uses overlap in logical coordinates, including negative offsets", () => {
  const win = { left: -1000, top: 50, width: 1200, height: 800 };
  assert.equal(findWindowDisplay(win, displays).id, "left");
  assert.equal(findWindowDisplay({ ...win, left: -200 }, displays).id, "primary");
  assert.equal(findWindowDisplay({ ...win, left: -600 }, displays).id, "primary");
  assert.equal(findWindowDisplay({ ...win, left: -1000, state: "minimized" }, displays).id, "left");
});

test("display matching supports a screen above the primary and ignores pixel density", () => {
  const above = { id: "above", dpiX: 220, dpiY: 220, bounds: { left: 0, top: -1080, width: 1920, height: 1080 } };
  const screens = normalizeDisplays([{ ...primary, dpiX: 96, dpiY: 96 }, above]);
  assert.equal(findWindowDisplay({ left: 200, top: -700, width: 1000, height: 800 }, screens).id, "above");
  assert.equal(findWindowDisplay({ left: 200, top: -100, width: 1000, height: 800 }, screens).id, "primary");
});

test("display matching handles disconnected-screen positions and minimized sentinel bounds", () => {
  const offscreen = { left: -4000, top: 100, width: 800, height: 600 };
  assert.equal(findWindowDisplay(offscreen, displays).id, "left");
  assert.equal(findWindowDisplay({ ...offscreen, state: "minimized" }, displays), null);
  assert.equal(findWindowDisplay({ left: NaN, top: 0, width: 800, height: 600 }, displays), null);
  assert.equal(findWindowDisplay({ left: 0, top: 0, width: 0, height: 600 }, displays), null);
  assert.equal(findWindowDisplay({}, displays), null);
  assert.equal(findWindowDisplay(offscreen, []), null);
});

test("display names have stable duplicate numbering regardless of API order", () => {
  const input = [{ ...left, name: "Studio Display" }, { ...primary, name: " Studio Display " }];
  const original = structuredClone(input);
  const normalized = normalizeDisplays(input);
  assert.deepEqual(normalized.map(({ id, name }) => ({ id, name })), [
    { id: "primary", name: "Studio Display (1)" },
    { id: "left", name: "Studio Display (2)" }
  ]);
  assert.deepEqual(normalizeDisplays([...input].reverse()), normalized);
  assert.deepEqual(input, original);
});

test("display normalization excludes unavailable and mirrored targets and provides fallback names", () => {
  const normalized = normalizeDisplays([
    { ...primary, name: "", isInternal: true },
    { ...left, name: "  " },
    { ...left, id: "disabled", isEnabled: false },
    { ...left, id: "inactive", activeState: "inactive" },
    { ...left, id: "mirror", mirroringSourceId: "primary" },
    { ...left, id: "invalid", bounds: { left: 0, top: 0, width: 0, height: 100 } },
    null
  ]);
  assert.deepEqual(normalized.map(({ name }) => name), ["Built-in display", "Display 2"]);
  assert.deepEqual(normalizeDisplays(undefined), []);
});

test("window locations keep window numbers and reach pinned rows and move destinations", () => {
  const windows = [
    { id: 1, type: "normal", left: 100, top: 100, width: 1200, height: 800,
      tabs: [{ id: 10, pinned: true, title: "Mail", url: "https://example.com" }] },
    { id: 2, type: "normal", left: -2000, top: 100, width: 1200, height: 800,
      tabs: [{ id: 20, title: "Notes", url: "https://example.org" }] }
  ];
  const tree = buildTabTreeModel(windows, 1, displays);
  assert.equal(tree[0].label, "Current window");
  assert.equal(tree[1].label, "Window 2");
  assert.equal(tree[0].displayName, "Studio Display");
  assert.equal(tree[1].displayName, "DELL U2723QE");
  assert.equal(getPinnedTabs(tree)[0].windowLocation, "Current window · Studio Display");
  assert.equal(tree[1].tabs[0].windowLocation, "Window 2 · DELL U2723QE");
  assert.equal(getMoveTargets(tree, 1)[0].displayName, "DELL U2723QE");
  assert.equal(buildTabTreeModel([{ ...windows[1], left: 100 }], 2, displays)[0].displayName, "Studio Display");
});

test("single-screen, unavailable geometry, and missing display metadata retain plain window labels", () => {
  const windows = [{ id: 1, type: "normal", left: 0, top: 0, width: 1200, height: 800, tabs: [{ id: 10 }] }];
  for (const screens of [[], [primary], [primary, { ...left, isEnabled: false }]]) {
    const tree = buildTabTreeModel(windows, 1, screens);
    assert.equal(tree[0].displayName, "");
    assert.equal(tree[0].tabs[0].windowLocation, "Current window");
  }
  const tree = buildTabTreeModel([{ ...windows[0], left: undefined }], 1, displays);
  assert.equal(tree[0].displayName, "");
});

test("display API failure never prevents reading the tab tree", async (t) => {
  const original = globalThis.chrome;
  t.after(() => {
    if (original === undefined) delete globalThis.chrome;
    else globalThis.chrome = original;
  });
  globalThis.chrome = { runtime: {} };
  assert.deepEqual(await getDisplays(), []);
  globalThis.chrome.system = { display: { getInfo(callback) { callback(displays); } } };
  assert.deepEqual(await getDisplays(), displays);
  globalThis.chrome.runtime.lastError = { message: "Display information unavailable" };
  assert.deepEqual(await getDisplays(), []);
  delete globalThis.chrome.runtime.lastError;
  globalThis.chrome.system.display.getInfo = () => { throw new Error("Permission denied"); };
  assert.deepEqual(await getDisplays(), []);
});

function displayReaderFixture(state = "prompt") {
  const permission = Object.assign(new EventTarget(), { state });
  const details = Object.assign(new EventTarget(), {
    screens: [primary, left].map((display) => ({ ...display.bounds, label: display.name, isPrimary: display.isPrimary }))
  });
  let calls = 0;
  let changes = 0;
  const browserWindow = {
    async getScreenDetails() {
      calls += 1;
      if (permission.state === "denied") throw new Error("Not allowed");
      permission.state = "granted";
      return details;
    }
  };
  const reader = createDisplayReader({
    browserWindow, permissions: { async query() { return permission; } },
    getSystemDisplays: async () => [primary, left].map((display) => ({ ...display, name: "" })),
    onChange: () => { changes += 1; }
  });
  return { reader, browserWindow, permission, details, calls: () => calls, changes: () => changes };
}

test("refreshing tabs never prompts for display names; explicit consent enables actual labels", async () => {
  const fixture = displayReaderFixture();
  const initial = await fixture.reader.read();
  assert.equal(initial.canRequestNames, true);
  assert.deepEqual(initial.displays.map((display) => display.name), ["", ""]);
  assert.equal(fixture.calls(), 0);
  await fixture.reader.requestNames();
  const enabled = await fixture.reader.read();
  assert.equal(enabled.canRequestNames, false);
  assert.deepEqual(enabled.displays.map((display) => display.name), ["Studio Display", "DELL U2723QE"]);
  assert.deepEqual(enabled.displays[1].bounds, left.bounds);
  assert.equal(fixture.changes(), 1);
});

test("display changes refresh labels without duplicating listeners and revocation restores fallback", async () => {
  const fixture = displayReaderFixture("granted");
  await fixture.reader.read();
  await fixture.reader.read();
  fixture.details.dispatchEvent(new Event("screenschange"));
  assert.equal(fixture.changes(), 1);
  fixture.permission.state = "denied";
  fixture.permission.dispatchEvent(new Event("change"));
  assert.equal(fixture.changes(), 2);
  const calls = fixture.calls();
  const revoked = await fixture.reader.read();
  assert.equal(fixture.calls(), calls);
  assert.equal(revoked.canRequestNames, true);
  assert.equal(revoked.displays[0].name, "");
  await assert.rejects(fixture.reader.requestNames(), /blocked/);
  assert.equal(fixture.calls(), calls);
});

test("rejected or unavailable screen-details access preserves numbered displays", async () => {
  const fixture = displayReaderFixture();
  await fixture.reader.read();
  fixture.browserWindow.getScreenDetails = async () => { throw new Error("Not allowed"); };
  await assert.rejects(fixture.reader.requestNames(), /not enabled/);
  fixture.permission.state = "granted";
  const fallback = await fixture.reader.read();
  assert.equal(fallback.displays.length, 2);
  assert.equal(fallback.displays[0].name, "");
  const unsupported = createDisplayReader({
    browserWindow: {}, permissions: {}, getSystemDisplays: async () => displays
  });
  assert.deepEqual(await unsupported.read(), { displays, canRequestNames: false });
});
