/* ============================================================
   Topic 08 — Natural Language Processing (NLP) (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-08_lab1'] = {
  title:      'Sentiment Analysis with Transformers',
  difficulty: 'Hands-on → Intermediate',
  duration:   '75–90 minutes',
  overview:   'In this practical hands-on lab, you will leverage pre-trained Transformer models (DistilBERT / RoBERTa) to perform production-grade Sentiment Analysis using the Hugging Face Pipeline API in Python. You will ingest the real-world unstructured customer feedback dataset (datasets/unstructured_customer_feedback.json), run batched inference, extract and interpret softmax confidence scores, handle borderline neutral sentiments, and build an automated feedback categorization pipeline.',
  objectives: [
    'Load and profile unstructured customer feedback records from datasets/unstructured_customer_feedback.json',
    'Master the Hugging Face transformers pipeline API for sentiment classification',
    'Batch process variable-length text records with dynamic padding and truncation',
    'Extract class labels and Softmax confidence probabilities',
    'Implement confidence gating to isolate ambiguous or neutral sentiments',
    'Export structured sentiment telemetry and summary dashboards (JSON/CSV)',
  ],
  steps: [
    {
      title: 'Step 1: Ingest & Inspect Unstructured Customer Feedback',
      content: `<p>We will load the customer feedback records from <code>datasets/unstructured_customer_feedback.json</code>. Each record contains raw, multi-sentence text with varying length, colloquialisms, and emotional polarity.</p>`,
      code: {
        language: 'python',
        content: `import json
import os
import pandas as pd

feedback_path = "datasets/unstructured_customer_feedback.json"
with open(feedback_path, "r") as f:
    records = json.load(f)

print(f"Loaded {len(records)} customer feedback records.")
df = pd.DataFrame(records)
print("\\nFirst 3 feedback samples:")
for _, row in df.head(3).iterrows():
    print(f"[{row['id']}] ({row['customer_id']}) -> \\"{row['feedback_text'][:75]}...\\"")`,
      },
    },
    {
      title: 'Step 2: Initialize Hugging Face Transformer Pipeline',
      content: `<p>The Hugging Face <code>pipeline("sentiment-analysis")</code> encapsulates tokenizer preprocessing, deep bidirectional self-attention forward passes, and Softmax probability mapping.</p>`,
      code: {
        language: 'python',
        content: `from transformers import pipeline

# Load pre-trained DistilBERT fine-tuned on Stanford Sentiment Treebank (SST-2)
classifier = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english",
    device=-1  # Use 0 for GPU, -1 for CPU
)

print("Transformer pipeline initialized successfully.")
sample_text = "The platform is incredibly fast and intuitive, but the billing page is confusing."
sample_pred = classifier(sample_text)[0]
print(f"Sample Text: '{sample_text}'")
print(f"Prediction: {sample_pred['label']} (Confidence: {sample_pred['score']:.4f})")`,
      },
      note: 'The first time you execute this pipeline, Hugging Face downloads the pre-trained weights (~268MB) and caches them in ~/.cache/huggingface.',
    },
    {
      title: 'Step 3: Batched Inference & Confidence Gating',
      content: `<p>In production, reviews with low confidence (e.g. between 0.50 and 0.65) are often neutral or mixed. We implement a Confidence Gate: predictions with score &lt; 0.70 are flagged as <code>NEUTRAL / AMBIGUOUS</code> for human review.</p>`,
      code: {
        language: 'python',
        content: `texts = [r["feedback_text"] for r in records]

# Run batched inference
print(f"Running inference on batch of {len(texts)} feedback items...")
batch_results = classifier(texts, truncation=True, max_length=128)

processed_data = []
CONFIDENCE_THRESHOLD = 0.70

for i, (rec, res) in enumerate(zip(records, batch_results)):
    raw_label = res["label"]
    confidence = res["score"]
    
    # Apply gating rule
    if confidence < CONFIDENCE_THRESHOLD:
        effective_label = "NEUTRAL / MIXED ⚖️"
    elif raw_label == "POSITIVE":
        effective_label = "POSITIVE ✅"
    else:
        effective_label = "NEGATIVE ❌"
        
    processed_data.append({
        "id": rec["id"],
        "customer": rec["customer_id"],
        "text": rec["feedback_text"],
        "raw_label": raw_label,
        "confidence": round(confidence, 4),
        "sentiment": effective_label
    })

print("Batch inference completed.")`,
      },
    },
    {
      title: 'Step 4: Sentiment Analytics & Export',
      content: `<p>Aggregate customer sentiment distribution and write structured findings to <code>sentiment_report.json</code>.</p>`,
      code: {
        language: 'python',
        content: `df_results = pd.DataFrame(processed_data)
print("=" * 55)
print("       CUSTOMER SENTIMENT DISTRIBUTION REPORT        ")
print("=" * 55)
print(df_results['sentiment'].value_counts())
print("-" * 55)
print(f"Average Model Confidence: {df_results['confidence'].mean():.2%}")
print("=" * 55)

# Identify top negative complaints
negatives = df_results[df_results['sentiment'] == "NEGATIVE ❌"]
print(f"\\nTop High-Confidence Negative Alerts ({len(negatives)} found):")
for _, neg in negatives.head(3).iterrows():
    print(f"  • [{neg['customer']}] (Conf: {neg['confidence']:.2%}): {neg['text']}")

with open("sentiment_report.json", "w") as f:
    json.dump(processed_data, f, indent=2)
print("\\nTelemetry successfully exported to sentiment_report.json.")`,
      },
    },
  ],
  exercises: [
    'Test with a multi-class sentiment model: cardiffnlp/twitter-roberta-base-sentiment-latest (Negative, Neutral, Positive).',
    'Add an extraction step to isolate mentioned product features (e.g. "billing", "speed", "API") using spaCy noun chunks.',
    'Plot a histogram of confidence scores using Matplotlib to visualize prediction certainty.',
  ],
  quiz: [
    {
      question: 'What is the primary role of the Hugging Face `pipeline` API in text sentiment analysis?',
      options: [
        'It compiles Python code to GPU binary',
        'It unifies tokenization, model forward pass, and probability post-processing into a streamlined, high-level interface',
        'It directly translates sentences between languages',
        'It creates database tables',
      ],
    },
    {
      question: 'Why do Transformer-based models (like DistilBERT or RoBERTa) vastly outperform classical Bag-of-Words for sentiment analysis?',
      options: [
        'They require zero GPU memory',
        'They only work on single-word inputs',
        'They use self-attention to capture bidirectional context, word order, and nuanced negations (e.g., "not bad at all")',
        'They eliminate all floating-point numbers',
      ],
    },
    {
      question: 'When evaluating model predictions on real customer feedback, what does the output `score` represent in the pipeline result `{\'label\': \'POSITIVE\', \'score\': 0.98}`?',
      options: [
        'The character length of the sentence',
        'The execution time in seconds',
        'The model\'s Softmax confidence probability assigned to the predicted sentiment class',
        'The database primary key ID',
      ],
    },
    {
      question: 'What is a common failure mode when running sentiment analysis with a binary (POSITIVE/NEGATIVE) model on neutral customer feedback?',
      options: [
        'The Python interpreter crashes immediately',
        'The model is forced to pick either POSITIVE or NEGATIVE with borderline confidence because it lacks a neutral category',
        'It deletes the input text',
        'It inverts the word order',
      ],
    },
  ],
};

window.LAB_DATA['topic-08_lab2'] = {
  title:      'Building a Simple RAG Application',
  difficulty: 'Hands-on → Advanced',
  duration:   '90–120 minutes',
  overview:   'In this advanced hands-on lab, you will build a complete Retrieval-Augmented Generation (RAG) system using LangChain, sentence embeddings, and a Vector Database. You will ingest real corporate knowledge base articles (datasets/knowledge_base_articles.json), chunk them, generate dense semantic vector embeddings, index them in a vector store, perform cosine similarity retrieval, and synthesize factually grounded responses with citations.',
  objectives: [
    'Understand RAG architecture: Ingestion, Chunking, Embeddings, Retrieval, and Generation',
    'Ingest and chunk knowledge base articles from datasets/knowledge_base_articles.json',
    'Generate dense vector embeddings using sentence-transformers',
    'Build an in-memory vector database with Cosine Similarity search',
    'Construct an augmented prompt template injecting retrieved top-k context',
    'Evaluate retrieval precision and inspect cited source documents',
  ],
  steps: [
    {
      title: 'Step 1: Ingest Corporate Knowledge Base',
      content: `<p>LLMs hallucinate or provide outdated information when queried about proprietary corporate documents. We ingest <code>datasets/knowledge_base_articles.json</code> containing verified policy and troubleshooting documentation.</p>`,
      code: {
        language: 'python',
        content: `import json
import numpy as np
from numpy.linalg import norm

# Load knowledge base articles
with open("datasets/knowledge_base_articles.json", "r") as f:
    kb_data = json.load(f)

print(f"Loaded {len(kb_data)} Knowledge Base articles.")
for item in kb_data[:3]:
    print(f"• [{item['id']}] {item['title']} ({item['category']})")`,
      },
    },
    {
      title: 'Step 2: Document Chunking Strategy',
      content: `<p>Large articles must be split into manageable semantic chunks (e.g. 200&ndash;400 characters with 50-character overlap) so retrieval retrieves precise passages rather than entire books.</p>`,
      code: {
        language: 'python',
        content: `def chunk_document(doc, chunk_size=350, chunk_overlap=50):
    text = doc["content"]
    chunks = []
    start = 0
    idx = 1
    
    while start < len(text):
        end = start + chunk_size
        chunk_text = text[start:end]
        chunks.append({
            "chunk_id": f"{doc['id']}_c{idx}",
            "article_id": doc["id"],
            "title": doc["title"],
            "category": doc["category"],
            "text": chunk_text
        })
        start += (chunk_size - chunk_overlap)
        idx += 1
        
    return chunks

all_chunks = []
for doc in kb_data:
    all_chunks.extend(chunk_document(doc))

print(f"Generated {len(all_chunks)} semantic chunks from {len(kb_data)} articles.")
print(f"Sample chunk: '{all_chunks[0]['text'][:80]}...'")`,
      },
    },
    {
      title: 'Step 3: Dense Vector Embeddings & Vector Store',
      content: `<p>We compute dense vector embeddings using a sentence-transformer model (e.g. <code>all-MiniLM-L6-v2</code>) and index them in a lightweight Vector Store.</p>`,
      code: {
        language: 'python',
        content: `from sentence_transformers import SentenceTransformer

# Load fast embedding model (384-dimensional embeddings)
embedder = SentenceTransformer('all-MiniLM-L6-v2')

chunk_texts = [c["text"] for c in all_chunks]
print("Encoding document chunks into dense vector embeddings...")
embeddings = embedder.encode(chunk_texts, convert_to_numpy=True, show_progress_bar=False)

# Attach embeddings to chunks
for i, chunk in enumerate(all_chunks):
    chunk["embedding"] = embeddings[i]

print(f"Embeddings matrix created: {embeddings.shape} (Chunks x Vector Dim)")`,
      },
    },
    {
      title: 'Step 4: Semantic Retrieval with Cosine Similarity',
      content: `<p>When a user asks a question, we embed the query into the same vector space and retrieve the top-K chunks with highest Cosine Similarity.</p>`,
      code: {
        language: 'python',
        content: `def retrieve_top_k(query, chunks, top_k=3):
    query_vec = embedder.encode(query, convert_to_numpy=True)
    query_norm = norm(query_vec)
    
    scored_chunks = []
    for c in chunks:
        c_vec = c["embedding"]
        sim = np.dot(query_vec, c_vec) / (query_norm * norm(c_vec) + 1e-9)
        scored_chunks.append((sim, c))
        
    # Sort descending by similarity
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    return scored_chunks[:top_k]

# Test retrieval on real query
query = "How do I setup two-factor authentication or reset my API key?"
top_results = retrieve_top_k(query, all_chunks, top_k=2)

print(f"Query: \\"{query}\\"\\n")
print("Top Retrieved Passages:")
for rank, (score, chunk) in enumerate(top_results, 1):
    print(f"[{rank}] Score: {score:.4f} | Source: {chunk['title']} ({chunk['chunk_id']})")
    print(f"    Excerpt: \\"{chunk['text'][:140]}...\\"\\n")`,
      },
    },
    {
      title: 'Step 5: Augmented Prompt Synthesis with Citations',
      content: `<p>We format the retrieved passages into an augmented prompt template for the LLM to synthesize a grounded response with source citations.</p>`,
      code: {
        language: 'python',
        content: `def build_rag_prompt(user_query, retrieved_items):
    context_str = ""
    sources = []
    for rank, (score, chunk) in enumerate(retrieved_items, 1):
        context_str += f"\\n[Doc {rank} - {chunk['title']}]: {chunk['text']}\\n"
        sources.append(chunk['title'])
        
    prompt = f"""You are a helpful customer support AI. Answer the user's question STRICTLY using the retrieved context below. If the answer is not in the context, state that you do not know. Do not hallucinate.

CONTEXT:
{context_str}

USER QUESTION:
{user_query}

INSTRUCTIONS:
1. Provide a direct, step-by-step answer.
2. Cite the source document title used for each statement."""
    return prompt, sources

rag_prompt, cited_sources = build_rag_prompt(query, top_results)
print("=" * 60)
print("              COMPILED RAG PROMPT PAYLOAD              ")
print("=" * 60)
print(rag_prompt)
print("=" * 60)
print(f"Cited Sources for Verification: {list(set(cited_sources))}")`,
      },
      note: 'Notice how the LLM is constrained strictly to the retrieved facts, eliminating hallucinations while providing verifiable citations.',
    },
  ],
  exercises: [
    'Test with queries that have NO relevant information in the knowledge base (e.g. "What is the capital of Mars?"). Confirm the prompt directs the model to decline answering.',
    'Experiment with chunk_size=150 vs chunk_size=800. How does chunk size impact retrieval precision?',
    'Integrate LangChain\'s Chroma or FAISS vector store wrapper to persist embeddings to disk.',
  ],
  quiz: [
    {
      question: 'What is the foundational problem that Retrieval-Augmented Generation (RAG) solves for Large Language Models?',
      options: [
        'It speeds up token generation by 100x',
        'It compresses LLM weights onto microcontrollers',
        'It prevents hallucinations and outdated knowledge by dynamically retrieving relevant facts from an external knowledge base or vector database and injecting them into the prompt',
        'It removes the need for prompt engineering',
      ],
    },
    {
      question: 'What mathematical metric is standardly used by Vector Databases to rank the similarity between a query embedding and document chunk embeddings?',
      options: [
        'Manhattan L1 distance',
        'Jaccard word intersection index',
        'Cosine Similarity (measuring the angular distance between dense vector representations)',
        'Mean squared error',
      ],
    },
    {
      question: 'In a LangChain RAG pipeline, what is the role of the Vector Database (e.g. ChromaDB or FAISS)?',
      options: [
        'To store relational SQL foreign keys',
        'To index dense document embeddings and perform fast Approximate Nearest Neighbor (ANN) semantic search',
        'To generate the final English text response',
        'To compile PyTorch tensors',
      ],
    },
    {
      question: 'In RAG architecture, what happens if document chunks are made excessively large (e.g. 10,000 words per chunk)?',
      options: [
        'Granular semantic relevance is diluted, and retrieved text may exceed the LLM\'s context window or introduce irrelevant noise',
        'The vector database runs out of disk space instantly',
        'The embeddings become 1-dimensional',
        'The model becomes immune to hallucinations',
      ],
    },
  ],
};
