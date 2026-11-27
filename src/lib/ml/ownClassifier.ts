import model from "./model.json";
import type { DeclineCategory } from "../llm/provider";

/**
 * Our own decline classifier. Runs in-process: no Python, no third-party
 * API, no network call. Trained offline by ml/train.py, which exports
 * model.json. tokenize() here MUST stay identical to tokens() in train.py,
 * otherwise predictions silently drift (ml/parity_test.py guards this).
 */
type Model = {
  classes: string[];
  idf: number[];
  vocab: Record<string, number>;
  coef: number[][];
  intercept: number[];
  heldOutAccuracy: number;
  trainedRows: number;
};
const M = model as unknown as Model;

export function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length >= 2);
  const feats: string[] = [...words];
  for (let i = 0; i < words.length - 1; i++) feats.push(words[i] + " " + words[i + 1]);
  for (const w of words) {
    const p = " " + w + " ";
    for (const n of [3, 4]) {
      for (let i = 0; i + n <= p.length; i++) feats.push("#" + p.slice(i, i + n));
    }
  }
  return feats;
}

export function predictProbabilities(declineCode: string, declineMessage: string): Record<string, number> {
  const counts = new Map<number, number>();
  for (const t of tokenize(`${declineCode} ${declineMessage}`)) {
    const idx = M.vocab[t];
    if (idx !== undefined) counts.set(idx, (counts.get(idx) ?? 0) + 1);
  }
  // TF-IDF (raw tf, smooth idf) then L2-normalise, same as scikit-learn.
  let norm = 0;
  const x = new Map<number, number>();
  counts.forEach((c, idx) => {
    const v = c * M.idf[idx];
    x.set(idx, v);
    norm += v * v;
  });
  norm = Math.sqrt(norm) || 1;

  const scores = M.classes.map((_, k) => {
    let s = M.intercept[k];
    x.forEach((v, idx) => {
      s += (v / norm) * M.coef[k][idx];
    });
    return s;
  });
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  M.classes.forEach((c, k) => (out[c] = exps[k] / sum));
  return out;
}

export function classifyWithOwnModel(declineCode: string, declineMessage: string): {
  category: DeclineCategory;
  confidence: number;
  known: boolean;
} {
  const probs = predictProbabilities(declineCode, declineMessage);
  let best = "unknown";
  let p = 0;
  for (const [c, v] of Object.entries(probs)) if (v > p) { best = c; p = v; }
  // "known" = at least one learned feature matched; otherwise the answer is just the prior.
  const known = tokenize(`${declineCode} ${declineMessage}`).some((t) => M.vocab[t] !== undefined);
  return { category: best as DeclineCategory, confidence: p, known };
}

export const modelInfo = { trainedRows: M.trainedRows, heldOutAccuracy: M.heldOutAccuracy };
