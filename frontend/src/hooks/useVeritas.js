// frontend/src/hooks/useVeritas.js
import { useState, useEffect, useCallback } from "react";
import { getReadContracts } from "../lib/chain.js";
import { getAllTickers }     from "../lib/bybit.js";

export function useLiveTickers() {
  const [tickers, setTickers] = useState([]);
  useEffect(() => {
    const fetch = () => getAllTickers().then(setTickers).catch(() => {});
    fetch();
    const id = setInterval(fetch, 15000);
    return () => clearInterval(id);
  }, []);
  return tickers;
}

export function useAgentReputation(agentId) {
  const [rep, setRep]       = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { reputation } = getReadContracts();
      const [score, record, accuracy] = await Promise.all([
        reputation.getScore(agentId),
        reputation.getRecord(agentId),
        reputation.getAccuracy(agentId),
      ]);
      setRep({
        score:      (Number(score) / 100).toFixed(1),
        totalPreds: Number(record[2]),
        correct:    Number(record[3]),
        accuracy:   (Number(accuracy) / 100).toFixed(1),
      });
    } catch (e) {
      console.error("Rep fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { refresh(); const id = setInterval(refresh, 30000); return () => clearInterval(id); }, [refresh]);
  return { rep, loading, refresh };
}

export function usePredictions(agentId, limit = 20) {
  const [preds, setPreds]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { validation } = getReadContracts();
        const count = Number(await validation.predCount());
        const fetched = [];
        for (let i = Math.max(1, count - limit); i <= count; i++) {
          try {
            const p = await validation.getPrediction(i);
            if (!agentId || Number(p[1]) === agentId) {
              fetched.unshift({
                id:           Number(p[0]),
                agentId:      Number(p[1]),
                reasoningHash: p[2],
                market:       p[3],
                isLong:       p[4],
                confidence:   Number(p[5]),
                entryPrice:   Number(p[6]) / 100,
                exitPrice:    Number(p[7]) / 100,
                pnl:          Number(p[8]) / 100,
                status:       ["Pending","Verified","Disproven"][Number(p[9])],
                committedAt:  Number(p[10]) * 1000,
                validatedAt:  Number(p[11]) * 1000,
              });
            }
          } catch {}
        }
        setPreds(fetched);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetch();
    const id = setInterval(fetch, 20000);
    return () => clearInterval(id);
  }, [agentId, limit]);

  return { preds, loading };
}

export function useBlockNumber() {
  const [block, setBlock] = useState(null);
  useEffect(() => {
    const { validation } = getReadContracts();
    const provider = validation.runner.provider;
    provider.getBlockNumber().then(setBlock);
    const id = setInterval(() => provider.getBlockNumber().then(setBlock), 12000);
    return () => clearInterval(id);
  }, []);
  return block;
}