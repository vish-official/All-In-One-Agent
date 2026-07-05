# ALL-IN-ONE — Phase 1.1: System Blueprint
## Complete Internal Operating Model & Platform Architecture

This document defines the comprehensive internal operating model, interfaces, component interactions, and data flows of **ALL-IN-ONE**, a local-first AI Orchestrator designed to serve as the development brain behind **Aether AI**. This system is built to maintain structural integrity, modular isolate state, and scale to over 100,000 lines of code over a 10-year development horizon.

---

## 1. Workspace System

The Workspace System is responsible for isolating projects, configurations, states, and data stores within independent, fully sandboxed directories. This prevents cross-contamination between high-risk or client-confidential workspaces (e.g., separating `Horror Game` from `Client Website`).

### Workspace Layout & Sandbox Directories
Every workspace is bound to a specific local subdirectory on disk. Below is the structural layout of a single isolated workspace:

```
/workspaces/
  ├── [workspace_id]/                 # Unique, sanitized UUID/slug (e.g., "aether-ai")
  │   ├── .all_in_one/                # Internal orchestrator metadata directory
  │   │   ├── config.yaml             # Workspace-specific configuration & secrets overrides
  │   │   ├── security_policy.json    # Workspace-specific command and file whitelists
  │   │   ├── database.sqlite         # Local episodic session logs & relationship graph
  │   │   └── vector_index/           # Isolated ChromaDB/Qdrant storage folder
  │   └── src/                        # Actual user project workspace files
  │       ├── ...
```

### Data Schema & Metadata Configuration

#### Workspace Metadata Structure (JSON Schema)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "WorkspaceMetadata",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "minLength": 1 },
    "description": { "type": "string" },
    "created_at": { "type": "string", "format": "date-time" },
    "last_accessed_at": { "type": "string", "format": "date-time" },
    "status": { "type": "string", "enum": ["active", "archived", "suspended"] },
    "storage_path": { "type": "string" },
    "tech_stack": {
      "type": "object",
      "properties": {
        "language": { "type": "string" },
        "framework": { "type": "string" },
        "database": { "type": "string" },
        "vector_db": { "type": "string" }
      },
      "required": ["language", "framework", "database", "vector_db"]
    }
  },
  "required": ["id", "name", "created_at", "status", "storage_path", "tech_stack"]
}
```

### Workspace Manager Interface
```python
from typing import Dict, Any, List
from abc import ABC, abstractmethod

class WorkspaceMetadata:
    id: str
    name: str
    description: str
    storage_path: str
    tech_stack: Dict[str, str]
    created_at: str
    status: str

class IWorkspaceManager(ABC):
    @abstractmethod
    def create_workspace(self, name: str, description: str, stack: Dict[str, str]) -> WorkspaceMetadata:
        """Provision a clean isolated workspace folder, database, and vector index."""
        pass

    @abstractmethod
    def load_workspace(self, workspace_id: str) -> WorkspaceMetadata:
        """Load and mount the workspace's SQLite file, vector indices, and config overrides."""
        pass

    @abstractmethod
    def archive_workspace(self, workspace_id: str) -> bool:
        """Gracefully close all connection pools and archive the directory."""
        pass

    @abstractmethod
    def list_workspaces(self) -> List[WorkspaceMetadata]:
        """Query and return active available workspaces."""
        pass
```

---

## 2. AI Provider Layer

The AI Provider Layer acts as a unified translation layer, abstracting external cloud LLM APIs (Gemini, OpenAI, Anthropic) and local offline runner servers (Ollama, vLLM, llama.cpp) into a standardized interface.

### Provider Class & Data Models

```python
from typing import Dict, Any, Generator, List, Optional
from dataclasses import dataclass
from enum import Enum

class Role(Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"

@dataclass
class Message:
    role: Role
    content: str
    name: Optional[str] = None

@dataclass
class CompletionParams:
    messages: List[Message]
    temperature: float = 0.2
    max_tokens: int = 4096
    response_format: Optional[str] = None  # e.g. "json_object"
    tools: Optional[List[Dict[str, Any]]] = None

@dataclass
class TokenUsage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float

@dataclass
class CompletionResponse:
    content: str
    model: str
    finish_reason: str
    usage: TokenUsage
```

### Standardized Provider Interface
```python
from abc import ABC, abstractmethod

class ILLMProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def generate_completion(self, params: CompletionParams) -> CompletionResponse:
        """Synchronously request a completed text payload or structured JSON response."""
        pass

    @abstractmethod
    def generate_stream(self, params: CompletionParams) -> Generator[str, None, None]:
        """Yield individual token chunks in real-time as they are emitted."""
        pass

    @abstractmethod
    def check_health(self) -> bool:
        """Verify network reachability or local API daemon status."""
        pass
```

---

## 3. AI Router

The AI Router evaluates task parameters and intelligently routes execution payloads to the absolute optimal LLM provider. This prevents unnecessary cloud spend by using local models for simple tasks, while deploying powerful models for complex architectural work.

### Multi-Objective Routing Logic
The AI Router applies a multi-objective scoring function over the following dimensions:
1. **Semantic Complexity**: Categorized via natural language classification into standard brackets (`triage`, `code_generation`, `syntactic_linting`, `summarization`, `reasoning`).
2. **Context Window Size**: Required context tokens vs. hardware limits.
3. **Budget Limit**: Allowed dollar cost per operation.
4. **Target Latency Constraints**: Interactive vs. background task threads.

```
                        [ Incoming Task ]
                                |
                   [ Analyze Task Complexity ]
                                |
               +----------------+----------------+
               |                                 |
         (Complexity < 3)                 (Complexity >= 3)
         (Local Ollama)               (Gemini Pro / Cloud)
               |                                 |
      [ Check Local VRAM ]             [ Check Network & Budget ]
         /            \                   /            \
    (Has VRAM)     (No VRAM)         (In Budget)   (Out of Budget)
       /                \                /                \
[ Local Mistral ]  [ Gemini Flash ]  [Gemini Pro]   [ Local Qwen Coder ]
```

### Router Model Profile Schema
```json
{
  "profiles": [
    {
      "model_id": "gemini-3.5-flash",
      "tier": "standard_cloud",
      "cost_per_1k_input": 0.000075,
      "cost_per_1k_output": 0.0003,
      "max_context": 1048576,
      "optimal_tasks": ["summarization", "triage", "routine_parsing"]
    },
    {
      "model_id": "gemini-3.1-pro-preview",
      "tier": "enterprise_cloud",
      "cost_per_1k_input": 0.00125,
      "cost_per_1k_output": 0.005,
      "max_context": 2097152,
      "optimal_tasks": ["reasoning", "complex_scaffolding", "vulnerability_audit"]
    },
    {
      "model_id": "ollama/qwen2.5-coder:7b",
      "tier": "local_hardware",
      "cost_per_1k_input": 0.0,
      "cost_per_1k_output": 0.0,
      "max_context": 32768,
      "optimal_tasks": ["code_generation", "syntactic_linting"]
    }
  ]
}
```

### Router Class Interface
```python
class IAIRouter(ABC):
    @abstractmethod
    def route_task(self, task_description: str, required_tokens: int, max_cost_limit: float) -> str:
        """Evaluates complexity and constraints to return the target LLM model_id (e.g. 'gemini-3.5-flash')."""
        pass

    @abstractmethod
    def register_model_profile(self, profile: Dict[str, Any]) -> None:
        """Register a new LLM model with pricing metrics and capabilities."""
        pass
```

---

## 4. Internal Event Bus

The Event Bus acts as the decoupled messaging backbone for ALL-IN-ONE. It supports reactive system actions, audit tracking, telemetry emissions, and cross-module synchronization using a publish/subscribe pattern.

### Event Bus Structure

```
                  +-----------------------+
                  |  Internal Event Bus   |
                  +-----------+-----------+
                              |
               +--------------+--------------+
               |                             |
     [ Publish: CommandExec ]       [ Publish: SecurityBlock ]
               |                             |
      +--------v--------+           +--------v--------+
      |  Audit Logger   |           |  System Alerts  |
      |   (Consumer)    |           |   (Consumer)    |
      +-----------------+           +-----------------+
```

### Event Struct, Subscriber, & EventBus Interfaces
```python
from time import time
import uuid

@dataclass
class Event:
    event_id: str
    correlation_id: str  # Critical for tracing parent-child execution logs
    event_type: str      # e.g., "sandbox:command_executed", "memory:indexed"
    source_module: str   # e.g., "terminal"
    timestamp: float
    payload: Dict[str, Any]

class IEventSubscriber(ABC):
    @property
    @abstractmethod
    def subscription_topics(self) -> List[str]:
        """Topics or wildcard patterns to subscribe to (e.g., ["sandbox:*", "kernel:error"])."""
        pass

    @abstractmethod
    def on_event(self, event: Event) -> None:
        """Callback invoked when a matching event is received."""
        pass

class IEventBus(ABC):
    @abstractmethod
    def publish(self, event_type: str, source: str, correlation_id: str, payload: Dict[str, Any]) -> None:
        """Synchronously or asynchronously broadcast an event to all subscribed handlers."""
        pass

    @abstractmethod
    def subscribe(self, subscriber: IEventSubscriber) -> None:
        """Register a module to start receiving events based on its subscription topics."""
        pass

    @abstractmethod
    def unsubscribe(self, subscriber: IEventSubscriber) -> None:
        """Deregister an active subscriber."""
        pass
```

---

## 5. Decision Engine

The Decision Engine is the executive control module. It handles high-level execution loops, coordinates recursive task planning, manages self-healing retry strategies, and presents interactive gating prompts to seek human consent before writing critical files or running unsafe operations.

### Task Graph and Self-Healing Flows

The core of the Decision Engine is a **Directed Acyclic Graph (DAG)** of tasks.

```
                    [ 1. Analyze Core Task ]
                                |
                    [ 2. Generate Plan DAG ]
                                |
                    [ 3. Loop: Execute Node ]
                                |
                      +---------+---------+
                      |                   |
               (Exec Success)       (Exec Failed)
                      |                   |
            [ Validation Check ]    [ Self-Heal Retry ]
                /           \             /           \
             (Pass)        (Fail)    (Under Max)    (Max Retries)
               /             \          /               \
       [ Next Node ]     [Re-Plan]  [Fix & Retry]    [Human Triage]
```

#### Self-Healing Retry Policy
* **Syntactic Lint Failures**: When a code linter fails, compile the error output, pipe it back into a localized "Self-Correction" prompt, and request a clean rewrite of the affected function.
* **Transient API / Network Failures**: Apply exponential backoff with jitter up to three attempts.
* **Logical Exceptions**: If a unit test fails, halt the graph execution, invoke the `IAIRouter` to select a high-reasoning model (e.g., `gemini-3.1-pro-preview`), analyze test traces, and re-generate a sub-branch of the DAG.

### Decision Engine Data Structures
```python
class TaskState(Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    HEALING = "healing"
    FAILED = "failed"

@dataclass
class DAGNode:
    node_id: str
    module_target: str       # e.g., "terminal", "github", "memory"
    action_type: str         # e.g., "run_test", "index_code_base"
    params: Dict[str, Any]
    dependencies: List[str]  # Parent node_ids
    state: TaskState
    retries_count: int = 0
    max_retries: int = 3
    output_cache: Optional[Dict[str, Any]] = None
```

### Executive Orchestration Loop Interface
```python
class IDecisionEngine(ABC):
    @abstractmethod
    def execute_plan(self, plan_dag: List[DAGNode], correlation_id: str) -> bool:
        """Top-level loop executing the dependency graph topologically, resolving parent outcomes to children inputs."""
        pass

    @abstractmethod
    def request_human_consent(self, action_description: str, safety_warning: Optional[str]) -> bool:
        """Pause the active execution thread and wait for a user confirmation signal (blocking socket)."""
        pass
```

---

## 6. Memory Architecture

ALL-IN-ONE operates a split-tier memory engine, utilizing SQLite for structured transactional state and database relationship graphs, alongside ChromaDB/Qdrant for semantic code indexing.

### Relational Schema (SQLite)

```
+------------------------------------+          +------------------------------------+
|            session_logs            |          |             graph_nodes            |
+------------------------------------+          +------------------------------------+
| id: TEXT (PK UUID)                 |          | node_id: TEXT (PK UUID)            |
| workspace_id: TEXT                 |          | workspace_id: TEXT                 |
| prompt: TEXT                       |          | name: TEXT (e.g. "SecurityManager")|
| response: TEXT                     |          | type: TEXT (e.g. "Class")          |
| timestamp: REAL                    |          | file_path: TEXT                    |
+------------------------------------+          +------------------------------------+
                  |                                               |
                  | 1                                             | 1
                  |                                               |
                  | *                                             | *
+------------------------------------+          +------------------------------------+
|             audit_trail            |          |            graph_edges             |
+------------------------------------+          +------------------------------------+
| audit_id: TEXT (PK)                |          | source_node_id: TEXT (FK)          |
| session_id: TEXT (FK)              |          | target_node_id: TEXT (FK)          |
| source_module: TEXT                |          | relation: TEXT (e.g. "DEPENDS_ON") |
| action_type: TEXT                  |          +------------------------------------+
| payload: TEXT (JSON)               |
| status: TEXT                       |
+------------------------------------+
```

### SQLite Core Table Definitions (DDL)
```sql
CREATE TABLE IF NOT EXISTS session_logs (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp REAL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id TEXT PRIMARY KEY,
    session_id TEXT,
    source_module TEXT NOT NULL,
    action_type TEXT NOT NULL,
    payload TEXT, -- Stored as compact JSON string
    status TEXT NOT NULL,
    timestamp REAL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(session_id) REFERENCES session_logs(id)
);

CREATE TABLE IF NOT EXISTS graph_nodes (
    node_id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    file_path TEXT
);

CREATE TABLE IF NOT EXISTS graph_edges (
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    relation TEXT NOT NULL,
    PRIMARY KEY (source_node_id, target_node_id, relation),
    FOREIGN KEY(source_node_id) REFERENCES graph_nodes(node_id),
    FOREIGN KEY(target_node_id) REFERENCES graph_nodes(node_id)
);
```

### Cognitive Memory Interface
```python
@dataclass
class SemanticRecord:
    id: str
    text_content: str
    metadata: Dict[str, Any]
    distance_score: float

class IMemoryManager(ABC):
    @abstractmethod
    def store_episode(self, workspace_id: str, prompt: str, response: str) -> str:
        """Insert structured conversation block into relational log tables."""
        pass

    @abstractmethod
    def store_code_vector(self, workspace_id: str, file_path: str, snippet: str, embeddings: List[float]) -> None:
        """Upsert embedded token strings directly into workspace's isolated vector store."""
        pass

    @abstractmethod
    def semantic_search(self, workspace_id: str, query_embedding: List[float], limit: int = 5) -> List[SemanticRecord]:
        """Perform cosine proximity index sweeps to pull relevant code snippets."""
        pass

    @abstractmethod
    def upsert_graph_dependency(self, workspace_id: str, src_name: str, dest_name: str, relation: str) -> None:
        """Store code-level relations inside the structural node graph."""
        pass
```

---

## 7. Plugin SDK

The Plugin SDK allows third-party developers to safely extend ALL-IN-ONE using secure sandboxes. Plugins are loaded dynamically, but operate within tight, declarative permission parameters defined in their manifests.

### Plugin Manifest Template (JSON Schema)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PluginManifest",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "version": { "type": "string" },
    "entry_point": { "type": "string" },
    "permissions": {
      "type": "object",
      "properties": {
        "network": { "type": "boolean" },
        "filesystem": { "type": "string", "enum": ["none", "workspace", "full"] },
        "allowed_binaries": { "type": "array", "items": { "type": "string" } },
        "external_domains": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["network", "filesystem"]
    }
  },
  "required": ["id", "name", "version", "entry_point", "permissions"]
}
```

### Plugin Base Class & Lifecycle Hooks
```python
@dataclass
class PluginContext:
    workspace_path: str
    event_bus: IEventBus
    logger: Any
    config: Dict[str, Any]

class IPlugin(ABC):
    @property
    @abstractmethod
    def manifest(self) -> Dict[str, Any]:
        """Returns the parsed static JSON manifest declarations."""
        pass

    @abstractmethod
    def on_load(self, context: PluginContext) -> bool:
        """Lifecycle hook: Invoked when plugin is loaded. Setup listeners and connections here."""
        pass

    @abstractmethod
    def on_unload(self) -> None:
        """Lifecycle hook: Invoked during system shutdown. Flush queues and close socket connections."""
        pass
```

---

## 8. Communication Flow

Below is the complete architectural trace tracking an executive instruction: 
> *"Build a voice memory system for Aether AI"*

### Request Execution Sequence Diagram
This diagram shows the system modules collaborating to decompose, route, validate, execute, and record the action.

```
 User         Kernel      Planner      Router     Security     Terminal      Memory     GitEngine
  │             │            │           │           │            │            │            │
  ├── Prompt ──>│            │           │           │            │            │            │
  │             ├── Plan ───>│           │           │            │            │            │
  │             │   Prompt   │           │           │            │            │            │
  │             │<── Return ─┤           │           │            │            │            │
  │             │   DAG-Tree │           │           │            │            │            │
  │             │            │           │           │            │            │            │
  │             │── Route Subtask ──────>│           │            │            │            │
  │             │   Complexity Score     │           │            │            │            │
  │             │<── Selected Model ─────┤           │            │            │            │
  │             │                                    │            │            │            │
  │             ├── Intercept Command Check ────────>│            │            │            │
  │             │   Verify against whitelist policy  │            │            │            │
  │             │<── Access Granted (OK) ────────────┤            │            │            │
  │             │                                                 │            │            │
  │             ├── Spawn Sandboxed Execution ───────────────────>│            │            │
  │             │<── Return Exit Code & CLI Logs ─────────────────┤            │            │
  │             │                                                              │            │
  │             ├── Index New Audio Code ─────────────────────────────────────>│            │
  │             │   Generate & Store Semantic Embeddings                       │            │
  │             │<── Embeddings Stored Successfully ───────────────────────────┤            │
  │             │                                                                           │
  │             ├── Stage, Commit, & Create PR ────────────────────────────────────────────>│
  │             │<── Return PR URL (Approved) ──────────────────────────────────────────────┤
  │             │                                                                           │
  │<── Result ──┤                                                                           │
```

---

## 9. Data Flow

This flowchart trace tracks how data circulates, is transformed, and is cached or written across the system's runtime memory boundaries.

```
                         [ USER PROMPT ]
                                |
                     ( String UTF-8 Payload )
                                |
                   [ Rec Planner Graph Parser ] <==== ( Read Existing Files )
                                |
                 [ JSON-Structured Plan DAG ]
                                |
                    [ Router Target Filter ] <======== ( Cost Profiles JSON )
                                |
             [ Abstract Unified Model Payload Struct ]
                                |
                +---------------+---------------+
                |                               |
       [ Local Ollama Socket ]        [ External Cloud API ]
                |                               |
       [ Output Generation ]          [ Output Generation ]
                |                               |
                +---------------+---------------+
                                |
                   [ Unified Response Format ]
                                |
                     +----------+----------+
                     |                     |
             (Write File Actions)    (Storage Actions)
                     |                     |
           [ Security Sandbox ]     [ Memory Manager ]
            /                \        /            \
        (Allow)            (Deny) [SQLite Log]  [ChromaDB]
          /                    \
    [ disk write ]       [ Terminal Crash ]
```

---

## 10. Scalability Guidelines

To guarantee high-throughput, low-latency execution inside local workspaces exceeding 100,000 lines of code, developers MUST apply the following design limits and performance paradigms:

### 1. Vector Database Index Tuning
* **Dynamic Code Splitting**: Do not embed massive files wholesale. Always apply an AST-aware split technique: chunk functions and classes with overlap boundaries (typically 500-1000 tokens with 10% sliding overlap margins).
* **Memory-Mapped Indexing**: Configure ChromaDB/Qdrant to use memory-mapped indexing (`MMap`) to avoid bloating host system RAM when indexing large projects.

### 2. Relational Database Performance
* **WAL Mode Engagement**: SQLite must be initialized with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`). This allows simultaneous readers to operate without blocking background file write queues.
* **Connection Pooling**: Restrict system threads to a max pool size of 5 concurrent database connections, employing strict 5-second lock acquisition timeouts.

### 3. Context Window Optimization
* **Incremental Prompting**: Avoid feeding entire repositories into LLM contexts. Use semantic search to fetch only the relevant class definitions, interfaces, and function headers, keeping target context windows under 16,000 tokens.
* **Caching Truncation**: Routinely prune older episodic logs in long chat sessions, compressing previous dialogue cycles into static memory summaries.

---

## 11. Design Decisions, Trade-offs & Risks

### Major System Trade-offs

| Decision | Selected Option | Rejected Option | Justification & Mitigations |
| :--- | :--- | :--- | :--- |
| **Local-First Database** | **SQLite WAL Mode** | **PostgreSQL** | *Justification*: Minimizes deployment friction; zero background daemon configuration needed for the end-user. *Mitigation*: Employs strict connection pooling to avoid locking writes on high-concurrency loops. |
| **Provider Abstraction** | **Unified Generic Wrappers** | **Raw Direct API Calls** | *Justification*: Allows swapping from expensive Cloud APIs to local Ollama runners instantly without refactoring application logic. *Mitigation*: Accept standard SDK features, handling specialized functions via conditional fallback routes. |
| **Security Execution** | **Whitelist Regex + Shell Gating** | **Docker Container Isolation** | *Justification*: Docker introduces extreme performance latency and setup hurdles on local developer laptops. *Mitigation*: Gating commands via strict whitelists and manual human consent windows. |

### Architectural Risks & Mitigation Strategies

1. **VRAM Exhaustion on Local Run (Risk: High)**:
   * *Problem*: Loading massive 32B code-generation models locally can crash developer rigs or exceed system VRAM.
   * *Mitigation*: AI Router must monitor system hardware profiles dynamically and cascade routing targets down to smaller 7B/8B quantized models, or fail gracefully back to lightweight Cloud API tiers.
2. **Infinite Healing Recursion Loops (Risk: Medium)**:
   * *Problem*: The self-healing loop keeps getting compilation errors and gets trapped trying to fix code in a loop, draining API budgets or freezing execution.
   * *Mitigation*: Enforce a strict maximum retry threshold (3 attempts per DAG node). If exceeded, pause and prompt the user for human manual intervention.
3. **Context Drift in Multi-Step DAGs (Risk: High)**:
   * *Problem*: A planning DAG has 15 steps. By step 10, the model forgets initial context constraints or uses obsolete class signatures generated at step 3.
   * *Mitigation*: Maintain a centralized "Active Workspace Context Map" updated by every completed step. Re-feed this updated schema definition at the top of every new step's prompt context.

---

## 12. Future Extension Points

The architecture provides explicit extension hooks to guarantee modular expansion:
* **Custom Tool Integrations**: Register tool hooks by implementing `IToolProvider` under `/all_in_one/tools/`, allowing automatic integration with custom terminal wrappers or cloud containers.
* **Cognitive Agent Plugins**: Plugins can subscribe to event streams via wildcards (e.g., `sandbox:*`), enabling custom security logs, third-party code review services, or continuous integration monitors to act synchronously.
* **Alternative Vector Stores**: The database layer is decoupled; swapping from ChromaDB to Pinecone, Milvus, or Redis requires simply rewriting a subclass of `IMemoryManager`.
