import express from "express";
import cors from "cors";
import { runPrediction } from "./predict.js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "VERITAS agent online" });
});

app.get("/tickers", async (req, res) => {
    try {
      const { getMultiTickers } = await import("./bybit.js");
      const tickers = await getMultiTickers();
      res.json(tickers);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  
  app.get("/ticker/:symbol", async (req, res) => {
    try {
      const { getTickerData } = await import("./bybit.js");
      const ticker = await getTickerData(req.params.symbol);
      res.json(ticker);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

app.post("/predict", async (req, res) => {
  try {
    const { agentName, symbol } = req.body;
    console.log(`[SERVER] Incoming request: ${agentName} -> ${symbol}`);
    const result = await runPrediction({ agentName, symbol });
    res.json(result);
  } catch (e) {
    console.error("[SERVER] Error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/validate", async (req, res) => {
    try {
      const { validatePredictionOnchain } = await import("./onchain.js");
      const { predId, wasCorrect, exitPrice, pnlUsd } = req.body;
      const result = await validatePredictionOnchain({ predId, wasCorrect, exitPrice, pnlUsd });
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[VERITAS] Agent server listening on port ${PORT}`);
});