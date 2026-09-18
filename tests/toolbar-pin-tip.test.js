import test from "node:test";
import assert from "node:assert/strict";
import { createToolbarPinTip } from "../src/toolbar-pin-tip.js";
import { getActionUserSettings } from "../src/background/chrome-api.js";
import { STORAGE_TOOLBAR_PIN_TIP_DISMISSED_KEY as DISMISSED_KEY } from "../src/background/constants.js";

function fixture(storage = {}) {
  const state = { visible: false, settings: { isOnToolbar: false }, readError: false, writeError: false };
  const tip = createToolbarPinTip({
    onVisibilityChange: (visible) => { state.visible = visible; },
    getSettings: async () => state.settings,
    readStorage: async () => {
      if (state.readError) throw new Error("Storage unavailable");
      return { ...storage };
    },
    writeStorage: async (values) => {
      if (state.writeError) throw new Error("Write failed");
      Object.assign(storage, values);
    }
  });
  return { tip, state, storage };
}

test("only confirmed unpinned users see the tip, including on subsequent panel opens", async () => {
  for (const settings of [{ isOnToolbar: false }, { isOnToolbar: true }, {}, null]) {
    const { tip, state } = fixture();
    state.settings = settings;
    await tip.refresh();
    assert.equal(state.visible, settings?.isOnToolbar === false);
  }
  const { tip, state } = fixture();
  await tip.refresh();
  assert.equal(state.visible, true);
  state.settings = { isOnToolbar: true };
  await tip.refresh();
  assert.equal(state.visible, false);
  const reopened = fixture();
  await reopened.tip.refresh();
  assert.equal(reopened.state.visible, true);
});

test("closing the tip persists across panels and never changes unrelated preferences", async () => {
  const storage = { "pinallwindows.showPinnedTabs": false };
  const first = fixture(storage);
  const second = fixture(storage);
  await Promise.all([first.tip.refresh(), second.tip.refresh()]);
  await first.tip.dismiss();
  assert.equal(first.state.visible, false);
  assert.deepEqual(storage, { "pinallwindows.showPinnedTabs": false, [DISMISSED_KEY]: true });
  await second.tip.refresh();
  assert.equal(second.state.visible, false);
  const reopened = fixture(structuredClone(storage));
  await reopened.tip.refresh();
  assert.equal(reopened.state.visible, false);
  reopened.state.settings = { isOnToolbar: true };
  await reopened.tip.refresh();
  reopened.state.settings = { isOnToolbar: false };
  await reopened.tip.refresh();
  assert.equal(reopened.state.visible, false);
});

test("a failed dismissal stays visible and can be retried", async () => {
  const { tip, state, storage } = fixture();
  await tip.refresh();
  state.writeError = true;
  await assert.rejects(tip.dismiss(), /Write failed/);
  assert.equal(state.visible, true);
  assert.equal(storage[DISMISSED_KEY], undefined);
  state.writeError = false;
  await tip.dismiss();
  assert.equal(state.visible, false);
  assert.equal(storage[DISMISSED_KEY], true);
});

test("storage failures hide the optional tip until eligibility can be checked again", async () => {
  const { tip, state } = fixture();
  await tip.refresh();
  state.readError = true;
  await tip.refresh();
  assert.equal(state.visible, false);
  state.readError = false;
  await tip.refresh();
  assert.equal(state.visible, true);
});

test("an older unpinned read cannot override a newer pin or a completed dismissal", async () => {
  for (const action of ["pin", "dismiss"]) {
    let resolveOld;
    const oldSettings = new Promise((resolve) => { resolveOld = resolve; });
    let settings = oldSettings;
    let visible = false;
    const tip = createToolbarPinTip({
      getSettings: () => settings,
      readStorage: async () => ({}),
      writeStorage: async () => {},
      onVisibilityChange: (next) => { visible = next; }
    });
    const pending = tip.refresh();
    if (action === "pin") {
      settings = Promise.resolve({ isOnToolbar: true });
      await tip.refresh();
    }
    else {
      await tip.dismiss();
    }
    resolveOld({ isOnToolbar: false });
    await pending;
    assert.equal(visible, false, action);
  }
});

test("a delayed preference read cannot undo another panel's dismissal", async () => {
  let resolveOld;
  let stored = new Promise((resolve) => { resolveOld = resolve; });
  const visibility = [];
  const tip = createToolbarPinTip({
    getSettings: async () => ({ isOnToolbar: false }),
    readStorage: () => stored,
    onVisibilityChange: (visible) => visibility.push(visible)
  });
  const pending = tip.refresh();
  stored = Promise.resolve({ [DISMISSED_KEY]: true });
  await tip.refresh();
  resolveOld({});
  await pending;
  assert.deepEqual(visibility, [false]);
});

test("unavailable action settings never count as unpinned", async (t) => {
  const original = globalThis.chrome;
  t.after(() => {
    if (original === undefined) delete globalThis.chrome;
    else globalThis.chrome = original;
  });
  globalThis.chrome = { runtime: {} };
  assert.equal(await getActionUserSettings(), null);
  globalThis.chrome.action = { getUserSettings(callback) { callback({ isOnToolbar: false }); } };
  assert.deepEqual(await getActionUserSettings(), { isOnToolbar: false });
  globalThis.chrome.runtime.lastError = { message: "Not available" };
  assert.equal(await getActionUserSettings(), null);
  delete globalThis.chrome.runtime.lastError;
  globalThis.chrome.action.getUserSettings = () => { throw new Error("Not available"); };
  assert.equal(await getActionUserSettings(), null);
});
