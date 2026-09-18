import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import {
  parseSupportAmount, SUPPORT_WALLET_ADDRESS, SUPPORT_USDC_ADDRESS,
  supportCheckoutUrl, supportPaymentUri, supportMetaMaskUrl,
} from "../src/shared/support.js";

test("the bundled support QR decodes to the same recipient as the copy button", () => {
  const png = PNG.sync.read(readFileSync(new URL("../icons/support-base-usdc.png", import.meta.url)));
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  assert.ok(result, "The packaged support QR must be scannable");
  assert.equal(result.data, SUPPORT_WALLET_ADDRESS);
  assert.match(SUPPORT_WALLET_ADDRESS, /^0x[0-9a-fA-F]{40}$/);
});

test("support amounts retain six-decimal USDC precision without floating-point rounding", () => {
  for (const [input, amount, units] of [
    ["3", "3", 3_000_000n], ["5", "5", 5_000_000n], ["10", "10", 10_000_000n],
    ["0003.500000", "3.5", 3_500_000n], ["0.000001", "0.000001", 1n],
    [" 1.234567 ", "1.234567", 1_234_567n],
    ["9007199254.740993", "9007199254.740993", 9_007_199_254_740_993n],
  ]) assert.deepEqual(parseSupportAmount(input), { amount, units });
});

test("invalid and overflowing amounts cannot create a payment request", () => {
  for (const value of ["", "0", "0.000000", "-3", "1e6", "1,5", "1.0000001", "3.", ".5", "NaN", "Infinity", "9".repeat(73)]) {
    assert.equal(parseSupportAmount(value), null, value);
    assert.equal(supportPaymentUri(value), "", value);
    assert.equal(supportMetaMaskUrl(value), "", value);
  }
  const overflow = ((1n << 256n) / 1_000_000n + 1n).toString();
  assert.equal(parseSupportAmount(overflow), null);
});

test("wallet links request native Base USDC with the exact recipient and atomic amount", () => {
  const request = `${SUPPORT_USDC_ADDRESS}@8453/transfer?address=${SUPPORT_WALLET_ADDRESS}&uint256=1234567`;
  assert.equal(supportPaymentUri("1.234567"), `ethereum:${request}`);
  assert.equal(supportMetaMaskUrl("1.234567"), `https://link.metamask.io/send/${request}`);
});

test("checkout is unavailable until configured and passes only a normalized amount", () => {
  assert.equal(supportCheckoutUrl("5"), "");
  for (const url of ["javascript:alert(1)", "http://example.com", "https://user:password@example.com", "not a URL"]) {
    assert.equal(supportCheckoutUrl("5", url), "");
  }
  assert.equal(supportCheckoutUrl("0005.00", "https://example.com/support/"), "https://example.com/support/?amount=5");
  assert.equal(supportCheckoutUrl("-1", "https://example.com/support/"), "");
});
