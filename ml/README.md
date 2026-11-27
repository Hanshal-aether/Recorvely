# Recoverly decline classifier

Recoverly's own model. It reads a failed payment's decline code and message and
answers: soft decline, hard decline, auth failure or risk block. It runs inside
the app (`src/lib/ml/ownClassifier.ts`), so there is no Python in production and
no third-party API call.

## How it decides (src/lib/llm/classifier.ts)
1. Exact known decline code → rule table (instant, certain).
2. Otherwise → our model. If it is at least 70% confident, we use it.
3. Otherwise → an optional LLM, only if `GEMINI_API_KEY` is set (set `LLM_PROVIDER=none` to disable).
4. Otherwise → `unknown`, which is routed to human review.

Set `CLASSIFIER_MODE=model_only` to skip the rule table and let the model decide everything.

## Honest status
Training data = 800 synthetic rows (`data/bootstrap.csv`) + 237 rows from public
processor documentation (`data/real/real_seed.csv`, built by `build_real_data.py`).
No real merchant traffic has been used yet.

Test: every distinct message is held out from training (GroupKFold), scored on the
real rows only.

| Model | Accuracy on unseen real messages |
|---|---|
| Logistic regression, balanced (**used in production**) | 81.0% |
| LinearSVC / SGD / LightGBM / ExtraTrees | 78 to 80% |
| LR + SVC + Naive Bayes ensemble | 79.3% |
| XGBoost | 75.5% |
| HistGradientBoosting | 73.4% |

Boosting did **not** beat the linear model here. With ~240 real rows and sparse text
features, more data helps far more than a fancier algorithm. Rerun `python3 ml/benchmark.py`
whenever the data grows. Switch models only if another one wins clearly.

Caveats: some labels are drafts (see `label_source` in `real_seed.csv`), so true accuracy
is uncertain. Class mix in the seed data is not production traffic. Treat 81% as a
starting point, not a promise.

## Data sources (public docs)
Used so far:
* Braintree authorization responses: official Soft/Hard type for each decline code.
* Stripe network decline codes: raw Visa, Mastercard, Amex, Discover codes and meanings.
* Mastercard Merchant Advice Codes: official retry advice (01 new info, 02 try later, 03 never retry).

Good next sources (check each licence and terms before copying):
* Stripe decline codes: https://docs.stripe.com/declines/codes
* Adyen refusal reasons: https://docs.adyen.com/development-resources/refusal-reasons
* Visa decline categories and response codes (retry advice by category, via Checkout.com docs)
* Razorpay error codes and NPCI/UPI response codes (India-specific, important for your merchants)
* Your own merchants' history: the most valuable source, via the file import.

Not useful for this model: public fraud datasets (IEEE-CIS, Kaggle credit-card fraud). They
have no decline codes or messages, only anonymised features, so they can't teach it
what a decline means.

## Retrain
```
python3 ml/gen_data.py          # or put your own CSV in ml/data/
python3 ml/build_real_data.py   # rebuild the real seed
python3 ml/train.py              # trains on synthetic + real, exports model.json
python3 ml/benchmark.py          # compare model types on unseen messages
python3 ml/parity_test.py && npx tsx ml/parity_check.ts   # TypeScript must match Python
```
CSV columns: `decline_code, decline_message, label` (optional `template`, a family id
used for the unseen-family test). Labels: `soft_decline`, `hard_decline`,
`auth_failure`, `risk_block`.

## Next steps to a real model
1. Collect real declines (file imports and ingest already store them) and label
   them: start from the rule/model output and let a person correct it.
2. Keep every correction as a new training row; retrain monthly.
3. Judge it only on declines it has never seen; ship only if that number is good.
4. Keep regulatory rules (retry limits, pre-debit notices, stale-payment cutoffs)
   as a small reviewed config per gateway and regulator, not something the model learns.
