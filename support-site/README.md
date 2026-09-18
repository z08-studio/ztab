# Ztab support page

This optional static page uses Reown AppKit for browser-wallet discovery, WalletConnect QR connections, and mobile wallet links. Payments transfer Circle's native USDC on Base directly to the configured recipient. Reown's separately priced Pay with Wallet product is not used.

The extension remains native JavaScript and does not bundle this page or its wallet SDK. Its local dialog includes 3, 5, 10 USDC and custom amounts, a MetaMask mobile payment link, and an address-only QR/copy fallback. A configured checkout link opens this page in a regular web tab, where browser wallets can inject their providers.

## Local preview

Run `pnpm support:dev` from the repository root, then open `http://127.0.0.1:4173/`. Append `?amount=3` to preselect an amount. Without a Project ID, wallet connection is disabled and the payment QR and copy action remain usable.

`pnpm support:build:preview` writes a local preview to `dist-support/`; `pnpm support:preview` serves that build. The preview can be reviewed without creating a Reown account. It does not verify a live wallet connection.

## Enable wallet connections and deploy

1. Create a Ztab project in the [Reown dashboard](https://dashboard.reown.com). Copy `support-site/.env.example` to `support-site/.env.local` and set `VITE_REOWN_PROJECT_ID`. It is a browser-visible application identifier, not a wallet key. Keep the local environment file out of Git.
2. Run `pnpm support:dev` and test actual desktop and mobile wallets. AppKit loads only when **Connect wallet** is selected. Only Base is configured; email/social login, analytics, swaps, and onramps are disabled.
3. Run `pnpm support:build` and deploy the contents of `dist-support/` to an HTTPS static host. The production build rejects a missing or malformed Project ID. No backend, account database, or signing key is required.
4. Set the deployed origin in the project's [Reown allowlist](https://docs.reown.com/cloud/relay). AppKit metadata uses the current origin. Check the project's current [plan limits](https://reown.com/pricing) before deployment.
5. After the live page is verified, set `SUPPORT_CHECKOUT_URL` in `src/shared/support.js` to its HTTPS URL and run `pnpm package`. This enables **Continue with wallet** in the extension. The link passes only the selected amount; the recipient, token, and chain are fixed in code.

The production URL is deliberately empty until deployment. Neither this page nor the extended wallet flow has been published.

## Payment behavior

**Connect wallet** uses AppKit's existing wallet picker. Connecting does not submit a payment. **Send N USDC** requests a Base network switch if necessary, rechecks the network and account, and opens one USDC transfer for the wallet to approve. It requests no token allowance. A returned transaction hash is shown as **submitted**, with a BaseScan link; receipt confirmation is not monitored.

The payment QR uses [ERC-681](https://eips.ethereum.org/EIPS/eip-681), including the Base chain ID, USDC contract, recipient, and amount in six-decimal atomic units. QR handling varies by wallet. The explicit [MetaMask mobile link](https://docs.metamask.io/metamask-connect/evm/guides/metamask-exclusive/use-deeplinks/) pre-fills these details in MetaMask; address copying remains available for other wallets.

The page accepts only `amount` from its URL. Recipient addresses, chains, and token contracts cannot be overridden through query parameters. No connection or transaction is initiated on page load. Reown may retain connection sessions in browser storage; payment details are public on the blockchain after submission. Never place a private key or seed phrase in this project.
