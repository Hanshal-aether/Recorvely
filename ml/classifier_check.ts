import { classifyDecline } from "../src/lib/llm/classifier";
import { decidePolicy } from "../src/lib/policy/engine";

(async () => {
  const base = { amountPaise: 49900, attemptNumber: 1 };
  const cases: [string, string][] = [
    ["insufficient_funds", "Insufficient funds"],           // rule
    ["INSUFFICIENT_BALANCE_X", "Not enough balance left"],   // model
    ["card_blocked_by_bank", "Card was blocked by the bank, stolen"], // model, new wording
    ["zzz_123", "qwerty"],                                   // nothing matches
  ];
  for (const [c, m] of cases) {
    const r = await classifyDecline({ declineCode: c, declineMessage: m, ...base });
    console.log(c.padEnd(24), r.method.padEnd(5), r.category.padEnd(13), r.confidence.toFixed(2));
  }
  process.env.CLASSIFIER_MODE = "model_only";
  const r = await classifyDecline({ declineCode: "insufficient_funds", declineMessage: "Insufficient funds", ...base });
  console.log("model_only".padEnd(24), r.method.padEnd(5), r.category.padEnd(13), r.confidence.toFixed(2));

  const old = decidePolicy({ category: "soft_decline", attemptNumber: 1, originalFailedAt: new Date(Date.now() - 90 * 864e5) });
  const fresh = decidePolicy({ category: "soft_decline", attemptNumber: 1, originalFailedAt: new Date() });
  console.log("90-day-old soft decline ->", old.action, "| fresh ->", fresh.action);
})();
