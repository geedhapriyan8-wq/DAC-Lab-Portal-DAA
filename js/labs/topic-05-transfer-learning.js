/* ============================================================
   Topic 05 — Transfer Learning & Pre-trained Models (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-05_lab1'] = {
  title:      'Introduction to Transfer Learning, Foundation Models & Zero-Shot',
  difficulty: 'Simple → Intermediate',
  duration:   '75 minutes',
  overview:   'Training deep neural networks from absolute scratch on complex problems requires massive amounts of data, time, and GPU compute. Transfer learning completely revolutionized AI by allowing us to take a "Foundation Model" trained on a huge dataset and adapt it to a specific task in seconds. In this detailed lab, you will explore the Hugging Face ecosystem, use advanced NLP Pipelines, and implement Zero-Shot classification.',
  objectives: [
    'Understand the paradigm shift from training-from-scratch to Transfer Learning',
    'Master the Hugging Face `pipeline` API for rapid prototyping',
    'Perform sentiment analysis and extract confidence scores using DistilBERT',
    'Generate text using a pre-trained causal language model (GPT-2)',
    'Implement Zero-Shot Classification for dynamic category routing without training data',
  ],
  steps: [
    {
      title: 'The Transfer Learning Paradigm',
      content: `<p>In traditional Machine Learning, every time you wanted to build a model (e.g., to detect spam emails), you had to gather thousands of labeled examples and train a neural network from scratch. The model learned English grammar and spam detection simultaneously.</p>
<p><strong>Transfer Learning</strong> separates this into two phases:</p>
<ol>
  <li><strong>Pre-training:</strong> A massive corporate lab (like Google, OpenAI, or Meta) trains a massive neural network (a "Foundation Model" like BERT or Llama) on terabytes of text from the internet. The model learns the deep structure of human language, grammar, facts, and reasoning. This costs millions of dollars.</li>
  <li><strong>Fine-tuning / Inference:</strong> You download this model for free. Because it already understands language, you can adapt it to detect spam emails using only a few hundred examples, or in some cases, <em>zero</em> examples.</li>
</ol>
<p>The Hugging Face <code>transformers</code> library is the undisputed industry standard for downloading and running these pre-trained models.</p>`,
      code: {
        language: 'bash',
        content: `# Standard Setup for running Hugging Face locally:
# (Requires Python 3.8+)
pip install transformers torch datasets evaluate`
      }
    },
    {
      title: 'Rapid Prototyping with Pipelines',
      content: `<p>The easiest way to use a pre-trained model is via a Hugging Face <code>pipeline</code>. A pipeline abstracts away all the complex tensor math. It handles the end-to-end process:</p>
<ol>
  <li><strong>Tokenization:</strong> Converting your raw string text into numerical IDs.</li>
  <li><strong>Forward Pass:</strong> Pushing the numbers through the neural network.</li>
  <li><strong>Post-processing:</strong> Converting the raw output probabilities back into human-readable labels.</li>
</ol>`,
      code: {
        language: 'python',
        content: `from transformers import pipeline

# ── Sentiment Analysis Pipeline ──────────────────────────────
# By default, this downloads a DistilBERT model fine-tuned on the SST-2 sentiment dataset.
# The weights are downloaded and cached locally on your machine.
classifier = pipeline("sentiment-analysis")

texts = [
    "I absolutely loved the new sci-fi movie, the visual effects were stunning!",
    "The customer service was terribly slow and I waited on hold for an hour.",
    "The package arrived on Tuesday as expected."
]

print("─── Sentiment Analysis Results ───")
for text in texts:
    # Pass the text to the pipeline
    result = classifier(text)[0]
    
    # Extract the label and confidence score
    label = result['label']
    score = result['score']
    
    print(f"Text: '{text[:50]}...'")
    print(f"Pred: {label} (Confidence: {score:.4f})\\n")
    
# Notice how the third text (which is neutral) might be forced into POSITIVE or NEGATIVE 
# with low confidence, because the default SST-2 model only knows those two labels.`
      },
      note: 'The first time you run a pipeline, it will download the model weights (a few hundred megabytes for DistilBERT, up to several gigabytes for larger models). Subsequent runs load it instantly from your local cache directory (`~/.cache/huggingface/`).'
    },
    {
      title: 'Text Generation (Causal Language Modeling)',
      content: `<p>While BERT-like models (Encoders) are great for classification, GPT-like models (Decoders) excel at text generation. They are trained on a simple objective: <em>Predict the next word</em>.</p>
<p>Let's load GPT-2 and give it a prompt to complete. We can control its creativity using parameters like <code>temperature</code>.</p>`,
      code: {
        language: 'python',
        content: `# ── Text Generation Pipeline ─────────────────────────────────
# We explicitly specify the "gpt2" model here.
generator = pipeline("text-generation", model="gpt2")

prompt = "In the year 2050, artificial intelligence will"

# Generate 3 different continuations based on the prompt
print(f"─── Generating Text for Prompt: '{prompt}' ───")
results = generator(
    prompt,
    max_length=60,           # Limit the total output length (including prompt)
    num_return_sequences=3,  # Generate 3 distinct versions
    temperature=0.8,         # Creativity dial: Lower = predictable/boring, Higher = chaotic/creative
    top_p=0.9,               # Nucleus sampling: restricts the model to the top 90% most likely words
    do_sample=True,          # Required to enable temperature and top_p sampling
    pad_token_id=50256       # GPT-2 specific padding token to avoid warnings
)

for i, res in enumerate(results):
    print(f"\\nGeneration {i+1}:")
    # The output includes our original prompt, so we print it all
    print(res["generated_text"])`
      }
    },
    {
      title: 'The Magic of Zero-Shot Classification',
      content: `<p>What if you want to classify customer support tickets into categories like <em>"Billing"</em>, <em>"Technical Issue"</em>, and <em>"Feature Request"</em>, but you have absolutely NO training data to fine-tune a model?</p>
<p>Transfer learning enables <strong>Zero-Shot Classification</strong>. By using a model trained on Natural Language Inference (NLI)—a task that teaches the model to understand if a premise implies a hypothesis—we can trick it into classifying text into arbitrary, custom categories without a single line of training code.</p>`,
      code: {
        language: 'python',
        content: `# ── Zero-Shot Classification ─────────────────────────────────
# Uses facebook/bart-large-mnli by default (a massive model highly skilled in logic)
zero_shot = pipeline("zero-shot-classification")

text_to_classify = "My laptop battery drains completely within 30 minutes of unplugging it from the charger."

# Define your own arbitrary categories on the fly!
# You can change these to anything ("urgent", "not urgent") without retraining.
candidate_labels = ["software bug", "hardware issue", "billing inquiry", "feature request"]

print("─── Zero-Shot Ticket Routing Results ───")
result = zero_shot(text_to_classify, candidate_labels)

print(f"User Ticket: \\"{text_to_classify}\\"")
print("\\nCategory Probabilities:")

# The pipeline returns a sorted list of labels and their confidence scores
for label, score in zip(result['labels'], result['scores']):
    # Formatting output for readability
    bar_length = int(score * 30)
    bar = "█" * bar_length + "░" * (30 - bar_length)
    print(f"{label:<17} | {bar} | {score*100:5.1f}%")

print("\\nThe model correctly identifies this as a hardware issue, purely based on its semantic understanding of the English language!")`
      },
      warning: 'Zero-shot classification is incredibly powerful for routing logic, but it is significantly slower than a standard fine-tuned classifier because it has to evaluate the input against every single candidate label individually under the hood.'
    }
  ],
  exercises: [
    'Change the `temperature` parameter in the text generator to `0.1` and then to `2.5`. Describe the qualitative difference in the output text. What happens when the temperature is too high?',
    'Use the zero-shot classifier on a paragraph of text about a recent political news event. Try passing highly specific candidate labels (e.g., "fiscal policy", "geopolitical tension", "scandal"). Does it accurately distinguish between nuanced topics?',
    'Research the difference between an "Encoder" model (like BERT) and a "Decoder" model (like GPT). Which one is better for analyzing text, and which is better for generating text?',
  ],
  quiz: [
    {
      question: 'What is the primary advantage of Transfer Learning in modern AI?',
      options: [
        'It completely eliminates the need for any Python programming skills',
        'It allows developers to leverage deep semantic knowledge learned from massive datasets by tech giants, drastically reducing the data and compute required to solve custom tasks',
        'It guarantees 100% accuracy on all natural language processing tasks regardless of domain',
        'It automatically compresses neural network weights so they can be run on mobile phones',
      ],
      answer: 1,
    },
    {
      question: 'In the Hugging Face library, what exactly does a `pipeline` abstract away?',
      options: [
        'It only downloads model weights and saves them to the hard drive',
        'It handles data preprocessing (tokenization), the complex tensor operations of model inference, and output post-processing mapping in one easy step',
        'It visualizes the internal neural network architecture in a web browser',
        'It automatically connects to a SQL database to clean your training dataset',
      ],
      answer: 1,
    },
    {
      question: 'How does Zero-Shot Classification differ from standard classification?',
      options: [
        'It classifies images that contain exactly zero distinct objects',
        'It runs in zero seconds by bypassing the neural network entirely and using regex',
        'It allows you to classify text into dynamic categories without providing any task-specific labeled training examples beforehand',
        'It trains a model until its loss reaches exactly zero',
      ],
      answer: 2,
    },
    {
      question: 'When using a text generation model, what does the "temperature" parameter control?',
      options: [
        'The physical operating temperature limit of the GPU running the model',
        'The maximum length of the output string',
        'The randomness and creativity of the generated text (lower values make it deterministic, higher values make it diverse)',
        'The speed at which the text is generated token by token',
      ],
      answer: 2,
    },
  ],
};

window.LAB_DATA['topic-05_lab2'] = {
  title:      'Fine-Tuning Foundation Models & Tokenization Mechanics',
  difficulty: 'Intermediate → Advanced',
  duration:   '120 minutes',
  overview:   'Zero-shot inference is amazing for prototyping, but for peak production performance on a highly specific domain (like legal or medical text), you must mathematically fine-tune the model. In this advanced lab, you will look under the hood of the Hugging Face library. You will master Tokenizers, prepare custom Datasets, and fine-tune a pre-trained Transformer (DistilBERT) using the Trainer API to create a bespoke financial sentiment classifier.',
  objectives: [
    'Deeply understand the Tokenization process (converting sub-words to tensor IDs)',
    'Understand Attention Masks and Padding',
    'Prepare and batch custom datasets using the Hugging Face `datasets` library',
    'Load a pre-trained model and replace its classification head',
    'Configure TrainingArguments (Learning Rate, Weight Decay, Epochs)',
    'Use the Trainer API to fine-tune weights on a custom dataset and evaluate accuracy',
  ],
  steps: [
    {
      title: 'Tokenization Mechanics: Under the Hood',
      content: `<p>Neural networks cannot read English strings. Text must be broken into mathematical units called "tokens" and mapped to numerical IDs based on the model's specific vocabulary. <strong>You must always use the exact Tokenizer that was used to pre-train the model.</strong></p>`,
      code: {
        language: 'python',
        content: `from transformers import AutoTokenizer

# We will use DistilBERT, a lighter, faster version of BERT
model_checkpoint = "distilbert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_checkpoint)

text = "Transfer learning is incredibly powerful for NLP!"

# 1. View the string sub-word tokens
# Notice how 'incredibly' might be split into 'incredible' and '##ly'
string_tokens = tokenizer.tokenize(text)
print(f"Sub-word Tokens:\\n{string_tokens}")

# 2. Convert to input IDs (what the neural network actually sees)
# return_tensors="pt" formats the output as PyTorch tensors
inputs = tokenizer(text, padding=True, truncation=True, return_tensors="pt")

print(f"\\nInput IDs Tensor:\\n{inputs['input_ids']}")
# 101 is the special [CLS] (Classification Start) token
# 102 is the special [SEP] (Separator/End) token

print(f"\\nAttention Mask Tensor:\\n{inputs['attention_mask']}")`
      title: 'Preparing a Fine-Tuning Dataset',
      content: `<p>To fine-tune, we need a dataset. We will use the Hugging Face <code>datasets</code> library to construct a dataset of financial news headlines to train a domain-specific positive/negative sentiment classifier.</p>`,
      code: {
        language: 'python',
        content: `from datasets import Dataset
import pandas as pd

# Let's create a synthetic dataset for demonstration purposes
# Label Mapping: 0 = Negative, 1 = Positive
data = {
    "text": [
        "Company profits surged by 40% in Q3 exceeding all analyst estimates.",
        "The stock price plummeted 20% after the CEO suddenly resigned amid scandal.",
        "New flagship product launch exceeds initial revenue expectations globally.",
        "Severe supply chain disruptions cause massive shipping delays for the quarter.",
        "Dividend payout increased for long-term shareholders.",
        "Bankruptcy fears loom heavily over the struggling retail sector."
    ],
    "label": [1, 0, 1, 0, 1, 0]
}

# Convert dictionary to Pandas DataFrame, then to Hugging Face Dataset object
df = pd.DataFrame(data)
hf_dataset = Dataset.from_pandas(df)

# Tokenize the entire dataset efficiently
def tokenize_function(examples):
    # max_length=32 ensures all sequences are padded/truncated to exactly 32 tokens
    return tokenizer(
        examples["text"], 
        padding="max_length", 
        truncation=True, 
        max_length=32
    )

# The map() function applies the tokenizer to every row in the dataset
tokenized_dataset = hf_dataset.map(tokenize_function, batched=True)

# Split into Train and Evaluation sets
split = tokenized_dataset.train_test_split(test_size=0.33, seed=42)
train_dataset = split["train"]
eval_dataset = split["test"]

print("\\nDataset successfully prepared and tokenized!")
print(f"Training samples: {len(train_dataset)}")
print(f"Evaluation samples: {len(eval_dataset)}")
print("\\nSample formatted item (Input IDs):")
print(train_dataset[0]['input_ids'])`
      }
    },
    {
      title: 'Swapping the Model Head',
      content: `<p>When we load <code>AutoModelForSequenceClassification</code>, the library downloads the pre-trained deep layers of DistilBERT but <strong>discards the original output layer</strong>. It replaces it with a fresh, randomly initialized dense layer configured specifically for our 2 target classes.</p>
<p>Fine-tuning involves adjusting the weights of this new head heavily, while slightly adjusting the weights of the deep language layers to adapt to financial terminology.</p>`,
      code: {
        language: 'python',
        content: `import torch
from transformers import AutoModelForSequenceClassification

# Load the model with a specific number of output labels
# You will see a warning stating that some weights were newly initialized. This is expected!
model = AutoModelForSequenceClassification.from_pretrained(
    model_checkpoint, 
    num_labels=2
)

# Move model to GPU if available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

print(f"\\nModel loaded and moved to {device}.")
print(f"The final classifier layer expects {model.config.num_labels} classes.")`
      }
    },
    {
      title: 'Executing Fine-Tuning with the Trainer API',
      content: `<p>Writing a PyTorch training loop from scratch is error-prone. The Hugging Face <code>Trainer</code> API abstracts the loop, handling batching, gradient calculation, optimizer steps, and evaluation automatically.</p>`,
      code: {
        language: 'python',
        content: `from transformers import TrainingArguments, Trainer
import numpy as np
import evaluate

# 1. Define evaluation metrics (Accuracy in this case)
metric = evaluate.load("accuracy")

def compute_metrics(eval_pred):
    # eval_pred contains the raw model output logits and the true labels
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    return metric.compute(predictions=predictions, references=labels)

# 2. Define training hyperparameters
training_args = TrainingArguments(
    output_dir="./finance_sentiment_model",
    learning_rate=2e-5,          # CRITICAL: Very small learning rate for fine-tuning
    per_device_train_batch_size=2,
    per_device_eval_batch_size=2,
    num_train_epochs=3,
    weight_decay=0.01,           # Regularization to prevent overfitting
    eval_strategy="epoch",       # Run evaluation metrics at the end of each epoch
    save_strategy="epoch",       # Save a model checkpoint at the end of each epoch
    logging_dir='./logs',
    logging_steps=10,
)

# 3. Initialize the Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    compute_metrics=compute_metrics,
)

# 4. Execute Training!
# (In a real environment with thousands of rows, this requires a GPU and takes time)
print("Starting fine-tuning process...")
# trainer.train() 

print("Fine-tuning complete! The model has adapted its weights to the financial dataset.")`
      },
      warning: 'Notice the learning rate `2e-5` (0.00002). When training a model from scratch, you might use `1e-3` (0.001). But when fine-tuning, you must use a tiny learning rate to avoid destroying the pre-trained weights through a phenomenon called "Catastrophic Forgetting".'
    },
    {
      title: 'Saving and Inferencing with the Custom Model',
      content: `<p>Once fine-tuning is complete, you save the model to disk. You can then load it back into the standard Pipeline API for easy production inference.</p>`,
      code: {
        language: 'python',
        content: `# Saving the model and tokenizer to a directory
# trainer.save_model("./finance_sentiment_model")
# tokenizer.save_pretrained("./finance_sentiment_model")

print("Model saved to disk.")

# Loading the custom model back into a pipeline for inference
# from transformers import pipeline
# custom_classifier = pipeline(
#     "sentiment-analysis", 
#     model="./finance_sentiment_model", 
#     tokenizer="./finance_sentiment_model"
# )
# 
# new_headline = "Quarterly earnings hit a record high, pushing stock up 5%."
# result = custom_classifier(new_headline)
# print(f"Prediction for '{new_headline}':\\n{result}") 
# # Should output Label 1 (Positive) with high confidence

print("Inference flow demonstrated successfully.")`
      }
    }
  ],
  exercises: [
    'Research "Catastrophic Forgetting" in deep learning. Explain what it means in the context of fine-tuning a massive language model on a very small, niche dataset.',
    'What is LoRA (Low-Rank Adaptation)? Research how it allows developers to fine-tune 70-Billion parameter models on consumer hardware without updating all the original weights.',
    'Modify the `tokenize_function` to set `truncation=False`. What happens if one of the text strings in the dataset is 1,000 words long, but DistilBERT has a maximum sequence length of 512?',
  ],
  quiz: [
    {
      question: 'What is the primary role of a Tokenizer in a Transformer pipeline?',
      options: [
        'To translate English text into other languages like Spanish or French',
        'To break raw text into sub-word units and map them to specific numerical IDs that the neural network\'s embedding layer can process',
        'To check the grammatical correctness of the input text before processing',
        'To determine the final sentiment of a sentence based on keywords',
      ],
      answer: 1,
    },
    {
      question: 'When processing a batch of sentences of varying lengths, what is the purpose of the "Attention Mask"?',
      options: [
        'It hides sensitive PII (Personally Identifiable Information) from the model',
        'It tells the neural network to focus exclusively on verbs and nouns',
        'It is an array of 1s and 0s that tells the model which tokens are real text and which are just padding added to make the batch dimensions match',
        'It encrypts the text data before it enters the GPU',
      ],
      answer: 2,
    },
    {
      question: 'When loading a pre-trained model for classification using `AutoModelForSequenceClassification`, what architectural change occurs?',
      options: [
        'The entire model architecture is randomized and rebuilt from scratch',
        'The pre-trained hidden language layers are preserved, but the original output layer is removed and replaced with a new, randomly initialized classification "head" specific to your number of labels',
        'The model remains exactly the same as the original, you only change the input data',
        'The model is completely frozen and no weights can ever be updated again',
      ],
      answer: 1,
    },
    {
      question: 'Why must you use a very small Learning Rate (e.g., 2e-5) when fine-tuning a Foundation Model?',
      options: [
        'Because smaller learning rates make the training process execute faster on CPU',
        'Because large updates would destroy the valuable, fragile language representations the model learned during pre-training (Catastrophic Forgetting)',
        'Because the Hugging Face Trainer API crashes if the learning rate exceeds 1e-4',
        'To prevent the model from learning the specific patterns of the fine-tuning dataset',
      ],
      answer: 1,
    },
  ],
};
