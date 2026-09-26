/* ============================================================
   DAA Topic 04 — EDA (Exploratory Data Analysis) & Visualization
   Lab 1: EDA I: Inspect, Clean & Summarise a Retail Dataset
   Lab 2: EDA II: Visualisation with Matplotlib & Seaborn
   Source material: EDA Lesson 1 & 2 lesson flows and slides,
   EDA Lesson 2 (Daniel Ricciardo) notebook
   ============================================================ */

window.DAA_LAB_DATA = window.DAA_LAB_DATA || {};

/* ─────────────────────────────────────────────────────────────
   LAB 1 — EDA I: Inspect, Clean & Summarise
   ───────────────────────────────────────────────────────────── */
window.DAA_LAB_DATA['daa-04_lab1'] = {
  title:      'EDA I: Inspect, Clean & Summarise a Retail Dataset',
  difficulty: 'Simple → Intermediate',
  duration:   '2 hours',
  datasets:   ['retail'],
  overview:   'Before you build a model or make a business decision, you need to truly know your data. Exploratory Data Analysis (EDA) is the disciplined practice of investigating a dataset: its structure, its quality and its hidden patterns. Data science is roughly 80% understanding and cleaning data and 20% modelling. In this lab you act as a data detective on 1,000 retail transactions: you preview the data, fix data types, handle missing values and duplicates, compute summary statistics, and use groupby() to uncover who spends the most and which products sell best.',
  objectives: [
    'Explain what EDA is and why it comes before modelling',
    'Load a CSV into a pandas DataFrame and inspect it with shape, head(), tail() and info()',
    'Convert columns to the correct data types (dates, categories)',
    'Detect and handle missing values (dropna vs fillna) and duplicate rows',
    'Interpret describe(): mean, median, standard deviation, min and max',
    'Compare groups with groupby() and pivot_table(), and relate them to SQL GROUP BY',
    'Record findings that guide the next stage of analysis',
  ],
  steps: [
    {
      title: 'The Philosophy of EDA',
      content: `<p><strong>Exploratory Data Analysis</strong> is the process of examining and investigating a dataset <em>before</em> building machine-learning models or making business decisions.</p>
<ul>
  <li><strong>Goal:</strong> understand the dataset's structure, assess its quality, and discover simple underlying patterns.</li>
  <li><strong>Benefit:</strong> catching anomalies early prevents costly errors later, such as a model trained on duplicated or corrupted data.</li>
</ul>
<h4>Think like a detective</h4>
<p>Raw data is messy and dangerous to use blindly. <strong>Don't trust the data; verify it.</strong> Ask three questions every time you open a new file:</p>
<table>
  <tr><th>Question</th><th>What you check</th></tr>
  <tr><td><strong>Size</strong></td><td>How many rows and columns? Is it manageable or does it need sampling?</td></tr>
  <tr><td><strong>Quality</strong></td><td>Missing values, duplicates, wrong data types, impossible values?</td></tr>
  <tr><td><strong>Patterns</strong></td><td>What do averages, counts and group comparisons reveal about the real world?</td></tr>
</table>
<h4>The basic EDA workflow</h4>
<p><strong>Preview → Clean → Summarise.</strong> Look at the data, fix what's broken, then summarise what you've learned. This three-step rhythm works on any dataset.</p>`,
    },
    {
      title: 'Set Up Colab and Load the Data',
      content: `<p>Create a notebook called <code>DAA_Topic4_Lab1_EDA.ipynb</code> and upload the dataset:</p>
${window.DAA_COLAB_UPLOAD}
<p><strong>pandas</strong> is Python's table library. <code>pd.read_csv()</code> turns a flat CSV file into a <strong>DataFrame</strong>: a table with named columns and a row index, plus hundreds of built-in analysis methods.</p>`,
      datasets: ['retail'],
      code: {
        language: 'python',
        run: true,
        content: `import pandas as pd

df = pd.read_csv("retail_sales_dataset.csv")
print("Loaded!")
df.head()`,
      },
      note: 'By convention pandas is imported as pd. You will see "import pandas as pd" at the top of almost every data notebook in the world.',
    },
    {
      title: 'Exercise 1: Inspection with the Diagnostic Trio',
      content: `<p>Three commands give you an instant health check of any dataset:</p>
<table>
  <tr><th>Command</th><th>Answers</th></tr>
  <tr><td><code>df.shape</code></td><td>Size: (rows, columns)</td></tr>
  <tr><td><code>df.head()</code> / <code>df.tail()</code></td><td>Preview: what do the first/last rows look like?</td></tr>
  <tr><td><code>df.info()</code></td><td>Structure: column names, data types, non-null counts (missing values!)</td></tr>
</table>`,
      code: [
        { language: 'python', run: true, content: `print("Rows, columns:", df.shape)
df.tail(3)` },
        { language: 'python', run: true, content: `df.info()` },
      ],
      after: `<p><strong>Reading info():</strong> all 9 columns have 1000 non-null values, so there are no missing values. But notice <code>Date</code> is stored as <code>object</code> (text), not as a date. We must fix that before any time analysis.</p>`,
    },
    {
      title: 'Fix the Data Types',
      content: `<p>Wrong data types are the most common silent bug in analysis. A date stored as text can't be sorted chronologically or grouped by month. Convert it with <code>pd.to_datetime()</code>, and mark text columns with few repeated values (like Gender) as <code>category</code> to save memory and make intent clear.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `df["Date"] = pd.to_datetime(df["Date"])
df["Gender"] = df["Gender"].astype("category")
df["Product Category"] = df["Product Category"].astype("category")

print(df.dtypes)
print("\\nDate range:", df["Date"].min().date(), "to", df["Date"].max().date())`,
      },
    },
    {
      title: 'Exercise 2: Missing Values and Duplicates',
      content: `<p>This retail file is already clean, but real data rarely is. To practise, we make a <strong>messy copy</strong> with some missing ages, missing categories and duplicated rows, then clean it.</p>
<h4>The danger of NaNs</h4>
<p>Missing values (<code>NaN</code>) break many algorithms and silently distort averages. Two options:</p>
<table>
  <tr><th>Approach</th><th>Pros</th><th>Cons</th></tr>
  <tr><td><code>dropna()</code>: remove rows</td><td>Simple, no invented data</td><td>Loses information; can bias results if the missing rows are special</td></tr>
  <tr><td><code>fillna()</code>: impute values</td><td>Keeps every row</td><td>Invented values reduce variability; choose median/mode carefully</td></tr>
</table>
<p><strong>Duplicates</strong> skew financial reporting: the same transaction counted twice inflates revenue.</p>`,
      code: [
        { language: 'python', run: true, content: `import numpy as np

messy = df.copy()
rng = np.random.default_rng(0)
messy.loc[rng.choice(messy.index, 40, replace=False), "Age"] = np.nan
messy["Product Category"] = messy["Product Category"].astype("object")
messy.loc[rng.choice(messy.index, 15, replace=False), "Product Category"] = np.nan
messy = pd.concat([messy, messy.sample(25, random_state=1)])   # add 25 duplicated rows

print("Shape:", messy.shape)
print("Duplicated rows:", messy.duplicated().sum())
messy.isna().sum()` },
        { language: 'python', run: true, content: `clean = messy.drop_duplicates().copy()   # .copy() makes an independent table we can safely edit

# Numbers: fill with the median (robust to outliers)
clean["Age"] = clean["Age"].fillna(clean["Age"].median())
# Categories: fill with the most frequent value (the mode)
clean["Product Category"] = clean["Product Category"].fillna(clean["Product Category"].mode()[0])

print("Shape after cleaning:", clean.shape)
print("Missing values left:", clean.isna().sum().sum())` },
      ],
      note: 'Always record what you cleaned and why ("filled 40 missing ages with the median, 42"). Cleaning decisions change results, so they must be reproducible and explainable.',
    },
    {
      title: 'Exercise 3: Summary Statistics with describe()',
      content: `<p><code>df.describe()</code> summarises every numeric column: count, <strong>mean</strong>, <strong>std</strong> (standard deviation: how spread out values are), <strong>min</strong>, the 25th/50th/75th percentiles, and <strong>max</strong>. The 50% row is the <strong>median</strong>.</p>`,
      code: [
        { language: 'python', run: true, content: `df[["Age", "Quantity", "Price per Unit", "Total Amount"]].describe().round(1)` },
        { language: 'python', run: true, content: `print("Mean spend:  ", round(df["Total Amount"].mean(), 1))
print("Median spend:", df["Total Amount"].median())
print("Unique customers:", df["Customer ID"].nunique())
df["Product Category"].value_counts()` },
      ],
      after: `<h4>Averages lie</h4>
<p>The mean transaction is about <strong>456</strong>, but the median is only <strong>135</strong>. A small number of large purchases (up to 2,000) pull the mean up. The median is more robust: it tells you what a <em>typical</em> transaction looks like. Always check both. The <code>max</code> row is also where extreme outliers show up first.</p>`,
    },
    {
      title: 'Exercise 4: Group Comparisons with groupby()',
      content: `<p><code>groupby()</code> does exactly what SQL's <code>GROUP BY</code> does: split rows into groups, apply an aggregate, combine the results. A full table shows noise; a grouped table shows <strong>signal</strong>.</p>
<table>
  <tr><th>SQL</th><th>pandas</th></tr>
  <tr><td><code>SELECT Gender, SUM("Total Amount") FROM sales GROUP BY Gender</code></td><td><code>df.groupby("Gender")["Total Amount"].sum()</code></td></tr>
</table>
<p><strong>Business questions:</strong> Do men or women spend more? Which product category is most popular by units, and which earns the most revenue?</p>`,
      code: [
        { language: 'python', run: true, content: `df.groupby("Gender", observed=True)["Total Amount"].agg(["count", "sum", "mean"]).round(1)` },
        { language: 'python', run: true, content: `category_summary = (
    df.groupby("Product Category", observed=True)
      .agg(transactions=("Transaction ID", "count"),
           units_sold=("Quantity", "sum"),
           revenue=("Total Amount", "sum"),
           avg_basket=("Total Amount", "mean"))
      .sort_values("revenue", ascending=False)
      .round(1)
)
category_summary` },
      ],
      note: 'observed=True tells pandas to only show category values that actually appear. It silences a warning you would otherwise see with category columns.',
    },
    {
      title: 'Going Deeper: Age Groups, Pivot Tables and Monthly Trends',
      content: `<ul>
  <li><code>pd.cut()</code> turns a number into ranges (bins), e.g. ages 18–29, 30–44, …</li>
  <li><code>pivot_table()</code> summarises two dimensions at once, like an Excel pivot table.</li>
  <li><code>.dt.to_period("M")</code> converts dates to months so you can see trends over time.</li>
</ul>`,
      code: [
        { language: 'python', run: true, content: `df["Age Group"] = pd.cut(df["Age"], bins=[17, 29, 44, 59, 64],
                          labels=["18-29", "30-44", "45-59", "60-64"])

pd.pivot_table(df, values="Total Amount", index="Age Group", columns="Product Category",
               aggfunc="sum", observed=True)` },
        { language: 'python', run: true, content: `monthly = df.groupby(df["Date"].dt.to_period("M"))["Total Amount"].sum()
print("Best month: ", monthly.idxmax(), monthly.max())
print("Worst month:", monthly.idxmin(), monthly.min())
monthly.head(13)` },
      ],
      after: `<p>Notice the last period, <code>2024-01</code>: its revenue is tiny because the data only contains a few transactions on 1 January 2024. A careless analyst might report "sales collapsed in January 2024". A careful one checks the date range first. This is exactly why EDA matters.</p>`,
    },
    {
      title: 'Document Your Findings & Wrap-Up',
      content: `<p>EDA notes become the foundation for every downstream decision. Add a <strong>Text</strong> cell at the end of your notebook with your findings. Example:</p>
<ol>
  <li><strong>Size:</strong> 1,000 transactions, 9 columns, 1,000 unique customers (one transaction each), dated 2023-01-01 to 2024-01-01.</li>
  <li><strong>Quality:</strong> no missing values or duplicates in the original file; <code>Date</code> needed converting from text.</li>
  <li><strong>Spending:</strong> median transaction 135 vs mean 456, so spending is right-skewed with a few large baskets.</li>
  <li><strong>Gender:</strong> female and male customers spend almost the same on average (≈456 vs ≈455).</li>
  <li><strong>Products:</strong> Clothing has the most transactions and units; Electronics earns the most revenue.</li>
  <li><strong>Caution:</strong> January 2024 is a partial month and must not be compared to full months.</li>
</ol>
<p><strong>Up next (Lab 2):</strong> summary tables are good, but charts are how you communicate findings to stakeholders. You'll turn distributions and comparisons into clear visuals.</p>
<p>Save your notebook to GitHub under <code>eda/</code>.</p>`,
    },
  ],
  quiz: [
    {
      question: 'What is the main purpose of EDA?',
      options: [
        'To train the final machine-learning model',
        'To understand a dataset\'s structure, quality and patterns before modelling or making decisions',
        'To make the dataset smaller',
        'To publish charts on social media',
      ],
      answer: 1,
    },
    {
      question: 'Which command shows column data types and non-null counts?',
      options: ['<code>df.shape</code>', '<code>df.head()</code>', '<code>df.info()</code>', '<code>df.describe()</code>'],
      answer: 2,
    },
    {
      question: 'The Date column is stored as <code>object</code>. What should you do?',
      options: ['Delete it', 'Convert it with <code>pd.to_datetime()</code>', 'Fill it with the mean', 'Nothing; text dates work the same'],
      answer: 1,
    },
    {
      question: 'Why fill missing ages with the <em>median</em> rather than the mean?',
      options: [
        'The median is always larger',
        'The median is robust to extreme outliers',
        'pandas cannot compute the mean of a column with NaNs',
        'The median removes duplicates',
      ],
      answer: 1,
    },
    {
      question: 'What is a disadvantage of <code>dropna()</code>?',
      options: [
        'It invents data',
        'It loses rows of information and can bias results',
        'It only works on text columns',
        'It sorts the data',
      ],
      answer: 1,
    },
    {
      question: 'Mean spend is 456 but median spend is 135. What does this suggest?',
      options: [
        'The data has no outliers',
        'A few large purchases pull the mean up; the distribution is right-skewed',
        'Most customers spend more than 456',
        'The calculation is wrong',
      ],
      answer: 1,
    },
    {
      question: 'Why are duplicate rows dangerous in sales data?',
      options: [
        'They make the file smaller',
        'They double-count transactions and inflate totals such as revenue',
        'They change the column names',
        'They convert numbers into text',
      ],
      answer: 1,
    },
    {
      question: 'Which pandas code is equivalent to SQL <code>GROUP BY Gender</code> with <code>SUM("Total Amount")</code>?',
      options: [
        '<code>df["Gender"].sum()</code>',
        '<code>df.groupby("Gender")["Total Amount"].sum()</code>',
        '<code>df.sort_values("Gender")</code>',
        '<code>df.pivot("Gender")</code>',
      ],
      answer: 1,
    },
    {
      question: 'What does <code>pd.cut(df["Age"], bins=[17, 29, 44, 59, 64])</code> do?',
      options: [
        'Deletes ages outside the bins',
        'Groups each age into a range such as 18–29',
        'Rounds ages to the nearest bin edge',
        'Sorts the ages',
      ],
      answer: 1,
    },
    {
      question: 'January 2024 shows very low revenue. What is the correct interpretation?',
      options: [
        'Sales collapsed in January 2024',
        'The dataset only includes part of that month, so it cannot be compared with full months',
        'Customers stopped buying Electronics',
        'The data has missing values',
      ],
      answer: 1,
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   LAB 2 — EDA II: Visualisation with Matplotlib & Seaborn
   ───────────────────────────────────────────────────────────── */
window.DAA_LAB_DATA['daa-04_lab2'] = {
  title:      'EDA II: Visualisation with Matplotlib & Seaborn',
  difficulty: 'Intermediate → Advanced',
  duration:   '2 hours',
  datasets:   ['cars', 'ricciardo'],
  overview:   'Imagine scanning a spreadsheet of 50,000 rows for the highest value or a trend: impossible by eye. Charts offload that burden to our visual system. In this lab you learn to choose the right chart for each analytical question and build the four core chart types (histogram, bar chart, scatter plot and boxplot) on a 50,000-row car sales dataset with Matplotlib and Seaborn. You then apply the same workflow to Daniel Ricciardo\'s Formula 1 career data and practise explaining each chart in one clear sentence.',
  objectives: [
    'Explain why visualisation matters and how to pick the right chart for a question',
    'Use Matplotlib (the foundation) and Seaborn (statistical plotting on top of it)',
    'Show a distribution with a histogram and KDE line',
    'Compare categories with a labelled bar chart',
    'Explore relationships with a scatter plot and a correlation heatmap, remembering correlation ≠ causation',
    'Read a boxplot: median, interquartile range, whiskers and outliers',
    'Apply the Ask → Pick → Read workflow to a second dataset and communicate findings clearly',
  ],
  steps: [
    {
      title: 'The Power of Visualisation',
      content: `<p>Charts help people see patterns significantly faster than raw tables. A good chart exposes differences between groups, trends over time, and unusual outliers.</p>
<h4>Building a chart is easy; building the <em>right</em> chart is hard</h4>
<table>
  <tr><th>Question</th><th>Good choice</th><th>Bad choice</th></tr>
  <tr><td>How is one numeric variable spread out?</td><td>Histogram</td><td>Bar chart of raw values</td></tr>
  <tr><td>Which category is bigger / better?</td><td>Bar chart</td><td>Pie chart with 50 slices</td></tr>
  <tr><td>Are two numbers related?</td><td>Scatter plot</td><td>Two separate histograms</td></tr>
  <tr><td>How does spread differ between groups?</td><td>Boxplot</td><td>Line chart for unordered groups</td></tr>
</table>
<h4>The workflow: Ask → Pick → Read</h4>
<ol>
  <li><strong>Ask</strong> a specific question ("Does mileage lower the price?").</li>
  <li><strong>Pick</strong> the chart that answers that question.</li>
  <li><strong>Read</strong> the result and write the takeaway in one sentence.</li>
</ol>
<h4>The libraries</h4>
<ul>
  <li><strong>Matplotlib</strong>: the heavy foundation. Full control over every element of a figure.</li>
  <li><strong>Seaborn</strong>: a friendlier layer on top of Matplotlib that makes statistical plots easier and prettier, and works directly with DataFrames.</li>
</ul>`,
    },
    {
      title: 'Set Up and Prepare the Car Sales Data',
      content: `<p>Create <code>DAA_Topic4_Lab2_Viz.ipynb</code> and upload <code>car_sales_data.csv</code> (1.9 MB):</p>
${window.DAA_COLAB_UPLOAD}
<p>Even in a visualisation lab, start with a quick EDA check (Lab 1's diagnostic trio).</p>`,
      datasets: ['cars'],
      code: [
        { language: 'python', run: true, content: `import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_theme(style="whitegrid")

cars = pd.read_csv("car_sales_data.csv")
print(cars.shape)
cars.head()` },
        { language: 'python', run: true, content: `print("Missing values:", cars.isna().sum().sum())
print("Duplicate rows:", cars.duplicated().sum())
cars = cars.drop_duplicates()
print("Rows after removing duplicates:", len(cars))
cars.describe().round(1)` },
      ],
      after: `<p>Mean price ≈ 13,800 but median ≈ 8,000: prices are right-skewed. Keep that in mind; the histogram will show it.</p>`,
    },
    {
      title: 'Section 1–2: Distributions with Histograms',
      content: `<p><strong>Ask:</strong> "How are car prices spread out, and where is the bulk of the data?"<br><strong>Pick:</strong> a histogram. It splits the numeric range into bins and counts how many values fall in each.</p>
<p><code>kde=True</code> adds a smooth <strong>kernel density estimate</strong> line over the bars, which shows the overall shape. Adding vertical lines for the mean and median makes the skew obvious.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `plt.figure(figsize=(9, 4.5))
sns.histplot(cars["Price"], bins=60, kde=True, color="seagreen")
plt.axvline(cars["Price"].mean(), color="red", linestyle="--", label=f"Mean {cars['Price'].mean():,.0f}")
plt.axvline(cars["Price"].median(), color="black", linestyle=":", label=f"Median {cars['Price'].median():,.0f}")
plt.title("Distribution of Car Prices")
plt.xlabel("Price")
plt.ylabel("Number of cars")
plt.legend()
plt.show()`,
      },
      after: `<p><strong>Read:</strong> most cars sell for under 20,000, with a long tail of expensive cars stretching past 150,000. The mean sits to the right of the median, which is the signature of a right-skewed distribution.</p>`,
    },
    {
      title: 'Section 3: Comparing Categories with Bar Charts',
      content: `<p><strong>Ask:</strong> "Which fuel type has the highest average price?"<br><strong>Pick:</strong> a bar chart, the best way to compare a quantity across distinct categories.</p>
<p><strong>A chart without labels is a guessing game.</strong> Always add a title and axis labels. Sorting the bars makes comparisons instant.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `avg_price = cars.groupby("Fuel type")["Price"].mean().sort_values(ascending=False)
print(avg_price.round(0))

plt.figure(figsize=(7, 4))
sns.barplot(x=avg_price.index, y=avg_price.values, color="seagreen")
plt.title("Average Car Price by Fuel Type")
plt.xlabel("Fuel type")
plt.ylabel("Average price")
plt.show()`,
      },
      after: `<p><strong>Read:</strong> hybrids have the highest average price, followed by petrol and diesel. The differences are modest compared with the huge spread inside each group, which the boxplot will reveal.</p>`,
      note: 'Pie charts are usually a poor choice: people compare lengths far more accurately than angles, and pies become unreadable beyond 4–5 slices.',
    },
    {
      title: 'Section 4: Relationships with Scatter Plots',
      content: `<p><strong>Ask:</strong> "Does higher mileage mean a lower price?"<br><strong>Pick:</strong> a scatter plot. Each dot is one car: x = mileage, y = price.</p>
<p>With 50,000 points, dots overlap into a blob. Plot a random <strong>sample</strong> and make points semi-transparent (<code>alpha</code>) so dense areas show up darker. Colouring by a category (<code>hue</code>) adds a third dimension.</p>`,
      code: [
        { language: 'python', run: true, content: `sample = cars.sample(3000, random_state=42)

plt.figure(figsize=(9, 5))
sns.scatterplot(data=sample, x="Mileage", y="Price", hue="Fuel type", alpha=0.5, s=15)
plt.title("Mileage vs Price (3,000 sampled cars)")
plt.xlabel("Mileage")
plt.ylabel("Price")
plt.show()` },
        { language: 'python', run: true, content: `# Correlation: +1 = move together, -1 = move opposite, 0 = no linear relationship
cars[["Engine size", "Year of manufacture", "Mileage", "Price"]].corr().round(2)` },
      ],
      after: `<p><strong>Read:</strong> price falls as mileage rises (correlation ≈ −0.63), and newer cars are pricier (≈ +0.71).</p>
<p><strong>Correlation is not causation.</strong> Mileage and year are strongly linked (older cars have driven further, ≈ −0.81), so part of the "mileage effect" may really be an "age effect". A scatter plot shows <em>that</em> things move together, not <em>why</em>.</p>`,
    },
    {
      title: 'Section 5: Spread and Outliers with Boxplots',
      content: `<p><strong>Ask:</strong> "How does the price range differ between manufacturers, and where are the outliers?"<br><strong>Pick:</strong> a boxplot.</p>
<h4>Anatomy of a boxplot</h4>
<ul>
  <li>The <strong>line inside the box</strong> is the median.</li>
  <li>The <strong>box</strong> covers the middle 50% of values, from the 25th to the 75th percentile: the <strong>interquartile range (IQR)</strong>.</li>
  <li>The <strong>whiskers</strong> extend to the "normal" range: up to 1.5 × IQR beyond the box.</li>
  <li><strong>Dots</strong> beyond the whiskers are outliers.</li>
</ul>`,
      code: {
        language: 'python',
        run: true,
        content: `order = cars.groupby("Manufacturer")["Price"].median().sort_values().index

plt.figure(figsize=(9, 5))
sns.boxplot(data=cars, x="Manufacturer", y="Price", order=order, color="lightgreen",
            flierprops={"markersize": 2, "alpha": 0.3})
plt.title("Price Spread by Manufacturer")
plt.xlabel("Manufacturer")
plt.ylabel("Price")
plt.show()`,
      },
      after: `<p><strong>Read:</strong> Porsche has by far the highest median and widest spread, while Ford and VW sit at the budget end. Every brand has many high-price outliers, typically newer, low-mileage cars.</p>`,
    },
    {
      title: 'Bonus: Correlation Heatmap and Saving Charts',
      content: `<p>A <strong>heatmap</strong> shows a whole correlation matrix as colours, useful when you have many numeric columns. <code>annot=True</code> writes the numbers in each cell.</p>
<p>To use a chart in a report, save it with <code>plt.savefig()</code> <em>before</em> <code>plt.show()</code>. The file appears in Colab's Files panel; right-click → Download.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `corr = cars[["Engine size", "Year of manufacture", "Mileage", "Price"]].corr()

plt.figure(figsize=(6, 4.5))
sns.heatmap(corr, annot=True, fmt=".2f", cmap="Greens", vmin=-1, vmax=1)
plt.title("Correlation Between Car Features")
plt.savefig("car_correlations.png", dpi=150, bbox_inches="tight")
plt.show()`,
      },
    },
    {
      title: 'Apply It: Daniel Ricciardo\'s F1 Career',
      content: `<p>Now repeat the workflow on a completely different dataset: every race entry in Daniel Ricciardo's Formula 1 career. Upload <code>daniel_ricciardo.csv</code>.</p>
<ol>
  <li><strong>Structure:</strong> shape, info(), missing values.</li>
  <li><strong>Summaries:</strong> <code>describe()</code> for numbers, <code>describe(include="object")</code> for text columns.</li>
  <li><strong>Categories:</strong> <code>value_counts()</code> for teams, cars and engines.</li>
  <li><strong>Charts:</strong> entries by year (bar), most common teams (horizontal bar).</li>
</ol>`,
      datasets: ['ricciardo'],
      code: [
        { language: 'python', run: true, content: `f1 = pd.read_csv("daniel_ricciardo.csv")
print(f1.shape)
print(f1.isna().sum())
f1.tail(3)` },
        { language: 'python', run: true, content: `# The last two rows of the file are blank, which is also why "year" was read as a decimal (float)
f1 = f1.dropna(subset=["year"]).copy()
f1["year"] = f1["year"].astype(int)
print("Rows after removing blank rows:", len(f1))
f1.describe(include="object")` },
        { language: 'python', run: true, content: `print(f1["team"].value_counts().head(), "\\n")
print(f1["engine_type"].value_counts().head())` },
        { language: 'python', run: true, content: `fig, axes = plt.subplots(1, 2, figsize=(13, 4.5))

f1["year"].value_counts().sort_index().plot(kind="bar", ax=axes[0], color="seagreen")
axes[0].set_title("Race Entries per Year")
axes[0].set_xlabel("Year")
axes[0].set_ylabel("Entries")

f1["team"].value_counts().head(10).sort_values().plot(kind="barh", ax=axes[1], color="orange")
axes[1].set_title("Entries by Team")
axes[1].set_xlabel("Entries")

plt.tight_layout()
plt.show()` },
      ],
      after: `<h4>Data-quality issues this dataset teaches</h4>
<ul>
  <li><strong>Blank rows</strong> at the end of the file turned <code>year</code> into a float until we removed them.</li>
  <li><strong>Text placeholders:</strong> <code>grid_number</code> contains the text <code>na</code> for races where he was the third driver, so pandas reads the whole column as text (object). <code>pd.to_numeric(f1["grid_number"], errors="coerce")</code> turns "na" into a real NaN.</li>
  <li><strong>Duplicate column names:</strong> the file has two columns called <code>race_number</code>; pandas renames the second one <code>race_number.1</code>. In a real project, confirm with the data owner what each column means before analysing it.</li>
  <li><strong>Sparse columns:</strong> <code>event</code> is only filled when something notable happened (a retirement reason, a penalty), so most values are NaN by design.</li>
</ul>`,
    },
    {
      title: 'Present Your Findings',
      content: `<p>In the live class, 2–3 students share one chart and explain it in <strong>one simple sentence</strong>. Practise writing yours in a Text cell:</p>
<ul>
  <li>"Most cars sell for under 20,000, but a long tail of luxury cars pulls the average up to about 13,800."</li>
  <li>"Price drops steadily with mileage, although this is partly because high-mileage cars are also older."</li>
  <li>"Porsche prices are both the highest and the most variable of the five brands."</li>
</ul>
<h4>The golden rules</h4>
<ol>
  <li><strong>Always label</strong> the title and both axes.</li>
  <li><strong>Match the chart to the question</strong> (Ask → Pick → Read).</li>
  <li><strong>Compare systematically</strong>: sort bars, use consistent scales.</li>
  <li><strong>Don't mislead</strong>: don't truncate axes to exaggerate differences, and never claim causation from a scatter plot.</li>
</ol>
<p>Save your notebook to GitHub under <code>eda/</code>.</p>`,
    },
  ],
  quiz: [
    {
      question: 'Which chart best shows the distribution of a single numeric variable such as car price?',
      options: ['Pie chart', 'Histogram', 'Line chart', 'Scatter plot'],
      answer: 1,
    },
    {
      question: 'What does <code>kde=True</code> add to a Seaborn histogram?',
      options: ['A legend', 'A smooth density curve showing the overall shape', 'Error bars', 'A second y-axis'],
      answer: 1,
    },
    {
      question: 'Which chart is best for comparing average price across fuel types?',
      options: ['Bar chart', 'Histogram', 'Pie chart with many slices', 'Boxplot of mileage'],
      answer: 0,
    },
    {
      question: 'Why sample 3,000 rows and use <code>alpha</code> for the scatter plot?',
      options: [
        'Seaborn cannot plot more than 3,000 points',
        'To reduce overplotting so dense areas and patterns are visible',
        'To make the correlation stronger',
        'To remove outliers permanently',
      ],
      answer: 1,
    },
    {
      question: 'A correlation of −0.63 between mileage and price means…',
      options: [
        'Mileage causes prices to fall',
        'As mileage increases, price tends to decrease',
        'There is no relationship',
        '63% of cars have high mileage',
      ],
      answer: 1,
    },
    {
      question: 'In a boxplot, what does the box represent?',
      options: ['The full range of the data', 'The middle 50% of values (the interquartile range)', 'The mean ± 1', 'Only the outliers'],
      answer: 1,
    },
    {
      question: 'In a boxplot, dots beyond the whiskers are…',
      options: ['Errors that must be deleted', 'Outliers: values far from the typical range', 'The median', 'Missing values'],
      answer: 1,
    },
    {
      question: 'What is the relationship between Matplotlib and Seaborn?',
      options: [
        'They are competing libraries that cannot be used together',
        'Seaborn is built on top of Matplotlib and makes statistical plots easier',
        'Matplotlib is built on top of Seaborn',
        'Seaborn is only for maps',
      ],
      answer: 1,
    },
    {
      question: 'Why is <code>grid_number</code> read as text in the Ricciardo data?',
      options: [
        'pandas always reads numbers as text',
        'Some cells contain the text "na", so the whole column becomes object',
        'The CSV file is corrupted',
        'Grid numbers are letters in F1',
      ],
      answer: 1,
    },
    {
      question: 'Which is a golden rule of honest visualisation?',
      options: [
        'Remove axis labels to keep charts clean',
        'Use pie charts for every comparison',
        'Label axes, match the chart to the question, and never imply causation from correlation alone',
        'Truncate axes to make differences look bigger',
      ],
      answer: 2,
    },
  ],
};
