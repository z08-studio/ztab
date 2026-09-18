import assert from "node:assert/strict";
import test from "node:test";
import { Interface } from "ethers";
import { sendSupportPayment, supportTransaction } from "../support-site/payment.js";
import { SUPPORT_USDC_ADDRESS, SUPPORT_WALLET_ADDRESS } from "../src/shared/support.js";

const account = "0x1111111111111111111111111111111111111111";
const transactionHash = `0x${"ab".repeat(32)}`;

function wallet({ chain = "0x2105", accounts = [account], switchError, failSwitch = false, sendError, hash = transactionHash } = {}) {
  const calls = [];
  const provider = { request: async (request) => {
    calls.push(request);
    if (request.method === "eth_chainId") return chain;
    if (request.method === "eth_accounts") return accounts;
    if (request.method === "wallet_switchEthereumChain") {
      if (switchError) { const error = switchError; switchError = null; throw error; }
      if (!failSwitch) chain = "0x2105";
      return null;
    }
    if (request.method === "wallet_addEthereumChain") return null;
    if (request.method === "eth_sendTransaction") {
      if (sendError) throw sendError;
      return hash;
    }
    throw new Error(`Unexpected request: ${request.method}`);
  } };
  return { provider, calls };
}

test("support transaction transfers exact USDC directly without an approval or native ETH value", () => {
  const transaction = supportTransaction("0.123456", account);
  assert.equal(transaction.chainId, "0x2105");
  assert.equal(transaction.to, SUPPORT_USDC_ADDRESS);
  assert.equal(transaction.from, account);
  assert.equal(transaction.value, "0x0");
  const parsed = new Interface(["function transfer(address,uint256)"]).parseTransaction(transaction);
  assert.equal(parsed.name, "transfer");
  assert.equal(parsed.args[0], SUPPORT_WALLET_ADDRESS);
  assert.equal(parsed.args[1], 123456n);
});

test("invalid amounts fail before asking the wallet anything", async () => {
  const { provider, calls } = wallet();
  await assert.rejects(sendSupportPayment(provider, { amount: "-5", account }), /greater than 0/);
  assert.deepEqual(calls, []);
});

test("sending on Base requests one transaction and returns its hash", async () => {
  const { provider, calls } = wallet();
  assert.equal(await sendSupportPayment(provider, { amount: "5", account }), transactionHash);
  assert.deepEqual(calls.map(({ method }) => method), ["eth_chainId", "eth_chainId", "eth_accounts", "eth_sendTransaction"]);
});

test("a wallet on another chain switches to Base before sending", async () => {
  const { provider, calls } = wallet({ chain: "0x1" });
  await sendSupportPayment(provider, { amount: "3", account });
  assert.deepEqual(calls.find(({ method }) => method === "wallet_switchEthereumChain").params, [{ chainId: "0x2105" }]);
  assert.equal(calls.at(-1).method, "eth_sendTransaction");
});

test("an unknown Base network is added only after the wallet reports error 4902", async () => {
  const { provider, calls } = wallet({ chain: "0x1", switchError: { code: 4902 } });
  await sendSupportPayment(provider, { amount: "10", account });
  const add = calls.find(({ method }) => method === "wallet_addEthereumChain");
  assert.equal(add.params[0].chainId, "0x2105");
  assert.equal(add.params[0].nativeCurrency.symbol, "ETH");
  assert.deepEqual(add.params[0].rpcUrls, ["https://mainnet.base.org"]);
  assert.equal(calls.filter(({ method }) => method === "wallet_switchEthereumChain").length, 2);
});

test("a rejected network switch never submits a transaction", async () => {
  const { provider, calls } = wallet({ chain: "0x1", switchError: { code: 4001 } });
  await assert.rejects(sendSupportPayment(provider, { amount: "5", account }), { code: 4001 });
  assert.ok(!calls.some(({ method }) => method === "eth_sendTransaction" || method === "wallet_addEthereumChain"));
});

test("a wrong network or changed account blocks the transfer after wallet prompts", async () => {
  for (const options of [{ chain: "0x1", failSwitch: true }, { accounts: [] }, { accounts: [SUPPORT_WALLET_ADDRESS] }]) {
    const { provider, calls } = wallet(options);
    await assert.rejects(sendSupportPayment(provider, { amount: "5", account }), /Switch your wallet|account changed/);
    assert.ok(!calls.some(({ method }) => method === "eth_sendTransaction"));
  }
});

test("a rejected transaction is never retried automatically", async () => {
  const { provider, calls } = wallet({ sendError: { code: 4001 } });
  await assert.rejects(sendSupportPayment(provider, { amount: "5", account }), { code: 4001 });
  assert.equal(calls.filter(({ method }) => method === "eth_sendTransaction").length, 1);
});

test("an uncertain wallet response is not reported as a submitted transaction", async () => {
  const { provider } = wallet({ hash: null });
  await assert.rejects(sendSupportPayment(provider, { amount: "5", account }), /Check your wallet before trying again/);
});
