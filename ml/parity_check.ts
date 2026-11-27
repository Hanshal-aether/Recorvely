import { readFileSync } from "fs";
import { predictProbabilities } from "../src/lib/ml/ownClassifier";

const expected = JSON.parse(readFileSync("ml/data/parity_expected.json", "utf8"));
let worst = 0;
for (const e of expected) {
  const got = predictProbabilities(e.code, e.message);
  for (const k of Object.keys(e.probs)) worst = Math.max(worst, Math.abs(got[k] - e.probs[k]));
}
console.log("max |python - typescript| probability difference:", worst.toExponential(2));
if (worst > 1e-3) { console.error("PARITY FAILED"); process.exit(1); }
console.log("parity OK");
