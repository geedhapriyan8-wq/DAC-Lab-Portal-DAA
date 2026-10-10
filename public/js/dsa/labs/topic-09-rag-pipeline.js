/* ============================================================
   Topic 09 — RAG (Retrieval-Augmented Generation) Pipeline (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-09_lab1'] = {
  title:      'Building a Baseline RAG Pipeline',
  difficulty: 'Hands-on → Intermediate',
  duration:   '90 minutes',
  overview:   'In this practical hands-on lab, you will construct an end-to-end Baseline Retrieval-Augmented Generation (RAG) pipeline from scratch. Using the corporate knowledge base dataset (datasets/knowledge_base_articles.json), you will implement document chunking, generate dense vector embeddings, build an indexed Vector Store with Cosine Similarity search, formulate an augmented prompt payload with source tracking, and evaluate baseline retrieval precision.',
  objectives: [
    'Profile and chunk private knowledge base articles from datasets/knowledge_base_articles.json',
    'Generate dense vector embeddings using sentence-transformers (all-MiniLM-L6-v2)',
    'Construct an in-memory vector database with L2 normalization and cosine indexing',
    'Implement semantic search to retrieve the top-K most relevant chunks for user queries',
    'Construct an augmented prompt template enforcing strict contextual grounding and citations',
    'Benchmark retrieval accuracy across queries with and without relevant knowledge base answers',
  ],
  steps: [
    {
      title: 'Step 1: Ingestion & Document Chunking',
      content: `<p>LLMs cannot search raw unstructured documents directly. We first ingest <code>datasets/knowledge_base_articles.json</code> and split articles into semantic chunks with overlapping boundaries to preserve context across splits.</p>`,
      code: {
        language: 'python',
        content: `import json
import os
import numpy as np

# Load real knowledge base articles
kb_file = "datasets/knowledge_base_articles.json"
with open(kb_file, "r") as f:
    articles = json.load(f)

print(f"Loaded {len(articles)} Knowledge Base documents from {kb_file}.")

def recursive_chunk_text(text, max_chars=400, overlap=60):
    chunks = []
    start = 0
    while start < len(text):
        end = start + max_chars
        chunk = text[start:end].strip()
        if len(chunk) > 20:
            chunks.append(chunk)
        start += (max_chars - overlap)
    return chunks

chunk_store = []
for doc in articles:
    sub_chunks = recursive_chunk_text(doc["content"])
    for i, c in enumerate(sub_chunks):
        chunk_store.append({
            "chunk_id": f"{doc['id']}_p{i+1}",
            "article_id": doc["id"],
            "title": doc["title"],
            "category": doc["category"],
            "text": c
        })

print(f"Ingestion complete: {len(chunk_store)} chunks created with {overlap} char overlap.")
print(f"Sample Chunk [ID: {chunk_store[0]['chunk_id']}]: \\"{chunk_store[0]['text'][:90]}...\\"")`,
      },
    },
    {
      title: 'Step 2: Dense Embeddings & Vector Indexing',
      content: `<p>We compute dense 384-dimensional vector embeddings for all chunks using <code>sentence-transformers</code>. We apply L2 normalization so cosine similarity is computed directly via vector dot products.</p>`,
      code: {
        language: 'python',
        content: `from sentence_transformers import SentenceTransformer

# Load compact bi-encoder model
embedder = SentenceTransformer('all-MiniLM-L6-v2')

corpus_texts = [item["text"] for item in chunk_store]
print(f"Computing dense vector embeddings for {len(corpus_texts)} chunks...")

# Generate normalized vectors
embeddings = embedder.encode(corpus_texts, convert_to_numpy=True, normalize_embeddings=True)

# Index vectors into chunk_store
for idx, chunk in enumerate(chunk_store):
    chunk["vector"] = embeddings[idx]

print(f"Vector Database indexed: {embeddings.shape[0]} vectors of dimension {embeddings.shape[1]}.")
print(f"Vector L2 Norm check: {np.linalg.norm(chunk_store[0]['vector']):.4f} (expected: 1.0000)")`,
      },
      note: 'Normalizing vectors upfront allows the search engine to use fast matrix multiplication (dot product) rather than computing square roots at query time.',
    },
    {
      title: 'Step 3: Runtime Semantic Search',
      content: `<p>When a query arrives, embed it and calculate dot products against all stored vectors to rank candidate passages.</p>`,
      code: {
        language: 'python',
        content: `def semantic_search(query, store, top_k=3):
    query_vec = embedder.encode(query, convert_to_numpy=True, normalize_embeddings=True)
    
    scored_results = []
    for item in store:
        # Fast dot product of normalized vectors
        score = float(np.dot(query_vec, item["vector"]))
        scored_results.append((score, item))
        
    scored_results.sort(key=lambda x: x[0], reverse=True)
    return scored_results[:top_k]

test_query = "What is the policy for requesting annual leave and PTO rollover?"
top_candidates = semantic_search(test_query, chunk_store, top_k=2)

print(f"Query: \\"{test_query}\\"\\n")
for rank, (sim, match) in enumerate(top_candidates, 1):
    print(f"Rank #{rank} [Similarity: {sim:.4f}] — {match['title']} ({match['category']})")
    print(f"Passage: \\"{match['text'][:130]}...\\"\\n")`,
      },
    },
    {
      title: 'Step 4: Grounded Prompt Formulation & Verification',
      content: `<p>Synthesize the retrieved passages into an augmented prompt with strict grounding constraints to prevent hallucinations.</p>`,
      code: {
        language: 'python',
        content: `def generate_baseline_rag_prompt(user_query, matches):
    context_blocks = []
    for i, (score, m) in enumerate(matches, 1):
        context_blocks.append(f"[Source {i} - {m['title']} (Score: {score:.3f})]:\\n{m['text']}")
        
    compiled_context = "\\n\\n".join(context_blocks)
    prompt = f"""You are an enterprise AI assistant. Answer the user's question using ONLY the retrieved facts below. If the answer is not supported by the context, state "I cannot find the answer in the provided documentation."

=== RETRIEVED CONTEXT ===
{compiled_context}

=== USER QUERY ===
{user_query}

=== INSTRUCTIONS ===
1. Answer concisely based strictly on the context.
2. Cite [Source X] for every fact mentioned."""
    return prompt

final_prompt = generate_baseline_rag_prompt(test_query, top_candidates)
print("=" * 60)
print("                COMPILED BASELINE RAG PROMPT                ")
print("=" * 60)
print(final_prompt)
print("=" * 60)`,
      },
    },
  ],
  exercises: [
    'Test with an out-of-domain query (e.g. "What is the secret recipe for Coca-Cola?"). Confirm the similarity scores remain below 0.30.',
    'Implement a similarity threshold filter: reject any retrieved chunk with score < 0.45.',
    'Export the vector embeddings matrix to disk using np.save("embeddings.npy", embeddings).',
  ],
  quiz: [
    {
      question: 'What is the primary operational role of a Vector Database in a baseline RAG pipeline?',
      options: [
        'To store the model\'s PyTorch neural network weights',
        'To index high-dimensional dense vector embeddings and execute sub-millisecond Approximate Nearest Neighbor (ANN) semantic searches',
        'To render markdown components on client browsers',
        'To translate English queries into SQL queries',
      ],
    },
    {
      question: 'If a user searches for the term "canine", which retrieved document chunk will dense semantic vector search rank highest?',
      options: [
        '"The feline slept on the living room sofa."',
        '"I bought a hot dog at the baseball game."',
        '"The golden retriever played fetch across the grassy lawn."',
        '"D.O.G is an abbreviation for Department of Geology."',
      ],
    },
    {
      question: 'Why do production RAG systems apply L2 unit-norm normalization to embedding vectors prior to indexing?',
      options: [
        'To encrypt confidential user data',
        'Because cosine similarity simplifies mathematically to a hardware-accelerated dot product when vectors have unit length (magnitude = 1.0)',
        'To truncate string lengths to 256 characters',
        'Because LLMs crash on floating point values above 1.0',
      ],
    },
  ],
};

window.LAB_DATA['topic-09_lab2'] = {
  title:      'Advanced RAG with CRAG and Reranking',
  difficulty: 'Advanced → Production RAG',
  duration:   '90–120 minutes',
  overview:   'Baseline (Naive) RAG often retrieves irrelevant or noisy passages that degrade model answers. In this advanced lab, you will implement Corrective RAG (CRAG) and Cross-Encoder Reranking. You will build an automated relevance evaluator (Grader) that scores retrieved documents, implements fallback query reformulation when retrieval confidence is low, and utilizes a Cross-Encoder model to re-rank candidate documents with deep joint self-attention.',
  objectives: [
    'Understand limitations of Naive RAG: semantic drift, noisy chunks, and lack of self-correction',
    'Implement a Corrective RAG (CRAG) relevance evaluator / grader',
    'Design automated action paths: RELEVANT (proceed), AMBIGUOUS (refine query), IRRELEVANT (fallback)',
    'Implement a two-stage retrieval pipeline: Bi-Encoder broad recall (Top-20) + Cross-Encoder deep reranking (Top-3)',
    'Measure the precision gain between baseline cosine retrieval and Cross-Encoder reranking',
    'Build a production-grade CRAG execution engine with telemetry logging',
  ],
  steps: [
    {
      title: 'Step 1: The CRAG (Corrective RAG) Architecture',
      content: `<p>Standard RAG blindly passes whatever chunks the vector DB returns to the LLM. <strong>Corrective RAG (CRAG)</strong> inserts an automated <strong>Retrieval Evaluator (Grader)</strong> between retrieval and generation:</p>
<ol>
  <li><strong>Correct (Confidence &ge; 0.70):</strong> The retrieved documents are relevant. Refine documents and generate.</li>
  <li><strong>Ambiguous (0.45 &le; Confidence &lt; 0.70):</strong> Combine internal knowledge with a rewritten search query.</li>
  <li><strong>Incorrect (Confidence &lt; 0.45):</strong> The database has no answer. Trigger fallback or directly tell the user no verified facts exist.</li>
</ol>`,
      code: {
        language: 'python',
        content: `class CRAGRetrievalEvaluator:
    """Evaluates relevance of retrieved document passages to the user query."""
    def __init__(self, high_thresh=0.68, low_thresh=0.45):
        self.high_thresh = high_thresh
        self.low_thresh = low_thresh

    def grade_retrieval(self, query, retrieved_chunks):
        if not retrieved_chunks:
            return "INCORRECT", []
            
        top_score = retrieved_chunks[0][0]
        
        if top_score >= self.high_thresh:
            status = "CORRECT"
            # Keep only high-confidence chunks
            selected = [c for c in retrieved_chunks if c[0] >= self.low_thresh]
        elif top_score >= self.low_thresh:
            status = "AMBIGUOUS"
            selected = retrieved_chunks
        else:
            status = "INCORRECT"
            selected = []
            
        return status, selected

crag_evaluator = CRAGRetrievalEvaluator()
print("CRAG Evaluator configured with dual threshold gates [0.68 / 0.45].")`,
      },
    },
    {
      title: 'Step 2: Two-Stage Retrieval with Cross-Encoder Reranking',
      content: `<p>Bi-encoders encode queries and documents separately, which is fast ($O(1)$ dot products) but loses fine-grained cross-attention between words. A <strong>Cross-Encoder</strong> processes <code>(query, document)</code> pairs jointly through all transformer layers, capturing intricate semantic nuances.</p>`,
      code: {
        language: 'python',
        content: `from sentence_transformers import CrossEncoder

# Load pre-trained Cross-Encoder reranker
reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def two_stage_retrieval(query, chunk_store, broad_k=10, final_k=3):
    # Stage 1: Fast Bi-Encoder retrieves broad candidates
    stage1_results = semantic_search(query, chunk_store, top_k=broad_k)
    
    # Stage 2: Cross-Encoder pairs query with each candidate chunk
    pairs = [[query, match["text"]] for score, match in stage1_results]
    cross_scores = reranker.predict(pairs)
    
    # Combine and re-sort by Cross-Encoder logit score
    reranked = []
    for idx, cs in enumerate(cross_scores):
        reranked.append({
            "cross_score": float(cs),
            "bi_score": stage1_results[idx][0],
            "chunk": stage1_results[idx][1]
        })
        
    reranked.sort(key=lambda x: x["cross_score"], reverse=True)
    return reranked[:final_k]

print("Two-Stage Retrieval Pipeline initialized.")`,
      },
      note: 'Cross-Encoders are too slow to evaluate over millions of documents, which is why we use the Bi-Encoder as a fast filter for the top 10–20 candidates before running the Cross-Encoder.',
    },
    {
      title: 'Step 3: Comparing Baseline Retrieval vs Reranked Retrieval',
      content: `<p>Let us test a complex query: <em>"Can I rollover unused vacation days to the next calendar year?"</em> and observe how reranking elevates the exact clause.</p>`,
      code: {
        language: 'python',
        content: `query = "Can I rollover unused vacation days to the next calendar year?"

# 1. Baseline Bi-Encoder Retrieval
baseline_hits = semantic_search(query, chunk_store, top_k=3)
print("=== BASELINE BI-ENCODER RETRIEVAL (Top 3) ===")
for r, (s, m) in enumerate(baseline_hits, 1):
    print(f"[{r}] Bi-Score: {s:.4f} | {m['title']} | \\"{m['text'][:100]}...\\"")

# 2. Advanced Two-Stage Reranked Retrieval
reranked_hits = two_stage_retrieval(query, chunk_store, broad_k=6, final_k=3)
print("\\n=== TWO-STAGE CROSS-ENCODER RERANKED (Top 3) ===")
for r, item in enumerate(reranked_hits, 1):
    print(f"[{r}] Cross-Score: {item['cross_score']:+.4f} (Bi: {item['bi_score']:.4f}) | {item['chunk']['title']}")
    print(f"    Passage: \\"{item['chunk']['text'][:110]}...\\"")`,
      },
    },
    {
      title: 'Step 4: End-to-End CRAG Pipeline Execution',
      content: `<p>Tie everything together into an end-to-end CRAG executor that evaluates retrieval quality, routes execution according to the verdict, and logs telemetry.</p>`,
      code: {
        language: 'python',
        content: `def execute_crag_pipeline(query, chunk_store):
    print(f"\\n--- Executing CRAG Pipeline for: '{query}' ---")
    
    # 1. Broad retrieval
    candidates = semantic_search(query, chunk_store, top_k=5)
    
    # 2. CRAG Grading
    verdict, filtered = crag_evaluator.grade_retrieval(query, candidates)
    print(f"CRAG Evaluator Verdict: [{verdict}]")
    
    if verdict == "CORRECT":
        # Rerank and synthesize
        pairs = [[query, m["text"]] for s, m in filtered]
        scores = reranker.predict(pairs)
        best_idx = np.argmax(scores)
        best_chunk = filtered[best_idx][1]
        
        response = f"Answer synthesized from verified document: '{best_chunk['title']}'.\\n" \\
                   f"Key Excerpt: \\"{best_chunk['text']}\\""
        action = "SYNTHESIZE_WITH_GROUNDED_CONTEXT"
        
    elif verdict == "AMBIGUOUS":
        response = "The retrieved context is partially relevant. Triggering automated query expansion."
        action = "QUERY_REFORMULATION"
        
    else:  # INCORRECT
        response = "I cannot answer this question because no relevant documents exist in the knowledge base."
        action = "FALLBACK_REJECT"
        
    return {
        "query": query,
        "verdict": verdict,
        "action": action,
        "response": response
    }

# Test with valid query
result_valid = execute_crag_pipeline("What is the policy on 2FA and password expiration?", chunk_store)
print(f"Action: {result_valid['action']}")
print(f"Response: {result_valid['response']}")

# Test with out-of-domain query
result_invalid = execute_crag_pipeline("How do I bake chocolate chip cookies?", chunk_store)
print(f"Action: {result_invalid['action']}")
print(f"Response: {result_invalid['response']}")`,
      },
      warning: 'Notice how CRAG gracefully rejects queries that have no grounded facts rather than hallucinating plausible-sounding nonsense.',
    },
  ],
  exercises: [
    'Implement a Query Rewriter step: when CRAG returns "AMBIGUOUS", use a zero-shot prompt to generate 3 alternative query variations.',
    'Test with Reciprocal Rank Fusion (RRF) combining BM25 keyword rankings and vector rankings.',
    'Benchmark latency of Bi-Encoder vs Cross-Encoder over 50 test iterations.',
  ],
  quiz: [
    {
      question: 'In advanced RAG, what is the core mechanism of Corrective RAG (CRAG)?',
      options: [
        'Automatically increasing the temperature of the language model to maximum',
        'Manually reviewing all documents with human operators before indexing',
        'Evaluating retrieved document relevance with an automated evaluator/grader, filtering out noise and triggering query reformulation or fallback search if retrieval quality is inadequate',
        'Rewriting Python code into C++',
      ],
    },
    {
      question: 'Why does a Cross-Encoder Reranker achieve higher relevance precision than a standard Bi-Encoder vector search?',
      options: [
        'Because Cross-Encoders do not require neural networks',
        'Because Cross-Encoders process the query and document jointly in full cross-attention rather than comparing isolated pre-computed embeddings',
        'Because Cross-Encoders run 100 times faster than vector dot products',
        'Because Cross-Encoders ignore semantic meaning and match exact characters',
      ],
    },
    {
      question: 'What is the primary advantage of combining Bi-Encoder retrieval with Cross-Encoder reranking in a two-stage pipeline?',
      options: [
        'It eliminates the need for vector databases',
        'It balances speed and precision: the fast Bi-Encoder narrows millions of documents down to Top-K candidates, and the accurate Cross-Encoder reranks them for optimal context quality',
        'It avoids needing an LLM to generate the final response',
        'It increases the size of the final context window to infinity',
      ],
    },
  ],
};
