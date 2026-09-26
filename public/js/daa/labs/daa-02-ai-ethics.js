/* ============================================================
   DAA Topic 02 — AI Ethics
   Lab 1: AI Ethics in Practice: Auditing Bias in a Recruitment Dataset
   Source material: Intro to Ethics in AI slides,
   recruitment_bias_updated.csv
   ============================================================ */

window.DAA_LAB_DATA = window.DAA_LAB_DATA || {};

window.DAA_LAB_DATA['daa-02_lab1'] = {
  title:      'AI Ethics in Practice: Auditing Bias in a Recruitment Dataset',
  difficulty: 'Beginner → Advanced',
  duration:   '2 hours',
  datasets:   ['recruitment'],
  overview:   'AI systems learn from historical data, and history contains prejudice. In this lab you study the societal impact of AI through real cases (Amazon\'s hiring tool, Cambridge Analytica, facial recognition and autonomous vehicles) and the frameworks and laws that govern responsible AI. You then become an algorithm auditor: using a recruitment dataset of 1,000 graduate applicants, you measure whether outcomes are fair across universities, prove that equally skilled candidates are treated differently, show that a machine-learning model trained on this data learns the same bias, and reduce it with a published mitigation technique called reweighing.',
  objectives: [
    'Explain how algorithmic bias arises from historical data, sampling, features and proxies',
    'Analyse the Amazon hiring and Cambridge Analytica cases and the harms they caused',
    'Describe data protection, surveillance and facial-recognition concerns',
    'Apply the responsible-AI principles: data democracy, conscious AI, sustainability and accountability',
    'Measure fairness with selection rates, the disparate impact ratio and the four-fifths rule',
    'Show how a model trained on biased data reproduces that bias',
    'Mitigate bias with reweighing and evaluate the fairness–accuracy trade-off',
  ],
  steps: [
    {
      title: 'Why Ethics Is Part of a Data Analyst\'s Job',
      content: `<p>Every dataset you clean, every feature you choose and every model you deploy affects real people: who gets a loan, a job interview, a medical referral, or extra police attention. AI ethics is the study of the <strong>societal impact, responsible governance and ethical deployment</strong> of these systems.</p>
<p>This lab has two halves:</p>
<ol>
  <li><strong>Concepts and cases</strong>: how bias and privacy harms happen, and the frameworks and laws that respond to them.</li>
  <li><strong>Hands-on audit</strong>: you measure, reproduce and reduce bias in a recruitment dataset with Python.</li>
</ol>`,
      note: 'Many steps end with a discussion question. Write your answers in Text cells in your notebook; they are great interview material.',
    },
    {
      title: 'The Bias Problem',
      content: `<p><strong>Algorithmic bias</strong> is systematic, unfair treatment of a group produced by an automated system. AI models trained on historical data often <em>replicate</em> societal and institutional biases, posing serious threats to fairness in recruitment, lending and healthcare.</p>
<h4>Where bias comes from</h4>
<table>
  <tr><th>Source</th><th>What happens</th></tr>
  <tr><td>Historical bias</td><td>The data faithfully records past discrimination (e.g. who was hired).</td></tr>
  <tr><td>Sampling / representation bias</td><td>Some groups are under-represented, so the model learns little about them.</td></tr>
  <tr><td>Feature (proxy) bias</td><td>A seemingly neutral feature, like postcode or university, stands in for a protected attribute.</td></tr>
  <tr><td>Measurement bias</td><td>The label itself is a biased stand-in for what we care about (e.g. "past healthcare spending" as a proxy for "medical need").</td></tr>
</table>
<h4>Real-world impact</h4>
<ul>
  <li><strong>Individual profiling:</strong> systems build profiles from vast data, often without explicit consent.</li>
  <li><strong>Marginalisation:</strong> skewed training data systematically excludes certain groups.</li>
  <li><strong>Public-health inequities:</strong> healthcare algorithms trained on unrepresentative data have underestimated the medical needs of minority patients.</li>
</ul>
<p>These harms are not theoretical: they erode trust and reinforce historical prejudice.</p>`,
    },
    {
      title: 'Case Study: Amazon\'s Hiring Algorithm',
      content: `<ul>
  <li><strong>The premise:</strong> Amazon built an AI tool to automatically screen résumés and identify top talent.</li>
  <li><strong>Training-data bias:</strong> it learned from ten years of résumés submitted to a heavily male-dominated tech industry.</li>
  <li><strong>Feature bias:</strong> the model learned to penalise résumés containing words associated with women (such as "women's chess club").</li>
  <li><strong>The result:</strong> Amazon scrapped the tool. It remains a stark reminder that blindly trusting historical data perpetuates discrimination and loses diverse talent.</li>
</ul>
<p><strong>Discussion:</strong> removing the word "women's" is not enough. Why? (Hint: other words and activities can act as proxies.)</p>
<p>Keep this case in mind: in the hands-on part you will audit a recruitment dataset with a similar problem.</p>`,
    },
    {
      title: 'Privacy, Surveillance and Data Harvesting',
      content: `<table>
  <tr><th>Area</th><th>Ethical concern</th></tr>
  <tr><td><strong>Social media privacy</strong></td><td>Platforms collect vast personal data, enabling targeted manipulation, echo chambers and massive breaches, often without adequate consent.</td></tr>
  <tr><td><strong>Government surveillance</strong></td><td>National-security data collection needs strict oversight; unchecked, it erodes civil liberties and normalises constant monitoring.</td></tr>
  <tr><td><strong>Facial recognition</strong></td><td>Real-time tracking with little transparency or consent, and higher misidentification rates for minorities.</td></tr>
</table>
<h4>Case study: Cambridge Analytica (2018)</h4>
<ul>
  <li>A political data firm gained access to the data of over <strong>50 million</strong> Facebook users without explicit consent.</li>
  <li>A personality-quiz app exploited loose privacy settings to harvest data from users <em>and their entire friend networks</em>, building psychological profiles for political targeting.</li>
  <li><strong>Consequence:</strong> global outrage, record FTC fines, and faster adoption of strict data-protection laws worldwide.</li>
</ul>
<p><strong>Principle for analysts:</strong> <em>data minimisation</em>. Collect and keep only the data you need. In today's audit you will drop applicants' names, because fairness analysis doesn't need them.</p>`,
    },
    {
      title: 'Frameworks for Responsible AI and Measuring Fairness',
      content: `<table>
  <tr><th>Principle</th><th>Focus</th><th>Objective</th></tr>
  <tr><td><strong>Data democracy</strong></td><td>Equal access to and control of data</td><td>Prevent data monopolies; let marginalised communities take part in data-driven decisions.</td></tr>
  <tr><td><strong>Conscious AI</strong></td><td>Human values and moral principles</td><td>Align algorithms with societal needs and clear limits of non-maleficence ("do no harm").</td></tr>
  <tr><td><strong>Sustainability</strong></td><td>Environmental and economic impact</td><td>Reduce data-centre energy use; share AI's benefits fairly.</td></tr>
  <tr><td><strong>Accountability</strong></td><td>Transparency and explainability</td><td>Clear chains of responsibility for automated decisions to maintain public trust.</td></tr>
</table>
<h4>Turning "fairness" into numbers</h4>
<ul>
  <li><strong>Selection rate</strong> of a group = accepted ÷ applicants in that group.</li>
  <li><strong>Disparate impact (DI) ratio</strong> = selection rate of a group ÷ selection rate of the most-favoured group. 1.0 means equal treatment.</li>
  <li><strong>Four-fifths (80%) rule:</strong> a common guideline (from US employment practice) that flags a DI below <strong>0.8</strong> as evidence of adverse impact.</li>
</ul>
<p>Studies show mitigation techniques such as <strong>data reweighing</strong> can push the DI close to 1 (e.g. 0.97) with minimal loss of accuracy. You'll test that claim yourself.</p>`,
    },
    {
      title: 'Set Up Colab and Load the Recruitment Data',
      content: `<p>Create <code>DAA_Topic2_AIEthics.ipynb</code> and upload <code>recruitment_bias_updated.csv</code>:</p>
${window.DAA_COLAB_UPLOAD}
<p>Each row is a graduate applicant: their <strong>College</strong> (university), a <strong>Technical Skill Score</strong> from an assessment (50–100), and the hiring <strong>Outcome</strong>. The data is synthetic, but the pattern mirrors real audits.</p>`,
      datasets: ['recruitment'],
      code: [
        { language: 'python', run: true, content: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_theme(style="whitegrid")

df = pd.read_csv("recruitment_bias_updated.csv")
print(df.shape)
df.head()` },
        { language: 'python', run: true, content: `# Data minimisation: the audit does not need names
df = df.drop(columns=["Name"])
df["accepted"] = (df["Outcome"] == "Accepted").astype(int)

print(df.isna().sum().to_dict())
print(df["College"].value_counts())
print("\\nOverall acceptance rate:", round(df["accepted"].mean(), 3))` },
      ],
    },
    {
      title: 'Audit 1: Selection Rates by College',
      content: `<p><strong>Question:</strong> are applicants from every university accepted at similar rates?</p>`,
      code: {
        language: 'python',
        run: true,
        content: `rates = df.groupby("College").agg(applicants=("accepted", "size"),
                                   accepted=("accepted", "sum"),
                                   selection_rate=("accepted", "mean")).sort_values("selection_rate", ascending=False)
print(rates.round(3))

plt.figure(figsize=(8, 4))
sns.barplot(x=rates.index, y=rates["selection_rate"], color="seagreen")
plt.axhline(df["accepted"].mean(), color="black", linestyle="--", label="Overall rate")
plt.title("Acceptance Rate by College")
plt.ylabel("Selection rate")
plt.xlabel("College")
plt.legend()
plt.show()`,
      },
      after: `<p>One university stands far above the rest. But a skeptic would say: "Maybe their applicants are simply more skilled." A good auditor tests that explanation before concluding anything.</p>`,
    },
    {
      title: 'Audit 2: Is It Explained by Skill?',
      content: `<p>If the gap were due to skill, NUS applicants would have much higher skill scores, and at the <em>same</em> skill level every college would be accepted at similar rates. Test both.</p>`,
      code: [
        { language: 'python', run: true, content: `df.groupby("College")["Technical Skill Score"].agg(["mean", "median", "std"]).round(1)` },
        { language: 'python', run: true, content: `df["skill_band"] = pd.cut(df["Technical Skill Score"], bins=[49, 64, 79, 89, 100],
                          labels=["50-64", "65-79", "80-89", "90-100"])
band_rates = pd.pivot_table(df, values="accepted", index="skill_band", columns="College",
                            aggfunc="mean", observed=True).round(2)
print(band_rates)

band_rates.plot(marker="o", figsize=(9, 4.5))
plt.title("Acceptance Rate by Skill Band and College")
plt.ylabel("Selection rate")
plt.xlabel("Technical skill band")
plt.show()` },
      ],
      after: `<p><strong>Finding:</strong> average skill is almost identical across colleges, so skill does <em>not</em> explain the gap. At equal skill levels the treatment is completely different: with a score of 65–89, NUS applicants are accepted 89–100% of the time, while applicants from every other college in that range are <em>never</em> accepted. Everyone else needs 90+ to have a chance. The outcome depends on <em>where</em> someone studied, not only on <em>what they can do</em>: this is a prestige (proxy) bias.</p>`,
    },
    {
      title: 'Audit 3: Disparate Impact and the Four-Fifths Rule',
      content: `<p>Quantify the finding with the <strong>disparate impact ratio</strong>, comparing each college's selection rate to the most-favoured college. Anything below 0.8 fails the four-fifths rule.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `def disparate_impact(frame, group_col, outcome_col):
    rate = frame.groupby(group_col)[outcome_col].mean()
    reference = rate.idxmax()
    report = pd.DataFrame({"selection_rate": rate, "DI_vs_" + reference: rate / rate.max()})
    report["passes_80pct_rule"] = report.iloc[:, 1] >= 0.8
    return report.sort_values("selection_rate", ascending=False).round(3)

disparate_impact(df, "College", "accepted")`,
      },
      after: `<p>Every other university has a DI far below 0.8. If this were a real company, these numbers would be strong evidence of adverse impact, the kind that triggers a regulatory investigation.</p>`,
    },
    {
      title: 'A Model Learns the Same Bias',
      content: `<p>Suppose the company now trains a machine-learning model on this history to automate screening. <strong>Logistic regression</strong> predicts the probability of acceptance from College and skill (you'll study it properly in Topic 7). One-hot encoding turns College into 0/1 columns.</p>
<p>To judge fairness reliably we need predictions for <em>every</em> applicant, not a small test split (with only ~30 people per college, rates jump around by chance). <code>cross_val_predict</code> gives each applicant a prediction from a model that never saw them during training (5-fold cross-validation).</p>`,
      code: [
        { language: 'python', run: true, content: `from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import accuracy_score

X = pd.get_dummies(df[["College", "Technical Skill Score"]], columns=["College"], dtype=int)
y = df["accepted"]
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

biased_pred = cross_val_predict(LogisticRegression(max_iter=1000), X, y, cv=cv)
print("Accuracy:", round(accuracy_score(y, biased_pred), 3))
disparate_impact(df.assign(predicted=biased_pred), "College", "predicted")` },
        { language: 'python', run: true, content: `# What did the model learn? Fit on all data and inspect the weights
biased_model = LogisticRegression(max_iter=1000).fit(X, y)
pd.Series(biased_model.coef_[0], index=X.columns).round(2).sort_values(ascending=False)` },
      ],
      after: `<p>The model is almost 99% "accurate" <em>because</em> it copied the historical pattern: by far the biggest weight is on being from NUS, and its predictions reproduce the same disparate impact. <strong>High accuracy on biased labels means faithfully automating the bias.</strong></p>`,
    },
    {
      title: 'Attempt 1: "Fairness Through Unawareness"',
      content: `<p>The obvious fix is to delete the College column so the model can't see it, and select on skill alone.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `blind_pred = cross_val_predict(LogisticRegression(max_iter=1000), X[["Technical Skill Score"]], y, cv=cv)
print("Accuracy:", round(accuracy_score(y, blind_pred), 3))
disparate_impact(df.assign(predicted=blind_pred), "College", "predicted")`,
      },
      after: `<p>The gap shrinks dramatically: everyone now faces the <em>same</em> skill cut-off. Some colleges still fall just under 0.8, because their applicants happen to include slightly fewer top scorers.</p>
<p><strong>Be careful with this approach in real projects:</strong> other features (postcode, clubs, internships, even writing style) often correlate with the protected attribute and act as <em>proxies</em>, exactly as in the Amazon case. Removing one column rarely removes bias on its own, and if you delete the attribute everywhere you can no longer <em>measure</em> fairness. That's why auditors keep it for evaluation.</p>`,
    },
    {
      title: 'Attempt 2: Reweighing, and Why It Is Not Enough Here',
      content: `<p><strong>Reweighing</strong> (Kamiran &amp; Calders) keeps every row but gives each (group, outcome) combination a weight, so that in the <em>weighted</em> data the outcome is statistically independent of the group:</p>
<p style="text-align:center"><code>weight(group, outcome) = P(group) × P(outcome) ÷ P(group and outcome)</code></p>
<p>Rare combinations (e.g. accepted SIT applicants) get weights above 1; over-represented ones (accepted NUS applicants) get weights below 1. The model is then trained with <code>sample_weight</code>.</p>`,
      code: [
        { language: 'python', run: true, content: `p_group = df["College"].value_counts(normalize=True)
p_outcome = df["accepted"].value_counts(normalize=True)
p_joint = df.groupby(["College", "accepted"]).size() / len(df)

df["weight"] = [p_group[g] * p_outcome[o] / p_joint[(g, o)] for g, o in zip(df["College"], df["accepted"])]
print(df.groupby(["College", "accepted"])["weight"].first().unstack().round(2))

# In the weighted data every college now has the same acceptance rate
df.groupby("College").apply(lambda d: np.average(d["accepted"], weights=d["weight"]), include_groups=False).round(3)` },
        { language: 'python', run: true, content: `reweighed_pred = cross_val_predict(LogisticRegression(max_iter=1000), X, y, cv=cv,
                                   params={"sample_weight": df["weight"].values})
print("Accuracy:", round(accuracy_score(y, reweighed_pred), 3))
disparate_impact(df.assign(predicted=reweighed_pred), "College", "predicted")` },
      ],
      after: `<p><strong>Surprise:</strong> the weighted <em>data</em> is perfectly balanced, yet the model trained on it is still heavily biased. Why? Reweighing fixes <em>how often</em> each group is accepted, but here the bias lives in <em>how skill is judged</em>: NUS applicants were accepted from about 66 points, everyone else only from about 90. Because the model can still see College, it learns two different skill cut-offs. Published results (e.g. a DI of 0.97 after reweighing) depend heavily on the dataset; a good auditor tests the claim rather than assuming it.</p>`,
    },
    {
      title: 'Attempt 3: Equalise Selection Rates and Compare',
      content: `<p>A <strong>post-processing</strong> approach changes the decisions directly: accept the same share of applicants from every college (the overall rate, 25.9%), choosing the highest skill scores within each college. This targets <strong>demographic parity</strong>: equal selection rates across groups.</p>`,
      code: [
        { language: 'python', run: true, content: `target_rate = df["accepted"].mean()
rank_in_college = df.groupby("College")["Technical Skill Score"].rank(ascending=False, method="first", pct=True)
parity_pred = (rank_in_college <= target_rate).astype(int)

print("Accuracy:", round(accuracy_score(y, parity_pred), 3))
disparate_impact(df.assign(predicted=parity_pred), "College", "predicted")` },
        { language: 'python', run: true, content: `def worst_di(pred):
    rates = pd.Series(pred).groupby(df["College"].values).mean()
    return rates.min() / rates.max()

comparison = pd.DataFrame({
    "approach": ["Biased model (college + skill)", "Unaware (skill only)",
                 "Reweighed (college + skill)", "Equal selection rates"],
    "accuracy_vs_history": [accuracy_score(y, p) for p in (biased_pred, blind_pred, reweighed_pred, parity_pred)],
    "worst_DI": [worst_di(p) for p in (biased_pred, blind_pred, reweighed_pred, parity_pred)],
}).round(3)
comparison` },
      ],
      after: `<h4>Reading the trade-off</h4>
<ul>
  <li>"Accuracy" here means agreement with <em>biased</em> historical decisions, so losing some of it partly means the model stopped copying discrimination.</li>
  <li><strong>Fairness definitions can conflict.</strong> "Equal treatment" (one skill cut-off for all, Attempt 1) and "equal outcomes" (equal selection rates, Attempt 3) are both reasonable and usually cannot be satisfied at the same time.</li>
  <li>Choosing which definition applies is a human, ethical and legal decision, made with stakeholders, not only a technical one. Document it.</li>
</ul>`,
      note: 'Open-source toolkits standardise this kind of audit: IBM AIF360 and Microsoft Fairlearn implement reweighing, disparate-impact metrics, threshold post-processing and many other methods.',
    },
    {
      title: 'Autonomous Vehicles, Research Ethics and Global Governance',
      content: `<h4>Case study: autonomous vehicles</h4>
<ul>
  <li>AVs must make split-second ethical decisions in life-threatening situations.</li>
  <li>Companies implement ethical frameworks where the safety of pedestrians and occupants is the absolute priority.</li>
  <li><strong>Liability:</strong> who is responsible after an accident (the manufacturer, the software developer, the owner)? Robust legal frameworks are needed.</li>
  <li><strong>Transparency:</strong> to earn trust, AVs must be able to explain the reasoning behind sudden manoeuvres.</li>
</ul>
<h4>AI research ethics</h4>
<ul>
  <li><strong>Respect for autonomy:</strong> informed consent about how data is collected, used and protected.</li>
  <li><strong>Persuasive applications:</strong> apps that use psychology and AI to influence behaviour must be scrutinised to prevent manipulation of vulnerable users.</li>
  <li><strong>Open-source auditing:</strong> shared toolkits let the community evaluate fairness transparently.</li>
  <li><strong>Interdisciplinary collaboration:</strong> computer science, sociology, law and philosophy together.</li>
</ul>
<h4>Global AI policy and governance</h4>
<ul>
  <li><strong>International cooperation:</strong> the UN and OECD publish principles for trustworthy AI.</li>
  <li><strong>GDPR:</strong> the EU's data-protection law regulates cross-border data and gives people rights concerning automated decisions, often summarised as a "right to explanation".</li>
  <li><strong>National strategies:</strong> countries balance technological leadership with protecting citizens (e.g. Singapore's Model AI Governance Framework and PDPA).</li>
  <li><strong>The ultimate goal:</strong> AI that serves humanity, respects human rights, and narrows rather than widens the digital divide.</li>
</ul>`,
    },
    {
      title: 'Your Ethical AI Checklist',
      content: `<p>Add this checklist to your notebook and apply it to every future project in this course:</p>
<ol>
  <li><strong>Purpose:</strong> who benefits, and who could be harmed?</li>
  <li><strong>Data:</strong> was it collected with consent? Is it representative? Did I minimise personal data?</li>
  <li><strong>Features:</strong> could any feature be a proxy for a protected attribute?</li>
  <li><strong>Measure:</strong> compute selection rates and disparate impact per group, not just overall accuracy.</li>
  <li><strong>Mitigate:</strong> try reweighing or other techniques; document the trade-offs.</li>
  <li><strong>Explain:</strong> can I explain an individual decision to the person affected?</li>
  <li><strong>Accountability:</strong> who is responsible if it goes wrong, and how can people appeal?</li>
</ol>
<p><strong>Reflection:</strong> write a short memo (5–6 sentences) to the hiring manager summarising your audit findings and recommendation. Save the notebook to GitHub under <code>ai-ethics/</code>.</p>`,
    },
  ],
  quiz: [
    {
      question: 'Why did Amazon\'s AI recruiting tool become biased against women?',
      options: [
        'The engineers deliberately programmed it to prefer men',
        'It was trained on ten years of résumés from a male-dominated industry and learned to penalise words associated with women',
        'It used random numbers to rank candidates',
        'Women did not apply for jobs at Amazon',
      ],
    },
    {
      question: 'What made the Cambridge Analytica case a major ethics scandal?',
      options: [
        'It used too much computing power',
        'Personal data from millions of Facebook users and their friends was harvested without explicit consent for political profiling',
        'It published open-source code',
        'It trained a model that was not accurate enough',
      ],
    },
    {
      question: 'What is a "proxy" in the context of algorithmic bias?',
      options: [
        'A backup server',
        'A seemingly neutral feature that stands in for a protected attribute',
        'A type of neural network',
        'A fairness metric',
      ],
    },
    {
      question: 'How is the disparate impact ratio calculated?',
      options: [
        'Number of rejected ÷ number of accepted',
        'A group\'s selection rate ÷ the most-favoured group\'s selection rate',
        'Model accuracy ÷ 0.8',
        'The average skill score of each group',
      ],
    },
    {
      question: 'Under the four-fifths rule, which disparate impact ratio indicates potential adverse impact?',
      options: ['1.00', '0.95', '0.85', '0.20'],
    },
    {
      question: 'In the audit, average skill scores were almost identical across colleges, yet acceptance rates differed greatly. What does this show?',
      options: [
        'NUS applicants are more skilled',
        'Skill does not explain the gap; outcomes depend on the college itself (a prestige bias)',
        'The dataset has missing values',
        'The four-fifths rule does not apply',
      ],
    },
    {
      question: 'A model trained on the biased hiring history achieves high accuracy. Why is that not reassuring?',
      options: [
        'Accuracy is always misleading',
        'High accuracy on biased labels means the model faithfully reproduces the historical discrimination',
        'The model must be overfitting',
        'Logistic regression cannot be accurate',
      ],
    },
    {
      question: 'Why is simply deleting the protected column ("fairness through unawareness") often not enough?',
      options: [
        'Models cannot run without that column',
        'Other features can act as proxies, and you lose the ability to measure fairness',
        'It always makes the model less accurate than reweighing',
        'It violates GDPR',
      ],
    },
    {
      question: 'What does reweighing do?',
      options: [
        'Deletes rows from the majority group',
        'Changes applicants\' skill scores',
        'Assigns training weights so that, in the weighted data, the outcome is independent of group membership',
        'Adds random noise to predictions',
      ],
    },
    {
      question: 'In the lab, "one skill cut-off for everyone" and "equal selection rates for every college" gave different results. What does this illustrate?',
      options: [
        'One of the two calculations must contain a bug',
        'Different fairness definitions can conflict, so choosing one is a human, ethical and legal decision',
        'Fairness can always be achieved with no trade-offs',
        'Selection rates are not a valid fairness measure',
      ],
    },
    {
      question: 'Which responsible-AI principle focuses on clear chains of responsibility, transparency and explainability?',
      options: ['Data democracy', 'Sustainability', 'Accountability', 'Conscious AI'],
    },
  ],
};
