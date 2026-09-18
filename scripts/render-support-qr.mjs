import QRCode from "qrcode";
import { fileURLToPath } from "node:url";
import { SUPPORT_WALLET_ADDRESS } from "../src/shared/support.js";

// A plain address is readable by wallet scanners that do not support payment URIs.
// The dialog tells the sender which network and token to select.
const output = fileURLToPath(new URL("../icons/support-base-usdc.png", import.meta.url));
await QRCode.toFile(output, SUPPORT_WALLET_ADDRESS, {
  width: 192,
  margin: 4,
  errorCorrectionLevel: "M",
});
console.log(`Support QR: ${output}`);
