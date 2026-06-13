// agent/predict.js — Full prediction pipeline: signal → reason → commit → validate
import { getTickerData, getKlines } from "./bybit.js";
import { getConsensus }             from "./reasoning.js";
import { commitPredictionOnchain, validatePredictionOnchain } from "./onchain.js";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// Agent name → on-chain ID (set after deploy)
const AGENT_IDS = {
  "VERITAS-01": 1,
  "VERITAS-02": 2,
  "VERITAS-03": 3,
};

export async function runPrediction({ agentName = "VERITAS-01", symbol = "ETHUSDT" }) {
  console.log(`\n[VERITAS] Running prediction: ${agentName} → ${symbol}`);
  const steps = [];

  // ── STEP 1: SIGNAL ──
  console.log("[1] Fetching signals from Bybit...");
  const ticker = await getTickerData(symbol);
  const klines  = await getKlines(symbol, "60", 24);
  const closes  = klines.map(k => k.close);
  const trend   = closes[0] > closes[closes.length - 1] ? "DOWNTREND" : "UPTREND";
  const spread  = ticker.lastPrice * 0.0001;
  const marketData = { ...ticker, trend, spread };
  steps.push({ step: "SIGNAL", status: "done", data: { price: ticker.lastPrice, funding: ticker.fundingRate, trend } });
  console.log(`✓ Signal: $${ticker.lastPrice} | Funding: ${(ticker.fundingRate*100).toFixed(4)}% | ${trend}`);

  // ── STEP 2: REASON (3-model Claude consensus) ──
  console.log("[2] Running 3-model Claude consensus...");
  const consensus = await getConsensus(marketData);
  steps.push({ step: "REASON", status: "done", data: consensus });
  console.log(`✓ Consensus: ${consensus.direction} | Confidence: ${consensus.confidence}% | Votes: ${consensus.consensus}`);

  // ── RISK MANAGEMENT — circuit breaker ──
  const RISK_RULES = {
    MIN_CONFIDENCE: 60,
    BLOCK_HIGH_RISK: true,
    CIRCUIT_BREAKER: 3,
  };
  if (consensus.confidence < RISK_RULES.MIN_CONFIDENCE) {
    console.log(`⚠ Skipped — confidence ${consensus.confidence}% below threshold`);
    return { skipped: true, reason: "Confidence below 60% threshold", consensus, steps };
  }
  if (RISK_RULES.BLOCK_HIGH_RISK && consensus.riskLevel === "HIGH") {
    console.log(`⚠ Skipped — risk level HIGH, circuit breaker active`);
    return { skipped: true, reason: "Risk level HIGH — circuit breaker triggered", consensus, steps };
  }

  // ── STEP 3: COMMIT to Mantle (before execution) ──
  console.log("[3] Committing reasoning hash to Mantle...");
  const agentId    = AGENT_IDS[agentName] || 1;
  const isLong     = consensus.direction === "LONG";
  const onchain = await commitPredictionOnchain({
    agentId,
    reasoning:  consensus.reasoning,
    market:     symbol,
    isLong,
    confidence: consensus.confidence,
    entryPrice: ticker.lastPrice,
  });
  steps.push({ step: "COMMIT", status: "done", data: onchain });
  console.log(`✓ Committed: ${onchain.txHash} | Block #${onchain.blockNumber} | PredID: ${onchain.predId}`);

  // ── STEP 4: EXECUTE (simulated — replace with real Bybit order if needed) ──
  console.log("[4] Logging execution...");
  const executionLog = {
    predId:    onchain.predId,
    agentId,
    symbol,
    direction: consensus.direction,
    entryPrice: ticker.lastPrice,
    executedAt: new Date().toISOString(),
    txHash:     onchain.txHash,
  };
  steps.push({ step: "EXECUTE", status: "done", data: executionLog });

  return {
    agentName,
    symbol,
    direction:     consensus.direction,
    confidence:    consensus.confidence,
    reasoning:     consensus.reasoning,
    reasoningHash: onchain.reasoningHash,
    modelVotes:    consensus.modelVotes,
    keySignal:     consensus.keySignal,
    entryPrice:    ticker.lastPrice,
    predId:        onchain.predId,
    txHash:        onchain.txHash,
    blockNumber:   onchain.blockNumber,
    steps,
    timestamp:     Date.now(),
  };
}

// CLI usage: node predict.js VERITAS-01 ETHUSDT
if (process.argv[1].endsWith("predict.js")) {
  const [,, agent = "VERITAS-01", sym = "ETHUSDT"] = process.argv;
  runPrediction({ agentName: agent, symbol: sym })
    .then(r => console.log("\n[RESULT]", JSON.stringify(r, null, 2)))
    .catch(e => { console.error(e); process.exit(1); });
}