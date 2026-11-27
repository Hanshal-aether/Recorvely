"""Train the Recoverly decline classifier and export it as JSON.

Usage:  python3 ml/train.py [csv ...]
Default data: ml/data/bootstrap.csv (synthetic) + ml/data/real/real_seed.csv (from public docs)
Columns: decline_code, decline_message, label   (family/template columns are ignored)

Honest evaluation: GroupKFold where each group is one distinct message, so wording seen
in training never appears in the test fold. Accuracy is reported on the REAL rows only.

The exported src/lib/ml/model.json is read by src/lib/ml/ownClassifier.ts: same
tokenizer, same TF-IDF, same linear model, so no Python runs in production.
"""
import csv, json, re, sys
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, classification_report
from sklearn.model_selection import GroupKFold

def tokens(text: str):
    # MUST match tokenize() in src/lib/ml/ownClassifier.ts
    words = re.sub(r"[^a-z0-9]+", " ", text.lower()).split()
    words = [w for w in words if len(w) >= 2]
    feats = words + [a + " " + b for a, b in zip(words, words[1:])]
    for w in words:
        p = " " + w + " "
        for n in (3, 4):
            feats += ["#" + p[i:i + n] for i in range(len(p) - n + 1)]
    return feats

paths = sys.argv[1:] or ["ml/data/bootstrap.csv", "ml/data/real/real_seed.csv"]
rows = []
for p in paths:
    real = "/real/" in p.replace("\\", "/")
    for r in csv.DictReader(open(p)):
        rows.append((f'{r["decline_code"]} {r["decline_message"]}', r["label"],
                     r["decline_message"].lower().strip(" ."), real))
X = np.array([r[0] for r in rows], dtype=object)
y = np.array([r[1] for r in rows])
groups = np.array([r[2] for r in rows])
is_real = np.array([r[3] for r in rows])

def make():
    return TfidfVectorizer(analyzer=tokens), LogisticRegression(max_iter=3000, C=8.0, class_weight="balanced")

pred = np.empty(len(y), dtype=object)
for tr, te in GroupKFold(5).split(X, y, groups):
    vec, clf = make()
    clf.fit(vec.fit_transform(X[tr]), y[tr])
    pred[te] = clf.predict(vec.transform(X[te]))
eval_mask = is_real if is_real.any() else np.ones(len(y), bool)
acc = accuracy_score(y[eval_mask], pred[eval_mask])
f1 = f1_score(y[eval_mask], pred[eval_mask], average="macro")
print(f"rows: {len(y)} (real {int(is_real.sum())})")
print(f"unseen-wording accuracy on real rows: {acc:.3f}   macro-F1: {f1:.3f}")
print(classification_report(y[eval_mask], pred[eval_mask], digits=3, zero_division=0))

vec, clf = make()
clf.fit(vec.fit_transform(X), y)
model = {
    "version": 2,
    "trainedRows": int(len(rows)),
    "heldOutAccuracy": round(float(acc), 4),
    "classes": [str(c) for c in clf.classes_],
    "idf": [round(float(v), 6) for v in vec.idf_],
    "vocab": {t: int(i) for t, i in vec.vocabulary_.items()},
    "coef": [[round(float(v), 5) for v in row] for row in clf.coef_],
    "intercept": [round(float(v), 5) for v in clf.intercept_],
}
json.dump(model, open("src/lib/ml/model.json", "w"), separators=(",", ":"))
print(f"exported -> src/lib/ml/model.json ({len(model['vocab'])} features)")
