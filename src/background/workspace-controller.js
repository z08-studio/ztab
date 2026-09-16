import { AsyncTaskQueue } from "./async-task-queue.js";
import * as chromeApi from "./chrome-api.js";
import { MESSAGE_WORKSPACE, STORAGE_BROWSER_SESSION_KEY, STORAGE_PRIVATE_WORKSPACE_KEY, STORAGE_WORKSPACE_KEY } from "./constants.js";
import { applyWorkspaceOperation, orderedWorkspaceTabs, pruneMemberships, readWorkspace, rememberActiveTab, replaceMemberTab, savedUrl } from "../shared/workspace.js";
import { isSyncWindow } from "../shared/tab-utils.js";
import { runBulkTabAction } from "./bulk-tab-actions.js";

export function createWorkspaceController(dependencies = {}) {
    const api = { ...chromeApi, ...dependencies.api };
    const events = dependencies.chrome || chrome;
    const createId = dependencies.createId || (() => crypto.randomUUID());
    const now = dependencies.now || Date.now;
    // Every panel sends operations to this single writer. Failed writes do not
    // poison the queue, and no tab URLs or titles are logged in error handling.
    const queue = new AsyncTaskQueue(() => {});

    async function sessionId() {
        const stored = await api.storageGet([STORAGE_BROWSER_SESSION_KEY], "session");
        if (stored[STORAGE_BROWSER_SESSION_KEY])
            return stored[STORAGE_BROWSER_SESSION_KEY];
        const id = createId();
        await api.storageSet({ [STORAGE_BROWSER_SESSION_KEY]: id }, "session");
        return id;
    }

    async function load(incognito, session) {
        const area = incognito ? "session" : "local";
        const key = incognito ? STORAGE_PRIVATE_WORKSPACE_KEY : STORAGE_WORKSPACE_KEY;
        const stored = (await api.storageGet([key], area))[key];
        return { area, key, stored, workspace: readWorkspace(stored, session) };
    }

    async function persist(record, workspace) {
        if (JSON.stringify(record.stored) !== JSON.stringify(workspace))
            await api.storageSet({ [record.key]: workspace }, record.area);
    }

    function scopedTabs(windows, incognito) {
        return windows.filter((win) => isSyncWindow(win) && (win.incognito === true) === incognito)
            .flatMap((win) => win.tabs || []);
    }

    async function execute(windowId, operation) {
        const windows = await api.getAllNormalWindowsWithTabs();
        const host = windows.find((win) => win.id === windowId && isSyncWindow(win));
        if (!host)
            throw new Error("The panel's window is no longer available. Reopen Ztab in a regular window.");
        const incognito = host.incognito === true;
        const tabs = scopedTabs(windows, incognito);
        const record = await load(incognito, await sessionId());
        let workspace = record.workspace;
        pruneMemberships(workspace, tabs);
        let result = {};

        if (["bulk-close-tabs", "bulk-move-tabs"].includes(operation.action)) {
            result = await runBulkTabAction(operation, { windows, incognito }, api);
            try {
                const latestWindows = await api.getAllNormalWindowsWithTabs();
                pruneMemberships(workspace, scopedTabs(latestWindows, incognito));
                // A batch may close its panel's window, including the last private
                // window. Finish in the worker without recreating private storage.
                if (incognito && !latestWindows.some((win) => win.type === "normal" && win.incognito))
                    await api.storageRemove([record.key], record.area);
                else
                    await persist(record, workspace);
            }
            catch {
                // Browser mutations cannot be rolled back by a storage failure.
                // Keep their actual results so the panel can clear completed IDs.
                result.warning = "The tab action finished, but the local library could not be refreshed. Refresh Ztab to update the list.";
            }
            return { workspace, ...result };
        }
        else if (operation.action === "activate-group") {
            if (!workspace.groups.some((group) => group.id === operation.id))
                throw new Error("Group no longer exists.");
            const members = orderedWorkspaceTabs(workspace, tabs.filter((tab) => workspace.memberships[tab.id] === operation.id));
            const tab = members.find((item) => item.id === workspace.lastActive[operation.id]) || members[0];
            if (!tab)
                throw new Error("This group is empty. Use Edit group to add open tabs.");
            await api.updateTab(tab.id, { active: true });
            await api.updateWindow(tab.windowId, { focused: true });
            rememberActiveTab(workspace, tab.id);
        }
        else if (operation.action === "open-saved") {
            const item = workspace.saved.find((entry) => entry.id === operation.id);
            if (!item)
                throw new Error("Saved page no longer exists.");
            const url = savedUrl(item.url);
            const existing = tabs.filter((tab) => (tab.pendingUrl || tab.url) === url)
                .sort((a, b) => Number(b.windowId === host.id) - Number(a.windowId === host.id))[0];
            const tab = existing ? await api.updateTab(existing.id, { active: true })
                : await api.createTab({ windowId: host.id, url, active: true });
            await api.updateWindow(tab.windowId, { focused: true });
            rememberActiveTab(workspace, tab.id);
        }
        else if (operation.action !== "read") {
            ({ workspace, result } = applyWorkspaceOperation(workspace, operation, { tabs, now: now(), createId }));
        }
        await persist(record, workspace);
        return { workspace, ...result };
    }

    function request(windowId, operation) {
        return queue.enqueue("workspace_request", () => execute(windowId, operation));
    }

    function maintain(change = {}) {
        return queue.enqueue("workspace_tabs_changed", async () => {
            const windows = await api.getAllNormalWindowsWithTabs();
            const session = await sessionId();
            for (const incognito of [false, true]) {
                const tabs = scopedTabs(windows, incognito);
                if (incognito && !windows.some((win) => win.type === "normal" && win.incognito)) {
                    await api.storageRemove([STORAGE_PRIVATE_WORKSPACE_KEY], "session");
                    continue;
                }
                const record = await load(incognito, session);
                if (!record.stored)
                    continue;
                if (change.addedId !== undefined && tabs.some((tab) => tab.id === change.addedId))
                    replaceMemberTab(record.workspace, change.removedId, change.addedId);
                pruneMemberships(record.workspace, tabs);
                const activatedId = change.tabId ?? windows.find((win) => win.id === change.windowId)?.tabs?.find((tab) => tab.active)?.id;
                if (tabs.some((tab) => tab.id === activatedId))
                    rememberActiveTab(record.workspace, activatedId);
                await persist(record, record.workspace);
            }
        });
    }

    function registerEventHandlers() {
        events.runtime.onMessage.addListener((message, _sender, respond) => {
            if (message?.type !== MESSAGE_WORKSPACE)
                return;
            request(message.windowId, message.operation || {})
                .then((result) => respond({ ok: true, ...result }))
                .catch((error) => respond({ ok: false, error: error?.message || "Could not update the local library." }));
            return true;
        });
        const update = (change) => { maintain(change).catch(() => {}); };
        events.tabs.onRemoved.addListener(() => update());
        events.tabs.onUpdated.addListener((_tabId, change) => {
            if (change.pinned !== undefined)
                update();
        });
        events.tabs.onActivated.addListener(({ tabId }) => update({ tabId }));
        events.tabs.onReplaced.addListener((addedId, removedId) => update({ addedId, removedId }));
        events.windows.onRemoved.addListener(() => update());
        events.windows.onFocusChanged.addListener((windowId) => update({ windowId }));
    }

    return { registerEventHandlers, request, maintain, whenIdle: () => queue.whenIdle() };
}
