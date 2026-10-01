import test from "node:test";
import assert from "node:assert/strict";
import { createTabDragController } from "../src/tab-drag.js";

// Minimal pointer/DOM fixture; the actual panel layout is checked in Chrome.
class Element {
    dataset = {};
    children = [];
    listeners = {};
    hidden = false;
    classList = { add() {}, remove() {} };
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
    fire(type, event = {}) { this.listeners[type]?.forEach((listener) => listener({ preventDefault() {}, ...event })); }
    append(child) { child.parent = this; this.children.push(child); }
    remove() { this.parent.children = this.parent.children.filter((child) => child !== this); }
    removeAttribute(name) { if (name === "data-drop") delete this.dataset.drop; }
    contains(child) { return child === this || this.children.some((item) => item.contains(child)); }
    matches(selector) {
        if (selector === ".drag-hint") return this.className === "drag-hint";
        const attribute = selector.match(/^\[data-([\w-]+)(?:="(\d+)")?\]$/);
        if (!attribute) return false;
        const key = attribute[1].replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
        return key in this.dataset && (!attribute[2] || String(this.dataset[key]) === attribute[2]);
    }
    closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector); }
    querySelectorAll(selector) { return this.children.flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    getBoundingClientRect() { return { left: 0, right: 320, top: 100, bottom: 140, height: 40 }; }
    setPointerCapture() { this.captured = true; }
    hasPointerCapture() { return this.captured; }
    releasePointerCapture() { this.captured = false; }
}

function harness(t, { manual = false, grouped = false } = {}) {
    const root = new Element(), list = new Element(), ungroupZone = new Element();
    root.append(list);
    root.append(ungroupZone);
    ungroupZone.hidden = true;
    const tabs = new Map([
        [11, { id: 11, windowId: 1, groupId: grouped ? "research" : null }],
        [12, { id: 12, windowId: 1, groupId: null }],
        [21, { id: 21, windowId: 2, groupId: grouped ? "research" : null }]
    ]);
    const windows = new Map([1, 2, 3].map((id) => [id, { id, label: `Window ${id}`, mergeEligible: true, incognito: false }]));
    const rows = new Map([...tabs.keys()].map((id) => {
        const row = new Element(), handle = new Element();
        row.dataset.tabId = id;
        handle.dataset.dragTabId = id;
        row.append(handle);
        list.append(row);
        return [id, row];
    }));
    const headings = new Map([...windows.keys()].map((id) => {
        const heading = new Element();
        heading.dataset.dropWindowId = id;
        list.append(heading);
        return [id, heading];
    }));
    let hit;
    const document = new Element();
    document.createElement = () => new Element();
    document.elementFromPoint = () => hit;
    const globals = { document, window: new Element(), requestAnimationFrame: () => 1, cancelAnimationFrame() {} };
    const previous = Object.fromEntries(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    Object.assign(globalThis, globals);
    t.after(() => Object.entries(previous).forEach(([key, descriptor]) => {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
    }));
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const drops = [];
    createTabDragController({ root, list, ungroupZone, canDrag: () => true, canReorder: () => manual,
        describeTab: (id) => tabs.get(id), describeWindow: (id) => windows.get(id), groupName: () => "Research",
        onStart() {}, onEnd() {}, onError: (error) => { throw error; }, onDrop: (source, target) => drops.push({ source, target }) });
    const hover = (element, y = 120) => {
        hit = element;
        root.fire("pointermove", { pointerId: 1, buttons: 1, clientX: 30, clientY: y });
    };
    return { rows, headings, windows, drops, document,
        start(element, y = 120) {
            root.fire("pointerdown", { target: rows.get(11).children[0], button: 0, pointerId: 1, clientX: 20, clientY: 10 });
            hover(element, y);
        }, hover,
        async release() {
            root.fire("pointerup", { pointerId: 1 });
            await new Promise((resolve) => setImmediate(resolve));
        }
    };
}

for (const manual of [false, true]) {
    test(`cross-window centers and edges move immediately in ${manual ? "manual" : "recent"} order, even between group members`, async (t) => {
        const h = harness(t, { manual, grouped: true });
        for (const y of [101, 120, 139]) {
            h.start(h.rows.get(21), y);
            assert.equal(h.rows.get(21).dataset.drop, "move");
            assert.equal(h.rows.get(21).querySelector(".drag-hint").textContent, "Move to Window 2");
            if (y === 120) t.mock.timers.tick(500);
            await h.release();
            assert.equal(h.drops.at(-1).target.mode, "move");
            assert.equal(h.drops.at(-1).target.windowId, 2);
        }
        assert.equal(h.drops.length, 3);
    });
}

test("moving across window headings updates the destination and rejects the source heading", async (t) => {
    const h = harness(t);
    h.start(h.headings.get(2));
    h.hover(h.headings.get(3));
    assert.equal(h.headings.get(2).dataset.drop, undefined);
    assert.equal(h.headings.get(3).querySelector(".drag-hint").textContent, "Move to Window 3");
    await h.release();
    assert.equal(h.drops[0].target.windowId, 3);
    h.start(h.headings.get(1));
    await h.release();
    assert.equal(h.drops.length, 1);
});

test("compact destinations and Escape cancel cross-window drops", async (t) => {
    const h = harness(t);
    h.windows.get(2).mergeEligible = false;
    h.start(h.rows.get(21));
    assert.match(h.rows.get(21).querySelector(".drag-hint").textContent, /Expand compact/);
    await h.release();
    h.windows.get(2).mergeEligible = true;
    h.start(h.headings.get(2));
    h.document.fire("keydown", { key: "Escape" });
    await h.release();
    assert.deepEqual(h.drops, []);
});

test("same-window center grouping still requires the hold, and leaving it cancels the timer", async (t) => {
    const h = harness(t);
    h.start(h.rows.get(12));
    await h.release();
    assert.deepEqual(h.drops, []);
    h.start(h.rows.get(12));
    t.mock.timers.tick(450);
    await h.release();
    assert.equal(h.drops[0].target.mode, "create");
    h.start(h.rows.get(12));
    h.hover(h.rows.get(21));
    t.mock.timers.tick(500);
    await h.release();
    assert.equal(h.drops[1].target.mode, "move");
});
