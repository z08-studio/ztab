import { Interface, isAddress } from "ethers";
import { parseSupportAmount, SUPPORT_AMOUNT_ERROR, SUPPORT_CHAIN_ID, SUPPORT_USDC_ADDRESS, SUPPORT_WALLET_ADDRESS } from "../src/shared/support.js";

const transferInterface = new Interface(["function transfer(address to, uint256 amount) returns (bool)"]);
const chainId = `0x${SUPPORT_CHAIN_ID.toString(16)}`;
const baseNetwork = {
    chainId,
    chainName: "Base",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
};

export function supportTransaction(amount, from) {
    const parsed = parseSupportAmount(amount);
    if (!parsed) throw new Error(SUPPORT_AMOUNT_ERROR);
    if (!isAddress(from)) throw new Error("Connect a wallet before sending.");
    return {
        from,
        to: SUPPORT_USDC_ADDRESS,
        chainId,
        value: "0x0",
        data: transferInterface.encodeFunctionData("transfer", [SUPPORT_WALLET_ADDRESS, parsed.units]),
    };
}

export async function sendSupportPayment(provider, { amount, account }) {
    const transaction = supportTransaction(amount, account);
    const currentChain = await provider.request({ method: "eth_chainId" });
    if (BigInt(currentChain) !== BigInt(SUPPORT_CHAIN_ID)) {
        try {
            await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
        }
        catch (error) {
            if (error.code !== 4902) throw error;
            await provider.request({ method: "wallet_addEthereumChain", params: [baseNetwork] });
            await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
        }
    }
    // Recheck after any wallet prompts; neither a switch nor an account selection
    // is guaranteed to leave the wallet in the state displayed when Pay was clicked.
    if (BigInt(await provider.request({ method: "eth_chainId" })) !== BigInt(SUPPORT_CHAIN_ID)) {
        throw new Error("Switch your wallet to Base, then try again.");
    }
    const accounts = await provider.request({ method: "eth_accounts" });
    if (accounts[0]?.toLowerCase() !== account.toLowerCase()) {
        throw new Error("Your wallet account changed. Review the connected account and try again.");
    }
    const hash = await provider.request({ method: "eth_sendTransaction", params: [transaction] });
    if (typeof hash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
        throw new Error("The wallet did not return a transaction ID. Check your wallet before trying again.");
    }
    return hash;
}
