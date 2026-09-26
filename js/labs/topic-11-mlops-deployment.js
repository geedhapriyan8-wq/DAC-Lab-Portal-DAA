/* ============================================================
   Topic 11 — MLOps and Deployment (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-11_lab1'] = {
  title:      'Containerizing Machine Learning Models with Docker',
  difficulty: 'Simple → Intermediate',
  duration:   '90 minutes',
  overview:   'Building an accurate ML model in a Jupyter Notebook is only 10% of the battle. The other 90% is MLOps (Machine Learning Operations). If you share a Python script, it will almost certainly crash on a coworker\'s machine due to dependency hell (wrong PyTorch version, missing CUDA drivers, OS differences). In this lab, you will solve "It works on my machine" forever by containerizing an ML inference API using Docker and FastAPI.',
  objectives: [
    'Understand the severe limitations of deploying raw Python scripts',
    'Write a robust REST API for ML inference using FastAPI',
    'Understand the structure of a production Dockerfile (Multi-stage builds, Base images)',
    'Build and run an isolated Docker container exposing the API to the host network',
    'Understand why containers are essential for Kubernetes and massive horizontal scaling',
  ],
  steps: [
    {
      title: 'The Problem: Dependency Hell',
      content: `<p>A machine learning model is heavily dependent on specific versions of libraries (e.g., PyTorch 2.1.0, NumPy 1.24, specific CUDA drivers for GPU acceleration). If your production server runs slightly different versions, the tensor math will fail or the environment will crash.</p>
<p><strong>Docker Containers</strong> solve this by packaging your code, libraries, and the entire operating system environment (like Ubuntu Linux) into a single immutable block called an <em>Image</em>. This guarantees that your model runs exactly the same way in the cloud as it did on your laptop.</p>`,
      code: {
        language: 'python',
        content: `# ── 1. The Inference API (app.py) ──
# Before we containerize, we must wrap our model in a REST API so the outside world can talk to it.
# We use FastAPI, the industry standard for high-performance Python APIs.
from fastapi import FastAPI
from pydantic import BaseModel
import random # Simulating a machine learning model for speed

app = FastAPI(title="Acme Corp ML Predictor")

# Define the exact JSON structure the API expects using Pydantic
class PredictionRequest(BaseModel):
    feature_1: float
    feature_2: float
    feature_3: float

# Load the heavy model weights ONCE when the server starts
# model = load_heavy_weights("model_v1.pth")
print("Simulating loading 2GB model weights into RAM...")

@app.post("/predict")
def predict(request: PredictionRequest):
    """
    Receives JSON data, runs it through the ML model, and returns the prediction.
    """
    # simulated_prediction = model.predict([request.feature_1, ...])
    simulated_prediction = request.feature_1 * 0.5 + random.random()
    
    return {
        "status": "success",
        "prediction": simulated_prediction,
        "model_version": "v1.0.3"
    }

# If you run this script locally, it starts a web server on port 8000
# uvicorn.run(app, host="0.0.0.0", port=8000)`
      }
    },
    {
      title: 'Writing the Dockerfile',
      content: `<p>A <code>Dockerfile</code> is a text document that contains all the commands a user could call on the command line to assemble an image. It is a strict recipe for your environment.</p>
<h4>Key Docker Commands:</h4>
<ul>
  <li><code>FROM</code>: Defines the base operating system (e.g., an official Python Linux image).</li>
  <li><code>WORKDIR</code>: Sets the folder inside the container where commands will run.</li>
  <li><code>COPY</code>: Copies files from your laptop into the container.</li>
  <li><code>RUN</code>: Executes terminal commands inside the container (like installing pip packages).</li>
  <li><code>CMD</code>: The final command to execute when the container actually boots up.</li>
</ul>`,
      code: {
        language: 'dockerfile',
        content: `# ── 2. The Dockerfile ──

# 1. Use an official, lightweight Python 3.10 image based on Debian Linux (slim)
FROM python:3.10-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy ONLY the requirements file first to leverage Docker's aggressive layer caching.
# If requirements.txt hasn't changed, Docker skips the slow 'pip install' step on rebuilds.
COPY requirements.txt .

# 4. Install the Python dependencies (FastAPI, Uvicorn, Torch, etc.)
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of the application code (like app.py and the model weights)
COPY . .

# 6. Expose port 8000 so the outside world can connect to the API
EXPOSE 8000

# 7. Define the command to start the web server when the container runs
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]`
      },
      note: 'Notice step 3 and 4. In Docker, every line creates a cached "layer". By copying the requirements file first and installing dependencies BEFORE copying the raw source code, you ensure that if you only change one line of python code in `app.py`, Docker does not have to spend 10 minutes re-downloading PyTorch. It just uses the cached layer.'
    },
    {
      title: 'Building and Running the Container',
      content: `<p>Once the Dockerfile is written, we use the Docker CLI to build the image (the immutable blueprint) and run it as a container (the live, running instance).</p>`,
      code: {
        language: 'bash',
        content: `# ── 3. Terminal Commands ──

# A. Build the Image
# The '-t' flag tags the image with a human-readable name. 
# The '.' tells Docker to look in the current directory for the Dockerfile.
docker build -t ml-predictor-api:v1 .

# B. Run the Container
# '-d' runs it in detached mode (in the background).
# '-p 8080:8000' is CRITICAL. It maps Port 8080 on your physical laptop 
# to Port 8000 inside the isolated container.
docker run -d -p 8080:8000 --name active-ml-api ml-predictor-api:v1

# C. Test the Live API using cURL
curl -X POST "http://localhost:8080/predict" \\
     -H "Content-Type: application/json" \\
     -d '{"feature_1": 10.5, "feature_2": 2.2, "feature_3": 0.0}'

# Expected JSON output from the container:
# {"status": "success", "prediction": 5.83, "model_version": "v1.0.3"}

# D. View the isolated logs of the container
docker logs active-ml-api`
      }
    }
  ],
  exercises: [
    'Modify the FastAPI `PredictionRequest` to accept a `user_id` string and a `historical_data` array. How does Pydantic automatically validate the JSON types coming from the client?',
    'What happens if you run the docker container but forget to include the `-p 8080:8000` port mapping flag? Can you reach the API from your browser?',
    'Research Docker "Volumes". If your machine learning model accepts images and saves the predictions to a folder inside the container, what happens to those saved images if the container crashes and is deleted? How do volumes fix this?',
  ],
  quiz: [
    {
      question: 'What is the primary purpose of a Docker Container in Machine Learning deployment?',
      options: [
        'To compress the model weights so they take up less disk space',
        'To package the exact OS, Python version, library dependencies, and code into an isolated, reproducible environment that runs identically on any server',
        'To encrypt the model so competitors cannot steal the architecture',
        'To automatically write REST APIs in C++',
      ],
      answer: 1
    },
    {
      question: 'In a production Dockerfile, why is it standard best practice to `COPY requirements.txt` and `RUN pip install` BEFORE you `COPY` the rest of your application code?',
      options: [
        'Because Python requires requirements.txt to be at the very top of the folder structure',
        'To leverage Docker layer caching: if you only change your application code, Docker will use the cached dependency layer and instantly rebuild without spending 10 minutes re-downloading massive ML libraries',
        'Because Docker cannot copy Python scripts before it knows what libraries they need',
        'Because `pip install` will automatically delete any `.py` files it finds in the directory',
      ],
      answer: 1
    },
    {
      question: 'What does the `-p 8080:8000` flag do in the `docker run` command?',
      options: [
        'It allocates 8080 MB of RAM to the container and 8000 MB to the host',
        'It sets the priority of the container to 8080 and the timeout to 8000ms',
        'It maps Port 8080 on the host machine to Port 8000 inside the isolated container, allowing external traffic to reach the API',
        'It tells the container to run between the hours of 8:08 AM and 8:00 PM',
      ],
      answer: 2
    }
  ]
};

window.LAB_DATA['topic-11_lab2'] = {
  title:      'CI/CD, Monitoring, and Model Drift (MLOps)',
  difficulty: 'Intermediate → Advanced',
  duration:   '120 minutes',
  overview:   'Deploying a model is not the end; it is the beginning. In traditional software, code degrades when dependencies change. In Machine Learning, models degrade silently because the real-world data changes (Data Drift and Concept Drift). In this advanced lab, you will understand Continuous Integration / Continuous Deployment (CI/CD) pipelines, write automated tests for ML endpoints, and implement statistical monitoring to detect when an AI model begins to fail in production.',
  objectives: [
    'Understand the CI/CD Pipeline (GitHub Actions, Automated Testing, Deployment)',
    'Write unit tests for ML Models to catch silent mathematical failures',
    'Understand the severe dangers of Data Drift and Concept Drift',
    'Implement a statistical monitoring script to detect drift in production data',
    'Understand Shadow Deployments and A/B Testing strategies for new models',
  ],
  steps: [
    {
      title: 'Continuous Integration (CI): Automated Testing for ML',
      content: `<p>In standard software, CI runs tests every time you push code to GitHub to ensure you didn't break a button. In ML, you must write <strong>Behavioral Tests</strong> to ensure the model\'s predictions haven't silently degraded after retraining.</p>`,
      code: {
        language: 'python',
        content: `import pytest

# Imagine this is imported from our application
def ml_predict(income, credit_score):
    """Simulates a Loan Approval Model (Returns Probability 0.0 - 1.0)"""
    # Fake logic for testing
    if credit_score > 700 and income > 50000: return 0.95
    if credit_score < 600: return 0.10
    return 0.50

# ── Automated ML Behavioral Tests (test_model.py) ──

def test_high_income_excellent_credit():
    """Invariance Test: Perfect applicants should always be approved."""
    prob = ml_predict(income=120000, credit_score=800)
    assert prob > 0.90, f"Expected high approval, got {prob}"

def test_poor_credit_denial():
    """Directional Expectation Test: Lower credit score MUST lower probability."""
    prob_good = ml_predict(income=60000, credit_score=750)
    prob_bad  = ml_predict(income=60000, credit_score=550)
    
    assert prob_bad < prob_good, "Lower credit score did not lower approval probability! Model logic is broken."

def test_model_latency():
    """Performance Test: Model must return prediction within SLA (e.g., 200ms)."""
    import time
    start = time.time()
    _ = ml_predict(income=70000, credit_score=680)
    duration = time.time() - start
    
    # We enforce a strict Service Level Agreement (SLA) on inference time
    assert duration < 0.200, f"Model is too slow! Took {duration}s"

print("Automated ML Tests written. These will be executed automatically by GitHub Actions on every commit.")`
      }
    },
    {
      title: 'The Silent Killer: Model Drift',
      content: `<p>A REST API crashing throws a 500 Error, immediately alerting engineers. An ML model failing does not crash; it confidently outputs terrible predictions. This happens due to <strong>Drift</strong>.</p>
<ul>
  <li><strong>Data Drift (Covariate Shift):</strong> The distribution of the incoming data changes. (e.g., A model trained on high-res daytime photos is suddenly deployed in a factory with low-res night-vision cameras. The model will confidently fail).</li>
  <li><strong>Concept Drift:</strong> The relationship between the features and the target changes. (e.g., A fraud detection model trained in 2019 fails in 2021 because scammers invented entirely new behavioral patterns during the pandemic).</li>
</ul>`,
      code: {
        language: 'python',
        content: `import numpy as np
from scipy.stats import ks_2samp

# ── Detecting Data Drift Statistically ──

# 1. Historical Reference Data (What the model was trained on 6 months ago)
# Let's say this is the 'age' feature of our users (Mean ~35 years old)
training_data_age = np.random.normal(loc=35, scale=5, size=1000)

# 2. Live Production Data (What the API is receiving today)
# Over time, our marketing shifted, and now mostly teenagers are using the app! (Mean ~19)
production_data_age = np.random.normal(loc=19, scale=3, size=1000)

print("--- Automated Data Drift Detection ---")
print(f"Training Data Mean:   {np.mean(training_data_age):.1f} years")
print(f"Production Data Mean: {np.mean(production_data_age):.1f} years\\n")

# 3. Statistical Test: Kolmogorov-Smirnov (KS) Test
# The KS test compares two distributions and determines if they are fundamentally different.
# If the p-value is extremely small (< 0.05), the distributions have drifted significantly.
stat, p_value = ks_2samp(training_data_age, production_data_age)

print(f"KS Statistic: {stat:.4f}")
print(f"P-Value: {p_value:.10f}")

if p_value < 0.05:
    print("🚨 ALERT: Severe Data Drift Detected! The production data no longer matches the training data.")
    print("ACTION REQUIRED: Trigger automated data pipeline to gather new data and retrain the model.")
else:
    print("✅ Distributions are stable. Model is safe to continue operating.")`
      },
      warning: 'Monitoring is not optional in production ML. If you deploy a model and ignore it for a year, its accuracy will slowly degrade to worse-than-random guessing. MLOps is the discipline of catching this degradation automatically.'
    },
    {
      title: 'Safe Deployment: A/B Testing and Shadow Mode',
      content: `<p>When you train a new model (V2) to fix drift, you cannot just replace the old model (V1) instantly. V2 might have a catastrophic bug that your offline tests missed.</p>
<h4>Safe Deployment Strategies:</h4>
<ul>
  <li><strong>Shadow Mode:</strong> Both V1 and V2 receive the live user traffic. V1's prediction is returned to the user. V2's prediction is secretly logged to a database. Engineers compare V1 and V2 offline to ensure V2 is safe before switching.</li>
  <li><strong>A/B Testing (Canary Release):</strong> You route 90% of user traffic to V1, and 10% to V2. You monitor business metrics (like click-through rate or revenue). If V2 performs better, you slowly ramp it up to 100%.</li>
</ul>`,
    }
  ],
  exercises: [
    'Write a new test function `test_extreme_outliers` that passes `income=999999999` to the model. Why is testing for extreme boundary conditions critical for production APIs?',
    'What is the difference between Data Drift and Concept Drift? Give a real-world example of Concept Drift in the housing market predicting house prices.',
    'Research "GitHub Actions". Write a basic pseudo-code YAML file that triggers `pytest test_model.py` every time a developer pushes code to the `main` branch.',
  ],
  quiz: [
    {
      question: 'What is the fundamental difference between standard software CI/CD and ML CI/CD?',
      options: [
        'ML CI/CD is written entirely in SQL',
        'Standard CI/CD only tests if code compiles; ML CI/CD must also validate data distributions, model behavioral logic, and statistical invariants before allowing deployment',
        'Standard CI/CD uses Docker, but ML CI/CD relies entirely on Jupyter Notebooks',
        'ML CI/CD cannot be automated and requires human manual review every time',
      ],
      answer: 1
    },
    {
      question: 'What defines "Concept Drift" in Machine Learning?',
      options: [
        'When the codebase slowly moves from Python to C++',
        'When the statistical distribution of the input features changes drastically (e.g., users get younger)',
        'When the fundamental underlying relationship between the input features and the target variable changes over time (e.g., consumer buying behavior fundamentally changes due to a global pandemic)',
        'When the model weights are accidentally deleted from the server',
      ],
      answer: 2
    },
    {
      question: 'What is the "Shadow Mode" deployment strategy?',
      options: [
        'Deploying the model on the Dark Web for cybersecurity testing',
        'Routing live production traffic to both the old model and the new model, but only returning the old model\'s predictions to the user while secretly logging the new model\'s predictions for safety analysis',
        'Turning off all logging and monitoring to save server costs',
        'Deploying the model at night when server traffic is lowest',
      ],
      answer: 1
    },
    {
      question: 'Why is the Kolmogorov-Smirnov (KS) test commonly used in MLOps monitoring pipelines?',
      options: [
        'To mathematically compare the statistical distribution of live production data against the historical training data to detect severe Data Drift',
        'To encrypt the REST API traffic between the client and server',
        'To calculate the final loss gradient during Neural Network Backpropagation',
        'To ensure the Docker container has enough RAM allocated',
      ],
      answer: 0
    }
  ]
};
