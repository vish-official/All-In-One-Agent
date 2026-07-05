import { StackOption, CoreModule, SecurityPolicy } from "./types";

export const STACK_OPTIONS: StackOption[] = [
  // Languages
  {
    id: "python",
    name: "Python (Highly Recommended for AI)",
    category: "language",
    description: "The gold standard for AI, machine learning, and orchestration with massive library support.",
    pros: ["Direct integration with PyTorch, HuggingFace, LangChain", "Rapid development speed", "Deep ecosystems for agentic workflows"],
    cons: ["Global Interpreter Lock (GIL) limits pure multi-threading performance", "Higher memory overhead compared to Rust/Go"],
    scalability: 5,
    security: 4,
  },
  {
    id: "typescript",
    name: "TypeScript (Excellent for Full-Stack & APIs)",
    category: "language",
    description: "Incredible for asynchronous microservices, browser automation, and rich full-stack web dashboards.",
    pros: ["Shared types between orchestrator backend and client dashboard", "Extremely fast asynchronous I/O and event loop", "Rich ecosystem of web scraping & browser automation tools"],
    cons: ["Slower math and raw numerical processing", "Less mature AI/ML ecosystem compared to Python"],
    scalability: 4,
    security: 4,
  },
  {
    id: "rust",
    name: "Rust (Uncompromising Security & Speed)",
    category: "language",
    description: "Ultimate memory safety, concurrency, and performance for critical kernel-level orchestration components.",
    pros: ["Unrivaled raw performance and low footprint", "Compiler-enforced thread-safety and memory protection", "Perfect for building local sandboxed virtual machines"],
    cons: ["Steep learning curve and slower initial development", "Fewer off-the-shelf high-level AI orchestration frameworks"],
    scalability: 5,
    security: 5,
  },

  // Frameworks
  {
    id: "fastapi",
    name: "FastAPI (Python Async API Server)",
    category: "framework",
    description: "High-performance async web framework built on ASGI standards with auto OpenAPI generation.",
    pros: ["Extremely fast (Go/Node.js levels of performance)", "Strong type checking via Pydantic v2", "Excellent dependency injection system"],
    cons: ["Requires understanding async/await concepts in Python", "Slightly more boilerplate than Flask"],
    scalability: 5,
    security: 4,
  },
  {
    id: "nestjs",
    name: "NestJS (TypeScript Enterprise Framework)",
    category: "framework",
    description: "Highly structured, modular, architecture-first framework with decorator-driven syntax.",
    pros: ["Enforces strict architectural boundaries", "Out-of-the-box support for Event-Driven and Microservices", "Powerful Dependency Injection container"],
    cons: ["High initial learning curve and steep abstraction level", "Heavy boilerplate for simple tools"],
    scalability: 5,
    security: 5,
  },

  // Databases
  {
    id: "sqlite",
    name: "SQLite with WAL Mode (Local-First Champion)",
    category: "database",
    description: "Zero-configuration, serverless relational database. Extremely reliable and embedded directly inside the application.",
    pros: ["Zero external process management or networking issues", "Single file storage simplifies back-ups and migrations", "Write-Ahead Logging (WAL) mode supports concurrent reads and writes"],
    cons: ["Not designed for high write-concurrency from multiple external instances", "Lacks some advanced enterprise clustering features"],
    scalability: 4,
    security: 5,
  },
  {
    id: "postgresql",
    name: "PostgreSQL with pgvector (Robust relational DB)",
    category: "database",
    description: "Enterprise-grade relational database with support for structured relational queries and vector indexing simultaneously.",
    pros: ["Standard SQL support with extreme reliability", "pgvector supports cosine/L2 distance search alongside structured relational schemas", "Durable clustering and advanced connection pooling"],
    cons: ["Requires running and managing a background daemon process", "Higher setup complexity for local-first systems"],
    scalability: 5,
    security: 4,
  },

  // Vector DBs
  {
    id: "chromadb",
    name: "ChromaDB (Embedded, Local-First)",
    category: "vectordb",
    description: "Open-source embedding database designed to be easily embedded inside Python/TypeScript services with zero friction.",
    pros: ["Extremely simple to initialize in-process", "Fast vector searches with auto-embedding generation support", "No external server requirement"],
    cons: ["Memory footprint can grow rapidly on large datasets", "Fewer advanced distributed clustering options"],
    scalability: 4,
    security: 4,
  },
  {
    id: "qdrant",
    name: "Qdrant (Ultra-Performant Rust-based Vector DB)",
    category: "vectordb",
    description: "High-performance vector database with filtering support, written in Rust. Run via Docker or standalone binary.",
    pros: ["Extremely fast indexing and search speeds", "Support for rich filtering on payload metadata alongside vector search", "Highly optimized memory and disk usage"],
    cons: ["Requires running a Docker container or separate server process", "More complex client-side setup"],
    scalability: 5,
    security: 5,
  },

  // Configuration systems
  {
    id: "yaml",
    name: "YAML with Pydantic/Zod schemas",
    category: "config",
    description: "Readable configuration with nested values, strictly validated against models at runtime startup.",
    pros: ["Human-readable and commentable format", "Strict validation prevents starting with broken credentials or invalid configurations", "Supports environment variable overrides"],
    cons: ["Indentation errors can occasionally cause syntax parsing failures"],
    scalability: 5,
    security: 5,
  },
  {
    id: "sqlite_config",
    name: "Dynamic Database-backed Config System",
    category: "config",
    description: "Store settings in database key-value tables with instant updates and reactive event notifications.",
    pros: ["No restarts required to apply config shifts", "Perfect for multi-agent dynamic parameter tuning", "Easy audit logs for config history"],
    cons: ["Slightly slower access speeds", "Requires a database read on parameter checks unless cached in-memory"],
    scalability: 5,
    security: 4,
  },

  // Loggers
  {
    id: "structlog",
    name: "Structured Logging (JSON Format + Console Pretty)",
    category: "logger",
    description: "Produce machine-readable JSON logs for system ingestion and beautiful terminal output for human debugging.",
    pros: ["Easily parsed by Elasticsearch, Loki, or OpenTelemetry", "Includes rich contextual metadata (correlation IDs, thread IDs, active modules)", "Optimized for async tracing"],
    cons: ["Requires custom formatting libraries for visual terminals"],
    scalability: 5,
    security: 5,
  }
];

export const CORE_MODULES: CoreModule[] = [
  {
    id: "core",
    name: "Core Orchestrator Kernel",
    responsibility: "The central nervous system of ALL-IN-ONE. Manages lifecycle, module coordination, and handles the direct state machine of running executions.",
    keyInterfaces: [
      "init_modules() -> Result",
      "execute_prompt(prompt: str) -> str",
      "shutdown_gracefully() -> None"
    ],
    dependencies: ["Configuration", "Logger", "Event Bus", "Planner", "Agent Manager"],
    diagramFlow: "User Prompt -> Kernel -> Configuration -> Planner"
  },
  {
    id: "router",
    name: "AI Intelligent Model Router",
    responsibility: "Analyzes task complexity, required tokens, and semantic scope, then intelligently maps the task to the most optimal AI provider (e.g., local Ollama, Gemini Pro, paid APIs).",
    keyInterfaces: [
      "route_task(task_description: str) -> ModelProfile",
      "get_cost_estimate(task: str, model: str) -> float"
    ],
    dependencies: ["Configuration", "Logger"],
    diagramFlow: "Subtask -> Router -> Model Selection (Local vs. API) -> AI Provider"
  },
  {
    id: "planner",
    name: "Recursive Hierarchical Planner",
    responsibility: "Breaks complex abstract instructions into a detailed tree of sequential and parallel tasks, estimating resource requirements and adding validation gates.",
    keyInterfaces: [
      "generate_plan(instruction: str) -> ExecutionPlan",
      "refine_plan(plan: ExecutionPlan, feedback: str) -> ExecutionPlan",
      "validate_step_outcome(step_id: str) -> bool"
    ],
    dependencies: ["Router", "Memory", "Logger"],
    diagramFlow: "Prompt -> Hierarchical Planner -> Directed Acyclic Graph (DAG) Plan -> Execution Queue"
  },
  {
    id: "memory",
    name: "Long-Term Cognitive Memory",
    responsibility: "A dual-tier memory system comprising local vector DB (semantic search) and local SQLite (episodic logs, short-term session state, entities, and relationships graph).",
    keyInterfaces: [
      "store_episodic_memory(session_id: str, episode: str, metadata: dict) -> None",
      "query_semantic_memory(query: str, limit: int) -> List[MemoryRecord]",
      "retrieve_project_context(project_name: str) -> ProjectMetadata"
    ],
    dependencies: ["Database", "Vector DB", "Logger"],
    diagramFlow: "Kernel/Agent -> Memory Read/Write -> SQLite SQL Query + Vector Distance Match"
  },
  {
    id: "providers",
    name: "Unified Model Provider Interface",
    responsibility: "Provides robust abstract connectors to external APIs (Gemini, OpenAI, Anthropic) and local runners (Ollama, vLLM, llama.cpp), standardizing inputs, outputs, and streaming chunks.",
    keyInterfaces: [
      "generate_completion(params: CompletionParams) -> CompletionResponse",
      "generate_stream(params: CompletionParams) -> Generator[Chunk]",
      "check_provider_health(provider_name: str) -> bool"
    ],
    dependencies: ["Configuration", "Logger"],
    diagramFlow: "Router/Kernel -> Provider Interface -> HTTP Client / Local socket -> Model Output"
  },
  {
    id: "browser",
    name: "Sandboxed Browser Automator",
    responsibility: "A secure, sandboxed web browser runner (Playwright/Puppeteer) for web search grounding, interactive logins, API-less scraping, and live visual testing.",
    keyInterfaces: [
      "launch_secure_browser(sandboxed: bool) -> BrowserInstance",
      "navigate_and_extract(url: str, selectors: List[str]) -> WebData",
      "take_page_screenshot(url: str) -> bytes"
    ],
    dependencies: ["Security Engine", "Configuration", "Logger"],
    diagramFlow: "Kernel -> Security Rule Check -> Playwright Browser -> Scraped text/screenshot"
  },
  {
    id: "terminal",
    name: "Sandboxed Terminal Executor",
    responsibility: "Executes local scripts, packages, and system commands inside a highly confined, audited, and isolated virtual environment, intercepting dangerous operations.",
    keyInterfaces: [
      "execute_command(command: str, timeout: int) -> CommandResult",
      "create_virtual_sandbox() -> SandboxID",
      "terminate_sandbox_process(pid: int) -> None"
    ],
    dependencies: ["Security Engine", "Logger"],
    diagramFlow: "Code Generator -> Security Validator -> Virtual Shell Process -> Output Stream"
  },
  {
    id: "github",
    name: "GitHub & Version Control Engine",
    responsibility: "Manages local git structures. Spawns branches, stages code changes, runs code linters/tests, commits, and pushes to remote repositories and submits Pull Requests.",
    keyInterfaces: [
      "clone_or_pull_repo(repo_url: str) -> Path",
      "create_feature_branch(branch_name: str) -> None",
      "commit_and_push_changes(files: List[str], message: str) -> PR_URL"
    ],
    dependencies: ["Configuration", "Terminal Executor", "Logger"],
    diagramFlow: "Reviewed Code -> Git Engine -> Git Diff -> Local Commit -> Push & PR"
  },
  {
    id: "security",
    name: "Kernel Security Guard & Sandbox",
    responsibility: "The foundational gatekeeper of ALL-IN-ONE. Validates every command, file write, network request, and browser redirect against a strict, user-configurable security profile.",
    keyInterfaces: [
      "validate_command_safety(command: str) -> SecurityConsent",
      "validate_file_path_safety(path: str, action: str) -> bool",
      "check_network_whitelist(domain: str) -> bool"
    ],
    dependencies: ["Configuration", "Logger"],
    diagramFlow: "Trigger Action -> Security Engine -> (Rule Match / Interactive Consent Prompt) -> Execution"
  },
  {
    id: "logger",
    name: "Audit Logger & Performance Tracer",
    responsibility: "Saves cryptographic, tamper-proof logs of every terminal command, AI prompt, model response, scraping action, and security decision to SQLite for instant dashboard audits.",
    keyInterfaces: [
      "log_system_event(level: str, module: str, message: str, payload: dict) -> None",
      "log_ai_turn(session_id: str, model: str, prompt_tokens: int, response_tokens: int) -> None",
      "get_audit_trail(limit: int) -> List[AuditRecord]"
    ],
    dependencies: ["Database"],
    diagramFlow: "Event Call -> Logger -> Stream to Console + Insert into SQLite Async Queue"
  }
];

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  allowedCommands: ["git status", "git diff", "git log", "git add", "git commit", "npm run lint", "npm run test", "python -m pytest", "pip install -r requirements.txt"],
  restrictedPaths: ["/etc", "/var/run", "~/.ssh", "~/.aws", "/bin", "/sbin"],
  allowedDomains: ["github.com", "api.github.com", "pypi.org", "npmjs.com", "api.openai.com", "generativelanguage.googleapis.com", "ollama.local"],
  maxExecutionTimeout: 60,
  autoApproveSafe: false
};

export const CODING_STANDARDS = {
  naming: [
    { rule: "Python Variables/Methods", example: "snake_case (e.g., execute_prompt, query_db)" },
    { rule: "Python Classes", example: "PascalCase (e.g., CoreOrchestrator, SecurityManager)" },
    { rule: "TypeScript Files", example: "kebab-case (e.g., security-policy-builder.tsx)" },
    { rule: "Environment Variables", example: "UPPER_SNAKE_CASE (e.g., GEMINI_API_KEY, LOCAL_DB_PATH)" }
  ],
  style: [
    { language: "Python", standard: "PEP 8 strict conformance, type hints mandatory, Black formatting, Flake8/Pylint checking." },
    { language: "TypeScript", standard: "ESLint standard rules, prettier enabled, strict mode active in tsconfig, absolute path imports (@/*)." },
    { language: "Logging", standard: "Never log raw user API keys or plaintext credentials. Always include correlations/request IDs." }
  ],
  testing: [
    { type: "Unit Tests", tools: "PyTest (Python) or Jest/Vitest (TypeScript). Every core module requires >90% code coverage." },
    { type: "Security Sandboxing Tests", tools: "Custom integration tests that deliberately attempt to run malicious code (e.g., 'rm -rf') to verify container/regex blockades." },
    { type: "Agent Replay Tests", tools: "VCR.py or cached API responses to replay agent decision sequences and check for deterministic planner outcomes." }
  ]
};

export const ROADMAP_MILESTONES = [
  {
    phase: "Milestone 1",
    title: "Kernel Foundation & Safety Vault",
    deliverables: [
      "YAML Config Parser with schema-strict checks",
      "Local SQLite SQLite db with schema setup",
      "Security sandboxed command checking engine",
      "Asynchronous structured log system"
    ],
    testStrategy: "Verify standard commands are logged, dangerous commands trigger an interactive terminal crash or blocking exception, config schema validation rejects empty api keys."
  },
  {
    phase: "Milestone 2",
    title: "Memory System & AI provider wrappers",
    deliverables: [
      "Unified Provider Interface connecting to Gemini API and local Ollama",
      "Episodic memory recorder storing sessions in SQLite",
      "ChromaDB embedded integration for indexing file code snippets",
      "Dual semantic retrieval algorithm"
    ],
    testStrategy: "Insert code snippet into Chroma, run a natural language query, and verify the model provider can fetch and summarize it correctly."
  },
  {
    phase: "Milestone 3",
    title: "The Brain: Hierarchical Planner & Router",
    deliverables: [
      "Router parsing task sizes and determining local vs server model",
      "Hierarchical Planner producing Directed Acyclic Graph (DAG) JSON structures from prompts",
      "State-machine executing step-by-step with checkpoints",
      "Agent execution manager"
    ],
    testStrategy: "Prompt 'create a complex file directory and test it'. Check if planner divides it into: mkdir -> write -> verify -> run-test."
  },
  {
    phase: "Milestone 4",
    title: "GitHub Engine & Sandboxed Shell Execution",
    deliverables: [
      "Git branch, push, PR automation module",
      "Sandboxed shell executor with custom virtualenv isolation",
      "Playwright local browser crawler for search grounding",
      "Full local terminal execution with telemetry"
    ],
    testStrategy: "Trigger scaffold prompt, check if a real local git branch is created, sandboxed linter runs successfully, and code is cleanly pushed."
  }
];

export const FOLDER_STRUCTURE = {
  name: "ALL-IN-ONE Root",
  type: "directory",
  description: "The complete project workspace designed to scale beyond 100,000 lines of code.",
  children: [
    {
      name: "all_in_one",
      type: "directory",
      description: "Primary application source module package.",
      children: [
        {
          name: "core",
          type: "directory",
          description: "Kernel core, system lifecycles, and main orchestration engine state machines.",
          children: [
            { name: "__init__.py", type: "file", description: "Exports core orchestrator hooks." },
            { name: "kernel.py", type: "file", description: "The main kernel loop executing tasks." },
            { name: "event_bus.py", type: "file", description: "Global messaging event broker." }
          ]
        },
        {
          name: "planner",
          type: "directory",
          description: "Hierarchical task partitioners, validation checkers, and task trees.",
          children: [
            { name: "engine.py", type: "file", description: "Planner class parsing abstract user queries." },
            { name: "dag.py", type: "file", description: "Direct Acyclic Graph model for step execution." }
          ]
        },
        {
          name: "security",
          type: "directory",
          description: "Security sandbox, command validators, file system locks, and user confirmation loops.",
          children: [
            { name: "sandbox.py", type: "file", description: "Spawns subprocesses securely." },
            { name: "policy.py", type: "file", description: "Loads and matches JSON policy templates." }
          ]
        },
        {
          name: "memory",
          type: "directory",
          description: "Multi-layered cognitive database, vector indexers, and SQL managers.",
          children: [
            { name: "vector.py", type: "file", description: "ChromaDB client connection & indexing rules." },
            { name: "sqlite.py", type: "file", description: "Local relational transactional session log tables." }
          ]
        },
        {
          name: "providers",
          type: "directory",
          description: "Model abstraction wrappers for local and external AI endpoints.",
          children: [
            { name: "base.py", type: "file", description: "Abstract Base Class for LLM providers." },
            { name: "gemini_sdk.py", type: "file", description: "Google GenAI SDK adapter." },
            { name: "ollama_local.py", type: "file", description: "Local model running via raw Ollama API." }
          ]
        },
        {
          name: "tools",
          type: "directory",
          description: "System interface libraries: Browser scraper, local terminal, GitHub connector.",
          children: [
            { name: "terminal.py", type: "file", description: "Interactive shell manager." },
            { name: "browser.py", type: "file", description: "Playwright-based crawler." },
            { name: "github_client.py", type: "file", description: "Wraps PyGithub commits and PR creation." }
          ]
        },
        {
          name: "config",
          type: "directory",
          description: "Schema model checkers and environmental settings.",
          children: [
            { name: "settings.py", type: "file", description: "PydanticSettings validation models." }
          ]
        },
        {
          name: "utils",
          type: "directory",
          description: "Cross-cutting utilities (structured logging, tracers, async timing).",
          children: [
            { name: "logger.py", type: "file", description: "Configures structlog formatters." }
          ]
        }
      ]
    },
    {
      name: "tests",
      type: "directory",
      description: "Test coverage suites mirroring application directories.",
      children: [
        { name: "conftest.py", type: "file", description: "Pre-configures test DB setups & sandboxes." },
        { name: "test_security.py", type: "file", description: "Confirms dangerous operations are caught." },
        { name: "test_planner.py", type: "file", description: "Asserts query breaks down into logical DAG blocks." }
      ]
    },
    { name: "config.example.yaml", type: "file", description: "Main default configuration template." },
    { name: "security_policy.example.json", type: "file", description: "Main security whitelist schema." },
    { name: "requirements.txt", type: "file", description: "Primary direct dependencies list." },
    { name: "README.md", type: "file", description: "High-level overview & local boot documentation." }
  ]
};
