/* ============================================================
   Topic 01 — AI Basics + Workflow Automation
   Lab 1: Simple → Intermediate
   Lab 2: Intermediate → Advanced
   ============================================================ */

window.LAB_DATA = window.LAB_DATA || {};

/* ─────────────────────────────────────────────────────────────
   LAB 1 — Introduction to AI Concepts & Simple Workflows
   ───────────────────────────────────────────────────────────── */
window.LAB_DATA['topic-01_lab1'] = {
  title:      'Introduction to AI Concepts & Simple Workflows',
  difficulty: 'Simple → Intermediate',
  duration:   '45–60 minutes',
  overview:   'In this lab you will explore the foundational concepts of Artificial Intelligence, understand the key differences between rule-based systems and machine learning, and build a simple automated decision-making workflow using Python. By the end, you will understand how AI perceives problems, and you will have hands-on experience constructing a functional pipeline.',
  objectives: [
    'Define Artificial Intelligence and its major subfields',
    'Distinguish between rule-based automation and ML-driven automation',
    'Build a simple data-driven decision workflow in Python',
    'Understand the concept of an AI pipeline end to end',
    'Test and evaluate a basic automated system',
  ],
  steps: [
    {
      title: 'What Is Artificial Intelligence?',
      content: `<p>Artificial Intelligence (AI) is the simulation of human intelligence processes by machines — especially computer systems. It encompasses a broad range of techniques designed to make machines "think," learn, and adapt.</p>
<h4>Three Levels of AI</h4>
<ul>
  <li><strong>Narrow AI (ANI):</strong> Designed for one specific task (e.g., chess engines, spam filters, voice assistants). All AI in production today is Narrow AI.</li>
  <li><strong>General AI (AGI):</strong> Hypothetical AI with human-like reasoning across any domain. Does not yet exist.</li>
  <li><strong>Super AI (ASI):</strong> Theoretical AI surpassing human intelligence in all fields. Remains speculative.</li>
</ul>
<h4>Core AI Subfields You Will Encounter</h4>
<ul>
  <li><strong>Machine Learning:</strong> Systems that learn patterns from data without being explicitly programmed.</li>
  <li><strong>Deep Learning:</strong> ML using neural networks with many layers, excellent for images, audio, and text.</li>
  <li><strong>Natural Language Processing (NLP):</strong> Understanding and generating human language.</li>
  <li><strong>Computer Vision:</strong> Enabling machines to interpret images and video.</li>
  <li><strong>Robotics & Automation:</strong> Combining AI with physical systems.</li>
</ul>
<p>The key insight: <strong>AI is about building systems that improve with experience and data</strong>, rather than following a fixed, human-written set of instructions for every possible situation.</p>`,
      note: 'Read this step carefully — these definitions form the vocabulary you will use throughout all subsequent labs in this course.',
    },
    {
      title: 'Setting Up Your Python Environment',
      content: `<p>Before writing any code, you need a working Python environment with the right libraries. This lab uses Python 3.8+ and a few core packages.</p>
<h4>Option A: Using Google Colab (Recommended for Beginners)</h4>
<ol>
  <li>Open your browser and navigate to <strong>colab.research.google.com</strong>.</li>
  <li>Click <strong>New Notebook</strong>.</li>
  <li>All common libraries (NumPy, Pandas, Scikit-learn) are pre-installed. No setup required!</li>
</ol>
<h4>Option B: Local Installation with pip</h4>
<p>Open a terminal (Command Prompt on Windows, Terminal on Mac/Linux) and run:</p>`,
      code: {
        language: 'bash',
        content: `# Create a virtual environment
python -m venv dsa_env

# Activate it
# On Mac/Linux:
source dsa_env/bin/activate
# On Windows:
dsa_env\\Scripts\\activate

# Install required packages
pip install numpy pandas scikit-learn matplotlib requests`,
      },
      note: 'Always use a virtual environment to keep project dependencies isolated from your system Python.',
    },
    {
      title: 'Rule-Based vs. Machine Learning Approaches',
      content: `<p>Understanding the difference between rule-based and ML-based systems is fundamental. Let us build both for the same problem — classifying a student's grade — and compare them.</p>
<h4>Problem: Classify a student's performance as "Pass" or "Fail"</h4>
<p>Below is the <strong>rule-based approach</strong>: a human expert writes all the conditions explicitly.</p>`,
      code: {
        language: 'python',
        content: `# ── RULE-BASED APPROACH ──────────────────────────────────────
def classify_student_rules(score, attendance_pct):
    """Classify student performance using hand-crafted rules."""
    if score >= 60 and attendance_pct >= 75:
        return "Pass"
    elif score >= 75 and attendance_pct >= 50:
        return "Pass"   # High scorer gets a pass despite lower attendance
    else:
        return "Fail"

# Test the rule-based system
test_students = [
    {"name": "Alice",   "score": 85, "attendance": 90},
    {"name": "Bob",     "score": 55, "attendance": 80},
    {"name": "Charlie", "score": 72, "attendance": 60},
    {"name": "Diana",   "score": 65, "attendance": 70},
]

print("── Rule-Based Classification ──────────────────")
for s in test_students:
    result = classify_student_rules(s["score"], s["attendance"])
    print(f"{s['name']:10s} | Score: {s['score']} | Attendance: {s['attendance']}% → {result}")`,
      },
      note: 'Notice how every rule must be written manually. If the criteria change next semester, a developer has to update every condition — this does not scale well.',
    },
    {
      title: 'Building an ML-Based Classifier',
      content: `<p>Now let us solve the same problem using Machine Learning. Instead of writing rules, we <em>train</em> a model on example data. The algorithm learns the patterns automatically.</p>
<p>This is the fundamental shift in AI: <strong>instead of programming behavior, we program a learning process.</strong></p>`,
      code: {
        language: 'python',
        content: `import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# ── Step 1: Create training dataset ──────────────────────────
# Each row: [score, attendance_pct], label: 1=Pass, 0=Fail
np.random.seed(42)

scores      = np.random.randint(40, 100, size=200)
attendance  = np.random.randint(40, 100, size=200)
# Ground truth: pass if score >= 60 AND attendance >= 75
labels = ((scores >= 60) & (attendance >= 75)).astype(int)

X = np.column_stack([scores, attendance])
y = labels

# ── Step 2: Split into train and test sets ───────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Training samples: {len(X_train)} | Test samples: {len(X_test)}")

# ── Step 3: Train the model ───────────────────────────────────
model = LogisticRegression()
model.fit(X_train, y_train)
print("Model trained successfully!")

# ── Step 4: Evaluate on test set ─────────────────────────────
y_pred = model.predict(X_test)
acc    = accuracy_score(y_test, y_pred)
print(f"\\nAccuracy: {acc:.2%}")
print("\\n" + classification_report(y_test, y_pred, target_names=["Fail", "Pass"]))

# ── Step 5: Predict on new students ──────────────────────────
new_students = np.array([[85, 90], [55, 80], [72, 60], [65, 70]])
predictions  = model.predict(new_students)
labels_map   = {0: "Fail", 1: "Pass"}

print("── ML Model Predictions ─────────────────────────")
names = ["Alice", "Bob", "Charlie", "Diana"]
for name, pred, student in zip(names, predictions, new_students):
    print(f"{name:10s} | Score: {student[0]} | Attendance: {student[1]}% → {labels_map[pred]}")`,
      },
      note: 'The ML model learned the rules from data! In real-world applications, training data is collected from actual student records, making the model far more nuanced than hand-crafted rules.',
    },
    {
      title: 'Understanding a Simple AI Pipeline',
      content: `<p>An AI pipeline is a sequence of data processing steps that transforms raw input into a useful output. Every real-world AI system follows this pattern, no matter how complex it gets.</p>
<h4>The 5 Stages of an AI Pipeline</h4>
<ol>
  <li><strong>Data Collection:</strong> Gathering raw data from sensors, databases, APIs, or user input.</li>
  <li><strong>Data Preprocessing:</strong> Cleaning, normalizing, and transforming data into a usable format.</li>
  <li><strong>Feature Engineering:</strong> Selecting or creating the most informative variables.</li>
  <li><strong>Model Inference/Decision:</strong> Running the AI model to produce a prediction or classification.</li>
  <li><strong>Output & Action:</strong> Presenting results to users or triggering downstream automated actions.</li>
</ol>
<p>Let us now build a complete mini-pipeline that simulates this flow:</p>`,
      code: {
        language: 'python',
        content: `import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression

# ── Stage 1: Simulate Data Collection ────────────────────────
data = {
    "score":       [85, 55, 72, 65, 90, 40, 78, 61, 95, 48],
    "attendance":  [90, 80, 60, 70, 95, 50, 75, 65, 100, 45],
    "assignments": [10,  5,  7,  8,  9,  3,  8,  6,  10,  4],
}
df = pd.DataFrame(data)

# Ground truth labels (1 = Pass)
df["label"] = ((df["score"] >= 60) & (df["attendance"] >= 75)).astype(int)
print("── Dataset Preview ─────────────────────────────")
print(df.to_string(index=False))

# ── Stage 2+3: Build a sklearn Pipeline (preprocess + model) ─
pipeline = Pipeline([
    ("scaler", StandardScaler()),             # Normalize all features
    ("classifier", LogisticRegression()),      # Train classifier
])

X = df[["score", "attendance", "assignments"]].values
y = df["label"].values

pipeline.fit(X, y)
print("\\n── Pipeline Trained! ───────────────────────────")

# ── Stage 4+5: Inference & Output ────────────────────────────
new_input = [[73, 80, 8]]   # A new student
prob  = pipeline.predict_proba(new_input)[0]
pred  = pipeline.predict(new_input)[0]
label = "Pass ✅" if pred == 1 else "Fail ❌"

print(f"\\nNew Student Prediction:")
print(f"  Result      : {label}")
print(f"  Confidence  : {max(prob):.1%}")
print(f"  Pass Prob   : {prob[1]:.1%} | Fail Prob: {prob[0]:.1%}")`,
      },
      note: "This is your first complete AI pipeline! Notice how sklearn's `Pipeline` object chains preprocessing and modeling cleanly — this pattern scales to production systems.",
    },
    {
      title: 'Workflow Automation Fundamentals',
      content: `<p>Workflow automation means using software to perform repetitive tasks without human intervention. When you add AI to automation, you get <strong>intelligent automation</strong> — systems that can make decisions, not just follow steps.</p>
<h4>Components of an Automated Workflow</h4>
<ul>
  <li><strong>Trigger:</strong> An event that starts the workflow (new file, API call, scheduled time).</li>
  <li><strong>Tasks:</strong> Individual operations (fetch data, preprocess, run model, send email).</li>
  <li><strong>Logic / Branching:</strong> Conditions that determine which path to take.</li>
  <li><strong>Actions / Output:</strong> What happens at the end (save result, send notification, call another API).</li>
</ul>
<p>Here is a complete example simulating an automated student feedback workflow:</p>`,
      code: {
        language: 'python',
        content: `import time
from datetime import datetime

class StudentFeedbackWorkflow:
    """A simple automated AI workflow for generating student feedback."""

    def __init__(self, model, scaler=None):
        self.model  = model
        self.scaler = scaler
        self.log    = []

    def _log(self, msg):
        timestamp = datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] {msg}"
        self.log.append(entry)
        print(entry)

    def step_1_receive_data(self, student_data):
        self._log(f"📥 Received data for: {student_data.get('name', 'Unknown')}")
        return student_data

    def step_2_validate(self, data):
        required = ["name", "score", "attendance", "assignments"]
        for field in required:
            if field not in data:
                raise ValueError(f"Missing field: {field}")
        if not (0 <= data["score"] <= 100):
            raise ValueError("Score must be between 0 and 100")
        self._log("✅ Data validation passed")
        return data

    def step_3_predict(self, data):
        features = [[data["score"], data["attendance"], data["assignments"]]]
        pred = self.model.predict(features)[0]
        prob = self.model.predict_proba(features)[0]
        data["prediction"]  = "Pass" if pred == 1 else "Fail"
        data["confidence"]  = round(float(max(prob)) * 100, 1)
        self._log(f"🤖 Prediction: {data['prediction']} ({data['confidence']}% confidence)")
        return data

    def step_4_generate_feedback(self, data):
        if data["prediction"] == "Pass":
            msg = (f"Congratulations {data['name']}! You passed. "
                   f"Keep up the excellent work — your score of {data['score']} "
                   f"and {data['attendance']}% attendance show great dedication!")
        else:
            msg = (f"Hi {data['name']}, based on your current score ({data['score']}) "
                   f"and attendance ({data['attendance']}%), you need improvement. "
                   f"We recommend attending tutoring sessions and completing missing assignments.")
        data["feedback"] = msg
        self._log("📝 Feedback generated")
        return data

    def run(self, student_data):
        self._log("=" * 50)
        self._log(f"🚀 Workflow started for: {student_data.get('name')}")
        try:
            data = self.step_1_receive_data(student_data)
            data = self.step_2_validate(data)
            data = self.step_3_predict(data)
            data = self.step_4_generate_feedback(data)
            self._log("✅ Workflow completed successfully!")
            return {"status": "success", "result": data}
        except Exception as e:
            self._log(f"❌ Workflow failed: {str(e)}")
            return {"status": "error", "message": str(e)}

# ── Run the workflow ──────────────────────────────────────────
workflow = StudentFeedbackWorkflow(model=pipeline)

students_to_process = [
    {"name": "Emma",    "score": 88, "attendance": 92, "assignments": 10},
    {"name": "James",   "score": 45, "attendance": 60, "assignments": 4},
]

print("\\n" + "="*60)
print("          AUTOMATED STUDENT FEEDBACK WORKFLOW")
print("="*60)

for student in students_to_process:
    result = workflow.run(student)
    if result["status"] == "success":
        print(f"\\n💬 FEEDBACK:\\n{result['result']['feedback']}")
    print()`,
      },
      note: 'This workflow pattern — validate → process → decide → act — is the backbone of every production AI system, from Netflix recommendations to fraud detection.',
    },
    {
      title: 'Reflection & Next Steps',
      content: `<p>Congratulations on completing Lab 1! You have built your first AI decision workflow from scratch. Let us consolidate what you have learned.</p>
<h4>Key Takeaways</h4>
<ul>
  <li>AI is a broad field encompassing ML, deep learning, NLP, and computer vision.</li>
  <li>Rule-based systems are explicit but brittle; ML systems learn from data and generalize better.</li>
  <li>Every AI system follows a pipeline: collect → preprocess → model → output → act.</li>
  <li>Workflow automation wraps AI in a reliable, repeatable process.</li>
</ul>
<h4>Concepts to Research Further</h4>
<ul>
  <li><strong>Feature importance:</strong> How does the model decide which inputs matter most?</li>
  <li><strong>Overfitting:</strong> Why might a model perform well on training data but poorly on new data?</li>
  <li><strong>Model versioning:</strong> How do teams manage updates to production models?</li>
</ul>`,
    },
  ],
  exercises: [
    'Modify the rule-based classifier to handle a third category: "At Risk" (students who are borderline). What additional rules would you add?',
    'Add a fourth feature to the ML pipeline (e.g., number of late submissions). Re-train and compare accuracy with the 3-feature version.',
    'Extend the StudentFeedbackWorkflow to include a step that sends an email notification (you can simulate this by printing a formatted email instead of actually sending one).',
    'Research what happens when a model is trained on biased data. Write 3-4 sentences about a real-world example and its consequences.',
  ],
  quiz: [
    {
      question: 'Which of the following best describes Narrow AI (ANI)?',
      options: [
        'AI that can perform any intellectual task a human can do',
        'AI designed and trained for one specific task, like spam detection',
        'AI that is conscious and aware of its own existence',
        'AI that surpasses human intelligence in all domains',
      ],
      answer: 1,
    },
    {
      question: 'In the AI pipeline, what is the purpose of the "preprocessing" stage?',
      options: [
        'Training the machine learning model on raw data',
        'Deploying the model to a production server',
        'Cleaning, normalizing, and transforming raw data into a usable format',
        'Collecting data from users and external sources',
      ],
      answer: 2,
    },
    {
      question: 'What is the primary advantage of Machine Learning over rule-based systems?',
      options: [
        'ML systems are always more accurate than rule-based systems',
        'ML systems do not require any data to function',
        'ML systems learn patterns from data and can generalize to unseen cases without manual rule updates',
        'ML systems are simpler to understand and debug',
      ],
      answer: 2,
    },
    {
      question: 'In an automated workflow, what is a "trigger"?',
      options: [
        'The final output produced by the AI model',
        'An event or condition that starts the workflow execution',
        'A type of machine learning algorithm',
        'A debugging tool for finding errors in the pipeline',
      ],
      answer: 1,
    },
    {
      question: 'What does train_test_split() do in scikit-learn?',
      options: [
        'It trains the model and tests it simultaneously on the same data',
        'It removes duplicates from the dataset',
        'It divides the dataset into separate portions for training and evaluating the model',
        'It splits the code into training functions and testing functions',
      ],
      answer: 2,
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   LAB 2 — Advanced Workflow Automation with API Integration
   ───────────────────────────────────────────────────────────── */
window.LAB_DATA['topic-01_lab2'] = {
  title:      'Advanced Workflow Automation with AI API Integration',
  difficulty: 'Intermediate → Advanced',
  duration:   '75–90 minutes',
  overview:   'Building on Lab 1, this lab dives into advanced workflow automation techniques: consuming real AI APIs (like OpenAI-compatible endpoints), implementing robust error handling and retry logic, building asynchronous pipelines, and monitoring workflow health. You will build a production-grade automated content moderation pipeline.',
  objectives: [
    'Understand REST API architecture for AI services',
    'Implement authentication, rate limiting, and exponential backoff',
    'Build multi-step AI pipelines with branching logic',
    'Add logging, monitoring, and alerting to workflows',
    'Apply best practices for cost optimization in API-based AI systems',
  ],
  steps: [
    {
      title: 'REST APIs and AI Services — Architecture Deep Dive',
      content: `<p>Modern AI capabilities are delivered as cloud APIs. Understanding how to consume them correctly is a critical professional skill. Let us cover the architecture thoroughly before writing any code.</p>
<h4>Key Concepts</h4>
<ul>
  <li><strong>REST (Representational State Transfer):</strong> An architectural style where clients send HTTP requests (GET, POST, PUT, DELETE) to a server URL and receive JSON responses.</li>
  <li><strong>API Key Authentication:</strong> A secret token sent in the request headers to authenticate your identity. Keep these private — never commit them to version control!</li>
  <li><strong>Rate Limiting:</strong> AI APIs restrict how many requests you can make per minute/second to prevent abuse. You must handle <code>429 Too Many Requests</code> errors gracefully.</li>
  <li><strong>Tokens:</strong> Large Language Model (LLM) APIs count usage in tokens (roughly 4 characters = 1 token). You pay per token. Managing token usage is crucial for cost control.</li>
  <li><strong>Latency:</strong> AI API calls are slow (100ms–30s). You must design workflows that handle this asynchronously in production.</li>
</ul>
<h4>Standard Request Headers</h4>`,
      code: {
        language: 'python',
        content: `# Standard headers for most AI APIs
headers = {
    "Content-Type": "application/json",      # We're sending JSON data
    "Authorization": "Bearer YOUR_API_KEY",   # Authentication
    "X-Request-ID": "unique-id-for-tracing", # For debugging (optional but recommended)
}

# Example OpenAI-compatible API call structure
import json

payload = {
    "model": "gpt-3.5-turbo",               # Which model to use
    "messages": [                             # Conversation history
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Summarize this text in 2 sentences."},
    ],
    "max_tokens": 150,                        # Limit response length (cost control)
    "temperature": 0.3,                       # 0 = deterministic, 1 = creative
}

print("Payload size:", len(json.dumps(payload)), "characters")
print("Estimated input tokens:", len(json.dumps(payload)) // 4)`,
      },
      warning: 'Never hardcode API keys directly in source code. Use environment variables (os.environ) or configuration files that are excluded from version control via .gitignore.',
    },
    {
      title: 'Building a Robust API Client with Retry Logic',
      content: `<p>Production API clients need to handle failures gracefully. Networks are unreliable, servers get overloaded, and rate limits are hit. <strong>Exponential backoff</strong> is the industry-standard pattern: retry failed requests, but wait longer with each attempt.</p>`,
      code: {
        language: 'python',
        content: `import time
import random
import logging
from functools import wraps

# ── Configure structured logging ──────────────────────────────
logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt = "%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ai_client")

# ── Custom Exceptions ─────────────────────────────────────────
class RateLimitError(Exception):    pass
class AuthError(Exception):         pass
class ServiceUnavailableError(Exception): pass

# ── Retry Decorator with Exponential Backoff ──────────────────
def retry_with_backoff(max_retries=3, base_delay=1.0, max_delay=60.0, jitter=True):
    """Decorator: retry a function with exponential backoff on failure."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries + 1):
                try:
                    result = func(*args, **kwargs)
                    if attempt > 0:
                        logger.info(f"✅ Succeeded after {attempt} retries")
                    return result

                except RateLimitError as e:
                    if attempt == max_retries:
                        raise
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    if jitter:
                        delay += random.uniform(0, delay * 0.2)   # Add ±20% jitter
                    logger.warning(f"⏳ Rate limited. Waiting {delay:.1f}s before retry {attempt+1}/{max_retries}...")
                    time.sleep(delay)

                except (ServiceUnavailableError, ConnectionError) as e:
                    if attempt == max_retries:
                        raise
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    logger.warning(f"🔄 Service error: {e}. Retry {attempt+1}/{max_retries} in {delay:.1f}s...")
                    time.sleep(delay)

                except AuthError:
                    logger.error("🔐 Authentication failed — not retrying. Check your API key.")
                    raise   # Don't retry auth errors

        return wrapper
    return decorator

# ── Simulated AI API Client ───────────────────────────────────
class AIAPIClient:
    def __init__(self, api_key, model="gpt-3.5-turbo", timeout=30):
        self.api_key   = api_key
        self.model     = model
        self.timeout   = timeout
        self.call_count = 0
        self.token_count = 0

    @retry_with_backoff(max_retries=3, base_delay=2.0)
    def complete(self, prompt, max_tokens=200, temperature=0.3):
        """Send a completion request to the AI API."""
        self.call_count += 1

        # ── SIMULATE API RESPONSES (replace with real requests.post() call) ──
        # In a real implementation, you would use:
        # response = requests.post(
        #     "https://api.openai.com/v1/chat/completions",
        #     headers={"Authorization": f"Bearer {self.api_key}"},
        #     json={"model": self.model, "messages": [...], "max_tokens": max_tokens},
        #     timeout=self.timeout
        # )

        # Simulate occasional rate limit errors for demonstration
        if self.call_count % 5 == 0:
            raise RateLimitError("Rate limit: 60 requests/minute exceeded")

        # Simulate a successful response
        simulated_tokens = len(prompt.split()) * 2
        self.token_count += simulated_tokens

        time.sleep(0.1)  # Simulate network latency
        return {
            "content":    f"[AI Response to: '{prompt[:50]}...']",
            "model":      self.model,
            "usage":      {"prompt_tokens": simulated_tokens, "completion_tokens": max_tokens // 2},
            "call_number": self.call_count,
        }

    def get_stats(self):
        return {"total_calls": self.call_count, "total_tokens": self.token_count}

# ── Test the client ───────────────────────────────────────────
client = AIAPIClient(api_key="sk-demo-key")

prompts = ["Summarize the history of AI", "What is machine learning?", "Explain neural networks"]
for p in prompts:
    try:
        result = client.complete(p, max_tokens=100)
        logger.info(f"✅ Call #{result['call_number']}: {result['content'][:60]}")
    except Exception as e:
        logger.error(f"❌ Failed: {e}")

print(f"\\nAPI Stats: {client.get_stats()}")`,
      },
      note: 'Jitter (random delay variation) is critical in distributed systems to prevent the "thundering herd" problem, where many clients all retry at the exact same time after a rate limit, creating another spike.',
    },
    {
      title: 'Building a Multi-Step Content Moderation Pipeline',
      content: `<p>Real AI workflows chain multiple AI calls and data transformation steps. In this step, we build a production-style content moderation pipeline with three AI stages: <strong>detect language → classify content → generate moderation decision</strong>.</p>`,
      code: {
        language: 'python',
        content: `import json
import hashlib
from dataclasses import dataclass, field, asdict
from typing import Optional
from datetime import datetime

@dataclass
class ContentItem:
    id:         str
    text:       str
    source:     str
    timestamp:  str = field(default_factory=lambda: datetime.now().isoformat())
    language:   Optional[str] = None
    categories: list = field(default_factory=list)
    risk_score: float = 0.0
    decision:   str = "pending"
    reason:     str = ""
    metadata:   dict = field(default_factory=dict)

class ContentModerationPipeline:
    """
    3-stage AI content moderation pipeline:
    Stage 1: Language detection
    Stage 2: Toxicity classification
    Stage 3: Final moderation decision
    """

    def __init__(self, ai_client, rules=None):
        self.client = ai_client
        self.rules  = rules or {}
        self.stats  = {"processed": 0, "approved": 0, "flagged": 0, "rejected": 0}

    def stage_1_detect_language(self, item: ContentItem) -> ContentItem:
        """Detect the language of the content."""
        # In production: call a language detection API
        # Simulate: check for non-ASCII chars
        is_ascii = all(ord(c) < 128 for c in item.text)
        item.language = "en" if is_ascii else "non-en"
        item.metadata["stage_1_done"] = True
        logger.info(f"  [Stage 1] Language detected: {item.language}")
        return item

    def stage_2_classify_content(self, item: ContentItem) -> ContentItem:
        """Classify content for potential violations using AI."""
        # Simulate toxicity scoring based on keyword detection
        high_risk_words = ["spam", "hate", "inappropriate", "offensive", "scam"]
        medium_risk_words = ["warning", "caution", "sensitive"]

        text_lower = item.text.lower()
        risk = 0.0

        for word in high_risk_words:
            if word in text_lower:
                risk += 0.35
                item.categories.append(f"potential_{word}")

        for word in medium_risk_words:
            if word in text_lower:
                risk += 0.15

        item.risk_score = min(risk, 1.0)
        item.metadata["stage_2_done"] = True
        logger.info(f"  [Stage 2] Risk score: {item.risk_score:.2f} | Categories: {item.categories or ['none']}")
        return item

    def stage_3_make_decision(self, item: ContentItem) -> ContentItem:
        """Apply moderation rules and make final decision."""
        if item.risk_score >= 0.7:
            item.decision = "rejected"
            item.reason   = f"High risk score ({item.risk_score:.0%}). Categories: {', '.join(item.categories)}"
        elif item.risk_score >= 0.3:
            item.decision = "flagged"
            item.reason   = f"Moderate risk detected. Manual review required."
        else:
            item.decision = "approved"
            item.reason   = "Content passed all moderation checks."

        self.stats[item.decision] += 1
        item.metadata["stage_3_done"] = True
        logger.info(f"  [Stage 3] Decision: {item.decision.upper()}")
        return item

    def process(self, content_items: list) -> list:
        """Run the full pipeline on a list of content items."""
        results = []
        logger.info(f"🚀 Pipeline started for {len(content_items)} items")

        for raw in content_items:
            item = ContentItem(
                id     = hashlib.md5(raw["text"].encode()).hexdigest()[:8],
                text   = raw["text"],
                source = raw.get("source", "unknown"),
            )
            logger.info(f"\\n▶ Processing item {item.id}: '{item.text[:40]}...'")
            try:
                item = self.stage_1_detect_language(item)
                item = self.stage_2_classify_content(item)
                item = self.stage_3_make_decision(item)
            except Exception as e:
                logger.error(f"  ❌ Pipeline error: {e}")
                item.decision = "error"
                item.reason   = str(e)

            self.stats["processed"] += 1
            results.append(item)

        return results

    def print_summary(self, results):
        print("\\n" + "="*60)
        print("       MODERATION PIPELINE RESULTS SUMMARY")
        print("="*60)
        icons = {"approved": "✅", "flagged": "⚠️ ", "rejected": "❌", "error": "💥", "pending": "⏳"}
        for item in results:
            print(f"  {icons.get(item.decision, '?')} [{item.decision.upper():8s}] {item.text[:45]:<45s}")
            print(f"           Risk: {item.risk_score:.0%} | {item.reason[:60]}")
        print(f"\\n  📊 Stats: {self.stats}")

# ── Run the pipeline ──────────────────────────────────────────
pipeline_content = [
    {"text": "This is a great product! Highly recommend to everyone.", "source": "review"},
    {"text": "Warning: This contains sensitive information about the topic.", "source": "post"},
    {"text": "Buy now! Don't miss this spam offer — click here for scam!", "source": "email"},
    {"text": "Normal educational content about machine learning concepts.", "source": "forum"},
    {"text": "I find this offensive and full of hate — completely inappropriate.", "source": "comment"},
]

pipe  = ContentModerationPipeline(ai_client=client)
items = pipe.process(pipeline_content)
pipe.print_summary(items)`,
      },
    },
    {
      title: 'Parallel Processing and Batch Optimization',
      content: `<p>Processing items one-by-one is too slow for production workloads. <strong>Concurrent processing</strong> allows multiple items to be handled simultaneously, dramatically reducing total processing time.</p>`,
      code: {
        language: 'python',
        content: `import concurrent.futures
import time

def process_single_item(item_data):
    """Process one item — designed to run in parallel."""
    time.sleep(0.1)  # Simulate API latency
    return {
        "id":       item_data["id"],
        "text":     item_data["text"][:30],
        "decision": "approved" if len(item_data["text"]) > 20 else "flagged",
    }

# ── Sequential (slow) ─────────────────────────────────────────
batch = [{"id": i, "text": f"Content item number {i} for processing"} for i in range(20)]

t0 = time.time()
sequential_results = [process_single_item(item) for item in batch]
sequential_time = time.time() - t0
print(f"Sequential: {sequential_time:.2f}s for {len(batch)} items")

# ── Concurrent with ThreadPoolExecutor (fast) ──────────────────
t0 = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    # Map: apply function to each item in parallel
    concurrent_results = list(executor.map(process_single_item, batch))
concurrent_time = time.time() - t0
print(f"Concurrent: {concurrent_time:.2f}s for {len(batch)} items")
print(f"Speedup:    {sequential_time/concurrent_time:.1f}x faster! 🚀")

# ── Batch Processing: chunk large lists ───────────────────────
def chunked(lst, n):
    """Split list into chunks of size n."""
    for i in range(0, len(lst), n):
        yield lst[i:i+n]

large_batch = [{"id": i, "text": f"Item {i}"} for i in range(100)]
BATCH_SIZE  = 10
all_results = []

print(f"\\nBatch processing {len(large_batch)} items in batches of {BATCH_SIZE}:")
for batch_num, chunk in enumerate(chunked(large_batch, BATCH_SIZE)):
    with concurrent.futures.ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
        results = list(executor.map(process_single_item, chunk))
        all_results.extend(results)
    print(f"  ✅ Batch {batch_num + 1}: processed {len(chunk)} items ({len(all_results)} total)")

print(f"\\nAll done! Processed {len(all_results)} items.")`,
      },
      note: 'Use ThreadPoolExecutor for I/O-bound tasks (like API calls) and ProcessPoolExecutor for CPU-bound tasks (like image processing). The difference matters for performance.',
    },
    {
      title: 'Monitoring, Logging, and Alerting',
      content: `<p>A pipeline without monitoring is a black box. Production systems must track health metrics, detect anomalies, and alert operators when things go wrong.</p>`,
      code: {
        language: 'python',
        content: `import time
from collections import deque
from statistics import mean, stdev

class PipelineMonitor:
    """Real-time monitoring for AI workflow pipelines."""

    def __init__(self, alert_threshold=0.2, window_size=50):
        self.alert_threshold  = alert_threshold  # Error rate that triggers alert
        self.window_size      = window_size       # Rolling window for metrics
        self.latencies        = deque(maxlen=window_size)
        self.errors           = deque(maxlen=window_size)
        self.costs            = deque(maxlen=window_size)
        self.total_processed  = 0
        self.start_time       = time.time()

    def record(self, latency_ms: float, success: bool, cost_usd: float = 0.0):
        """Record a single pipeline execution result."""
        self.latencies.append(latency_ms)
        self.errors.append(0 if success else 1)
        self.costs.append(cost_usd)
        self.total_processed += 1

        # Check alert conditions
        if len(self.errors) >= 10:
            error_rate = sum(self.errors) / len(self.errors)
            if error_rate > self.alert_threshold:
                self._send_alert(f"HIGH ERROR RATE: {error_rate:.0%} of last {len(self.errors)} requests failed!")

    def _send_alert(self, message):
        """In production: send to PagerDuty, Slack, email, etc."""
        print(f"\n  🚨 ALERT: {message}")

    def get_dashboard(self):
        """Return current health metrics."""
        if not self.latencies:
            return {"status": "no data"}

        uptime = time.time() - self.start_time
        return {
            "status":            "healthy" if sum(self.errors)/max(len(self.errors),1) < 0.1 else "degraded",
            "uptime_seconds":    round(uptime, 1),
            "total_processed":   self.total_processed,
            "throughput_rps":    round(self.total_processed / max(uptime, 1), 2),
            "latency_p50_ms":    round(sorted(self.latencies)[len(self.latencies)//2], 1),
            "latency_p99_ms":    round(sorted(self.latencies)[int(len(self.latencies)*0.99)], 1) if len(self.latencies) >= 100 else "N/A (need 100+ samples)",
            "error_rate":        f"{sum(self.errors)/max(len(self.errors),1):.1%}",
            "total_cost_usd":    f"$\\{sum(self.costs):.4f\\}",
        }

    def print_dashboard(self):
        d = self.get_dashboard()
        print("\\n" + "─"*50)
        print("  📊 PIPELINE HEALTH DASHBOARD")
        print("─"*50)
        for k, v in d.items():
            key = k.replace("_", " ").title()
            print(f"  {key:<25s}: {v}")
        print("─"*50)

# ── Simulate a running pipeline with monitoring ───────────────
import random
monitor = PipelineMonitor(alert_threshold=0.25, window_size=20)

print("Simulating 30 pipeline executions...")
for i in range(30):
    start    = time.time()
    time.sleep(random.uniform(0.01, 0.05))   # Simulate variable latency
    latency  = (time.time() - start) * 1000
    success  = random.random() > 0.15         # 85% success rate
    cost     = random.uniform(0.0001, 0.003)  # Per-call cost

    monitor.record(latency_ms=latency, success=success, cost_usd=cost)

monitor.print_dashboard()`,
      },
    },
    {
      title: 'Cost Optimization and Best Practices',
      content: `<p>AI APIs charge per token — costs can spiral out of control without discipline. Here are the industry best practices for keeping costs manageable at scale.</p>
<h4>Cost Optimization Strategies</h4>
<ol>
  <li><strong>Caching:</strong> Store AI responses for identical or semantically similar inputs. Cache hits cost $0.</li>
  <li><strong>Prompt compression:</strong> Shorten prompts — every token saved is money saved. Remove unnecessary examples.</li>
  <li><strong>Model tiering:</strong> Use smaller, cheaper models (e.g., GPT-3.5) for simple tasks; reserve powerful models for complex reasoning.</li>
  <li><strong>Batching:</strong> Some APIs allow multiple prompts per request, reducing per-call overhead.</li>
  <li><strong>max_tokens guardrail:</strong> Always set a reasonable max_tokens limit to cap runaway responses.</li>
</ol>`,
      code: {
        language: 'python',
        content: `import hashlib
import functools

# ── Simple LRU Cache for API Responses ───────────────────────
class ResponseCache:
    def __init__(self, max_size=1000):
        self._cache     = {}
        self._max_size  = max_size
        self._hits      = 0
        self._misses    = 0

    def _key(self, prompt, model, max_tokens):
        raw = f"{model}:{max_tokens}:{prompt}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def get(self, prompt, model, max_tokens):
        key = self._key(prompt, model, max_tokens)
        if key in self._cache:
            self._hits += 1
            return self._cache[key]
        self._misses += 1
        return None

    def set(self, prompt, model, max_tokens, response):
        key = self._key(prompt, model, max_tokens)
        if len(self._cache) >= self._max_size:
            # Evict oldest entry (simplified — use OrderedDict in production)
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]
        self._cache[key] = response

    @property
    def hit_rate(self):
        total = self._hits + self._misses
        return self._hits / total if total > 0 else 0

# ── Cached AI Client ─────────────────────────────────────────
class CachedAIClient:
    def __init__(self, base_client, cache_size=500):
        self._client   = base_client
        self._cache    = ResponseCache(max_size=cache_size)
        self._saved_cost = 0.0
        self.COST_PER_1K_TOKENS = 0.002  # $/1K tokens (approx GPT-3.5)

    def complete(self, prompt, model="gpt-3.5-turbo", max_tokens=200):
        # Try cache first
        cached = self._cache.get(prompt, model, max_tokens)
        if cached:
            estimated_cost = (len(prompt.split()) * 2 / 1000) * self.COST_PER_1K_TOKENS
            self._saved_cost += estimated_cost
            print(f"  💾 CACHE HIT — saved ~$\\{estimated_cost:.5f\\}")
            return cached

        # Cache miss → call actual API
        response = self._client.complete(prompt, max_tokens=max_tokens)
        self._cache.set(prompt, model, max_tokens, response)
        return response

    def print_stats(self):
        print(f"\\n  📦 Cache Stats:")
        print(f"     Hit rate:   {self._cache.hit_rate:.0%}")
        print(f"     Total hits: {self._cache._hits}")
        print(f"     Misses:     {self._cache._misses}")
        print(f"     Cost saved: $\\{self._saved_cost:.5f\\}")

# ── Test cached client ────────────────────────────────────────
cached_client = CachedAIClient(client)

queries = [
    "What is machine learning?",
    "What is machine learning?",   # Duplicate — should hit cache
    "Explain neural networks",
    "What is machine learning?",   # Third time — cache hit again
    "Define deep learning",
]

print("Testing cached AI client:")
for q in queries:
    resp = cached_client.complete(q, max_tokens=100)
    print(f"  Q: '{q[:40]}...' ✓")

cached_client.print_stats()`,
      },
    },
  ],
  exercises: [
    'Implement a more sophisticated cache using Python\'s `functools.lru_cache` or `cachetools.TTLCache` that automatically expires cached responses after 1 hour.',
    'Add a "dead letter queue" to the content moderation pipeline: items that fail after all retries should be saved to a separate list for manual review instead of being dropped.',
    'Extend the PipelineMonitor to calculate and log the 95th percentile (P95) latency, and alert if it exceeds 500ms.',
    'Design a model tiering strategy for the content moderation pipeline: short texts (< 50 words) use a fast classifier, long texts use a powerful LLM. Implement this branching logic.',
  ],
  quiz: [
    {
      question: 'What is the purpose of exponential backoff in retry logic?',
      options: [
        'To make the code run faster on each retry attempt',
        'To wait progressively longer between retries, reducing load on an overloaded service',
        'To exponentially increase the number of API calls made',
        'To compress the data sent to the API to reduce bandwidth',
      ],
      answer: 1,
    },
    {
      question: 'Why should API keys never be hardcoded in source code?',
      options: [
        'Because API keys are too long to type manually',
        'Because hardcoded keys cannot be changed without redeploying',
        'Because source code is often stored in version control systems that may be public, exposing the key to everyone',
        'Because API keys only work when read from environment variables',
      ],
      answer: 2,
    },
    {
      question: 'When should you use ProcessPoolExecutor instead of ThreadPoolExecutor?',
      options: [
        'For I/O-bound tasks like HTTP requests and database queries',
        'For CPU-bound tasks like image processing or numerical computation',
        'When you have fewer than 5 workers',
        'When using Python 2.x compatibility mode',
      ],
      answer: 1,
    },
    {
      question: 'What is "model tiering" in the context of AI cost optimization?',
      options: [
        'Using multiple layers of neural networks',
        'Routing simpler tasks to cheaper, smaller models and complex tasks to more powerful, expensive models',
        'Storing model weights in multiple locations for redundancy',
        'Training the same model at different resolutions',
      ],
      answer: 1,
    },
    {
      question: 'What does P99 latency mean in pipeline monitoring?',
      options: [
        '99% of requests are rejected by the server',
        'The average latency across all requests',
        '99% of all requests complete within this time; only 1% take longer',
        'The pipeline has 99% uptime',
      ],
      answer: 2,
    },
  ],
};
