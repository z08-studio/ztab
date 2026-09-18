import QRCode from "qrcode";
import brandIcon from "../icons/icon48.png";
import favicon from "../icons/icon32.png";
import { initSupportAmount } from "../src/support-amount.js";
import { SUPPORT_DEFAULT_AMOUNT, SUPPORT_WALLET_ADDRESS, supportPaymentUri } from "../src/shared/support.js";

const amountFields = document.getElementById("support-amount");
const connect = document.getElementById("connect-wallet");
const pay = document.getElementById("pay");
const accountLabel = document.getElementById("wallet-account");
const status = document.getElementById("payment-status");
const transactionLink = document.getElementById("transaction");
const manual = document.getElementById("manual-payment");
const manualInstructions = document.getElementById("manual-instructions");
const qr = document.getElementById("payment-qr");
const address = document.getElementById("recipient");
const copy = document.getElementById("copy-address");
const copyStatus = document.getElementById("copy-status");
const projectId = (import.meta.env.VITE_REOWN_PROJECT_ID || "").trim();
let amount = null;
let account = null;
let wallet = null;
let busy = false;
let submitted = false;

address.value = SUPPORT_WALLET_ADDRESS;
document.getElementById("brand-icon").src = brandIcon;
document.getElementById("support-favicon").href = favicon;

function setStatus(message, error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
}

function updateControls() {
    amountFields.disabled = busy || submitted;
    connect.disabled = busy || submitted || !projectId;
    connect.textContent = account ? "Change wallet" : "Connect wallet";
    pay.hidden = !account;
    pay.disabled = busy || submitted || !amount;
    pay.textContent = submitted ? "Transaction submitted" : busy ? "Confirm in your wallet…" : amount ? `Send ${amount.amount} USDC` : "Choose an amount";
    accountLabel.hidden = !account;
    accountLabel.textContent = account ? `From ${account}` : "";
}

initSupportAmount(amountFields, (value) => {
    amount = value;
    copyStatus.textContent = "";
    qr.hidden = !amount;
    manualInstructions.textContent = amount ? `${amount.amount} USDC on Base` : "Choose an amount above.";
    if (amount) {
        // This is a payment request, not an address-only QR: it includes Base,
        // Circle's USDC contract, the recipient, and the exact atomic amount.
        QRCode.toCanvas(qr, supportPaymentUri(amount.amount), { width: 224, margin: 4, errorCorrectionLevel: "M" })
            .catch(() => { qr.hidden = true; });
    }
    updateControls();
}, new URLSearchParams(window.location.search).get("amount") ?? SUPPORT_DEFAULT_AMOUNT);

if (!projectId) {
    document.getElementById("wallet-help").hidden = true;
    manual.open = true;
    setStatus("Wallet connection is currently unavailable. You can still scan or copy the payment details.");
}

connect.addEventListener("click", async () => {
    if (busy || submitted || !projectId) return;
    busy = true;
    updateControls();
    setStatus("");
    try {
        if (!wallet) {
            // Loading only after a click keeps wallet service requests separate
            // from viewing the support page or copying its public address.
            const { createSupportWallet } = await import("./wallet.js");
            wallet = createSupportWallet(projectId, (state) => {
                account = state.isConnected ? state.address : null;
                updateControls();
            });
        }
        await wallet.open();
    }
    catch {
        setStatus("Could not open wallet connection. Try again, or scan the payment QR.", true);
        manual.open = true;
    }
    finally {
        busy = false;
        updateControls();
    }
});

pay.addEventListener("click", async () => {
    if (busy || submitted || !amount || !account) return;
    const provider = wallet?.provider();
    if (!provider) {
        setStatus("Reconnect your wallet to continue.", true);
        return;
    }
    busy = true;
    updateControls();
    setStatus("Review the amount and network fee in your wallet.");
    try {
        const { sendSupportPayment } = await import("./payment.js");
        const hash = await sendSupportPayment(provider, { amount: amount.amount, account });
        submitted = true;
        transactionLink.href = `https://basescan.org/tx/${hash}`;
        transactionLink.hidden = false;
        setStatus("Transaction submitted. Check BaseScan for confirmation. Thank you for supporting Ztab.");
    }
    catch (error) {
        setStatus(error.code === 4001
            ? "Request cancelled in your wallet. You can try again when ready."
            : `${error.shortMessage || error.message || "Could not confirm the transaction."} Check your wallet before trying again.`, true);
    }
    finally {
        busy = false;
        updateControls();
    }
});

copy.addEventListener("click", async () => {
    copy.disabled = true;
    try {
        await navigator.clipboard.writeText(SUPPORT_WALLET_ADDRESS);
        copyStatus.textContent = amount ? `Address copied. Send ${amount.amount} USDC on Base.` : "Address copied. Select USDC on Base in your wallet.";
    }
    catch {
        address.focus();
        address.select();
        copyStatus.textContent = "Copy unavailable. The address is selected for you to copy manually.";
    }
    finally { copy.disabled = false; }
});
