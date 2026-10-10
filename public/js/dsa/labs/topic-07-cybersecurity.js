/* ============================================================
   Topic 07 — Cybersecurity & Data Privacy (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-07_lab1'] = {
  title:      'Advanced Cryptography: Hashing, Salting, and Key Derivation',
  difficulty: 'Simple → Intermediate',
  duration:   '90 minutes',
  overview:   'In this lab, you will explore the foundation of data privacy: Cryptography. You will understand why plain-text passwords should never be stored, how Cryptographic Hash Functions work, why basic hashes are utterly vulnerable to dictionary and rainbow table attacks, and how "Salting" and "Key Derivation Functions" (like bcrypt/Argon2) secure modern systems.',
  objectives: [
    'Understand the core mathematical properties of a cryptographic hash function (SHA-256)',
    'Generate hashes in Python using the `hashlib` library',
    'Execute a simulated Rainbow Table attack to understand vulnerabilities',
    'Implement secure password salting to mitigate pre-computed attacks',
    'Understand the difference between fast hashing and secure Key Derivation Functions (KDF)',
  ],
  steps: [
    {
      title: 'The Problem with Plain Text and Basic Hashes',
      content: `<p>If a database stores passwords in plain text, a single database breach instantly exposes all user accounts, leading to massive liability. To protect users, we use <strong>Cryptographic Hash Functions</strong>.</p>
<p>A hash function takes an input of any size and mathematically scrambles it into a fixed-length string of characters (a digest).</p>
<h4>Critical Hash Properties</h4>
<ul>
  <li><strong>Deterministic:</strong> The exact same input ALWAYS produces the exact same hash.</li>
  <li><strong>One-way (Pre-image Resistance):</strong> It is computationally impossible to reverse the hash back into the original input. You cannot "decrypt" a hash.</li>
  <li><strong>Avalanche Effect:</strong> Changing even a single bit of the input completely changes the entire output hash.</li>
  <li><strong>Collision Resistance:</strong> It is exceptionally hard to find two different inputs that produce the same hash.</li>
</ul>`,
      code: {
        language: 'python',
        content: `import hashlib

def hash_password(password):
    """Hashes a password using the SHA-256 algorithm."""
    # Passwords must be encoded to bytes before hashing (UTF-8)
    encoded = password.encode('utf-8')
    # Create sha256 hash object and extract the hexadecimal representation
    return hashlib.sha256(encoded).hexdigest()

print("--- Basic Hashing Examples ---")
print("Hash of 'admin':   ", hash_password('admin'))
print("Hash of 'admin1':  ", hash_password('admin1')) # Observe the avalanche effect!

# Simulating a database lookup during a login attempt
print("\\n--- Simulating Login ---")
db_stored_hash = hash_password("super_secret_password")

login_attempt = "super_secret_password"
if hash_password(login_attempt) == db_stored_hash:
    print("✅ Login Successful! (Hashes match)")
else:
    print("❌ Login Failed! (Hashes do not match)")`
      }
    },
    {
      title: 'Vulnerability: The Rainbow Table Attack',
      content: `<p>While hashes cannot be "decrypted", basic hashing is highly vulnerable to <strong>Pre-computation Attacks</strong> (Dictionary Attacks and Rainbow Tables).</p>
<p>Because hashing is deterministic, hackers pre-calculate the hashes for millions of commonly used passwords, leaked dictionary words, and permutations. If a hacker steals your database, they don't need to reverse the hash; they simply look up the stolen hash in their massive pre-computed table.</p>`,
      code: {
        language: 'python',
        content: `# A mini rainbow table (a hacker's pre-computed dictionary)
common_passwords = ["123456", "password", "qwerty", "admin", "letmein123"]

# The hacker computes the hashes for all common passwords ONCE
rainbow_table = {hash_password(pw): pw for pw in common_passwords}

print("😈 Hacker's Rainbow Table built.")

# Imagine the hacker breaches a database and steals these records:
stolen_db_dump = [
    ("user_alice", "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"), # Hash of 123456
    ("user_bob",   "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"), # Hash of password
    ("user_charlie","d98b671a5c13ec9743c396bb5efed9835848bb290ce4d75dcf1e77983637841c") # Unknown complex password
]

print("\\n--- Attacking the Stolen Database ---")
for username, pw_hash in stolen_db_dump:
    # A simple, instant dictionary lookup!
    if pw_hash in rainbow_table:
        print(f"🚨 CRACKED! {username}'s password is: {rainbow_table[pw_hash]}")
    else:
        print(f"🛡️ Failed to crack {username}'s password.")`
      },
      warning: 'Never use MD5 or SHA-1 for passwords (or anything secure). They are cryptographically broken, meaning modern hardware can generate collisions and crack them in seconds. Even standard SHA-256 is no longer recommended for passwords because it is too fast (GPUs can calculate billions of hashes per second).'
    },
    {
      title: 'The Solution: Cryptographic Salting',
      content: `<p>To defeat Rainbow Tables, we use a <strong>Salt</strong>. A salt is a long, random string of bytes generated uniquely for EVERY user at the time of registration. It is appended to the password <em>before</em> hashing.</p>
<p>Because the salt is unique, the hacker's pre-calculated rainbow table is completely useless. They would have to generate an entirely new multi-terabyte table for every single user in your database, making the attack computationally infeasible.</p>`,
      code: {
        language: 'python',
        content: `import os

def generate_salt():
    """Generate a cryptographically secure random 16-byte salt."""
    return os.urandom(16).hex()

def hash_with_salt(password, salt):
    """Hash the password combined with the unique salt."""
    # Combine password and salt (concatenation)
    combined = password + salt
    return hashlib.sha256(combined.encode('utf-8')).hexdigest()

print("--- Secure User Registration ---")
# User 1 registers
alice_password = "password123"
alice_salt = generate_salt()
alice_hash = hash_with_salt(alice_password, alice_salt)

# The Database MUST store BOTH the salt and the hash!
secure_db = {
    "alice": {"salt": alice_salt, "hash": alice_hash}
}
print(f"Alice's Record -> Salt: {alice_salt[:8]}..., Hash: {alice_hash[:8]}...")

# User 2 registers with the EXACT SAME password
bob_password = "password123"
bob_salt = generate_salt()
bob_hash = hash_with_salt(bob_password, bob_salt)
secure_db["bob"] = {"salt": bob_salt, "hash": bob_hash}

print(f"Bob's Record   -> Salt: {bob_salt[:8]}..., Hash: {bob_hash[:8]}...")
print("Notice how their hashes are completely different despite having the same password! Rainbow tables are defeated.")

# --- Authentication with Salt ---
print("\\n--- Secure Authentication Process ---")
login_user = "alice"
login_pass = "password123"

# 1. Retrieve the specific user's salt from the database
stored_salt = secure_db[login_user]["salt"]
stored_hash = secure_db[login_user]["hash"]

# 2. Hash the login attempt combined with the retrieved salt
attempt_hash = hash_with_salt(login_pass, stored_salt)

# 3. Compare the resulting hashes
if attempt_hash == stored_hash:
    print("✅ Login successful (Salt validated securely!)")
else:
    print("❌ Login failed")`
      }
    },
    {
      title: 'Modern Standard: Key Derivation Functions (KDFs)',
      content: `<p>While Salting + SHA-256 defeats rainbow tables, it is still vulnerable to <em>Brute Force attacks</em> (trying every possible combination). Modern GPUs can compute billions of SHA-256 hashes per second.</p>
<p>The modern solution is <strong>Key Derivation Functions (like bcrypt, Argon2, or PBKDF2)</strong>. These algorithms deliberately add computational "cost" (work factor). By forcing the algorithm to loop thousands of times, generating a single hash takes 0.1 seconds instead of 0.0000001 seconds. This delay is unnoticeable to a user logging in, but destroys a hacker trying to brute-force a billion passwords.</p>`,
      note: 'In Python, the `bcrypt` library handles salting, hashing, and the work factor (cost) automatically in a single function call, making it the industry standard for backend password management.'
    }
  ],
  exercises: [
    'Modify the `hash_with_salt` function to prepend the salt to the beginning of the password instead of the end. Does it change the resulting hash? Does it change the security profile?',
    'Research the `bcrypt` algorithm. What does the "Work Factor" or "Cost" parameter do? Why might you need to increase this cost parameter every 3-5 years?',
    'A hacker steals your database containing salted hashes AND the salts themselves. Why are they still unable to use their Rainbow Table?',
  ],
  quiz: [
    {
      question: 'Which of the following is an essential property of a cryptographic hash function?',
      options: [
        'It uses a secret key to encrypt data that can later be decrypted by the server',
        'It produces a variable-length output depending on the size of the input file',
        'It is deterministic (the same input always yields the exact same output digest)',
        'It requires an active internet connection to verify signatures',
      ],
    },
    {
      question: 'What is the specific mechanics of a Rainbow Table attack?',
      options: [
        'Intercepting the password over an unencrypted Wi-Fi network before it reaches the server',
        'Using a massive pre-computed table of common passwords and their corresponding hashes to instantly reverse-lookup stolen database hashes',
        'Guessing passwords randomly in an automated loop until one works (Brute force)',
        'Exploiting a buffer overflow vulnerability in the SQL database engine',
      ],
    },
    {
      question: 'What is the primary cryptographic purpose of a "Salt" in password storage?',
      options: [
        'To make the password longer and harder for the user to type',
        'To encrypt the network connection between the client and server',
        'To ensure that identical passwords result in completely different hashes, neutralizing pre-computed dictionary and rainbow table attacks',
        'To prevent the database administrator from viewing the passwords',
      ],
    },
    {
      question: 'Why are algorithms like `bcrypt` or `Argon2` considered vastly superior to `SHA-256` for storing passwords?',
      options: [
        'Because they are much faster to execute on web servers',
        'Because they produce much shorter hashes that save database storage space',
        'They are deliberately slow (computationally expensive), which makes brute-force guessing attacks economically and temporally infeasible for hackers',
        'They are approved by the NSA for military use',
      ],
    }
  ]
};

window.LAB_DATA['topic-07_lab2'] = {
  title:      'Differential Privacy & AI Data Security',
  difficulty: 'Intermediate → Advanced',
  duration:   '120 minutes',
  overview:   'When training Machine Learning models or releasing aggregate statistics on highly sensitive data (like medical records), the model itself can memorize and leak private information about individuals in the training set. In this advanced lab, you will explore Membership Inference attacks, and implement Differential Privacy (DP) by adding mathematically calibrated Laplace noise, ensuring aggregate insights are preserved while individual privacy is mathematically guaranteed.',
  objectives: [
    'Understand the severe privacy risks in aggregate data releases (Differencing Attacks)',
    'Define the concept and mathematical guarantee of Differential Privacy',
    'Understand Query Sensitivity ($\Delta f$) and the Privacy Budget (Epsilon, $\epsilon$)',
    'Implement the Laplace Mechanism to inject statistical noise into queries',
    'Analyze and graph the fundamental trade-off between Privacy and Data Utility',
  ],
  steps: [
    {
      title: 'The Privacy Problem in Aggregate Data',
      content: `<p>Suppose you are a hospital administrator. You want to release the average age of patients with a rare disease. Releasing aggregate statistics (averages, sums, counts) seems safe because no names are attached. However, it is highly vulnerable to a <strong>Differencing Attack</strong>.</p>
<p>If an attacker knows the average age of 100 patients is 45.0, and a day later a new patient is admitted and the published average age of 101 patients shifts to 45.2, the attacker can use basic algebra to calculate the exact age of that 101st patient.</p>`,
      code: {
        language: 'python',
        content: `import numpy as np

# A secure database of 5 salaries (highly sensitive data)
salaries = np.array([50000, 60000, 45000, 55000, 120000]) # 120k is Alice's salary

# Query 1: The system publishes the sum of all salaries
sum_all = np.sum(salaries)

# Alice leaves the company. 
# Query 2: The system publishes the sum of the remaining salaries
sum_remaining = np.sum(salaries[:-1])

# The attacker computes Alice's exact salary with 100% certainty
alices_salary = sum_all - sum_remaining
print(f"🚨 Privacy Leaked! Alice's exact salary is isolated: $\\{alices_salary\\}")`
      }
    },
    {
      title: 'Differential Privacy: The Mathematical Guarantee',
      content: `<p><strong>Differential Privacy (DP)</strong> solves this by injecting carefully calibrated mathematical noise into the result of a database query (or the gradients of a neural network during training). The noise ensures that the presence or absence of any single individual in the database does not significantly affect the final output.</p>
<h4>Key Concepts</h4>
<ul>
  <li><strong>Sensitivity ($\Delta f$):</strong> The absolute maximum amount a single individual's data can change the query result. For a "counting" query (e.g., "How many people smoke?"), sensitivity is always exactly 1.</li>
  <li><strong>Epsilon ($\epsilon$):</strong> The "Privacy Budget". It quantifies the privacy loss. 
    <ul>
      <li>Smaller $\epsilon$ = More Noise injected = Higher Privacy = Lower Utility (accuracy).</li>
      <li>Larger $\epsilon$ = Less Noise injected = Lower Privacy = Higher Utility.</li>
    </ul>
  </li>
</ul>
<p>The standard way to add noise for numerical continuous queries is the <strong>Laplace Mechanism</strong>.</p>`,
      code: {
        language: 'python',
        content: `def laplace_mechanism(true_value, sensitivity, epsilon):
    """
    Add random noise drawn from the Laplace distribution to achieve Differential Privacy.
    """
    # The scale (spread) of the noise is proportional to the sensitivity
    # and inversely proportional to epsilon.
    scale = sensitivity / epsilon
    
    # Draw a random noise value centered at 0
    noise = np.random.laplace(loc=0.0, scale=scale)
    
    # Return the noisy aggregate result
    return true_value + noise

# Let's protect a sensitive counting query: "How many patients have HIV?"
true_count = 150
sensitivity = 1 # One person joining/leaving changes the count by max 1

print(f"True Exact Count: {true_count}\\n")

# --- Scenario A: High Privacy (Small Epsilon) ---
eps_high_privacy = 0.1
dp_count_high = laplace_mechanism(true_count, sensitivity, eps_high_privacy)
print(f"Count with High Privacy (ε={eps_high_privacy}): {dp_count_high:.1f}")
# Output might be 157.2 or 138.4. An attacker cannot know if the true count was 150 or 151.

# --- Scenario B: Low Privacy / High Utility (Large Epsilon) ---
eps_low_privacy = 2.0
dp_count_low = laplace_mechanism(true_count, sensitivity, eps_low_privacy)
print(f"Count with Low Privacy  (ε={eps_low_privacy}):  {dp_count_low:.1f}")
# Output might be 150.3. Much closer to the truth, but less plausible deniability.`
      }
    },
    {
      title: 'Analyzing the Privacy-Utility Trade-off',
      content: `<p>Adding noise protects privacy by providing individuals with <em>plausible deniability</em>, but it inherently degrades the accuracy (utility) of the data. As a Data Scientist, your job is to negotiate an $\epsilon$ value that satisfies legal/ethical privacy requirements while ensuring the data remains useful for analysis or machine learning.</p>`,
      code: {
        language: 'python',
        content: `import matplotlib.pyplot as plt

def simulate_queries(true_val, sens, eps, iterations=1000):
    """Simulates running the same query 1000 times to view the noise distribution."""
    results = [laplace_mechanism(true_val, sens, eps) for _ in range(iterations)]
    return results

true_val = 500
query_sensitivity = 1

# Simulate 1000 noisy queries across different privacy budgets
results_01 = simulate_queries(true_val, query_sensitivity, eps=0.1)  # Strict Privacy
results_05 = simulate_queries(true_val, query_sensitivity, eps=0.5)  # Moderate Privacy
results_20 = simulate_queries(true_val, query_sensitivity, eps=2.0)  # Lax Privacy

print("--- Accuracy vs Privacy Statistical Analysis ---")
print(f"True Database Value: {true_val}\\n")
print(f"ε=0.1 (Strict)   -> Mean: {np.mean(results_01):.1f}, StdDev: {np.std(results_01):.1f}")
print(f"ε=0.5 (Moderate) -> Mean: {np.mean(results_05):.1f}, StdDev: {np.std(results_05):.1f}")
print(f"ε=2.0 (Lax)      -> Mean: {np.mean(results_20):.1f}, StdDev: {np.std(results_20):.1f}")

print("\\nKey Takeaway: The DP mechanism is UNBIASED (the mean of the noisy queries is always centered around the true value), but the spread (Standard Deviation) increases dramatically as the privacy requirement gets stricter (smaller epsilon).")`
      },
      note: 'Differential Privacy is not theoretical; it is actively used in production. Apple uses Local DP to collect typing telemetry without seeing exact words, Google uses it in Chrome statistics, and the US Census Bureau applied it to the 2020 Census releases to prevent deanonymization.'
    },
    {
      title: 'Differential Privacy in Machine Learning (DP-SGD)',
      content: `<p>In modern AI, neural networks often accidentally memorize specific training examples (e.g., an LLM regurgitating a specific person's social security number). Attackers use <strong>Membership Inference Attacks</strong> to determine if a specific person was in the training dataset.</p>
<p>To prevent this, researchers use <strong>DP-SGD (Differentially Private Stochastic Gradient Descent)</strong>. During the backpropagation step of training, the algorithm:</p>
<ol>
  <li><strong>Clips Gradients:</strong> It mathematically limits how large any single training example's gradient can be (enforcing a known sensitivity).</li>
  <li><strong>Adds Noise:</strong> It injects Laplace or Gaussian noise directly into the gradients before updating the weights.</li>
</ol>
<p>This guarantees that the final AI model did not memorize any single user's specific data, only the general statistical patterns of the crowd.</p>`,
    }
  ],
  exercises: [
    'Assume you are querying a database for the AVERAGE salary of a company. To calculate the sensitivity ($\Delta f$), you need to know the maximum possible change one person can cause. How does a massive outlier (e.g., a CEO making $50M) ruin the sensitivity calculation, and how might you fix the data before applying DP?',
    'What happens to your total privacy budget ($\epsilon$) if you ask 10 different questions about the exact same database using $\epsilon=0.2$ for each query? (Hint: Research the "Composition Theorem" in DP).',
    'Why is it a severe security violation to allow a user to run the exact same Differentially Private query thousands of times?',
  ],
  quiz: [
    {
      question: 'In Differential Privacy, what does a smaller Epsilon ($\epsilon$) value signify?',
      options: [
        'More privacy (a wider spread of noise added) at the cost of less data utility',
        'Less privacy (less noise added) but higher data utility',
        'The query will execute faster on the database server',
        'The sensitivity of the mathematical query is reduced',
      ],
    },
    {
      question: 'What is the "Sensitivity" ($\Delta f$) of a query in the context of the Laplace Mechanism?',
      options: [
        'How emotionally or politically sensitive the data is (e.g., medical data vs weather data)',
        'The probability that a hacker intercepts the query over the network',
        'The maximum mathematical amount the query result could possibly change if a single person\'s data is added or removed from the database',
        'The number of decimal places returned by the SQL engine',
      ],
    },
    {
      question: 'If you allow a data analyst to run the exact same noisy query 1,000 times, what happens?',
      options: [
        'The noise scales up exponentially, protecting the data further',
        'Nothing, the data remains perfectly private',
        'The privacy guarantee is destroyed. By averaging the 1,000 noisy responses together, the noise cancels out and reveals the exact true value',
        'The database will crash due to Laplace overflow',
      ],
    },
    {
      question: 'How does DP-SGD (Differentially Private Stochastic Gradient Descent) protect AI models?',
      options: [
        'It encrypts the model weights before saving them to disk',
        'It clips the gradients to a maximum norm and injects noise into the gradients during training, preventing the model from memorizing any specific training sample',
        'It hashes all the training data before feeding it to the input layer',
        'It requires the user to input a password before running inference',
      ],
    }
  ]
};
