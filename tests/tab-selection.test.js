import test from "node:test";
import assert from "node:assert/strict";
import { pruneSelection, selectableTabs, selectRange, selectionScope, toggleSelection } from "../src/shared/tab-selection.js";

test("search selection includes every matching group's member but excludes pinned tabs", () => {
    const tabs = [
        { id: 11, title: "Design review", url: "https://example.com/one" },
        { id: 12, title: "Unrelated document", url: "https://example.net/two" },
        { id: 21, title: "Other window", url: "https://example.org/three" },
        { id: 22, title: "Research pinned", url: "https://example.com/four", pinned: true },
        { id: 23, title: "Ungrouped", url: "https://example.com/research" }
    ];
    const groups = [{ id: "a", name: "Research notes" }, { id: "b", name: "Design" }];
    const memberships = { 12: "a", 21: "a", 22: "a", 11: "b" };
    assert.deepEqual(selectableTabs(tabs, groups, memberships, "  RESEARCH ").map((tab) => tab.id), [12, 21, 23]);
    assert.deepEqual(selectableTabs(tabs, groups, memberships, "design").map((tab) => tab.id), [11]);
    assert.deepEqual(selectableTabs(tabs, groups, memberships, "example.net").map((tab) => tab.id), [12]);
    assert.deepEqual(selectableTabs(tabs, groups, memberships, "not present"), []);
    assert.deepEqual(selectableTabs(tabs, groups, memberships, "   ").map((tab) => tab.id), [11, 12, 21, 23]);
});

test("range selection follows visible local order in either direction and preserves hidden selections", () => {
    const selected = new Set([99]);
    // This order spans groups and windows; absent IDs are collapsed or filtered.
    const visible = [21, 12, 31, 11];
    const forward = selectRange(selected, visible, 21, 31);
    const reverse = selectRange(selected, visible, 31, 21);
    assert.deepEqual([...forward], [99, 21, 12, 31]);
    assert.deepEqual([...reverse], [99, 21, 12, 31]);
    assert.deepEqual([...selected], [99]);
    assert.deepEqual(visible, [21, 12, 31, 11]);
});

test("range selection falls back to a single toggle when its anchor is collapsed or absent", () => {
    const selected = new Set([11, 99]);
    const visible = [21, 12];
    assert.deepEqual([...selectRange(selected, visible, 11, 12)], [11, 99, 12]);
    assert.deepEqual([...selectRange(new Set([11, 12]), visible, 11, 12)], [11]);
    assert.deepEqual([...selectRange(selected, visible, null, 21)], [11, 99, 21]);
    assert.deepEqual([...selected], [11, 99]);
});

test("selection scopes distinguish empty, unselected, mixed, and fully selected states", () => {
    const selected = new Set([11, 21, 99]);
    assert.deepEqual(selectionScope(selected, []), { checked: false, mixed: false });
    assert.deepEqual(selectionScope(selected, [12, 22]), { checked: false, mixed: false });
    assert.deepEqual(selectionScope(selected, [11, 12]), { checked: false, mixed: true });
    assert.deepEqual(selectionScope(selected, [11, 21]), { checked: true, mixed: false });
    assert.deepEqual(selectionScope(selected, [11]), { checked: true, mixed: false });
});

test("scope toggles select a partial scope, clear a full scope, and retain selections outside it", () => {
    const selected = new Set([11, 99]);
    const filled = toggleSelection(selected, [11, 12, 21]);
    assert.deepEqual([...filled], [11, 99, 12, 21]);
    assert.deepEqual([...toggleSelection(filled, [11, 12, 21])], [99]);
    const unchanged = toggleSelection(selected, []);
    assert.deepEqual([...unchanged], [11, 99]);
    assert.notEqual(unchanged, selected);
    assert.deepEqual([...selected], [11, 99]);
});

test("pruning removes closed and newly pinned tabs while retaining live selections across windows", () => {
    const selected = new Set([21, 11, 12, 99]);
    const tabs = [
        { id: 11, windowId: 1, pinned: false },
        { id: 12, windowId: 1, pinned: true },
        { id: 21, windowId: 2 },
        { id: 22, windowId: 2 }
    ];
    assert.deepEqual([...pruneSelection(selected, tabs)], [21, 11]);
    assert.deepEqual([...selected], [21, 11, 12, 99]);
    assert.deepEqual([...pruneSelection(selected, [])], []);
});
