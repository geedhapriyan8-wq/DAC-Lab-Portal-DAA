/* ============================================================
   DAA Topic 06 — Intro to Machine Learning
   Lab 1: Your First Machine Learning Pipeline: Predicting House Prices
   Source material: Intro to Machine Learning (1) slides,
   Intro_to_ML_Session_1_Student notebook, Boston.csv
   ============================================================ */

window.DAA_LAB_DATA = window.DAA_LAB_DATA || {};

window.DAA_LAB_DATA['daa-06_lab1'] = {
  title:      'Your First Machine Learning Pipeline: Predicting House Prices',
  difficulty: 'Beginner → Advanced',
  duration:   '2 hours',
  datasets:   ['boston'],
  overview:   'Machine learning is "a set of methods that can automatically detect patterns in data to make predictions" (Murphy, 2013). In this lab you learn what that means in practice: the three types of learning, the end-to-end ML pipeline, and why we split data into training, validation and test sets. You then build a complete supervised-learning pipeline on the Boston housing dataset: explore the data, set a baseline, train a linear regression model, evaluate it with MAE, RMSE and R², check for overfitting with cross-validation, interpret the model, and finish with a first taste of unsupervised learning.',
  objectives: [
    'Define machine learning and contrast it with rule-based programming',
    'Distinguish supervised, unsupervised and reinforcement learning, and regression vs classification',
    'Describe each stage of a general ML pipeline',
    'Explain why data is split into training, validation and test sets',
    'Train and evaluate a linear regression model with scikit-learn',
    'Interpret MAE, MSE, RMSE and R², and compare against a baseline',
    'Use cross-validation to estimate performance on unseen data',
  ],
  steps: [
    {
      title: 'What Is Machine Learning?',
      content: `<blockquote>"Field of study that gives computers the ability to learn without being explicitly programmed." (Arthur Samuel, 1959)</blockquote>
<blockquote>"A set of methods that can automatically detect patterns in data to make predictions." (Kevin Murphy, 2013)</blockquote>
<p>At a technical level, machine learning means <strong>training a model on a dataset so it finds the underlying patterns</strong>, then using those patterns to make predictions or decisions on new data.</p>
<table>
  <tr><th>Traditional programming</th><th>Machine learning</th></tr>
  <tr><td>Human writes the rules → computer applies them to data → answers</td><td>Human provides data <em>and answers</em> → computer learns the rules → applies them to new data</td></tr>
  <tr><td>"If rooms &gt; 6 and crime &lt; 1, price is high"</td><td>Learns how rooms, crime and 11 other factors combine to set prices</td></tr>
</table>
<p><strong>End goal:</strong> enable computers to learn and make decisions from data without every rule being written by hand.</p>`,
    },
    {
      title: 'Three Types of Learning',
      content: `<table>
  <tr><th>Type</th><th>Data</th><th>How it learns</th><th>Typical tasks</th></tr>
  <tr><td><strong>Supervised</strong></td><td>Labelled: every example has the correct answer</td><td>The labels "supervise" the algorithm towards accurate predictions</td><td><strong>Regression</strong> (predict a number, e.g. house price) and <strong>classification</strong> (predict a category, e.g. spam / not spam)</td></tr>
  <tr><td><strong>Unsupervised</strong></td><td>Unlabelled</td><td>Finds structure and patterns by itself</td><td>Clustering (customer segments), association (products bought together), dimensionality reduction</td></tr>
  <tr><td><strong>Reinforcement</strong></td><td>No fixed dataset; an agent interacts with an environment</td><td>Rewarded for desirable states, punished for undesirable ones</td><td>Game playing, robotics; balancing <em>exploration</em> vs <em>exploitation</em></td></tr>
</table>
<p>Today's problem, predicting a house's value from its features when we know past prices, is <strong>supervised regression</strong>.</p>`,
    },
    {
      title: 'The General ML Pipeline',
      content: `<ol>
  <li><strong>Managing data</strong>: data collection (Topic 5!) and data processing (Topic 4's cleaning and EDA).</li>
  <li><strong>Model training</strong>: model design (which algorithm, which features) and training the model on data.</li>
  <li><strong>Model evaluation</strong>: testing on new observations and assessing performance with metrics.</li>
  <li><strong>Deployment</strong>: deploying the model to make real predictions, then monitoring and improving it.</li>
</ol>
<h4>How do we use the whole dataset?</h4>
<table>
  <tr><th>Subset</th><th>Purpose</th><th>Typical share</th></tr>
  <tr><td>Training set</td><td>The model learns patterns (fits its parameters) from it</td><td>60–80%</td></tr>
  <tr><td>Validation set</td><td>Used to tune choices and compare models; not used for fitting</td><td>10–20%</td></tr>
  <tr><td>Test set</td><td>Used <strong>once</strong>, at the end, to report final performance on unseen data</td><td>10–20%</td></tr>
</table>
<p><strong>Why?</strong> To make sure the model is actually <em>learning</em> instead of <em>memorising</em>. A student who memorised last year's exam answers will fail a new exam; a model evaluated on its own training data looks deceptively good.</p>`,
    },
    {
      title: 'Set Up Colab and Load the Data',
      content: `<p>Create <code>DAA_Topic6_IntroML.ipynb</code> and upload <code>Boston.csv</code>:</p>
${window.DAA_COLAB_UPLOAD}
<p><strong>scikit-learn</strong> (<code>sklearn</code>) is Python's standard machine-learning library, pre-installed in Colab. Every model follows the same pattern: <code>model.fit(X, y)</code> to learn and <code>model.predict(X)</code> to predict.</p>`,
      datasets: ['boston'],
      code: {
        language: 'python',
        run: true,
        content: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

sns.set_theme(style="whitegrid")

df = pd.read_csv("Boston.csv")
df = df.drop(columns=["Unnamed: 0"])      # the first column is just a row number
print(df.shape)
df.head()`,
      },
    },
    {
      title: 'Understand the Data',
      content: `<p>Each row is a neighbourhood (census tract) around Boston. The target, <code>medv</code>, is the <strong>median home value in $1000s</strong>.</p>
<table>
  <tr><th>Column</th><th>Meaning</th><th>Column</th><th>Meaning</th></tr>
  <tr><td><code>crim</code></td><td>Crime rate per person</td><td><code>dis</code></td><td>Distance to employment centres</td></tr>
  <tr><td><code>zn</code></td><td>% residential land in large lots</td><td><code>rad</code></td><td>Access to radial highways (index)</td></tr>
  <tr><td><code>indus</code></td><td>% non-retail business land</td><td><code>tax</code></td><td>Property tax rate per $10,000</td></tr>
  <tr><td><code>chas</code></td><td>1 if next to the Charles River, else 0</td><td><code>ptratio</code></td><td>Pupil–teacher ratio</td></tr>
  <tr><td><code>nox</code></td><td>Air pollution (nitric oxides)</td><td><code>lstat</code></td><td>% lower-status population</td></tr>
  <tr><td><code>rm</code></td><td>Average rooms per home</td><td><code>medv</code></td><td><strong>Target:</strong> median home value ($1000s)</td></tr>
  <tr><td><code>age</code></td><td>% homes built before 1940</td><td></td><td></td></tr>
</table>`,
      code: [
        { language: 'python', run: true, content: `df.info()` },
        { language: 'python', run: true, content: `df.describe().round(2)` },
      ],
    },
    {
      title: 'Quick EDA Before Modelling',
      content: `<p>Topic 4's habit applies here: look before you model. Two questions:</p>
<ol>
  <li>What does the target look like?</li>
  <li>Which features move with the target?</li>
</ol>`,
      code: [
        { language: 'python', run: true, content: `plt.figure(figsize=(8, 4))
sns.histplot(df["medv"], bins=30, kde=True, color="seagreen")
plt.title("Distribution of Median Home Values")
plt.xlabel("medv ($1000s)")
plt.ylabel("Neighbourhoods")
plt.show()

print("Neighbourhoods at exactly 50:", (df["medv"] == 50).sum())` },
        { language: 'python', run: true, content: `corr_with_target = df.corr()["medv"].drop("medv").sort_values()
print(corr_with_target.round(2))

plt.figure(figsize=(10, 8))
sns.heatmap(df.corr(), cmap="RdYlGn", center=0, annot=True, fmt=".1f", annot_kws={"size": 7})
plt.title("Feature Correlation Heatmap")
plt.show()` },
      ],
      after: `<p><strong>Findings:</strong> the spike at exactly 50 suggests values were <em>capped</em> at $50,000 when the data was collected, which is a data-quality caveat worth noting. <code>rm</code> (rooms) has the strongest positive relationship with value and <code>lstat</code> the strongest negative one.</p>`,
    },
    {
      title: 'Features, Target and the Train / Validation / Test Split',
      content: `<p>Split the columns into <strong>X</strong> (the input features) and <strong>y</strong> (the target to predict). Then split the rows three ways, 60% / 20% / 20%, by calling <code>train_test_split</code> twice.</p>
<p><code>random_state=42</code> fixes the random shuffle so you (and your classmates) get identical splits every run: <strong>reproducibility</strong>.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `X = df.drop(columns=["medv"])
y = df["medv"]

# First split off 20% as the final test set, then split the rest 75/25 into train/validation
X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42)

print("Train:     ", X_train.shape)
print("Validation:", X_val.shape)
print("Test:      ", X_test.shape)`,
      },
      warning: 'Lock the test set away. If you look at test results while choosing your model, the test set stops being "unseen" and your final score becomes over-optimistic.',
    },
    {
      title: 'Start with a Baseline',
      content: `<p>A model is only useful if it beats a simple guess. The simplest regression baseline: <strong>always predict the average price from the training set</strong>. Any real model must do better than this.</p>
<p><strong>MAE</strong> (Mean Absolute Error) is the average size of the errors, in the same units as the target ($1000s here).</p>`,
      code: {
        language: 'python',
        run: true,
        content: `baseline_prediction = np.full(len(y_val), y_train.mean())
baseline_mae = mean_absolute_error(y_val, baseline_prediction)
print(f"Baseline: always predict {y_train.mean():.2f}")
print(f"Baseline MAE on validation: {baseline_mae:.2f}  (about \${baseline_mae * 1000:,.0f})")`,
      },
    },
    {
      title: 'Train a Linear Regression Model',
      content: `<p><strong>Linear regression</strong> finds the straight line (or, with many features, the flat plane) that best fits the training data: it learns one <em>coefficient</em> (slope) per feature plus an <em>intercept</em>, choosing them to minimise the squared errors.</p>
<p>Start with <strong>one feature</strong> (<code>rm</code>) so you can see the line, then use all 12 features.</p>`,
      code: [
        { language: 'python', run: true, content: `simple = LinearRegression()
simple.fit(X_train[["rm"]], y_train)
print(f"medv ≈ {simple.coef_[0]:.2f} × rm + ({simple.intercept_:.2f})")

plt.figure(figsize=(8, 4.5))
plt.scatter(X_train["rm"], y_train, alpha=0.4, color="seagreen", label="Training data")
xs = np.linspace(X_train["rm"].min(), X_train["rm"].max(), 100).reshape(-1, 1)
plt.plot(xs, simple.predict(pd.DataFrame(xs, columns=["rm"])), color="black", linewidth=2, label="Fitted line")
plt.title("Rooms vs Home Value: Simple Linear Regression")
plt.xlabel("Average rooms per home (rm)")
plt.ylabel("medv ($1000s)")
plt.legend()
plt.show()` },
        { language: 'python', run: true, content: `model = LinearRegression()
model.fit(X_train, y_train)          # learn the patterns

y_val_pred = model.predict(X_val)    # predict on data the model has never seen
print("First 5 predictions:", y_val_pred[:5].round(1))
print("First 5 actual:     ", y_val.values[:5])` },
      ],
      after: `<p>Read the equation: each extra room adds roughly the coefficient × $1000 to the predicted value. A negative intercept is common; it's simply where the line would cross zero rooms, which never happens in real data.</p>`,
    },
    {
      title: 'Evaluate the Model',
      content: `<table>
  <tr><th>Metric</th><th>Meaning</th><th>Better when</th></tr>
  <tr><td><strong>MAE</strong></td><td>Average absolute error, in target units</td><td>Lower</td></tr>
  <tr><td><strong>MSE</strong></td><td>Average <em>squared</em> error; punishes big mistakes heavily</td><td>Lower</td></tr>
  <tr><td><strong>RMSE</strong></td><td>√MSE, back in target units</td><td>Lower</td></tr>
  <tr><td><strong>R²</strong></td><td>Share of the target's variation the model explains (1 = perfect, 0 = no better than the mean)</td><td>Closer to 1</td></tr>
</table>`,
      code: [
        { language: 'python', run: true, content: `def evaluate(name, actual, predicted):
    mae = mean_absolute_error(actual, predicted)
    mse = mean_squared_error(actual, predicted)
    print(f"{name:<22} MAE {mae:5.2f} | MSE {mse:6.2f} | RMSE {np.sqrt(mse):5.2f} | R² {r2_score(actual, predicted):5.2f}")

evaluate("Baseline (mean)", y_val, baseline_prediction)
evaluate("Linear (rm only)", y_val, simple.predict(X_val[["rm"]]))
evaluate("Linear (all features)", y_val, y_val_pred)` },
        { language: 'python', run: true, content: `plt.figure(figsize=(6, 6))
plt.scatter(y_val, y_val_pred, alpha=0.6, color="seagreen")
plt.plot([0, 50], [0, 50], "k--", label="Perfect prediction")
plt.title("Actual vs Predicted (validation set)")
plt.xlabel("Actual medv")
plt.ylabel("Predicted medv")
plt.legend()
plt.show()` },
      ],
      after: `<p>Points close to the dashed diagonal are good predictions. Notice the model struggles most with the most expensive neighbourhoods, including the capped values at 50.</p>`,
    },
    {
      title: 'Overfitting Check, Cross-Validation and the Final Test',
      content: `<p><strong>Overfitting</strong> means a model learned the training data too well, including its noise, so it performs much worse on new data. Compare training and validation error: a big gap is a warning sign.</p>
<p><strong>Cross-validation</strong> gives a more reliable estimate than one validation split: split the training data into <em>k</em> folds, train on k−1 and validate on the remaining one, repeat k times, and average the scores.</p>
<p>Only after you are happy with the model do you evaluate on the <strong>test set, once</strong>.</p>`,
      code: [
        { language: 'python', run: true, content: `evaluate("Training set", y_train, model.predict(X_train))
evaluate("Validation set", y_val, y_val_pred)

scores = cross_val_score(LinearRegression(), X_temp, y_temp, cv=5, scoring="neg_mean_absolute_error")
print("\\n5-fold CV MAE per fold:", (-scores).round(2))
print(f"Mean CV MAE: {-scores.mean():.2f} ± {scores.std():.2f}")` },
        { language: 'python', run: true, content: `final_model = LinearRegression().fit(X_temp, y_temp)   # retrain on train + validation
evaluate("FINAL test set", y_test, final_model.predict(X_test))` },
      ],
      after: `<p><strong>Reading the results:</strong> training MAE (about 3.5) and validation MAE (about 3.3) are almost the same, so the model is <em>not</em> overfitting. A simple linear model rarely does. The five CV folds agree closely (mean about 3.5), so that estimate is reliable. The final test MAE of about 3.1 means predictions are off by roughly $3,100 on average, about half the baseline's error.</p>`,
    },
    {
      title: 'Interpret the Model',
      content: `<p>Linear regression is <strong>interpretable</strong>: each coefficient says how much the prediction changes when that feature rises by one unit, holding the others fixed.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `coefficients = pd.Series(final_model.coef_, index=X.columns).sort_values()
print(coefficients.round(3))`,
      },
      after: `<ul>
  <li>Positive coefficients (e.g. <code>rm</code>, <code>chas</code>) raise the predicted value; negative ones (e.g. <code>nox</code>, <code>lstat</code>, <code>ptratio</code>) lower it.</li>
  <li><strong>Careful:</strong> features are on different scales (<code>nox</code> is 0.4–0.9, <code>tax</code> is in the hundreds), so raw coefficient sizes are not directly comparable. Topic 7 introduces feature scaling to fix this.</li>
  <li>Coefficients describe associations in this data, not causes, so the Topic 4 caution applies.</li>
</ul>`,
    },
    {
      title: 'A Taste of Unsupervised Learning',
      content: `<p>Supervised learning needed the answers (<code>medv</code>). <strong>Unsupervised learning</strong> finds structure without labels. <strong>K-Means clustering</strong> groups neighbourhoods that are similar in rooms and <code>lstat</code>. We never tell it the prices, yet the clusters turn out to differ in value.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

features = StandardScaler().fit_transform(df[["rm", "lstat"]])
df["cluster"] = KMeans(n_clusters=3, n_init=10, random_state=42).fit_predict(features)

print(df.groupby("cluster")[["rm", "lstat", "medv"]].mean().round(1))

plt.figure(figsize=(8, 4.5))
sns.scatterplot(data=df, x="rm", y="lstat", hue="cluster", palette="Set2")
plt.title("K-Means Clusters of Neighbourhoods (no prices used)")
plt.show()`,
      },
    },
    {
      title: 'Reflection and Wrap-Up',
      content: `<p>Answer these in a Text cell in your notebook:</p>
<ol>
  <li>Why do we split data into training and test sets?</li>
  <li>Why is house-price prediction a supervised learning task?</li>
  <li>What does an MAE of 3.5 mean in dollars for this dataset?</li>
  <li>Why should we evaluate on test data instead of training data?</li>
  <li>How did the linear model compare with the baseline?</li>
</ol>
<h4>What you did</h4>
<p>You followed the full pipeline: defined the problem, explored and prepared the data, split it, set a baseline, trained and evaluated a model, checked for overfitting with cross-validation, tested once, and interpreted the result. <strong>Topic 7</strong> adds more powerful algorithms: regularised regression, logistic regression, decision trees and random forests.</p>
<p>Save your notebook to GitHub under <code>machine-learning/</code>.</p>`,
    },
  ],
  quiz: [
    {
      question: 'Which definition best describes machine learning?',
      options: [
        'Writing every rule by hand so the computer can follow it',
        'Methods that automatically detect patterns in data to make predictions',
        'Storing data in relational tables',
        'Drawing charts of data',
      ],
      answer: 1,
    },
    {
      question: 'Predicting a house price from its features, using past sales with known prices, is…',
      options: ['Unsupervised clustering', 'Supervised regression', 'Supervised classification', 'Reinforcement learning'],
      answer: 1,
    },
    {
      question: 'Grouping customers into segments without any labels is an example of…',
      options: ['Supervised learning', 'Unsupervised learning', 'Reinforcement learning', 'Regression'],
      answer: 1,
    },
    {
      question: 'What is the purpose of the test set?',
      options: [
        'To train the model',
        'To tune hyperparameters repeatedly',
        'To evaluate final performance once, on data the model has never seen',
        'To replace missing values',
      ],
      answer: 2,
    },
    {
      question: 'Why do we split data before training?',
      options: [
        'To make training faster',
        'To check that the model is learning general patterns rather than memorising the training data',
        'Because scikit-learn requires exactly three files',
        'To remove outliers',
      ],
      answer: 1,
    },
    {
      question: 'What is a baseline model used for?',
      options: [
        'It is the final model deployed to production',
        'A simple reference (e.g. always predict the mean) that a real model must beat',
        'To clean the data',
        'To split the data',
      ],
      answer: 1,
    },
    {
      question: 'An R² of 0 on the validation set means the model…',
      options: ['Is perfect', 'Explains none of the variation beyond predicting the mean', 'Has zero error', 'Is overfitting'],
      answer: 1,
    },
    {
      question: 'Training MAE is 1.0 but validation MAE is 9.0. What is the likely problem?',
      options: ['Underfitting', 'Overfitting', 'The baseline is too good', 'Too little training data in the test set'],
      answer: 1,
    },
    {
      question: 'What does 5-fold cross-validation do?',
      options: [
        'Trains five different algorithms',
        'Splits the training data into 5 parts, trains on 4 and validates on 1, repeats 5 times, and averages the scores',
        'Uses the test set five times',
        'Repeats the same split five times',
      ],
      answer: 1,
    },
    {
      question: 'Why can\'t you directly compare raw linear-regression coefficients across features like <code>nox</code> and <code>tax</code>?',
      options: [
        'Because coefficients are random',
        'Because the features are measured on very different scales',
        'Because linear regression has no coefficients',
        'Because negative coefficients are errors',
      ],
      answer: 1,
    },
  ],
};
