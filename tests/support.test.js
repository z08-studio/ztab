import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { SUPPORT_WALLET_ADDRESS } from "../src/shared/support.js";

test("the bundled support QR decodes to the same recipient as the copy button", () => {
  const png = PNG.sync.read(readFileSync(new URL("../icons/support-base-usdc.png", import.meta.url)));
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  assert.ok(result, "The packaged support QR must be scannable");
  assert.equal(result.data, SUPPORT_WALLET_ADDRESS);
  assert.match(SUPPORT_WALLET_ADDRESS, /^0x[0-9a-fA-F]{40}$/);
});
