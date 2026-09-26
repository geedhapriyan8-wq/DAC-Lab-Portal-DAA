/* ============================================================
   DAA Topic 05 — Web Scraping
   Lab 1: Web Scraping with Requests & BeautifulSoup
   Source material: DAA-005 Web Scraping slides,
   Web_Scraping_Student notebook (weather.gov forecast)
   ============================================================ */

window.DAA_LAB_DATA = window.DAA_LAB_DATA || {};

window.DAA_LAB_DATA['daa-05_lab1'] = {
  title:      'Web Scraping with Requests & BeautifulSoup',
  difficulty: 'Beginner → Advanced',
  duration:   '2 hours',
  overview:   'When the data you need is on a website but there is no API or downloadable file, you can collect it yourself with web scraping. In this lab you learn how scraping works (request → parse → extract), how to read a page\'s HTML with your browser\'s developer tools, and how to use Python\'s requests and BeautifulSoup libraries. You practise on a small HTML snippet, scrape a live 7-day weather forecast into a pandas table, crawl multiple pages of a practice site politely, clean the results for analysis, and learn when to use Scrapy, Selenium or an API instead, and how to scrape ethically.',
  objectives: [
    'Explain what web scraping is, where it fits in the data pipeline, and real business use cases',
    'Apply ethical and legal rules: robots.txt, rate limits, terms of service and personal data',
    'Read HTML structure (tags, attributes, class and id) with browser developer tools',
    'Fetch pages with requests and interpret HTTP status codes',
    'Extract data with find(), find_all(), select() and get_text()',
    'Turn scraped data into a clean pandas DataFrame and save it as CSV',
    'Crawl multiple pages politely and choose between BeautifulSoup, Scrapy, Selenium and APIs',
  ],
  steps: [
    {
      title: 'What Is Web Scraping?',
      content: `<p><strong>Web scraping</strong> is the automated extraction of data from websites. It involves three steps:</p>
<ol>
  <li><strong>Send a request</strong> to a web page (like your browser does).</li>
  <li><strong>Parse</strong> its structure (HTML/CSS).</li>
  <li><strong>Extract</strong> the specific information you need.</li>
</ol>
<p><strong>Key idea:</strong> scraping converts <em>unstructured</em> web content into <em>structured</em> formats such as CSV, JSON or Excel that you can analyse.</p>
<h4>Why scrape?</h4>
<ul>
  <li><strong>Fills data gaps</strong> when no API or dataset is available.</li>
  <li><strong>Cost-effective:</strong> no proprietary tools needed.</li>
  <li><strong>Flexible:</strong> customisable for any public website.</li>
</ul>
<h4>Where it fits in data science</h4>
<p>Data science is a pyramid. Scraping sits at the very bottom, in <strong>data collection</strong> (alongside APIs and sensor logs). Everything above it (storage, cleaning, EDA, statistics, machine learning, LLMs) depends on data being collected first.</p>
<h4>Real use cases</h4>
<ul>
  <li>Monitoring e-commerce prices of competitors.</li>
  <li>Analysing public sentiment from forums and social media.</li>
  <li>Gathering open data to train machine-learning models.</li>
  <li>Club project example (FDM Singapore): sentiment analysis of a campaign via the Reddit API, and competitor analysis by batch-scraping job sites.</li>
</ul>`,
    },
    {
      title: 'Scrape Ethically and Legally',
      content: `<p>Before writing a single line of scraping code, learn the rules. Scraping carelessly can overload servers, breach terms of service, or violate privacy law.</p>
<table>
  <tr><th>Do</th><th>Don't</th></tr>
  <tr><td>Check and follow <code>robots.txt</code> (e.g. <code>site.com/robots.txt</code>), where sites list what bots may access</td><td>Scrape sensitive or private personal data</td></tr>
  <tr><td>Limit your request rate: pause between requests (<code>time.sleep</code>)</td><td>Bypass security measures such as logins or CAPTCHAs</td></tr>
  <tr><td>Identify your scraper with a clear User-Agent</td><td>Republish copyrighted content as your own</td></tr>
  <tr><td>Prefer an official API when one exists</td><td>Ignore a site's terms of service</td></tr>
  <tr><td>Use scraped data responsibly and store only what you need</td><td>Hammer a server with hundreds of parallel requests</td></tr>
</table>
<p>Personal data is protected by laws such as Singapore's <strong>PDPA</strong> and the EU's <strong>GDPR</strong>. Even if data is publicly visible, collecting and reusing personal information can still be regulated.</p>`,
      warning: 'In this lab you scrape only a public government weather forecast and a website built specifically for scraping practice (quotes.toscrape.com).',
    },
    {
      title: 'Anatomy of a Web Page: HTML and DevTools',
      content: `<p>Web pages are written in <strong>HTML</strong>: text wrapped in <em>tags</em> that nest inside each other like boxes.</p>
<ul>
  <li><code>&lt;p&gt;…&lt;/p&gt;</code> paragraph, <code>&lt;a href="…"&gt;</code> link, <code>&lt;div&gt;</code> generic container, <code>&lt;img&gt;</code> image, <code>&lt;li&gt;</code> list item.</li>
  <li><strong>Attributes</strong> add information inside the opening tag: <code>&lt;div id="seven-day-forecast" class="panel"&gt;</code>.</li>
  <li><code>id</code> is unique on the page; <code>class</code> can be shared by many elements. Scrapers use both to pinpoint data.</li>
</ul>
<h4>Find the data with Developer Tools (step by step)</h4>
<ol>
  <li>Open <strong>forecast.weather.gov/MapClick.php?lat=37.7772&amp;lon=-122.4168</strong> (San Francisco) in Chrome.</li>
  <li>Right-click on the first forecast day (e.g. "Tonight") and choose <strong>Inspect</strong>.</li>
  <li>The <strong>Elements</strong> panel opens with that HTML highlighted. Hover over lines to see which part of the page they draw.</li>
  <li>Notice the structure: a <code>div</code> with <code>id="seven-day-forecast"</code> contains several <code>div class="tombstone-container"</code>, each with a <code>p class="period-name"</code>, an <code>img</code>, a <code>p class="short-desc"</code> and a <code>p class="temp"</code>.</li>
</ol>
<p>That structure is your "map". The code simply follows it.</p>`,
    },
    {
      title: 'Set Up Colab',
      content: `<p>Create <code>DAA_Topic5_WebScraping.ipynb</code>. Colab already includes the libraries you need, so there's nothing to install.</p>
<ul>
  <li><strong>requests</strong>: downloads web pages (sends HTTP requests).</li>
  <li><strong>BeautifulSoup</strong> (package <code>bs4</code>): one of the most common parsing libraries. It turns messy HTML into a searchable tree, works well for static websites, and handles broken HTML gracefully.</li>
  <li><strong>pandas</strong>: stores the extracted data as a table.</li>
</ul>`,
      code: {
        language: 'python',
        run: true,
        content: `# On your own computer you would first run:  pip install requests beautifulsoup4
import time
import requests
import pandas as pd
from bs4 import BeautifulSoup

print("requests", requests.__version__)`,
      },
    },
    {
      title: 'BeautifulSoup Basics on a Small Page',
      content: `<p>Practise the core methods on a tiny HTML page stored in a string, so the results are predictable:</p>
<table>
  <tr><th>Method</th><th>Returns</th></tr>
  <tr><td><code>soup.find("p")</code></td><td>The <em>first</em> matching tag (or <code>None</code>)</td></tr>
  <tr><td><code>soup.find_all("p")</code></td><td>A list of <em>all</em> matching tags</td></tr>
  <tr><td><code>soup.find_all(class_="price")</code></td><td>Tags with that class (<code>class_</code> has an underscore because <code>class</code> is a Python keyword)</td></tr>
  <tr><td><code>soup.find(id="news")</code></td><td>The tag with that id</td></tr>
  <tr><td><code>soup.select("div.product p.price")</code></td><td>Tags matching a CSS selector (<code>.</code> = class, <code>#</code> = id)</td></tr>
  <tr><td><code>tag.get_text(strip=True)</code></td><td>The visible text inside a tag</td></tr>
  <tr><td><code>tag.get("href")</code> or <code>tag["href"]</code></td><td>An attribute's value</td></tr>
</table>`,
      code: [
        { language: 'python', run: true, content: `html = """
<html><body>
  <h1>DAA Store</h1>
  <div id="news"><p>Sale ends Friday!</p></div>
  <div class="product">
    <p class="name">Notebook</p><p class="price">$3.50</p>
    <a href="/item/notebook">Details</a>
  </div>
  <div class="product">
    <p class="name">Backpack</p><p class="price">$45.00</p>
    <a href="/item/backpack">Details</a>
  </div>
</body></html>
"""
soup = BeautifulSoup(html, "html.parser")

print(soup.find("h1").get_text())
print(soup.find(id="news").get_text(strip=True))
print([p.get_text() for p in soup.find_all("p", class_="price")])` },
        { language: 'python', run: true, content: `# Loop over each product card and pull out several fields together
rows = []
for card in soup.select("div.product"):
    rows.append({
        "name":  card.select_one("p.name").get_text(),
        "price": float(card.select_one("p.price").get_text().replace("$", "")),
        "link":  card.find("a")["href"],
    })
pd.DataFrame(rows)` },
      ],
      note: 'Scraping repeated "cards" (products, forecasts, quotes) always follows this pattern: select every card, then extract the same fields from each one.',
    },
    {
      title: 'Requests and HTTP Status Codes',
      content: `<p><code>requests.get(url)</code> downloads a page and returns a <em>response</em>. Always check <code>response.status_code</code> before parsing:</p>
<table>
  <tr><th>Range</th><th>Meaning</th><th>Example</th></tr>
  <tr><td>100–199</td><td>Informational</td><td>100 Continue</td></tr>
  <tr><td>200–299</td><td>Success</td><td><strong>200 OK</strong></td></tr>
  <tr><td>300–399</td><td>Redirection</td><td>301 Moved Permanently</td></tr>
  <tr><td>400–499</td><td>Client error (your request)</td><td>403 Forbidden, 404 Not Found, 429 Too Many Requests</td></tr>
  <tr><td>500–599</td><td>Server error</td><td>500 Internal Server Error</td></tr>
</table>
<p>A <strong>User-Agent</strong> header tells the server who is asking. Some sites block requests that don't send one.</p>`,
      code: [
        {
          language: 'python',
          run: true,
          content: `HEADERS = {"User-Agent": "DAA-Student-Scraper/1.0 (learning project)"}

# What a robots.txt file looks like: python.org publishes one
robots = requests.get("https://www.python.org/robots.txt", headers=HEADERS, timeout=15)
print("Status:", robots.status_code)
print(robots.text[:420])`,
        },
        {
          language: 'python',
          run: true,
          content: `from urllib.robotparser import RobotFileParser

def allowed(url, robots_url):
    """Ask a site's robots.txt whether our scraper may fetch this URL."""
    rules = RobotFileParser(robots_url)
    rules.read()
    return rules.can_fetch(HEADERS["User-Agent"], url)

print("python.org /downloads/ :", allowed("https://www.python.org/downloads/", "https://www.python.org/robots.txt"))
print("weather.gov forecast   :", allowed("https://forecast.weather.gov/MapClick.php?lat=37.7772&lon=-122.4168",
                                          "https://forecast.weather.gov/robots.txt"))`,
        },
      ],
      after: `<p><code>User-agent</code> lines say which bots a rule applies to (<code>*</code> = everyone), and <code>Disallow</code> lines list paths they should not visit. The weather service publishes no robots.txt (the request returns 404), which Python's robot parser treats as "no restrictions". Its forecasts are public US-government data, but you should still scrape politely.</p>`,
    },
    {
      title: 'Scraping for Real: The 7-Day Weather Forecast',
      content: `<p>Follow the map you found with DevTools:</p>
<ol>
  <li>Download the forecast page.</li>
  <li>Create a BeautifulSoup object to parse it; <code>prettify()</code> shows it with indentation.</li>
  <li>Find the div with <code>id="seven-day-forecast"</code>.</li>
  <li>Inside it, find each <code>tombstone-container</code> (one per forecast period).</li>
  <li>Extract and print the first forecast item.</li>
</ol>`,
      code: [
        { language: 'python', run: true, content: `url = "https://forecast.weather.gov/MapClick.php?lat=37.7772&lon=-122.4168"
page = requests.get(url, headers=HEADERS, timeout=15)
print("Status:", page.status_code)

soup = BeautifulSoup(page.content, "html.parser")
seven_day = soup.find(id="seven-day-forecast")
forecast_items = seven_day.find_all(class_="tombstone-container")
print("Forecast periods found:", len(forecast_items))` },
        { language: 'python', run: true, content: `tonight = forecast_items[0]
print(tonight.prettify()[:700])` },
      ],
      note: 'This is live data from the US National Weather Service, so your output will show today\'s forecast, not the one captured here.',
    },
    {
      title: 'Extract the Fields and Build a DataFrame',
      content: `<p>From each forecast item extract four fields:</p>
<ul>
  <li><strong>Period</strong> (<code>p.period-name</code>), e.g. "Tonight".</li>
  <li><strong>Short description</strong> (<code>p.short-desc</code>), e.g. "Mostly Clear".</li>
  <li><strong>Temperature</strong> (<code>p.temp</code>), e.g. "Low: 55 °F".</li>
  <li><strong>Full description</strong>: stored in the <code>title</code> attribute of the <code>img</code> tag, not in visible text.</li>
</ul>
<p>Use CSS selectors to grab each field for <em>all</em> periods at once, then combine them into a DataFrame.</p>`,
      code: [
        { language: 'python', run: true, content: `period = tonight.find(class_="period-name").get_text(" ", strip=True)
short_desc = tonight.find(class_="short-desc").get_text(" ", strip=True)
temp = tonight.find(class_="temp").get_text(strip=True)
desc = tonight.find("img")["title"]

print("Period:     ", period)
print("Short desc: ", short_desc)
print("Temperature:", temp)
print("Description:", desc[:120], "...")` },
        { language: 'python', run: true, content: `periods    = [t.get_text(" ", strip=True) for t in seven_day.select(".tombstone-container .period-name")]
short_descs = [s.get_text(" ", strip=True) for s in seven_day.select(".tombstone-container .short-desc")]
temps      = [t.get_text(strip=True) for t in seven_day.select(".tombstone-container .temp")]
descs      = [img["title"] for img in seven_day.select(".tombstone-container img")]

weather = pd.DataFrame({"period": periods, "short_desc": short_descs, "temp": temps, "desc": descs})
weather[["period", "short_desc", "temp"]]` },
      ],
      warning: 'Websites change their HTML. If a class name changes, find() returns None and you get "AttributeError: \'NoneType\' object has no attribute…". Re-inspect the page with DevTools and update the selector.',
    },
    {
      title: 'Clean the Scraped Data for Analysis',
      content: `<p>Scraped values are text. Turn them into analysis-ready columns:</p>
<ul>
  <li><code>str.extract(r"(\\d+)")</code> uses a <strong>regular expression</strong> to pull the digits out of "Low: 55 °F".</li>
  <li>A boolean column flags night-time periods.</li>
  <li><code>to_csv()</code> saves the result; download it from Colab's Files panel.</li>
</ul>`,
      code: {
        language: 'python',
        run: true,
        content: `weather["temp_f"] = weather["temp"].str.extract(r"(\\d+)").astype(float)
weather["temp_c"] = ((weather["temp_f"] - 32) * 5 / 9).round(1)
weather["is_night"] = weather["temp"].str.contains("Low")

print(weather[["period", "temp_f", "temp_c", "is_night"]])
print("\\nAverage daytime high (°C):", weather.loc[~weather["is_night"], "temp_c"].mean().round(1))
weather.to_csv("sf_forecast.csv", index=False)`,
      },
    },
    {
      title: 'Crawl Multiple Pages Politely',
      content: `<p><strong>quotes.toscrape.com</strong> is a website built for scraping practice. Each page lists quotes; a "Next" button links to the next page. A <strong>crawler</strong> follows those links automatically.</p>
<p>Politeness rules in code: a clear User-Agent, a <code>time.sleep()</code> pause between requests, a page limit, and stopping when there is no "Next" link.</p>`,
      code: [
        { language: 'python', run: true, content: `base = "https://quotes.toscrape.com"
next_path = "/"
quotes = []

for page_number in range(1, 4):                      # limit: first 3 pages
    response = requests.get(base + next_path, headers=HEADERS, timeout=15)
    soup = BeautifulSoup(response.text, "html.parser")

    for q in soup.select("div.quote"):
        quotes.append({
            "text":   q.select_one("span.text").get_text(strip=True),
            "author": q.select_one("small.author").get_text(strip=True),
            "tags":   [t.get_text() for t in q.select("a.tag")],
        })

    print(f"Page {page_number}: {len(quotes)} quotes so far")
    next_link = soup.select_one("li.next a")
    if next_link is None:                            # no more pages
        break
    next_path = next_link["href"]
    time.sleep(1)                                    # be polite: 1 second between requests

quotes_df = pd.DataFrame(quotes)
quotes_df.head()` },
        { language: 'python', run: true, content: `print("Top authors:")
print(quotes_df["author"].value_counts().head(5))

print("\\nTop tags:")
print(quotes_df["tags"].explode().value_counts().head(5))` },
      ],
      note: '.explode() turns a column of lists into one row per list item, so each tag can be counted.',
    },
    {
      title: 'Advanced Techniques: Scrapy, Selenium and APIs',
      content: `<p>BeautifulSoup is perfect for single, static pages. Other tools fit other jobs:</p>
<table>
  <tr><th>Tool</th><th>Best for</th></tr>
  <tr><td><strong>BeautifulSoup + requests</strong></td><td>Scraping a single or few <em>static</em> pages</td></tr>
  <tr><td><strong>Scrapy</strong></td><td>Large-scale automated crawling (e.g. an entire e-commerce site), with efficient pipelines for storing data</td></tr>
  <tr><td><strong>Selenium</strong> (or Playwright)</td><td><em>Dynamic</em>, JavaScript-heavy sites; simulates a real browser: clicking, scrolling, logging in</td></tr>
  <tr><td><strong>Official API</strong></td><td>Whenever one exists: structured JSON, stable, and explicitly permitted (e.g. Reddit API)</td></tr>
</table>
<h4>Decision factors</h4>
<ul>
  <li>Is the website <strong>static or dynamic</strong>? (If the data isn't in <code>page.text</code> but you can see it in the browser, JavaScript loads it: consider Selenium, or look for the site's hidden JSON API in DevTools → Network.)</li>
  <li><strong>How much</strong> data do you need?</li>
  <li>Is <strong>scalability</strong> important?</li>
</ul>
<p><strong>Rules of thumb:</strong> single static page → BeautifulSoup; crawl a whole site → Scrapy; interactive pages → Selenium.</p>`,
    },
    {
      title: 'Wrap-Up and Scraping Checklist',
      content: `<ol>
  <li>Is there an API or dataset already? Use it first.</li>
  <li>Read <code>robots.txt</code> and the terms of service.</li>
  <li>Inspect the page with DevTools; note the ids and classes around your data.</li>
  <li>Fetch with <code>requests</code>, check the status code, send a User-Agent.</li>
  <li>Parse with BeautifulSoup; extract repeated cards with <code>select()</code> / <code>find_all()</code>.</li>
  <li>Store in a DataFrame, clean types, save to CSV.</li>
  <li>Crawl politely: delays, page limits, stop conditions.</li>
  <li>Expect the HTML to change; write clear selectors and handle <code>None</code>.</li>
</ol>
<p>Save the notebook to GitHub under <code>web-scraping/</code>, and download <code>sf_forecast.csv</code> to use in your own EDA.</p>`,
    },
  ],
  quiz: [
    {
      question: 'What are the three general steps of web scraping?',
      options: [
        'Train, test, deploy',
        'Send a request, parse the HTML, extract the needed data',
        'Download, zip, upload',
        'Log in, bypass CAPTCHA, copy',
      ],
      answer: 1,
    },
    {
      question: 'What is the purpose of a site\'s <code>robots.txt</code> file?',
      options: [
        'It stores the site\'s passwords',
        'It tells automated bots which parts of the site they may or may not access',
        'It speeds up scraping',
        'It lists the site\'s API keys',
      ],
      answer: 1,
    },
    {
      question: 'Which of these is an ethical scraping practice?',
      options: [
        'Bypassing CAPTCHAs to reach more pages',
        'Sending hundreds of parallel requests to finish faster',
        'Pausing between requests and following robots.txt',
        'Collecting personal phone numbers from profiles',
      ],
      answer: 2,
    },
    {
      question: 'What does HTTP status code 200 mean?',
      options: ['Not found', 'Server error', 'Success (OK)', 'Too many requests'],
      answer: 2,
    },
    {
      question: 'Why does BeautifulSoup use <code>class_</code> (with an underscore) in <code>find_all(class_="temp")</code>?',
      options: [
        'It is a typo that became standard',
        'Because <code>class</code> is a reserved keyword in Python',
        'Underscores make searches faster',
        'To search for ids instead of classes',
      ],
      answer: 1,
    },
    {
      question: 'What is the difference between <code>find()</code> and <code>find_all()</code>?',
      options: [
        'find() returns the first match; find_all() returns a list of all matches',
        'find() searches ids only; find_all() searches classes only',
        'They are identical',
        'find_all() only works on tables',
      ],
      answer: 0,
    },
    {
      question: 'In the weather page, where is the full forecast description stored?',
      options: ['In the page title', 'In the <code>title</code> attribute of the <code>img</code> tag', 'In a hidden CSV file', 'In the URL'],
      answer: 1,
    },
    {
      question: 'Your scraper suddenly raises <code>AttributeError: \'NoneType\' object has no attribute \'get_text\'</code>. What is the most likely cause?',
      options: [
        'Python needs to be reinstalled',
        'The site changed its HTML, so find() returned None for your selector',
        'The internet is too fast',
        'pandas is not imported',
      ],
      answer: 1,
    },
    {
      question: 'Which tool is best for scraping a JavaScript-heavy page that requires clicking and logging in?',
      options: ['BeautifulSoup alone', 'Selenium', 'pandas', 'robots.txt'],
      answer: 1,
    },
    {
      question: 'In the crawler, why do we call <code>time.sleep(1)</code> between pages?',
      options: [
        'To let Colab save the notebook',
        'To avoid overloading the server by limiting the request rate',
        'Because BeautifulSoup needs time to load',
        'To make the output print in order',
      ],
      answer: 1,
    },
  ],
};
