/* ============================================================
   DAA Topic 03 — SQL (Structured Query Language)
   Lab 1: SQL I: Core Foundations
   Lab 2: SQL II: JOINs & CRUD
   Source material: SQL I Core Foundations slides + Driver database
   notebook, SQL Lesson 2 slides (Joins & CRUD)
   ============================================================ */

window.DAA_LAB_DATA = window.DAA_LAB_DATA || {};

/* Helper cell used by both SQL labs: run SQL in Colab with Python's built-in sqlite3 */
const DAA_SQL_HELPER = `import sqlite3
import pandas as pd

# An in-memory SQLite database: it lives only while this notebook runtime is running
conn = sqlite3.connect(":memory:")

def sql(query):
    """Run a SELECT query and show the result as a table."""
    return pd.read_sql_query(query, conn)

def run(statement):
    """Run statements that change the database (CREATE, INSERT, UPDATE, DELETE)."""
    conn.executescript(statement)
    conn.commit()

print("SQLite version:", sqlite3.sqlite_version)`;

/* ─────────────────────────────────────────────────────────────
   LAB 1 — SQL I: Core Foundations
   ───────────────────────────────────────────────────────────── */
window.DAA_LAB_DATA['daa-03_lab1'] = {
  title:      'SQL I: Core Foundations: SELECT, WHERE, Aggregates & GROUP BY',
  difficulty: 'Simple → Intermediate',
  duration:   '2 hours',
  overview:   'Most of the world\'s business data lives in relational databases, and SQL is the language used to ask it questions. In this lab you learn how relational databases organise data into linked tables, then build a small Formula 1 driver database inside Google Colab and query it: selecting columns, filtering rows with WHERE and LIKE, sorting and limiting results, summarising with aggregate functions, grouping with GROUP BY and HAVING, and nesting one query inside another.',
  objectives: [
    'Explain tables, rows, columns, primary keys and foreign keys',
    'Run SQL inside Google Colab using Python\'s built-in sqlite3 module',
    'Retrieve data with SELECT … FROM and filter it with WHERE, AND/OR/NOT, LIKE and IN',
    'Sort and limit results with ORDER BY and LIMIT',
    'Summarise data with COUNT, SUM, AVG, MIN and MAX',
    'Produce one summary row per group with GROUP BY, and filter groups with HAVING',
    'Write a subquery and a first INNER JOIN',
  ],
  steps: [
    {
      title: 'What Is a Relational Database?',
      content: `<p>A <strong>relational database</strong> organises data into <strong>tables</strong> (also called relations) that can be linked through shared columns. Think of a spreadsheet, but with strict structure, rules, and relationships between sheets.</p>
<ul>
  <li><strong>Table:</strong> a collection of related data, e.g. <code>drivers</code>.</li>
  <li><strong>Row (record):</strong> one item, e.g. one driver.</li>
  <li><strong>Column (field/attribute):</strong> one property, e.g. <code>age</code>. Every value in a column has the same data type.</li>
</ul>
<h4>Keys: how tables connect</h4>
<table>
  <tr><th>Key</th><th>Meaning</th><th>Analogy</th></tr>
  <tr><td><strong>Primary key (PK)</strong></td><td>Uniquely identifies every row. Never empty (NULL), never duplicated.</td><td>Your passport number</td></tr>
  <tr><td><strong>Foreign key (FK)</strong></td><td>A column that stores another table's primary key, creating a link.</td><td>A flight manifest listing your passport number to link you to a seat</td></tr>
</table>
<p>Today's database has two tables: <code>team</code> (PK: <code>id</code>) and <code>drivers</code> (PK: <code>id</code>, FK: <code>team_id</code> → <code>team.id</code>).</p>`,
    },
    {
      title: 'Set Up SQL in Google Colab',
      content: `<p>Colab runs Python, and Python ships with <strong>SQLite</strong>, a complete SQL database engine in a single file (or, here, entirely in memory). Nothing needs installing.</p>
${window.DAA_COLAB_GUIDE}
<p>Name the notebook <code>DAA_Topic3_Lab1_SQL.ipynb</code>, then run this <strong>setup cell</strong>. It creates the database connection and two small helper functions:</p>
<ul>
  <li><code>sql("SELECT …")</code> runs a query and shows the result as a neat table.</li>
  <li><code>run("CREATE … / INSERT …")</code> runs statements that change the database.</li>
</ul>`,
      code: { language: 'python', run: true, content: DAA_SQL_HELPER },
      note: 'Alternative you may see in other notebooks: the %%sql "magic" from the ipython-sql package (!pip install ipython-sql, then %load_ext sql and %sql sqlite://). It works too, but the sqlite3 + pandas approach used here has no extra installs and never breaks when Colab updates.',
      warning: 'The database is in memory. If the runtime restarts, re-run the setup cell and the CREATE TABLE cell in the next step.',
    },
    {
      title: 'Build the Driver Database',
      content: `<p>SQL has two families of commands: <strong>DDL</strong> (Data Definition Language: <code>CREATE</code>, <code>DROP</code>) defines the structure, and <strong>DML</strong> (Data Manipulation Language: <code>INSERT</code>, <code>SELECT</code>, <code>UPDATE</code>, <code>DELETE</code>) works with the data.</p>
<p>Run this cell to create both tables and insert the data. Read the SQL carefully: each column has a name and a type, and <code>id INTEGER PRIMARY KEY</code> makes <code>id</code> the primary key.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `run("""
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS team;

CREATE TABLE team (
    id             INTEGER PRIMARY KEY,
    team_name      TEXT,
    team_principal TEXT
);

CREATE TABLE drivers (
    id      INTEGER PRIMARY KEY,
    name    TEXT,
    age     INTEGER,
    races   INTEGER,
    team_id INTEGER REFERENCES team(id)
);

INSERT INTO team VALUES
    (1, 'Red Bull', 'Laurent Mekies'),
    (2, 'Ferrari',  'Fred Vasseur'),
    (3, 'McLaren',  'Andrea Stella');

INSERT INTO drivers VALUES
    (1,  'Max Verstappen',   28, 227, 1),
    (3,  'Daniel Ricciardo', 36, 257, 1),
    (16, 'Charles Leclerc',  27, 165, 2),
    (44, 'Lewis Hamilton',   40, 374, 2),
    (81, 'Oscar Piastri',    24,  64, 3);
""")
print("Tables created")`,
      },
      note: 'SQL keywords are not case-sensitive (select = SELECT), but writing them in CAPITALS is the convention because it makes queries easier to read.',
    },
    {
      title: 'The Anatomy of a Query: SELECT … FROM',
      content: `<p>Every query answers: <em>which columns</em> (<code>SELECT</code>) from <em>which table</em> (<code>FROM</code>). Think of it as saying "Hey database, show me this information".</p>
<ul>
  <li><code>SELECT *</code> means "all columns". Handy for a first look, but in real work select only the columns you need.</li>
  <li><code>SELECT name, races</code> returns just those two columns, in that order.</li>
  <li><code>AS</code> renames a column in the result (an <em>alias</em>).</li>
</ul>`,
      code: [
        { language: 'python', run: true, content: `sql("SELECT * FROM drivers")` },
        { language: 'python', run: true, content: `sql("SELECT * FROM team")` },
        { language: 'python', run: true, content: `sql("SELECT name AS driver, races AS race_starts FROM drivers")` },
      ],
    },
    {
      title: 'Filtering Rows with WHERE',
      content: `<p><code>WHERE</code> keeps only the rows that satisfy a condition. You can combine conditions with <code>AND</code>, <code>OR</code> and <code>NOT</code>, use comparison operators (<code>= != &gt; &lt; &gt;= &lt;=</code>), and test membership with <code>IN</code> or ranges with <code>BETWEEN</code>.</p>
<p>Text values go in <strong>single quotes</strong>: <code>'Ferrari'</code>.</p>`,
      code: [
        { language: 'python', run: true, content: `# Drivers with more than 150 race starts
sql("SELECT name, races FROM drivers WHERE races > 150")` },
        { language: 'python', run: true, content: `# Combine conditions: experienced drivers under 30
sql("SELECT name, age, races FROM drivers WHERE races > 100 AND age < 30")` },
        { language: 'python', run: true, content: `# IN checks against a list; BETWEEN is inclusive on both ends
sql("SELECT name, team_id FROM drivers WHERE team_id IN (1, 3) AND age BETWEEN 20 AND 30")` },
      ],
    },
    {
      title: 'Pattern Matching with LIKE',
      content: `<p><code>LIKE</code> searches text using wildcards:</p>
<table>
  <tr><th>Pattern</th><th>Matches</th></tr>
  <tr><td><code>'M%'</code></td><td>Starts with M (<code>%</code> = any number of characters)</td></tr>
  <tr><td><code>'%son'</code></td><td>Ends with "son"</td></tr>
  <tr><td><code>'%ar%'</code></td><td>Contains "ar" anywhere</td></tr>
  <tr><td><code>'_ax%'</code></td><td>Any single character, then "ax" (<code>_</code> = exactly one character)</td></tr>
</table>`,
      code: [
        { language: 'python', run: true, content: `sql("SELECT * FROM drivers WHERE name LIKE 'M%'")` },
        { language: 'python', run: true, content: `sql("SELECT name FROM drivers WHERE name LIKE '%ar%'")` },
      ],
      note: 'In SQLite, LIKE ignores upper/lower case for English letters, so \'m%\' also finds "Max". Other databases (e.g. PostgreSQL) are case-sensitive; use ILIKE there.',
    },
    {
      title: 'Sorting and Limiting: ORDER BY & LIMIT',
      content: `<p><code>ORDER BY column</code> sorts ascending (smallest first) by default; add <code>DESC</code> for descending. <code>LIMIT n</code> returns only the first <em>n</em> rows, the classic "top 3" pattern. You can sort by several columns: <code>ORDER BY team_id, age DESC</code>.</p>`,
      code: [
        { language: 'python', run: true, content: `# Top 3 most experienced drivers
sql("""
SELECT name, races
FROM drivers
ORDER BY races DESC
LIMIT 3
""")` },
        { language: 'python', run: true, content: `sql("SELECT name, team_id, age FROM drivers ORDER BY team_id, age DESC")` },
      ],
    },
    {
      title: 'Summarising Data with Aggregate Functions',
      content: `<p><strong>Aggregate functions</strong> calculate across many rows and return one summary value. They are how raw rows become insights.</p>
<table>
  <tr><th>Function</th><th>Returns</th></tr>
  <tr><td><code>COUNT(*)</code></td><td>Number of rows</td></tr>
  <tr><td><code>SUM(col)</code></td><td>Total of a numeric column</td></tr>
  <tr><td><code>AVG(col)</code></td><td>Average (mean)</td></tr>
  <tr><td><code>MIN(col)</code> / <code>MAX(col)</code></td><td>Smallest / largest value</td></tr>
</table>`,
      code: {
        language: 'python',
        run: true,
        content: `sql("""
SELECT COUNT(*)            AS drivers,
       SUM(races)          AS total_races,
       ROUND(AVG(age), 1)  AS avg_age,
       MIN(age)            AS youngest,
       MAX(races)          AS most_races
FROM drivers
""")`,
      },
    },
    {
      title: 'Grouping with GROUP BY and HAVING',
      content: `<p><code>GROUP BY</code> puts rows that share a value into groups and gives <strong>one summary row per group</strong>, instead of one summary for the whole table. It is almost always used with an aggregate function.</p>
<p><code>HAVING</code> filters <em>groups</em> after they are aggregated, whereas <code>WHERE</code> filters <em>rows</em> before grouping.</p>
<p><strong>Rule:</strong> every column in <code>SELECT</code> must either be in <code>GROUP BY</code> or be inside an aggregate function.</p>`,
      code: [
        { language: 'python', run: true, content: `# Average race starts and age per team
sql("""
SELECT team_id,
       COUNT(*)              AS drivers,
       ROUND(AVG(races), 1)  AS avg_races,
       ROUND(AVG(age), 1)    AS avg_age
FROM drivers
GROUP BY team_id
""")` },
        { language: 'python', run: true, content: `# Only teams whose drivers average more than 200 races
sql("""
SELECT team_id, AVG(races) AS avg_races
FROM drivers
GROUP BY team_id
HAVING AVG(races) > 200
""")` },
      ],
    },
    {
      title: 'Subqueries and Your First JOIN',
      content: `<p>A <strong>subquery</strong> is a query inside another query. Example: find drivers with more race starts than the average. The inner query calculates the average; the outer query uses it.</p>
<p>A <strong>JOIN</strong> combines tables using the key that links them. <code>INNER JOIN team t ON d.team_id = t.id</code> matches each driver to their team. The short names <code>d</code> and <code>t</code> are table aliases. You will master joins in Lab 2.</p>`,
      code: [
        { language: 'python', run: true, content: `sql("""
SELECT name, races
FROM drivers
WHERE races > (SELECT AVG(races) FROM drivers)
""")` },
        { language: 'python', run: true, content: `sql("""
SELECT d.name, t.team_name, t.team_principal
FROM drivers d
INNER JOIN team t ON d.team_id = t.id
ORDER BY t.team_name
""")` },
      ],
    },
    {
      title: 'Practice Challenges',
      content: `<p>Write each query yourself before revealing the solutions:</p>
<ol>
  <li>Show all drivers in Red Bull (hint: Red Bull has <code>id</code> 1, or use a join).</li>
  <li>Find the youngest driver.</li>
  <li>Show the average age per <strong>team name</strong>, highest first.</li>
</ol>`,
      code: [
        { language: 'python', run: true, content: `sql("""
SELECT d.name
FROM drivers d JOIN team t ON d.team_id = t.id
WHERE t.team_name = 'Red Bull'
""")` },
        { language: 'python', run: true, content: `sql("SELECT name, age FROM drivers WHERE age = (SELECT MIN(age) FROM drivers)")` },
        { language: 'python', run: true, content: `sql("""
SELECT t.team_name, ROUND(AVG(d.age), 1) AS avg_age
FROM drivers d JOIN team t ON d.team_id = t.id
GROUP BY t.team_name
ORDER BY avg_age DESC
""")` },
      ],
    },
    {
      title: 'Common SQL Mistakes & Key Takeaways',
      content: `<h4>Mistakes beginners make</h4>
<ol>
  <li><strong>Forgetting WHERE in UPDATE/DELETE</strong>: it changes every row. Always check first (covered in Lab 2).</li>
  <li><strong>Using <code>= NULL</code></strong>: NULL means "unknown", so nothing equals it. Use <code>IS NULL</code> / <code>IS NOT NULL</code>.</li>
  <li><strong>Mixing up INNER and LEFT JOIN</strong>: INNER keeps only matches; LEFT keeps every row from the left table.</li>
  <li><strong>Selecting a column that is neither grouped nor aggregated</strong> in a GROUP BY query.</li>
  <li><strong>Double quotes for text values</strong>: use single quotes for text (<code>'Ferrari'</code>).</li>
</ol>
<h4>Key takeaways</h4>
<ul>
  <li>Data lives in tables linked by primary and foreign keys.</li>
  <li><code>SELECT</code>, <code>FROM</code>, <code>WHERE</code>, <code>ORDER BY</code> and <code>LIMIT</code> are the core query building blocks.</li>
  <li><code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>MIN</code>, <code>MAX</code> with <code>GROUP BY</code> turn raw rows into insights.</li>
</ul>
<p>Save the notebook to GitHub (<strong>File → Save a copy in GitHub</strong>, path <code>sql/DAA_Topic3_Lab1_SQL.ipynb</code>).</p>`,
    },
  ],
  quiz: [
    {
      question: 'What is a primary key?',
      options: [
        'A column that links to another table',
        'A column (or columns) whose values uniquely identify every row and can never be NULL',
        'The first column of any table',
        'A password that protects the database',
      ],
      answer: 1,
    },
    {
      question: 'In the drivers table, what is <code>team_id</code>?',
      options: ['A primary key', 'A foreign key referencing team.id', 'An aggregate function', 'An alias'],
      answer: 1,
    },
    {
      question: 'Which query returns the three drivers with the most race starts?',
      options: [
        '<code>SELECT name FROM drivers LIMIT 3</code>',
        '<code>SELECT name FROM drivers ORDER BY races LIMIT 3</code>',
        '<code>SELECT name FROM drivers ORDER BY races DESC LIMIT 3</code>',
        '<code>SELECT TOP(races, 3) FROM drivers</code>',
      ],
      answer: 2,
    },
    {
      question: 'What does <code>WHERE name LIKE \'%son\'</code> match?',
      options: ['Names starting with "son"', 'Names ending with "son"', 'Names exactly equal to "%son"', 'Names containing only 3 letters'],
      answer: 1,
    },
    {
      question: 'What does <code>GROUP BY team_id</code> do in a query with <code>AVG(races)</code>?',
      options: [
        'Sorts the drivers by team',
        'Returns one row per team with the average races for that team',
        'Deletes duplicate teams',
        'Joins the team table automatically',
      ],
      answer: 1,
    },
    {
      question: 'What is the difference between WHERE and HAVING?',
      options: [
        'They are interchangeable',
        'WHERE filters rows before grouping; HAVING filters groups after aggregation',
        'HAVING filters rows; WHERE filters columns',
        'WHERE only works with numbers',
      ],
      answer: 1,
    },
    {
      question: 'How should you check for missing values in SQL?',
      options: ['<code>WHERE age = NULL</code>', '<code>WHERE age IS NULL</code>', '<code>WHERE age == None</code>', '<code>WHERE age = \'\'</code>'],
      answer: 1,
    },
    {
      question: 'Which query finds drivers with more races than the average?',
      options: [
        '<code>SELECT name FROM drivers WHERE races > AVG(races)</code>',
        '<code>SELECT name FROM drivers WHERE races > (SELECT AVG(races) FROM drivers)</code>',
        '<code>SELECT name FROM drivers HAVING races > AVG</code>',
        '<code>SELECT AVG(name) FROM drivers</code>',
      ],
      answer: 1,
    },
    {
      question: 'Which command family defines table structure?',
      options: ['DML (INSERT, SELECT)', 'DDL (CREATE, DROP)', 'Aggregate functions', 'Wildcards'],
      answer: 1,
    },
    {
      question: 'In the Colab setup, what does the helper <code>sql()</code> return?',
      options: ['A Python list of strings', 'A pandas DataFrame showing the query result', 'Nothing; it only prints', 'A CSV file'],
      answer: 1,
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   LAB 2 — SQL II: JOINs & CRUD
   ───────────────────────────────────────────────────────────── */
window.DAA_LAB_DATA['daa-03_lab2'] = {
  title:      'SQL II: JOINs & CRUD: Connecting and Modifying Tables',
  difficulty: 'Intermediate → Advanced',
  duration:   '2 hours',
  overview:   'Real questions almost always need data from more than one table. In this lab you model a small e-commerce database of Customers and Orders, learn exactly what INNER, LEFT and RIGHT joins return, combine joins with filters and aggregation to calculate customer lifetime value, and understand the order in which SQL evaluates a query. You then learn the CRUD paradigm (Create, Read, Update, Delete) and practise changing data safely.',
  objectives: [
    'Read a schema and explain how primary and foreign keys connect tables',
    'Predict the result of INNER JOIN, LEFT JOIN and RIGHT JOIN',
    'Use LEFT JOIN + IS NULL to find records with no match',
    'Combine JOIN, WHERE, GROUP BY and ORDER BY and explain SQL\'s evaluation order',
    'Calculate customer lifetime value with SUM and GROUP BY',
    'Insert, update and delete rows safely using WHERE and a preview SELECT',
  ],
  steps: [
    {
      title: 'Recap & Set Up the E-Commerce Database',
      content: `<p>Open a new Colab notebook (<code>DAA_Topic3_Lab2_SQL.ipynb</code>) and run the same helper cell as Lab 1, then create the database below.</p>
<h4>The schema</h4>
<table>
  <tr><th>Customers</th><th>Orders</th></tr>
  <tr><td><code>CustomerID</code> (PK)<br><code>Name</code><br><code>Segment</code> (Standard / Premium)</td><td><code>OrderID</code> (PK)<br><code>CustomerID</code> (FK → Customers)<br><code>Amount</code><br><code>OrderDate</code></td></tr>
</table>
<p>One customer can have many orders (a <strong>one-to-many</strong> relationship). The foreign key <code>Orders.CustomerID</code> records <em>who</em> placed each order, like a flight manifest recording your passport number to link you to a seat.</p>
<p>Notice two deliberate "gaps" in the data: <strong>Evan</strong> has never ordered, and order <strong>106</strong> belongs to customer 9, who does not exist in Customers (an orphaned record, which happens in messy real data).</p>`,
      code: [
        { language: 'python', run: true, content: DAA_SQL_HELPER },
        {
          language: 'python',
          run: true,
          content: `run("""
CREATE TABLE Customers (
    CustomerID INTEGER PRIMARY KEY,
    Name       TEXT,
    Segment    TEXT
);

CREATE TABLE Orders (
    OrderID    INTEGER PRIMARY KEY,
    CustomerID INTEGER,
    Amount     REAL,
    OrderDate  TEXT
);

INSERT INTO Customers VALUES
    (1, 'Alice', 'Premium'),
    (2, 'Bob',   'Standard'),
    (3, 'Chloe', 'Premium'),
    (4, 'Dinesh','Standard'),
    (5, 'Evan',  'Standard');

INSERT INTO Orders VALUES
    (101, 1, 250.0, '2026-01-05'),
    (102, 1, 120.0, '2026-02-11'),
    (103, 2,  80.0, '2026-02-14'),
    (104, 3, 560.0, '2026-03-02'),
    (105, 4,  45.5, '2026-03-09'),
    (106, 9,  99.9, '2026-03-15'),
    (107, 3, 210.0, '2026-04-01');
""")
display(sql("SELECT * FROM Customers"))
sql("SELECT * FROM Orders")`,
        },
      ],
      note: 'display() shows a table in the middle of a cell; the last line of a cell is shown automatically.',
    },
    {
      title: 'INNER JOIN: The Intersection',
      content: `<p><code>INNER JOIN</code> returns only rows where a match exists in <strong>both</strong> tables, like the overlapping centre of a Venn diagram. No match? The row is dropped.</p>
<p><strong>Data science use case:</strong> list customers who have actually placed orders. Anyone without a purchase (Evan) and any orphan order (106) disappears automatically.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `sql("""
SELECT c.Name, c.Segment, o.OrderID, o.Amount
FROM Customers c
INNER JOIN Orders o ON c.CustomerID = o.CustomerID
ORDER BY c.Name
""")`,
      },
      after: `<p>Count the rows: 6 orders matched. Evan (no orders) and order 106 (no customer) are missing, which is exactly what "intersection" means.</p>`,
    },
    {
      title: 'LEFT JOIN & RIGHT JOIN',
      content: `<table>
  <tr><th>Join</th><th>Keeps</th><th>Unmatched columns become</th></tr>
  <tr><td><code>LEFT JOIN</code></td><td>Every row from the <strong>left</strong> table + matches from the right</td><td>NULL (shown as None / NaN)</td></tr>
  <tr><td><code>RIGHT JOIN</code></td><td>Every row from the <strong>right</strong> table + matches from the left</td><td>NULL</td></tr>
</table>
<p><strong>Real-world use:</strong> a LEFT JOIN from Customers to Orders keeps <em>every</em> customer, including those who never bought anything, which is essential for "zero-spend" analysis and re-engagement campaigns.</p>`,
      code: [
        { language: 'python', run: true, content: `sql("""
SELECT c.Name, o.OrderID, o.Amount
FROM Customers c
LEFT JOIN Orders o ON c.CustomerID = o.CustomerID
ORDER BY c.CustomerID
""")` },
        { language: 'python', run: true, content: `# RIGHT JOIN keeps every order, including the orphan order 106
sql("""
SELECT c.Name, o.OrderID, o.Amount
FROM Customers c
RIGHT JOIN Orders o ON c.CustomerID = o.CustomerID
ORDER BY o.OrderID
""")` },
        { language: 'python', run: true, content: `# Same result written as a LEFT JOIN: swap the table order
sql("""
SELECT c.Name, o.OrderID, o.Amount
FROM Orders o
LEFT JOIN Customers c ON c.CustomerID = o.CustomerID
ORDER BY o.OrderID
""")` },
      ],
      after: `<p>In the LEFT JOIN result, Evan's <code>OrderID</code> and <code>Amount</code> are <code>NaN</code> (pandas' way of showing NULL), and the other IDs display as <code>101.0</code> because a numeric column containing NaN is stored as decimals. In the RIGHT JOIN, the orphan order 106 has no customer name (<code>None</code>).</p>`,
      note: 'RIGHT JOIN needs SQLite 3.39 or newer (check the version printed by the setup cell). If your Colab shows an older version, RIGHT JOIN raises an error: use the second cell. Any RIGHT JOIN can be rewritten as a LEFT JOIN by swapping the tables.',
    },
    {
      title: 'Finding What Is Missing: LEFT JOIN + IS NULL',
      content: `<p>A powerful pattern: LEFT JOIN, then keep only rows where the right side is NULL. This answers "which customers have <strong>never</strong> ordered?"</p>`,
      code: [
        { language: 'python', run: true, content: `sql("""
SELECT c.CustomerID, c.Name
FROM Customers c
LEFT JOIN Orders o ON c.CustomerID = o.CustomerID
WHERE o.OrderID IS NULL
""")` },
        { language: 'python', run: true, content: `# Data-quality check: orders whose customer does not exist (orphans)
sql("""
SELECT o.OrderID, o.CustomerID, o.Amount
FROM Orders o
LEFT JOIN Customers c ON o.CustomerID = c.CustomerID
WHERE c.CustomerID IS NULL
""")` },
      ],
    },
    {
      title: 'Query Design: How SQL Evaluates a Query',
      content: `<p>You <em>write</em> SELECT first, but the database <em>runs</em> the clauses in a different order:</p>
<ol>
  <li><strong>FROM &amp; JOIN</strong>: build the base dataset from the joined tables.</li>
  <li><strong>WHERE</strong>: filter individual rows.</li>
  <li><strong>GROUP BY</strong>: collapse rows into groups.</li>
  <li><strong>HAVING</strong>: filter groups.</li>
  <li><strong>SELECT</strong>: choose/compute the output columns.</li>
  <li><strong>ORDER BY</strong> then <strong>LIMIT</strong>: sort and trim.</li>
</ol>
<p>This explains two classic errors: you can't use an aggregate in WHERE (groups don't exist yet), and in many databases you can't use a SELECT alias inside WHERE.</p>
<p><strong>Example:</strong> total sales per customer, <em>Premium</em> segment only.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `sql("""
SELECT c.Name, SUM(o.Amount) AS total_spent
FROM Customers c
JOIN Orders o ON c.CustomerID = o.CustomerID
WHERE c.Segment = 'Premium'
GROUP BY c.Name
ORDER BY total_spent DESC
""")`,
      },
    },
    {
      title: 'Lab Task: Customer Lifetime Value',
      content: `<p><strong>Customer lifetime value (CLV)</strong> is the total a customer has spent. Build a CLV table for <em>every</em> customer (including zero-spenders) with: number of orders, total spent, average order value, and first/last order date.</p>
<p>Two new functions help: <code>COALESCE(x, 0)</code> replaces NULL with 0, and <code>COUNT(o.OrderID)</code> counts only non-NULL order IDs, so Evan correctly gets 0.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `clv = sql("""
SELECT c.Name,
       c.Segment,
       COUNT(o.OrderID)                 AS orders,
       COALESCE(SUM(o.Amount), 0)       AS lifetime_value,
       ROUND(AVG(o.Amount), 2)          AS avg_order_value,
       MIN(o.OrderDate)                 AS first_order,
       MAX(o.OrderDate)                 AS last_order
FROM Customers c
LEFT JOIN Orders o ON c.CustomerID = o.CustomerID
GROUP BY c.CustomerID, c.Name, c.Segment
ORDER BY lifetime_value DESC
""")
clv`,
      },
      after: `<p>Because <code>sql()</code> returns a pandas DataFrame, you can continue in Python, e.g. <code>clv.groupby("Segment")["lifetime_value"].mean()</code>. SQL and pandas work together in real pipelines.</p>`,
    },
    {
      title: 'CRUD: Create with INSERT',
      content: `<p>Every data application does four things, known as <strong>CRUD</strong>:</p>
<table>
  <tr><th>CRUD</th><th>SQL</th><th>Purpose</th></tr>
  <tr><td>Create</td><td><code>INSERT</code></td><td>Add new rows</td></tr>
  <tr><td>Read</td><td><code>SELECT</code></td><td>Query existing rows</td></tr>
  <tr><td>Update</td><td><code>UPDATE</code></td><td>Modify existing rows</td></tr>
  <tr><td>Delete</td><td><code>DELETE</code></td><td>Remove rows permanently</td></tr>
</table>
<p><strong>INSERT</strong> rules: values must match the column order and types; primary keys must be unique (a duplicate raises an error). Listing the columns explicitly, <code>INSERT INTO Customers (CustomerID, Name, Segment)</code>, is clearer and safer.</p>`,
      code: [
        { language: 'python', run: true, content: `run("INSERT INTO Customers (CustomerID, Name, Segment) VALUES (6, 'Fiona', 'Standard')")
sql("SELECT * FROM Customers WHERE CustomerID = 6")` },
        { language: 'python', run: true, expectError: true, content: `# Inserting a duplicate primary key fails, which protects your data
run("INSERT INTO Customers VALUES (6, 'Another Fiona', 'Premium')")` },
      ],
    },
    {
      title: 'CRUD: UPDATE and DELETE Safely',
      content: `<p><strong>The critical rule:</strong> always include a <code>WHERE</code> clause. Without it, <code>UPDATE</code> overwrites <em>every</em> row and <code>DELETE</code> empties the whole table, instantly and irreversibly.</p>
<h4>The safe workflow</h4>
<ol>
  <li>Write the <code>WHERE</code> clause as a <code>SELECT</code> first and check exactly which rows it returns.</li>
  <li>Only then swap <code>SELECT *</code> for <code>UPDATE … SET</code> or <code>DELETE</code>, keeping the same WHERE.</li>
  <li>Run a <code>SELECT</code> afterwards to verify.</li>
</ol>`,
      code: [
        { language: 'python', run: true, content: `# 1. Preview: which row will change?
sql("SELECT * FROM Customers WHERE CustomerID = 2")` },
        { language: 'python', run: true, content: `# 2. Update with the same WHERE, 3. verify
run("UPDATE Customers SET Segment = 'VIP' WHERE CustomerID = 2")
sql("SELECT * FROM Customers WHERE CustomerID = 2")` },
        { language: 'python', run: true, content: `# Clean up the orphan order found earlier
sql("SELECT * FROM Orders WHERE OrderID = 106")` },
        { language: 'python', run: true, content: `run("DELETE FROM Orders WHERE OrderID = 106")
sql("SELECT COUNT(*) AS remaining_orders FROM Orders")` },
      ],
      warning: 'In SQLite every statement you run through run() is committed immediately. Production databases let you wrap changes in a transaction (BEGIN … ROLLBACK) so you can undo mistakes, but the preview-first habit protects you everywhere.',
    },
    {
      title: 'Challenge & Key Takeaways',
      content: `<h4>Challenge</h4>
<ol>
  <li>Customers with total spend above 300 (hint: <code>HAVING</code>).</li>
  <li>Monthly revenue (hint: <code>substr(OrderDate, 1, 7)</code> extracts <code>YYYY-MM</code>).</li>
</ol>`,
      code: [
        { language: 'python', run: true, content: `sql("""
SELECT c.Name, SUM(o.Amount) AS total_spent
FROM Customers c JOIN Orders o ON c.CustomerID = o.CustomerID
GROUP BY c.Name
HAVING SUM(o.Amount) > 300
""")` },
        { language: 'python', run: true, content: `sql("""
SELECT substr(OrderDate, 1, 7) AS month, COUNT(*) AS orders, SUM(Amount) AS revenue
FROM Orders
GROUP BY month
ORDER BY month
""")` },
      ],
      after: `<h4>Key takeaways</h4>
<ul>
  <li><strong>PK &amp; FK:</strong> primary keys identify rows; foreign keys link tables.</li>
  <li><strong>INNER JOIN</strong> returns only matching rows; <strong>LEFT JOIN</strong> keeps everything from the left table with NULLs where there is no match.</li>
  <li><strong>SQL runs</strong> FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.</li>
  <li><strong>CRUD</strong> changes data: preview with SELECT and always use WHERE.</li>
</ul>
<p>Save the notebook to GitHub under <code>sql/</code>.</p>`,
    },
  ],
  quiz: [
    {
      question: 'Customers has 5 rows and Orders has 7 rows; one customer has no orders and one order has no matching customer. What does an INNER JOIN on CustomerID return?',
      options: ['All 5 customers', 'All 7 orders', 'Only the orders that have a matching customer', 'Every combination of customers and orders'],
      answer: 2,
    },
    {
      question: 'Which join keeps every customer, even those who have never ordered?',
      options: ['<code>INNER JOIN</code> from Customers to Orders', '<code>LEFT JOIN</code> from Customers to Orders', '<code>RIGHT JOIN</code> from Customers to Orders', 'No join can do this'],
      answer: 1,
    },
    {
      question: 'In a LEFT JOIN, what appears in the right table\'s columns when there is no match?',
      options: ['0', 'An empty string', 'NULL', 'The row is removed'],
      answer: 2,
    },
    {
      question: 'Which query pattern finds customers with no orders?',
      options: [
        'INNER JOIN … WHERE o.OrderID = 0',
        'LEFT JOIN Orders … WHERE o.OrderID IS NULL',
        'RIGHT JOIN Orders … WHERE c.Name IS NULL',
        'SELECT * FROM Customers WHERE Orders = NULL',
      ],
      answer: 1,
    },
    {
      question: 'In what order does SQL evaluate these clauses?',
      options: [
        'SELECT → FROM → WHERE → GROUP BY',
        'FROM/JOIN → WHERE → GROUP BY → SELECT → ORDER BY',
        'WHERE → FROM → SELECT → GROUP BY',
        'GROUP BY → WHERE → FROM → SELECT',
      ],
      answer: 1,
    },
    {
      question: 'What does <code>COALESCE(SUM(o.Amount), 0)</code> do for a customer with no orders?',
      options: ['Raises an error', 'Returns NULL', 'Returns 0 instead of NULL', 'Deletes the customer'],
      answer: 2,
    },
    {
      question: 'What happens if you run <code>UPDATE Customers SET Segment = \'VIP\'</code> without a WHERE clause?',
      options: ['Nothing; SQL requires WHERE', 'Only the first row changes', 'Every customer becomes VIP', 'Only new customers become VIP'],
      answer: 2,
    },
    {
      question: 'What is the safest workflow before a DELETE?',
      options: [
        'Run DELETE, then check if it looks right',
        'Run a SELECT with the same WHERE clause first to see exactly which rows will be removed',
        'Delete the whole table and re-insert the rows you want',
        'Always use LIMIT 1',
      ],
      answer: 1,
    },
    {
      question: 'Why does inserting a second row with CustomerID 6 fail?',
      options: ['Names must be unique', 'Primary key values must be unique', 'You can only insert one row per session', 'Segment is misspelled'],
      answer: 1,
    },
    {
      question: 'Which CRUD operation corresponds to SELECT?',
      options: ['Create', 'Read', 'Update', 'Delete'],
      answer: 1,
    },
  ],
};
