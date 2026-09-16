import test from "node:test";
import assert from "node:assert/strict";
import { buildTabPresentation, resolveTabSort, tabLastUsed } from "../src/shared/tab-sorting.js";
import { buildTabTreeModel, flattenTabTreeTabs } from "../src/shared/tab-tree.js";
import { emptyWorkspace } from "../src/shared/workspace.js";

function fixture() {
    const windows = [
        { id: 1, type: "normal", tabs: [
            { id: 10, index: 0, pinned: true, lastAccessed: 10000 },
            { id: 11, index: 1, lastAccessed: 20 },
            { id: 12, index: 2, lastAccessed: 80 },
            { id: 13, index: 3, lastAccessed: 10 }
        ] },
        { id: 2, type: "normal", tabs: [
            { id: 21, index: 0, lastAccessed: 50 },
            { id: 22, index: 1, lastAccessed: 30 },
            { id: 23, index: 2, lastAccessed: 5 }
        ] }
    ];
    const workspace = {
        ...emptyWorkspace("test-session"),
        groups: [{ id: "work", name: "Work" }, { id: "reading", name: "Reading" }, { id: "empty", name: "Empty" }],
        memberships: { 11: "work", 21: "work", 12: "reading", 22: "reading" },
        tabOrder: [21, 11, 22, 12, 23, 13],
        recentActivity: { 11: 90, 13: 100 }
    };
    return { windows, tree: buildTabTreeModel(windows, 1), workspace };
}

function sectionOrder(presentation) {
    return presentation.sections.map((section) => [section.key, section.tabs.map((tab) => tab.id)]);
}

function deepFreeze(value) {
    if (value && typeof value === "object") {
        for (const child of Object.values(value))
            deepFreeze(child);
        Object.freeze(value);
    }
    return value;
}

test("sorting defaults to Recent while retaining an explicit Manual preference", () => {
    assert.equal(resolveTabSort("manual"), "manual");
    for (const value of [undefined, null, "recent", "", "unknown", "Manual", 1, false, {}])
        assert.equal(resolveTabSort(value), "recent");
});

test("tab recency prefers recorded visits and falls back to valid Chrome timestamps", () => {
    const tab = { id: 11, lastAccessed: 200 };
    assert.equal(tabLastUsed(tab, { recentActivity: { 11: 300 } }), 300);
    assert.equal(tabLastUsed(tab, { recentActivity: { 11: 100 } }), 100);
    assert.equal(tabLastUsed(tab, {}), 200);
    for (const value of [undefined, null, 0, -1, NaN, Infinity, "300"])
        assert.equal(tabLastUsed(tab, { recentActivity: { 11: value } }), 200);
    for (const value of [undefined, null, 0, -1, NaN, Infinity, "300"])
        assert.equal(tabLastUsed({ id: 11, lastAccessed: value }, {}), 0);
});

test("the Chrome model carries valid lastAccessed without changing source records or indices", () => {
    const values = [123.5, undefined, 0, -1, NaN, Infinity, "123"];
    const windows = [{ id: 1, type: "normal", tabs: values.map((lastAccessed, index) => ({
        id: index + 1, index, lastAccessed
    })).reverse() }];
    const original = structuredClone(windows);
    deepFreeze(windows);
    const tabs = flattenTabTreeTabs(buildTabTreeModel(windows, 1));
    assert.deepEqual(tabs.map((tab) => tab.lastAccessed), [123.5, 0, 0, 0, 0, 0, 0]);
    assert.deepEqual(tabs.map((tab) => tab.index), [0, 1, 2, 3, 4, 5, 6]);
    assert.deepEqual(windows, original);
});

test("Recent ranks whole groups and windows by latest member and sorts each section internally", () => {
    const { tree, workspace } = fixture();
    const presentation = buildTabPresentation(tree, workspace, "recent");
    assert.deepEqual(sectionOrder(presentation), [
        ["window-1", [13]],
        ["group-work", [11, 21]],
        ["group-reading", [12, 22]],
        ["window-2", [23]],
        ["group-empty", []]
    ]);
    const group = presentation.sections.find((section) => section.key === "group-work");
    assert.deepEqual(group.tabs.map((tab) => tab.windowId), [1, 2]);
    assert.equal(group.group, workspace.groups[0]);
    assert.equal(presentation.sections[0].win, tree[0]);
    assert.equal(new Set(presentation.tabs.map((tab) => tab.id)).size, presentation.tabs.length);
});

test("equal and missing timestamps preserve manual tab and section order", () => {
    const { tree, workspace } = fixture();
    workspace.recentActivity = {};
    for (const tab of flattenTabTreeTabs(tree))
        tab.lastAccessed = tab.id === 11 || tab.id === 21 || tab.id === 12 || tab.id === 22 ? 40 : 0;
    assert.deepEqual(sectionOrder(buildTabPresentation(tree, workspace, "recent")), [
        ["group-work", [21, 11]],
        ["group-reading", [22, 12]],
        ["group-empty", []],
        ["window-1", [13]],
        ["window-2", [23]]
    ]);
});

test("Recent excludes pinned tabs and leaves manual order, membership, and Chrome records unchanged", () => {
    const { windows, tree, workspace } = fixture();
    const original = structuredClone({ windows, tree, workspace });
    deepFreeze(windows);
    deepFreeze(tree);
    deepFreeze(workspace);
    const presentation = buildTabPresentation(tree, workspace, "recent");
    assert.equal(presentation.tabs.some((tab) => tab.id === 10), false);
    assert.equal(presentation.sections[0].key, "window-1");
    assert.deepEqual({ windows, tree, workspace }, original);
    assert.ok(presentation.tabs.every((tab) => flattenTabTreeTabs(tree).includes(tab)));
    assert.deepEqual(sectionOrder(buildTabPresentation(tree, workspace, "manual")), [
        ["group-work", [21, 11]],
        ["group-reading", [22, 12]],
        ["group-empty", []],
        ["window-1", [13]],
        ["window-2", [23]]
    ]);
});

test("Manual appends unknown tabs in browser order after tabs with a saved manual position", () => {
    const { tree, workspace } = fixture();
    workspace.tabOrder = [11];
    workspace.memberships[13] = "work";
    assert.deepEqual(buildTabPresentation(tree, workspace, "manual").sections[0].tabs.map((tab) => tab.id), [11, 13, 21]);
});

test("a selection snapshot freezes known tab and section order when recent activity changes", () => {
    const { tree, workspace } = fixture();
    const initial = buildTabPresentation(tree, workspace, "recent");
    const snapshot = deepFreeze(structuredClone(initial.snapshot));
    workspace.recentActivity = { 21: 500, 22: 600, 23: 700 };
    const frozen = buildTabPresentation(tree, workspace, "recent", snapshot);
    assert.deepEqual(sectionOrder(frozen), sectionOrder(initial));
    assert.deepEqual(frozen.snapshot, initial.snapshot);
    const resumed = buildTabPresentation(tree, workspace, "recent");
    assert.deepEqual(sectionOrder(resumed), [
        ["window-2", [23]],
        ["group-reading", [22, 12]],
        ["group-work", [21, 11]],
        ["window-1", [13]],
        ["group-empty", []]
    ]);
});

test("snapshots append new members and sections while pruning closed, pinned, and removed entries", () => {
    const { tree, workspace } = fixture();
    const snapshot = deepFreeze(buildTabPresentation(tree, workspace, "recent").snapshot);
    tree[1].tabs = tree[1].tabs.filter((tab) => tab.id !== 21);
    tree[0].tabs.find((tab) => tab.id === 12).pinned = true;
    tree[0].tabs.push({ id: 14, windowId: 1, index: 4, lastAccessed: 9000 });
    tree.push({ id: 3, tabs: [{ id: 31, windowId: 3, index: 0, lastAccessed: 10000 }] });
    workspace.memberships[14] = "work";
    workspace.groups = workspace.groups.filter((group) => group.id !== "empty");
    const presentation = buildTabPresentation(tree, workspace, "recent", snapshot);
    assert.deepEqual(sectionOrder(presentation), [
        ["window-1", [13]],
        ["group-work", [11, 14]],
        ["group-reading", [22]],
        ["window-2", [23]],
        ["window-3", [31]]
    ]);
    assert.deepEqual(presentation.snapshot.tabs, [13, 11, 14, 22, 23, 31]);
    assert.equal(presentation.snapshot.sections.includes("group-empty"), false);
    assert.deepEqual(snapshot.tabs, [13, 11, 21, 12, 22, 23]);
});

test("bulk ordering matches the rendered sections in Recent, Manual, and frozen presentations", () => {
    const { tree, workspace } = fixture();
    const snapshot = buildTabPresentation(tree, workspace, "recent").snapshot;
    workspace.recentActivity[23] = 500;
    for (const [mode, frozen] of [["recent", null], ["manual", null], ["recent", snapshot]]) {
        const presentation = buildTabPresentation(tree, workspace, mode, frozen);
        assert.deepEqual(presentation.tabs, presentation.sections.flatMap((section) => section.tabs));
        assert.deepEqual(presentation.snapshot.tabs, presentation.tabs.map((tab) => tab.id));
        assert.deepEqual(presentation.snapshot.sections, presentation.sections.map((section) => section.key));
    }
});
