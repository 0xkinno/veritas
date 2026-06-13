// agent/onchain.js — Real Mantle transactions via ERC-8004 registries
import { ethers } from "ethers";
import { createHash } from "crypto";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// Minimal ABIs
const VALIDATION_ABI = [
  "function commitPrediction(uint256 agentId, bytes32 reasoningHash, string market, bool isLong, uint8 confidence, int256 entryPrice) returns (uint256)",
  "function validatePrediction(uint256 predId, bool wasCorrect, int256 exitPrice, int256 pnl) external",
  "function getPrediction(uint256 id) view returns (tuple(uint256,uint256,bytes32,string,bool,uint8,int256,int256,int256,uint8,uint256,uint256))",
  "function predCount() view returns (uint256)",
  "event PredictionCommitted(uint256 indexed predId, uint256 indexed agentId, bytes32 reasoningHash, string market, bool isLong, uint256 confidence, uint256 timestamp)",
  "event PredictionValidated(uint256 indexed predId, bool wasCorrect, int256 pnl, uint256 timestamp)",
];

const REPUTATION_ABI = [
  "function getScore(uint256 agentId) view returns (uint256)",
  "function getRecord(uint256 agentId) view returns (tuple(uint256,uint256,uint256,uint256,uint256))",
  "function getAccuracy(uint256 agentId) view returns (uint256)",
  "event ReputationUpdated(uint256 indexed agentId, int256 delta, uint256 newScore, bool wasCorrect)",
];

const IDENTITY_ABI = [
  "function getAgent(uint256 id) view returns (tuple(uint256,address,string,bytes32,uint256,bool))",
  "function getAgentByName(string name) view returns (tuple(uint256,address,string,bytes32,uint256,bool))",
  "function agentCount() view returns (uint256)",
];

export function getProvider() {
  return new ethers.JsonRpcProvider(
    process.env.MANTLE_TESTNET_RPC || "https://rpc.sepolia.mantle.xyz",
    { chainId: 5003, name: "mantle-testnet" },
    { staticNetwork: true }
  );
}

export function getSigner() {
  return new ethers.Wallet(process.env.PRIVATE_KEY, getProvider());
}

export function getContracts() {
  const signer = getSigner();
  return {
    validation: new ethers.Contract(process.env.VALIDATION_REGISTRY, VALIDATION_ABI, signer),
    reputation: new ethers.Contract(process.env.REPUTATION_REGISTRY, REPUTATION_ABI, signer),
    identity:   new ethers.Contract(process.env.IDENTITY_REGISTRY,   IDENTITY_ABI,   signer),
  };
}

export function buildReasoningHash(reasoning, market, direction, confidence) {
  const raw = `${reasoning}|${market}|${direction}|${confidence}|${Date.now()}`;
  return "0x" + createHash("sha256").update(raw).digest("hex");
}

export async function commitPredictionOnchain({ agentId, reasoning, market, isLong, confidence, entryPrice }) {
  const { validation } = getContracts();
  const reasoningHash  = buildReasoningHash(reasoning, market, isLong ? "LONG" : "SHORT", confidence);
  const entryScaled    = Math.round(entryPrice * 100);

  const tx = await validation.commitPrediction(
    agentId,
    reasoningHash,
    market,
    isLong,
    confidence,
    entryScaled,
    { gasLimit: 300000 }
  );

  // Poll for receipt instead of tx.wait() on slow testnet
  let receipt = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    receipt = await getProvider().getTransactionReceipt(tx.hash);
    if (receipt) break;
  }

  if (!receipt) throw new Error("Tx not confirmed after 60s: " + tx.hash);

  const predCount = await validation.predCount();
  return {
    txHash:       tx.hash,
    blockNumber:  receipt.blockNumber,
    predId:       predCount.toString(),
    reasoningHash,
    gasUsed:      receipt.gasUsed.toString(),
  };
}

export async function validatePredictionOnchain({ predId, wasCorrect, exitPrice, pnlUsd }) {
  const { validation } = getContracts();
  const exitScaled = Math.round(exitPrice * 100);
  const pnlScaled  = Math.round(pnlUsd * 100);

  const tx = await validation.validatePrediction(predId, wasCorrect, exitScaled, pnlScaled, { gasLimit: 200000 });
  let receipt = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    receipt = await getProvider().getTransactionReceipt(tx.hash);
    if (receipt) break;
  }
  return { txHash: tx.hash, blockNumber: receipt?.blockNumber };
}

export async function fetchAgentReputation(agentId) {
  const { reputation } = getContracts();
  const [score, record, accuracy] = await Promise.all([
    reputation.getScore(agentId),
    reputation.getRecord(agentId),
    reputation.getAccuracy(agentId),
  ]);
  return {
    score:      (Number(score) / 100).toFixed(2),
    totalPreds: Number(record[2]),
    correct:    Number(record[3]),
    accuracy:   (Number(accuracy) / 100).toFixed(2),
    lastUpdate: Number(record[4]),
  };
}

export async function fetchAllPredictions(agentId) {
  const { validation } = getContracts();
  const ids = await validation.getAgentPredictions ? 
    // If available on-chain:
    [] : [];
  // Fall back: query predCount and iterate
  const count = Number(await validation.predCount());
  const preds = [];
  for (let i = Math.max(1, count - 20); i <= count; i++) {
    try {
      const p = await validation.getPrediction(i);
      if (Number(p[1]) === agentId) preds.push(p);
    } catch {}
  }
  return preds;
}