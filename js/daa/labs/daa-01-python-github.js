/* ============================================================
   DAA Topic 01 — Python + GitHub Integration
   Lab 1: Python Foundations & Your First GitHub Repository
   Lab 2: Python Deep Dive: Dictionaries, Control Flow, Loops & Functions
   Source material: DACademy Python Lesson 1 & 2, GITHUB slides
   ============================================================ */

window.DAA_LAB_DATA = window.DAA_LAB_DATA || {};

/* Shared Colab walkthrough used by several DAA labs */
window.DAA_COLAB_GUIDE = `
<ol>
  <li>Open <strong>colab.research.google.com</strong> in Chrome, Edge or Firefox and sign in with your Google account.</li>
  <li>In the pop-up, click <strong>New notebook</strong> (or go to <strong>File → New notebook in Drive</strong>).</li>
  <li>Click the title <code>Untitled0.ipynb</code> at the top left and rename it, e.g. <code>DAA_Topic1_Lab1.ipynb</code>.</li>
  <li>Click <strong>Connect</strong> (top right). When you see a green tick with RAM/Disk bars, Colab has given you a free cloud computer (a <em>runtime</em>).</li>
  <li>Click inside the grey box (a <strong>code cell</strong>), paste code, and press <strong>Shift + Enter</strong> (or click the ▶ button on the left of the cell) to run it. Output appears directly under the cell.</li>
  <li>Use <strong>+ Code</strong> to add a new code cell and <strong>+ Text</strong> to add notes. Keep one idea per cell so you can re-run pieces independently.</li>
  <li>Your notebook auto-saves to <strong>Google Drive → My Drive → Colab Notebooks</strong>. Use <strong>File → Save</strong> (Ctrl + S) any time.</li>
</ol>`;

window.DAA_COLAB_UPLOAD = `
<ol>
  <li>Download the dataset using the green button on this page. It saves to your computer's <em>Downloads</em> folder.</li>
  <li>In Colab, click the <strong>📁 Files</strong> icon in the left sidebar.</li>
  <li>Click the <strong>Upload</strong> icon (a page with an up arrow) and choose the CSV file, or drag the file into the Files panel.</li>
  <li>Wait until the file appears in the list. It is now stored at <code>/content/&lt;file name&gt;</code>.</li>
  <li>Because the notebook's working folder is <code>/content</code>, you can load it with just the file name, e.g. <code>pd.read_csv('titanic.csv')</code>.</li>
</ol>
<p><strong>Important:</strong> uploaded files are deleted when the runtime restarts or disconnects (after ~90 minutes idle). If you see <code>FileNotFoundError</code>, simply upload the file again.</p>`;

/* ─────────────────────────────────────────────────────────────
   LAB 1 — Python Foundations & Your First GitHub Repository
   ───────────────────────────────────────────────────────────── */
window.DAA_LAB_DATA['daa-01_lab1'] = {
  title:      'Python Foundations & Your First GitHub Repository',
  difficulty: 'Simple → Intermediate',
  duration:   '2 hours',
  overview:   'Python is the lingua franca of data and AI. In this lab you set up Google Colab, learn Python\'s core building blocks (data types, variables, operators, control flow, lists, tuples and dictionaries) and finish with a mini data-processing task. You then learn how Git and GitHub let data teams share, review and showcase code, create your first repository, and save your Colab notebook to GitHub.',
  objectives: [
    'Set up and navigate Google Colab confidently (cells, runtime, saving)',
    'Use Python\'s primitive types, variables, casting, input and output',
    'Write decisions and loops with if/elif/else, for, while, break and continue',
    'Choose between lists, tuples and dictionaries for a task',
    'Process a raw CSV string into numbers and compute statistics',
    'Explain Git vs GitHub and complete the repo → branch → commit → pull request → merge flow',
    'Save a Colab notebook into your own GitHub repository',
  ],
  steps: [
    {
      title: 'How This Lab Works',
      content: `<p>Every DAA lab follows the same rhythm, so it is worth understanding it once:</p>
<ol>
  <li><strong>Read the step</strong>: each step explains one concept in plain language with a real-world analogy.</li>
  <li><strong>Copy the code into Google Colab</strong>: use the 📋 <strong>Copy</strong> button on any code block and paste it into a new Colab cell.</li>
  <li><strong>Run it in Colab</strong>, then click <strong>▶ Show Output</strong> here to compare your result with the expected output. If they differ, read the code again line by line; that is how programmers debug.</li>
  <li><strong>Pass the Knowledge Check</strong> at the end (80% or more) to complete the lab and move towards your topic badge.</li>
</ol>
<h4>What you need</h4>
<ul>
  <li>A laptop with a modern browser (Chrome recommended).</li>
  <li>A Google account (for Colab) and an email address (for GitHub).</li>
  <li>About 2 hours. Take breaks between sections; nothing is lost because Colab saves automatically.</li>
</ul>`,
      note: 'Typing the code yourself (instead of pasting) is slower but builds muscle memory much faster. Try typing at least the short examples.',
    },
    {
      title: 'Set Up Google Colab (Step by Step)',
      content: `<p><strong>Google Colab</strong> is a free, browser-based Jupyter notebook. You write Python in <em>cells</em>, run them on Google's cloud computers, and see results immediately. Nothing needs to be installed on your laptop.</p>
${window.DAA_COLAB_GUIDE}
<h4>Your first cell</h4>
<p>Paste the code below into the first cell and run it with <strong>Shift + Enter</strong>. It prints a greeting and the Python version Colab is using.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `import sys

print("Hello, Data Analytics Academy!")
print("Python version:", sys.version.split()[0])`,
      },
      after: `<p>Your Python version may be newer or older than the one shown. That is fine for everything in this course.</p>`,
      note: 'If a cell seems stuck (the ▶ icon keeps spinning), click Runtime → Interrupt execution, then run it again.',
    },
    {
      title: 'Why Python for Data & AI?',
      content: `<p><strong>Python</strong> is an interpreted, high-level, general-purpose language. "Interpreted" means you can run code line by line and see results instantly, which is perfect for exploring data.</p>
<h4>Why data teams choose it</h4>
<ul>
  <li><strong>Readability:</strong> the syntax reads almost like English, so analysts and engineers can review each other's work.</li>
  <li><strong>Massive ecosystem:</strong> Pandas (tables), NumPy (maths), Scikit-learn (machine learning), Matplotlib/Seaborn (charts), TensorFlow/PyTorch (deep learning).</li>
  <li><strong>Versatility:</strong> the same language handles web scraping, automation, APIs and dashboards.</li>
  <li><strong>Community:</strong> almost any error message you meet has been answered online.</li>
</ul>
<h4>Two kinds of development environment</h4>
<table>
  <tr><th>Notebooks (Jupyter, Colab)</th><th>IDEs (VS Code, PyCharm)</th></tr>
  <tr><td>Run code cell by cell, mixing code, charts and notes.</td><td>Full applications for writing, debugging and managing large projects.</td></tr>
  <tr><td>Best for <strong>exploring data</strong>, prototyping and sharing analyses.</td><td>Best for <strong>production code</strong>, testing, and version control with teams.</td></tr>
</table>
<p>In this course you learn in Colab. In industry, finished data pipelines usually move into VS Code and GitHub, which is why this topic also teaches GitHub.</p>`,
    },
    {
      title: 'Primitive Data Types & Variables',
      content: `<p>Every value in Python has a <strong>type</strong>. The four primitive types you will use constantly:</p>
<table>
  <tr><th>Type</th><th>What it stores</th><th>Example</th></tr>
  <tr><td><code>int</code></td><td>Whole numbers</td><td><code>age = 25</code></td></tr>
  <tr><td><code>float</code></td><td>Numbers with a decimal point</td><td><code>price = 19.99</code></td></tr>
  <tr><td><code>str</code></td><td>Text, inside quotes</td><td><code>name = "Alice"</code></td></tr>
  <tr><td><code>bool</code></td><td><code>True</code> or <code>False</code></td><td><code>is_active = True</code></td></tr>
</table>
<p>A <strong>variable</strong> is a labelled container for a value. Python is <em>dynamically typed</em>: you never declare the type; Python works it out from the value. The built-in <code>type()</code> function tells you what Python decided.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `# Variables: a name, an equals sign, and a value
age = 25
price = 19.99
name = "Alice"
is_active = True

# type() reveals how Python stored each value
print(type(age))
print(type(price))
print(type(name))
print(type(is_active))`,
      },
      after: `<p>Data type errors are the most common bug in data cleaning. A price stored as the text <code>"19.99"</code> cannot be added to another price until it is converted to a number, which is the next step.</p>`,
    },
    {
      title: 'Comments, Output, Input & Type Conversion',
      content: `<ul>
  <li><strong>Comments</strong> start with <code>#</code>. Python ignores them; humans rely on them to understand <em>why</em> code exists.</li>
  <li><strong>Output:</strong> <code>print()</code> displays values. Use <strong>f-strings</strong> (<code>f"Total: {total}"</code>) to put variables inside text.</li>
  <li><strong>Input:</strong> <code>input()</code> pauses and waits for the user to type. It <em>always</em> returns a string.</li>
  <li><strong>Casting:</strong> <code>int()</code>, <code>float()</code>, <code>str()</code> and <code>bool()</code> convert between types.</li>
</ul>
<p>Try this interactive cell in Colab. A text box appears under the cell; type a number and press Enter.</p>`,
      code: [
        {
          language: 'python',
          content: `# input() always gives back text (str)
birth_year = input("What year were you born? ")
print(type(birth_year))

# Convert the text to a number before doing maths
age = 2026 - int(birth_year)
print(f"You are about {age} years old.")`,
        },
        {
          language: 'python',
          run: true,
          content: `# The same idea without input(): data from a file usually arrives as text
raw_price = "19.99"
raw_quantity = "3"

# "19.99" + "3" would join the text, not add the numbers
print(raw_price + raw_quantity)

# Cast first, then calculate
total = float(raw_price) * int(raw_quantity)
print(f"Total cost: {total:.2f}")`,
        },
      ],
      after: `<p><code>{total:.2f}</code> inside an f-string formats the number to 2 decimal places, which is useful for money.</p>`,
      warning: 'int("19.99") raises a ValueError because "19.99" is not a whole number. Convert to float first, or use int(float("19.99")).',
    },
    {
      title: 'Operators: Arithmetic, Comparison & Logical',
      content: `<table>
  <tr><th>Kind</th><th>Operators</th><th>Result</th></tr>
  <tr><td>Arithmetic</td><td><code>+ - * /</code>, <code>**</code> (power), <code>%</code> (remainder), <code>//</code> (whole-number division)</td><td>A number</td></tr>
  <tr><td>Comparison</td><td><code>== != &gt; &lt; &gt;= &lt;=</code></td><td><code>True</code> / <code>False</code></td></tr>
  <tr><td>Logical</td><td><code>and</code>, <code>or</code>, <code>not</code></td><td>Combines True/False values</td></tr>
</table>
<p>Note the difference between <code>=</code> (assign a value) and <code>==</code> (ask "are these equal?").</p>`,
      code: {
        language: 'python',
        run: true,
        content: `a, b = 17, 5

print("a + b  =", a + b)
print("a / b  =", a / b)     # always returns a float
print("a // b =", a // b)    # whole-number part only
print("a % b  =", a % b)     # remainder: handy for "is this even?"
print("a ** 2 =", a ** 2)

score, attendance = 72, 81
print("Passed exam?", score >= 60)
print("Eligible for certificate?", score >= 60 and attendance >= 75)
print("Needs follow-up?", not (score >= 60))`,
      },
    },
    {
      title: 'Control Flow: Decisions and Loops',
      content: `<p><strong>Conditionals</strong> (<code>if</code> / <code>elif</code> / <code>else</code>) run different code depending on a condition. <strong>Indentation</strong> (4 spaces) is mandatory: it tells Python which lines belong to which block.</p>
<p><strong>Loops</strong> repeat work:</p>
<ul>
  <li><code>for</code> loops go through a sequence a known number of times (each item in a list, each number in a range).</li>
  <li><code>while</code> loops keep going <em>as long as</em> a condition stays true.</li>
  <li><code>continue</code> skips to the next round; <code>break</code> exits the loop completely.</li>
</ul>
<p><strong>Analogy:</strong> a web scraper visits a list of URLs one by one with a <code>for</code> loop. It uses <code>continue</code> to skip a broken link, and <code>break</code> to stop entirely if the server blocks it.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `urls = ["site.com/page1", "site.com/page2", "BROKEN", "site.com/page4", "BLOCKED", "site.com/page6"]

for url in urls:
    if url == "BROKEN":
        print("Skipping a broken link")
        continue
    elif url == "BLOCKED":
        print("Server blocked us, stopping the scraper")
        break
    else:
        print("Scraping", url)

# while loop: keep doubling savings until they pass a target
savings, months = 100, 0
while savings < 1000:
    savings = savings * 2
    months = months + 1
print(f"Reached {savings} after {months} months")`,
      },
      note: 'Always make sure something inside a while loop changes the condition; otherwise the loop never ends. If that happens in Colab, click the ■ stop button next to the cell.',
    },
    {
      title: 'Core Data Structures: Lists, Tuples & Dictionaries',
      content: `<table>
  <tr><th>Structure</th><th>Syntax</th><th>Ordered?</th><th>Changeable?</th><th>Use it for</th></tr>
  <tr><td>List</td><td><code>[ ]</code></td><td>Yes</td><td>Yes</td><td>A sequence that grows or changes (daily prices)</td></tr>
  <tr><td>Tuple</td><td><code>( )</code></td><td>Yes</td><td><strong>No</strong></td><td>Values that must not change (GPS coordinates)</td></tr>
  <tr><td>Dictionary</td><td><code>{key: value}</code></td><td>Keeps insertion order</td><td>Yes</td><td>Looking things up by name (ticker → company info)</td></tr>
</table>
<p><strong>Analogy:</strong> a list is a chronological ledger of daily market prices; a dictionary is a lookup table mapping a company's ticker symbol to its attributes.</p>
<p>Python uses <strong>zero-based indexing</strong>: the first item is at position <code>0</code>. Slicing <code>my_list[start:end]</code> includes <code>start</code> but stops <em>before</em> <code>end</code>.</p>`,
      code: [
        {
          language: 'python',
          run: true,
          content: `# Lists
prices = [10, 20, 30, 40, 50]
print(prices[1])        # indexing -> 20
print(prices[1:3])      # slicing  -> [20, 30]
print(prices[-1])       # negative index counts from the end -> 50

prices.append(60)       # add to the end
prices.remove(10)       # remove the first matching value
print(prices, "has", len(prices), "items")`,
        },
        {
          language: 'python',
          run: true,
          content: `# Dictionaries: access by key, not position
person = {"name": "Alice", "age": 25}
print(person["name"])
print(person.get("email", "no email on file"))   # .get() avoids errors for missing keys

person["role"] = "Analyst"                       # add a new key-value pair
print(person)`,
        },
        {
          language: 'python',
          run: true,
          expectError: true,
          content: `# Tuples are immutable: trying to change one raises an error
coordinates = (1.3521, 103.8198)
print(coordinates[0])
coordinates[0] = 0`,
        },
      ],
      after: `<p>The <code>TypeError</code> in the last cell is expected. Immutability protects data from accidental changes, which is exactly why you would choose a tuple.</p>`,
    },
    {
      title: 'Mini-Task: Process a Raw Dataset',
      content: `<p>Real data often arrives as plain text. Here you simulate reading a small CSV file of sales, then turn it into numbers and compute a statistic, all with the tools from this lab.</p>
<h4>Your task</h4>
<ol>
  <li>Split the raw text into rows, then each row into columns.</li>
  <li>Skip the header row.</li>
  <li>Cast the <code>units</code> and <code>price</code> text into numbers.</li>
  <li>Compute revenue per row, total revenue and the average price.</li>
</ol>
<p>Try it yourself first, then compare with the solution below.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `raw_csv = """product,units,price
Notebook,12,3.50
Pen,40,1.20
Backpack,3,45.00
Calculator,5,22.90"""

rows = raw_csv.split("\\n")          # 1. one string per line
header = rows[0].split(",")
print("Columns:", header)

total_revenue = 0
prices = []
for row in rows[1:]:                # 2. skip the header
    product, units, price = row.split(",")
    units = int(units)              # 3. cast text to numbers
    price = float(price)
    revenue = units * price
    prices.append(price)
    total_revenue += revenue
    print(f"{product:<11} {units:>3} x {price:>6.2f} = {revenue:>7.2f}")

print(f"Total revenue: {total_revenue:.2f}")                      # 4. statistics
print(f"Average price: {sum(prices) / len(prices):.2f}")`,
      },
    },
    {
      title: 'Mini-Task: Student Score Summary',
      content: `<p>A common structure for records is a <strong>list of dictionaries</strong>: one dictionary per student. Your task:</p>
<ol>
  <li>Extract all scores.</li>
  <li>Calculate the average score.</li>
  <li>Count how many students passed (score ≥ 70).</li>
  <li>Print a formatted summary.</li>
</ol>`,
      code: {
        language: 'python',
        run: true,
        content: `students = [
    {"name": "Aisha", "score": 88},
    {"name": "Ben", "score": 64},
    {"name": "Chen", "score": 91},
    {"name": "Divya", "score": 70},
    {"name": "Ethan", "score": 55},
]

scores = [s["score"] for s in students]      # a list comprehension: build a list in one line
average = sum(scores) / len(scores)

passed = 0
for s in students:
    if s["score"] >= 70:
        passed += 1

print(f"Students: {len(students)}")
print(f"Average score: {average:.1f}")
print(f"Passed: {passed} | Failed: {len(students) - passed}")
print("Top scorer:", max(students, key=lambda s: s["score"])["name"])`,
      },
      note: 'The list comprehension [s["score"] for s in students] is a compact way to write a for loop that builds a list. You will see it everywhere in data code.',
    },
    {
      title: 'Git vs GitHub: Core Concepts',
      content: `<p><strong>GitHub</strong> is a cloud platform to store, share and collaborate on coding projects, and to showcase your work like an online portfolio. It is built on <strong>Git</strong>.</p>
<table>
  <tr><th>Git</th><th>GitHub</th></tr>
  <tr><td>Software: a version-control tool that tracks every change to your code.</td><td>Service: a website that hosts Git projects online.</td></tr>
  <tr><td>Installed on your computer.</td><td>Accessible from anywhere through the internet.</td></tr>
  <tr><td>Lets you revert to earlier versions locally.</td><td>Adds collaboration: reviews, issues, discussions, a community.</td></tr>
</table>
<p><strong>Analogy:</strong> Git is a diary that records every draft and edit of your story. GitHub is the online library where you publish that diary so others can read it, comment and suggest edits.</p>
<h4>Four words you must know</h4>
<ul>
  <li><strong>Repository (repo):</strong> a project folder that stores your code, data and its full history.</li>
  <li><strong>Commit:</strong> a saved snapshot of your files at a point in time, with a message explaining the change.</li>
  <li><strong>Branch:</strong> a separate line of work where you can change things without affecting the main code.</li>
  <li><strong>Pull request (PR):</strong> a proposal to merge your branch's changes into the main branch, so others can review first.</li>
</ul>
<p>Also useful: <strong>fork</strong> (copy someone else's repo to your account), <strong>clone</strong> (download a repo to your computer), <strong>issue</strong> (report a bug or idea), and line comments inside a PR.</p>`,
    },
    {
      title: 'Hands-On: Create a Repo, Branch, Commit & Merge',
      content: `<p>Follow these steps on <strong>github.com</strong>. Everything happens in the browser.</p>
<h4>A. Create your account</h4>
<ol>
  <li>Go to <strong>github.com</strong> → <strong>Sign up</strong>. Choose a professional username (employers will see it).</li>
  <li>Verify your email, then sign in to your dashboard.</li>
</ol>
<h4>B. Create your first repository</h4>
<ol>
  <li>Click the green <strong>New</strong> button (or ➕ → <strong>New repository</strong>).</li>
  <li>Name it <code>hello-world</code> and add a description, e.g. "Practising the GitHub flow".</li>
  <li>Choose <strong>Public</strong>, tick <strong>Add a README file</strong>, then click <strong>Create repository</strong>.</li>
</ol>
<h4>C. Create a branch</h4>
<ol>
  <li>On the <strong>Code</strong> tab, click the branch dropdown that says <code>main</code>.</li>
  <li>Type <code>readme-edits</code> and click <strong>Create branch: readme-edits from main</strong>.</li>
</ol>
<h4>D. Edit and commit</h4>
<ol>
  <li>While on <code>readme-edits</code>, open <code>README.md</code> and click the ✏️ pencil icon.</li>
  <li>Add a short introduction about yourself and what you are learning.</li>
  <li>Click <strong>Commit changes…</strong>, write a clear message such as <code>Add personal introduction to README</code>, and commit to the <code>readme-edits</code> branch.</li>
</ol>
<h4>E. Open and merge a pull request</h4>
<ol>
  <li>Go to the <strong>Pull requests</strong> tab → <strong>New pull request</strong>.</li>
  <li>Set <strong>base: main</strong> and <strong>compare: readme-edits</strong>. Review the green (added) and red (removed) lines.</li>
  <li>Click <strong>Create pull request</strong>, give it a descriptive title and explain what you changed and why.</li>
  <li>Click <strong>Merge pull request</strong> → <strong>Confirm merge</strong>, then <strong>Delete branch</strong> to keep the repo tidy.</li>
</ol>`,
      note: 'Good commit messages start with a verb and say what changed: "Fix typo in README", "Add sales analysis notebook". Future you (and your team) will thank you.',
    },
    {
      title: 'Save Your Colab Notebook to GitHub',
      content: `<p>Colab can commit a notebook straight into your repository, which is how you build a public portfolio of your DAA work.</p>
<ol>
  <li>In your Colab notebook, click <strong>File → Save a copy in GitHub</strong>.</li>
  <li>The first time, a pop-up asks you to <strong>authorise Colab</strong> to access GitHub. Sign in and approve (tick <em>include private repos</em> only if you need it).</li>
  <li>Choose your repository (<code>hello-world</code>), the branch (<code>main</code>), and a file path such as <code>python/DAA_Topic1_Lab1.ipynb</code>.</li>
  <li>Write a commit message like <code>Add Python foundations lab</code> and keep <strong>Include a link to Colaboratory</strong> ticked.</li>
  <li>Click <strong>OK</strong>. Open your repo on GitHub: the notebook is there, rendered with its outputs.</li>
</ol>
<h4>Git command cheat sheet (for when you work on your own computer)</h4>
<p>You don't need these in Colab today, but you will meet them in VS Code and in job interviews.</p>`,
      code: {
        language: 'bash',
        content: `git config --global user.name "Your Name"          # one-time setup
git config --global user.email "you@example.com"

git clone https://github.com/<you>/hello-world.git  # download a repo
git checkout -b analysis-update                     # create and switch to a new branch
git status                                          # what changed?
git add notebook.ipynb                              # stage a file for the next commit
git commit -m "Add sales analysis"                  # snapshot with a message
git push origin analysis-update                     # send commits to GitHub
git pull                                            # bring down teammates' changes
git log                                             # view commit history
git merge analysis-update                           # combine a branch into the current one`,
      },
    },
  ],
  quiz: [
    {
      question: 'What does <code>type("19.99")</code> return in Python?',
      options: ['<code>float</code>', '<code>str</code>', '<code>int</code>', '<code>bool</code>'],
      answer: 1,
    },
    {
      question: 'Why must you convert the result of <code>input()</code> before doing maths with it?',
      options: [
        'input() returns None until the user presses Enter',
        'input() always returns a string, even if the user types digits',
        'input() returns a list of characters',
        'Maths is not allowed on values typed by users',
      ],
      answer: 1,
    },
    {
      question: 'Given <code>prices = [10, 20, 30, 40]</code>, what is <code>prices[1:3]</code>?',
      options: ['<code>[10, 20, 30]</code>', '<code>[20, 30, 40]</code>', '<code>[20, 30]</code>', '<code>[10, 20]</code>'],
      answer: 2,
    },
    {
      question: 'Which data structure should you use for values that must never change, such as a pair of GPS coordinates?',
      options: ['List', 'Dictionary', 'Tuple', 'String'],
      answer: 2,
    },
    {
      question: 'Inside a loop, what does <code>continue</code> do?',
      options: [
        'Exits the loop completely',
        'Skips the rest of the current iteration and moves to the next one',
        'Restarts the loop from the first item',
        'Pauses the program until the user presses Enter',
      ],
      answer: 1,
    },
    {
      question: 'What is the result of <code>17 % 5</code>?',
      options: ['3.4', '3', '2', '85'],
      answer: 2,
    },
    {
      question: 'Which statement best describes the difference between Git and GitHub?',
      options: [
        'They are two names for the same tool',
        'Git is a version-control tool on your computer; GitHub is an online platform that hosts Git repositories for collaboration',
        'GitHub is installed locally; Git is a website',
        'Git is only for Python code, GitHub is for any language',
      ],
      answer: 1,
    },
    {
      question: 'What is a pull request?',
      options: [
        'Downloading a repository to your computer',
        'A snapshot of your files with a message',
        'A proposal to merge changes from one branch into another so they can be reviewed first',
        'A request to delete a repository',
      ],
      answer: 2,
    },
    {
      question: 'Why do we create a branch before editing the README?',
      options: [
        'GitHub does not allow editing on main',
        'To make changes without affecting the main code until they are reviewed and merged',
        'Branches make files load faster',
        'A branch is required to add a README',
      ],
      answer: 1,
    },
    {
      question: 'In Colab, how do you run the current cell?',
      options: ['Ctrl + S', 'Shift + Enter', 'Alt + F4', 'Double-click the notebook title'],
      answer: 1,
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   LAB 2 — Python Deep Dive
   ───────────────────────────────────────────────────────────── */
window.DAA_LAB_DATA['daa-01_lab2'] = {
  title:      'Python Deep Dive: Dictionaries, Control Flow, Loops & Functions',
  difficulty: 'Intermediate → Advanced',
  duration:   '2 hours',
  overview:   'Building on Lab 1, you go deeper into the Python you will use every day as a data analyst: dictionaries (including nested dictionaries that look just like JSON from an API), string formatting, conditionals, range(), loops and loop-control statements, and writing your own reusable functions. You finish by solving ten practice tasks and a capstone "report card" program, then push your notebook to GitHub.',
  objectives: [
    'Create, read, update and delete entries in dictionaries and nested dictionaries',
    'Format output with f-strings and str.format()',
    'Generate sequences with range() and loop over them with for and while',
    'Use break, continue and pass correctly',
    'Write functions with parameters, return values and multiple returns',
    'Combine lists, dictionaries, loops and functions to solve realistic tasks',
  ],
  steps: [
    {
      title: 'Open a New Colab Notebook',
      content: `<p>Start a fresh notebook for this lab so each lab has its own file in your portfolio.</p>
${window.DAA_COLAB_GUIDE}
<p>Name it <code>DAA_Topic1_Lab2.ipynb</code>. Add a <strong>+ Text</strong> cell at the top with a heading such as <code># Python Deep Dive</code> and today's date. Documenting your notebooks is a professional habit.</p>`,
      note: 'Colab text cells use Markdown: # for headings, **bold**, - for bullet points.',
    },
    {
      title: 'Working with Dictionaries',
      content: `<p>A <strong>dictionary</strong> stores data as <code>key: value</code> pairs. Keys are unique; values can be anything. Real-life example: the personal details you submit on a form (name, age, date of birth).</p>
<ul>
  <li><code>d["key"]</code> reads a value, but raises <code>KeyError</code> if the key is missing.</li>
  <li><code>d.get("key")</code> returns <code>None</code> (or a default you choose) instead of crashing.</li>
  <li><code>len(d)</code> counts the key-value pairs.</li>
</ul>`,
      code: {
        language: 'python',
        run: true,
        content: `empty = {}
print(empty)

elly = {
    "first_name": "Elly",
    "last_name": "H",
    "age": 33,
    "tattoos": False,
}
print(elly)
print("Last name:", elly["last_name"])
print("Number of fields:", len(elly))

email = elly.get("email")
if email is None:
    print("User has no email")
else:
    print("Email address is:", email)`,
      },
    },
    {
      title: 'Conditionals & String Formatting',
      content: `<p>There are two common ways to put values inside text:</p>
<ul>
  <li><strong>f-strings</strong> (recommended): <code>f"{b} is less than {a}"</code></li>
  <li><strong>str.format()</strong>: <code>"{0} is less than {1}".format(b, a)</code>. The numbers refer to the position of each argument.</li>
</ul>
<p>Combine them with <code>if</code>, <code>elif</code> and <code>else</code> to report results clearly.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `a, b, c = 5, 3, 5

if b < a:
    print(f"{b} is less than {a}")

if a < b:
    print("{0} is less than {1}".format(a, b))
else:
    print("{0} is greater than or equal to {1}".format(a, b))

if a < c:
    print(f"{a} is less than {c}")
elif a > c:
    print(f"{a} is greater than {c}")
else:
    print("a and c are equal")`,
      },
    },
    {
      title: 'Generating Sequences with range()',
      content: `<p><code>range(start, stop, step)</code> produces numbers from <code>start</code> up to <em>but not including</em> <code>stop</code>, jumping by <code>step</code>.</p>
<table>
  <tr><th>Call</th><th>Produces</th></tr>
  <tr><td><code>range(5)</code></td><td>0, 1, 2, 3, 4</td></tr>
  <tr><td><code>range(2, 10, 2)</code></td><td>2, 4, 6, 8</td></tr>
  <tr><td><code>range(5, -5, -1)</code></td><td>5, 4, 3, … , -4 (counting down)</td></tr>
</table>
<p>Wrap it in <code>list()</code> to see all the numbers at once.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `print(list(range(10)))
print(list(range(5, -5, -1)))
print(list(range(2, 29, 2)))      # 14 even numbers starting at 2

for i in range(5):
    print("Iteration", i)`,
      },
    },
    {
      title: 'Loops & Loop Control: break, continue, pass',
      content: `<p><strong>for vs while:</strong> use <code>for</code> when you know what you are iterating over (a list, a range). Use <code>while</code> when you don't know how many rounds you need, for example reading input until the user types "quit".</p>
<table>
  <tr><th>Statement</th><th>Effect</th></tr>
  <tr><td><code>break</code></td><td>Stops the loop completely.</td></tr>
  <tr><td><code>continue</code></td><td>Skips the rest of this round, jumps to the next.</td></tr>
  <tr><td><code>pass</code></td><td>Does nothing. A placeholder where Python requires a statement (e.g. code you will write later).</td></tr>
</table>`,
      code: [
        {
          language: 'python',
          run: true,
          content: `n = 1
while n <= 100:
    print(n, end=" ")
    n = n + 1
    if n > 10:
        break
print("\\nThe while loop ends here")

for num in range(6):
    if num == 4:
        continue
    print("Printed number:", num)`,
        },
        {
          language: 'python',
          run: true,
          content: `# pass does NOT skip anything: the print below still runs for 4
for num in range(6):
    if num == 4:
        pass   # placeholder: "handle 4 later"
    print("Number:", num)

# Loop with an index using range(len(...)) or, more simply, enumerate()
items = ["hi", "my", "name", "is", "Jeff"]
for i, word in enumerate(items):
    print(i, word)`,
        },
      ],
      warning: 'A common misunderstanding: pass is not the same as continue. pass does nothing and the loop body carries on; continue jumps straight to the next iteration.',
    },
    {
      title: 'Dictionaries in Depth: Keys, Values, Items & Nesting',
      content: `<ul>
  <li><code>.keys()</code>, <code>.values()</code> and <code>.items()</code> let you loop through a dictionary.</li>
  <li>A <strong>nested dictionary</strong> is a dictionary inside a dictionary. Data from web APIs (JSON) looks exactly like this.</li>
  <li>Change a value with <code>d[key] = new_value</code>; add a key the same way; remove one with <code>del d[key]</code>.</li>
</ul>`,
      code: [
        {
          language: 'python',
          run: true,
          content: `richard = {"first_name": "Richard", "last_name": "Anderson", "age": 45, "tattoos": True}

print(richard.keys())
print(richard.values())
for key, value in richard.items():
    print(f"key = {key}, value = {value}")

richard["last_name"] = "Todd"                 # update
richard["email"] = "richard148@example.com"   # add
print("After update:", richard)
del richard["email"]                          # delete
print("After delete:", richard)`,
        },
        {
          language: 'python',
          run: true,
          content: `school_records = {
    "001": {"name": "Ryan", "grade": 12, "avg_score": 95},
    "002": {"name": "Jaslyn", "grade": 12, "avg_score": 90},
    "003": {"name": "Ronald", "grade": 10, "avg_score": 55},
}

# Nested access: outer key, then inner key
print(school_records["001"]["name"])
school_records["001"]["name"] = "Ryan Tan"

# Present every record with a double loop
for student_id, info in school_records.items():
    print("\\nStudent ID:", student_id)
    for key in info:
        print(f"  {key}: {info[key]}")`,
        },
      ],
    },
    {
      title: 'Functions: Defining and Calling',
      content: `<p>A <strong>function</strong> is a named group of statements that performs one task. Functions break a program into small, testable, reusable modules instead of one long script.</p>
<ul>
  <li><code>def name(parameters):</code> defines it; the indented body does the work.</li>
  <li><code>return</code> sends a value back. Return several values separated by commas; Python packs them into a tuple.</li>
  <li>Call it with arguments: <code>name(5, 7)</code>.</li>
</ul>`,
      code: [
        {
          language: 'python',
          run: true,
          content: `import math

def addition(num1, num2):
    total = num1 + num2
    return total

def circle_properties(radius):
    """Return the area and circumference of a circle."""
    area = math.pi * radius ** 2
    circumference = 2 * math.pi * radius
    return area, circumference

def is_palindrome(word):
    word = word.lower().replace(" ", "")
    return word == word[::-1]        # [::-1] reverses a string

print(addition(5, 7))
area, circumference = circle_properties(5)
print(f"Area: {area:.2f}, Circumference: {circumference:.2f}")
print(is_palindrome("taco cat"), is_palindrome("data"))`,
        },
        {
          language: 'python',
          run: true,
          content: `import random

def magic_8_ball():
    responses = ["Yes", "No", "It is certain", "Without a doubt", "Reply hazy, try again",
                 "Don't count on it", "Outlook not so good", "You may rely on it"]
    return random.choice(responses)

def roll_dice():
    die1 = random.randint(1, 6)
    die2 = random.randint(1, 6)
    return die1, die2, die1 + die2

print("Will I pass the quiz?", magic_8_ball())
print("Dice roll (die 1, die 2, total):", roll_dice())`,
        },
      ],
      note: 'The random functions give different answers every run, so your output will not match exactly. That is expected.',
    },
    {
      title: 'Practice Set: Lists, Tuples & Sorting',
      content: `<p>Try each task in its own Colab cell <strong>before</strong> revealing the solution with ▶ Show Output.</p>
<ol>
  <li>Create a list <code>fruits</code> with "apple", "orange" and "banana". Add "tomato" to the end, then remove "apple".</li>
  <li>Create a tuple <code>subjects</code> with physics, chemistry, english, math and biology. You can't append to a tuple; convert it to a list, append "literature", then convert back.</li>
  <li>Sort <code>[10, 6, 7, 8, 9, 3]</code> in descending order into <code>sorted_ids</code>, then empty the list.</li>
</ol>`,
      code: {
        language: 'python',
        run: true,
        content: `fruits = ["apple", "orange", "banana"]
fruits.append("tomato")
fruits.remove("apple")
print(fruits)

subjects = ("physics", "chemistry", "english", "math", "biology")
subjects_list = list(subjects)
subjects_list.append("literature")
subjects = tuple(subjects_list)
print(subjects, "->", len(subjects), "subjects")

student_ids = [10, 6, 7, 8, 9, 3]
sorted_ids = sorted(student_ids, reverse=True)
print(sorted_ids)
sorted_ids.clear()
print(sorted_ids)`,
      },
    },
    {
      title: 'Practice Set: Generating, Combining & Counting',
      content: `<ol start="4">
  <li>Generate <code>desc_list</code>: start at 15 and decrease by 3 while the number stays positive.</li>
  <li>Generate <code>asc_list</code>: 14 numbers starting at 2, increasing by 2.</li>
  <li>Combine them into <code>combined_list</code>, then split it into <code>even_numbers</code> and <code>odd_numbers</code>.</li>
  <li>Count how many times each fruit appears in <code>["apple", "banana", "apple", "orange", "banana", "apple"]</code> using a dictionary.</li>
</ol>`,
      code: {
        language: 'python',
        run: true,
        content: `desc_list = list(range(15, 0, -3))
asc_list = [2 * i for i in range(1, 15)]
print("desc:", desc_list)
print("asc: ", asc_list)

combined_list = desc_list + asc_list
even_numbers, odd_numbers = [], []
for num in combined_list:
    if num % 2 == 0:
        even_numbers.append(num)
    else:
        odd_numbers.append(num)
print("Even:", even_numbers)
print("Odd: ", odd_numbers)

fruits_list = ["apple", "banana", "apple", "orange", "banana", "apple"]
fruit_count = {}
for fruit in fruits_list:
    fruit_count[fruit] = fruit_count.get(fruit, 0) + 1
print(fruit_count)`,
      },
      note: 'fruit_count.get(fruit, 0) + 1 is a common counting pattern: get the current count (or 0 if unseen) and add one.',
    },
    {
      title: 'Capstone: Student Report Card Program',
      content: `<p>Combine everything from this lab into one small program, the kind of script an analyst writes to turn raw records into a report.</p>
<ol>
  <li>Store students in a nested dictionary: ID → name and a dictionary of subject scores.</li>
  <li>Write a function <code>average(scores)</code> and a function <code>letter_grade(avg)</code>.</li>
  <li>Loop over students, print a formatted report line, and collect the class results.</li>
  <li>Print the class average and the best student.</li>
</ol>`,
      code: {
        language: 'python',
        run: true,
        content: `records = {
    "S01": {"name": "Aisha", "scores": {"math": 92, "english": 81, "science": 88}},
    "S02": {"name": "Ben",   "scores": {"math": 58, "english": 72, "science": 61}},
    "S03": {"name": "Chen",  "scores": {"math": 75, "english": 90, "science": 79}},
    "S04": {"name": "Divya", "scores": {"math": 45, "english": 52, "science": 49}},
}

def average(scores):
    return sum(scores.values()) / len(scores)

def letter_grade(avg):
    if avg >= 85:
        return "A"
    elif avg >= 70:
        return "B"
    elif avg >= 50:
        return "C"
    return "F"

class_averages = {}
print(f"{'ID':<4} {'Name':<6} {'Avg':>6}  Grade")
for student_id, info in records.items():
    avg = average(info["scores"])
    class_averages[info["name"]] = avg
    print(f"{student_id:<4} {info['name']:<6} {avg:>6.1f}  {letter_grade(avg)}")

best = max(class_averages, key=class_averages.get)
print(f"\\nClass average: {sum(class_averages.values()) / len(class_averages):.1f}")
print(f"Best student: {best} ({class_averages[best]:.1f})")`,
      },
    },
    {
      title: 'Push Your Work to GitHub',
      content: `<p>Save this notebook into the repository you created in Lab 1:</p>
<ol>
  <li><strong>File → Save a copy in GitHub</strong>.</li>
  <li>Repository: <code>hello-world</code> (or create a new repo called <code>daa-portfolio</code> on GitHub first and choose it here).</li>
  <li>File path: <code>python/DAA_Topic1_Lab2.ipynb</code>.</li>
  <li>Commit message: <code>Add Python deep-dive lab: dictionaries, loops, functions</code>.</li>
  <li>Open the repo on GitHub and check the notebook renders with its outputs.</li>
</ol>
<p>From now on, save every DAA lab notebook to this repo. By the end of the course you will have a public portfolio of 14 data-analytics notebooks.</p>`,
      note: 'Never put passwords or API keys in a notebook you push to a public repository.',
    },
  ],
  quiz: [
    {
      question: 'What does <code>elly.get("email")</code> return if the dictionary has no <code>"email"</code> key?',
      options: ['It raises a KeyError', '<code>None</code>', 'An empty string', '<code>False</code>'],
      answer: 1,
    },
    {
      question: 'What does <code>list(range(5, -5, -1))</code> start and end with?',
      options: ['Starts at 5, ends at -5', 'Starts at 5, ends at -4', 'Starts at -5, ends at 5', 'Starts at 4, ends at -4'],
      answer: 1,
    },
    {
      question: 'Which loop is the better choice when you do not know in advance how many iterations you need?',
      options: ['for loop', 'while loop', 'Either; they are identical', 'Neither; use a function'],
      answer: 1,
    },
    {
      question: 'In a loop over <code>range(6)</code>, what happens when <code>num == 4</code> hits a <code>pass</code> statement followed by <code>print(num)</code>?',
      options: ['4 is skipped', 'The loop stops', '4 is still printed', 'A SyntaxError is raised'],
      answer: 2,
    },
    {
      question: 'How do you remove the key <code>"email"</code> from the dictionary <code>richard</code>?',
      options: ['<code>richard.pop()</code>', '<code>del richard["email"]</code>', '<code>richard["email"] = None</code>', '<code>remove(richard, "email")</code>'],
      answer: 1,
    },
    {
      question: 'Given <code>records = {"001": {"name": "Ryan"}}</code>, how do you read Ryan\'s name?',
      options: ['<code>records["name"]</code>', '<code>records["001"]["name"]</code>', '<code>records.name</code>', '<code>records[0]["name"]</code>'],
      answer: 1,
    },
    {
      question: 'What does <code>return area, circumference</code> give back to the caller?',
      options: ['Only area', 'A tuple containing both values', 'A list containing both values', 'An error: only one value can be returned'],
      answer: 1,
    },
    {
      question: 'What does <code>"data"[::-1]</code> produce?',
      options: ['<code>"data"</code>', '<code>"atad"</code>', '<code>"d"</code>', '<code>"a"</code>'],
      answer: 1,
    },
    {
      question: 'Which line correctly counts occurrences of <code>fruit</code> in a dictionary <code>fruit_count</code>?',
      options: [
        '<code>fruit_count[fruit] = 1</code>',
        '<code>fruit_count[fruit] += 1</code> (without checking first)',
        '<code>fruit_count[fruit] = fruit_count.get(fruit, 0) + 1</code>',
        '<code>fruit_count.append(fruit)</code>',
      ],
      answer: 2,
    },
    {
      question: 'Why are functions useful in data analysis code?',
      options: [
        'They make code run on the GPU',
        'They package logic into reusable, testable pieces instead of one long script',
        'They are required to use dictionaries',
        'They automatically save the notebook to GitHub',
      ],
      answer: 1,
    },
  ],
};
