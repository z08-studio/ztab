import { getActionUserSettings, storageGet, storageSet } from "./background/chrome-api.js";
import { STORAGE_TOOLBAR_PIN_TIP_DISMISSED_KEY } from "./background/constants.js";

export function createToolbarPinTip({ onVisibilityChange, getSettings = getActionUserSettings, readStorage = storageGet, writeStorage = storageSet }) {
    let dismissed = false;
    let generation = 0;

    async function refresh() {
        const current = ++generation;
        if (dismissed)
            return;
        try {
            const [stored, settings] = await Promise.all([
                readStorage([STORAGE_TOOLBAR_PIN_TIP_DISMISSED_KEY]), getSettings()
            ]);
            // Focus, pinning, and another panel's dismissal can race older reads.
            if (current !== generation)
                return;
            dismissed = stored[STORAGE_TOOLBAR_PIN_TIP_DISMISSED_KEY] === true;
            onVisibilityChange(!dismissed && settings?.isOnToolbar === false);
        }
        catch {
            // An optional tip must stay hidden when its eligibility is unknown.
            if (current === generation)
                onVisibilityChange(false);
        }
    }

    async function dismiss() {
        await writeStorage({ [STORAGE_TOOLBAR_PIN_TIP_DISMISSED_KEY]: true });
        dismissed = true;
        generation += 1;
        onVisibilityChange(false);
    }

    return { refresh, dismiss };
}
