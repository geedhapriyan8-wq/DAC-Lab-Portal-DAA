/* ============================================================
   Topic 03 — Machine Learning Pipeline
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-03_lab1'] = {
  title:      'Building an End-to-End Pipeline',
  difficulty: 'Hands-on → Intermediate',
  duration:   '60–75 minutes',
  overview:   'In this practical hands-on lab, you will build a production-grade machine learning pipeline using scikit-learn and the real-world Titanic Passenger Dataset. You will engineer a full ColumnTransformer pipeline to handle missing values, encode multi-class categoricals, normalize continuous features, train a Random Forest classifier, evaluate performance across standard metrics, and serialize the trained pipeline for inference.',
  objectives: [
    'Load and profile the real Titanic dataset (datasets/titanic.csv) with pandas',
    'Build a robust ColumnTransformer combining SimpleImputer, StandardScaler, and OneHotEncoder',
    'Assemble an end-to-end scikit-learn Pipeline with RandomForestClassifier',
    'Prevent data leakage by fitting strictly on training data and transforming test data',
    'Compute Confusion Matrix, Precision, Recall, F1-Score, and ROC-AUC',
    'Serialize the fitted pipeline to disk using joblib and run inference on new passenger records',
  ],
  steps: [
    {
      title: 'Step 1: Ingest & Profile Titanic Dataset',
      content: `<p>First, load the dataset from <code>datasets/titanic.csv</code>. We will inspect the feature distributions, examine class balance between survivors (<code>Survived=1</code>) and non-survivors (<code>Survived=0</code>), and identify missing values across features like <code>Age</code>, <code>Cabin</code>, and <code>Embarked</code>.</p>
<h4>Hands-on Task</h4>
<p>Create your Python environment or script <code>pipeline_titanic.py</code>, load the dataset, and output statistical diagnostics.</p>`,
      code: {
        language: 'python',
        content: `import os
import pandas as pd
import numpy as np

# ── Load Titanic Dataset ───────────────────────────────────────
data_path = "datasets/titanic.csv"
if not os.path.exists(data_path):
    # Fallback to local url if running outside workspace
    data_path = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"

df = pd.read_csv(data_path)

print(f"Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns\\n")
print("Target Breakdown (Survived):")
print(df['Survived'].value_counts(normalize=True).round(3))

print("\\nMissing Value Audit:")
missing = df.isnull().sum()
print(missing[missing > 0])

# Select key feature subsets
features_num = ['Age', 'Fare', 'SibSp', 'Parch']
features_cat = ['Sex', 'Embarked', 'Pclass']
target = 'Survived'

X = df[features_num + features_cat]
y = df[target]

print(f"\\nFeatures Matrix Shape: {X.shape}")
print(f"Target Vector Shape: {y.shape}")`,
      },
    },
    {
      title: 'Step 2: Train/Test Split & ColumnTransformer Architecture',
      content: `<p>A major cause of silent failure in production ML systems is <strong>data leakage</strong>: computing imputation statistics (e.g. median age) or feature scaling parameters on the full dataset before splitting. Always perform your train/test split first.</p>
<h4>Pipeline Components</h4>
<ul>
  <li><strong>Numerical Pipeline:</strong> <code>SimpleImputer(strategy='median')</code> followed by <code>StandardScaler()</code> for <code>['Age', 'Fare', 'SibSp', 'Parch']</code>.</li>
  <li><strong>Categorical Pipeline:</strong> <code>SimpleImputer(strategy='most_frequent')</code> followed by <code>OneHotEncoder(handle_unknown='ignore')</code> for <code>['Sex', 'Embarked', 'Pclass']</code>.</li>
</ul>`,
      code: {
        language: 'python',
        content: `from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# Split 80/20 with stratification on target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")

# 1. Pipeline for numerical features
num_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

# 2. Pipeline for categorical features
cat_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

# 3. Combine in ColumnTransformer
preprocessor = ColumnTransformer(
    transformers=[
        ('num', num_transformer, features_num),
        ('cat', cat_transformer, features_cat)
    ]
)

print("Preprocessor architecture initialized.")`,
      },
      warning: 'Never call fit() or fit_transform() on the validation or test set! Transformers must learn their parameters strictly on X_train.',
    },
    {
      title: 'Step 3: End-to-End Random Forest Pipeline',
      content: `<p>Now encapsulate preprocessing and model execution into a single, cohesive <code>sklearn.pipeline.Pipeline</code> containing the preprocessor and a <code>RandomForestClassifier</code>.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.ensemble import RandomForestClassifier

# Assemble final pipeline
model_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(
        n_estimators=120,
        max_depth=6,
        min_samples_split=4,
        random_state=42
    ))
])

# Fit full pipeline end-to-end on training data
model_pipeline.fit(X_train, y_train)
print("✅ Model Pipeline successfully fitted on training set.")`,
      },
    },
    {
      title: 'Step 4: Comprehensive Model Evaluation',
      content: `<p>Evaluate the trained model on <code>X_test</code>. We compute accuracy, precision, recall, F1-score, and display a formatted confusion matrix.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

y_pred = model_pipeline.predict(X_test)
y_proba = model_pipeline.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred)
rec = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_proba)

cm = confusion_matrix(y_test, y_pred)
tn, fp, fn, tp = cm.ravel()

print("==================================================")
print("            TITANIC PIPELINE EVALUATION           ")
print("==================================================")
print(f"Accuracy  : {acc:.4f} ({acc*100:.1f}%)")
print(f"Precision : {prec:.4f}")
print(f"Recall    : {rec:.4f}")
print(f"F1-Score  : {f1:.4f}")
print(f"ROC-AUC   : {auc:.4f}")
print("--------------------------------------------------")
print(f"Confusion Matrix:")
print(f"  [TN={tn:3d}  FP={fp:3d}]")
print(f"  [FN={fn:3d}  TP={tp:3d}]")
print("==================================================")
print("\\nDetailed Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Perished', 'Survived']))`,
      },
      note: 'Notice how the pipeline handles raw untransformed DataFrames seamlessly because the preprocessing is baked directly into the object.',
    },
    {
      title: 'Step 5: Model Persistence & Production Inference',
      content: `<p>To deploy the model into a microservice or batch job, serialize the pipeline with <code>joblib</code>. Then load it back and run inference on raw un-encoded passenger records.</p>`,
      code: {
        language: 'python',
        content: `import joblib

model_filename = "titanic_rf_pipeline.joblib"
joblib.dump(model_pipeline, model_filename)
file_size_kb = os.path.getsize(model_filename) / 1024
print(f"Saved pipeline artifact: {model_filename} ({file_size_kb:.1f} KB)")

# Reload and test inference on new un-preprocessed passengers
loaded_pipeline = joblib.load(model_filename)

new_passengers = pd.DataFrame([
    {
        'Pclass': 1,
        'Sex': 'female',
        'Age': 29.0,
        'SibSp': 0,
        'Parch': 0,
        'Fare': 150.0,
        'Embarked': 'C'
    },
    {
        'Pclass': 3,
        'Sex': 'male',
        'Age': 22.0,
        'SibSp': 1,
        'Parch': 0,
        'Fare': 7.25,
        'Embarked': 'S'
    }
])

preds = loaded_pipeline.predict(new_passengers)
probs = loaded_pipeline.predict_proba(new_passengers)

print("\\n--- Production Inference on Incoming Records ---")
for i, row in new_passengers.iterrows():
    status = "SURVIVED ✅" if preds[i] == 1 else "PERISHED ❌"
    print(f"Passenger {i+1} ({row['Sex']}, Class {row['Pclass']}, Age {row['Age']}):")
    print(f"  Prediction: {status}")
    print(f"  Survival Probability: {probs[i][1]:.2%}\\n")`,
      },
    },
  ],
  exercises: [
    'Modify the numerical imputer to use KNNImputer instead of SimpleImputer. Does cross-validated ROC-AUC improve?',
    'Engineer a new feature "FamilySize = SibSp + Parch + 1" using a custom FunctionTransformer inside the pipeline.',
    'Test with an XGBoost or LightGBM classifier replacing RandomForestClassifier in the final step.',
    'Evaluate how dropping the Cabin column vs extracting Deck letter impacts validation metrics.',
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
    },
    {
      question: 'In cancer screening or survival prediction, which metric should you MINIMIZE above all others to avoid missing positive cases?',
      options: [
        'False Positive Rate — we want to avoid unnecessary biopsies',
        'False Negative Rate — we must not miss actual cases',
        'Overall error rate — we want balanced performance',
        'Training loss — we want the model to fit training data well',
      ],
    },
    {
      question: 'What is the main advantage of k-Fold Cross-Validation over a single train/test split?',
      options: [
        'It trains the model k times faster by parallelizing the process',
        'It gives a more robust performance estimate by averaging over k different data splits, reducing variance',
        'It always achieves higher accuracy than a single train/test split',
        'It prevents overfitting by training on only 1/k of the data',
      ],
    },
    {
      question: 'The F1-score is the harmonic mean of precision and recall. When is it preferred over accuracy?',
      options: [
        'When the dataset is perfectly balanced between classes',
        'When the model is a neural network rather than a classical algorithm',
        'When there is class imbalance, making accuracy a misleading metric',
        'When the training dataset has more than 10,000 samples',
      ],
    },
    {
      question: 'What is `joblib.dump()` used for in an ML pipeline?',
      options: [
        'To remove unnecessary features from the dataset',
        'To serialize and save a trained model to disk so it can be reloaded later without retraining',
        'To dump debugging information about the model to a log file',
        'To export the model to a JavaScript-compatible format',
      ],
    },
  ],
};

window.LAB_DATA['topic-03_lab2'] = {
  title:      'Automated CI/CD Simulation',
  difficulty: 'Advanced / MLOps',
  duration:   '75–90 minutes',
  overview:   'In this lab, you will build an automated MLOps Continuous Integration / Continuous Deployment (CI/CD) simulation. Modern ML engineering requires automated testing gates: when a new model candidate is trained, an automated pipeline verifies whether it passes strict quality gates (Accuracy, F1-Score, Inference Latency benchmark, and Canary Data Drift tests) before deciding whether to promote the candidate to Production or halt the release.',
  objectives: [
    'Construct an automated Python CI/CD Quality Gate engine for machine learning models',
    'Define rigorous production acceptance criteria (Accuracy >= 0.80, Latency <= 30ms, F1 >= 0.75)',
    'Simulate model candidate training vs baseline production models',
    'Benchmark inference latency under simulated production traffic (p50, p95, p99)',
    'Programmatically generate CI/CD build artifacts and deployment decision reports (metrics.json, promotion_status.json)',
    'Simulate a regression bug and verify automated pipeline rejection and rollback triggers',
  ],
  steps: [
    {
      title: 'Step 1: The MLOps CI/CD Quality Gate Concept',
      content: `<p>In modern ML platforms (e.g. GitHub Actions, Kubeflow, MLflow), code changes or automated retraining pipelines cannot deploy directly to production without programmatic validation.</p>
<h4>The Gate Checklist</h4>
<ul>
  <li><strong>Performance Floor:</strong> Candidate Accuracy &ge; 80% and F1-Score &ge; 0.75.</li>
  <li><strong>Regression Gate:</strong> Candidate must outperform or equal current Production model on golden test split.</li>
  <li><strong>Latency SLA Gate:</strong> 95th percentile inference latency must remain &le; 30 ms per batch.</li>
  <li><strong>Payload Integrity:</strong> Model must serialize and reload without dependency mismatch.</li>
</ul>`,
      code: {
        language: 'python',
        content: `import json
import time
import os
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score

class MLOpsQualityGate:
    def __init__(self, min_acc=0.80, min_f1=0.75, max_latency_ms=30.0):
        self.min_acc = min_acc
        self.min_f1 = min_f1
        self.max_latency_ms = max_latency_ms

    def evaluate_candidate(self, candidate_name, metrics, latency_p95, prod_metrics=None):
        passed_acc = metrics['accuracy'] >= self.min_acc
        passed_f1 = metrics['f1'] >= self.min_f1
        passed_latency = latency_p95 <= self.max_latency_ms
        passed_regression = True
        
        if prod_metrics:
            passed_regression = metrics['f1'] >= (prod_metrics['f1'] - 0.01)

        all_passed = passed_acc and passed_f1 and passed_latency and passed_regression

        report = {
            "candidate": candidate_name,
            "status": "PROMOTED_TO_PRODUCTION" if all_passed else "REJECTED_BY_GATE",
            "checks": {
                "accuracy_gate": {"value": metrics['accuracy'], "threshold": self.min_acc, "passed": passed_acc},
                "f1_gate": {"value": metrics['f1'], "threshold": self.min_f1, "passed": passed_f1},
                "latency_p95_gate_ms": {"value": latency_p95, "threshold": self.max_latency_ms, "passed": passed_latency},
                "regression_gate": {"passed": passed_regression}
            }
        }
        return all_passed, report`,
      },
    },
    {
      title: 'Step 2: Train Candidate Models & Production Baseline',
      content: `<p>We will train two candidate models on the Titanic dataset: a <strong>Production Baseline</strong> (simple Decision Tree) and a new <strong>Candidate Release v2.0</strong> (Tuned Random Forest with Ensemble Features).</p>`,
      code: {
        language: 'python',
        content: `from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# Load data
df = pd.read_csv("datasets/titanic.csv")
num_cols = ['Age', 'Fare', 'SibSp', 'Parch']
cat_cols = ['Sex', 'Embarked', 'Pclass']
X = df[num_cols + cat_cols]
y = df['Survived']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

preprocessor = ColumnTransformer([
    ('num', Pipeline([('imp', SimpleImputer(strategy='median')), ('sc', StandardScaler())]), num_cols),
    ('cat', Pipeline([('imp', SimpleImputer(strategy='most_frequent')), ('ohe', OneHotEncoder(handle_unknown='ignore'))]), cat_cols)
])

# 1. Existing Production Model (Legacy v1.0)
prod_pipeline = Pipeline([
    ('prep', preprocessor),
    ('clf', DecisionTreeClassifier(max_depth=3, random_state=42))
])
prod_pipeline.fit(X_train, y_train)

# 2. Candidate Model (Candidate v2.0)
candidate_pipeline = Pipeline([
    ('prep', preprocessor),
    ('clf', RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42))
])
candidate_pipeline.fit(X_train, y_train)

print("Baseline and Candidate models trained successfully.")`,
      },
    },
    {
      title: 'Step 3: Automated Latency SLA Benchmark',
      content: `<p>Models can have high accuracy but fail production SLAs due to heavy computational overhead. Here we benchmark latency across 100 inference passes to compute mean, p50, and p95 latency.</p>`,
      code: {
        language: 'python',
        content: `def benchmark_inference_latency(pipeline, sample_batch, iterations=100):
    latencies = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        _ = pipeline.predict(sample_batch)
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000.0)  # Convert to milliseconds

    return {
        "mean_ms": round(float(np.mean(latencies)), 3),
        "p50_ms":  round(float(np.median(latencies)), 3),
        "p95_ms":  round(float(np.percentile(latencies, 95)), 3),
        "max_ms":  round(float(np.max(latencies)), 3),
    }

# Benchmark candidate on batch of 20 samples
test_batch = X_test.iloc[:20]
latency_metrics = benchmark_inference_latency(candidate_pipeline, test_batch)
print("Candidate Inference Latency Profile (batch of 20):")
print(json.dumps(latency_metrics, indent=2))`,
      },
    },
    {
      title: 'Step 4: Execute CI/CD Quality Gate & Generate Decision',
      content: `<p>Now execute the automated gate verification. The system checks all criteria and produces an artifact <code>pipeline_report.json</code> that would be read by an automated deployment job.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.metrics import accuracy_score, f1_score

# Compute metrics
y_pred_prod = prod_pipeline.predict(X_test)
prod_metrics = {
    'accuracy': round(accuracy_score(y_test, y_pred_prod), 4),
    'f1': round(f1_score(y_test, y_pred_prod), 4)
}

y_pred_cand = candidate_pipeline.predict(X_test)
cand_metrics = {
    'accuracy': round(accuracy_score(y_test, y_pred_cand), 4),
    'f1': round(f1_score(y_test, y_pred_cand), 4)
}

gate = MLOpsQualityGate(min_acc=0.80, min_f1=0.75, max_latency_ms=25.0)
passed, report = gate.evaluate_candidate(
    candidate_name="Candidate-v2.0-RandomForest",
    metrics=cand_metrics,
    latency_p95=latency_metrics['p95_ms'],
    prod_metrics=prod_metrics
)

print("\\n" + "="*50)
print(f" CI/CD PIPELINE VERDICT: {report['status']}")
print("="*50)
print(f"Candidate Accuracy : {cand_metrics['accuracy']} (Baseline: {prod_metrics['accuracy']})")
print(f"Candidate F1-Score : {cand_metrics['f1']} (Baseline: {prod_metrics['f1']})")
print(f"Candidate Latency  : {latency_metrics['p95_ms']} ms")
print("-" * 50)
for k, v in report['checks'].items():
    icon = "✅" if v.get('passed') else "❌"
    print(f"  {icon} {k:<20}: {v}")

with open("pipeline_report.json", "w") as f:
    json.dump(report, f, indent=2)
print("\\nBuild report written to pipeline_report.json")`,
      },
    },
    {
      title: 'Step 5: Simulating Regression Rejection & Rollback',
      content: `<p>A resilient pipeline must reject poor models. Let us simulate a degraded candidate model (e.g. an undertrained or corrupt configuration) and confirm that the CI/CD gate halts the build with exit code 1.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.dummy import DummyClassifier

# Simulate a faulty candidate (e.g., buggy hyperparameter release)
faulty_pipeline = Pipeline([
    ('prep', preprocessor),
    ('clf', DummyClassifier(strategy='most_frequent'))
])
faulty_pipeline.fit(X_train, y_train)

faulty_metrics = {
    'accuracy': round(accuracy_score(y_test, faulty_pipeline.predict(X_test)), 4),
    'f1': round(f1_score(y_test, faulty_pipeline.predict(X_test)), 4)
}

passed_faulty, faulty_report = gate.evaluate_candidate(
    candidate_name="Buggy-Candidate-v3.0",
    metrics=faulty_metrics,
    latency_p95=5.0,
    prod_metrics=prod_metrics
)

print("\\n--- Simulating Buggy Candidate Release ---")
print(f"Status: {faulty_report['status']}")
if not passed_faulty:
    print("🚨 BUILD FAILED! Gate prevented buggy model deployment to production.")
    print("Automated rollback initiated. Production remains on Baseline v1.0.")`,
      },
    },
  ],
  exercises: [
    'Add an automated Data Drift detector (e.g. Kolmogorov-Smirnov test on numerical features) to the CI/CD gate.',
    'Integrate an automated model artifact packaging step creating a Dockerfile and requirements.txt for candidate models that pass.',
    'Configure Slack or Webhook notification payload simulation inside the gate evaluation callback.',
    'Implement a Canary deployment strategy where 10% of test traffic is directed to the candidate before full release.',
  ],
  quiz: [
    {
      question: 'What is the primary risk of using an unconstrained hyperparameter search in an automated pipeline?',
      options: [
        'It will always produce a model that overfits the test set',
        'Computational cost grows exponentially with the number of hyperparameters, making it impractical for large grids',
        'It cannot handle continuous hyperparameters like learning rate',
        'It requires the training data to be perfectly balanced',
      ],
    },
    {
      question: 'In feature selection and regularization, what unique property does L1 penalty (Lasso) provide?',
      options: [
        'L1 is always faster to train than L2',
        'L1 produces a sparse solution — it drives some feature weights exactly to zero, performing feature selection',
        'L1 works only for linear models while L2 works for all models',
        'L1 regularization guarantees the global optimum',
      ],
    },
    {
      question: 'In automated ML CI/CD systems, what is the role of an automated Quality Gate?',
      options: [
        'To preprocess the raw input data before it reaches the base models',
        'To select which base models should be included in the ensemble',
        'To evaluate candidates against strict accuracy, regression, and latency SLAs before promoting them to production',
        'To regularize the base models and prevent individual overfitting',
      ],
    },
    {
      question: 'Why is inference latency benchmarked alongside accuracy in production ML CI/CD gates?',
      options: [
        'Latency benchmarks speed up model training',
        'A model may achieve high accuracy but violate production SLAs due to unacceptable compute delays under live traffic',
        'Latency only affects batch offline predictions',
        'Permutation importance requires latency measurements',
      ],
    },
    {
      question: 'What is experiment and pipeline tracking in machine learning, and why is it essential?',
      options: [
        'Monitoring the CPU and memory usage during model training',
        'Systematically recording hyperparameters, metrics, and results for each experiment run to enable comparison, reproducibility, and auditing',
        'A technique for speeding up model training by tracking gradient updates',
        'A method for detecting data drift in production model deployments',
      ],
    },
  ],
};
