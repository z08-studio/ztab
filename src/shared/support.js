// Regenerate the bundled QR with `pnpm assets:support` when this address changes.
export const SUPPORT_WALLET_ADDRESS = "0x66Ddc3FFD539bFf654FBd8ea79F08aeBeA2437cc";

export const SUPPORT_CHAIN_ID = 8453;
// Circle's native USDC on Base: https://developers.circle.com/stablecoins/usdc-contract-addresses
export const SUPPORT_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const SUPPORT_DEFAULT_AMOUNT = "5";
export const SUPPORT_AMOUNT_ERROR = "Enter an amount greater than 0, with up to 6 decimal places.";

// Set this only after the support site and its Reown project are ready.
// Leaving it empty keeps the extension's local scan/copy flow available.
export const SUPPORT_CHECKOUT_URL = "";

export function parseSupportAmount(value) {
    const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(String(value).trim());
    if (!match) return null;
    const whole = match[1].replace(/^0+(?=\d)/, "");
    const fraction = (match[2] || "").replace(/0+$/, "");
    // Avoid floating-point rounding when preparing a token transfer.
    if (whole.length > 72) return null;
    const units = BigInt(whole) * 1_000_000n + BigInt((fraction || "").padEnd(6, "0"));
    if (units <= 0n || units > (1n << 256n) - 1n) return null;
    return { amount: fraction ? `${whole}.${fraction}` : whole, units };
}

export function supportCheckoutUrl(amount, baseUrl = SUPPORT_CHECKOUT_URL) {
    const parsed = parseSupportAmount(amount);
    if (!baseUrl || !parsed) return "";
    try {
        const url = new URL(baseUrl);
        if (url.protocol !== "https:" || url.username || url.password) return "";
        url.searchParams.set("amount", parsed.amount);
        return url.href;
    }
    catch {
        return "";
    }
}

export function supportPaymentUri(amount) {
    const parsed = parseSupportAmount(amount);
    if (!parsed) return "";
    return `ethereum:${SUPPORT_USDC_ADDRESS}@${SUPPORT_CHAIN_ID}/transfer?address=${SUPPORT_WALLET_ADDRESS}&uint256=${parsed.units}`;
}

export function supportMetaMaskUrl(amount) {
    const uri = supportPaymentUri(amount);
    return uri ? uri.replace("ethereum:", "https://link.metamask.io/send/") : "";
}
