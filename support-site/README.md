# Ztab support page

This optional static page uses Reown AppKit for browser-wallet discovery, WalletConnect QR connections, and mobile wallet links. Payments transfer Circle's native USDC on Base directly to the configured recipient. Reown's separately priced Pay with Wallet product is not used.

The extension remains native JavaScript and does not bundle this page or its wallet SDK. Its local dialog includes 3, 5, 10 USDC and custom amounts, a MetaMask mobile payment link, and an address-only QR/copy fallback. A configured checkout link opens this page in a regular web tab, where browser wallets can inject their providers.

## Local preview

Run `pnpm support:dev` from the repository root, then open `http://127.0.0.1:4173/`. Append `?amount=3` to preselect an amount. Ztab's public Reown Project ID is included in `vite.config.js`, so wallet connection is available without an environment file.

`pnpm support:build` writes the production build to `dist-support/`; `pnpm support:preview` serves that build. `pnpm support:build:preview` uses Vite's preview mode with the same default Project ID. Viewing the page does not initiate a wallet connection.

## Enable wallet connections and deploy

1. Use the public Ztab Project ID already set in `vite.config.js`. To use another Reown project, set `VITE_REOWN_PROJECT_ID` in the build environment or copy `.env.example` to `.env.local` and fill it in. An unset or blank override uses the default. This identifier is browser-visible and is not a wallet key.
2. Run `pnpm support:dev` and test actual desktop and mobile wallets. AppKit loads only when **Connect wallet** is selected. Only Base is configured; email/social login, analytics, swaps, and onramps are disabled.
3. Run `pnpm support:build` and deploy the contents of `dist-support/` to an HTTPS static host. No environment file is required; the production build rejects malformed Project ID overrides. No backend, account database, or signing key is required.
4. Set the deployed origin in the project's [Reown allowlist](https://docs.reown.com/cloud/relay). AppKit metadata uses the current origin. Check the project's current [plan limits](https://reown.com/pricing) before deployment.
5. After the live page is verified, set `SUPPORT_CHECKOUT_URL` in `src/shared/support.js` to its HTTPS URL and run `pnpm package`. This enables **Continue with wallet** in the extension. The link passes only the selected amount; the recipient, token, and chain are fixed in code.

The production URL is deliberately empty until deployment. Neither this page nor the extended wallet flow has been published.

## Payment behavior

**Connect wallet** uses AppKit's existing wallet picker. Connecting does not submit a payment. **Send N USDC** requests a Base network switch if necessary, rechecks the network and account, and opens one USDC transfer for the wallet to approve. It requests no token allowance. A returned transaction hash is shown as **submitted**, with a BaseScan link; receipt confirmation is not monitored.

The payment QR uses [ERC-681](https://eips.ethereum.org/EIPS/eip-681), including the Base chain ID, USDC contract, recipient, and amount in six-decimal atomic units. QR handling varies by wallet. The explicit [MetaMask mobile link](https://docs.metamask.io/metamask-connect/evm/guides/metamask-exclusive/use-deeplinks/) pre-fills these details in MetaMask; address copying remains available for other wallets.

The page accepts only `amount` from its URL. Recipient addresses, chains, and token contracts cannot be overridden through query parameters. No connection or transaction is initiated on page load. Reown may retain connection sessions in browser storage; payment details are public on the blockchain after submission. Never place a private key or seed phrase in this project.
