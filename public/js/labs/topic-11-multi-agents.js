/* ============================================================
   Topic 11 — Multi-Agent Systems
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-11_lab1'] = {
  title:      'Designing a Multi-Agent Architecture',
  difficulty: 'Simple → Intermediate',
  duration:   '60 minutes',
  overview:   'One AI Agent can only do so much. For complex tasks, we use Multi-Agent Systems, where several specialized agents (each with a different prompt and tools) collaborate, debate, and pass data to each other. In this lab, you will design a 3-agent research team architecture.',
  objectives: [
    'Understand why specialization improves agent performance',
    'Design a multi-agent workflow (Researcher, Writer, Reviewer)',
    'Simulate message passing between agents',
    'Understand hierarchical vs sequential agent patterns',
  ],
  steps: [
    {
      title: 'Why Multi-Agent Systems?',
      content: `<p>If you give a single LLM a massive prompt telling it to research a topic, write a 5-page report, format it in markdown, and check for errors, it will likely suffer from "attention fatigue" and fail at some steps.</p>
<p><strong>Solution: Specialization.</strong> You create multiple agents, each with a narrow focus. They perform better because their system prompt is focused entirely on one job.</p>`,
      code: {
        language: 'python',
        content: `class Agent:
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

print("Agent team assembled.")`
      }
    },
    {
      title: 'Sequential Workflow Pattern',
      content: `<p>The most common multi-agent pattern is a sequential chain (like an assembly line). Agent A outputs to Agent B, who outputs to Agent C.</p>`,
      code: {
        language: 'python',
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

print("Workflow Complete. Final report delivered to user.")`
      }
    },
    {
      title: 'Hierarchical Workflow Pattern',
      content: `<p>Another common pattern is Hierarchical (or Manager-Worker). A "Manager" agent receives the user task, breaks it down into sub-tasks, delegates them to worker agents, and compiles the final result.</p>`,
      code: {
        language: 'python',
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

print(hierarchical_workflow(user_request))`
      }
    }
  ],
  exercises: [
    'Design a multi-agent system for a "Software Engineering Team" (e.g., Coder, Tester, Product Manager). What is the sequential flow of data between them?',
    'What happens in a sequential workflow if the Researcher Agent hallucinates fake data? How does this affect the Writer and Reviewer?',
  ],
  quiz: [
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
    }
  ]
};

window.LAB_DATA['topic-11_lab2'] = {
  title:      'Implementing State Management and Debate',
  difficulty: 'Intermediate → Advanced',
  duration:   '75 minutes',
  overview:   'Advanced multi-agent systems do not just pass strings around; they share a structured "State" object. Furthermore, agents can engage in "Debate" or cyclic workflows where they critique each other until a condition is met. In this lab, you will simulate a stateful, cyclic multi-agent workflow.',
  objectives: [
    'Implement a shared State object (graph state)',
    'Simulate a cyclic workflow (Debate/Critique loop)',
    'Implement routing logic (conditional edges) in the agent graph',
  ],
  steps: [
    {
      title: 'Shared State Management',
      content: `<p>Instead of passing strings, modern frameworks (like LangGraph) pass a dictionary or object called the <strong>State</strong>. Every agent reads from the State and updates specific keys in the State.</p>`,
      code: {
        language: 'python',
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
print("Initial State created.")`
      }
    },
    {
      title: 'The Coder and the Reviewer (Cyclic Workflow)',
      content: `<p>We will create two agents. The Coder writes code. The Reviewer checks the code. If the Reviewer finds a flaw, they update the <code>critique</code> state, and route the workflow BACK to the Coder. This is a <strong>Cyclic Loop</strong>.</p>`,
      code: {
        language: 'python',
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
        print("   ❌ FLaw found! MD5 is insecure.")
        state.critique = "Do not use MD5. It is cryptographically broken. Use bcrypt and salting."
        state.is_approved = False
    else:
        print("   ✅ Code looks secure.")
        state.is_approved = True
        
    return state`
      }
    },
    {
      title: 'Routing and Executing the Loop',
      content: `<p>We need a router function to decide what happens next based on the state. If approved, we stop. If rejected, we route back to the coder.</p>`,
      code: {
        language: 'python',
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
run_cyclic_workflow("Write a secure password hashing function.")`
      },
      note: 'This architecture—where agents can critique and correct each other in a loop—is extremely powerful for coding, writing, and logical reasoning tasks. Frameworks like LangGraph treat this as a State Graph where agents are nodes and routing logic are edges.'
    }
  ],
  exercises: [
    'Add a third agent, `security_tester_agent`, that runs after the reviewer. Update the routing logic so that if EITHER the reviewer or tester rejects it, it goes back to the coder.',
    'Why is the `MAX_LOOPS` variable critical in cyclic multi-agent workflows?',
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
      question: 'Why must cyclic workflows implement a maximum loop counter (`MAX_LOOPS`)?',
      options: [
        'Because Python `while` loops are slow',
        'To prevent the agents from getting stuck in an infinite loop of critique and revision, which would consume massive API costs and never finish',
        'Because LLMs can only generate 3 responses per minute',
        'To satisfy regulatory requirements',
      ],
    }
  ]
};
