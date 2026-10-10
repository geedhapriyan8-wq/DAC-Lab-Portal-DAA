/* ============================================================
   Topic 10 — AI Agents & Tool Use (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-10_lab1'] = {
  title:      'Foundations: Microsoft AI Agents for Beginners',
  difficulty: 'Hands-on → Intermediate',
  duration:   '90 minutes',
  overview:   'In this foundational hands-on lab inspired by Microsoft\'s "AI Agents for Beginners" framework (github.com/microsoft/ai-agents-for-beginners), you will build an autonomous AI Agent from first principles. You will implement the core ReAct (Reasoning + Acting) perception-action loop, register secure domain tools (database querying, customer metrics calculation), manage conversation memory state, and observe the agent autonomously plan, invoke tools, and synthesize grounded answers.',
  objectives: [
    'Understand the Microsoft AI Agents framework: Personas, Reasoning, Tools, and Memory',
    'Construct an object-oriented Agent Runtime with a complete ReAct execution loop',
    'Register structured Python tools with type hints and docstrings as functional schemas',
    'Maintain multi-turn conversation state and short-term execution memory',
    'Parse and dispatch tool calls dynamically with error handling and fallback recovery',
    'Trace multi-step tool execution trajectories on real customer support tasks',
  ],
  steps: [
    {
      title: 'Step 1: The Core Agent Architecture',
      content: `<p>According to Microsoft's AI Agents framework, an autonomous agent consists of four core pillars:</p>
<ol>
  <li><strong>Persona & System Prompt:</strong> Defines identity, operating boundaries, and reasoning conventions.</li>
  <li><strong>Reasoning Engine (LLM):</strong> Evaluates user goals and formulates step-by-step action plans (ReAct: Thought &rarr; Action &rarr; Observation).</li>
  <li><strong>Toolbelt:</strong> Functions the agent can execute to interact with databases, APIs, or calculators.</li>
  <li><strong>Memory:</strong> Tracks past interactions, tool outputs, and environment states.</li>
</ol>`,
      code: {
        language: 'python',
        content: `import json
import re

# ── 1. Mock Enterprise Database ────────────────────────────────
CUSTOMER_DB = {
    "CUST-1001": {"name": "Alice Smith", "tier": "Enterprise", "monthly_spend": 2400.0, "status": "Active"},
    "CUST-1002": {"name": "Bob Jones", "tier": "Pro", "monthly_spend": 450.0, "status": "Past Due"},
    "CUST-1003": {"name": "Charlie Day", "tier": "Starter", "monthly_spend": 49.0, "status": "Active"}
}

# ── 2. Functional Tools ────────────────────────────────────────
def lookup_customer(customer_id: str) -> str:
    """Retrieves account details for a customer by their unique ID."""
    cid = customer_id.strip().upper()
    if cid in CUSTOMER_DB:
        return json.dumps(CUSTOMER_DB[cid])
    return f"Error: Customer {customer_id} not found."

def calculate_discount(tier: str, months: int) -> str:
    """Calculates discount percentage and projected savings based on tier and commitment."""
    discounts = {"Enterprise": 0.20, "Pro": 0.10, "Starter": 0.05}
    rate = discounts.get(tier.capitalize(), 0.0)
    return json.dumps({"tier": tier, "commitment_months": months, "discount_rate": rate, "annual_multiplier": 1 - rate})

TOOL_REGISTRY = {
    "lookup_customer": lookup_customer,
    "calculate_discount": calculate_discount
}

print("Tool Registry initialized with Microsoft AI Agent conventions:")
for name, fn in TOOL_REGISTRY.items():
    print(f"• Tool: {name:<20} | Doc: {fn.__doc__}")`,
      },
    },
    {
      title: 'Step 2: Designing the ReAct Execution Engine',
      content: `<p>We implement the <code>ReActAgent</code> class. It generates a step-by-step plan, formats the action call, executes the Python tool, appends the observation, and loops until the final answer is reached.</p>`,
      code: {
        language: 'python',
        content: `class ReActAgent:
    def __init__(self, tools, max_steps=5):
        self.tools = tools
        self.max_steps = max_steps
        self.memory = []

    def format_prompt(self, user_query):
        tool_desc = "\\n".join([f"- {name}: {fn.__doc__}" for name, fn in self.tools.items()])
        return f"""You are a customer intelligence AI Agent.
Answer the user request using the ReAct loop: Thought, Action, Action Input, Observation, Final Answer.

Available Tools:
{tool_desc}

User Request: {user_query}
"""

    def parse_action(self, text):
        match_action = re.search(r"Action:\\s*([\\w_]+)", text)
        match_input = re.search(r"Action Input:\\s*(.+)", text)
        if match_action and match_input:
            return match_action.group(1).strip(), match_input.group(1).strip()
        return None, None

    def execute_tool(self, tool_name, tool_input):
        if tool_name not in self.tools:
            return f"Error: Tool '{tool_name}' does not exist in registry."
        try:
            # Handle JSON or comma-separated parameters
            if tool_input.startswith("{") and tool_input.endswith("}"):
                kwargs = json.loads(tool_input)
                return self.tools[tool_name](**kwargs)
            elif "," in tool_input:
                args = [a.strip() for a in tool_input.split(",")]
                return self.tools[tool_name](*args)
            else:
                return self.tools[tool_name](tool_input)
        except Exception as e:
            return f"Tool execution failed: {str(e)}"`,
      },
    },
    {
      title: 'Step 3: Multi-Step Agent Execution Simulation',
      content: `<p>Simulate an end-to-end multi-step run where the agent must look up customer details, verify their tier, calculate discounts, and formulate an executive response.</p>`,
      code: {
        language: 'python',
        content: `def run_agent_demonstration(agent, user_query):
    print(f"\\n{'='*60}\\nAGENT RUN: \\"{user_query}\\"\\n{'='*60}")
    
    # Simulated multi-step reasoning trajectory
    steps = [
        # Step 1: Look up customer
        """Thought: I must inspect account details for customer CUST-1001 to find their tier and monthly spend.
Action: lookup_customer
Action Input: CUST-1001""",
        # Step 2: Calculate annual contract discount for their Enterprise tier
        """Thought: Customer CUST-1001 is on the Enterprise tier with $2400/month. I will calculate their 12-month discount.
Action: calculate_discount
Action Input: Enterprise, 12""",
        # Step 3: Final Answer synthesis
        """Thought: I have the customer data and discount terms. I can formulate the final recommendation.
Final Answer: Alice Smith (CUST-1001) is currently on the Enterprise tier ($2,400/mo). With a 12-month commitment, she qualifies for a 20% discount, lowering her annual spend to $23,040 (saving $5,760 annually)."""
    ]
    
    for i, step_text in enumerate(steps, 1):
        print(f"--- [Step {i}] LLM Generation ---")
        print(step_text)
        
        tool_name, tool_input = agent.parse_action(step_text)
        if tool_name:
            print(f"\\n⚙️ Executing: {tool_name}({tool_input})")
            obs = agent.execute_tool(tool_name, tool_input)
            print(f"🔍 Observation: {obs}\\n")
        else:
            match_final = re.search(r"Final Answer:\\s*(.+)", step_text, re.DOTALL)
            if match_final:
                print(f"\\n🎉 Task Completed successfully!")
                return match_final.group(1).strip()

agent = ReActAgent(TOOL_REGISTRY)
result = run_agent_demonstration(agent, "Check Alice Smith's (CUST-1001) tier and calculate her 12-month renewal discount.")
print(f"\\nFinal Output: {result}")`,
      },
      note: 'Notice how the agent breaks down a compound request into discrete, manageable tool calls and uses the observation from Step 1 to inform the parameters for Step 2.',
    },
  ],
  exercises: [
    'Add an email_quote tool to TOOL_REGISTRY that simulates sending a proposal PDF to the customer email.',
    'Implement a loop safety check: if the agent calls the same tool 3 times with the exact same input, halt and return an error.',
    'Write a unit test verifying that lookup_customer gracefully handles nonexistent IDs without raising uncaught exceptions.',
  ],
  quiz: [
    {
      question: 'What is the fundamental architecture of an AI Agent according to Microsoft\'s AI Agents Foundations?',
      options: [
        'A static rule-based script with hardcoded if-else trees',
        'An offline tokenizer without API access',
        'An autonomous system combining an LLM reasoning engine with a continuous perception-action loop (Thought -> Action -> Observation), equipped with tools and memory',
        'A convolutional neural network trained on ImageNet',
      ],
    },
    {
      question: 'In the ReAct (Reasoning + Acting) loop, what is the role of the "Observation" step?',
      options: [
        'The user reading the final output on the screen',
        'The return payload or data received after executing an external tool (e.g. database query, API response), injected back into the LLM context for subsequent reasoning',
        'The model compiling weights to disk',
        'A web browser taking a screenshot',
      ],
    },
    {
      question: 'How does the Agent runtime decide which tool to trigger and what arguments to supply?',
      options: [
        'It randomly selects a tool from the registry',
        'The user must write Python code during each execution step',
        'The LLM analyzes the query against registered tool schemas (name, docstring, parameters) and emits structured tool invocations',
        'The database automatically triggers SQL stored procedures',
      ],
    },
  ],
};

window.LAB_DATA['topic-10_lab2'] = {
  title:      'Advanced Orchestration: MongoDB, Gemini & LangGraph',
  difficulty: 'Advanced → Production Agents',
  duration:   '90–120 minutes',
  overview:   'In this advanced lab based on MongoDB Developer tutorials (github.com/mongodb-developer/ai-agents-tutorial), you will architect a production-grade multi-tool AI Agent using LangGraph, Google Gemini, and MongoDB Atlas Vector Search. You will build a stateful execution graph with conditional edges, integrate vector search document retrieval with transactional database tools, manage state checkpoints, and run cyclic agent loops with robust tool routing.',
  objectives: [
    'Design stateful agent graphs using LangGraph state machine concepts',
    'Define an AgentState container with message histories and execution flags',
    'Implement conditional edge routing to direct flow between Tools Node and LLM Node',
    'Integrate MongoDB Atlas vector search indexing with operational tools',
    'Configure Gemini / Function Calling structured tool schemas',
    'Trace multi-step cyclic execution with human-in-the-loop inspection checkpoints',
  ],
  steps: [
    {
      title: 'Step 1: LangGraph Architecture & AgentState',
      content: `<p>LangGraph models agents as <strong>State Graphs</strong> (Nodes & Edges):</p>
<ul>
  <li><strong>State (AgentState):</strong> The shared memory dictionary passed between nodes containing the list of messages and runtime metadata.</li>
  <li><strong>Nodes:</strong> Python functions that perform work (e.g. <code>call_model</code> to generate reasoning, <code>call_tool</code> to execute functions).</li>
  <li><strong>Conditional Edges:</strong> Routing logic that inspects whether the model produced tool calls or a final answer, directing flow accordingly.</li>
</ul>`,
      code: {
        language: 'python',
        content: `from typing import TypedDict, List, Dict, Any, Union

# Define the shared state schema
class AgentState(TypedDict):
    messages: List[Dict[str, Any]]
    sender: str
    tool_calls: List[Dict[str, Any]]
    final_output: str

# Sample state initialization
initial_state: AgentState = {
    "messages": [{"role": "user", "content": "Find orders for customer CUST-1001 with total over $500 and retrieve policy docs."}],
    "sender": "user",
    "tool_calls": [],
    "final_output": ""
}

print("LangGraph AgentState schema configured.")`,
      },
    },
    {
      title: 'Step 2: MongoDB Atlas Operational & Vector Search Tools',
      content: `<p>In modern enterprise agent stacks, MongoDB Atlas provides both transactional document storage (customer orders) and semantic Vector Search (policy knowledge base).</p>`,
      code: {
        language: 'python',
        content: `class MockMongoDBAtlas:
    """Simulates MongoDB Atlas with collection operations and Vector Search."""
    def __init__(self):
        self.orders = [
            {"order_id": "ORD-901", "customer_id": "CUST-1001", "amount": 1200.0, "status": "Shipped", "items": ["Enterprise Server License"]},
            {"order_id": "ORD-902", "customer_id": "CUST-1001", "amount": 350.0, "status": "Delivered", "items": ["Consulting Hours"]},
            {"order_id": "ORD-903", "customer_id": "CUST-1002", "amount": 850.0, "status": "Pending", "items": ["Pro Subscription"]}
        ]
        self.policy_vector_index = [
            {"title": "Enterprise Refund Policy", "content": "Enterprise software licenses can be refunded within 30 days of shipment with VP approval.", "category": "billing"},
            {"title": "Service SLA Guarantee", "content": "Guaranteed 99.9% uptime with 1-hour priority support response times.", "category": "operations"}
        ]

    def query_orders(self, customer_id: str, min_amount: float = 0.0) -> List[Dict]:
        """Queries orders collection matching customer and amount filters."""
        return [o for o in self.orders if o["customer_id"] == customer_id and o["amount"] >= min_amount]

    def vector_search_policies(self, query: str) -> List[Dict]:
        """Performs vector search over MongoDB policy collection."""
        # Simulated semantic retrieval matching
        for doc in self.policy_vector_index:
            if "refund" in query.lower() and "refund" in doc["title"].lower():
                return [doc]
        return [self.policy_vector_index[0]]

mongo_db = MockMongoDBAtlas()
print("MongoDB Atlas operational and vector collections ready.")`,
      },
    },
    {
      title: 'Step 3: Graph Nodes & Conditional Routing',
      content: `<p>We construct the two primary nodes (<code>model_node</code> and <code>tool_node</code>) and the conditional edge function <code>should_continue</code>.</p>`,
      code: {
        language: 'python',
        content: `def model_node(state: AgentState) -> AgentState:
    """Evaluates message history and decides whether to invoke tools or finalize."""
    history = state["messages"]
    last_msg = history[-1]["content"]
    
    # If tools were just executed, synthesize the final answer
    if any(m.get("role") == "tool" for m in history):
        tool_results = [m["content"] for m in history if m.get("role") == "tool"]
        state["final_output"] = f"Orders and policies analyzed successfully: {tool_results}"
        state["tool_calls"] = []
        state["sender"] = "assistant"
        state["messages"].append({"role": "assistant", "content": state["final_output"]})
    else:
        # Generate tool calls
        state["tool_calls"] = [
            {"tool": "query_orders", "args": {"customer_id": "CUST-1001", "min_amount": 500.0}},
            {"tool": "vector_search_policies", "args": {"query": "refund policy on enterprise license"}}
        ]
        state["sender"] = "assistant"
        state["messages"].append({
            "role": "assistant", 
            "content": "Executing MongoDB queries and vector policy search...",
            "tool_calls": state["tool_calls"]
        })
    return state

def tool_node(state: AgentState) -> AgentState:
    """Executes all pending tool calls and appends results to state messages."""
    for call in state["tool_calls"]:
        tname = call["tool"]
        targs = call["args"]
        print(f"🔧 ToolNode executing: {tname}({targs})")
        
        if tname == "query_orders":
            res = mongo_db.query_orders(**targs)
        elif tname == "vector_search_policies":
            res = mongo_db.vector_search_policies(**targs)
        else:
            res = {"error": "unknown tool"}
            
        state["messages"].append({"role": "tool", "name": tname, "content": res})
        
    state["tool_calls"] = []
    state["sender"] = "tool_executor"
    return state

def should_continue(state: AgentState) -> str:
    """Conditional Edge router."""
    if state["tool_calls"]:
        return "tools"
    return "end"`,
      },
    },
    {
      title: 'Step 4: Executing the LangGraph Cyclic Loop',
      content: `<p>We run the cyclic graph: <code>Start &rarr; model_node &rarr; should_continue &rarr; (if tools &rarr; tool_node &rarr; model_node) &rarr; end</code>.</p>`,
      code: {
        language: 'python',
        content: `def run_langgraph_workflow(initial_state: AgentState):
    print("="*60)
    print("        EXECUTING LANGGRAPH STATE MACHINE WORKFLOW       ")
    print("="*60)
    current_state = initial_state
    step_count = 1
    
    while step_count <= 5:
        print(f"\\n--- [Cycle {step_count}] Current Node: Model Reasoning ---")
        current_state = model_node(current_state)
        
        decision = should_continue(current_state)
        print(f"Decision Edge: '{decision}'")
        
        if decision == "tools":
            print(f"--- [Cycle {step_count}] Current Node: Tool Executor ---")
            current_state = tool_node(current_state)
            step_count += 1
        elif decision == "end":
            print("\\n🏁 Flow reached END state successfully!")
            break
            
    print("="*60)
    print("FINAL AGENT STATE OUTPUT:")
    print(current_state["final_output"])
    print("="*60)
    return current_state

completed_state = run_langgraph_workflow(initial_state)`,
      },
      note: 'State graphs provide enterprise-grade reliability because every step, parameter, and tool result is strictly recorded in the immutable state container.',
    },
  ],
  exercises: [
    'Add an email_notification node to the graph that executes only if the final order amount exceeds $1,000.',
    'Implement a human-in-the-loop interrupt before tool_node executes to require manual confirmation for refund approvals.',
    'Extend AgentState to include a token_usage counter that sums prompt and completion tokens across cycles.',
  ],
  quiz: [
    {
      question: 'In advanced agent orchestration with LangGraph, what is the primary benefit of representing agents as a State Graph?',
      options: [
        'It replaces all LLMs with relational databases',
        'It provides deterministic state tracking, explicit cycles, branching conditionals, and robust error recovery across multi-step agent workflows',
        'It eliminates all Python code',
        'It prevents any tool calls from executing',
      ],
    },
    {
      question: 'What role does a vector-enabled database like MongoDB Atlas play in an agent orchestration system?',
      options: [
        'It acts as the GPU accelerator for token generation',
        'It provides unified persistent operational data storage, vector search indexing for retrieval tools, and conversation checkpoint memory',
        'It converts natural language into binary assembly instructions',
        'It generates API keys automatically',
      ],
    },
    {
      question: 'In LangGraph state machines, what is a "Conditional Edge"?',
      options: [
        'A physical Ethernet cable connecting servers',
        'A static link that always jumps to the END node',
        'A routing function that inspects the current AgentState (e.g. presence of pending tool calls) and dynamically routes execution to either a tool node or the response node',
        'A loss function penalty during gradient descent',
      ],
    },
    {
      question: 'How are tool execution results returned to the LLM within a LangGraph state loop?',
      options: [
        'The tool node executes the function, wraps the result in a ToolMessage, and updates the state message history so the model can inspect the output in the next iteration',
        'By sending an email to the administrator',
        'By writing raw bytes directly to GPU registers',
        'By restarting the Python process from line 1',
      ],
    },
  ],
};
