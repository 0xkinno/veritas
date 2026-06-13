// frontend/src/lib/contracts.js
// Read-only contract calls used across all pages
import { ethers }  from "ethers";
import {
  IDENTITY_REGISTRY,
  REPUTATION_REGISTRY,
  VALIDATION_REGISTRY,
} from "./addresses.js";

const VALIDATION_ABI = [
  "function predCount() view returns (uint256)",
  "function getPrediction(uint256) view returns (tuple(uint256 id,uint256 agentId,bytes32 reasoningHash,string market,bool isLong,uint8 confidence,int256 entryPrice,int256 exitPrice,int256 pnl,uint8 status,uint256 committedAt,uint256 validatedAt))",
  "function getAgentPredictions(uint256 agentId) view returns (uint256[])",
  "event PredictionCommitted(uint256 indexed predId, uint256 indexed agentId, bytes32 reasoningHash, string market, bool isLong, uint256 confidence, uint256 timestamp)",
  "event PredictionValidated(uint256 indexed predId, bool wasCorrect, int256 pnl, uint256 timestamp)",
];

const REPUTATION_ABI = [
  "function getScore(uint256 agentId) view returns (uint256)",
  "function getRecord(uint256 agentId) view returns (tuple(uint256 agentId,uint256 score,uint256 totalPreds,uint256 correctPreds,uint256 lastUpdated))",
  "function getAccuracy(uint256 agentId) view returns (uint256)",
  "event ReputationUpdated(uint256 indexed agentId, int256 delta, uint256 newScore, bool wasCorrect)",
];

const IDENTITY_ABI = [
  "function agentCount() view returns (uint256)",
  "function getAgent(uint256 id) view returns (tuple(uint256 id,address owner,string name,bytes32 metadataHash,uint256 registeredAt,bool active))",
  "function getAgentByName(string name) view returns (tuple(uint256 id,address owner,string name,bytes32 metadataHash,uint256 registeredAt,bool active))",
  "event AgentRegistered(uint256 indexed agentId, address indexed owner, string name, bytes32 metadataHash)",
];

function provider() {
  return new ethers.JsonRpcProvider(
    import.meta.env.VITE_MANTLE_RPC || "https://rpc.sepolia.mantle.xyz"
  );
}

export function validationContract() {
  return new ethers.Contract(VALIDATION_REGISTRY, VALIDATION_ABI, provider());
}
export function reputationContract() {
  return new ethers.Contract(REPUTATION_REGISTRY, REPUTATION_ABI, provider());
}
export function identityContract() {
  return new ethers.Contract(IDENTITY_REGISTRY, IDENTITY_ABI, provider());
}

// ── Fetch all predictions (last N) ──
export async function fetchPredictions(limit = 50) {
  try {
    const vc    = validationContract();
    const count = Number(await vc.predCount());
    if (count === 0) return [];

    const ids = [];
    for (let i = count; i >= Math.max(1, count - limit + 1); i--) ids.push(i);

    const results = await Promise.allSettled(
      ids.map(id => vc.getPrediction(id))
    );
    return results
      .filter(r => r.status === "fulfilled")
      .map(r => parsePrediction(r.value));
  } catch (e) {
    console.error("fetchPredictions error:", e);
    return [];
  }
}

// ── Fetch predictions for one agent ──
export async function fetchAgentPredictions(agentId, limit = 20) {
  const vc   = validationContract();
  const ids  = await vc.getAgentPredictions(agentId);
  const take = ids.slice(-limit);
  const results = await Promise.allSettled(take.map(id => vc.getPrediction(Number(id))));
  return results
    .filter(r => r.status === "fulfilled")
    .map(r => parsePrediction(r.value))
    .reverse();
}

// ── Fetch reputation for agent ──
export async function fetchReputation(agentId) {
  const rc = reputationContract();
  const [score, record, accuracy] = await Promise.all([
    rc.getScore(agentId),
    rc.getRecord(agentId),
    rc.getAccuracy(agentId),
  ]);
  return {
    score:      (Number(score) / 100).toFixed(1),
    totalPreds: Number(record.totalPreds),
    correct:    Number(record.correctPreds),
    accuracy:   (Number(accuracy) / 100).toFixed(1),
    lastUpdate: Number(record.lastUpdated),
  };
}

// ── Fetch all agents from identity registry ──
export async function fetchAllAgents() {
  const ic    = identityContract();
  const count = Number(await ic.agentCount());
  const results = await Promise.allSettled(
    Array.from({ length: count }, (_, i) => ic.getAgent(i + 1))
  );
  return results
    .filter(r => r.status === "fulfilled" && r.value.active)
    .map(r => ({
      id:          Number(r.value.id),
      owner:       r.value.owner,
      name:        r.value.name,
      metaHash:    r.value.metadataHash,
      registeredAt: Number(r.value.registeredAt) * 1000,
      active:      r.value.active,
    }));
}

// ── Parse raw prediction tuple ──
function parsePrediction(p) {
  const STATUS = ["Pending", "Verified", "Disproven"];
  return {
    id:           Number(p.id),
    agentId:      Number(p.agentId),
    reasoningHash: p.reasoningHash,
    market:       p.market,
    isLong:       p.isLong,
    confidence:   Number(p.confidence),
    entryPrice:   Number(p.entryPrice)  / 100,
    exitPrice:    Number(p.exitPrice)   / 100,
    pnl:          Number(p.pnl)         / 100,
    status:       STATUS[Number(p.status)] || "Pending",
    committedAt:  Number(p.committedAt) * 1000,
    validatedAt:  Number(p.validatedAt) * 1000,
  };
}

export const EXPLORER = "https://explorer.sepolia.mantle.xyz";
export const AGENT_NAMES = { 1: "VERITAS-01", 2: "VERITAS-02", 3: "VERITAS-03" };
export const AGENT_COLORS = { 1: "#7CFF6B", 2: "#FFD166", 3: "#FF4466" };