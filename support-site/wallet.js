import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { base } from "@reown/appkit/networks";
import iconUrl from "../icons/icon128.png";

export function createSupportWallet(projectId, onAccount) {
    const dark = matchMedia("(prefers-color-scheme: dark)");
    const modal = createAppKit({
        adapters: [new EthersAdapter()],
        networks: [base],
        defaultNetwork: base,
        projectId,
        metadata: {
            name: "Support Ztab",
            description: "Help cover the AI API credits used to build Ztab.",
            url: window.location.origin,
            icons: [new URL(iconUrl, window.location.href).href],
        },
        themeMode: dark.matches ? "dark" : "light",
        themeVariables: { "--w3m-accent": "#79599f", "--w3m-border-radius-master": "2px" },
        features: { analytics: false, email: false, socials: [], swaps: false, onramp: false },
    });
    dark.addEventListener("change", () => modal.setThemeMode(dark.matches ? "dark" : "light"));
    modal.subscribeAccount(onAccount, "eip155");
    onAccount(modal.getAccount("eip155"));
    return {
        open: () => modal.open({ view: modal.getAccount("eip155").isConnected ? "Account" : "Connect", namespace: "eip155" }),
        provider: () => modal.getWalletProvider(),
    };
}
