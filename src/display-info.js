import { getDisplays } from "./background/chrome-api.js";

export function createDisplayReader({ browserWindow = window, permissions = navigator.permissions, getSystemDisplays = getDisplays, onChange = () => {} } = {}) {
    let permissionStatus = null;
    let permissionReady = null;
    let screenDetails = null;

    function observeDetails(details) {
        if (screenDetails === details)
            return;
        screenDetails?.removeEventListener("screenschange", onChange);
        screenDetails = details;
        screenDetails.addEventListener("screenschange", onChange);
    }

    async function initializePermission() {
        if (!browserWindow.getScreenDetails || !permissions?.query)
            return;
        try {
            permissionStatus = await permissions.query({ name: "window-management" });
            permissionStatus.addEventListener("change", onChange);
        }
        catch {
            // Older Chrome versions can still provide numbered displays.
        }
    }

    async function read() {
        permissionReady ||= initializePermission();
        const [systemDisplays] = await Promise.all([getSystemDisplays(), permissionReady]);
        let displays = systemDisplays;
        // Never open a permission prompt while refreshing tabs. On macOS the
        // extension API may omit names; the web API supplies them after consent.
        if (permissionStatus?.state === "granted") {
            try {
                const details = await browserWindow.getScreenDetails();
                if (permissionStatus.state === "granted") {
                    observeDetails(details);
                    displays = Array.from(details.screens, (screen, index) => ({
                        id: `screen-${index}`, name: screen.label,
                        isPrimary: screen.isPrimary, isInternal: screen.isInternal,
                        bounds: { left: screen.left, top: screen.top, width: screen.width, height: screen.height }
                    }));
                }
            }
            catch {
                // A revoked or unavailable permission leaves the live list usable.
            }
        }
        return {
            displays,
            canRequestNames: Boolean(browserWindow.getScreenDetails && permissionStatus
                && permissionStatus.state !== "granted" && displays.length > 1
                && displays.some((display) => !display.name?.trim()))
        };
    }

    async function requestNames() {
        if (permissionStatus?.state === "denied")
            throw new Error("Display names are blocked. Allow window management for Ztab in Chrome's site settings, then try again.");
        try {
            // Called only from the explicit Show display names action.
            observeDetails(await browserWindow.getScreenDetails());
            onChange();
        }
        catch {
            throw new Error("Display names were not enabled. You can keep using display numbers, or try again and allow Chrome's window-management request.");
        }
    }

    return { read, requestNames };
}
