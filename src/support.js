import { icon } from "./panel-ui.js";
import { SUPPORT_WALLET_ADDRESS } from "./shared/support.js";

export function initSupportDialog() {
    const trigger = document.getElementById("support");
    const dialog = document.getElementById("support-dialog");
    const close = document.getElementById("close-support");
    const address = document.getElementById("support-address");
    const copy = document.getElementById("copy-support-address");
    const status = document.getElementById("support-copy-status");

    trigger.prepend(icon("code"));
    close.append(icon("close"));
    address.value = SUPPORT_WALLET_ADDRESS;

    trigger.addEventListener("click", () => {
        status.textContent = "";
        dialog.showModal();
    });
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("keydown", (event) => {
        if (event.key === "Escape") event.stopPropagation();
    });
    dialog.addEventListener("close", () => trigger.focus({ preventScroll: true }));
    copy.addEventListener("click", async () => {
        copy.disabled = true;
        status.textContent = "";
        try {
            await navigator.clipboard.writeText(SUPPORT_WALLET_ADDRESS);
            status.textContent = "Address copied. Send USDC on Base.";
        }
        catch {
            // Clipboard access can be denied without adding an extension permission.
            address.focus();
            address.select();
            status.textContent = "Copy unavailable. The address is selected for you to copy manually.";
        }
        finally {
            copy.disabled = false;
        }
    });
}
