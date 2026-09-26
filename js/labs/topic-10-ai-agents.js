/* ============================================================
   Topic 10 — AI Agents & Tool Use (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-10_lab1'] = {
  title:      'From Text Predictors to Agents: Building a ReAct Loop',
  difficulty: 'Simple → Intermediate',
  duration:   '90 minutes',
  overview:   'Standard Large Language Models (LLMs) are passive; they simply predict the next word based on a prompt. AI Agents, however, take ACTIONS. They operate in a loop where they reason about a problem, use external tools (like calculators or search engines) to gather data, and use that data to answer complex queries. In this lab, you will build a sophisticated agent using the ReAct (Reasoning and Acting) paradigm from absolute scratch.',
  objectives: [
    'Understand the fundamental difference between a passive LLM and an active AI Agent',
    'Implement the ReAct (Reasoning + Acting) execution loop',
    'Create secure Python functions that act as "Tools" for the LLM to call',
    'Write Regex parsers to extract structured tool commands from raw LLM text output',
    'Manage an active agent conversation state/memory',
  ],
  steps: [
    {
      title: 'LLMs vs AI Agents',
      content: `<p>An LLM generates text. An <strong>Agent</strong> is a software system that uses an LLM as its "brain" to loop through a continuous cycle of observation, reasoning, and acting.</p>
<h4>The ReAct Pattern (Reason + Act)</h4>
<p>Introduced by researchers at Princeton and Google in 2022, ReAct forces the LLM to think out loud before acting. The cycle is:</p>
<ol>
  <li><strong>Thought:</strong> The agent reasons about what it needs to do to solve the user's prompt.</li>
  <li><strong>Action:</strong> The agent selects a specific tool from its toolbelt and provides the necessary inputs.</li>
  <li><strong>Observation:</strong> The Python system halts the LLM, physically runs the tool, and feeds the result back to the LLM.</li>
  <li>This loop repeats continuously until the agent decides it has enough information to output a <strong>Final Answer</strong>.</li>
</ol>`,
      code: {
        language: 'python',
        content: `# 1. Define our physical Tools (Python functions)
def calculator(expression):
    """Safely evaluates a basic math expression."""
    try:
        # WARNING: In production, NEVER use eval() with untrusted LLM input!
        # You should use a secure math parser like 'numexpr' or 'ast.literal_eval'.
        # We use it here purely for a simple demonstration.
        result = eval(expression, {"__builtins__": None}, {})
        return str(result)
    except Exception as e:
        return f"Execution Error: {e}"

def wikipedia_search(query):
    """Simulates a Wikipedia API search."""
    # A mock database of knowledge
    db = {
        "Eiffel Tower": "The Eiffel Tower is 330 meters tall.",
        "Mount Everest": "Mount Everest is 8,848 meters tall.",
        "Speed of Light": "299,792,458 meters per second."
    }
    # Return the data if found, otherwise return a failure observation
    for key, value in db.items():
        if key.lower() in query.lower():
            return value
    return "Search yielded no results. Try a different query."

# The Agent's Tool Registry
TOOLS = {
    "Calculator": calculator,
    "Wikipedia": wikipedia_search
}

print("Agent Tools successfully registered and ready for execution.")
print(f"Available Tools: {list(TOOLS.keys())}")`
      }
    },
    {
      title: 'Designing the Agent System Prompt',
      content: `<p>To force the LLM to behave like a ReAct agent rather than a standard chatbot, we must give it an incredibly strict System Prompt telling it exactly how to format its thoughts and actions so our Python code can parse them.</p>`,
      code: {
        language: 'python',
        content: `system_prompt = """
You are a highly capable AI Agent with access to external tools. 
To solve the user's task, you MUST operate in a strict loop.

You have access to the following tools:
- Calculator: Safely evaluates a math expression (e.g., '4 + 5').
- Wikipedia: Searches Wikipedia for factual information.

You must use EXACTLY the following format for every step:

Question: [The user's input]
Thought: [Explain your step-by-step reasoning about what to do next]
Action: [The exact name of the tool to use, must be one of: Calculator, Wikipedia]
Action Input: [The string input to pass into the tool]

You will then receive an "Observation" from the system containing the tool's result.
You will repeat this Thought/Action/Observation loop until you can answer the question.

When you have the final answer, you must output:
Final Answer: [Your complete answer to the user]
"""

print("ReAct System prompt designed to enforce the strict execution loop.")`
      }
    },
    {
      title: 'Executing the ReAct Loop (Simulation)',
      content: `<p>Because we aren't calling a real LLM API (like OpenAI) in this environment, we will simulate the LLM's text output across multiple iterations to see exactly how our Python code parses the text, executes the tool, and feeds the state back.</p>`,
      code: {
        language: 'python',
        content: `import re

def run_react_agent(user_query):
    print(f"\\n--- New Task Received: '{user_query}' ---\\n")
    
    # --- SIMULATED LLM RESPONSE (ITERATION 1) ---
    # The LLM realizes it needs a fact before it can do math.
    llm_output_1 = """Thought: I need to find the height of the Eiffel Tower first.
Action: Wikipedia
Action Input: Eiffel Tower"""
    
    print(f"🤖 LLM Output (Iter 1):\\n{llm_output_1}\\n")
    
    # Parse the LLM's output using Regex
    action_match = re.search(r"Action: (.*)", llm_output_1)
    input_match = re.search(r"Action Input: (.*)", llm_output_1)
    
    if action_match and input_match:
        tool_name = action_match.group(1).strip()
        tool_input = input_match.group(1).strip()
        
        print(f"⚙️ System executing tool: {tool_name}('{tool_input}')")
        
        # Dynamically call the Python function from the registry
        if tool_name in TOOLS:
            observation = TOOLS[tool_name](tool_input)
            print(f"🔍 Observation returned to LLM: {observation}\\n")
        else:
            print(f"❌ Error: Tool {tool_name} not found.\\n")
            
    # --- SIMULATED LLM RESPONSE (ITERATION 2) ---
    # We append the Observation to the LLM's context. 
    # It realizes it needs to multiply the height by 2.
    llm_output_2 = """Thought: The height is 330 meters. I need to multiply 330 by 2.
Action: Calculator
Action Input: 330 * 2"""
    
    print(f"🤖 LLM Output (Iter 2):\\n{llm_output_2}\\n")
    
    # Parse Iteration 2
    action_match = re.search(r"Action: (.*)", llm_output_2)
    input_match = re.search(r"Action Input: (.*)", llm_output_2)
    
    if action_match and input_match:
        tool_name = action_match.group(1).strip()
        tool_input = input_match.group(1).strip()
        print(f"⚙️ System executing tool: {tool_name}('{tool_input}')")
        observation = TOOLS[tool_name](tool_input)
        print(f"🔍 Observation returned to LLM: {observation}\\n")

    # --- SIMULATED LLM RESPONSE (ITERATION 3) ---
    # The LLM finally has the answer and breaks the loop.
    llm_output_3 = """Thought: I now have the result of the calculation.
Final Answer: Double the height of the Eiffel Tower is 660 meters."""
    
    print(f"🤖 LLM Output (Iter 3):\\n{llm_output_3}\\n")
    
    final_match = re.search(r"Final Answer: (.*)", llm_output_3)
    if final_match:
        print(f"✅ Task Complete! Outputting to user:\\n{final_match.group(1)}")

# Run the simulation
run_react_agent("What is double the height of the Eiffel Tower?")`
      },
      note: 'In a real implementation (like LangChain or AutoGen), a `while` loop continuously calls the LLM API, parses the action, runs the tool, appends the `Observation: ...` to the chat history array, and calls the API again until the regex captures the "Final Answer" string.'
    }
  ],
  exercises: [
    'Write a new Python function `get_stock_price(ticker)` and add it to the `TOOLS` dictionary. Write out exactly what the LLM\'s `Thought`, `Action`, and `Action Input` would look like to call this tool.',
    'What happens to your code if the LLM hallucinates and outputs `Action: WebSearch` (which is not in your registry)? How should the system handle this so the agent doesn\'t crash?',
    'Why is it dangerous to give an AI Agent an unchecked tool like `execute_bash_command(cmd)`?',
  ],
  quiz: [
    {
      question: 'What is the fundamental difference between a standard conversational LLM and an AI Agent?',
      options: [
        'Agents are much larger neural networks with more parameters',
        'Agents can only output programming code',
        'Agents are connected to external tools and operate in an autonomous loop (Reasoning + Acting) to interact with and change external environments',
        'Agents do not use neural networks, they use search trees',
      ],
      answer: 2
    },
    {
      question: 'In the ReAct pattern, what exactly is an "Observation"?',
      options: [
        'The LLM analyzing its own internal thoughts',
        'The result returned by the external tool (e.g., the answer from the calculator), which is fed back into the LLM as context for the next iteration',
        'The user\'s initial prompt',
        'An image taken by a physical camera',
      ],
      answer: 1
    },
    {
      question: 'How does the underlying Python system know which tool the LLM wants to use in a ReAct loop?',
      options: [
        'It guesses based on semantic similarity to the user\'s prompt',
        'The LLM directly executes Python code on the server',
        'The Python system parses the LLM\'s raw text output using Regex to extract specific formatted strings like "Action: Calculator"',
        'The LLM communicates via a hidden binary protocol',
      ],
      answer: 2
    }
  ]
};

window.LAB_DATA['topic-10_lab2'] = {
  title:      'Native Function Calling and Structured Tool APIs',
  difficulty: 'Intermediate → Advanced',
  duration:   '120 minutes',
  overview:   'Parsing unstructured text with Regex (as we did in the ReAct lab) is highly fragile. If the LLM forgets a colon or misspells "Action", the entire agent loop crashes. Modern models (like GPT-4 and Gemini Pro) support native "Function Calling" (or Tool Use). The LLM is heavily fine-tuned to output guaranteed, structured JSON representing the exact function and arguments to call. In this advanced lab, you will define JSON schemas for tools and simulate a highly robust function calling workflow.',
  objectives: [
    'Understand why Regex parsing is a fragile anti-pattern for production AI agents',
    'Write OpenAPI-compliant JSON Schemas to define tools for LLMs',
    'Understand how the LLM maps natural language to JSON parameters',
    'Simulate a structured Function Calling API interaction',
    'Execute tools dynamically by unpacking JSON dictionaries (`**kwargs`) into Python functions',
  ],
  steps: [
    {
      title: 'Defining Tools with JSON Schema',
      content: `<p>To use native Function Calling with APIs like OpenAI, you do NOT put tool instructions in the text prompt. Instead, you pass a strict JSON array to the API. This array describes your Python functions, their names, descriptions, and the exact data types (String, Integer, Boolean) of every argument.</p>`,
      code: {
        language: 'python',
        content: `import json

# ── 1. The Python Function ──
def send_email(to_address, subject, body, urgent=False):
    """Sends an email to a recipient."""
    priority = "[URGENT] " if urgent else ""
    # In a real app, this would use SMTP or SendGrid
    return f"Success: {priority}Email sent to {to_address} with subject '{subject}'"

# ── 2. The JSON Schema Definition ──
# This is passed to the LLM via the 'tools' parameter in the API call.
tools_definition = [
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send an email to a specific user or department.",
            "parameters": {
                "type": "object",
                "properties": {
                    "to_address": {
                        "type": "string",
                        "description": "The email address of the recipient."
                    },
                    "subject": {
                        "type": "string",
                        "description": "The subject line of the email."
                    },
                    "body": {
                        "type": "string",
                        "description": "The main content of the email."
                    },
                    "urgent": {
                        "type": "boolean",
                        "description": "Set to true if the user implies high priority or emergency."
                    }
                },
                # The LLM will refuse to call the function if it cannot determine these fields
                "required": ["to_address", "subject", "body"]
            }
        }
    }
]

print("Tool schema defined successfully.")
print("The LLM reads this JSON to know exactly how to structure its output.")`
      }
    },
    {
      title: 'Simulating the Structured LLM Response',
      content: `<p>When the user asks, "Email Sarah (sarah@corp.com) urgently to tell her the server is down", the LLM API recognizes it has a tool for this. It does NOT return a standard text response. Instead, it returns a <strong>ToolCall Object</strong> containing the function name and a JSON string of arguments.</p>`,
      code: {
        language: 'python',
        content: `user_prompt = "Email Sarah (sarah@corp.com) urgently to tell her the server is down!"
print(f"User Request: '{user_prompt}'\\n")

# Simulate the exact JSON response returned by the OpenAI/Gemini API
# Notice how the LLM perfectly inferred the boolean 'urgent' flag from the word "urgently"
llm_function_call_response = {
    "role": "assistant",
    "content": None, # Content is None because the model decided to call a tool instead of talking
    "tool_calls": [
        {
            "id": "call_abc123",
            "type": "function",
            "function": {
                "name": "send_email",
                "arguments": '{"to_address": "sarah@corp.com", "subject": "Server Down", "body": "Sarah, the server is currently down. Please investigate immediately.", "urgent": true}'
            }
        }
    ]
}

print("--- Simulated API Response (ToolCall) ---")
print(json.dumps(llm_function_call_response, indent=2))`
      },
      note: 'Native Function Calling completely eliminates prompt engineering errors where the LLM forgets a quotation mark or misnames a parameter. The LLM acts as a perfect Natural Language to JSON compiler.'
    },
    {
      title: 'Executing the Function Programmatically',
      content: `<p>Because the LLM guarantees a valid JSON object matching our schema, executing the Python function dynamically is trivial and safe. We simply parse the JSON and unpack it directly into the function arguments.</p>`,
      code: {
        language: 'python',
        content: `# Extract the tool call from the API response
tool_call = llm_function_call_response["tool_calls"][0]
function_name = tool_call["function"]["name"]
raw_arguments = tool_call["function"]["arguments"]

# 1. Parse the JSON string into a Python dictionary
try:
    args_dict = json.loads(raw_arguments)
except json.JSONDecodeError:
    print("Error: LLM returned invalid JSON.")
    exit()

# 2. Safety check: does the function actually exist in our allowed registry?
available_functions = {
    "send_email": send_email
}

if function_name in available_functions:
    func_to_call = available_functions[function_name]
    
    print(f"🤖 Executing Tool: {function_name}()")
    print(f"   With Arguments: {args_dict}\\n")
    
    # 3. Execute the function by unpacking the dictionary (**kwargs)
    # This is equivalent to: send_email(to_address="...", subject="...", ...)
    result = func_to_call(**args_dict)
    
    print(f"🔍 Result from Python execution:\\n{result}")
else:
    print(f"Error: LLM tried to call an unknown function '{function_name}'.")`
      },
      warning: 'Even with native function calling, you MUST write defensive Python code. If your tool deletes a database row, you must explicitly ask the user for confirmation before executing the `func_to_call(**args_dict)` line.'
    }
  ],
  exercises: [
    'Write the JSON Schema definition for a complex tool: `create_calendar_event(title, start_time, end_time, attendees_list)`. Ensure `attendees_list` is typed as an array of strings.',
    'What happens if the LLM forgets to include the `to_address` in its JSON output? How would the Python `**args_dict` unpacking fail, and how should you handle it gracefully in a real agent loop to ask the LLM to fix it?',
  ],
  quiz: [
    {
      question: 'Why is native "Function Calling" considered far superior to parsing text (like Regex in ReAct) for AI Agents?',
      options: [
        'It is free to use on all API providers',
        'It is drastically more reliable because the LLM is fine-tuned at the model level to output strictly structured JSON matching your schema, avoiding parsing crashes',
        'It allows the LLM to bypass firewalls and access the internet directly',
        'It prevents the LLM from making any logical errors when answering math problems',
      ],
      answer: 1
    },
    {
      question: 'What format is used to strictly define tools and parameters to the LLM in modern APIs?',
      options: [
        'XML Tags',
        'OpenAPI-compliant JSON Schema',
        'Python Docstrings',
        'CSV Files',
      ],
      answer: 1
    },
    {
      question: 'When a modern LLM decides to use a tool, what does its API response look like?',
      options: [
        'It outputs the final answer to the user wrapped in HTML',
        'It returns a Python script that you must save to disk and execute',
        'It returns a structured JSON "ToolCall" object containing the exact name of the function to call and a dictionary of the arguments to pass',
        'An error message stating that it cannot perform actions',
      ],
      answer: 2
    },
    {
      question: 'How do you dynamically pass a parsed JSON dictionary of arguments to a Python function?',
      options: [
        'Using the double-asterisk unpacking operator (`func(**args_dict)`)',
        'By converting the dictionary to a string and using `eval()`',
        'By writing a massive `if/else` block for every possible argument',
        'It is impossible; you must pass arguments one by one manually',
      ],
      answer: 0
    }
  ]
};
