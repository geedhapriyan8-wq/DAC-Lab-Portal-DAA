/* ============================================================
   DAA Topic 09 — Prompt Engineering (Integrating with Multi-Agent)
   Lab 1: Prompt Engineering with CRAFT & Designing a Multi-Agent Architecture
   Lab 2: Multi-Agent Systems: Shared State, Debate & Cyclic Workflows
   Source material: Prompt Engineering slides + Lesson Flow (CRAFT),
   and the DSA portal's Multi-Agent Systems labs (topic-11), whose
   steps and code are reused here and extended.
   ============================================================ */

window.DAA_LAB_DATA = window.DAA_LAB_DATA || {};

/* Reused from DSA topic-11 Lab 1 */
const DAA_AGENT_CLASS = `class Agent:
    """A simulated AI Agent with a specific role."""
    def __init__(self, name, role):
        self.name = name
        self.role = role
        self.memory = []

    def process_task(self, input_data):
        print(f"[{self.name} - {self.role}] is working...")
        # Simulate processing time
        return f"Result from {self.name} based on: {input_data[:20]}..."

# Create our Agent Team
researcher = Agent("Alice", "Data Researcher: Finds facts and statistics.")
writer     = Agent("Bob",   "Content Writer: Drafts engaging narratives.")
reviewer   = Agent("Charlie", "Editor: Checks for accuracy and tone.")

print("Agent team assembled.")`;

/* ─────────────────────────────────────────────────────────────
   LAB 1 — Prompt Engineering with CRAFT & Multi-Agent Architecture
   ───────────────────────────────────────────────────────────── */
window.DAA_LAB_DATA['daa-09_lab1'] = {
  title:      'Prompt Engineering with CRAFT & Designing a Multi-Agent Architecture',
  difficulty: 'Simple → Intermediate',
  duration:   '2 hours',
  overview:   'Prompt engineering is the strategic process of designing and refining inputs for AI models to get relevant, accurate, high-quality outputs. It turns vague requests into structured, precise communication. In this workshop-style lab you break the "search bar" habit, learn the core principles and the CRAFT system (Context, Role, Action, Format, Tone), practise zero-shot, few-shot, chain-of-thought and role-based prompting live on an AI platform, and apply them to a data-analytics task. You then scale up from one prompt to a team: designing multi-agent systems where specialised agents, each with its own focused prompt, collaborate in sequential and hierarchical workflows.',
  objectives: [
    'Define prompt engineering and explain why it improves quality, efficiency and cost',
    'Apply the core principles: clarity, specificity, context and constraints, iteration',
    'Write structured prompts with the CRAFT system',
    'Use zero-shot, few-shot, chain-of-thought and role-based prompting',
    'Avoid the common prompting mistakes',
    'Explain why specialised multi-agent systems outperform one all-purpose agent',
    'Design and simulate sequential and hierarchical agent workflows in Python',
  ],
  steps: [
    {
      title: 'How This Workshop Works',
      content: `<p>This lab is a <strong>workshop</strong>, not a lecture. You already use AI tools; the goal is to replace habits with a system.</p>
<h4>You need two browser tabs</h4>
<ol>
  <li><strong>An AI platform</strong>: ChatGPT, Claude or Google Gemini (free tiers are fine).</li>
  <li><strong>Google Colab</strong>: for the Python parts. Create <code>DAA_Topic9_Lab1.ipynb</code>.</li>
</ol>
<h4>Quick poll</h4>
<p>Do you use ChatGPT exactly like a Google search bar, typing a few keywords and hoping? Most people do. That's the habit this lab breaks: a search engine <em>finds</em> existing pages; a language model <em>generates</em> an answer from your instructions, so the quality of the instructions decides the quality of the answer.</p>`,
    },
    {
      title: 'What Is Prompt Engineering?',
      content: `<p><strong>Prompt engineering</strong> is the strategic process of designing and refining inputs (prompts) for AI models to achieve desired outputs.</p>
<ul>
  <li><strong>Bridging the gap:</strong> it translates human intent into instructions the AI can understand.</li>
  <li><strong>Unlocking potential:</strong> it gets the most out of a model for a specific task.</li>
  <li><strong>Iterative process:</strong> prompts are tested and refined continuously.</li>
</ul>
<h4>The coffee analogy</h4>
<table>
  <tr><th>Weak order</th><th>Strong order</th></tr>
  <tr><td>"Give me a coffee."<br>You might get a black espresso when you wanted an iced latte.</td><td>"A large iced vanilla latte with oat milk, half sweet, and an extra shot of espresso."<br>You get exactly what you want because you gave parameters.</td></tr>
</table>
<h4>Why it matters</h4>
<ul>
  <li><strong>Output quality:</strong> more accurate, relevant and creative responses.</li>
  <li><strong>Efficiency:</strong> less trial and error.</li>
  <li><strong>Cost savings:</strong> fewer wasted requests and tokens when AI is used at scale.</li>
  <li><strong>Broader applications:</strong> unlocks use cases in data analysis, software development, research and more.</li>
</ul>`,
    },
    {
      title: 'Core Principles',
      content: `<table>
  <tr><th>Principle</th><th>What it means</th><th>Weak → strong</th></tr>
  <tr><td><strong>Clarity &amp; conciseness</strong></td><td>Unambiguous language; no confusing jargon</td><td>"Do something with this data" → "Summarise the three biggest trends in this sales table"</td></tr>
  <tr><td><strong>Specificity &amp; detail</strong></td><td>Precise instructions and relevant details</td><td>"Write code" → "Write a pandas function that fills missing ages with the median"</td></tr>
  <tr><td><strong>Context &amp; constraints</strong></td><td>Background info plus boundaries: tone, format, length</td><td>"Explain regression" → "Explain linear regression to a first-year business student in under 150 words"</td></tr>
  <tr><td><strong>Iteration &amp; refinement</strong></td><td>Test, evaluate, adjust</td><td>Treat the first answer as a draft and refine the prompt based on what went wrong</td></tr>
</table>`,
    },
    {
      title: 'The CRAFT System',
      content: `<p><strong>CRAFT</strong> is a checklist that eliminates vague prompts. Map it to a real student problem: emailing a professor for an extension.</p>
<table>
  <tr><th>Letter</th><th>Meaning</th><th>Example</th></tr>
  <tr><td><strong>C</strong>ontext</td><td>Background information</td><td>"I missed the deadline because my local server crashed while my data-scraping script was running."</td></tr>
  <tr><td><strong>R</strong>ole</td><td>Who the AI should be</td><td>"Act as a professional academic advisor."</td></tr>
  <tr><td><strong>A</strong>ction</td><td>A clear verb: the task</td><td>"Draft an apology email requesting a 24-hour extension."</td></tr>
  <tr><td><strong>F</strong>ormat</td><td>Output structure</td><td>"Keep it under 3 short paragraphs."</td></tr>
  <tr><td><strong>T</strong>one</td><td>Style matched to the audience</td><td>"Respectful, concise, and taking full accountability."</td></tr>
</table>
<p>Programmers turn repeatable patterns into functions. Here is a tiny CRAFT prompt builder you can reuse in later labs (for example to write agents' system prompts):</p>`,
      code: {
        language: 'python',
        run: true,
        content: `def craft_prompt(context, role, action, format_, tone):
    """Assemble a structured prompt using the CRAFT system."""
    return (f"{role}\\n\\n"
            f"Context: {context}\\n\\n"
            f"Task: {action}\\n\\n"
            f"Format: {format_}\\n"
            f"Tone: {tone}")

prompt = craft_prompt(
    context="I missed my data analytics assignment deadline because my local server crashed "
            "while my web-scraping script was running.",
    role="Act as a professional academic advisor.",
    action="Draft an apology email to my professor requesting a 24-hour extension.",
    format_="Under 3 short paragraphs, with a subject line.",
    tone="Respectful, concise, and taking full accountability.",
)
print(prompt)`,
      },
      after: `<p><strong>Try it:</strong> paste the printed prompt into your AI platform. Then send just "write an email asking for an extension" in a <em>new</em> chat and compare the two answers.</p>`,
    },
    {
      title: 'Common Mistakes to Avoid',
      content: `<ol>
  <li><strong>Being too vague:</strong> no clear objective gives generic or irrelevant responses and wastes iterations.</li>
  <li><strong>Insufficient context:</strong> no background, audience or persona, so the output misses the mark.</li>
  <li><strong>Ambiguous language:</strong> words with several meanings lead to unpredictable or inconsistent results.</li>
  <li><strong>Neglecting iteration:</strong> not testing variations or refining based on the output.</li>
  <li><strong>Ignoring output quality:</strong> accepting a mediocre first answer instead of adjusting the prompt.</li>
</ol>
<p>And one data-specific mistake: <strong>trusting the output blindly</strong>. AI can produce confident but wrong code, numbers or facts ("hallucinations"). Always run and check generated code, and verify statistics against the data.</p>`,
    },
    {
      title: 'Technique 1 & 2: Zero-Shot and Few-Shot Prompting',
      content: `<p>Test each technique live on your AI platform for about 3 minutes.</p>
<table>
  <tr><th>Technique</th><th>What it is</th><th>Use it for</th></tr>
  <tr><td><strong>Zero-shot</strong></td><td>No examples: the model relies on its pre-trained knowledge</td><td>Simple tasks the model already understands: "Summarise this article."</td></tr>
  <tr><td><strong>Few-shot</strong></td><td>A few input → output examples inside the prompt so the model infers the pattern, style or format</td><td>Teaching a specific format or labelling scheme</td></tr>
</table>
<p>Few-shot is the prompting version of what you did in Topic 8: labelled examples teach the pattern. Copy these prompts into your AI tool:</p>`,
      code: {
        language: 'text',
        label: 'PROMPTS · PASTE INTO YOUR AI PLATFORM',
        content: `ZERO-SHOT
Classify the sentiment of this review as Positive, Negative or Mixed:
"The effects were impressive but the story was a complete mess."

FEW-SHOT
Classify each review's sentiment. Follow the examples exactly.
Review: "Great film!" -> Positive
Review: "Terrible plot." -> Negative
Review: "Loved the cast, hated the ending." -> Mixed
Review: "It was okay, I guess." ->`,
      },
      note: 'Notice how few-shot controls the output format ("Positive"/"Negative"/"Mixed" only), which is essential when a program, not a person, reads the answer.',
    },
    {
      title: 'Technique 3 & 4: Chain-of-Thought and Role-Based Prompting',
      content: `<table>
  <tr><th>Technique</th><th>What it is</th><th>Why it helps</th></tr>
  <tr><td><strong>Chain-of-thought</strong></td><td>Ask the model to reason step by step before answering</td><td>Improves complex problem solving, reduces errors, makes reasoning checkable, like showing your working in a maths exam</td></tr>
  <tr><td><strong>Role-based</strong></td><td>Assign a persona ("Act as a senior data analyst")</td><td>Shapes tone, vocabulary and perspective</td></tr>
</table>`,
      code: {
        language: 'text',
        label: 'PROMPTS · PASTE INTO YOUR AI PLATFORM',
        content: `CHAIN-OF-THOUGHT
A shirt costs $20 and is 25% off. Sales tax of 9% is added after the discount.
What is the final price? Let's think step by step, then give the final answer on its own line.

ROLE-BASED
As a travel agent, suggest a 5-day itinerary for a family trip to Rome.

ROLE-BASED (DATA VERSION)
Act as a senior data analyst reviewing a junior's work. Here is their conclusion:
"Sales dropped in January 2024, so the new pricing failed."
List the questions you would ask before accepting this conclusion.`,
      },
      after: `<p>Compare the data-version answer with what you learned in Topic 4, Lab 1: a good "senior analyst" response should ask whether January 2024 is a complete month. That was the partial-month trap in the retail dataset!</p>`,
    },
    {
      title: 'Case Study: Before and After',
      content: `<table>
  <tr><th>Before (poor)</th><th>After (optimised)</th></tr>
  <tr><td><code>Write about dogs.</code></td><td><code>Act as a pet store owner. Write a short, engaging social media post (under 100 words) encouraging dog owners to visit our store for premium natural dog food. Include a call to action to visit our website.</code></td></tr>
  <tr><td>Result: generic encyclopedia text ("Dogs are domesticated mammals, known for their loyalty…").</td><td>Result: an on-brand, usable post with a clear call to action.</td></tr>
</table>
<p>The optimised prompt uses <strong>role-based prompting</strong>, defines <strong>format and length constraints</strong>, and states a <strong>clear goal</strong> (call to action). Map it to CRAFT: which letter is missing, and how would adding it improve the post?</p>`,
    },
    {
      title: 'Hands-On: Prompting for a Data Task',
      content: `<p><strong>Task:</strong> get an AI assistant to help you write a Python script that cleans a dataset with missing values.</p>
<ol>
  <li><strong>Weak prompt:</strong> send <code>write python to clean data</code>. Observe the messy, generic output.</li>
  <li><strong>CRAFT prompt with a strict format constraint:</strong> ask for the <em>plan</em> first, not the code. Planning before coding catches misunderstandings early, which is chain-of-thought applied to software.</li>
  <li>Review the plan, correct anything wrong, then ask: <em>"Now write the code for steps 1–4 only."</em></li>
  <li>Run the generated code in Colab on <code>titanic.csv</code> and check it actually works.</li>
</ol>`,
      code: {
        language: 'text',
        label: 'PROMPT · PASTE INTO YOUR AI PLATFORM',
        content: `Context: I have a Titanic passenger CSV loaded in pandas as df (891 rows). Age has 177 missing
values, Cabin has 687, Embarked has 2. I'm a beginner analyst working in Google Colab.

Role: Act as a patient senior data scientist mentoring a junior analyst.

Action: Propose how to clean the missing values in this dataset.

Format: Do NOT output any code yet. Output only a numbered list of the cleaning steps you plan
to take, with one sentence explaining why for each step.

Tone: Clear and beginner-friendly.`,
      },
      note: 'Compare the AI\'s plan with what you did in Topic 7 (median for Age, mode for Embarked, drop Cabin). Did it suggest anything different? Is its reasoning sound?',
    },
    {
      title: 'Tools, Platforms and the Future',
      content: `<table>
  <tr><th>Tool</th><th>Strength</th></tr>
  <tr><td>ChatGPT (OpenAI)</td><td>Widely accessible; good for experimenting with many prompt types</td></tr>
  <tr><td>Claude (Anthropic)</td><td>Long context windows; strong at long-form writing, summarisation and nuanced dialogue</td></tr>
  <tr><td>Google Gemini</td><td>Multimodal (text, images, data), integrated with Google's ecosystem</td></tr>
  <tr><td>Microsoft Copilot</td><td>Embedded in Microsoft 365 for documents, spreadsheets and email</td></tr>
  <tr><td>Perplexity AI</td><td>Answer engine combining LLMs with real-time search and citations</td></tr>
</table>
<h4>The future of prompt engineering</h4>
<ul>
  <li><strong>Multimodal prompting:</strong> blending images, audio and video.</li>
  <li><strong>Advanced reasoning:</strong> models that plan and solve complex problems.</li>
  <li><strong>Model improvements:</strong> smaller, faster, specialised models.</li>
  <li><strong>The evolving role:</strong> from writing single queries to designing sophisticated AI systems, including teams of agents, which is where the rest of this topic goes.</li>
</ul>
<p><strong>Career note:</strong> AI is not replacing you, but someone who uses AI better than you might.</p>`,
    },
    {
      title: 'From One Prompt to a Team: Why Multi-Agent Systems?',
      content: `<p>If you give a single LLM a massive prompt telling it to research a topic, write a 5-page report, format it in markdown, and check for errors, it will likely suffer from "attention fatigue" and fail at some steps.</p>
<p><strong>Solution: Specialization.</strong> You create multiple agents, each with a narrow focus. They perform better because their system prompt is focused entirely on one job.</p>
<p>This is prompt engineering at the system level: each agent is essentially a model plus a carefully engineered <strong>system prompt</strong> (its role and rules) plus, often, tools. Run this in Colab to create a simulated team:</p>`,
      code: { language: 'python', run: true, content: DAA_AGENT_CLASS },
    },
    {
      title: 'Sequential Workflow Pattern',
      content: `<p>The most common multi-agent pattern is a sequential chain (like an assembly line). Agent A outputs to Agent B, who outputs to Agent C.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `user_request = "Write a report on the adoption of electric vehicles in 2023."

print("--- Starting Sequential Workflow ---\\n")

# Step 1: Researcher gathers facts
print("Step 1:")
research_notes = researcher.process_task(user_request)
# Simulate actual output
research_notes = "Fact: EV sales hit 14M in 2023. Fact: China leads adoption."
print(f"Output -> {research_notes}\\n")

# Step 2: Writer drafts the report based on notes
print("Step 2:")
draft_report = writer.process_task(research_notes)
# Simulate actual output
draft_report = "In 2023, electric vehicles saw massive growth, reaching 14 million sales globally..."
print(f"Output -> {draft_report}\\n")

# Step 3: Reviewer checks the draft
print("Step 3:")
final_report = reviewer.process_task(draft_report)
# Simulate actual output
final_report = "[APPROVED] " + draft_report
print(f"Output -> {final_report}\\n")

print("Workflow Complete. Final report delivered to user.")`,
      },
    },
    {
      title: 'Hierarchical Workflow Pattern',
      content: `<p>Another common pattern is Hierarchical (or Manager-Worker). A "Manager" agent receives the user task, breaks it down into sub-tasks, delegates them to worker agents, and compiles the final result.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `manager = Agent("Boss", "Manager: Delegates tasks and compiles results.")

def hierarchical_workflow(task):
    print("--- Starting Hierarchical Workflow ---\\n")
    print(f"Manager received task: {task}\\n")

    # Manager delegates
    print("Manager delegating sub-tasks in parallel...")
    task_1 = "Find EV sales numbers for 2023."
    task_2 = "Write an intro paragraph about EVs."

    result_1 = researcher.process_task(task_1)
    result_2 = writer.process_task(task_2)

    print("\\nManager compiling results...")
    final_output = f"Compiled Report:\\n{result_2}\\nData: {result_1}"
    return final_output

print(hierarchical_workflow(user_request))`,
      },
    },
    {
      title: 'Integrate: CRAFT System Prompts for Your Agents',
      content: `<p>Each agent's behaviour is defined by its system prompt, so apply CRAFT to every agent. Here the research team gets engineered prompts, built with the <code>craft_prompt</code> function from earlier.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `team_prompts = {
    "Researcher": craft_prompt(
        context="You are part of a 3-agent team producing short industry reports.",
        role="You are a meticulous data researcher.",
        action="Find 3-5 key statistics on the user's topic and cite a source for each.",
        format_="A bullet list: '- <fact> (source: <source>)'. No prose.",
        tone="Neutral and factual. If unsure of a number, say 'unverified'."),
    "Writer": craft_prompt(
        context="You receive research notes from the Researcher agent.",
        role="You are a clear, engaging business writer.",
        action="Turn the notes into a report using ONLY the facts provided.",
        format_="Title, then 2 short paragraphs (max 150 words).",
        tone="Professional and accessible."),
    "Reviewer": craft_prompt(
        context="You receive a draft report and the original research notes.",
        role="You are a strict editor and fact-checker.",
        action="Check every number in the draft against the notes; approve or list required fixes.",
        format_="First line 'APPROVED' or 'REVISE', then bullet points.",
        tone="Direct and specific."),
}
print(team_prompts["Reviewer"])`,
      },
      after: `<p>Notice the constraints that make agents work well together: the Researcher must flag unverified numbers, the Writer may only use provided facts, and the Reviewer's first line is machine-readable ("APPROVED"/"REVISE") so code can route the workflow, which you'll build in Lab 2.</p>`,
    },
    {
      title: 'Design Exercises',
      content: `<ol>
  <li><strong>Design a multi-agent system for a "Software Engineering Team"</strong> (e.g. Product Manager, Coder, Tester). What is the sequential flow of data between them? Draw it, and write a one-line CRAFT "Role" and "Format" for each agent.</li>
  <li><strong>What happens in a sequential workflow if the Researcher agent hallucinates fake data?</strong> How does this affect the Writer and Reviewer? (Hint: errors propagate down an assembly line. Which constraint in the prompts above reduces the risk?)</li>
  <li><strong>Sequential or hierarchical?</strong> Which pattern would you choose for (a) producing a weekly sales dashboard summary, (b) planning a conference with venue, catering and marketing sub-tasks? Why?</li>
</ol>
<p>Save the notebook and your prompt experiments to GitHub under <code>prompt-engineering/</code>.</p>`,
    },
  ],
  quiz: [
    {
      question: 'What is prompt engineering?',
      options: [
        'Building the hardware that runs AI models',
        'The strategic process of designing and refining inputs to AI models to achieve desired outputs',
        'Training a model from scratch',
        'Writing search keywords for Google',
      ],
    },
    {
      question: 'In the CRAFT system, what does the "R" stand for?',
      options: ['Result', 'Role', 'Rules', 'Review'],
    },
    {
      question: '"Keep it under 3 short paragraphs" belongs to which CRAFT element?',
      options: ['Context', 'Action', 'Format', 'Tone'],
    },
    {
      question: 'What is few-shot prompting?',
      options: [
        'Asking the model the same question a few times',
        'Including a few input–output examples in the prompt so the model infers the pattern and format',
        'Limiting the answer to a few words',
        'Using a small model',
      ],
    },
    {
      question: 'Adding "Let\'s think step by step" to a complex problem is an example of…',
      options: ['Zero-shot prompting', 'Role-based prompting', 'Chain-of-thought prompting', 'Few-shot prompting'],
    },
    {
      question: 'Why ask the AI to output a numbered plan before any code?',
      options: [
        'Plans are cheaper than code',
        'It exposes misunderstandings early so you can correct the approach before code is written',
        'AI cannot write code without a plan',
        'It makes the code run faster',
      ],
    },
    {
      question: 'Which is a common prompting mistake?',
      options: [
        'Specifying the output format',
        'Providing background context',
        'Accepting a mediocre first answer without refining the prompt',
        'Assigning a role',
      ],
    },
    {
      question: 'Why are Multi-Agent systems generally more effective than a single, all-purpose Agent?',
      options: [
        'They run faster on a single CPU',
        'Specialization allows each agent to have a highly focused system prompt and toolset, reducing errors and attention fatigue',
        'They do not require internet access',
        'They use less electricity',
      ],
    },
    {
      question: 'In a Sequential multi-agent workflow, how does data move?',
      options: [
        'All agents process the user query simultaneously and vote on the answer',
        'A manager assigns tasks and compiles them at the end',
        'The output of Agent 1 becomes the input for Agent 2, like an assembly line',
        'The user must manually approve each step',
      ],
    },
    {
      question: 'Which agent pattern uses a central coordinator to break down a complex task and delegate sub-tasks to specialized worker agents?',
      options: [
        'Sequential Pattern',
        'Hierarchical (Manager-Worker) Pattern',
        'Debate Pattern',
        'Adversarial Pattern',
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   LAB 2 — Multi-Agent Systems: Shared State, Debate & Cycles
   Core steps reused from DSA topic-11 Lab 2
   ───────────────────────────────────────────────────────────── */
window.DAA_LAB_DATA['daa-09_lab2'] = {
  title:      'Multi-Agent Systems: Shared State, Debate & Cyclic Workflows',
  difficulty: 'Intermediate → Advanced',
  duration:   '2 hours',
  overview:   'Advanced multi-agent systems do not just pass strings around; they share a structured "State" object. Furthermore, agents can engage in "Debate" or cyclic workflows where they critique each other until a condition is met. In this lab, you will simulate a stateful, cyclic multi-agent workflow, extend it with a third agent, see why loop limits are essential, build a debate-and-judge pattern, and rebuild the loop as a real state graph with the LangGraph framework. You finish by reviewing the risks and guardrails of agent systems.',
  objectives: [
    'Implement a shared State object (graph state)',
    'Simulate a cyclic workflow (Debate/Critique loop)',
    'Implement routing logic (conditional edges) in the agent graph',
    'Extend a workflow with an extra agent and combined routing conditions',
    'Explain why maximum-loop limits and human oversight are essential',
    'Build a state graph with nodes and conditional edges in LangGraph',
  ],
  steps: [
    {
      title: 'Recap and Setup',
      content: `<p>In Lab 1, agents passed plain strings along a chain. Real systems need memory that every agent can read and update, and the ability to loop back when work isn't good enough.</p>
<p>Create <code>DAA_Topic9_Lab2.ipynb</code> in Colab. The cells in this lab build on each other, so run them <strong>in order</strong>. If you restart the runtime, use <strong>Runtime → Run before</strong> to re-run earlier cells.</p>`,
    },
    {
      title: 'Shared State Management',
      content: `<p>Instead of passing strings, modern frameworks (like LangGraph) pass a dictionary or object called the <strong>State</strong>. Every agent reads from the State and updates specific keys in the State.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `class AgentState:
    """The shared state passed between all agents."""
    def __init__(self, initial_query):
        self.query = initial_query
        self.draft = ""
        self.critique = ""
        self.revisions = 0
        self.is_approved = False

    def __str__(self):
        return f"State(Revisions: {self.revisions}, Approved: {self.is_approved})"

# Initialize the state
state = AgentState("Write a secure password hashing function.")
print("Initial State created.")`,
      },
    },
    {
      title: 'The Coder and the Reviewer (Cyclic Workflow)',
      content: `<p>We will create two agents. The Coder writes code. The Reviewer checks the code. If the Reviewer finds a flaw, they update the <code>critique</code> state, and route the workflow BACK to the Coder. This is a <strong>Cyclic Loop</strong>.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `def coder_agent(state):
    print("👨‍💻 Coder: Writing/Updating code...")
    if state.revisions == 0:
        # First attempt: Coder writes something insecure
        state.draft = "def hash_pw(pw): return md5(pw)"
    else:
        # Subsequent attempt: Coder fixes based on critique
        print(f"   Reading critique: {state.critique}")
        state.draft = "def hash_pw(pw, salt): return bcrypt(pw + salt)"

    return state

def reviewer_agent(state):
    print("🕵️ Reviewer: Analyzing code...")
    if "md5" in state.draft:
        print("   ❌ Flaw found! MD5 is insecure.")
        state.critique = "Do not use MD5. It is cryptographically broken. Use bcrypt and salting."
        state.is_approved = False
    else:
        print("   ✅ Code looks secure.")
        state.is_approved = True

    return state`,
      },
    },
    {
      title: 'Routing and Executing the Loop',
      content: `<p>We need a router function to decide what happens next based on the state. If approved, we stop. If rejected, we route back to the coder.</p>`,
      code: {
        language: 'python',
        run: true,
        content: `def run_cyclic_workflow(initial_query):
    # 1. Initialize State
    current_state = AgentState(initial_query)

    MAX_LOOPS = 3

    print("--- Starting Cyclic Workflow ---\\n")

    while current_state.revisions < MAX_LOOPS:
        print(f"--- Iteration {current_state.revisions + 1} ---")

        # 2. Coder acts
        current_state = coder_agent(current_state)
        print(f"   Draft produced: {current_state.draft}")

        # 3. Reviewer acts
        current_state = reviewer_agent(current_state)

        # 4. Router Logic (Conditional Edge)
        if current_state.is_approved:
            print("\\n🎉 Workflow Complete! Final Code Approved.")
            break
        else:
            print("🔄 Routing back to Coder for revisions...\\n")
            current_state.revisions += 1

    if not current_state.is_approved:
        print("\\n⚠️ Max loops reached. Failed to produce approved code.")

# Run the simulation
run_cyclic_workflow("Write a secure password hashing function.")`,
      },
      note: 'This architecture, where agents can critique and correct each other in a loop, is extremely powerful for coding, writing, and logical reasoning tasks. Frameworks like LangGraph treat this as a State Graph where agents are nodes and routing logic are edges.',
    },
    {
      title: 'Exercise: Add a Security Tester Agent',
      content: `<p><strong>Task:</strong> add a third agent, <code>security_tester_agent</code>, that runs after the reviewer. Update the routing logic so that if <em>either</em> the reviewer or the tester rejects the code, it goes back to the coder.</p>
<p>Our tester checks that a salt is used. To make the exercise interesting, the coder's second attempt forgets the salt, and only the third attempt passes both checks. Try it yourself, then compare with this solution:</p>`,
      code: {
        language: 'python',
        run: true,
        content: `def coder_agent_v2(state):
    print("👨‍💻 Coder: Writing/Updating code...")
    drafts = ["def hash_pw(pw): return md5(pw)",
              "def hash_pw(pw): return bcrypt(pw)",
              "def hash_pw(pw, salt): return bcrypt(pw + salt)"]
    if state.critique:
        print(f"   Reading critique: {state.critique}")
    state.draft = drafts[min(state.revisions, len(drafts) - 1)]
    return state

def security_tester_agent(state):
    print("🧪 Tester: Running security checks...")
    if "salt" not in state.draft:
        print("   ❌ Test failed: no salt, so identical passwords produce identical hashes.")
        state.critique = "Add a unique salt per password to defeat rainbow-table attacks."
        return False
    print("   ✅ All security tests passed.")
    return True

def run_three_agent_workflow(query, max_loops=4):
    state = AgentState(query)
    while state.revisions < max_loops:
        print(f"--- Iteration {state.revisions + 1} ---")
        state = coder_agent_v2(state)
        print(f"   Draft produced: {state.draft}")
        state = reviewer_agent(state)
        tester_ok = security_tester_agent(state) if state.is_approved else False
        if state.is_approved and tester_ok:          # BOTH must approve
            print("\\n🎉 Approved by reviewer AND tester.")
            return state
        print("🔄 Routing back to Coder...\\n")
        state.revisions += 1
    print("\\n⚠️ Max loops reached.")
    return state

final = run_three_agent_workflow("Write a secure password hashing function.")
print(final)`,
      },
    },
    {
      title: 'Why MAX_LOOPS Is Critical',
      content: `<p>What if the agents can never agree? Maybe the reviewer's standard is impossible, or the coder keeps making the same mistake. Without a limit, the loop runs forever. With real LLMs, <strong>every iteration is a paid API call</strong>, so an infinite loop means unlimited cost and a workflow that never finishes.</p>
<p>Simulate a coder that never learns:</p>`,
      code: {
        language: 'python',
        run: true,
        content: `def stubborn_coder(state):
    state.draft = "def hash_pw(pw): return md5(pw)"   # never changes
    return state

state = AgentState("Write a secure password hashing function.")
MAX_LOOPS, COST_PER_CALL = 5, 0.02   # pretend each agent call costs $0.02

for i in range(1, MAX_LOOPS + 1):
    state = reviewer_agent(stubborn_coder(state))
    print(f"   Iteration {i}: approved={state.is_approved} | cost so far \${i * 2 * COST_PER_CALL:.2f}")
    if state.is_approved:
        break
else:
    print("\\n⛔ Stopped by MAX_LOOPS. Escalating to a human reviewer instead of looping forever.")`,
      },
      after: `<p><strong>Guardrails for loops:</strong> a maximum iteration count, a budget limit, detection of "no progress" (the same draft twice), and <strong>human-in-the-loop</strong> escalation when agents can't converge.</p>`,
    },
    {
      title: 'The Debate Pattern',
      content: `<p>In a <strong>debate</strong>, two agents argue opposite sides for a few rounds and a <strong>judge</strong> agent weighs the arguments and decides. Debate reduces one-sided answers and surfaces trade-offs, which is useful for decisions such as choosing a model or a business strategy.</p>
<p>Simulated debate on a Topic 7 question:</p>`,
      code: {
        language: 'python',
        run: true,
        content: `debate_state = {
    "question": "Should we deploy a random forest or logistic regression for loan approvals?",
    "transcript": [],
}

arguments = {
    "Pro-RandomForest": ["Random forest scored higher accuracy in cross-validation.",
                         "It captures non-linear interactions between income and debt."],
    "Pro-Logistic": ["Loan decisions must be explained to customers and regulators.",
                     "Logistic regression coefficients are directly interpretable, and accuracy was only slightly lower."],
}

for round_no in range(2):
    for agent, points in arguments.items():
        debate_state["transcript"].append((agent, points[round_no]))
        print(f"Round {round_no + 1} | {agent}: {points[round_no]}")

def judge_agent(state, priorities=("explainability", "regulators")):
    scores = {agent: 0 for agent in arguments}
    for agent, text in state["transcript"]:
        scores[agent] += sum(p in text.lower() for p in priorities) + 1
    winner = max(scores, key=scores.get)
    return winner, scores

winner, scores = judge_agent(debate_state)
print(f"\\n⚖️ Judge scores: {scores}")
print(f"Decision: {winner}. Loan approvals require explainable decisions (see Topic 2 on accountability).")`,
      },
      note: 'In a real system the judge is an LLM with a CRAFT system prompt listing the decision criteria. Our simple keyword judge shows the structure: explicit priorities make the decision transparent.',
    },
    {
      title: 'Build It for Real: A LangGraph State Graph',
      content: `<p><strong>LangGraph</strong> is a popular framework for stateful, cyclic agent workflows. You define:</p>
<ul>
  <li>a <strong>state</strong> schema (the shared memory),</li>
  <li><strong>nodes</strong>: functions (agents) that read the state and return updates,</li>
  <li><strong>edges</strong>: fixed transitions, and <strong>conditional edges</strong>: routers that pick the next node from the state.</li>
</ul>
<p>Here is the coder/reviewer loop as a graph. The nodes are plain Python so it runs without an API key; in production each node would call an LLM with its CRAFT system prompt. First install LangGraph in Colab:</p>`,
      code: [
        { language: 'bash', label: 'COLAB CELL · INSTALL', content: `!pip install -q langgraph` },
        {
          language: 'python',
          run: true,
          content: `from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class ReviewState(TypedDict):
    query: str
    draft: str
    critique: str
    revisions: int
    approved: bool

def coder(state: ReviewState):
    draft = "return md5(pw)" if state["revisions"] == 0 else "return bcrypt(pw + salt)"
    print(f"Coder (revision {state['revisions']}): {draft}")
    return {"draft": draft}

def reviewer(state: ReviewState):
    ok = "md5" not in state["draft"]
    print("Reviewer:", "approved ✅" if ok else "rejected ❌ (MD5 is insecure)")
    return {"approved": ok, "critique": "" if ok else "Use bcrypt with a salt.",
            "revisions": state["revisions"] + (0 if ok else 1)}

def route(state: ReviewState):
    if state["approved"] or state["revisions"] >= 3:   # conditional edge with a loop limit
        return "done"
    return "revise"

graph = StateGraph(ReviewState)
graph.add_node("coder", coder)
graph.add_node("reviewer", reviewer)
graph.add_edge(START, "coder")
graph.add_edge("coder", "reviewer")
graph.add_conditional_edges("reviewer", route, {"revise": "coder", "done": END})
app = graph.compile()

result = app.invoke({"query": "Hash passwords securely", "draft": "", "critique": "",
                     "revisions": 0, "approved": False})
print("\\nFinal state:", result)`,
        },
      ],
      after: `<p>Compare with your hand-written loop: the <code>while</code> loop became a conditional edge, and the <code>AgentState</code> class became a typed state. Other frameworks with similar ideas include CrewAI (role-based crews) and Microsoft AutoGen (conversational agents).</p>`,
    },
    {
      title: 'Risks, Guardrails and Wrap-Up',
      content: `<table>
  <tr><th>Risk</th><th>Guardrail</th></tr>
  <tr><td>Hallucinations propagate from agent to agent</td><td>Grounding (only use provided facts), a fact-checking reviewer, citations</td></tr>
  <tr><td>Infinite loops and runaway cost</td><td>MAX_LOOPS, budget limits, no-progress detection</td></tr>
  <tr><td>Prompt injection: malicious text in data tells an agent to ignore its instructions</td><td>Treat retrieved content as data, not instructions; restrict tools and permissions</td></tr>
  <tr><td>Unaccountable automated decisions</td><td>Human-in-the-loop approval for high-stakes actions; logging every step of the state</td></tr>
  <tr><td>Bias amplified by agents</td><td>The Topic 2 audit: measure outcomes by group</td></tr>
</table>
<h4>Exercises</h4>
<ol>
  <li>Why is the <code>MAX_LOOPS</code> variable critical in cyclic multi-agent workflows? Answer in your own words.</li>
  <li>Add a <code>human_approval</code> node to the LangGraph example that runs before <code>END</code> when the revision count reached the limit.</li>
  <li>Write CRAFT system prompts for the coder, reviewer and tester agents from this lab.</li>
</ol>
<p>Congratulations: this is the final DAA lab! Save your notebook to GitHub under <code>prompt-engineering/</code> and check your dashboard for the DAA Master Badge.</p>`,
    },
  ],
  quiz: [
    {
      question: 'What is the purpose of a shared "State" object in advanced multi-agent systems?',
      options: [
        'To save data to a database permanently',
        'To act as a central, structured memory that all agents can read from and write to as the workflow progresses',
        'To track the GPU temperature',
        'To encrypt the communication between agents',
      ],
    },
    {
      question: 'What characterizes a Cyclic (or Debate) multi-agent workflow?',
      options: [
        'Agents operate in a strict one-way assembly line',
        'A single manager agent does all the work',
        'The workflow contains a loop where agents can critique output and route it backward for revisions until a condition is met',
        'Agents fight against each other in a video game',
      ],
    },
    {
      question: 'Why must cyclic workflows implement a maximum loop counter (<code>MAX_LOOPS</code>)?',
      options: [
        'Because Python <code>while</code> loops are slow',
        'To prevent the agents from getting stuck in an infinite loop of critique and revision, which would consume massive API costs and never finish',
        'Because LLMs can only generate 3 responses per minute',
        'To satisfy regulatory requirements',
      ],
    },
    {
      question: 'In the three-agent exercise, when is the code finally accepted?',
      options: [
        'When the coder says it is finished',
        'When either the reviewer or the tester approves',
        'Only when both the reviewer and the tester approve',
        'After exactly three iterations regardless of approval',
      ],
    },
    {
      question: 'In LangGraph, what is a conditional edge?',
      options: [
        'A node that calls an LLM',
        'A router function that chooses the next node based on the current state',
        'The start of the graph',
        'A database table',
      ],
    },
    {
      question: 'What role does the judge play in the debate pattern?',
      options: [
        'It writes the first draft',
        'It weighs the opposing arguments against explicit criteria and makes the decision',
        'It stops the program after one round',
        'It removes agents that disagree',
      ],
    },
    {
      question: 'What is prompt injection?',
      options: [
        'Adding more examples to a prompt',
        'Malicious text inside data that tries to make an agent ignore its instructions',
        'A faster way to call an API',
        'A LangGraph node type',
      ],
    },
    {
      question: 'Which guardrail best addresses high-stakes decisions made by agents?',
      options: [
        'Removing logging to save space',
        'Human-in-the-loop approval and logging every step of the state',
        'Increasing MAX_LOOPS to 1000',
        'Using a single agent for everything',
      ],
    },
  ],
};
