/* ============================================================
   Topic 08 — Natural Language Processing (NLP) (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-08_lab1'] = {
  title:      'Classical NLP: Cleaning, TF-IDF, and Sparse Representations',
  difficulty: 'Simple → Intermediate',
  duration:   '90 minutes',
  overview:   'Machine Learning models cannot process raw text; they only understand numbers. In this detailed lab, you will learn the classical NLP pipeline. You will clean messy real-world text, tokenize it, and mathematically convert those tokens into numerical feature vectors using Bag of Words (BoW) and the TF-IDF (Term Frequency-Inverse Document Frequency) algorithm.',
  objectives: [
    'Clean raw text (lowercasing, punctuation removal via Regex)',
    'Tokenize text, handle stemming/lemmatization, and remove stop words',
    'Understand the sparse Bag of Words (BoW) model architecture',
    'Implement TF-IDF vectorization to convert text to numerical features mathematically',
    'Analyze the severe limitations of sparse representations (loss of sequence and context)',
  ],
  steps: [
    {
      title: 'Text Cleaning and Tokenization',
      content: `<p>Raw text scraped from the internet is incredibly messy. It contains punctuation, HTML tags, irregular casing, and common words (like "the", "is", "at") that carry almost no semantic meaning for tasks like classification. <strong>Tokenization</strong> is the process of breaking a string into discrete units (words or sub-words).</p>`,
      code: {
        language: 'python',
        content: `import re

raw_text = "The quick brown fox jumps over the LAZY dog!! Isn't that amazing? <br> Click here!"

# 1. Lowercase and remove HTML tags
clean_text = raw_text.lower()
clean_text = re.sub(r'<[^>]+>', '', clean_text) # Regex to strip HTML

# 2. Remove punctuation (keep only alphanumeric and spaces)
clean_text = re.sub(r'[^a-z0-9\\s]', '', clean_text)
print(f"Cleaned Text: '{clean_text}'")

# 3. Tokenize (split by spaces)
tokens = clean_text.split()
print(f"Tokens: {tokens}")

# 4. Remove Stop Words (Common words with little meaning)
# In production, use nltk.corpus.stopwords
stop_words = set(['the', 'is', 'over', 'that', 'a', 'an', 'in', 'here'])
filtered_tokens = [word for word in tokens if word not in stop_words]

print(f"Filtered Tokens: {filtered_tokens}")`
      },
      note: 'In production pipelines, you would use robust libraries like spaCy or NLTK to handle complex tokenization (e.g., properly handling contractions like "isn\'t" or compound words) instead of writing raw regular expressions.'
    },
    {
      title: 'Bag of Words (BoW): Sparse Matrices',
      content: `<p>The simplest way to convert text to numbers is the <strong>Bag of Words</strong>. You create a global vocabulary of all known words across all documents. Then, for each document, you create a vector that counts how many times each vocabulary word appears.</p>
<p>Because most documents only use a tiny fraction of the global vocabulary, the resulting vectors are mostly zeros. This is known as a <strong>Sparse Matrix</strong>.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.feature_extraction.text import CountVectorizer
import numpy as np

documents = [
    "I love machine learning and artificial intelligence.",
    "I love coding in Python.",
    "Machine learning is amazing."
]

# Create the CountVectorizer (It handles lowercasing and tokenization automatically!)
vectorizer = CountVectorizer(stop_words='english')

# Fit (build global vocabulary) and transform (count words per doc)
bow_matrix = vectorizer.fit_transform(documents)

# The vocabulary maps words to specific column indices
vocab = vectorizer.get_feature_names_out()
print("Global Vocabulary Map:", vocab)
print(f"Total Vocabulary Size: {len(vocab)} words")

print("\\nBag of Words Matrix (Rows=Documents x Cols=Word Counts):")
# Convert SciPy sparse matrix to dense NumPy array for human printing
print(bow_matrix.toarray())

# Let's inspect the first document's mathematical representation
print(f"\\nDoc 1 ('{documents[0]}') vector: {bow_matrix.toarray()[0]}")`
      }
    },
    {
      title: 'The TF-IDF Algorithm',
      content: `<p>Bag of Words has a major flaw: words that appear frequently across ALL documents (like "machine" in a tech blog corpus) get very high counts, but they aren't very useful for distinguishing between specific articles.</p>
<p><strong>TF-IDF</strong> solves this mathematically. It rewards words that appear frequently in a <em>specific</em> document (Term Frequency), but heavily penalizes words that appear in <em>many</em> documents (Inverse Document Frequency).</p>
<h4>The Math:</h4>
<p>$$ \text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \log\left(\frac{N}{\text{DF}(t, D)}\right) $$</p>
<p>Where $N$ is total documents, $t$ is the term, $d$ is the document, and $D$ is the corpus.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.feature_extraction.text import TfidfVectorizer

# Initialize TF-IDF Vectorizer
tfidf_vec = TfidfVectorizer(stop_words='english')

# Fit and transform the corpus
tfidf_matrix = tfidf_vec.fit_transform(documents)
vocab = tfidf_vec.get_feature_names_out()

print("TF-IDF Matrix (Rows=Documents x Cols=Word Weights):")
# Notice how the values are now fractional weights instead of raw counts
print(np.round(tfidf_matrix.toarray(), 2))

# Let's compare Doc 1 representations
print(f"\\nVocabulary Alignment: {vocab}")
print(f"Doc 1 ('{documents[0]}')")
print(f"  BoW Vector:    {bow_matrix.toarray()[0]}")
print(f"  TF-IDF Vector: {np.round(tfidf_matrix.toarray()[0], 2)}")

print("\\nObservation: Notice how TF-IDF assigns unique fractional weights. A word that is highly unique to Document 1 gets a stronger weight than a word that is shared across multiple documents.")`
      },
      warning: 'While TF-IDF is highly effective for basic search engines and spam filters, it still suffers from the "Bag of Words" limitation: it completely ignores word order, grammar, and context. "The dog bit the man" and "The man bit the dog" have the exact same TF-IDF vector!'
    }
  ],
  exercises: [
    'Add the document "Python is amazing and coding is fun" to the list. Re-run the TF-IDF vectorizer. Track the weight of the word "amazing" in Document 3. Does it increase or decrease now that it also appears in Document 4? Why?',
    'What happens to the total vocabulary size and memory footprint of the matrix if you do NOT remove stop words from a dataset of 1 million tweets?',
    'Research "N-grams". How does using Bigrams (2-word pairs) inside CountVectorizer partially solve the issue of lost word order?',
  ],
  quiz: [
    {
      question: 'What is a "stop word" in Natural Language Processing?',
      options: [
        'A word that ends a sentence (like a period or exclamation mark)',
        'A highly common word that carries little semantic meaning for search or classification (e.g., "the", "and", "is")',
        'A word that causes the machine learning model to crash during tokenization',
        'A swear word that must be filtered out for compliance',
      ],
    },
    {
      question: 'What critical information is completely lost when using Bag of Words or TF-IDF models?',
      options: [
        'The length of the document in characters',
        'The frequency of the words in the corpus',
        'Word order, syntax, and grammatical context (The sequence of words)',
        'The global vocabulary of the dataset',
      ],
    },
    {
      question: 'In the TF-IDF formula, what happens to the mathematical weight of a word if it appears in almost every single document in your dataset?',
      options: [
        'The weight increases significantly, making it the most important feature',
        'The weight becomes exactly 1.0 everywhere',
        'The Inverse Document Frequency (IDF) term approaches zero, meaning the word\'s overall weight decreases (is penalized) because it is not useful for distinguishing documents',
        'The weight is multiplied by the total number of documents',
      ],
    },
    {
      question: 'Why are Bag of Words matrices referred to as "Sparse Matrices"?',
      options: [
        'Because they don\'t contain enough data to train a good model',
        'Because the vast majority of the entries in the matrix are zeros (since most documents only use a tiny fraction of the global vocabulary)',
        'Because the values are spread very far apart',
        'Because they only use low-precision integers to save RAM',
      ],
    }
  ]
};

window.LAB_DATA['topic-08_lab2'] = {
  title:      'Dense Word Embeddings (Word2Vec) and Semantic Geometry',
  difficulty: 'Intermediate → Advanced',
  duration:   '120 minutes',
  overview:   'TF-IDF represents words as isolated categories in a massive sparse matrix; it has no idea that "king" and "queen" are related. <strong>Dense Word Embeddings</strong> solve this by representing words as low-dimensional vectors in a continuous geometric space, where physically close vectors represent semantically similar words. In this advanced lab, you will explore Word2Vec, Cosine Similarity, and Vector Arithmetic.',
  objectives: [
    'Understand the massive limitations of sparse one-hot/TF-IDF representations',
    'Understand the Distributional Hypothesis ("You shall know a word by the company it keeps")',
    'Understand Dense Word Embeddings (Word2Vec, GloVe)',
    'Implement and calculate Cosine Similarity between dense vectors',
    'Perform semantic vector arithmetic (e.g., King - Man + Woman = ?)',
  ],
  steps: [
    {
      title: 'The Concept of Dense Embeddings',
      content: `<p>Instead of a sparse vector with 50,000 dimensions (one for each word in the dictionary) where only 1 is non-zero (One-Hot Encoding), an <strong>Embedding</strong> is a dense vector of, say, 300 dimensions. Every number is a non-zero float.</p>
<p>Each dimension represents a latent semantic concept (e.g., gender, royalty, color, size, plurality), though they aren't explicitly labeled by humans. Models like <strong>Word2Vec</strong> (Google, 2013) learn these vectors by analyzing the context in which words appear in millions of sentences using a shallow neural network.</p>`,
      code: {
        language: 'python',
        content: `# Note: We are simulating a pre-trained embedding space for educational purposes
import numpy as np
from numpy.linalg import norm

class SimulatedWord2Vec:
    """A tiny, simulated 3D word embedding space for demonstration."""
    def __init__(self):
        # Let's imagine a 3-Dimensional space representing:
        # [Royalty_Axis, Masculinity_Axis, Age_Axis]
        self.vocab = {
            "king":   np.array([ 0.9,  0.9,  0.8]),
            "queen":  np.array([ 0.9, -0.9,  0.8]),
            "man":    np.array([ 0.1,  0.9,  0.5]),
            "woman":  np.array([ 0.1, -0.9,  0.5]),
            "boy":    np.array([ 0.0,  0.9, -0.7]),
            "girl":   np.array([ 0.0, -0.9, -0.7]),
            "prince": np.array([ 0.8,  0.9, -0.6]),
            "apple":  np.array([-0.9,  0.0,  0.0]) # Completely unrelated concept
        }
        
    def __getitem__(self, word):
        if word.lower() in self.vocab:
            return self.vocab[word.lower()]
        else:
            raise KeyError(f"Word '{word}' not in vocabulary")

wv = SimulatedWord2Vec()
print("Simulated Word2Vec Space Initialized.")
print("Vector for 'king': ", wv['king'])
print("Vector for 'apple':", wv['apple'])`
      }
    },
    {
      title: 'Measuring Semantic Distance: Cosine Similarity',
      content: `<p>How do we mathematically measure if two words mean similar things? We plot their vectors in the space and calculate the angle between them.</p>
<p>We use <strong>Cosine Similarity</strong>, which ranges from -1 (completely opposite directions) to 1 (pointing in the exact same direction, meaning identical semantics). A score of 0 means the vectors are orthogonal (completely unrelated).</p>
<h4>The Math:</h4>
<p>$$ \text{Cosine Similarity} = \cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|} $$</p>`,
      code: {
        language: 'python',
        content: `def cosine_similarity(vec1, vec2):
    """Calculates the cosine of the angle between two dense vectors."""
    dot_product = np.dot(vec1, vec2)
    
    # Calculate the magnitude (length) (L2 Norm) of each vector
    norm_v1 = norm(vec1)
    norm_v2 = norm(vec2)
    
    # Avoid division by zero
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
        
    return dot_product / (norm_v1 * norm_v2)

# Let's test the semantic relationships!
sim_man_boy = cosine_similarity(wv['man'], wv['boy'])
sim_man_apple = cosine_similarity(wv['man'], wv['apple'])
sim_man_woman = cosine_similarity(wv['man'], wv['woman'])
sim_king_prince = cosine_similarity(wv['king'], wv['prince'])

print("--- Cosine Similarity Scores ---")
print(f"Similarity (Man, Boy):     {sim_man_boy:5.3f}  (High: both male)")
print(f"Similarity (King, Prince): {sim_king_prince:5.3f}  (High: both royal males)")
print(f"Similarity (Man, Woman):   {sim_man_woman:5.3f}  (Mid: both human adults, but opposite gender axis)")
print(f"Similarity (Man, Apple):   {sim_man_apple:5.3f}  (Near Zero: totally unrelated concepts)")`
      }
    },
    {
      title: 'Semantic Vector Arithmetic (Analogies)',
      content: `<p>The most famous and mind-bending property of Word2Vec is that semantic relationships are captured as geometric offsets. This allows for mathematical arithmetic on words!</p>
<p>Classic example: <code>Vector("King") - Vector("Man") + Vector("Woman") ≈ Vector("Queen")</code></p>
<p>Because the vector connecting Man to Woman represents "femininity", if you add that exact same vector to King, you arrive in the geometric space belonging to Queen.</p>`,
      code: {
        language: 'python',
        content: `# Let's perform the mathematical arithmetic
# King - Man + Woman
result_vector = wv['king'] - wv['man'] + wv['woman']

print("--- Vector Arithmetic ---")
print("Target Equation: [King] - [Man] + [Woman]")
print(f"Resulting Raw Vector:\\n{result_vector.round(2)}")

print(f"\\nActual stored vector for 'Queen':\\n{wv['queen'].round(2)}")

# Let's write a function to find the closest word in the entire vocabulary to our result vector
def most_similar(target_vec, vocab_dict, exclude_words=[]):
    """Iterates through vocab to find the word vector with highest cosine similarity."""
    best_word = None
    best_score = -2.0 # Minimum possible cosine sim is -1
    
    for word, vec in vocab_dict.items():
        if word in exclude_words:
            continue
            
        score = cosine_similarity(target_vec, vec)
        if score > best_score:
            best_score = score
            best_word = word
            
    return best_word, best_score

# We exclude the inputs to prevent it from just returning "King" or "Woman"
closest_match, match_score = most_similar(result_vector, wv.vocab, exclude_words=['king', 'man', 'woman'])

print(f"\\n✨ Closest word in vocabulary space is: '{closest_match.upper()}' with similarity {match_score:.3f}")
print("The geometry perfectly captured the semantic analogy!")`
      },
      note: 'In production, a real Word2Vec model has millions of words and 300 dimensions. You use the `gensim` library in Python to load pre-trained models (like GoogleNews-vectors-negative300.bin) to perform these operations at scale.'
    }
  ],
  exercises: [
    'Calculate the arithmetic vector for `Vector("boy") - Vector("man") + Vector("woman")`. Run it through the `most_similar` function. What word does it return?',
    'Why is Cosine Similarity preferred over Euclidean Distance (just measuring the straight-line distance using Pythagorean theorem) when comparing high-dimensional word vectors?',
    'Research the difference between the "Skip-gram" and "Continuous Bag of Words (CBOW)" architectures used to train Word2Vec. Which one is better for infrequent words?',
  ],
  quiz: [
    {
      question: 'What is the primary architectural advantage of Dense Word Embeddings (like Word2Vec) over sparse TF-IDF vectors?',
      options: [
        'They take up significantly less disk space to store',
        'They are much easier to calculate without a GPU',
        'They capture deep semantic meaning and relationships between words geometrically, rather than treating words as completely isolated, independent categories',
        'They are completely immune to spelling errors and typos',
      ],
    },
    {
      question: 'What mathematical metric is standardly used to measure the semantic similarity between two dense word embedding vectors?',
      options: [
        'Manhattan Distance (L1 Norm)',
        'Jaccard Index',
        'Cosine Similarity (The angle between the vectors)',
        'Mean Squared Error (MSE)',
      ],
    },
    {
      question: 'According to the principles of semantic vector arithmetic, what should be the closest word vector to the result of the equation: `[Paris] - [France] + [Italy]`?',
      options: [
        'Europe',
        'Rome',
        'Pizza',
        'Spanish',
      ],
    },
    {
      question: 'Which famous linguistic hypothesis forms the foundation for algorithms like Word2Vec and GloVe?',
      options: [
        'The Distributional Hypothesis ("You shall know a word by the company it keeps")',
        'The Sapir-Whorf Hypothesis',
        'Chomsky\'s Universal Grammar',
        'The Turing Test',
      ],
    }
  ]
};
