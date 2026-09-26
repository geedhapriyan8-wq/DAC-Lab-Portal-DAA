/* ============================================================
   DAA Topic 08 — Natural Language Processing
   Lab 1: Introduction to NLP & Text Preprocessing
   Lab 2: Sentiment Analysis: From Bag of Words to a Classifier
   Source material: DAA-006 "Introduction to Natural Language
   Processing" and "Introduction to NLP" slide decks
   ============================================================ */

window.DAA_LAB_DATA = window.DAA_LAB_DATA || {};

const DAA_NLTK_SETUP = `import nltk

# Download the language resources used in this lab (only needed once per Colab session)
for resource in ["punkt", "punkt_tab", "stopwords", "wordnet", "omw-1.4",
                 "averaged_perceptron_tagger_eng", "movie_reviews", "vader_lexicon"]:
    nltk.download(resource, quiet=True)

print("NLTK version:", nltk.__version__)`;

/* ─────────────────────────────────────────────────────────────
   LAB 1 — Introduction to NLP & Text Preprocessing
   ───────────────────────────────────────────────────────────── */
window.DAA_LAB_DATA['daa-08_lab1'] = {
  title:      'Introduction to NLP & Text Preprocessing',
  difficulty: 'Simple → Intermediate',
  duration:   '2 hours',
  overview:   'Natural Language Processing (NLP) sits at the intersection of computer science, AI and linguistics: it enables computers to read, understand and generate human language. In this lab you learn what NLP is, the levels at which language must be processed, why it is so hard for machines, where it is used (sentiment analysis, translation, text completion, chatbots), and the standard NLP workflow. You then build the preprocessing toolkit in Python: tokenisation, cleaning, stop-word removal, stemming vs lemmatisation, part-of-speech tagging, and turning text into numbers with Bag of Words, n-grams and TF-IDF, finishing with text EDA (frequency distributions and word clouds) on real movie reviews.',
  objectives: [
    'Define natural language and NLP, and name the levels of language processing',
    'Explain why ambiguity, representation and rules make NLP hard',
    'Describe four major NLP applications and the general NLP workflow',
    'Tokenise text into sentences and words with NLTK',
    'Clean text and remove stop words, and choose between stemming and lemmatisation',
    'Convert text into numeric features with Bag of Words, n-grams and TF-IDF',
    'Explore a text corpus with frequency distributions and word clouds',
  ],
  steps: [
    {
      title: 'What Is Natural Language Processing?',
      content: `<p><strong>Natural language</strong> is any language that evolved naturally in humans through use and repetition, without conscious planning: speech and written text. It contrasts with <em>formal</em> languages such as mathematical notation or programming languages, which follow rigid, explicitly defined rules.</p>
<p><strong>Natural Language Processing</strong> is the application of computational techniques to the processing, analysis and synthesis of natural language: not just storing text, but understanding, analysing and generating it. Key tasks include machine translation, question answering and speech recognition.</p>
<h4>Levels of NLP</h4>
<p>Understanding language requires processing it across layers, from raw sounds and characters up to meaning and intent:</p>
<table>
  <tr><th>Level</th><th>Deals with</th><th>Example question</th></tr>
  <tr><td>Phonology</td><td>Sounds</td><td>Which sounds make up "cat"?</td></tr>
  <tr><td>Morphology</td><td>Word parts</td><td>"unhappiness" = un + happy + ness</td></tr>
  <tr><td>Lexical</td><td>Individual words and their meanings</td><td>Is "bank" a noun or a verb?</td></tr>
  <tr><td>Syntactic</td><td>Grammar and sentence structure</td><td>Who did what to whom?</td></tr>
  <tr><td>Semantic</td><td>Meaning of sentences</td><td>What does the sentence claim?</td></tr>
  <tr><td>Discourse</td><td>Meaning across sentences</td><td>Who does "she" refer to?</td></tr>
  <tr><td>Pragmatic</td><td>Intent and context</td><td>Is "Nice job!" sincere or sarcastic?</td></tr>
</table>
<p>A complete NLP system often handles several levels at once.</p>`,
    },
    {
      title: 'What Makes NLP Hard?',
      content: `<p>The core challenge is teaching machines to navigate the complexity, ambiguity and variability of human language, which is full of exceptions, context-dependence and cultural nuance.</p>
<ul>
  <li><strong>The representation problem:</strong> how do you encode a sentence, paragraph or essay in a computer? Text is symbolic and sequential, but machines need numbers. Choosing a representation is one of the first and most critical design decisions.</li>
  <li><strong>The rules problem:</strong> is it even possible to write down all the rules of a language? Idioms, slang and exceptions are endless, and linguists debate the rules themselves. This is why modern NLP relies on <em>data-driven, statistical</em> approaches rather than hand-crafted rules.</li>
</ul>
<h4>Ambiguity everywhere</h4>
<ul>
  <li>"I saw the man with the telescope." Who has the telescope?</li>
  <li>"The bank is closed." A river bank or a financial bank?</li>
  <li>"Great, another Monday." Positive words, negative meaning (sarcasm).</li>
</ul>
<blockquote>Ambiguity is not a bug in language; it's a feature. NLP systems must learn to resolve it.</blockquote>`,
    },
    {
      title: 'Applications of NLP',
      content: `<table>
  <tr><th>Application</th><th>What it does</th><th>Where you see it</th></tr>
  <tr><td><strong>Sentiment analysis</strong> (opinion mining)</td><td>Identifies the emotional tone of text: positive, negative, angry, joyful, sarcastic</td><td>Brand monitoring, customer feedback, political polling. One model can read millions of reviews in minutes (Lab 2!)</td></tr>
  <tr><td><strong>Machine translation</strong></td><td>Converts text between languages. Evolved from statistical MT to neural MT, which captures meaning and context rather than translating word-for-word, trained on millions of aligned sentence pairs</td><td>Google Translate, real-time speech translation</td></tr>
  <tr><td><strong>Text completion &amp; suggestions</strong></td><td>Language models predict what you are likely to write next</td><td>Phone autocomplete, Gmail Smart Compose, code completion (GitHub Copilot)</td></tr>
  <tr><td><strong>Chatbots &amp; question answering</strong></td><td>Understand intent and respond. Three generations: rule-based (scripts), retrieval-based (pick the best stored answer), generative (LLMs create new responses)</td><td>Customer support, ChatGPT, Claude, Gemini</td></tr>
</table>`,
    },
    {
      title: 'The General NLP Workflow',
      content: `<ol>
  <li><strong>Exploratory data analysis</strong>: frequency distributions, word clouds, text lengths; form hypotheses about patterns and biases.</li>
  <li><strong>Data preprocessing</strong>: convert raw text into a cleaner, machine-friendly form and reduce noise: tokenisation, lemmatisation/stemming, expanding contractions, removing stop words. <em>Which steps to use is context-dependent and debatable.</em></li>
  <li><strong>Feature engineering</strong>: represent text numerically: Bag of Words, n-grams, TF-IDF, part-of-speech tags. (Less critical for deep learning, which learns representations automatically.)</li>
  <li><strong>Model training</strong>: fit an algorithm to the processed data.</li>
  <li><strong>Model evaluation</strong>: quantifiable metrics (accuracy, F1, BLEU for translation), error analysis, then iterate on data or model.</li>
</ol>
<p>This lab covers steps 1–3. Lab 2 completes steps 4–5 with a sentiment classifier.</p>`,
    },
    {
      title: 'Set Up Colab with NLTK',
      content: `<p>Create <code>DAA_Topic8_Lab1_NLP.ipynb</code>. <strong>NLTK</strong> (Natural Language Toolkit) is a classic Python library for teaching and prototyping NLP. It is pre-installed in Colab, but its language resources (word lists, dictionaries, models) must be downloaded once per session.</p>`,
      code: { language: 'python', run: true, content: DAA_NLTK_SETUP },
      note: 'Colab prints [nltk_data] download messages below this cell; that is normal. There is no dataset to upload: the movie reviews come from NLTK.',
    },
    {
      title: 'Tokenisation: Splitting Text into Pieces',
      content: `<p><strong>Tokenisation</strong> breaks text into smaller units (tokens): sentences or words. It is <em>always</em> the first step, because every other method needs individual words.</p>
<p>Why not just use <code>.split()</code>? Because punctuation and contractions matter: <code>"isn't"</code> and <code>"great!"</code> should become meaningful tokens.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `from nltk.tokenize import sent_tokenize, word_tokenize

text = ("The new café opened in Singapore last week! The coffee isn't cheap, but it's great. "
        "I've already visited three times and I'm running out of excuses.")

print("split():", text.split()[:12])
print()
print("Sentences:")
for s in sent_tokenize(text):
    print("  -", s)
print()
tokens = word_tokenize(text)
print(len(tokens), "word tokens:", tokens)`,
      },
    },
    {
      title: 'Cleaning Text: Case, Punctuation and Contractions',
      content: `<p>Raw text contains noise that doesn't carry meaning for many tasks:</p>
<ul>
  <li><strong>Lowercasing</strong>: "Great" and "great" become the same token.</li>
  <li><strong>Expanding contractions</strong>: "isn't" → "is not". This is important for sentiment: the "not" must survive!</li>
  <li><strong>Removing punctuation and numbers</strong> with a regular expression, when they are not useful.</li>
</ul>`,
      code: {
        language: 'python',
        run: true,
        content: `import re

CONTRACTIONS = {"isn't": "is not", "it's": "it is", "i've": "i have", "i'm": "i am",
                "don't": "do not", "can't": "cannot", "won't": "will not", "didn't": "did not"}

def clean(text):
    text = text.lower()
    for short, full in CONTRACTIONS.items():
        text = text.replace(short, full)
    text = re.sub(r"[^\\w\\s]|[\\d_]", " ", text)   # drop punctuation, digits, underscores (keeps é)
    return re.sub(r"\\s+", " ", text).strip()   # collapse repeated spaces

cleaned = clean(text)
print(cleaned)`,
      },
    },
    {
      title: 'Removing Stop Words',
      content: `<p><strong>Stop words</strong> are very common words ("the", "is", "and") that add little meaning on their own. Removing them focuses analysis on important keywords, useful for text classification and search.</p>
<p><strong>Warning for sentiment:</strong> standard stop-word lists include negations like "not" and "no". Removing them turns "not good" into "good", so keep negations when sentiment matters.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `from nltk.corpus import stopwords

stop_words = set(stopwords.words("english"))
print(len(stop_words), "English stop words, e.g.", sorted(stop_words)[:10])

tokens = word_tokenize(cleaned)
no_stops = [t for t in tokens if t not in stop_words]
print("\\nBefore:", tokens)
print("After: ", no_stops)

keep_negations = stop_words - {"not", "no", "nor"}
print("Keeping negations:", [t for t in tokens if t not in keep_negations])`,
      },
    },
    {
      title: 'Stemming vs Lemmatisation',
      content: `<table>
  <tr><th></th><th>Stemming</th><th>Lemmatisation</th></tr>
  <tr><td>What it does</td><td>Chops words to a rough root with rules: "running" → "run", "studies" → "studi"</td><td>Converts words to their correct dictionary form (lemma): "studies" → "study", "better" → "good"</td></tr>
  <tr><td>Speed</td><td>Very fast</td><td>Slower (dictionary look-ups, needs part of speech)</td></tr>
  <tr><td>Output</td><td>May not be a real word</td><td>Always a real word</td></tr>
  <tr><td>Use when</td><td>Speed matters more than exact meaning (search engines)</td><td>Meaning and grammar matter (chatbots, question answering)</td></tr>
</table>
<p>The lemmatiser needs to know the <strong>part of speech</strong> (noun, verb, adjective). NLTK's POS tagger provides it.</p>`,
      code: [
        { language: 'python', run: true, content: `from nltk.stem import PorterStemmer, WordNetLemmatizer

stemmer = PorterStemmer()
lemmatizer = WordNetLemmatizer()

words = ["running", "ran", "studies", "studying", "better", "cities", "happily", "wolves"]
print(f"{'word':<10} {'stem':<10} {'lemma (noun)':<13} {'lemma (verb)':<13} {'lemma (adj)'}")
for w in words:
    print(f"{w:<10} {stemmer.stem(w):<10} {lemmatizer.lemmatize(w):<13} "
          f"{lemmatizer.lemmatize(w, pos='v'):<13} {lemmatizer.lemmatize(w, pos='a')}")` },
        { language: 'python', run: true, content: `from nltk import pos_tag

tagged = pos_tag(word_tokenize("The children were running quickly towards the better playground"))
print(tagged)

def to_wordnet(tag):
    return {"J": "a", "V": "v", "R": "r"}.get(tag[0], "n")   # adjective, verb, adverb, else noun

print([lemmatizer.lemmatize(w.lower(), to_wordnet(t)) for w, t in tagged])` },
      ],
      note: 'POS tags come from the Penn Treebank set: NN = noun, VBD = past-tense verb, VBG = -ing verb, JJR = comparative adjective, RB = adverb, DT = determiner.',
    },
    {
      title: 'Bag of Words, N-grams and TF-IDF',
      content: `<p>Models need numbers, which is where the representation problem gets solved.</p>
<ul>
  <li><strong>Bag of Words (BoW)</strong>, also called a <em>count vectoriser</em>: each document becomes a vector counting how often each vocabulary word appears. Word order is ignored (hence "bag").</li>
  <li><strong>N-grams</strong>: sequences of <em>n</em> words. Bigrams (n = 2) keep a little order: "not good" becomes its own feature.</li>
  <li><strong>TF-IDF</strong> (term frequency × inverse document frequency): weights a word by how often it appears in <em>this</em> document, discounted by how common it is across <em>all</em> documents. Words that are frequent everywhere ("movie") get low weight; distinctive words get high weight.</li>
</ul>`,
      code: [
        { language: 'python', run: true, content: `import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

docs = ["the movie was good",
        "the movie was not good",
        "the acting was great and the story was great"]

bow = CountVectorizer()
counts = bow.fit_transform(docs)
pd.DataFrame(counts.toarray(), columns=bow.get_feature_names_out(), index=["doc1", "doc2", "doc3"])` },
        { language: 'python', run: true, content: `bigrams = CountVectorizer(ngram_range=(1, 2))
bigrams.fit(docs)
print("Unigrams + bigrams:", list(bigrams.get_feature_names_out()))` },
        { language: 'python', run: true, content: `tfidf = TfidfVectorizer()
weights = tfidf.fit_transform(docs)
pd.DataFrame(weights.toarray(), columns=tfidf.get_feature_names_out(), index=["doc1", "doc2", "doc3"]).round(2)` },
      ],
      after: `<p>In the BoW table, doc1 and doc2 look almost identical even though their meanings are opposite: only the "not" column differs. Bigrams add a "not good" feature that captures the difference. In the TF-IDF table, "the" and "was" (in every document) get low weights, while "great" gets a high weight in doc3.</p>`,
    },
    {
      title: 'Order Matters: Building a Preprocessing Pipeline',
      content: `<p><strong>Rule of thumb:</strong> tokenise → remove stop words → stem or lemmatise → vectorise (BoW/TF-IDF). Switching the order causes problems:</p>
<ul>
  <li>Removing stop words <em>before</em> tokenising doesn't work: there are no individual words yet.</li>
  <li>Stemming/lemmatising <em>before</em> removing stop words wastes time on words you then throw away.</li>
  <li>Vectorising <em>before</em> cleaning fills vectors with noise; "run" and "running" become separate columns.</li>
</ul>
<p>Package the steps into one reusable function:</p>`,
      code: {
        language: 'python',
        run: true,
        content: `def preprocess(text, keep_negations=True):
    stops = stop_words - {"not", "no", "nor"} if keep_negations else stop_words
    tokens = word_tokenize(clean(text))                       # 1. clean + tokenise
    tokens = [t for t in tokens if t not in stops]            # 2. stop words
    tagged = pos_tag(tokens)
    return [lemmatizer.lemmatize(w, to_wordnet(t)) for w, t in tagged]   # 3. lemmatise

print(preprocess("The actors weren't convincing, and I didn't enjoy the terribly slow scenes!"))`,
      },
    },
    {
      title: 'Text EDA on Real Movie Reviews',
      content: `<p>NLTK includes 2,000 movie reviews (1,000 positive, 1,000 negative). Explore them before modelling: review length, the most frequent words after preprocessing, and a word cloud.</p>`,
      code: [
        { language: 'python', run: true, content: `from nltk.corpus import movie_reviews
from collections import Counter

reviews = pd.DataFrame([
    {"text": movie_reviews.raw(fid), "label": movie_reviews.categories(fid)[0]}
    for fid in movie_reviews.fileids()
])
reviews["n_words"] = reviews["text"].str.split().str.len()
print(reviews["label"].value_counts())
print(reviews.groupby("label")["n_words"].describe().round(0))` },
        { language: 'python', run: true, content: `sample = reviews.sample(300, random_state=42)
freq = Counter(w for text in sample["text"] for w in preprocess(text, keep_negations=False) if len(w) > 2)
print(freq.most_common(15))` },
        { language: 'python', run: true, content: `import matplotlib.pyplot as plt
from wordcloud import WordCloud

cloud = WordCloud(width=900, height=400, background_color="white", colormap="viridis").generate_from_frequencies(freq)
plt.figure(figsize=(11, 5))
plt.imshow(cloud, interpolation="bilinear")
plt.axis("off")
plt.title("Most Frequent Words in 300 Movie Reviews")
plt.show()` },
      ],
      after: `<p><strong>Hypothesis for Lab 2:</strong> the most frequent words ("film", "movie", "one") appear in <em>both</em> positive and negative reviews, so raw frequency alone won't separate sentiment. TF-IDF and a trained classifier should focus on more distinctive words.</p>`,
    },
  ],
  quiz: [
    {
      question: 'Which of these is a natural language?',
      options: ['Python', 'Mathematical notation', 'Spoken English', 'SQL'],
    },
    {
      question: 'Which NLP level deals with intent and context, such as detecting sarcasm?',
      options: ['Morphology', 'Syntactic', 'Pragmatic', 'Phonology'],
    },
    {
      question: 'Why do modern NLP systems rely on data-driven approaches rather than hand-written rules?',
      options: [
        'Rules are illegal',
        'Language has so many exceptions, idioms and context-dependent meanings that complete rules are impractical',
        'Data-driven approaches never make mistakes',
        'Computers cannot store rules',
      ],
    },
    {
      question: 'What should always be the first preprocessing step?',
      options: ['Stemming', 'TF-IDF', 'Tokenisation', 'Stop-word removal'],
    },
    {
      question: 'Why can removing stop words hurt sentiment analysis?',
      options: [
        'Stop words are always positive',
        'Standard lists include negations such as "not", turning "not good" into "good"',
        'It makes texts longer',
        'Stop words are needed for tokenisation',
      ],
    },
    {
      question: 'What is the main difference between stemming and lemmatisation?',
      options: [
        'Stemming uses a dictionary; lemmatisation uses rules',
        'Stemming chops words with rules (may produce non-words); lemmatisation returns the correct dictionary form',
        'They always give the same result',
        'Lemmatisation is faster',
      ],
    },
    {
      question: 'Lemmatising "better" as an adjective gives…',
      options: ['bett', 'better', 'good', 'best'],
    },
    {
      question: 'What does a Bag of Words representation ignore?',
      options: ['Word counts', 'Vocabulary', 'Word order', 'Documents'],
    },
    {
      question: 'Why does TF-IDF give a low weight to a word like "the"?',
      options: [
        'Because it is short',
        'Because it appears in almost every document, so it is not distinctive',
        'Because it is a stop word in every language',
        'Because TF-IDF removes all articles',
      ],
    },
    {
      question: 'How do bigrams help with "the movie was not good" vs "the movie was good"?',
      options: [
        'They remove the word "not"',
        'They create a feature such as "not good" that captures the negation',
        'They translate the text',
        'They count characters instead of words',
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   LAB 2 — Sentiment Analysis
   ───────────────────────────────────────────────────────────── */
window.DAA_LAB_DATA['daa-08_lab2'] = {
  title:      'Sentiment Analysis: From Bag of Words to a Classifier',
  difficulty: 'Intermediate → Advanced',
  duration:   '2 hours',
  overview:   'Sentiment analysis (opinion mining) automatically identifies the emotional tone of text, so businesses can read millions of reviews in minutes. In this lab you complete the NLP workflow on 2,000 movie reviews: you set a rule-based baseline with the VADER sentiment lexicon, then build and compare machine-learning classifiers (Bag of Words with Naive Bayes, and TF-IDF with logistic regression). You evaluate them with accuracy, the confusion matrix, precision, recall and F1, interpret which words drive predictions, perform error analysis (negation, sarcasm, mixed opinions), and package everything into a pipeline that classifies any new sentence. Finally you see how modern transformer models fit in.',
  objectives: [
    'Frame sentiment analysis as a supervised text-classification problem',
    'Build a lexicon-based baseline with VADER and understand its limits',
    'Vectorise text with CountVectorizer and TfidfVectorizer inside a scikit-learn Pipeline',
    'Train and compare Multinomial Naive Bayes and logistic regression classifiers',
    'Evaluate with a confusion matrix, precision, recall and F1',
    'Interpret the most positive and negative words learned by the model',
    'Perform error analysis and describe how transformers improve on Bag of Words',
  ],
  steps: [
    {
      title: 'Recap and the Sentiment Task',
      content: `<p>In Lab 1 you learned to clean, tokenise and vectorise text. Now you complete the workflow: <strong>train</strong> and <strong>evaluate</strong> a model.</p>
<p><strong>Task:</strong> given a movie review, predict whether it is <em>positive</em> or <em>negative</em>. This is <strong>binary text classification</strong>, a supervised learning problem: we have 2,000 reviews already labelled by humans.</p>
<h4>Two families of approach</h4>
<table>
  <tr><th>Approach</th><th>How</th><th>Pros</th><th>Cons</th></tr>
  <tr><td>Lexicon / rule-based</td><td>Look up each word in a dictionary of sentiment scores and combine them</td><td>No training data needed, transparent</td><td>Misses domain language, sarcasm and context</td></tr>
  <tr><td>Machine learning</td><td>Learn which words/phrases predict each label from labelled examples</td><td>Adapts to the domain, usually more accurate</td><td>Needs labelled data; can learn biases in the data</td></tr>
</table>`,
    },
    {
      title: 'Set Up and Load the Reviews',
      content: `<p>Create <code>DAA_Topic8_Lab2_Sentiment.ipynb</code> and run the NLTK setup, then load the reviews into a DataFrame.</p>`,
      code: [
        { language: 'python', run: true, content: DAA_NLTK_SETUP },
        { language: 'python', run: true, content: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from nltk.corpus import movie_reviews

reviews = pd.DataFrame([
    {"text": movie_reviews.raw(fid), "label": movie_reviews.categories(fid)[0]}
    for fid in movie_reviews.fileids()
])
reviews["y"] = (reviews["label"] == "pos").astype(int)
print(reviews.shape)
print(reviews["label"].value_counts())
print("\\nExample positive review (first 400 characters):\\n", movie_reviews.raw("pos/cv003_11664.txt")[:400])` },
      ],
    },
    {
      title: 'Baseline 1: Lexicon-Based Sentiment with VADER',
      content: `<p><strong>VADER</strong> (Valence Aware Dictionary and sEntiment Reasoner) is a rule-based sentiment analyser. It scores each word from a human-built lexicon and applies rules for negation ("not good"), intensifiers ("very good"), capitals and punctuation ("GOOD!!!"). The <code>compound</code> score ranges from −1 (most negative) to +1 (most positive).</p>`,
      code: [
        { language: 'python', run: true, content: `from nltk.sentiment import SentimentIntensityAnalyzer

vader = SentimentIntensityAnalyzer()
for sentence in ["The movie was good.", "The movie was not good.", "The movie was VERY good!!!",
                 "Great, another three hours of my life I will never get back."]:
    print(f"{vader.polarity_scores(sentence)['compound']:+.3f}  {sentence}")` },
        { language: 'python', run: true, content: `from sklearn.metrics import accuracy_score

reviews["vader"] = reviews["text"].apply(lambda t: vader.polarity_scores(t)["compound"])
reviews["vader_pred"] = (reviews["vader"] > 0).astype(int)
print("VADER accuracy on 2,000 reviews:", round(accuracy_score(reviews["y"], reviews["vader_pred"]), 3))
print(pd.crosstab(reviews["label"], reviews["vader_pred"], rownames=["actual"], colnames=["VADER says positive?"]))` },
      ],
      after: `<p>VADER handles simple negation, but notice the sarcastic sentence is scored as <em>positive</em>. On long movie reviews it's only moderately accurate and leans heavily towards "positive": reviewers describe plots with emotional words, and VADER was designed for short social-media text. That is our baseline to beat.</p>`,
    },
    {
      title: 'Train/Test Split',
      content: `<p>Hold out 20% of the reviews as a test set. <code>stratify</code> keeps the 50/50 balance of positive and negative in both parts.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    reviews["text"], reviews["y"], test_size=0.2, random_state=42, stratify=reviews["y"])
print("Train:", len(X_train), "| Test:", len(X_test))
print("Positive share in train/test:", round(y_train.mean(), 2), round(y_test.mean(), 2))`,
      },
    },
    {
      title: 'Model 1: Bag of Words + Naive Bayes',
      content: `<p><strong>Multinomial Naive Bayes</strong> is a classic, fast text classifier. It estimates how likely each word is in positive vs negative reviews and combines those probabilities, "naively" assuming words are independent. It works surprisingly well with word counts.</p>
<p>A scikit-learn <strong>Pipeline</strong> chains the vectoriser and the model, so the vocabulary is learned from the training data only and the same steps are applied to new text automatically.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

nb_model = Pipeline([
    ("bow", CountVectorizer(stop_words="english", min_df=2)),
    ("nb", MultinomialNB()),
])
nb_model.fit(X_train, y_train)
nb_pred = nb_model.predict(X_test)

print("Vocabulary size:", len(nb_model.named_steps["bow"].vocabulary_))
print("Naive Bayes accuracy:", round(accuracy_score(y_test, nb_pred), 3))`,
      },
      note: 'min_df=2 ignores words that appear in only one review: they are usually typos or names that cannot generalise.',
    },
    {
      title: 'Model 2: TF-IDF + Logistic Regression (with Bigrams)',
      content: `<p>Now combine TF-IDF weighting, unigrams <em>and</em> bigrams (to capture phrases like "not funny"), and logistic regression. Scikit-learn's built-in English stop-word list would delete "not", so this time we keep all words.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `from sklearn.linear_model import LogisticRegression

lr_model = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)),
    ("lr", LogisticRegression(max_iter=2000, C=10)),
])
lr_model.fit(X_train, y_train)
lr_pred = lr_model.predict(X_test)

print("Features (unigrams + bigrams):", len(lr_model.named_steps["tfidf"].vocabulary_))
print("TF-IDF + logistic regression accuracy:", round(accuracy_score(y_test, lr_pred), 3))`,
      },
    },
    {
      title: 'Evaluate and Compare',
      content: `<p>Accuracy alone can hide problems. Look at the confusion matrix and the per-class precision, recall and F1 (Topic 7), and compare all three approaches on the <em>same</em> test set.</p>`,
      code: [
        { language: 'python', run: true, content: `from sklearn.metrics import classification_report, confusion_matrix

vader_test = (X_test.apply(lambda t: vader.polarity_scores(t)["compound"]) > 0).astype(int)
summary = pd.DataFrame({
    "approach": ["VADER lexicon", "BoW + Naive Bayes", "TF-IDF + Logistic Regression"],
    "accuracy": [accuracy_score(y_test, p) for p in (vader_test, nb_pred, lr_pred)],
}).round(3)
print(summary, "\\n")
print(classification_report(y_test, lr_pred, target_names=["negative", "positive"]))` },
        { language: 'python', run: true, content: `cm = confusion_matrix(y_test, lr_pred)
plt.figure(figsize=(4.5, 4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Greens", cbar=False,
            xticklabels=["negative", "positive"], yticklabels=["negative", "positive"])
plt.title("TF-IDF + Logistic Regression")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.show()` },
      ],
    },
    {
      title: 'Interpret: Which Words Drive the Predictions?',
      content: `<p>A linear model is interpretable: each word or bigram has a weight. Large positive weights push towards "positive", large negative weights towards "negative".</p>`,
      code: {
        language: 'python',
        run: true,
        content: `vocab = lr_model.named_steps["tfidf"].get_feature_names_out()
coefs = lr_model.named_steps["lr"].coef_[0]
weights = pd.Series(coefs, index=vocab).sort_values()

print("Most NEGATIVE words/phrases:\\n", weights.head(12).round(2).to_string(), "\\n")
print("Most POSITIVE words/phrases:\\n", weights.tail(12).round(2).to_string())`,
      },
      after: `<p>Most weights make intuitive sense: "bad", "worst", "boring", "ridiculous" vs "great", "the best", "perfect", "excellent", "hilarious". Bigrams earn their place too: "the worst" and "should have" (as in "should have been better") are strongly negative.</p>
<p>Some are surprising: "plot" and "script" lean negative because critics mostly mention them when complaining, and filler phrases like "he is" or "as the" pick up weight by chance. Surprising weights reveal quirks, or biases, in the training data, like an actor's name becoming linked to bad films. That's the Topic 2 lesson applied to text.</p>`,
    },
    {
      title: 'Error Analysis',
      content: `<p>Read the reviews the model got wrong, especially the ones it was most <em>confident</em> about. Error analysis tells you what to fix next: the data, the preprocessing or the model.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `test_df = pd.DataFrame({"text": X_test, "actual": y_test,
                        "prob_positive": lr_model.predict_proba(X_test)[:, 1]})
test_df["error"] = (test_df["prob_positive"] > 0.5).astype(int) != test_df["actual"]
wrong = test_df[test_df["error"]].copy()
wrong["confidence"] = (wrong["prob_positive"] - 0.5).abs()
print(len(wrong), "misclassified reviews out of", len(test_df))

for _, row in wrong.sort_values("confidence", ascending=False).head(2).iterrows():
    print(f"\\nActual: {'positive' if row.actual else 'negative'} | P(positive) = {row.prob_positive:.2f}")
    print(row.text[:500].replace("\\n", " "), "...")`,
      },
      after: `<h4>Common causes of errors</h4>
<ul>
  <li><strong>Mixed opinions:</strong> "the acting is superb, but the plot is a mess".</li>
  <li><strong>Plot description:</strong> reviewers summarise dark or violent stories in neutral-to-negative words, even for films they love.</li>
  <li><strong>Sarcasm and irony:</strong> positive words used negatively.</li>
  <li><strong>Long-range negation:</strong> "I expected to hate it. I didn't." Bigrams can't see across sentences.</li>
</ul>`,
    },
    {
      title: 'Use the Model on New Text',
      content: `<p>Because everything is in a Pipeline, you can classify raw sentences directly. Try your own reviews.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `new_reviews = [
    "An absolute masterpiece. The performances were stunning and the ending moved me to tears.",
    "Boring, predictable and far too long. I nearly walked out.",
    "The effects were impressive but the story was a complete mess.",
    "I didn't expect much, but it turned out to be surprisingly funny and charming.",
]
for text, p in zip(new_reviews, lr_model.predict_proba(new_reviews)[:, 1]):
    print(f"{'POSITIVE' if p > 0.5 else 'NEGATIVE':<8} ({p:.2f})  {text}")`,
      },
    },
    {
      title: 'Beyond Bag of Words: Embeddings and Transformers',
      content: `<p>Bag of Words treats "excellent" and "superb" as completely unrelated columns and forgets word order. Modern NLP fixes both:</p>
<ul>
  <li><strong>Word embeddings</strong> (Word2Vec, GloVe) represent each word as a dense vector where similar words sit close together.</li>
  <li><strong>Transformers</strong> (BERT, and the models behind ChatGPT and Claude) read the whole sentence with <em>attention</em>, so a word's representation depends on its context. Pre-trained sentiment transformers handle negation and many subtle cases far better.</li>
</ul>
<p>Optional: try a pre-trained transformer from Hugging Face in Colab. The first run downloads a ~250 MB model; use a GPU runtime for speed (<strong>Runtime → Change runtime type → T4 GPU</strong>).</p>`,
      code: {
        language: 'python',
        content: `from transformers import pipeline

classifier = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
print(classifier(["I didn't expect much, but it turned out to be surprisingly funny and charming.",
                  "Great, another three hours of my life I will never get back."]))`,
      },
      after: `<h4>Wrap-up</h4>
<p>You completed the full NLP workflow: EDA → preprocessing → features → training → evaluation → error analysis. Save your notebook to GitHub under <code>nlp/</code>. Topic 9 takes you from classic NLP to working <em>with</em> large language models through prompt engineering and multi-agent systems.</p>`,
    },
  ],
  quiz: [
    {
      question: 'Sentiment analysis of labelled movie reviews is which kind of problem?',
      options: ['Unsupervised clustering', 'Supervised binary text classification', 'Regression', 'Reinforcement learning'],
    },
    {
      question: 'What is VADER?',
      options: [
        'A neural network trained on movie reviews',
        'A rule-based sentiment analyser that uses a lexicon of word scores plus rules for negation, intensity and punctuation',
        'A tokeniser',
        'A type of TF-IDF',
      ],
    },
    {
      question: 'Why does VADER struggle with "Great, another three hours of my life I will never get back."?',
      options: [
        'The sentence is too short',
        'It is sarcastic: positive words carry a negative meaning, which a word lexicon cannot detect',
        'VADER cannot read punctuation',
        'The sentence has no verbs',
      ],
    },
    {
      question: 'Why put the vectoriser and the classifier in a scikit-learn Pipeline?',
      options: [
        'Pipelines make models more accurate by default',
        'The vocabulary is learned only from training data, and new text is transformed with exactly the same steps',
        'It removes the need for a test set',
        'It is required for Naive Bayes',
      ],
    },
    {
      question: 'What does the "naive" in Naive Bayes refer to?',
      options: [
        'It ignores the labels',
        'It assumes the words are independent of each other given the class',
        'It only works on small datasets',
        'It cannot handle negative reviews',
      ],
    },
    {
      question: 'Why did the TF-IDF model not use scikit-learn\'s English stop-word list?',
      options: [
        'TF-IDF cannot use stop words',
        'The list removes negations like "not", which carry sentiment',
        'Stop words improve speed',
        'The list is only for Naive Bayes',
      ],
    },
    {
      question: 'In the confusion matrix, a negative review predicted as positive is a…',
      options: ['True positive', 'False positive', 'False negative', 'True negative'],
    },
    {
      question: 'What is the purpose of error analysis?',
      options: [
        'To delete misclassified reviews from the dataset',
        'To study mistakes and discover what to improve in the data, preprocessing or model',
        'To raise the accuracy number automatically',
        'To tune the random seed',
      ],
    },
    {
      question: 'Which limitation of Bag of Words do word embeddings address?',
      options: [
        'BoW needs too much RAM',
        'BoW treats similar words (e.g. "excellent" and "superb") as unrelated',
        'BoW cannot count words',
        'BoW only works in English',
      ],
    },
    {
      question: 'What lets transformer models understand a word based on its context?',
      options: ['Stemming', 'The attention mechanism', 'Stop-word removal', 'min_df'],
    },
  ],
};
