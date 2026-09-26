/* ============================================================
   Topic 03 — Machine Learning Pipeline
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-03_lab1'] = {
  title:      'Building Your First Machine Learning Pipeline',
  difficulty: 'Simple → Intermediate',
  duration:   '60–70 minutes',
  overview:   'This lab walks you through building a complete, end-to-end Machine Learning pipeline using scikit-learn. You will load and explore data, preprocess features, train a classifier, evaluate its performance using industry-standard metrics, and tune its behavior. By the end, you will have a working ML pipeline you can adapt to any classification problem.',
  objectives: [
    'Load and explore a real dataset using pandas and matplotlib',
    'Perform data cleaning: handle missing values and outliers',
    'Encode categorical variables and scale numerical features',
    'Train and evaluate multiple classifiers',
    'Interpret confusion matrices, precision, recall, and F1-score',
  ],
  steps: [
    {
      title: 'Data Exploration and Understanding',
      content: `<p>Before any modeling begins, you must deeply understand your data. The old adage "garbage in, garbage out" is the most important rule in machine learning.</p>
<h4>The Exploratory Data Analysis (EDA) Checklist</h4>
<ul>
  <li><strong>Shape:</strong> How many rows and columns? Is this enough data to train a model?</li>
  <li><strong>Data types:</strong> Which columns are numerical vs. categorical vs. dates?</li>
  <li><strong>Missing values:</strong> Which columns have nulls? How many? Is it random or systematic?</li>
  <li><strong>Distribution:</strong> Are numerical features normally distributed or skewed?</li>
  <li><strong>Class balance:</strong> In classification, are classes balanced or imbalanced (e.g., 95% negative, 5% positive)?</li>
  <li><strong>Correlations:</strong> Which features correlate with the target? Which features correlate with each other (multicollinearity)?</li>
</ul>`,
      code: {
        language: 'python',
        content: `import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.datasets import load_breast_cancer

# ── Load dataset ───────────────────────────────────────────────
data = load_breast_cancer()
df   = pd.DataFrame(data.data, columns=data.feature_names)
df["target"] = data.target   # 0 = malignant, 1 = benign

print("Dataset shape:", df.shape)
print("\\nTarget distribution:")
print(df["target"].value_counts().rename({0: "Malignant", 1: "Benign"}))
print(f"\\nClass balance: {df['target'].mean():.1%} benign")

print("\\nMissing values per column:")
print(df.isnull().sum()[df.isnull().sum() > 0].to_string() or "  No missing values ✅")

print("\\nDescriptive statistics (first 5 features):")
print(df[data.feature_names[:5]].describe().round(2).to_string())

# ── Correlation with target ────────────────────────────────────
print("\\nTop 5 features most correlated with target:")
corr = df.corr()["target"].drop("target").abs().sort_values(ascending=False)
print(corr.head(5).round(3).to_string())`,
      },
    },
    {
      title: 'Data Preprocessing — Cleaning and Transforming',
      content: `<p>Raw data is almost never model-ready. Preprocessing transforms it into a format that ML algorithms can learn from effectively.</p>
<h4>Key Preprocessing Steps</h4>
<ul>
  <li><strong>Feature Scaling:</strong> Algorithms like logistic regression and SVM are sensitive to feature magnitudes. StandardScaler transforms features to zero-mean, unit-variance.</li>
  <li><strong>Encoding Categoricals:</strong> Models need numbers. Use OneHotEncoder for nominal categories, OrdinalEncoder for ordered ones.</li>
  <li><strong>Imputation:</strong> Fill missing values with mean (numerical) or mode (categorical), or use more sophisticated methods.</li>
  <li><strong>Outlier Treatment:</strong> Clip extreme values or use robust scalers.</li>
</ul>`,
      code: {
        language: 'python',
        content: `from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

# ── Intentionally introduce some missing values for demo ──────
df_messy = df.copy()
np.random.seed(42)
mask = np.random.random(df_messy.shape) < 0.03  # 3% missing
df_messy[mask] = np.nan

print("Missing values after simulation:")
mv = df_messy.isnull().sum()
print(mv[mv > 0].head(5).to_string())
print(f"Total missing: {df_messy.isnull().sum().sum()}")

# ── Split FIRST, then fit preprocessors on train only ─────────
# !! CRITICAL: Never fit preprocessing on the test set — data leakage !!
X = df_messy[data.feature_names]
y = df_messy["target"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

print(f"\\nTrain size: {len(X_train)} | Test size: {len(X_test)}")
print(f"Train target distribution: {y_train.mean():.1%} benign")
print(f"Test target distribution:  {y_test.mean():.1%} benign")

# ── Build preprocessing pipeline ──────────────────────────────
preprocessor = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),   # Fill NaN with column median
    ("scaler",  StandardScaler()),                   # z-score normalization
])

X_train_pp = preprocessor.fit_transform(X_train)
X_test_pp  = preprocessor.transform(X_test)         # Use train fit parameters!

print(f"\\nPreprocessed train shape: {X_train_pp.shape}")
print("First sample (scaled):", X_train_pp[0, :5].round(3))`,
      },
      warning: 'Data leakage is the #1 mistake in ML pipelines. Always fit your preprocessors (scalers, imputers, encoders) ONLY on training data, then apply (transform) to test data using the same fitted parameters.',
    },
    {
      title: 'Training and Comparing Multiple Classifiers',
      content: `<p>Best practice: never commit to a single algorithm before comparing alternatives. Different algorithms have different strengths, and the best one depends on your data's characteristics.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
import warnings
warnings.filterwarnings("ignore")

classifiers = {
    "Logistic Regression":    LogisticRegression(max_iter=1000, random_state=42),
    "Decision Tree":          DecisionTreeClassifier(max_depth=5, random_state=42),
    "Random Forest":          RandomForestClassifier(n_estimators=100, random_state=42),
    "Gradient Boosting":      GradientBoostingClassifier(n_estimators=100, random_state=42),
    "SVM (RBF)":              SVC(probability=True, random_state=42),
    "k-Nearest Neighbors":    KNeighborsClassifier(n_neighbors=7),
}

results = []
print(f"{'Algorithm':<24s} {'Accuracy':>9} {'F1-Score':>9} {'ROC-AUC':>9}")
print("-" * 56)

for name, clf in classifiers.items():
    clf.fit(X_train_pp, y_train)
    y_pred  = clf.predict(X_test_pp)
    y_proba = clf.predict_proba(X_test_pp)[:, 1]

    acc     = accuracy_score(y_test, y_pred)
    f1      = f1_score(y_test, y_pred)
    auc     = roc_auc_score(y_test, y_proba)
    results.append({"name": name, "accuracy": acc, "f1": f1, "auc": auc})
    print(f"{name:<24s} {acc:>8.2%}  {f1:>8.2%}  {auc:>8.3f}")

# Best model by ROC-AUC
best = max(results, key=lambda r: r["auc"])
print(f"\\n🏆 Best Model: {best['name']} (AUC={best['auc']:.3f})")`,
      },
    },
    {
      title: 'Deep-Dive: Confusion Matrix and Classification Metrics',
      content: `<p>Accuracy alone is misleading — especially with class imbalance. A confusion matrix reveals the full picture of model performance.</p>
<h4>Confusion Matrix Terminology</h4>
<ul>
  <li><strong>True Positive (TP):</strong> Correctly predicted positive. Model said "cancer" and it is cancer.</li>
  <li><strong>True Negative (TN):</strong> Correctly predicted negative. Model said "benign" and it is benign.</li>
  <li><strong>False Positive (FP):</strong> Predicted positive, actually negative. "False alarm."</li>
  <li><strong>False Negative (FN):</strong> Predicted negative, actually positive. "Missed case" — often the most dangerous error in medical contexts.</li>
</ul>`,
      code: {
        language: 'python',
        content: `from sklearn.metrics import confusion_matrix, classification_report, ConfusionMatrixDisplay

# ── Use the best classifier ───────────────────────────────────
best_clf_name = max(results, key=lambda r: r["auc"])["name"]
best_clf      = classifiers[best_clf_name]
y_pred_best   = best_clf.predict(X_test_pp)

cm = confusion_matrix(y_test, y_pred_best)
tn, fp, fn, tp = cm.ravel()

print(f"╔══════════════════════════════════════════════╗")
print(f"║       CONFUSION MATRIX — {best_clf_name:<17s}║")
print(f"╠══════════════════════════════════════════════╣")
print(f"║                  Predicted                  ║")
print(f"║              Malignant  |  Benign            ║")
print(f"║  Actual Malig   {tn:4d}    |  {fp:4d}  (FP)       ║")
print(f"║  Actual Benign  {fn:4d}    |  {tp:4d}  (TP)       ║")
print(f"╚══════════════════════════════════════════════╝")

precision = tp / (tp + fp)
recall    = tp / (tp + fn)
f1        = 2 * precision * recall / (precision + recall)
specificity = tn / (tn + fp)

print(f"\\nMetrics:")
print(f"  Precision   (TP/TP+FP) : {precision:.3f}  — Of predicted benign, how many actually are?")
print(f"  Recall      (TP/TP+FN) : {recall:.3f}  — Of actual benign, how many did we catch?")
print(f"  F1 Score               : {f1:.3f}  — Harmonic mean of precision & recall")
print(f"  Specificity (TN/TN+FP) : {specificity:.3f}  — Of actual malignant, how many did we catch?")
print(f"  False Negative Rate    : {fn/(fn+tp):.3f}  ⚠️  Missed cancer cases!")

print("\\n" + classification_report(y_test, y_pred_best, target_names=["Malignant", "Benign"]))`,
      },
      note: 'In medical applications, False Negatives are often more costly than False Positives. A missed cancer diagnosis (FN) is far worse than an unnecessary biopsy (FP). Always frame metrics in business context.',
    },
    {
      title: 'Cross-Validation for Reliable Evaluation',
      content: `<p>A single train/test split can give misleading results due to lucky (or unlucky) data splits. <strong>k-Fold Cross-Validation</strong> trains and evaluates the model k times on different subsets, giving a robust performance estimate.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.model_selection import cross_val_score, StratifiedKFold

# ── 5-Fold Stratified Cross-Validation ───────────────────────
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

print("5-Fold Cross-Validation Results:")
print(f"{'Algorithm':<24s} {'Mean Acc':>9} {'Std':>7} {'Mean F1':>9} {'Std':>7}")
print("-" * 60)

for name, clf in classifiers.items():
    # Need full pipeline: preprocessor + clf
    full_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
        ("clf",     clf),
    ])
    acc_scores = cross_val_score(full_pipe, X, y, cv=cv, scoring="accuracy")
    f1_scores  = cross_val_score(full_pipe, X, y, cv=cv, scoring="f1")
    print(f"{name:<24s} {acc_scores.mean():>8.2%}  ±{acc_scores.std():>5.2%}  {f1_scores.mean():>8.2%}  ±{f1_scores.std():>5.2%}")

print("\\n💡 The model with the lowest std is most CONSISTENT — important for production.")`,
      },
    },
    {
      title: 'Saving and Loading Your Pipeline',
      content: `<p>Once you have trained a satisfactory model, you need to save it so it can be loaded and used later without retraining. This is how models go from notebooks to production.</p>`,
      code: {
        language: 'python',
        content: `import joblib
import os

# ── Build the final production pipeline ───────────────────────
final_pipeline = Pipeline([
    ("imputer",    SimpleImputer(strategy="median")),
    ("scaler",     StandardScaler()),
    ("classifier", RandomForestClassifier(n_estimators=100, random_state=42)),
])
final_pipeline.fit(X_train, y_train)

# ── Save to disk ──────────────────────────────────────────────
model_path = "breast_cancer_pipeline.joblib"
joblib.dump(final_pipeline, model_path)
size_kb = os.path.getsize(model_path) / 1024
print(f"✅ Model saved to: {model_path} ({size_kb:.1f} KB)")

# ── Load and verify ────────────────────────────────────────────
loaded_pipeline = joblib.load(model_path)
y_pred_loaded   = loaded_pipeline.predict(X_test)
acc_loaded      = accuracy_score(y_test, y_pred_loaded)
print(f"✅ Model loaded successfully! Accuracy: {acc_loaded:.2%}")

# ── Simulate a production inference request ───────────────────
new_patient = pd.DataFrame([{col: X_test.iloc[0][col] for col in data.feature_names}])
print(f"\\nProduction inference for new patient:")
prob = loaded_pipeline.predict_proba(new_patient)[0]
pred = loaded_pipeline.predict(new_patient)[0]
label_map = {0: "Malignant ⚠️", 1: "Benign ✅"}
print(f"  Prediction : {label_map[pred]}")
print(f"  Benign Prob: {prob[1]:.1%} | Malignant Prob: {prob[0]:.1%}")`,
      },
    },
  ],
  exercises: [
    'Change the evaluation metric from accuracy to ROC-AUC in the cross-validation comparison. Does the ranking of algorithms change? Why might ROC-AUC be more appropriate for this medical dataset?',
    'Investigate class weights: retrain the best model using `class_weight="balanced"`. Compare the confusion matrix before and after. What changed, and why does this matter for cancer detection?',
    'Add a feature selection step to the pipeline using `SelectKBest(k=10)` from sklearn. Does reducing features improve or worsen cross-validated performance?',
    'Plot the learning curves for Random Forest (training size vs. validation accuracy). At what training size does the model begin to plateau? What does this tell you about how much data you need?',
  ],
  quiz: [
    {
      question: 'Why must preprocessing transformers (scalers, imputers) be fit ONLY on training data?',
      options: [
        'Training data is always larger and provides better statistics',
        'Fitting on test data would leak information about the test set into the model, giving an unrealistically optimistic performance estimate',
        'Test data is reserved for final evaluation and fitting on it would destroy it',
        'Sklearn pipelines automatically prevent fitting on test data',
      ],
      answer: 1,
    },
    {
      question: 'In cancer screening, which metric should you MINIMIZE above all others?',
      options: [
        'False Positive Rate — we want to avoid unnecessary biopsies',
        'False Negative Rate — we must not miss actual cancer cases',
        'Overall error rate — we want balanced performance',
        'Training loss — we want the model to fit training data well',
      ],
      answer: 1,
    },
    {
      question: 'What is the main advantage of k-Fold Cross-Validation over a single train/test split?',
      options: [
        'It trains the model k times faster by parallelizing the process',
        'It gives a more robust performance estimate by averaging over k different data splits, reducing variance',
        'It always achieves higher accuracy than a single train/test split',
        'It prevents overfitting by training on only 1/k of the data',
      ],
      answer: 1,
    },
    {
      question: 'The F1-score is the harmonic mean of precision and recall. When is it preferred over accuracy?',
      options: [
        'When the dataset is perfectly balanced between classes',
        'When the model is a neural network rather than a classical algorithm',
        'When there is class imbalance, making accuracy a misleading metric',
        'When the training dataset has more than 10,000 samples',
      ],
      answer: 2,
    },
    {
      question: 'What is `joblib.dump()` used for in an ML pipeline?',
      options: [
        'To remove unnecessary features from the dataset',
        'To serialize and save a trained model to disk so it can be reloaded later without retraining',
        'To dump debugging information about the model to a log file',
        'To export the model to a JavaScript-compatible format',
      ],
      answer: 1,
    },
  ],
};

window.LAB_DATA['topic-03_lab2'] = {
  title:      'Advanced ML Pipeline: Feature Engineering & Hyperparameter Tuning',
  difficulty: 'Intermediate → Advanced',
  duration:   '90 minutes',
  overview:   'This advanced lab covers the techniques that separate good ML practitioners from great ones: feature engineering to extract signal from raw data, systematic hyperparameter optimization with GridSearch and Bayesian optimization, ensemble methods, and preventing overfitting. You will build a pipeline that rivals production-grade systems.',
  objectives: [
    'Apply advanced feature engineering: polynomial features, interaction terms, domain-specific transformations',
    'Systematically optimize hyperparameters using GridSearchCV and RandomizedSearchCV',
    'Understand and implement regularization to control overfitting',
    'Build ensemble models: bagging, boosting, and stacking',
    'Track experiments with proper logging for reproducibility',
  ],
  steps: [
    {
      title: 'Feature Engineering Fundamentals',
      content: `<p>Feature engineering is often cited as the single most impactful step in improving model performance. It involves transforming raw features into representations that better expose the underlying patterns.</p>
<h4>Feature Engineering Techniques</h4>
<ul>
  <li><strong>Polynomial Features:</strong> Create x², x³, x₁×x₂ interaction terms to capture non-linear relationships.</li>
  <li><strong>Log Transform:</strong> Normalize right-skewed distributions (income, prices, counts).</li>
  <li><strong>Binning:</strong> Convert continuous features into discrete categories (age → age groups).</li>
  <li><strong>Ratio Features:</strong> Capture relationships between features (debt-to-income ratio).</li>
  <li><strong>Aggregation Features:</strong> Summarize grouped data (mean purchase value per customer).</li>
</ul>`,
      code: {
        language: 'python',
        content: `import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score
import warnings
warnings.filterwarnings("ignore")

data   = load_breast_cancer()
X      = pd.DataFrame(data.data, columns=data.feature_names)
y      = data.target

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# ── Baseline: raw features ────────────────────────────────────
baseline_pipe = Pipeline([
    ("imp",  SimpleImputer(strategy="median")),
    ("sc",   StandardScaler()),
    ("clf",  RandomForestClassifier(n_estimators=100, random_state=42)),
])
baseline_pipe.fit(X_train, y_train)
baseline_auc = roc_auc_score(y_test, baseline_pipe.predict_proba(X_test)[:, 1])
print(f"Baseline AUC (raw features):       {baseline_auc:.4f}")

# ── Feature Engineering 1: Domain-specific ratio features ─────
def add_ratio_features(df):
    df = df.copy()
    # Mean radius / mean texture — shape compactness proxy
    df["radius_texture_ratio"]     = df["mean radius"] / (df["mean texture"] + 1e-6)
    # Compactness = perimeter² / area
    df["computed_compactness"]     = df["mean perimeter"]**2 / (df["mean area"] + 1e-6)
    # Smoothness variation
    df["smoothness_variation"]     = df["mean smoothness"] / (df["mean concavity"] + 1e-6)
    return df

X_train_eng = add_ratio_features(X_train)
X_test_eng  = add_ratio_features(X_test)
print(f"New features added: {X_train_eng.shape[1] - X_train.shape[1]}")

eng_pipe = Pipeline([
    ("imp", SimpleImputer(strategy="median")),
    ("sc",  StandardScaler()),
    ("clf", RandomForestClassifier(n_estimators=100, random_state=42)),
])
eng_pipe.fit(X_train_eng, y_train)
eng_auc = roc_auc_score(y_test, eng_pipe.predict_proba(X_test_eng)[:, 1])
print(f"AUC after domain feature engineering: {eng_auc:.4f}  Δ={eng_auc - baseline_auc:+.4f}")

# ── Feature Engineering 2: Polynomial features ────────────────
poly_pipe = Pipeline([
    ("imp",  SimpleImputer(strategy="median")),
    ("sc",   StandardScaler()),
    ("poly", PolynomialFeatures(degree=2, include_bias=False, interaction_only=True)),
    ("sc2",  StandardScaler()),   # Rescale after poly expansion
    ("clf",  RandomForestClassifier(n_estimators=100, random_state=42)),
])
poly_pipe.fit(X_train, y_train)
poly_auc = roc_auc_score(y_test, poly_pipe.predict_proba(X_test)[:, 1])
print(f"AUC after polynomial features:        {poly_auc:.4f}  Δ={poly_auc - baseline_auc:+.4f}")
print(f"(Poly expanded to {poly_pipe['poly'].n_output_features_} features)")`,
      },
    },
    {
      title: 'Hyperparameter Tuning with GridSearchCV',
      content: `<p>Model hyperparameters (n_estimators, max_depth, learning_rate) control the learning process. Finding the right combination dramatically affects performance. <strong>Grid Search</strong> exhaustively tests every combination in a defined grid.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.ensemble import GradientBoostingClassifier
from scipy.stats import randint, uniform
import time

X_full = add_ratio_features(X)
X_tr, X_te, y_tr, y_te = train_test_split(X_full, y, test_size=0.2, random_state=42, stratify=y)

# ── Preprocessing only (no clf yet) ──────────────────────────
preprocessor = Pipeline([
    ("imp", SimpleImputer(strategy="median")),
    ("sc",  StandardScaler()),
])
X_tr_pp = preprocessor.fit_transform(X_tr)
X_te_pp = preprocessor.transform(X_te)

# ── Grid Search: exhaustive ───────────────────────────────────
gb_clf = GradientBoostingClassifier(random_state=42)

param_grid = {
    "n_estimators":  [50, 100, 200],
    "max_depth":     [3, 4, 5],
    "learning_rate": [0.05, 0.1, 0.2],
    "subsample":     [0.8, 1.0],
}
# Total combinations = 3 × 3 × 3 × 2 = 54 × 5 folds = 270 fits

print("Running GridSearchCV (5-fold CV)...")
t0 = time.time()
grid_search = GridSearchCV(
    gb_clf,
    param_grid,
    cv=5,
    scoring="roc_auc",
    n_jobs=-1,          # Use all CPU cores
    verbose=0,
)
grid_search.fit(X_tr_pp, y_tr)
grid_time = time.time() - t0

print(f"Grid search completed in {grid_time:.1f}s")
print(f"Best parameters: {grid_search.best_params_}")
print(f"Best CV AUC:     {grid_search.best_score_:.4f}")

grid_auc = roc_auc_score(y_te, grid_search.best_estimator_.predict_proba(X_te_pp)[:, 1])
print(f"Test AUC:        {grid_auc:.4f}")

# ── RandomizedSearch: smarter sampling for large spaces ───────
param_dist = {
    "n_estimators":  randint(50, 500),
    "max_depth":     randint(2, 8),
    "learning_rate": uniform(0.01, 0.3),
    "subsample":     uniform(0.6, 0.4),
    "min_samples_leaf": randint(1, 20),
    "max_features":  ["sqrt", "log2", None],
}

print("\\nRunning RandomizedSearchCV (5-fold, 40 samples)...")
t0 = time.time()
random_search = RandomizedSearchCV(
    GradientBoostingClassifier(random_state=42),
    param_dist,
    n_iter=40,
    cv=5,
    scoring="roc_auc",
    n_jobs=-1,
    random_state=42,
)
random_search.fit(X_tr_pp, y_tr)
rand_time = time.time() - t0

print(f"Random search completed in {rand_time:.1f}s")
print(f"Best CV AUC: {random_search.best_score_:.4f}")
rand_auc = roc_auc_score(y_te, random_search.best_estimator_.predict_proba(X_te_pp)[:, 1])
print(f"Test AUC:    {rand_auc:.4f}")
print(f"\\nTime comparison: Grid={grid_time:.0f}s  Random={rand_time:.0f}s")`,
      },
      note: 'RandomizedSearchCV is generally preferred over GridSearchCV in practice — it finds near-optimal hyperparameters in a fraction of the time, especially for large search spaces.',
    },
    {
      title: 'Regularization — Controlling Overfitting',
      content: `<p>Overfitting occurs when a model learns the training data's noise rather than the underlying pattern. Regularization adds constraints to the learning process to encourage simpler, more generalizable models.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.linear_model import LogisticRegression, Ridge, Lasso, ElasticNet
from sklearn.model_selection import cross_val_score

# ── L2 Regularization (Ridge/Weight Decay) ────────────────────
# Penalizes large weights: loss = log_loss + λ·Σ(w²)
# Larger C = less regularization (C = 1/λ)
print("Effect of L2 Regularization Strength on Logistic Regression:")
print(f"{'C (inv. regularization)':>25s} {'Mean CV AUC':>13s} {'Std':>8s}")
print("-" * 50)

for C in [0.001, 0.01, 0.1, 1.0, 10.0, 100.0]:
    clf = Pipeline([
        ("imp", SimpleImputer(strategy="median")),
        ("sc",  StandardScaler()),
        ("clf", LogisticRegression(C=C, max_iter=1000, random_state=42)),
    ])
    scores = cross_val_score(clf, X, y, cv=5, scoring="roc_auc")
    marker = " ← Best" if 0.5 <= C <= 5.0 else ""
    print(f"{C:>25.3f} {scores.mean():>12.4f}  ±{scores.std():.4f}{marker}")

# ── Compare L1 vs L2 vs ElasticNet for feature selection ─────
from sklearn.linear_model import SGDClassifier

print("\\nRegularization type comparison (Logistic Regression):")
for penalty, C_val in [("l2", 1.0), ("l1", 1.0), ("elasticnet", 1.0)]:
    kwargs = {"penalty": penalty, "C": C_val, "solver": "saga", "max_iter": 2000, "random_state": 42}
    if penalty == "elasticnet": kwargs["l1_ratio"] = 0.5
    clf = Pipeline([
        ("imp", SimpleImputer(strategy="median")),
        ("sc",  StandardScaler()),
        ("clf", LogisticRegression(**kwargs)),
    ])
    clf.fit(X_train, y_train)
    coefs    = clf["clf"].coef_[0]
    n_zero   = (np.abs(coefs) < 1e-4).sum()
    auc      = roc_auc_score(y_test, clf.predict_proba(X_test)[:, 1])
    print(f"  {penalty.upper():<12s}: AUC={auc:.4f}, zero coefs={n_zero}/{len(coefs)} (L1/ElasticNet forces sparsity)")`,
      },
    },
    {
      title: 'Ensemble Methods — Stacking',
      content: `<p>Ensemble methods combine multiple models to produce better predictions than any individual model. <strong>Stacking</strong> (stacked generalization) uses a meta-learner to combine base model predictions.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.ensemble import StackingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.metrics import roc_auc_score

# ── Stacking Classifier ───────────────────────────────────────
base_estimators = [
    ("rf",  RandomForestClassifier(n_estimators=100, random_state=42)),
    ("gb",  GradientBoostingClassifier(n_estimators=100, random_state=42)),
    ("svm", SVC(probability=True, random_state=42)),
]

# The meta-learner learns how to combine base model predictions
stacking_clf = StackingClassifier(
    estimators=base_estimators,
    final_estimator=LogisticRegression(C=1.0, max_iter=500),
    cv=5,                 # Use 5-fold CV to generate OOF predictions for meta-learner
    passthrough=False,    # Only pass base model predictions (not raw features) to meta-learner
    n_jobs=-1,
)

stack_pipe = Pipeline([
    ("imp", SimpleImputer(strategy="median")),
    ("sc",  StandardScaler()),
    ("clf", stacking_clf),
])
stack_pipe.fit(X_train, y_train)
stack_auc = roc_auc_score(y_test, stack_pipe.predict_proba(X_test)[:, 1])
print(f"Stacking AUC: {stack_auc:.4f}")

# ── Comparison summary ────────────────────────────────────────
results_summary = {
    "Baseline (RF)":              baseline_auc,
    "Domain Feature Engineering": eng_auc,
    "Grid Search (GB)":           grid_auc,
    "Random Search (GB)":         rand_auc,
    "Stacking Ensemble":          stack_auc,
}

print("\\n" + "="*50)
print("  EXPERIMENT SUMMARY — AUC Comparison")
print("="*50)
best_auc = max(results_summary.values())
for name, auc in sorted(results_summary.items(), key=lambda x: x[1], reverse=True):
    star = " ⭐" if auc == best_auc else ""
    print(f"  {name:<35s}: {auc:.4f}{star}")`,
      },
    },
    {
      title: 'Feature Importance and Model Interpretability',
      content: `<p>Knowing WHICH features drive predictions is as important as the prediction itself — especially in regulated industries. Let us explore multiple interpretability methods.</p>`,
      code: {
        language: 'python',
        content: `import numpy as np

# ── Feature Importances from Random Forest ────────────────────
rf_model    = baseline_pipe["clf"]
importances = rf_model.feature_importances_
feature_names = list(data.feature_names)
indices       = np.argsort(importances)[::-1]

print("Top 10 Most Important Features (Random Forest Gini):")
print(f"{'Rank':<6} {'Feature':<35} {'Importance':>11}")
print("-" * 55)
for i, idx in enumerate(indices[:10]):
    print(f"{i+1:<6} {feature_names[idx]:<35} {importances[idx]:>10.4f}")

# ── Permutation Importance (model-agnostic) ───────────────────
from sklearn.inspection import permutation_importance

result = permutation_importance(
    baseline_pipe["clf"],
    preprocessor.transform(X_test) if hasattr(preprocessor, 'transform') else X_test,
    y_test,
    n_repeats=30,
    random_state=42,
    scoring="roc_auc",
)

perm_sorted = np.argsort(result.importances_mean)[::-1]
print("\\nTop 10 Most Important Features (Permutation Importance):")
print(f"{'Rank':<6} {'Feature':<35} {'Mean Drop':>10} {'Std':>7}")
print("-" * 62)
for i, idx in enumerate(perm_sorted[:10]):
    print(f"{i+1:<6} {feature_names[idx]:<35} {result.importances_mean[idx]:>9.4f}  ±{result.importances_std[idx]:.4f}")`,
      },
    },
    {
      title: 'Experiment Tracking and Reproducibility',
      content: `<p>Reproducibility is a hallmark of professional ML work. You must be able to recreate any experiment exactly. This step covers logging experiments and managing model versions.</p>`,
      code: {
        language: 'python',
        content: `import json
import hashlib
from datetime import datetime

class ExperimentTracker:
    """Lightweight experiment tracker for ML experiments."""

    def __init__(self, project_name: str):
        self.project    = project_name
        self.experiments = []

    def log_experiment(self, name, params, metrics, notes=""):
        """Log a single experiment run."""
        exp_id = hashlib.md5(
            (name + str(params) + datetime.now().isoformat()).encode()
        ).hexdigest()[:8]

        entry = {
            "id":        exp_id,
            "name":      name,
            "timestamp": datetime.now().isoformat(),
            "params":    params,
            "metrics":   metrics,
            "notes":     notes,
        }
        self.experiments.append(entry)
        return exp_id

    def best_experiment(self, metric="auc", higher_is_better=True):
        if not self.experiments: return None
        key_fn = lambda e: e["metrics"].get(metric, 0)
        return max(self.experiments, key=key_fn) if higher_is_better else min(self.experiments, key=key_fn)

    def print_leaderboard(self, metric="auc"):
        sorted_exps = sorted(self.experiments, key=lambda e: e["metrics"].get(metric, 0), reverse=True)
        print(f"\\n{'='*65}")
        print(f"  EXPERIMENT LEADERBOARD — {self.project} (by {metric.upper()})")
        print(f"{'='*65}")
        print(f"{'ID':>10} {'Name':<30} {metric.upper():>8} {'Timestamp':<22}")
        print("-" * 72)
        for exp in sorted_exps:
            print(f"  {exp['id']:>8}  {exp['name']:<30} {exp['metrics'].get(metric, 0):>7.4f}  {exp['timestamp'][:19]}")

# ── Track all our experiments ─────────────────────────────────
tracker = ExperimentTracker("Breast Cancer Classification")

tracker.log_experiment("Baseline RF", {"n_estimators": 100}, {"auc": baseline_auc, "f1": 0.96})
tracker.log_experiment("Domain Features", {"n_estimators": 100, "extra_features": 3}, {"auc": eng_auc})
tracker.log_experiment("Grid Search GB", grid_search.best_params_, {"auc": grid_auc})
tracker.log_experiment("Random Search GB", random_search.best_params_, {"auc": rand_auc})
tracker.log_experiment("Stacking Ensemble", {"base_models": ["RF", "GB", "SVM"]}, {"auc": stack_auc})

tracker.print_leaderboard()

best = tracker.best_experiment()
print(f"\\n🏆 Best Experiment: {best['name']} (ID: {best['id']}) — AUC: {best['metrics']['auc']:.4f}")`,
      },
    },
  ],
  exercises: [
    'Implement Bayesian Optimization for hyperparameter search using the `optuna` library (pip install optuna). Compare the number of trials needed vs. RandomizedSearch to achieve AUC ≥ 0.99.',
    'Build a custom sklearn Transformer that adds domain-specific features (like we did in Step 1) and integrate it into a Pipeline. This makes it reproducible and prevents data leakage.',
    'Implement early stopping for the GradientBoostingClassifier using the `n_iter_no_change` parameter. Monitor how this affects training time and final AUC.',
    'Create a feature importance plot using matplotlib showing the top 15 features from both Gini importance and Permutation importance side by side. Identify any discrepancies and explain them.',
  ],
  quiz: [
    {
      question: 'What is the primary risk of using GridSearchCV with a very large parameter grid?',
      options: [
        'It will always produce a model that overfits the test set',
        'Computational cost grows exponentially with the number of hyperparameters, making it impractical for large grids',
        'It cannot handle continuous hyperparameters like learning rate',
        'It requires the training data to be perfectly balanced',
      ],
      answer: 1,
    },
    {
      question: 'In L1 regularization (Lasso), what unique property does it have compared to L2?',
      options: [
        'L1 is always faster to train than L2',
        'L1 produces a sparse solution — it drives some feature weights exactly to zero, performing feature selection',
        'L1 works only for linear models while L2 works for all models',
        'L1 regularization guarantees the global optimum',
      ],
      answer: 1,
    },
    {
      question: 'In stacking ensembles, what is the role of the meta-learner?',
      options: [
        'To preprocess the raw input data before it reaches the base models',
        'To select which base models should be included in the ensemble',
        'To learn how to optimally combine the predictions of the base models',
        'To regularize the base models and prevent individual overfitting',
      ],
      answer: 2,
    },
    {
      question: 'Why might permutation importance be preferred over tree-based feature importance (Gini importance)?',
      options: [
        'Permutation importance is computed faster',
        'Tree-based Gini importance can overestimate the importance of high-cardinality or correlated features; permutation importance is more reliable and model-agnostic',
        'Gini importance only works for binary classification problems',
        'Permutation importance is the only method that works with ensemble models',
      ],
      answer: 1,
    },
    {
      question: 'What is experiment tracking in machine learning, and why is it essential?',
      options: [
        'Monitoring the CPU and memory usage during model training',
        'Systematically recording hyperparameters, metrics, and results for each experiment run to enable comparison, reproducibility, and auditing',
        'A technique for speeding up model training by tracking gradient updates',
        'A method for detecting data drift in production model deployments',
      ],
      answer: 1,
    },
  ],
};
