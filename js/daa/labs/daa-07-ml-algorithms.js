/* ============================================================
   DAA Topic 07 — Machine Learning Algorithms
   Lab 1: Linear & Logistic Regression, Decision Trees and Random Forests
   Source material: Generalised Linear Model (2) slides,
   Tree Based Model (3) slides, Intro_to_ML_Session_2_Student notebook
   ============================================================ */

window.DAA_LAB_DATA = window.DAA_LAB_DATA || {};

window.DAA_LAB_DATA['daa-07_lab1'] = {
  title:      'Linear & Logistic Regression, Decision Trees and Random Forests',
  difficulty: 'Beginner → Advanced',
  duration:   '2 hours',
  datasets:   ['titanic'],
  overview:   'Topic 6 built one model end to end. Here you meet the workhorse algorithms of applied machine learning and learn when to use each: generalised linear models (linear, polynomial, Ridge and Lasso regression, and logistic regression for classification) and tree-based models (CART decision trees and random forests). Using the Titanic passenger dataset you clean and encode features, scale them, train and compare four models, evaluate classification with the confusion matrix, precision, recall, F1 and ROC-AUC, prune trees, read feature importances, and understand bagging and out-of-bag scores. The main takeaway: there is no single best model; it depends on the data.',
  objectives: [
    'Explain linear regression (least squares), its assumptions, and polynomial regression',
    'Use Ridge (L2) and Lasso (L1) regularisation to fight overfitting',
    'Scale features with min-max normalisation and z-score standardisation',
    'Build a logistic regression classifier and evaluate it with a confusion matrix, precision, recall, F1 and ROC-AUC',
    'Encode categorical data with label encoding and one-hot encoding, and handle missing values',
    'Explain how CART chooses splits (Gini impurity, information gain) and control depth by pruning',
    'Build a random forest, explain bagging, feature subsampling and the OOB score, and compare models',
  ],
  steps: [
    {
      title: 'The Model Landscape',
      content: `<p>Two families of models cover most tabular (spreadsheet-like) problems:</p>
<table>
  <tr><th>Family</th><th>Models</th><th>Idea</th><th>Strengths</th></tr>
  <tr><td><strong>Generalised linear models</strong></td><td>Linear, polynomial, Ridge, Lasso, logistic regression</td><td>Output is a weighted sum of the features (passed through a function for classification)</td><td>Fast, interpretable, work well when relationships are roughly linear</td></tr>
  <tr><td><strong>Tree-based models</strong></td><td>Decision trees (CART), random forests, gradient boosting (XGBoost, LightGBM)</td><td>Learn a sequence of yes/no rules that split the data</td><td>Capture non-linear patterns and interactions, need little preprocessing</td></tr>
</table>
<p><strong>Regression</strong> predicts a number (fare, price); <strong>classification</strong> predicts a category (survived: yes/no). Today's main task, predicting Titanic survival, is <strong>binary classification</strong>. You will also use Fare to practise regression ideas.</p>`,
    },
    {
      title: 'Set Up Colab and Load Titanic',
      content: `<p>Create <code>DAA_Topic7_MLAlgorithms.ipynb</code> and upload <code>titanic.csv</code>:</p>
${window.DAA_COLAB_UPLOAD}
<p>Each row is a passenger: ticket class (<code>Pclass</code>), sex, age, number of siblings/spouses (<code>SibSp</code>) and parents/children (<code>Parch</code>) aboard, fare, cabin, port of embarkation (<code>Embarked</code>: C = Cherbourg, Q = Queenstown, S = Southampton), and the target <code>Survived</code> (1 = yes).</p>`,
      datasets: ['titanic'],
      code: [
        { language: 'python', run: true, content: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, MinMaxScaler, PolynomialFeatures
from sklearn.linear_model import LinearRegression, Ridge, Lasso, LogisticRegression
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (mean_absolute_error, mean_squared_error, r2_score, accuracy_score,
                             confusion_matrix, classification_report, roc_auc_score, RocCurveDisplay)

sns.set_theme(style="whitegrid")

df = pd.read_csv("titanic.csv")
print(df.shape)
df.head()` },
        { language: 'python', run: true, content: `print(df.isnull().sum())
print("\\nSurvival rate:", round(df["Survived"].mean(), 3))` },
      ],
    },
    {
      title: 'Handle Missing Data',
      content: `<p>Missing values can bias results and crash algorithms that can't handle NaN. Options: delete rows, or <strong>impute</strong> (fill) values. First consider <em>why</em> data is missing:</p>
<ul>
  <li><strong>MCAR</strong> (missing completely at random): unrelated to anything; safe to drop or impute.</li>
  <li><strong>MAR</strong> (missing at random): related to other observed columns (e.g. age missing more often for 3rd class).</li>
  <li><strong>MNAR</strong> (missing not at random): related to the missing value itself; hardest to fix.</li>
</ul>
<p>Balance preserving data against introducing bias. Beginner-friendly plan for Titanic:</p>
<ul>
  <li><code>Age</code> (177 missing): fill with the median.</li>
  <li><code>Embarked</code> (2 missing): fill with the mode (most common port).</li>
  <li><code>Cabin</code> (687 of 891 missing): too sparse, so drop it. <code>Name</code>, <code>Ticket</code>, <code>PassengerId</code> are identifiers, so drop them too.</li>
</ul>`,
      code: {
        language: 'python',
        run: true,
        content: `df["Age"] = df["Age"].fillna(df["Age"].median())
df["Embarked"] = df["Embarked"].fillna(df["Embarked"].mode()[0])
df = df.drop(columns=["Cabin", "Name", "Ticket", "PassengerId"])
print(df.isnull().sum().sum(), "missing values left")`,
      },
    },
    {
      title: 'Encode Categorical Features',
      content: `<p>Most models need numbers. Two encodings:</p>
<table>
  <tr><th>Encoding</th><th>How</th><th>Use when</th></tr>
  <tr><td><strong>Label encoding</strong></td><td>Each category → one integer (male = 0, female = 1)</td><td>Two categories, or categories with a natural order (small &lt; medium &lt; large)</td></tr>
  <tr><td><strong>One-hot encoding</strong></td><td>One 0/1 column per category (<code>Embarked_C</code>, <code>Embarked_Q</code>, <code>Embarked_S</code>)</td><td>Nominal categories with no order (red, blue, green); columns are independent and equidistant</td></tr>
</table>
<p>Label-encoding a nominal feature as 0, 1, 2 would wrongly tell the model that S &gt; Q &gt; C. But beware: one-hot encoding many categories creates many sparse (mostly-zero) columns, which can make trees deep and lopsided.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `df["Sex"] = df["Sex"].map({"male": 0, "female": 1})       # label encoding
df = pd.get_dummies(df, columns=["Embarked"], dtype=int)  # one-hot encoding

X = df.drop(columns=["Survived"])
y = df["Survived"]
X.head()`,
      },
    },
    {
      title: 'Feature Scaling: Normalisation vs Standardisation',
      content: `<p>Features on very different scales (Fare up to 512, Parch 0–6) let large-valued features dominate distance- and penalty-based models. <strong>Scaling</strong> puts them on a comparable footing without changing their meaning.</p>
<table>
  <tr><th>Method</th><th>Formula</th><th>Result</th></tr>
  <tr><td><strong>Normalisation (min-max)</strong></td><td>(x − min) ÷ (max − min)</td><td>Values between 0 and 1</td></tr>
  <tr><td><strong>Standardisation (z-score)</strong></td><td>(x − mean) ÷ standard deviation</td><td>Mean 0, standard deviation 1</td></tr>
</table>
<p><strong>Golden rule:</strong> split first, then <code>fit</code> the scaler on the <em>training</em> data only and <code>transform</code> both train and test. Fitting on all data leaks information from the test set.</p>`,
      code: [
        { language: 'python', run: true, content: `X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

minmax = MinMaxScaler().fit(X_train)
standard = StandardScaler().fit(X_train)

print("Min-max scaled Fare (first 5):     ", minmax.transform(X_train)[:5, list(X.columns).index("Fare")].round(3))
print("Standardised Fare (first 5):       ", standard.transform(X_train)[:5, list(X.columns).index("Fare")].round(3))` },
        { language: 'python', run: true, content: `X_train_s = pd.DataFrame(standard.transform(X_train), columns=X.columns, index=X_train.index)
X_test_s  = pd.DataFrame(standard.transform(X_test),  columns=X.columns, index=X_test.index)
X_train_s.describe().loc[["mean", "std"]].round(2)` },
      ],
      note: 'stratify=y keeps the same survival rate in train and test, which is important when classes are imbalanced (38% survived).',
    },
    {
      title: 'Linear Regression, Polynomial Regression and Regularisation',
      content: `<p><strong>Linear regression</strong> fits the line (or plane) that minimises the sum of squared <strong>residuals</strong> (vertical distances from points to the line): the <em>least squares</em> solution. Equivalently, it maximises the likelihood under normally distributed errors.</p>
<p><strong>Assumptions</strong> about the errors: zero mean (no systematic bias), constant variance, and independence (i.i.d.).</p>
<p><strong>Polynomial regression</strong> adds powers of features (x², x³) so a "linear" model can fit curves.</p>
<h4>Overfitting and regularisation</h4>
<p>A model that learns the training data <em>too</em> well performs poorly on new data. <strong>Regularisation</strong> adds a penalty on large coefficients, controlled by the hyperparameter λ (called <code>alpha</code> in scikit-learn):</p>
<ul>
  <li><strong>Ridge (L2):</strong> shrinks all coefficients but keeps them.</li>
  <li><strong>Lasso (L1):</strong> can push coefficients to exactly 0, performing <em>feature selection</em>.</li>
</ul>
<p>Demonstration: predict <code>Fare</code> from the other features (a regression task on the same data).</p>`,
      code: [
        { language: 'python', run: true, content: `Xr = df.drop(columns=["Fare", "Survived"])
yr = df["Fare"]
Xr_train, Xr_test, yr_train, yr_test = train_test_split(Xr, yr, test_size=0.2, random_state=42)
sc = StandardScaler().fit(Xr_train)
Xr_train_s, Xr_test_s = sc.transform(Xr_train), sc.transform(Xr_test)

models = {"Linear": LinearRegression(), "Ridge (alpha=10)": Ridge(alpha=10), "Lasso (alpha=1)": Lasso(alpha=1)}
for name, m in models.items():
    m.fit(Xr_train_s, yr_train)
    pred = m.predict(Xr_test_s)
    print(f"{name:<17} MAE {mean_absolute_error(yr_test, pred):6.2f} | "
          f"RMSE {mean_squared_error(yr_test, pred) ** 0.5:6.2f} | R² {r2_score(yr_test, pred):.3f}")

pd.DataFrame({n: m.coef_ for n, m in models.items()}, index=Xr.columns).round(2)` },
        { language: 'python', run: true, content: `# Polynomial features: degree 2 adds squares and pairwise products of every feature
poly = PolynomialFeatures(degree=2, include_bias=False)
Xp_train, Xp_test = poly.fit_transform(Xr_train_s), poly.transform(Xr_test_s)
print("Features before:", Xr_train_s.shape[1], "after:", Xp_train.shape[1])

for name, m in {"Poly + Linear": LinearRegression(), "Poly + Ridge": Ridge(alpha=10)}.items():
    m.fit(Xp_train, yr_train)
    print(f"{name:<14} train R² {m.score(Xp_train, yr_train):.3f} | test R² {m.score(Xp_test, yr_test):.3f}")` },
      ],
      after: `<p>Look at the Lasso column: some coefficients become exactly 0. Lasso decided those features weren't worth keeping. Also compare train vs test R² for the polynomial models: going from 8 to 44 features raised training R² but <em>lowered</em> test R² compared with the plain linear model, a sign of overfitting. Ridge (alpha=10) only narrows the gap slightly; try <code>alpha=100</code> or <code>1000</code> and watch the test score.</p>`,
    },
    {
      title: 'Logistic Regression for Classification',
      content: `<p>For a yes/no target we need predictions between 0 and 1. <strong>Logistic regression</strong> passes the linear combination of features through the <strong>sigmoid</strong> function, producing a probability. If the probability is above 0.5 we predict 1 (survived), otherwise 0.</p>
<p>It learns by minimising <strong>binary cross-entropy</strong>: it rewards confident correct predictions and heavily punishes confident wrong ones, and can add a regularisation penalty to stay simple (scikit-learn applies L2 by default).</p>`,
      code: {
        language: 'python',
        run: true,
        content: `log_model = LogisticRegression(max_iter=1000)
log_model.fit(X_train_s, y_train)

y_pred_log = log_model.predict(X_test_s)
y_prob_log = log_model.predict_proba(X_test_s)[:, 1]   # probability of survival

print("Accuracy:", round(accuracy_score(y_test, y_pred_log), 3))
print("First 5 survival probabilities:", y_prob_log[:5].round(2))
pd.Series(log_model.coef_[0], index=X.columns).round(2).sort_values()`,
      },
      after: `<p>Because the features are standardised, coefficient sizes are comparable: being female (<code>Sex</code>) strongly increases survival odds, while a higher <code>Pclass</code> number (3rd class) decreases them. "Women and children first", visible in the numbers.</p>`,
    },
    {
      title: 'Evaluating Classifiers: Beyond Accuracy',
      content: `<p><strong>Accuracy</strong> is how often the model is right overall. The <strong>confusion matrix</strong> breaks it down:</p>
<table>
  <tr><th></th><th>Predicted: died (0)</th><th>Predicted: survived (1)</th></tr>
  <tr><th>Actually died (0)</th><td>True Negative (TN)</td><td>False Positive (FP)</td></tr>
  <tr><th>Actually survived (1)</th><td>False Negative (FN)</td><td>True Positive (TP)</td></tr>
</table>
<ul>
  <li><strong>Precision</strong> = TP ÷ (TP + FP): of those predicted positive, how many really are? Matters when false positives are costly (<em>spam filters</em>: don't bin real email).</li>
  <li><strong>Recall</strong> = TP ÷ (TP + FN): of all actual positives, how many did we catch? Matters when false negatives are costly (<em>fraud or disease detection</em>).</li>
  <li><strong>F1</strong>: the balance of precision and recall; useful for imbalanced classes.</li>
  <li><strong>ROC curve / AUC</strong>: performance across <em>all</em> thresholds. AUC is the probability the model ranks a random positive above a random negative (0.5 = random guessing, 1 = perfect). For very imbalanced data, precision-recall curves are more informative.</li>
</ul>`,
      code: [
        { language: 'python', run: true, content: `print(confusion_matrix(y_test, y_pred_log))
print(classification_report(y_test, y_pred_log, target_names=["Died", "Survived"]))
print("ROC-AUC:", round(roc_auc_score(y_test, y_prob_log), 3))` },
        { language: 'python', run: true, content: `RocCurveDisplay.from_predictions(y_test, y_prob_log, name="Logistic regression")
plt.plot([0, 1], [0, 1], "k--", label="Random guess")
plt.title("ROC Curve")
plt.legend()
plt.show()` },
      ],
      note: 'Multi-class problems (3+ classes) use either One-vs-Rest (one binary model per class) or softmax (probabilities that sum to 1). Precision/recall/F1 are then averaged: macro (all classes equal), micro (weights by size) or weighted.',
    },
    {
      title: 'Decision Trees (CART)',
      content: `<p>A <strong>decision tree</strong> learns simple if/else rules from the data. <strong>CART</strong> (Classification And Regression Trees) is a non-parametric supervised algorithm and the base learner for random forests and boosting.</p>
<h4>How CART chooses a split</h4>
<ol>
  <li>Calculate the <strong>impurity</strong> of the node: how mixed its classes are. CART uses the <strong>Gini index</strong>: 0 = pure (all one class), 0.5 = a 50/50 mix for two classes.</li>
  <li>For every feature, try candidate split points. For numbers: sort unique values and try the midpoints between neighbours.</li>
  <li>Pick the split with the largest <strong>information gain</strong>: impurity before minus the weighted impurity of the two children.</li>
  <li>Repeat inside each child until a stopping rule is met.</li>
</ol>
<p>For regression trees, the same process minimises <strong>mean squared error</strong> instead of Gini.</p>`,
      code: [
        { language: 'python', run: true, content: `def gini(labels):
    p = np.bincount(labels) / len(labels)
    return 1 - np.sum(p ** 2)

root = gini(y_train.values)
left, right = y_train[X_train["Sex"] == 0].values, y_train[X_train["Sex"] == 1].values
weighted = (len(left) * gini(left) + len(right) * gini(right)) / len(y_train)
print(f"Gini at root:              {root:.3f}")
print(f"Gini after splitting on Sex: {weighted:.3f}  →  information gain {root - weighted:.3f}")` },
        { language: 'python', run: true, content: `tree = DecisionTreeClassifier(max_depth=3, random_state=42)   # trees don't need scaling
tree.fit(X_train, y_train)
print("Decision tree accuracy:", round(accuracy_score(y_test, tree.predict(X_test)), 3))

plt.figure(figsize=(18, 7))
plot_tree(tree, feature_names=X.columns, class_names=["Died", "Survived"], filled=True, fontsize=9)
plt.show()` },
      ],
      after: `<p>Read the tree from the top: the first question is about <code>Sex</code>, the split with the biggest information gain, exactly what you calculated by hand.</p>`,
    },
    {
      title: 'Overfitting, Pruning and Feature Importance',
      content: `<p>An unrestricted tree keeps splitting until every leaf is pure, memorising the training data. <strong>Pruning</strong> fights this:</p>
<ul>
  <li><strong>Pre-pruning</strong> (early stopping): limit <code>max_depth</code>, <code>min_samples_leaf</code>, or minimum information gain.</li>
  <li><strong>Post-pruning</strong>: grow the full tree, then cut branches that don't improve accuracy on unseen data. <strong>Cost-complexity pruning</strong> (<code>ccp_alpha</code>) scores each subtree by error plus a penalty for size, and cross-validation picks the best penalty.</li>
</ul>
<p><strong>Feature importance</strong> measures how much each feature reduced impurity across the tree, useful for insight and feature selection.</p>`,
      code: [
        { language: 'python', run: true, content: `for depth in [1, 2, 3, 4, 5, 7, 10, None]:
    t = DecisionTreeClassifier(max_depth=depth, random_state=42)
    cv = cross_val_score(t, X_train, y_train, cv=5).mean()
    t.fit(X_train, y_train)
    print(f"max_depth={str(depth):<5} train acc {t.score(X_train, y_train):.3f} | 5-fold CV acc {cv:.3f}")` },
        { language: 'python', run: true, content: `importance = pd.Series(tree.feature_importances_, index=X.columns).sort_values(ascending=False)
print(importance.round(3))

importance.head(6).sort_values().plot(kind="barh", color="seagreen", figsize=(7, 3.5))
plt.title("Decision Tree Feature Importance (max_depth=3)")
plt.xlabel("Importance")
plt.show()` },
      ],
      after: `<p>Training accuracy keeps climbing with depth, but cross-validated accuracy peaks at a moderate depth and then falls: textbook overfitting. The optimal depth balances complexity and accuracy.</p>
<h4>Feature selection methods</h4>
<table>
  <tr><th>Method</th><th>How</th><th>Pros / cons</th></tr>
  <tr><td>Filter</td><td>Rank features by a statistic (correlation, chi-square) independent of any model</td><td>Fast; may miss interactions</td></tr>
  <tr><td>Wrapper</td><td>Search feature subsets with a model (forward selection, backward elimination, RFE)</td><td>Captures interactions; expensive, can overfit</td></tr>
  <tr><td>Embedded</td><td>Selection happens during training (Lasso, tree importances)</td><td>Efficient and accurate; model-dependent</td></tr>
</table>`,
    },
    {
      title: 'Random Forests: Bagging, Subsampling and OOB',
      content: `<p>A <strong>random forest</strong> is an <em>ensemble</em> of many decision trees whose votes are combined, which lowers overfitting and increases accuracy.</p>
<ul>
  <li><strong>Bootstrap aggregation (bagging):</strong> each tree trains on a bootstrap sample, a random sample of the training rows <em>with replacement</em>. Trees train independently (in parallel), and their errors average out, reducing variance.</li>
  <li><strong>Feature subsampling:</strong> at each split only a random subset of features is considered (typically √p of the p features). This de-correlates the trees.</li>
  <li><strong>No pruning:</strong> trees are grown deep; randomness plus averaging controls overfitting.</li>
  <li><strong>Prediction:</strong> majority vote for classification, average for regression.</li>
  <li><strong>Out-of-bag (OOB) score:</strong> about 36.8% of rows are left out of each bootstrap sample. Predicting each row using only the trees that didn't see it gives a free estimate of performance on unseen data.</li>
</ul>`,
      code: {
        language: 'python',
        run: true,
        content: `rf = RandomForestClassifier(n_estimators=300, max_features="sqrt", oob_score=True, random_state=42)
rf.fit(X_train, y_train)

print("OOB score (estimated accuracy on unseen data):", round(rf.oob_score_, 3))
print("Test accuracy:", round(accuracy_score(y_test, rf.predict(X_test)), 3))

pd.Series(rf.feature_importances_, index=X.columns).sort_values(ascending=False).round(3)`,
      },
    },
    {
      title: 'Compare the Models',
      content: `<p>Put every classifier side by side with the same metrics. Use cross-validation on the training set for a stable comparison, then report the test set.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `candidates = {
    "Logistic regression": (LogisticRegression(max_iter=1000), True),
    "Decision tree (depth 3)": (DecisionTreeClassifier(max_depth=3, random_state=42), False),
    "Decision tree (no limit)": (DecisionTreeClassifier(random_state=42), False),
    "Random forest": (RandomForestClassifier(n_estimators=300, random_state=42), False),
}

rows = []
for name, (model, needs_scaling) in candidates.items():
    Xtr, Xte = (X_train_s, X_test_s) if needs_scaling else (X_train, X_test)
    cv = cross_val_score(model, Xtr, y_train, cv=5).mean()
    model.fit(Xtr, y_train)
    pred = model.predict(Xte)
    prob = model.predict_proba(Xte)[:, 1]
    rows.append({"model": name, "cv_accuracy": cv, "test_accuracy": accuracy_score(y_test, pred),
                 "test_auc": roc_auc_score(y_test, prob)})

pd.DataFrame(rows).set_index("model").round(3).sort_values("cv_accuracy", ascending=False)`,
      },
      after: `<p><strong>Look closely at the unlimited tree.</strong> Cross-validation ranks it last, yet on the single test split it ties for the best accuracy. Which should you believe? The test set has only 179 passengers, so one lucky split can swing accuracy by several points; the 5-fold CV score averages over five different splits of 712 passengers and is far more reliable. The unlimited tree memorised its training data (98% training accuracy) and generalises worst on average.</p>
<p>Also notice how close the good models are (about 0.80–0.82). The best model is the one that generalises, the differences are often small, and interpretability or speed may decide. <strong>There is no one ideal model; it depends on the data.</strong></p>`,
    },
    {
      title: 'Reflection, Tutorial Task and Next Steps',
      content: `<p>Answer in Text cells:</p>
<ol>
  <li>Why do we encode categorical variables before modelling?</li>
  <li>What is the difference between label encoding and one-hot encoding?</li>
  <li>Why can decision trees overfit, and how does pruning help?</li>
  <li>Why does a random forest often beat a single tree?</li>
  <li>When would precision matter more than recall, and vice versa?</li>
</ol>
<h4>Group tutorial task</h4>
<p>Improve the Titanic pipeline and be ready to justify every choice in a 5–10 minute presentation: e.g. create a <code>FamilySize = SibSp + Parch + 1</code> feature, extract the passenger's title (Mr, Mrs, Miss) from <code>Name</code>, tune <code>max_depth</code> and <code>n_estimators</code>, and compare with cross-validation.</p>
<h4>Where to go next</h4>
<ul>
  <li>More models: XGBoost, LightGBM, SVM, k-nearest neighbours.</li>
  <li>More problem types: clustering and other unsupervised learning.</li>
  <li>Engineering: pipelines (<code>sklearn.pipeline.Pipeline</code>), deployment, clean production-quality code.</li>
</ul>
<p>Save your notebook to GitHub under <code>machine-learning/</code>.</p>`,
    },
  ],
  quiz: [
    {
      question: 'What does linear regression minimise to find the best-fit line?',
      options: ['The number of features', 'The sum of squared residuals (least squares)', 'The Gini index', 'The number of outliers'],
      answer: 1,
    },
    {
      question: 'What is the key difference between Lasso (L1) and Ridge (L2) regularisation?',
      options: [
        'Ridge can set coefficients exactly to zero; Lasso cannot',
        'Lasso can set coefficients exactly to zero (feature selection); Ridge only shrinks them',
        'They are identical',
        'Lasso is only for classification',
      ],
      answer: 1,
    },
    {
      question: 'Why should the scaler be fitted on the training set only?',
      options: [
        'It is faster',
        'Fitting on all data leaks information about the test set into training',
        'Scalers cannot handle test data',
        'The test set has no numeric columns',
      ],
      answer: 1,
    },
    {
      question: 'Which function does logistic regression use to turn a linear score into a probability?',
      options: ['Softmax only', 'Sigmoid', 'ReLU', 'Square root'],
      answer: 1,
    },
    {
      question: 'A fraud-detection model must catch as many fraud cases as possible. Which metric matters most?',
      options: ['Precision', 'Recall', 'R²', 'Mean absolute error'],
      answer: 1,
    },
    {
      question: 'Which encoding should you use for a nominal feature like Embarked (C, Q, S)?',
      options: ['Label encoding 0, 1, 2', 'One-hot encoding', 'Min-max scaling', 'No encoding needed for any model'],
      answer: 1,
    },
    {
      question: 'How does CART choose a split?',
      options: [
        'At random',
        'It picks the split with the largest information gain (biggest reduction in impurity such as Gini)',
        'It always splits on the first column',
        'It splits where the mean of the target is highest',
      ],
      answer: 1,
    },
    {
      question: 'Training accuracy rises with tree depth but cross-validated accuracy falls after depth 4. What is happening?',
      options: ['Underfitting', 'Overfitting', 'Data leakage', 'Class imbalance'],
      answer: 1,
    },
    {
      question: 'What is the out-of-bag (OOB) score in a random forest?',
      options: [
        'The accuracy on the training rows',
        'An estimate of accuracy using, for each row, only the trees that did not see that row in their bootstrap sample',
        'The number of trees that were pruned',
        'The score on the test set',
      ],
      answer: 1,
    },
    {
      question: 'Why does a random forest consider only a random subset of features at each split?',
      options: [
        'To save memory',
        'To de-correlate the trees so that averaging reduces variance more',
        'Because trees cannot use all features',
        'To perform scaling',
      ],
      answer: 1,
    },
  ],
};
