import { icon } from "./panel-ui.js";
import { SUPPORT_WALLET_ADDRESS, supportCheckoutUrl } from "./shared/support.js";
import { initSupportAmount } from "./support-amount.js";

export function initSupportDialog() {
    const trigger = document.getElementById("support");
    const dialog = document.getElementById("support-dialog");
    const close = document.getElementById("close-support");
    const address = document.getElementById("support-address");
    const copy = document.getElementById("copy-support-address");
    const status = document.getElementById("support-copy-status");
    const instructions = document.getElementById("support-instructions");
    const pay = document.getElementById("support-pay");
    let amount = null;

    trigger.prepend(icon("code"));
    close.append(icon("close"));
    address.value = SUPPORT_WALLET_ADDRESS;
    initSupportAmount(document.getElementById("support-amount"), (value) => {
        amount = value;
        status.textContent = "";
        instructions.textContent = amount
            ? `Scan or copy the address, then send ${amount.amount} USDC on Base. This QR contains the address only; enter the amount in your wallet.`
            : "Choose an amount to continue. You can also copy the address and enter an amount in your wallet.";
        const checkout = supportCheckoutUrl(amount?.amount);
        pay.hidden = !checkout;
        if (checkout) pay.href = checkout;
        else pay.removeAttribute("href");
    });

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
            status.textContent = amount ? `Address copied. Send ${amount.amount} USDC on Base.` : "Address copied. Send USDC on Base.";
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
