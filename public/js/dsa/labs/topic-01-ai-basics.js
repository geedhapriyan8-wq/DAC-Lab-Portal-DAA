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
  title:      'AI in Action: Unstructured Data Extraction & Synthesis',
  difficulty: 'Simple → Intermediate',
  duration:   '45–60 minutes',
  overview:   'Real-world business data is over 80% unstructured: emails, support tickets, incident postmortems, and customer feedback. In this hands-on lab, you experience AI in action by building an end-to-end unstructured data extraction and synthesis engine in Python. You will ingest raw, messy corpora, extract key entities and technical signals (error codes, severities, monetary values), synthesize structured analytical schemas (JSON and DataFrames), and verify extraction precision.',
  objectives: [
    'Understand unstructured vs. structured data challenges in enterprise AI',
    'Ingest raw unstructured text logs and customer communication records',
    'Implement automated entity extraction, regex pattern parsers, and urgency scoring',
    'Synthesize messy unstructured text into structured analytical schemas (JSON & Pandas)',
    'Build an end-to-end data pipeline that routes high-priority incidents and computes synthesis metrics',
  ],
  steps: [
    {
      title: 'Environment Setup & Unstructured Data Ingestion',
      content: `<p>Unstructured data lacks a predefined relational data model. To extract actionable business intelligence, we must ingest raw text, clean noise, and prepare it for analytical synthesis.</p>
<h4>🎯 Practical Task</h4>
<p>Set up your VS Code workspace, import standard extraction libraries (<code>re</code>, <code>json</code>, <code>pandas</code>), and ingest a batch of raw enterprise customer incident logs.</p>`,
      code: {
        language: 'python',
        content: `import json
import re
import pandas as pd
from datetime import datetime

# ── Raw Unstructured Multi-Channel Incident Stream ──────────────────
raw_incident_corpus = [
    {
        "log_id": "RAW-901",
        "channel": "customer_support_email",
        "raw_text": "CRITICAL OUTAGE: Database connection pool exhausted on cluster db-prod-04 at 14:22 UTC. Over 820 active checkout sessions failed with HTTP 500 error. Revenue impact estimated at $14,500. Escalate to sre-leads@company.io immediately!"
    },
    {
        "log_id": "RAW-902",
        "channel": "zendesk_ticket",
        "raw_text": "Hello, our team noticed minor visual latency (approx 280ms) when rendering the new dark mode navigation bar on iOS Safari. Non-blocking UI issue. Reporter: design-qa@partner.com. Priority: Low."
    },
    {
        "log_id": "RAW-903",
        "channel": "slack_webhook",
        "raw_text": "URGENT Security alert: Suspicious API token usage detected from IP 198.51.100.42 making 4,200 requests/min against /api/v2/auth. Potential credential stuffing attack. Contact security-ops@corp.net. Severity: High."
    },
    {
        "log_id": "RAW-904",
        "channel": "billing_portal",
        "raw_text": "Invoice discrepancy noticed on invoice INV-2026-881 for compute cluster usage. Charged $3,250.00 instead of agreed tier discount rate. Please review with accounts-payable@finclient.org. Priority: Medium."
    }
]

print(f"📥 Successfully ingested {len(raw_incident_corpus)} unstructured logs.")
print("Sample raw record snippet:")
print("  " + raw_incident_corpus[0]["raw_text"][:149])`
      },
      note: 'Notice how each log comes from a different channel and uses completely free-form text. Traditional SQL cannot query this directly.',
    },
    {
      title: 'Building Information Extraction & Entity Parsers',
      content: `<p>To synthesize structured intelligence, we extract specific entities: <strong>Severity Level</strong>, <strong>Incident Category</strong>, <strong>Technical Identifiers</strong> (HTTP codes, IPs, Invoices), and <strong>Contact Emails</strong>.</p>
<h4>🎯 Practical Task</h4>
<p>Implement extraction functions using regular expressions and keyword heuristic matchers to extract structured fields from each raw text string.</p>`,
      code: {
        language: 'python',
        content: `def extract_entities(text):
    """Extract key structured entities from unstructured text."""
    # 1. Email extraction via regex
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    emails = re.findall(email_pattern, text)
    
    # 2. Financial / Dollar amounts
    currency_pattern = r'\\$[0-9]+(?:,[0-9]{3})*(?:\\.[0-9]{2})?'
    amounts = re.findall(currency_pattern, text)
    
    # 3. HTTP Status Codes or IP Addresses
    http_codes = re.findall(r'HTTP\\s*([2-5][0-9]{2})', text, re.IGNORECASE)
    ip_addrs = re.findall(r'\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', text)
    
    # 4. Severity classification heuristics
    text_lower = text.lower()
    if any(k in text_lower for k in ["critical", "outage", "credential stuffing"]):
        severity = "CRITICAL"
        urgency_score = 100
    elif any(k in text_lower for k in ["urgent", "security alert", "high"]):
        severity = "HIGH"
        urgency_score = 75
    elif any(k in text_lower for k in ["discrepancy", "medium"]):
        severity = "MEDIUM"
        urgency_score = 50
    else:
        severity = "LOW"
        urgency_score = 25
        
    return {
        "severity": severity,
        "urgency_score": urgency_score,
        "contact_emails": emails,
        "dollar_impact": amounts[0] if amounts else "N/A",
        "technical_signals": {
            "http_codes": http_codes,
            "ips": ip_addrs
        }
    }

# Test extractor on first record
sample_extracted = extract_entities(raw_incident_corpus[0]["raw_text"])
print("🔎 Extracted Entities for RAW-901:")
print(json.dumps(sample_extracted, indent=2))`
      },
      note: 'Regular expressions combined with heuristic extractors form the foundation of hybrid AI text extraction pipelines.',
    },
    {
      title: 'Synthesizing Unstructured Text into Structured Schemas',
      content: `<p><strong>Synthesis</strong> is the transformation of disparate extracted attributes into a unified, queryable schema. This bridges raw communications with downstream data warehouses.</p>
<h4>🎯 Practical Task</h4>
<p>Execute the extraction across all records, synthesize a unified relational tabular DataFrame, and calculate aggregate executive metrics.</p>`,
      code: {
        language: 'python',
        content: `synthesized_records = []

for log in raw_incident_corpus:
    extracted = extract_entities(log["raw_text"])
    synthesized_records.append({
        "log_id": log["log_id"],
        "channel": log["channel"],
        "severity": extracted["severity"],
        "urgency_score": extracted["urgency_score"],
        "contact": extracted["contact_emails"][0] if extracted["contact_emails"] else "None",
        "dollar_impact": extracted["dollar_impact"],
        "has_technical_signals": bool(extracted["technical_signals"]["http_codes"] or extracted["technical_signals"]["ips"]),
        "summary": log["raw_text"][:60] + "..."
    })

# Convert synthesized data to a DataFrame
df_synthesized = pd.DataFrame(synthesized_records)

print("📊 SYNTHESIZED INCIDENT DATABASE:")
print(df_synthesized[["log_id", "severity", "urgency_score", "contact", "dollar_impact"]].to_string(index=False))

print("\\n📈 EXECUTIVE SYNTHESIS SUMMARY:")
print(f"Total Ingested Events : {len(df_synthesized)}")
print(f"Critical / High Rate  : {(df_synthesized['urgency_score'] >= 75).mean():.1%}")
print(f"Primary Severity Breakdown:\\n{df_synthesized['severity'].value_counts().to_string()}")`
      },
      note: 'The unstructured text is now a clean relational table suitable for SQL querying, BI dashboards, or automated routing.',
    },
    {
      title: 'Building the End-to-End Extraction & Synthesis Pipeline',
      content: `<p>Now encapsulate the ingestion, extraction, and synthesis into a modular, production-ready class with validation and error-handling.</p>
<h4>🎯 Practical Task</h4>
<p>Instantiate the pipeline class, process a new simulated incoming event, and verify that critical events trigger priority alert dispatching.</p>`,
      code: {
        language: 'python',
        content: `class IncidentSynthesisEngine:
    def __init__(self, high_priority_threshold=75):
        self.threshold = high_priority_threshold
        self.processed_records = []

    def process_raw_stream(self, raw_records):
        for rec in raw_records:
            extracted = extract_entities(rec["raw_text"])
            is_priority = extracted["urgency_score"] >= self.threshold
            
            structured_doc = {
                "id": rec["log_id"],
                "channel": rec["channel"],
                "severity": extracted["severity"],
                "urgency_score": extracted["urgency_score"],
                "priority_route": "ESCALATION_QUEUE" if is_priority else "STANDARD_BACKLOG",
                "extracted_entities": extracted,
                "timestamp": datetime.utcnow().isoformat()
            }
            self.processed_records.append(structured_doc)
        return self.processed_records

engine = IncidentSynthesisEngine(high_priority_threshold=75)
results = engine.process_raw_stream(raw_incident_corpus)

# Verify automated routing
escalated = [r["id"] for r in results if r["priority_route"] == "ESCALATION_QUEUE"]
print(f"🚀 Pipeline executed! {len(results)} records processed.")
print(f"🚨 Escalated Incidents routed to on-call team: {escalated}")`
      },
      note: 'Notice how automated routing occurs in sub-milliseconds without requiring manual reading by human support staff.',
    },
    {
      title: 'Practical Verification & Quality Auditing',
      content: `<p>In production extraction pipelines, automated validation checks guarantee that extraction precision and schema integrity remain intact.</p>
<h4>🎯 Practical Task</h4>
<p>Run automated assertions to verify that all records have valid severity grades, non-null IDs, and consistent score ranges.</p>`,
      code: {
        language: 'python',
        content: `# ── Verification Assertions ──────────────────────────────────
assert len(results) == 4, "Validation Error: Record count mismatch"
for rec in results:
    assert rec["severity"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"], f"Invalid severity: {rec['severity']}"
    assert 0 <= rec["urgency_score"] <= 100, f"Urgency score out of range: {rec['urgency_score']}"
    assert "priority_route" in rec, "Missing routing field in schema"

print("✅ ALL EXTRACTION & SYNTHESIS ASSERTIONS PASSED!")
print("✓ Schema validation: 100% compliant")
print("✓ Entity extraction completeness: verified")
print("✓ Automated dispatch readiness: confirmed")`
      },
      note: 'Always include assertion checks in your Python workflows to ensure that noisy inputs do not break downstream consumers.',
    },
  ],
  exercises: [
    'Add an automated phone number extractor to the regex parsing function and test it against international formats (e.g., +1-555-0192).',
    'Integrate sentiment analysis scoring into the synthesis engine to assign negative polarity to dissatisfied customer logs.',
    'Extend the schema to output a serialized JSON report file on disk (synthesized_incidents.json).',
    'Simulate a malicious log injection containing HTML tags and write an input sanitization function to strip unsafe characters.',
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
    },
    {
      question: 'In the AI pipeline, what is the purpose of the "preprocessing" stage?',
      options: [
        'Training the machine learning model on raw data',
        'Deploying the model to a production server',
        'Cleaning, normalizing, and transforming raw data into a usable format',
        'Collecting data from users and external sources',
      ],
    },
    {
      question: 'What is the primary advantage of Machine Learning over rule-based systems?',
      options: [
        'ML systems are always more accurate than rule-based systems',
        'ML systems do not require any data to function',
        'ML systems learn patterns from data and can generalize to unseen cases without manual rule updates',
        'ML systems are simpler to understand and debug',
      ],
    },
    {
      question: 'In an automated workflow, what is a "trigger"?',
      options: [
        'The final output produced by the AI model',
        'An event or condition that starts the workflow execution',
        'A type of machine learning algorithm',
        'A debugging tool for finding errors in the pipeline',
      ],
    },
    {
      question: 'What does train_test_split() do in scikit-learn?',
      options: [
        'It trains the model and tests it simultaneously on the same data',
        'It removes duplicates from the dataset',
        'It divides the dataset into separate portions for training and evaluating the model',
        'It splits the code into training functions and testing functions',
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   LAB 2 — Automating Workflows: Connecting Applications to Trigger Intelligent Actions
   ───────────────────────────────────────────────────────────── */
window.LAB_DATA['topic-01_lab2'] = {
  title:      'Automating Workflows: Connecting Applications to Trigger Intelligent Actions',
  difficulty: 'Intermediate → Advanced',
  duration:   '75–90 minutes',
  overview:   'Modern enterprise AI delivers tangible business value by automating workflows: listening to incoming events, evaluating intent, making intelligent branching decisions, and dispatching actions across databases, ticketing systems, and alerting webhooks. In this hands-on lab, you construct an autonomous event-driven workflow engine in Python that connects simulated external web services, database queues, and automated actions based on AI decisions.',
  objectives: [
    'Design an event-driven trigger architecture connecting external applications',
    'Build an intelligent intent classification and urgency evaluation engine',
    'Connect downstream application sinks: simulated database queues and webhooks',
    'Implement exponential backoff, rate limit handling, and fault recovery',
    'Execute an end-to-end event workflow with persistent state tracking and audit logging',
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
    },
    {
      question: 'Why should API keys never be hardcoded in source code?',
      options: [
        'Because API keys are too long to type manually',
        'Because hardcoded keys cannot be changed without redeploying',
        'Because source code is often stored in version control systems that may be public, exposing the key to everyone',
        'Because API keys only work when read from environment variables',
      ],
    },
    {
      question: 'When should you use ProcessPoolExecutor instead of ThreadPoolExecutor?',
      options: [
        'For I/O-bound tasks like HTTP requests and database queries',
        'For CPU-bound tasks like image processing or numerical computation',
        'When you have fewer than 5 workers',
        'When using Python 2.x compatibility mode',
      ],
    },
    {
      question: 'What is "model tiering" in the context of AI cost optimization?',
      options: [
        'Using multiple layers of neural networks',
        'Routing simpler tasks to cheaper, smaller models and complex tasks to more powerful, expensive models',
        'Storing model weights in multiple locations for redundancy',
        'Training the same model at different resolutions',
      ],
    },
    {
      question: 'What does P99 latency mean in pipeline monitoring?',
      options: [
        '99% of requests are rejected by the server',
        'The average latency across all requests',
        '99% of all requests complete within this time; only 1% take longer',
        'The pipeline has 99% uptime',
      ],
    },
  ],
};
