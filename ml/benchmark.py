"""Which model type generalises best to decline messages it has never seen?

Test = GroupKFold where every group is one distinct message (lower-cased), so the
same wording never appears in both train and test. We train on synthetic + real
rows and score ONLY on real rows, because real rows are what matters.

Run: python3 ml/benchmark.py
Needs: scikit-learn, numpy; optional lightgbm, xgboost.
"""
import csv, re, warnings
import numpy as np
from sklearn.base import clone
from sklearn.ensemble import ExtraTreesClassifier, VotingClassifier
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import GroupKFold
from sklearn.naive_bayes import ComplementNB
from sklearn.pipeline import make_pipeline
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
warnings.filterwarnings("ignore")

def tokens(text):  # must match train.py / ownClassifier.ts
    words = [w for w in re.sub(r"[^a-z0-9]+", " ", text.lower()).split() if len(w) >= 2]
    feats = words + [a + " " + b for a, b in zip(words, words[1:])]
    for w in words:
        p = " " + w + " "
        for n in (3, 4):
            feats += ["#" + p[i:i + n] for i in range(len(p) - n + 1)]
    return feats

def load(path, real):
    out = []
    for r in csv.DictReader(open(path)):
        out.append((f'{r["decline_code"]} {r["decline_message"]}', r["label"], r["decline_message"].lower().strip(" ."), real))
    return out

data = load("ml/data/bootstrap.csv", False) + load("ml/data/real/real_seed.csv", True)
X = np.array([d[0] for d in data], dtype=object)
y = np.array([d[1] for d in data])
groups = np.array([d[2] for d in data])
is_real = np.array([d[3] for d in data])

tfidf = lambda: TfidfVectorizer(analyzer=tokens)
models = {
 "LogisticRegression (current)": make_pipeline(tfidf(), LogisticRegression(max_iter=3000, C=8.0)),
 "LogisticRegression balanced": make_pipeline(tfidf(), LogisticRegression(max_iter=3000, C=8.0, class_weight="balanced")),
 "LinearSVC (calibrated)": make_pipeline(tfidf(), CalibratedClassifierCV(LinearSVC(C=1.0), cv=3)),
 "Complement Naive Bayes": make_pipeline(tfidf(), ComplementNB(alpha=0.1)),
 "SGD modified-huber": make_pipeline(tfidf(), SGDClassifier(loss="modified_huber", alpha=1e-4, random_state=0)),
 "ExtraTrees": make_pipeline(tfidf(), ExtraTreesClassifier(n_estimators=400, random_state=0, n_jobs=-1)),
 "HistGradientBoosting (SVD-100)": make_pipeline(tfidf(), TruncatedSVD(100, random_state=0), HistGradientBoostingClassifier(max_iter=200, learning_rate=0.08, random_state=0)),
}
try:
    from lightgbm import LGBMClassifier
    models["LightGBM (sparse TF-IDF)"] = make_pipeline(tfidf(), LGBMClassifier(n_estimators=300, learning_rate=0.05, num_leaves=15, min_child_samples=3, verbose=-1, random_state=0))
except Exception: pass
try:
    from xgboost import XGBClassifier
    from sklearn.preprocessing import LabelEncoder
    class XGB(XGBClassifier):
        def fit(self, X, y, **k):
            self.le_ = LabelEncoder().fit(y); return super().fit(X, self.le_.transform(y), **k)
        def predict(self, X): return self.le_.inverse_transform(super().predict(X))
    models["XGBoost (sparse TF-IDF)"] = make_pipeline(tfidf(), XGB(n_estimators=300, learning_rate=0.05, max_depth=4, random_state=0))
except Exception: pass
models["Ensemble: LR + SVC + NB (soft vote)"] = make_pipeline(tfidf(), VotingClassifier([
    ("lr", LogisticRegression(max_iter=3000, C=8.0)),
    ("svc", CalibratedClassifierCV(LinearSVC(C=1.0), cv=3)),
    ("nb", ComplementNB(alpha=0.1))], voting="soft"))

cv = GroupKFold(n_splits=5)
print(f"rows: {len(y)} (real {is_real.sum()}, synthetic {(~is_real).sum()}), classes: {sorted(set(y))}\n")
print(f"{'model':40s} {'acc(real)':>10s} {'macroF1(real)':>14s}")
res = []
for name, m in models.items():
    pred = np.empty(len(y), dtype=object)
    for tr, te in cv.split(X, y, groups):
        mm = clone(m); mm.fit(X[tr], y[tr]); pred[te] = mm.predict(X[te])
    acc = accuracy_score(y[is_real], pred[is_real]); f1 = f1_score(y[is_real], pred[is_real], average="macro")
    res.append((acc, f1, name)); print(f"{name:40s} {acc:10.3f} {f1:14.3f}")
best = max(res)
print("\nbest by accuracy:", best[2], f"({best[0]:.3f})")
