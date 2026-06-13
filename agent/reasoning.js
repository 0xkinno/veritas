// agent/reasoning.js — 3-model Groq consensus (free, fast)
import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

const SYSTEM = `You are VERITAS, an institutional-grade AI trading analyst on Mantle Network.
Analyze the provided market data and respond ONLY in this exact JSON format with no other text:
{
  "direction": "LONG or SHORT",
  "confidence": 55,
  "reasoning": "2-3 sentence explanation citing specific data points from the input",
  "keySignal": "single most important signal driving this decision",
  "riskLevel": "LOW or MEDIUM or HIGH"
}`;

export async function getConsensus(marketData) {
  const prompt = `Market: ${marketData.symbol}
Price: $${marketData.lastPrice}
24h Change: ${marketData.price24hPct?.toFixed(2)}%
Funding Rate: ${(marketData.fundingRate * 100).toFixed(4)}%
Open Interest: $${(marketData.openInterest / 1e6).toFixed(1)}M
Volume 24h: $${(marketData.volume24h / 1e6).toFixed(1)}M
Trend (recent): ${marketData.trend || "NEUTRAL"}

Analyze and return JSON prediction only.`;

  const results = await Promise.allSettled(
    MODELS.map(model =>
      client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user",   content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }).then(r => {
        const text = r.choices[0].message.content.trim();
        // Strip any markdown fences if model adds them
        const clean = text.replace(/```json|```/g, "").trim();
        return JSON.parse(clean);
      })
    )
  );

  const votes = results
    .filter(r => r.status === "fulfilled")
    .map(r => r.value);

  if (votes.length === 0) throw new Error("All 3 models failed to respond");

  const longVotes  = votes.filter(v => v.direction === "LONG").length;
  const shortVotes = votes.filter(v => v.direction === "SHORT").length;
  const direction  = longVotes >= shortVotes ? "LONG" : "SHORT";
  const avgConf    = Math.round(votes.reduce((s,v) => s + v.confidence, 0) / votes.length);
  const winner     = votes.find(v => v.direction === direction) || votes[0];

  return {
    direction,
    confidence:  avgConf,
    reasoning:   winner.reasoning,
    keySignal:   winner.keySignal,
    riskLevel:   winner.riskLevel,
    modelVotes:  votes.map((v, i) => ({ model: MODELS[i] || "unknown", ...v })),
    consensus:   `${Math.max(longVotes, shortVotes)}/${votes.length}`,
    longVotes,
    shortVotes,
  };
}