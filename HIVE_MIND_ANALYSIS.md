# Hive Mind Analysis — GitHub Downloads & Healthcare Hackathon Strategy

## Your GitHub Downloads — What Each Does

### 1. HealthForge (`HealthForge-main`)

**Healthcare communication platform** — the closest to your domain.

- React 19 + Supabase + Claude API + Deepgram (speech-to-text)
- Doctors record visits → Claude generates 3-level summaries (simple/plain/clinical) + confidence scores
- Doctor approval gate before patients see insights
- Family sharing via token-based links
- **Agent pattern**: None. Pure request-response (Claude called 2x sequentially per insight). No orchestration.
- **Relevant to you**: The dual-sided doctor/patient UX, confidence scoring, and reading-level toggle are strong patterns. The 2-request Claude flow (summarize → score) is a lightweight "chain" you could expand.

### 2. Ruflo (`ruflo-main`)

**Enterprise multi-agent orchestration platform** — this is the "hive mind" engine.

- TypeScript, Node 20+, 215+ MCP tools, 26 CLI commands
- **15-agent hierarchy**: Queen coordinator → 4 domain pools (Security, Core, Integration, Support)
- **Swarm topologies**: Hierarchical, Mesh, Ring, Star
- **Consensus algorithms**: Raft, Byzantine Fault Tolerance, Gossip, CRDT
- **Self-learning**: SONA neural adaptation, ReasoningBank (RETRIEVE→JUDGE→DISTILL→CONSOLIDATE→ROUTE), Q-Learning router
- **Vector memory**: HNSW search (<1ms), ONNX local embeddings, AgentDB
- **Key insight**: This is designed to orchestrate Claude Code itself. The swarm pattern (Queen → domain agents → consensus → merged output) is the core "hive mind" concept you'd adapt.

### 3. PyGPT (`py-gpt-master`)

**Desktop AI assistant** — comprehensive agent + plugin reference.

- Python + PySide6 (Qt) desktop app, 39 built-in plugins
- **5 agent runners**: LLamaIndex (ReAct, Planner, Steps, Workflow) + OpenAI-Agents SDK
- **Expert routing**: Main agent delegates to specialist experts by domain, integrates their outputs
- **RAG**: 6 vector store backends (Chroma, Pinecone, Qdrant, etc.)
- **28+ event hooks**: Plugin system intercepts at every lifecycle stage
- **Key insight**: The Expert Router pattern (main agent → specialist experts → integrated response) is a practical hive mind pattern. Also: the plugin-as-tool architecture where plugins register commands that become LLM-callable tools.

### 4. Open Interpreter (`open-interpreter-main`)

**LLM-powered local code execution** — the "hands" of an agent.

- Python, LiteLLM (multi-provider), Jupyter kernels for persistent state
- Classic agent loop: LLM generates code → execute → capture output → feed back to LLM → iterate
- Supports 10+ languages, real-time streaming, vision/screenshot analysis
- Anthropic computer-use integration (mouse, keyboard, bash tools)
- **Key insight**: The perception→plan→act→feedback loop with code execution is what makes agents actually *do* things. The safety model (user approval before execution) is relevant for healthcare.

### 5. PocketFlow (`PocketFlow-main`)

**100-line LLM orchestration framework** — the cleanest abstraction.

- Pure Python, zero dependencies, graph-based
- Universal `Node` lifecycle: `prep(shared) → exec(prep_res) → post(shared, prep_res, exec_res)`
- Action-based routing: `node_a - "search" >> search_node`, `node_a - "answer" >> answer_node`
- Shared store pattern for inter-node communication
- Supports: agents, multi-agents (via async queues), RAG, map-reduce, supervisor/validation, chain-of-thought
- **Key insight**: This is the *design pattern* you want. It proves that agents, workflows, RAG, and multi-agent coordination all reduce to the same graph abstraction: Nodes + Flows + action-based transitions.

---

## How These Map to a "Hive Mind" for the Hackathon

### What You Already Have

Your current project already has the building blocks:

- **`AgentPipeline`** (`src/agent/pipeline.ts`) — linear step-based execution with safety guards (like PocketFlow's `Flow`, but without branching)
- **`RetrievalOrchestrator`** (`src/retrieval/orchestrator.ts`) — parallel multi-source retrieval with scoring (already "hive-like" for data)

### Hive Mind Architecture

```
                    ┌──────────────────┐
                    │  ORCHESTRATOR    │  ← Your existing RetrievalOrchestrator concept
                    │  (Queen/Router)  │     but expanded to route AGENT tasks, not just retrieval
                    └────────┬─────────┘
                             │
         ┌───────────┬───────┴───────┬───────────────┐
         │           │               │               │
    ┌────▼────┐ ┌────▼────┐   ┌─────▼─────┐  ┌─────▼─────┐
    │CLINICAL │ │RETRIEVAL│   │ SAFETY    │  │ PATIENT   │
    │ AGENT   │ │ AGENT   │   │ AGENT     │  │ AGENT     │
    │         │ │         │   │           │  │           │
    │Summarize│ │D1+R2+   │   │PHI scan   │  │Simplify   │
    │Diagnose │ │Pinecone │   │Guardrails │  │Action plan│
    │Score    │ │RAG      │   │Compliance │  │Translate  │
    └─────────┘ └─────────┘   └───────────┘  └───────────┘
         │           │               │               │
         └───────────┴───────┬───────┴───────────────┘
                             │
                    ┌────────▼─────────┐
                    │  CONSENSUS /     │  ← Merge results, resolve conflicts
                    │  MERGE STEP      │     (confidence-weighted, safety-gated)
                    └──────────────────┘
```

### Key Patterns to Borrow

| From | Pattern | Apply As |
|------|---------|----------|
| **Ruflo** | Queen → domain agents → consensus | Orchestrator routes to specialist agents, merges outputs |
| **PocketFlow** | `prep→exec→post` + action-based routing | Replace linear pipeline with a graph that can branch/loop |
| **PyGPT** | Expert Router | Clinical questions → clinical agent, safety questions → safety agent |
| **HealthForge** | 2-request Claude chain + confidence scoring | Each agent does focused LLM work, scores its own confidence |
| **Open Interpreter** | Feedback loop with execution | Agents that can query D1, call APIs, and iterate on results |
| **Your existing code** | Safety guards between steps | Keep the pre/post safety checks — they become the "Safety Agent" |

### Simplest Viable Hive Mind

Upgrade your `AgentPipeline` from a linear chain to a graph (PocketFlow-style), add specialist step-types (HealthForge-style), route via an orchestrator (Ruflo-style), and keep your safety guards as a mandatory pass-through agent.

---

## Detailed Reference Files per Repo

### HealthForge — Key Files

| File | What to Study |
|------|---------------|
| `src/utils/generateInsights.js` | 2-request Claude flow (summarize → score) |
| `src/hooks/useDeepgramTranscription.js` | Real-time speech-to-text via WebSocket |
| `src/lib/queries.js` | Supabase CRUD patterns |
| `src/components/PatientDetailView.jsx` | Doctor-side insight generation + approval UX |
| `src/components/PatientDashboard.jsx` | Patient-side action plan + reading-level toggle |
| `supabase/schema.sql` | Data model: doctors → patients → sessions → insights → actions |

### Ruflo — Key Files

| File | What to Study |
|------|---------------|
| `v3/@claude-flow/swarm/src/unified-coordinator.ts` | Single canonical swarm engine (15-agent hierarchy) |
| `v3/@claude-flow/swarm/src/consensus/` | Raft, Byzantine, Gossip, CRDT implementations |
| `v3/@claude-flow/memory/src/hnsw-lite.ts` | Sub-ms vector search engine |
| `v3/@claude-flow/neural/src/reasoning-bank.ts` | Pattern storage: RETRIEVE→JUDGE→DISTILL→CONSOLIDATE |
| `v3/@claude-flow/neural/src/sona-manager.ts` | Self-optimizing routing (<0.05ms adaptation) |
| `v3/@claude-flow/swarm/src/message-bus.ts` | Inter-agent communication |
| `v3/@claude-flow/hooks/src/bridge/official-hooks-bridge.ts` | Claude Code hooks integration |

### PyGPT — Key Files

| File | What to Study |
|------|---------------|
| `src/pygpt_net/core/agents/agents.py` | Agent system coordinator |
| `src/pygpt_net/core/agents/runner.py` | Agent execution engine (4 runners) |
| `src/pygpt_net/core/experts/experts.py` | Expert/specialist routing system |
| `src/pygpt_net/core/agents/tools.py` | Plugin commands → LLM-callable tools |
| `src/pygpt_net/core/events/event.py` | Event dispatcher (28+ event types) |
| `src/pygpt_net/core/bridge/context.py` | BridgeContext data structure |
| `src/pygpt_net/plugin/base/plugin.py` | BasePlugin abstract class |

### Open Interpreter — Key Files

| File | What to Study |
|------|---------------|
| `interpreter/core/core.py` | OpenInterpreter main orchestrator |
| `interpreter/core/respond.py` | LLM ↔ Computer feedback loop |
| `interpreter/core/llm/llm.py` | LLM integration + message formatting |
| `interpreter/core/computer/terminal/terminal.py` | Code execution orchestration |
| `interpreter/core/computer/terminal/languages/jupyter_language.py` | Persistent Python execution via Jupyter |
| `interpreter/core/computer_use/loop.py` | Anthropic computer-use agent loop |

### PocketFlow — Key Files

| File | What to Study |
|------|---------------|
| `pocketflow/__init__.py` | **The entire framework** (100 lines) |
| `docs/core_abstraction/node.md` | Node lifecycle: prep→exec→post |
| `docs/core_abstraction/flow.md` | Graph orchestration + action-based transitions |
| `docs/design_pattern/agent.md` | Agent decision-making pattern |
| `docs/design_pattern/multi_agent.md` | Multi-agent communication via async queues |
| `docs/guide.md` | Agentic Coding methodology |
| `cookbook/pocketflow-agent/` | Research agent with web search + decision loop |
| `cookbook/pocketflow-multi-agent/` | Async multi-agent with message queues |

---

## Concept Glossary

| Term | Meaning in This Context |
|------|------------------------|
| **Hive Mind** | Multiple specialized AI agents working together, sharing context, and merging outputs into a unified result |
| **Queen/Router** | Central coordinator that receives a task, decides which agents handle it, and merges their outputs (Ruflo pattern) |
| **Specialist Agent** | An agent focused on one domain — clinical reasoning, safety scanning, patient communication, data retrieval |
| **Consensus** | Process of combining multiple agent outputs into a single trusted result (confidence-weighted voting, safety gates) |
| **Shared Store** | Central data structure all agents read from and write to (PocketFlow pattern — your `AgentContext.data`) |
| **Action-Based Routing** | A step returns a string ("search", "answer", "escalate") that determines which step runs next (PocketFlow pattern) |
| **Expert Router** | Main agent dynamically delegates to specialist experts based on query type (PyGPT pattern) |
| **Feedback Loop** | Agent executes an action, observes the result, and decides whether to iterate or stop (Open Interpreter pattern) |
| **Safety Gate** | Mandatory check between steps that can halt the pipeline if PHI or unsafe content is detected (your existing pattern) |
| **Confidence Scoring** | Each agent rates how confident it is in its output; low confidence triggers review or escalation (HealthForge pattern) |
