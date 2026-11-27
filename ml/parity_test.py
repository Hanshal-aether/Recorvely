"""Writes expected probabilities from the Python model for a few samples, so the
TypeScript implementation can be checked against them (ml/parity_check.ts)."""
import csv, json, sys
sys.path.insert(0, "ml")
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import importlib.util, re

def tokens(text):
    words = re.sub(r"[^a-z0-9]+", " ", text.lower()).split()
    words = [w for w in words if len(w) >= 2]
    feats = words + [a + " " + b for a, b in zip(words, words[1:])]
    for w in words:
        p = " " + w + " "
        for n in (3, 4):
            feats += ["#" + p[i:i + n] for i in range(len(p) - n + 1)]
    return feats

rows = list(csv.DictReader(open("ml/data/bootstrap.csv"))) + list(csv.DictReader(open("ml/data/real/real_seed.csv")))
X = [f'{r["decline_code"]} {r["decline_message"]}' for r in rows]
y = np.array([r["label"] for r in rows])
vec = TfidfVectorizer(analyzer=tokens); clf = LogisticRegression(max_iter=3000, C=8.0, class_weight="balanced")
clf.fit(vec.fit_transform(X), y)
samples = [("insufficient_funds","Not enough money"), ("EXPIRED_CARD","card is expired"), ("xyz_unknown","something weird"),
           ("otp_not_entered","OTP not entered in time"), ("risk_threshold_exceeded","Blocked by risk engine")]
out = []
for c, m in samples:
    p = clf.predict_proba(vec.transform([f"{c} {m}"]))[0]
    out.append({"code": c, "message": m, "probs": dict(zip(clf.classes_, map(float, p)))})
json.dump(out, open("ml/data/parity_expected.json", "w"), indent=1)
print("wrote ml/data/parity_expected.json")
