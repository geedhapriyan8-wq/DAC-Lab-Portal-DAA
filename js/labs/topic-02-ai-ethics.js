/* ============================================================
   Topic 02 — AI Ethics (Integration with DAA)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

/* ─────────────────────────────────────────────────────────────
   LAB 1 — Identifying Bias and Fairness Issues in AI
   ───────────────────────────────────────────────────────────── */
window.LAB_DATA['topic-02_lab1'] = {
  title:      'Identifying Bias and Fairness Issues in AI Systems',
  difficulty: 'Simple → Intermediate',
  duration:   '50–60 minutes',
  overview:   'This lab explores one of the most critical challenges in modern AI: bias. You will learn to identify different types of bias in datasets and models, measure fairness using quantitative metrics, and understand why unchecked AI bias has caused real-world harm. By the end, you will be equipped to audit an AI system for fairness issues.',
  objectives: [
    'Understand the root causes and types of AI bias',
    'Compute key fairness metrics: demographic parity, equalized odds, and disparate impact',
    'Detect bias in a hiring dataset using Python',
    'Distinguish between individual and group fairness',
    'Propose concrete mitigation strategies for identified bias',
  ],
  steps: [
    {
      title: 'Understanding AI Bias — Definitions and Real-World Examples',
      content: `<p>AI bias occurs when an algorithm produces systematically prejudiced results due to erroneous assumptions in the machine learning process. Bias can enter at any stage: data collection, feature engineering, model training, or deployment.</p>
<h4>Types of AI Bias</h4>
<ul>
  <li><strong>Historical Bias:</strong> Training data reflects historical inequalities. Example: résumé screening models trained on historically male-dominated tech companies learn to prefer male candidates.</li>
  <li><strong>Representation Bias:</strong> Certain groups are under-represented in training data. Example: facial recognition systems trained mostly on lighter-skinned faces perform poorly on darker-skinned faces (the Gender Shades study).</li>
  <li><strong>Measurement Bias:</strong> Proxies used to measure a concept are flawed. Example: using zip code as a proxy for creditworthiness inadvertently encodes racial segregation.</li>
  <li><strong>Aggregation Bias:</strong> A one-size-fits-all model is applied across groups with significantly different characteristics.</li>
  <li><strong>Deployment Bias:</strong> A model is used in a context different from where it was validated.</li>
</ul>
<h4>Landmark Bias Incidents</h4>
<ul>
  <li><strong>COMPAS (2016):</strong> A criminal recidivism prediction tool was found to falsely flag Black defendants as high-risk at twice the rate of white defendants.</li>
  <li><strong>Amazon Hiring Tool (2018):</strong> Amazon scrapped an AI hiring tool that systematically downgraded résumés containing the word "women's" (e.g., "women's chess club").</li>
  <li><strong>Healthcare Risk Scoring (2019):</strong> An algorithm used by US hospitals to allocate care was shown to severely underestimate the needs of Black patients.</li>
</ul>`,
      warning: 'AI bias is not merely a technical problem — it is a social and ethical one. Technical fixes alone are insufficient without organizational policies and diverse teams.',
    },
    {
      title: 'Setting Up and Exploring a Biased Dataset',
      content: `<p>We will work with a synthetic hiring dataset that mirrors real-world bias patterns. Our goal: determine if a hiring algorithm discriminates based on gender or ethnicity.</p>`,
      code: {
        language: 'python',
        content: `import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report

# ── Generate a biased synthetic hiring dataset ────────────────
np.random.seed(2025)
n = 1000

# Demographic features
gender    = np.random.choice(["Male", "Female"], n, p=[0.60, 0.40])
ethnicity = np.random.choice(["Group_A", "Group_B"], n, p=[0.65, 0.35])

# Skills (objective — no difference between groups)
technical_score = np.random.normal(70, 15, n).clip(0, 100)
experience_yrs  = np.random.randint(0, 15, n).astype(float)

# INTRODUCE HISTORICAL BIAS: hiring decision was biased historically
# Males from Group_A get an unfair advantage of +10 points
bias_boost = np.where(
    (gender == "Male") & (ethnicity == "Group_A"), 10, 0
)
hire_score = technical_score + experience_yrs * 2 + bias_boost
hired      = (hire_score > hire_score.mean()).astype(int)

df = pd.DataFrame({
    "gender":          gender,
    "ethnicity":       ethnicity,
    "technical_score": technical_score.round(1),
    "experience_yrs":  experience_yrs,
    "hired":           hired,
})

print("Dataset shape:", df.shape)
print("\\nOverall hiring rate:", f"{df['hired'].mean():.1%}")
print("\\nHiring rate by Gender:")
print(df.groupby("gender")["hired"].mean().apply(lambda x: f"{x:.1%}"))
print("\\nHiring rate by Ethnicity:")
print(df.groupby("ethnicity")["hired"].mean().apply(lambda x: f"{x:.1%}"))
print("\\nHiring rate by Gender × Ethnicity:")
print(df.groupby(["gender", "ethnicity"])["hired"].mean().apply(lambda x: f"{x:.1%}").unstack())`,
      },
      note: 'Notice the disparity in hiring rates across groups — this is the bias we introduced programmatically. In real datasets, such patterns emerge from historical human decisions.',
    },
    {
      title: 'Training a Model and Measuring Its Bias',
      content: `<p>Now we train a classifier on this biased historical data. The model will learn the biased patterns and perpetuate them — this is how AI systems inherit and scale human bias.</p>`,
      code: {
        language: 'python',
        content: `from sklearn.preprocessing import LabelEncoder

# ── Encode categorical features ───────────────────────────────
df_model = df.copy()
le_gender    = LabelEncoder()
le_ethnicity = LabelEncoder()
df_model["gender_enc"]    = le_gender.fit_transform(df["gender"])
df_model["ethnicity_enc"] = le_ethnicity.fit_transform(df["ethnicity"])

# ── Train a classifier ────────────────────────────────────────
features = ["technical_score", "experience_yrs", "gender_enc", "ethnicity_enc"]
X = df_model[features]
y = df_model["hired"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = LogisticRegression(max_iter=500, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print("Overall model accuracy:", f"{(y_pred == y_test).mean():.1%}")
print("\\n" + classification_report(y_test, y_pred, target_names=["Not Hired", "Hired"]))

# ── Compute fairness metrics ──────────────────────────────────
test_df              = X_test.copy()
test_df["hired_true"] = y_test.values
test_df["hired_pred"] = y_pred
test_df["gender"]     = df.loc[X_test.index, "gender"].values
test_df["ethnicity"]  = df.loc[X_test.index, "ethnicity"].values

print("\\n─── FAIRNESS AUDIT ────────────────────────────────")
print("Predicted Hiring Rate by Gender (Demographic Parity):")
print(test_df.groupby("gender")["hired_pred"].mean().apply(lambda x: f"{x:.1%}"))
print("\\nPredicted Hiring Rate by Ethnicity:")
print(test_df.groupby("ethnicity")["hired_pred"].mean().apply(lambda x: f"{x:.1%}"))`,
      },
    },
    {
      title: 'Quantitative Fairness Metrics',
      content: `<p>Fairness must be measured, not just observed qualitatively. Let us compute the three most important fairness metrics used in industry.</p>
<h4>Key Fairness Definitions</h4>
<ul>
  <li><strong>Demographic Parity:</strong> The proportion of positive predictions should be equal across groups. Ratio should be close to 1.0.</li>
  <li><strong>Disparate Impact:</strong> If the advantaged group's positive rate divided by the disadvantaged group's positive rate > 1.2 or < 0.8, there is potential legal liability in many jurisdictions (the "4/5 rule" from US employment law).</li>
  <li><strong>Equalized Odds:</strong> Both True Positive Rate and False Positive Rate should be similar across groups — the model should make errors at the same rate for all groups.</li>
</ul>`,
      code: {
        language: 'python',
        content: `def fairness_report(test_df, protected_attr, label_true="hired_true", label_pred="hired_pred"):
    """Compute a comprehensive fairness report for a protected attribute."""
    print(f"\\n{'='*60}")
    print(f"  FAIRNESS REPORT — Protected Attribute: {protected_attr}")
    print(f"{'='*60}")

    groups = test_df[protected_attr].unique()
    metrics = {}

    for group in groups:
        g = test_df[test_df[protected_attr] == group]
        tp = ((g[label_true] == 1) & (g[label_pred] == 1)).sum()
        fp = ((g[label_true] == 0) & (g[label_pred] == 1)).sum()
        fn = ((g[label_true] == 1) & (g[label_pred] == 0)).sum()
        tn = ((g[label_true] == 0) & (g[label_pred] == 0)).sum()

        tpr  = tp / (tp + fn) if (tp + fn) > 0 else 0  # True Positive Rate (Recall)
        fpr  = fp / (fp + tn) if (fp + tn) > 0 else 0  # False Positive Rate
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0  # Precision
        pos_rate = g[label_pred].mean()                  # Positive Prediction Rate

        metrics[group] = {"TPR": tpr, "FPR": fpr, "Precision": prec, "Pos_Rate": pos_rate, "n": len(g)}

        print(f"\\n  Group: {group} (n={len(g)})")
        print(f"    Positive Prediction Rate : {pos_rate:.1%}  ← Demographic Parity")
        print(f"    True Positive Rate (TPR) : {tpr:.1%}       ← Equalized Odds (TPR)")
        print(f"    False Positive Rate (FPR): {fpr:.1%}       ← Equalized Odds (FPR)")
        print(f"    Precision                : {prec:.1%}")

    # Disparate Impact Ratio
    if len(groups) == 2:
        g_list  = sorted(groups)
        di_ratio = metrics[g_list[0]]["Pos_Rate"] / max(metrics[g_list[1]]["Pos_Rate"], 1e-9)
        tpr_gap  = abs(metrics[g_list[0]]["TPR"] - metrics[g_list[1]]["TPR"])
        fpr_gap  = abs(metrics[g_list[0]]["FPR"] - metrics[g_list[1]]["FPR"])

        print(f"\\n  {'─'*50}")
        print(f"  DISPARATE IMPACT RATIO: {di_ratio:.3f}")
        alert = "⚠️  POTENTIAL BIAS" if di_ratio < 0.8 or di_ratio > 1.25 else "✅ WITHIN ACCEPTABLE RANGE"
        print(f"  (Threshold: 0.8–1.25) → {alert}")
        print(f"\\n  TPR Gap (Equalized Odds): {tpr_gap:.1%}  {'⚠️ HIGH' if tpr_gap > 0.1 else '✅ OK'}")
        print(f"  FPR Gap (Equalized Odds): {fpr_gap:.1%}  {'⚠️ HIGH' if fpr_gap > 0.1 else '✅ OK'}")

    return metrics

# Run fairness audits
gender_metrics    = fairness_report(test_df, "gender")
ethnicity_metrics = fairness_report(test_df, "ethnicity")`,
      },
    },
    {
      title: 'Bias Mitigation Strategies',
      content: `<p>Once bias is detected, there are several categories of mitigation techniques. Each comes with trade-offs between fairness and accuracy.</p>
<h4>Three Categories of Mitigation</h4>
<ul>
  <li><strong>Pre-processing:</strong> Fix the data before training. Techniques: resampling, reweighting, disparate impact remover.</li>
  <li><strong>In-processing:</strong> Modify the learning algorithm to include fairness constraints. Technique: adversarial debiasing, fairness constraints in loss function.</li>
  <li><strong>Post-processing:</strong> Adjust model outputs after training. Technique: threshold optimization per group, reject option classification.</li>
</ul>`,
      code: {
        language: 'python',
        content: `# ── Strategy 1: Remove Sensitive Features (Fairness Through Unawareness) ──
# Note: This is often insufficient because proxy features remain

features_fair = ["technical_score", "experience_yrs"]   # No demographic features
X_fair        = df_model[features_fair]

X_tr_f, X_te_f, y_tr_f, y_te_f = train_test_split(X_fair, y, test_size=0.2, random_state=42)
model_fair = LogisticRegression(max_iter=500, random_state=42)
model_fair.fit(X_tr_f, y_tr_f)

y_pred_fair = model_fair.predict(X_te_f)

test_df["hired_pred_fair"] = y_pred_fair
print("─── Debiased Model (features only, no demographics) ───")
print("Predicted Hiring Rate by Gender:")
print(test_df.groupby("gender")["hired_pred_fair"].mean().apply(lambda x: f"{x:.1%}"))
print("\\nPredicted Hiring Rate by Ethnicity:")
print(test_df.groupby("ethnicity")["hired_pred_fair"].mean().apply(lambda x: f"{x:.1%}"))

acc_biased = (test_df["hired_pred"]      == test_df["hired_true"]).mean()
acc_fair   = (test_df["hired_pred_fair"] == test_df["hired_true"]).mean()
print(f"\\nAccuracy comparison:")
print(f"  Original (biased) model : {acc_biased:.1%}")
print(f"  Debiased model          : {acc_fair:.1%}")
print("\\n💡 Trade-off: removing demographic features often slightly reduces accuracy")
print("   while improving fairness — this is the fairness-accuracy tension.")

# ── Strategy 2: Threshold Adjustment Per Group ─────────────────
# Set different decision thresholds for different groups to equalize TPR
from sklearn.linear_model import LogisticRegression

proba_biased  = LogisticRegression(max_iter=500).fit(X_train, y_train).predict_proba(X_test)[:, 1]
gender_test   = df.loc[X_test.index, "gender"].values

def apply_group_threshold(probas, groups, thresholds):
    preds = np.zeros(len(probas), dtype=int)
    for i, (prob, grp) in enumerate(zip(probas, groups)):
        threshold = thresholds.get(grp, 0.5)
        preds[i]  = 1 if prob >= threshold else 0
    return preds

# Lower threshold for Group_B to compensate for historical under-selection
thresholds = {"Male": 0.55, "Female": 0.45}
y_pred_thres = apply_group_threshold(proba_biased, gender_test, thresholds)

test_df["hired_pred_thres"] = y_pred_thres
print("\\n─── Threshold Adjustment Strategy ───────────────────")
print("Predicted Hiring Rate by Gender (adjusted thresholds):")
print(test_df.groupby("gender")["hired_pred_thres"].mean().apply(lambda x: f"{x:.1%}"))`,
      },
    },
    {
      title: 'Building a Fairness Audit Checklist',
      content: `<p>Beyond code, AI ethics requires process and documentation. A fairness audit checklist ensures systematic evaluation before any model goes to production.</p>
<h4>The AI Fairness Audit Checklist (AFAC)</h4>
<ul>
  <li>☐ <strong>Scope Definition:</strong> Who are the affected groups? What protected attributes apply (race, gender, age, disability, religion)?</li>
  <li>☐ <strong>Data Audit:</strong> Is the training data representative? Are any groups systematically under-represented or mislabeled?</li>
  <li>☐ <strong>Metric Selection:</strong> Which fairness metric is most appropriate given the use case? (Different metrics conflict — you cannot achieve all simultaneously.)</li>
  <li>☐ <strong>Disparate Impact Test:</strong> Does the model pass the 4/5 rule (disparate impact ratio between 0.8–1.25)?</li>
  <li>☐ <strong>Error Rate Parity:</strong> Are false positive and false negative rates balanced across groups?</li>
  <li>☐ <strong>Human Override:</strong> Is there a process for humans to review and override high-stakes decisions?</li>
  <li>☐ <strong>Ongoing Monitoring:</strong> Will fairness metrics be tracked in production as the data distribution shifts?</li>
  <li>☐ <strong>Stakeholder Review:</strong> Have representatives from affected communities been consulted?</li>
  <li>☐ <strong>Documentation:</strong> Is a Model Card or Datasheet published documenting known limitations?</li>
</ul>`,
    },
  ],
  exercises: [
    'Using the dataset from Step 2, compute the fairness metrics for the combination of gender AND ethnicity (4 subgroups total). Which combination is most disadvantaged by the model?',
    'Research the "impossibility theorem" of fairness (also called the "fairness impossibility theorem"). Write a 5-sentence explanation of why it is impossible to satisfy all fairness definitions simultaneously.',
    'Implement a third mitigation strategy: reweighting training samples. Assign higher weights to under-represented group members during training using the `sample_weight` parameter in `model.fit()`.',
    'The COMPAS recidivism case: what fairness metric was violated, and what was ProPublica\'s argument vs. Northpointe\'s rebuttal? Summarize in 4–6 sentences.',
  ],
  quiz: [
    {
      question: 'Which type of bias occurs when training data reflects past societal inequalities?',
      options: ['Measurement bias', 'Historical bias', 'Deployment bias', 'Aggregation bias'],
      answer: 1,
    },
    {
      question: 'The "4/5 rule" in the US employment law context refers to:',
      options: [
        'A model should be 80% accurate on each demographic group',
        'The hiring rate of the disadvantaged group should be at least 80% of the advantaged group\'s rate',
        'At least 4 out of 5 team members must review the model before deployment',
        'The model should use no more than 4 features out of 5 to reduce bias',
      ],
      answer: 1,
    },
    {
      question: 'Why is "Fairness Through Unawareness" (removing sensitive features) generally insufficient?',
      options: [
        'Because removing features always reduces model accuracy by more than 50%',
        'Because proxy features that correlate with the sensitive attribute remain in the data',
        'Because logistic regression models require all features to be present',
        'Because fairness through unawareness is actually the gold standard',
      ],
      answer: 1,
    },
    {
      question: 'What does "Equalized Odds" as a fairness criterion require?',
      options: [
        'All groups must receive the same number of positive predictions',
        'Both the true positive rate and false positive rate must be equal across protected groups',
        'The model must achieve the same accuracy for all groups',
        'Predictions must be independent of the protected attribute',
      ],
      answer: 1,
    },
    {
      question: 'Which mitigation strategy adjusts model behavior AFTER the model has been trained?',
      options: [
        'Pre-processing (data reweighting)',
        'In-processing (adversarial debiasing)',
        'Post-processing (threshold adjustment per group)',
        'Feature selection (removing correlated features)',
      ],
      answer: 2,
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   LAB 2 — Designing an Ethical AI Governance Framework with DAA
   ───────────────────────────────────────────────────────────── */
window.LAB_DATA['topic-02_lab2'] = {
  title:      'Designing an Ethical AI Governance Framework with DAA Integration',
  difficulty: 'Intermediate → Advanced',
  duration:   '80–90 minutes',
  overview:   'This advanced lab covers the architecture of an enterprise AI ethics governance framework. You will explore the Digital Advertising Alliance (DAA) principles, design accountability structures, implement automated ethical impact assessments, and build a comprehensive AI Model Card system that documents a model\'s ethics profile for stakeholders.',
  objectives: [
    'Understand the DAA (Digital Advertising Alliance) framework and its AI implications',
    'Design a multi-tier AI ethics governance structure with clear roles',
    'Implement an Automated Ethical Impact Assessment (AEIA) tool',
    'Create Model Cards and Datasheets for Datasets documentation systems',
    'Build a policy-enforcement layer that flags high-risk model deployments',
  ],
  steps: [
    {
      title: 'DAA Principles and AI Accountability Frameworks',
      content: `<p>The Digital Advertising Alliance (DAA) established self-regulatory principles for data use and transparency. While originally focused on digital advertising, its principles map directly to responsible AI development.</p>
<h4>Core DAA Principles Applied to AI</h4>
<ul>
  <li><strong>Transparency:</strong> AI systems must disclose what data they collect, how models make decisions, and what the model's limitations are.</li>
  <li><strong>User Control:</strong> Individuals must have the ability to opt out of AI-driven decisions that significantly affect them.</li>
  <li><strong>Data Security:</strong> Data used to train and run AI systems must be secured against unauthorized access.</li>
  <li><strong>Sensitive Data:</strong> Special protections apply to AI systems using health, financial, or biometric data.</li>
  <li><strong>Accountability:</strong> Organizations deploying AI must designate responsible parties for AI governance.</li>
</ul>
<h4>AI Ethics Governance Models</h4>
<ul>
  <li><strong>IEEE Ethically Aligned Design:</strong> Technical standards for value alignment in autonomous systems.</li>
  <li><strong>EU AI Act:</strong> Risk-based regulatory framework classifying AI into unacceptable, high-risk, limited-risk, and minimal-risk categories.</li>
  <li><strong>NIST AI Risk Management Framework:</strong> Voluntary framework for managing AI risks across the full lifecycle.</li>
  <li><strong>Google PAIR Guidebook:</strong> People + AI Research guidelines for human-centered AI design.</li>
</ul>`,
    },
    {
      title: 'EU AI Act Risk Classification System',
      content: `<p>The EU AI Act (effective 2024-2025) is the world's first comprehensive AI regulation. Understanding its risk tiers is essential for any AI practitioner deploying systems in Europe or globally.</p>`,
      code: {
        language: 'python',
        content: `from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional

class AIRiskLevel(Enum):
    UNACCEPTABLE = "Unacceptable Risk"    # BANNED outright
    HIGH         = "High Risk"            # Requires conformity assessment, registration
    LIMITED      = "Limited Risk"         # Transparency obligations only
    MINIMAL      = "Minimal Risk"         # No restrictions

@dataclass
class AISystemProfile:
    name:             str
    description:      str
    use_cases:        List[str]
    affected_groups:  List[str]
    data_types:       List[str]
    autonomous_level: float  # 0 = human makes all decisions, 1 = fully autonomous

    # Classification outputs
    risk_level:       Optional[AIRiskLevel] = None
    risk_rationale:   List[str] = field(default_factory=list)
    required_actions: List[str] = field(default_factory=list)

def classify_eu_ai_risk(profile: AISystemProfile) -> AISystemProfile:
    """Classify an AI system under the EU AI Act risk framework."""
    reasons = []
    actions = []

    # ── Check UNACCEPTABLE RISK criteria ─────────────────────
    unacceptable_triggers = {
        "social scoring by public authorities":  "biometric_surveillance" in profile.data_types,
        "real-time remote biometric ID in public": "real_time_biometrics" in profile.data_types,
        "manipulation of vulnerable persons":     "children" in profile.affected_groups and profile.autonomous_level > 0.8,
    }
    if any(unacceptable_triggers.values()):
        for trigger, hit in unacceptable_triggers.items():
            if hit: reasons.append(f"Triggers UNACCEPTABLE: {trigger}")
        profile.risk_level     = AIRiskLevel.UNACCEPTABLE
        profile.risk_rationale = reasons
        profile.required_actions = ["This AI application is PROHIBITED under the EU AI Act.", "Do not deploy."]
        return profile

    # ── Check HIGH RISK criteria ──────────────────────────────
    high_risk_domains = [
        "hiring", "education", "credit", "health", "law_enforcement",
        "essential_services", "immigration", "administration_of_justice"
    ]
    sensitive_data = ["biometric", "health", "financial", "location"]

    for use in profile.use_cases:
        if any(domain in use.lower() for domain in high_risk_domains):
            reasons.append(f"High-risk use case: {use}")

    for data in profile.data_types:
        if any(sd in data.lower() for sd in sensitive_data):
            reasons.append(f"Sensitive data type: {data}")

    if profile.autonomous_level >= 0.7 and len(profile.affected_groups) > 1:
        reasons.append(f"High autonomy ({profile.autonomous_level:.0%}) affecting multiple demographic groups")

    if reasons:
        profile.risk_level = AIRiskLevel.HIGH
        actions = [
            "Conduct Conformity Assessment before deployment",
            "Register in EU AI Database",
            "Implement human oversight mechanisms",
            "Maintain technical documentation for 10 years",
            "Establish post-market monitoring plan",
            "Appoint EU Representative if non-EU organization",
        ]
    elif any("ai" in uc.lower() and "customer" in uc.lower() for uc in profile.use_cases):
        profile.risk_level = AIRiskLevel.LIMITED
        actions = [
            "Disclose to users that they are interacting with AI",
            "Label AI-generated content",
        ]
    else:
        profile.risk_level = AIRiskLevel.MINIMAL
        actions = ["No specific requirements, but follow good practices."]

    profile.risk_rationale   = reasons
    profile.required_actions = actions
    return profile

# ── Test with example AI systems ──────────────────────────────
examples = [
    AISystemProfile(
        name="HireBot", description="Automated resume screening",
        use_cases=["hiring candidates", "HR automation"],
        affected_groups=["job_applicants", "underrepresented_groups"],
        data_types=["resume_text", "financial", "education_records"],
        autonomous_level=0.85,
    ),
    AISystemProfile(
        name="ChatWidget", description="Customer service chatbot",
        use_cases=["ai customer support"],
        affected_groups=["general_public"],
        data_types=["chat_logs"],
        autonomous_level=0.6,
    ),
]

print("EU AI ACT RISK CLASSIFICATION RESULTS")
print("=" * 60)
for ex in examples:
    result = classify_eu_ai_risk(ex)
    risk_icons = {
        AIRiskLevel.UNACCEPTABLE: "🚫",
        AIRiskLevel.HIGH:         "🔴",
        AIRiskLevel.LIMITED:      "🟡",
        AIRiskLevel.MINIMAL:      "🟢",
    }
    print(f"\\n{risk_icons[result.risk_level]} {result.name}: {result.risk_level.value}")
    print(f"   Rationale:")
    for r in result.risk_rationale: print(f"     • {r}")
    print(f"   Required Actions:")
    for a in result.required_actions: print(f"     → {a}")`,
      },
    },
    {
      title: 'Automated Ethical Impact Assessment (AEIA)',
      content: `<p>An Ethical Impact Assessment systematically evaluates a proposed AI system before it is built or deployed. We will automate this process with a scoring engine.</p>`,
      code: {
        language: 'python',
        content: `from dataclasses import dataclass, field
from typing import List, Dict, Tuple
import json

@dataclass
class EIAQuestion:
    id:       str
    category: str
    question: str
    weight:   float            # 0–1, higher = more critical
    yes_risk: float            # Risk score increment if answered "yes"
    note:     str = ""

@dataclass
class EIAResponse:
    question_id: str
    answer:      bool           # True = Yes
    comment:     str = ""

class EthicalImpactAssessment:
    QUESTIONS = [
        EIAQuestion("Q01", "Affected Populations",    "Does the system make decisions that significantly affect individuals' lives (e.g., employment, credit, healthcare)?", 0.9, 0.7),
        EIAQuestion("Q02", "Vulnerable Groups",        "Will the system affect children, elderly, disabled persons, or other vulnerable populations?",                       0.9, 0.6),
        EIAQuestion("Q03", "Sensitive Data",           "Does the system process sensitive personal data (health, biometric, financial, political/religious beliefs)?",        0.8, 0.65),
        EIAQuestion("Q04", "Autonomous Decision",      "Does the system make final decisions without mandatory human review?",                                                0.85, 0.7),
        EIAQuestion("Q05", "Potential for Bias",       "Could errors or biases in the system disproportionately harm specific demographic groups?",                          0.9, 0.75),
        EIAQuestion("Q06", "Explainability",           "Is it difficult to explain why the system makes a specific decision (black-box model)?",                             0.7, 0.5),
        EIAQuestion("Q07", "Consent",                  "Will individuals not have clear notice or meaningful consent regarding the AI system's use of their data?",          0.8, 0.6),
        EIAQuestion("Q08", "Third Party Sharing",      "Will data or model outputs be shared with third parties, including advertisers or data brokers?",                    0.7, 0.45, "Relevant to DAA principles"),
        EIAQuestion("Q09", "Security Risk",            "Could a security breach or adversarial attack cause significant harm?",                                              0.8, 0.55),
        EIAQuestion("Q10", "Environmental Impact",     "Will training or running the model require significant computational resources (e.g., large GPU clusters)?",         0.4, 0.2),
        EIAQuestion("Q11", "Opt-out Mechanism",        "Lack of a meaningful opt-out or appeal mechanism for affected individuals?",                                         0.75, 0.55, "DAA: User Control principle"),
        EIAQuestion("Q12", "Regulatory Oversight",     "Does the system operate in a regulated industry without clear regulatory approval?",                                 0.8, 0.65),
    ]

    def __init__(self, system_name: str):
        self.system_name = system_name
        self.responses:  List[EIAResponse] = []

    def add_responses(self, answers: Dict[str, bool], comments: Dict[str, str] = None):
        """Add responses. answers = {question_id: True/False}"""
        comments = comments or {}
        for q_id, answer in answers.items():
            self.responses.append(EIAResponse(q_id, answer, comments.get(q_id, "")))

    def compute_score(self) -> Tuple[float, str, List[str]]:
        """Compute overall risk score and return (score, level, high_risk_flags)."""
        if not self.responses: return 0.0, "Not assessed", []

        total_weighted   = 0.0
        max_possible     = 0.0
        high_risk_flags  = []

        response_map = {r.question_id: r for r in self.responses}

        for q in self.QUESTIONS:
            r = response_map.get(q.id)
            max_possible += q.weight * q.yes_risk
            if r and r.answer:
                contribution  = q.weight * q.yes_risk
                total_weighted += contribution
                if contribution >= 0.45:
                    high_risk_flags.append(f"{q.id}: {q.question[:70]}...")

        score = (total_weighted / max_possible) if max_possible > 0 else 0
        level = "Critical" if score >= 0.7 else "High" if score >= 0.5 else "Medium" if score >= 0.3 else "Low"
        return round(score, 3), level, high_risk_flags

    def generate_report(self):
        score, level, flags = self.compute_score()
        icons = {"Critical": "🚨", "High": "🔴", "Medium": "🟡", "Low": "🟢"}

        print("\\n" + "="*65)
        print(f"  ETHICAL IMPACT ASSESSMENT REPORT")
        print(f"  System: {self.system_name}")
        print("="*65)
        print(f"  Overall Risk Score : {score:.0%}")
        print(f"  Risk Level         : {icons.get(level, '?')} {level}")

        if flags:
            print(f"\\n  🚩 High-Risk Findings:")
            for f in flags: print(f"     • {f}")

        print(f"\\n  📋 Recommendations:")
        if level == "Critical":
            print("     → STOP: Do not proceed without executive ethics board approval.")
            print("     → Conduct full legal review and stakeholder consultation.")
            print("     → Consider whether this system should be built at all.")
        elif level == "High":
            print("     → Establish dedicated AI ethics oversight for this project.")
            print("     → Implement mandatory human review for all high-stakes decisions.")
            print("     → Develop a complete Model Card before deployment.")
        elif level == "Medium":
            print("     → Document risks and implement monitoring before launch.")
            print("     → Ensure opt-out mechanisms and transparency notices are in place.")
        else:
            print("     → Low risk — proceed with standard development practices.")
            print("     → Document decisions and review at each milestone.")

# ── Run the EIA for a hiring AI system ───────────────────────
eia = EthicalImpactAssessment("HireBot v2 — Resume Screening AI")
eia.add_responses({
    "Q01": True,   # Affects employment decisions
    "Q02": False,  # Not targeting vulnerable groups specifically
    "Q03": True,   # Processes resumes with personal data
    "Q04": True,   # Autonomous screening without mandatory review
    "Q05": True,   # History shows hiring bias risk
    "Q06": True,   # Logistic regression is interpretable but LLM layers are not
    "Q07": False,  # We DO get consent in job application process
    "Q08": True,   # Resume data shared with third-party recruiters
    "Q09": False,  # Lower security risk
    "Q10": False,  # Small model, minimal compute
    "Q11": True,   # No clear appeal mechanism for rejected candidates
    "Q12": True,   # Employment law applies; no regulatory sign-off yet
}, comments={"Q05": "Historical hiring bias documented in audit", "Q11": "Feature request logged for Phase 2"})

eia.generate_report()`,
      },
    },
    {
      title: 'Building a Model Card Documentation System',
      content: `<p>A <strong>Model Card</strong> (introduced by Mitchell et al. at Google, 2019) is a short document that provides transparent disclosure of an AI model's performance, limitations, and ethical considerations. Regulatory frameworks increasingly require them.</p>`,
      code: {
        language: 'python',
        content: `import json
from datetime import date

def generate_model_card(config: dict) -> str:
    """Generate a formatted Model Card from a configuration dictionary."""

    card = f"""
╔══════════════════════════════════════════════════════════════╗
║                         MODEL CARD                          ║
║  {config['name']:<56s}║
╚══════════════════════════════════════════════════════════════╝

📌 BASIC INFORMATION
────────────────────────────────────────────────────────────────
  Model Name    : {config['name']}
  Version       : {config.get('version', '1.0')}
  Type          : {config['model_type']}
  Date Released : {config.get('release_date', str(date.today()))}
  Organization  : {config.get('organization', 'Unknown')}
  Contact       : {config.get('contact', 'Not provided')}
  License       : {config.get('license', 'Proprietary')}

📝 INTENDED USE
────────────────────────────────────────────────────────────────
  Primary Use   : {config['intended_use']}
  Users         : {', '.join(config.get('intended_users', ['Not specified']))}

  ✅ IN SCOPE:
{chr(10).join(f"    • {u}" for u in config.get('in_scope', []))}

  🚫 OUT OF SCOPE:
{chr(10).join(f"    • {u}" for u in config.get('out_of_scope', []))}

📊 TRAINING DATA
────────────────────────────────────────────────────────────────
  Dataset       : {config.get('training_data', 'Not disclosed')}
  Size          : {config.get('training_size', 'Not disclosed')}
  Collection    : {config.get('data_collection', 'Not disclosed')}
  Preprocessing : {config.get('preprocessing', 'Not disclosed')}

⚡ PERFORMANCE METRICS
────────────────────────────────────────────────────────────────"""
    for metric_name, metric_val in config.get('metrics', {}).items():
        card += f"\n  {metric_name:<30s}: {metric_val}"

    card += f"""

🔍 SUBGROUP PERFORMANCE (FAIRNESS)
────────────────────────────────────────────────────────────────"""
    for group, metrics in config.get('subgroup_metrics', {}).items():
        card += f"\n  {group}:"
        for k, v in metrics.items():
            card += f"\n    {k:<28s}: {v}"

    card += f"""

⚠️  LIMITATIONS & KNOWN RISKS
────────────────────────────────────────────────────────────────
{chr(10).join(f"  • {lim}" for lim in config.get('limitations', []))}

🛡️  ETHICAL CONSIDERATIONS
────────────────────────────────────────────────────────────────
{chr(10).join(f"  • {eth}" for eth in config.get('ethical_considerations', []))}

👥 HUMAN OVERSIGHT
────────────────────────────────────────────────────────────────
  Override Policy   : {config.get('human_override', 'Not specified')}
  Review Process    : {config.get('review_process', 'Not specified')}

📞 DAA COMPLIANCE
────────────────────────────────────────────────────────────────
  Transparency      : {config.get('daa_transparency', 'Not assessed')}
  User Control      : {config.get('daa_user_control', 'Not assessed')}
  Data Security     : {config.get('daa_security', 'Not assessed')}

{"─" * 64}
  Generated on: {date.today()} | Format: Model Card v1.2 (Mitchell et al.)
"""
    return card

# ── Generate a Model Card for HireBot ───────────────────────
hirebot_card = generate_model_card({
    "name":           "HireBot v2.0 — Resume Screening Model",
    "version":        "2.0.1",
    "model_type":     "Logistic Regression Classifier",
    "organization":   "Acme Corp HR Technology",
    "contact":        "ai-ethics@acmecorp.com",
    "license":        "Internal Use Only",
    "intended_use":   "First-pass filtering of job applications for software engineering roles",
    "intended_users": ["HR Recruiters", "Hiring Managers"],
    "in_scope":       [
        "Software engineering roles at Acme Corp",
        "Applicants who have explicitly consented to AI screening",
    ],
    "out_of_scope":   [
        "Executive or C-suite hiring",
        "Any role requiring security clearance",
        "Applicants under age 18",
    ],
    "training_data":  "Historical Acme hiring data 2018–2023",
    "training_size":  "45,000 applications (28,000 positive, 17,000 negative)",
    "metrics": {
        "Overall Accuracy":   "84.2%",
        "Precision (Hired)":  "79.1%",
        "Recall (Hired)":     "88.3%",
        "AUC-ROC":            "0.91",
    },
    "subgroup_metrics": {
        "Female Applicants":     {"Positive Rate": "61.2%", "TPR": "83.1%", "FPR": "22.3%"},
        "Male Applicants":       {"Positive Rate": "68.7%", "TPR": "90.1%", "FPR": "28.4%"},
        "Disparate Impact":      {"DI Ratio": "0.89 ⚠️ (borderline)", "Action": "Under active monitoring"},
    },
    "limitations": [
        "Trained on historical data reflecting past hiring preferences — may encode historical bias.",
        "Not validated for non-engineering roles or roles outside software development.",
        "English-language résumés only; performance on translated résumés not tested.",
        "Model does not assess cultural fit, communication skills, or teamwork potential.",
    ],
    "ethical_considerations": [
        "All hiring decisions by HireBot are advisory only — final decisions made by human recruiters.",
        "Fairness audits conducted quarterly; results shared with HR Ethics Committee.",
        "Applicants may request human review by emailing hr@acmecorp.com.",
        "Model retrained annually to prevent feedback loops from past biased hiring.",
    ],
    "human_override":  "Any applicant may request human review. HR Managers must review all rejections for senior roles.",
    "review_process":  "Quarterly fairness audit by AI Ethics team. Annual model refresh.",
    "daa_transparency": "✅ Model use disclosed in job application portal privacy notice",
    "daa_user_control": "✅ Opt-out available — request human-only review",
    "daa_security":    "✅ Résumé data encrypted at rest (AES-256) and in transit (TLS 1.3)",
})

print(hirebot_card)`,
      },
    },
    {
      title: 'Policy Enforcement Layer',
      content: `<p>The final component of an ethics governance system is a policy enforcement layer — an automated gate that checks whether a model meets minimum ethical standards before it can be deployed to production.</p>`,
      code: {
        language: 'python',
        content: `from dataclasses import dataclass
from typing import List, Callable, Dict, Any

@dataclass
class PolicyCheck:
    name:       str
    severity:   str    # "blocking" | "warning"
    check_fn:   Callable
    message:    str

class EthicsGateway:
    """
    Automated policy enforcement for AI model deployment.
    All BLOCKING checks must pass before a model can be deployed.
    """

    DEFAULT_POLICIES = [
        PolicyCheck(
            name="Fairness — Disparate Impact",
            severity="blocking",
            check_fn=lambda m: m.get("disparate_impact_ratio", 0) >= 0.80,
            message="DI ratio must be ≥ 0.80. Current ratio is below the acceptable threshold.",
        ),
        PolicyCheck(
            name="Model Card Exists",
            severity="blocking",
            check_fn=lambda m: m.get("has_model_card", False),
            message="A Model Card must be completed before deployment.",
        ),
        PolicyCheck(
            name="Human Override Mechanism",
            severity="blocking",
            check_fn=lambda m: m.get("has_human_override", False),
            message="High-stakes models MUST have a human override mechanism.",
        ),
        PolicyCheck(
            name="Ethical Impact Assessment Completed",
            severity="blocking",
            check_fn=lambda m: m.get("eia_completed", False),
            message="An Ethical Impact Assessment must be completed and signed off.",
        ),
        PolicyCheck(
            name="Data Privacy Review",
            severity="blocking",
            check_fn=lambda m: m.get("privacy_review_passed", False),
            message="Data privacy review (GDPR/PDPA) must be completed.",
        ),
        PolicyCheck(
            name="Performance Baseline",
            severity="warning",
            check_fn=lambda m: m.get("accuracy", 0) >= 0.75,
            message="Model accuracy is below 75% — consider improving before deployment.",
        ),
        PolicyCheck(
            name="Subgroup Performance Gap",
            severity="warning",
            check_fn=lambda m: m.get("max_subgroup_performance_gap", 1) <= 0.10,
            message="Performance gap between subgroups exceeds 10% — review for bias.",
        ),
    ]

    def __init__(self, policies=None):
        self.policies = policies or self.DEFAULT_POLICIES

    def evaluate(self, model_metadata: Dict[str, Any]) -> Dict:
        passed_blocking = []
        failed_blocking = []
        warnings        = []

        for policy in self.policies:
            try:
                passed = policy.check_fn(model_metadata)
            except Exception as e:
                passed = False

            status = {"name": policy.name, "passed": passed, "message": policy.message if not passed else "✓ Passed"}

            if policy.severity == "blocking":
                (passed_blocking if passed else failed_blocking).append(status)
            else:
                if not passed: warnings.append(status)

        deployment_allowed = len(failed_blocking) == 0

        return {
            "deployment_allowed": deployment_allowed,
            "passed_blocking":    passed_blocking,
            "failed_blocking":    failed_blocking,
            "warnings":           warnings,
        }

    def print_gate_result(self, model_name: str, result: Dict):
        icon = "✅ DEPLOYMENT APPROVED" if result["deployment_allowed"] else "🚫 DEPLOYMENT BLOCKED"
        print(f"\\n{'='*60}")
        print(f"  ETHICS GATEWAY — {model_name}")
        print(f"  Result: {icon}")
        print(f"{'='*60}")

        if result["failed_blocking"]:
            print("\\n  🔴 BLOCKING FAILURES (must fix before deploying):")
            for f in result["failed_blocking"]:
                print(f"    ✗ {f['name']}")
                print(f"      {f['message']}")

        if result["passed_blocking"]:
            print("\\n  ✅ Passed Checks:")
            for p in result["passed_blocking"]:
                print(f"    ✓ {p['name']}")

        if result["warnings"]:
            print("\\n  ⚠️  Warnings (recommended to address):")
            for w in result["warnings"]:
                print(f"    ⚠ {w['name']}: {w['message']}")

# ── Test the gateway ──────────────────────────────────────────
gateway = EthicsGateway()

# Model A — ready for deployment
model_a_metadata = {
    "disparate_impact_ratio": 0.88,
    "has_model_card": True,
    "has_human_override": True,
    "eia_completed": True,
    "privacy_review_passed": True,
    "accuracy": 0.84,
    "max_subgroup_performance_gap": 0.07,
}

# Model B — not ready
model_b_metadata = {
    "disparate_impact_ratio": 0.72,  # Below threshold
    "has_model_card": False,          # Missing model card
    "has_human_override": True,
    "eia_completed": False,           # EIA not done
    "privacy_review_passed": True,
    "accuracy": 0.77,
    "max_subgroup_performance_gap": 0.14,  # High gap
}

result_a = gateway.evaluate(model_a_metadata)
result_b = gateway.evaluate(model_b_metadata)

gateway.print_gate_result("HireBot v2.0", result_a)
gateway.print_gate_result("HireBot v1.0 (Legacy)", result_b)`,
      },
    },
  ],
  exercises: [
    'Extend the EU AI Act classifier with a fourth category for AI systems in education (e.g., automated essay scoring). What specific obligations would apply under the EU AI Act?',
    'Implement a "Datasheet for Datasets" generator (analogous to Model Cards but for training data). Key sections: purpose, composition, collection process, preprocessing, uses, distribution, maintenance.',
    'Add a "recourse mechanism audit" to the EthicsGateway: models used in credit decisions must document a clear appeals process with response time SLAs. Implement this as an additional policy check.',
    'Research the NIST AI Risk Management Framework (AI RMF). List the four core functions and explain how the EIA and EthicsGateway tools we built map to these functions.',
  ],
  quiz: [
    {
      question: 'Under the EU AI Act, which category of AI application is completely PROHIBITED?',
      options: [
        'AI chatbots on customer service websites',
        'AI systems for medical image diagnosis',
        'Real-time remote biometric identification in public spaces by law enforcement (with narrow exceptions)',
        'AI recommendation systems for social media content',
      ],
      answer: 2,
    },
    {
      question: 'What is the primary purpose of a Model Card?',
      options: [
        'A marketing document describing AI product features for customers',
        'Transparent documentation of a model\'s performance, limitations, and ethical considerations for stakeholders',
        'A technical specification for model architecture and hyperparameters',
        'A legal contract between AI developers and end users',
      ],
      answer: 1,
    },
    {
      question: 'In the DAA framework, what does the "User Control" principle require for AI systems?',
      options: [
        'Users must be able to control the AI\'s internal parameters and weights',
        'Individuals must have a meaningful ability to opt out of or appeal AI-driven decisions that significantly affect them',
        'Users must approve every decision the AI system makes',
        'The AI system must be controlled by a human operator at all times',
      ],
      answer: 1,
    },
    {
      question: 'Why is it important to have BOTH a policy enforcement gateway AND human oversight?',
      options: [
        'Automated gateways can catch quantitative policy violations, but human judgment is needed for context, novel situations, and stakeholder considerations that metrics cannot capture',
        'Human oversight is only needed when the automated gateway fails due to bugs',
        'Policy gateways and human oversight serve the same purpose and one is sufficient',
        'Automated gateways are always more reliable than human judgment',
      ],
      answer: 0,
    },
    {
      question: 'What is the "impossibility theorem" in AI fairness?',
      options: [
        'It is impossible to build a perfectly accurate AI model',
        'It is impossible to satisfy all common fairness definitions simultaneously when base rates differ across groups',
        'It is impossible to detect bias in black-box AI models',
        'It is impossible to train AI models without bias in training data',
      ],
      answer: 1,
    },
  ],
};
