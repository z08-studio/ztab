// Chrome extension APIs are callback-based and report failures through
// chrome.runtime.lastError instead of throwing. These helpers normalize that
// behavior into Promise-based calls used by the controller/store layers.
function runtimeError() {
    if (!chrome.runtime.lastError)
        return null;
    return new Error(chrome.runtime.lastError.message);
}
export function getCommands() {
    return new Promise((resolve, reject) => {
        chrome.commands.getAll((commands) => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve(commands);
        });
    });
}
export function openShortcutSettings() {
    return new Promise((resolve, reject) => {
        chrome.tabs.create({ url: "chrome://extensions/shortcuts" }, (tab) => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve(tab);
        });
    });
}
export function storageGet(keys, area = "local") {
    return new Promise((resolve, reject) => {
        chrome.storage[area].get(keys, (items) => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve(items);
        });
    });
}
export function storageSet(values, area = "local") {
    return new Promise((resolve, reject) => {
        chrome.storage[area].set(values, () => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
export function storageRemove(keys, area = "local") {
    return new Promise((resolve, reject) => {
        chrome.storage[area].remove(keys, () => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
export function getAllCandidateWindows() {
    return new Promise((resolve, reject) => {
        // Chromium currently reports picture-in-picture as "normal". Return the
        // raw candidates so the eligibility registry can classify them safely.
        chrome.windows.getAll({ populate: false, windowTypes: ["normal"] }, (windows) => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve(windows);
        });
    });
}
export function getWindow(windowId) {
    return new Promise((resolve) => {
        chrome.windows.get(windowId, (win) => {
            // Window may disappear between scheduling and execution.
            // Resolve null instead of rejecting so caller can safely ignore it.
            if (runtimeError()) {
                resolve(null);
                return;
            }
            resolve(win);
        });
    });
}
export function getWindowWithTabs(windowId) {
    return new Promise((resolve) => {
        chrome.windows.get(windowId, { populate: true }, (win) => {
            if (runtimeError()) {
                resolve(null);
                return;
            }
            resolve(win);
        });
    });
}
export function createPinnedTab(windowId, url) {
    return new Promise((resolve, reject) => {
        chrome.tabs.create({
            windowId,
            url,
            pinned: true,
            active: false
        }, (tab) => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve(tab || null);
        });
    });
}
export function removeTabs(tabIds) {
    // Avoid unnecessary API calls and noisy errors for empty batches.
    if (tabIds.length === 0)
        return Promise.resolve();
    return new Promise((resolve, reject) => {
        chrome.tabs.remove(tabIds, () => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
export function getTab(tabId) {
    return new Promise((resolve) => {
        chrome.tabs.get(tabId, (tab) => {
            // Tab can vanish during close/teardown races; treat as null.
            if (runtimeError()) {
                resolve(null);
                return;
            }
            resolve(tab);
        });
    });
}
export function moveTabs(tabIds, moveInfo) {
    return new Promise((resolve, reject) => {
        chrome.tabs.move(tabIds, moveInfo, (tabs) => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve(tabs);
        });
    });
}
export function moveTabGroup(groupId, moveInfo) {
    return new Promise((resolve, reject) => {
        chrome.tabGroups.move(groupId, moveInfo, (group) => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve(group);
        });
    });
}
export function getTabGroup(groupId) {
    return new Promise((resolve) => {
        chrome.tabGroups.get(groupId, (group) => {
            resolve(runtimeError() ? null : group);
        });
    });
}
export function updateTabGroup(groupId, updateInfo) {
    return new Promise((resolve, reject) => {
        chrome.tabGroups.update(groupId, updateInfo, (group) => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve(group);
        });
    });
}
export function updateTab(tabId, updateInfo) {
    return new Promise((resolve, reject) => {
        chrome.tabs.update(tabId, updateInfo, (tab) => {
            const error = runtimeError();
            if (error) {
                reject(error);
                return;
            }
            resolve(tab);
        });
    });
}

export function getAllNormalWindowsWithTabs() {
    return new Promise((resolve, reject) => {
        chrome.windows.getAll({ populate: true, windowTypes: ["normal"] }, (windows) => {
            const error = runtimeError();
            if (error)
                reject(error);
            else
                resolve(windows);
        });
    });
}

export function getPanelWindow() {
    return new Promise((resolve) => {
        chrome.windows.getCurrent({ populate: false }, (win) => resolve(runtimeError() ? null : win));
    });
}

export function updateWindow(windowId, updateInfo) {
    return new Promise((resolve, reject) => {
        chrome.windows.update(windowId, updateInfo, (win) => {
            const error = runtimeError();
            if (error)
                reject(error);
            else
                resolve(win);
        });
    });
}

export function createTab(createInfo) {
    return new Promise((resolve, reject) => {
        chrome.tabs.create(createInfo, (tab) => {
            const error = runtimeError();
            if (error)
                reject(error);
            else
                resolve(tab);
        });
    });
}

export function sendMessage(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            const error = runtimeError() || (!response?.ok && new Error(response?.error || "The action could not be completed."));
            if (error)
                reject(error);
            else
                resolve(response);
        });
    });
}
