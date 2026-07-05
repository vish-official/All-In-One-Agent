import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Terminal as TerminalIcon,
  Cpu,
  FolderGit2,
  Settings,
  Activity,
  Database,
  BookOpen,
  Sparkles,
  Send,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Plus,
  Trash,
  Play,
  FileText,
  RefreshCw,
  Lock,
  Unlock,
  Layers,
  Code,
  ListTodo,
  ExternalLink,
  ChevronDown,
  Network,
  Server,
  Zap,
  Coins,
  ShieldAlert,
  Shuffle,
  History
} from "lucide-react";
import { STACK_OPTIONS, CORE_MODULES, DEFAULT_SECURITY_POLICY, CODING_STANDARDS, ROADMAP_MILESTONES, FOLDER_STRUCTURE } from "./data";
import { StackOption, SecurityPolicy, CoreModule, SimStep, IEvent, IEventSubscriber } from "./types";
import { AICapability, ProviderStatus, AuthMethod } from "./providerTypes";
import { ProviderRegistry } from "./providerManager";
import { ContextManager } from "./contextManager";
import { ContextSourceType, IContextItem, IContextPackage, ContextMetrics, ContextItemConfidence } from "./contextTypes";
import { IntentAnalyzer } from "./intentAnalyzer";
import { IntentCategory, TaskComplexity, WorkflowRecommendation, CoreCapabilityRequirement, IIntentPackage, IntentMetrics } from "./intentTypes";
import { Planner } from "./planner";
import { TaskStatus, PlanningStrategyType, ITask, IRisk, IPlanningPackage, PlannerMetrics } from "./plannerTypes";
import { Router } from "./router";
import { JobStatus, RoutingStrategyType, CollaborationModel, IJob, IRoutingPackage, RouterMetrics } from "./routerTypes";
import { DecisionEngine } from "./decisionEngine";
import { DecisionStrategyType, IProposal, IConflict, IAgreement, IDecisionPackage, DecisionMetrics } from "./decisionTypes";


const BLUEPRINT_SECTIONS = [
  {
    title: "1. Workspace System",
    description: "Isolated directory sandboxes, metadata parameters, file locks, dynamic local config files.",
    diagram: `/workspaces/\n  ├── [workspace_id]/         # Unique sanitized UUID/Slug\n  │   ├── .all_in_one/        # Internal state & configuration\n  │   │   ├── config.yaml     # Local secrets & options\n  │   │   ├── database.sqlite # Episodic logs & relationships graph\n  │   │   └── vector_index/   # ChromaDB/Qdrant directories\n  │   └── src/                # Sandboxed user code workspace`,
    schema: `{\n  "id": "uuid (primary_key)",\n  "name": "string (e.g., Aether AI)",\n  "storage_path": "string",\n  "tech_stack": {\n    "language": "string",\n    "framework": "string",\n    "database": "string",\n    "vector_db": "string"\n  }\n}`,
    interfaces: [
      "create_workspace(name: str, desc: str, stack: dict) -> Metadata",
      "load_workspace(workspace_id: str) -> Metadata",
      "archive_workspace(workspace_id: str) -> bool",
      "list_workspaces() -> List[Metadata]"
    ]
  },
  {
    title: "2. AI Provider Layer",
    description: "Unified adapters for external Cloud APIs (Gemini SDK) and local LLM runners (Ollama, vLLM).",
    diagram: `Router / Kernel\n     │\n     └──> [Unified Provider Interface]\n               ├── Gemini SDK (Cloud Mode)\n               ├── OpenAI Client (Cloud Mode)\n               └── Ollama Runner (Local Socket Connection)`,
    schema: `class Message:\n    role: "system" | "user" | "assistant" | "tool"\n    content: str\n\nclass CompletionResponse:\n    content: str\n    model: str\n    usage: TokenUsage`,
    interfaces: [
      "generate_completion(params: CompletionParams) -> CompletionResponse",
      "generate_stream(params: CompletionParams) -> Generator[str]",
      "check_health(provider_name: str) -> bool"
    ]
  },
  {
    title: "3. AI Router",
    description: "Evaluates task complexity, required tokens, and costs to route prompts to optimal backends.",
    diagram: `Task Prompt\n     │\n     ├──> [Evaluate Complexity]\n     │         ├── Routine Tasks (Score < 3) ──> Local Qwen Coder\n     │         └── Complex Reason (Score >= 3) ─> Gemini 3.1 Pro\n     └───────────────────────────────────────────────────────┘`,
    schema: `{\n  "profiles": [\n    { "model_id": "gemini-3.5-flash", "tier": "cloud", "cost_per_1k_input": 0.000075 },\n    { "model_id": "gemini-3.1-pro-preview", "tier": "cloud", "cost_per_1k_input": 0.00125 },\n    { "model_id": "ollama/qwen:7b", "tier": "local", "cost_per_1k_input": 0.0 }\n  ]\n}`,
    interfaces: [
      "route_task(task: str, tokens: int, budget: float) -> str",
      "register_model_profile(profile: dict) -> None"
    ]
  },
  {
    title: "4. Internal Event Bus",
    description: "Decoupled publish/subscribe reactive messaging broker with correlation tracking.",
    diagram: `Kernel ──> [Publish Event] ──> [Event Bus]\n                                     │\n               ┌─────────────────────┴─────────────────────┐\n               ▼                                           ▼\n      [Audit Logger Module]                      [Security Interceptor]`,
    schema: `class Event:\n    event_id: str (UUID)\n    correlation_id: str (Parent-Child Tracing ID)\n    event_type: str (e.g., "sandbox:command_executed")\n    source_module: str\n    timestamp: float\n    payload: dict`,
    interfaces: [
      "publish(event_type: str, source: str, correlation_id: str, payload: dict) -> None",
      "subscribe(subscriber: IEventSubscriber) -> None",
      "unsubscribe(subscriber: IEventSubscriber) -> None"
    ]
  },
  {
    title: "5. Decision Engine",
    description: "Topological graph execution, self-healing validation gates, and interactive human consent prompts.",
    diagram: `Task DAG Graph\n     │\n     └──> Execute Node\n               ├── Success ──> Execute Children Nodes\n               └── Failure ──> [Self-Healing Optimizer] ──> Retry / User Consent`,
    schema: `class DAGNode:\n    node_id: str\n    action_type: str\n    dependencies: List[str]\n    state: "pending" | "running" | "success" | "failed"\n    retries: int (max 3)`,
    interfaces: [
      "execute_plan(plan_dag: List[DAGNode], correlation_id: str) -> bool",
      "request_human_consent(action_description: str, warning: str) -> bool"
    ]
  },
  {
    title: "6. Memory Architecture",
    description: "Dual-tier cache: episodic logs and relations graph in SQLite, raw source code chunks in ChromaDB.",
    diagram: `Cognitive Core\n     ├── Relational SQLite: Conversations & Dependency Entity relations\n     └── Semantic ChromaDB: High-dimensional similarity vector index`,
    schema: `CREATE TABLE session_logs (\n    id TEXT PRIMARY KEY,\n    workspace_id TEXT,\n    prompt TEXT,\n    response TEXT,\n    timestamp REAL\n);\nCREATE TABLE graph_edges (\n    source TEXT (Class/File),\n    target TEXT (Class/File),\n    relation TEXT (e.g. "DEPENDS_ON")\n);`,
    interfaces: [
      "store_episode(workspace_id, prompt, response) -> id",
      "store_code_vector(workspace_id, file_path, snippet, embeddings) -> None",
      "semantic_search(workspace_id, query_embedding, limit) -> List[Record]"
    ]
  },
  {
    title: "7. Plugin SDK",
    description: "Declarative manifests, sandboxed runtime lifecycles, and capability whitelists.",
    diagram: `Core Engine\n   ├── Loader ──> Read Manifest ──> Inspect Sandbox Boundaries\n   └── Execute plugin.on_load() inside restricted container scope`,
    schema: `{\n  "id": "git_extension_plugin",\n  "version": "1.0.0",\n  "permissions": {\n    "network": false,\n    "filesystem": "workspace"\n  }\n}`,
    interfaces: [
      "on_load(context: PluginContext) -> bool",
      "on_unload() -> None"
    ]
  },
  {
    title: "8. Communication Flow",
    description: "Visual trace tracking a complex prompt ('Build a voice memory system for Aether AI') across modules.",
    diagram: `User ── Prompt ──> Kernel\n                   ├── Plan ──> Planner ── DAG ──>\n                   ├── Route ──> Router ── Model ──>\n                   ├── Verify ──> Security Guard (OK)\n                   ├── Run ──> Sandboxed Terminal\n                   └── Log ──> Memory & Git Commit`,
    schema: `Trace Sequence:\n  - User prompt parsed into execution DAG-Tree\n  - Model Router selects Gemini 3.1 Pro\n  - Security Sandbox intercepts and authorizes git/python scripts\n  - Code executed, files indexed, branch pushed & PR created`,
    interfaces: [
      "Trace Correlation ID: tracking_uuid_v4",
      "Event Logging level: SYS / SECURE / INFO / WARN"
    ]
  },
  {
    title: "9. Data Flow",
    description: "Flow tracing inputs, serialized telemetry, transformations, and long-term storage boundaries.",
    diagram: `[User Prompt] ──> [Planner DAG] ──> [Router Model Request]\n                                                │\n  ┌─────────────────────────────────────────────┘\n  ▼\n[Unified API response] ──> [Security Sandbox Checker]\n                                 ├── [Allow] ──> [File System Write]\n                                 └── [Deny] ───> [Exception abort]`,
    schema: `Input Data: Plain Text Prompt (UTF-8)\nExecution Data: Serialized DAG Nodes (JSON)\nStorage Data: Structured records (SQL) + Dense vectors (float32[])`,
    interfaces: [
      "State-Machine: Event -> Action -> Outcome Cache"
    ]
  },
  {
    title: "10. Scalability Guidelines",
    description: "High-density files indexing, connection pools, and memory-mapped embedding searches.",
    diagram: `Scalability Tactics:\n  - WAL mode enabled on SQLite (Concurrent read-write safety)\n  - Memory-Mapped Indexing (MMap) for low-overhead local files sweeps\n  - Sliding context window capping chat contexts under 16K tokens`,
    schema: `Target metrics:\n  - Target file index capacity: >100,000 Lines of Code\n  - SQL connection pool limit: 5 concurrent threads\n  - Embedding chunk size: 500-1000 tokens (10% sliding overlap)`,
    interfaces: [
      "AST-Aware chunk split algorithm",
      "Cache eviction policy: Least Recently Used (LRU) session blocks"
    ]
  },
  {
    title: "11. Decisions & Trade-offs",
    description: "Selected architectural decisions, rejected alternatives, risks, and mitigations.",
    diagram: `SQLite vs Postgres ──> Selected SQLite for zero-config embedded ease\nWhitelist Gating  ──> Selected Shell gates for low overhead local performance\nSelf-Healing Engine ─> Strict 3x retry limit to block infinite budget loops`,
    schema: `Risks monitored:\n  - VRAM exhaustion on local models\n  - Infinite recursive healing prompts\n  - Context drift on large multi-step DAG actions`,
    interfaces: [
      "Self-Healing max_retry threshold: 3",
      "Fallback fallback_to_cloud setting: True"
    ]
  }
];

export default function App() {
  // Navigation / Tab States
  const [activeTab, setActiveTab] = useState<"modules" | "explorer" | "blueprint" | "standards">("modules");
  const [selectedBlueprintSection, setSelectedBlueprintSection] = useState<number>(0);
  const [centerView, setCenterView] = useState<"flow" | "kernel" | "consultation" | "providers" | "context" | "intent" | "planner" | "router" | "decision">("flow");
  const [rightTab, setRightTab] = useState<"stack" | "security">("stack");

  // Kernel Lifecycle Control States
  const [kernelBootState, setKernelBootState] = useState<"uninitialized" | "booting" | "running" | "shutting_down" | "crashed" | "rollback_active">("uninitialized");
  const [activeBootStep, setActiveBootStep] = useState<number>(-1);
  const [bootFailSimulationModule, setBootFailSimulationModule] = useState<"none" | "config" | "security" | "memory">("none");
  const [kernelLogs, setKernelLogs] = useState<string[]>([
    "[SYSTEM] Kernel Service Registry waiting for boot trigger...",
    "[SYSTEM] Ready to simulate linear sequences."
  ]);
  const [kernelUptime, setKernelUptime] = useState<number>(0);
  const [eventsProcessed, setEventsProcessed] = useState<number>(0);
  const [activeWorkspaceCount, setActiveWorkspaceCount] = useState<number>(0);
  const [loadedPluginsCount, setLoadedPluginsCount] = useState<number>(0);
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [memUsage, setMemUsage] = useState<number>(0);

  // Selection States
  const [selectedModule, setSelectedModule] = useState<CoreModule>(CORE_MODULES[0]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "ALL-IN-ONE Root": true,
    "all_in_one": true,
  });

  // Technology Stack Selection State
  const [selectedStackIds, setSelectedStackIds] = useState<string[]>([
    "python",
    "fastapi",
    "sqlite",
    "chromadb",
    "yaml",
    "structlog"
  ]);

  // Security Policy State
  const [policy, setPolicy] = useState<SecurityPolicy>({ ...DEFAULT_SECURITY_POLICY });
  const [newCommand, setNewCommand] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newPath, setNewPath] = useState("");

  // Sandbox Command Execution Simulator State
  const [simCommand, setSimCommand] = useState("git status");
  const [simLogs, setSimLogs] = useState<SimStep[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // AI Architect Consultation Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant" | "system"; content: string }>>([
    {
      role: "assistant",
      content: `Hello! I am your Principal AI Software Architect. 

I've loaded the ALL-IN-ONE Foundation blueprint. You can select your desired runtime stack (Python, TS, Rust), configure sandboxed security whitelist parameters, examine the recursive planner modular DAGs, or ask me questions.

What architectural challenges or component design choices would you like to review first?`
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // System Event Logger state
  const [systemLogs, setSystemLogs] = useState<Array<{ timestamp: string; level: "INFO" | "SECURE" | "WARN" | "SYS"; module: string; message: string }>>([
    { timestamp: "01:18:47", level: "SYS", module: "KERNEL", message: "ALL-IN-ONE Core Architecture system initialized." },
    { timestamp: "01:18:48", level: "INFO", module: "CONFIG", message: "Loading default configuration schema (YAML)." },
    { timestamp: "01:18:48", level: "SECURE", module: "SECURITY", message: "Initializing local execution sandbox environment." },
    { timestamp: "01:18:49", level: "INFO", module: "MEMORY", message: "Checking SQLite local-first cache and vector memory indexes." }
  ]);

  // Event Bus State & Simulator
  const [kernelConsoleTab, setKernelConsoleTab] = useState<"lifecycle" | "eventbus">("lifecycle");
  const [ebEvents, setEbEvents] = useState<IEvent[]>([
    {
      event_id: "e9381c81-8990-4c9f-9c62-373950618e1a",
      event_type: "system:boot",
      source_module: "kernel",
      timestamp: Date.now() - 3600000 * 2,
      workspace_id: "ws-aether-dev",
      correlation_id: "00000000-0000-0000-0000-000000000000",
      priority: 10,
      payload: { version: "1.0.0-alpha", state: "booting" },
      metadata: { environment: "development", user_email: "funvishbrother25@gmail.com" }
    },
    {
      event_id: "f8391d82-8990-4c9f-9c62-373950618e1b",
      event_type: "security:verify_signature",
      source_module: "security",
      timestamp: Date.now() - 1800000,
      workspace_id: "ws-aether-dev",
      correlation_id: "c772bba1-8990-4c9f-9c62-373950618e1f",
      priority: 25,
      payload: { component: "PluginSDK", hash: "sha256:d83b2a" },
      metadata: { environment: "development", user_email: "funvishbrother25@gmail.com" }
    },
    {
      event_id: "d772cba2-8990-4c9f-9c62-373950618e1c",
      event_type: "workspace:create",
      source_module: "workspace",
      timestamp: Date.now() - 900000,
      workspace_id: "ws-aether-dev",
      correlation_id: "c772bba1-8990-4c9f-9c62-373950618e1f",
      priority: 50,
      payload: { name: "Aether Dev Sandbox", path: "/workspaces/ws-aether-dev" },
      metadata: { environment: "development", user_email: "funvishbrother25@gmail.com" }
    }
  ]);
  const [ebEventCategory, setEbEventCategory] = useState<string>("security");
  const [ebEventType, setEbEventType] = useState<string>("security:block_command");
  const [ebEventPriority, setEbEventPriority] = useState<number>(50);
  const [ebEventPayload, setEbEventPayload] = useState<string>('{\n  "command": "rm -rf /",\n  "reason": "Dangerous recursive path delete detected",\n  "policy_violation": true\n}');
  const [ebSimulateSubscriberError, setEbSimulateSubscriberError] = useState<boolean>(false);
  const [ebDispatchLogs, setEbDispatchLogs] = useState<string[]>([
    "[SYSTEM] Event Bus active on broker socket.",
    "[SYSTEM] Enqueued subscribers: [Audit Logger: P90], [Security Inspector: P10], [Slack Notifier: P50]"
  ]);
  const [ebIsDispatching, setEbIsDispatching] = useState<boolean>(false);
  const [ebActiveSubscribersCount, setEbActiveSubscribersCount] = useState<number>(5);
  const [selectedEbEvent, setSelectedEbEvent] = useState<IEvent | null>(null);
  const [ebMetrics, setEbMetrics] = useState({
    published: 3,
    failed: 0,
    latencyAvg: 1.2
  });

  // AI Provider Manager States
  const [providers, setProviders] = useState(() => ProviderRegistry.getInstance().listProviders());
  const [selectedProviderId, setSelectedProviderId] = useState<string>("gemini");
  const [capabilityFilter, setCapabilityFilter] = useState<string>("All");
  
  // Resilient Execution Simulator states
  const [simulationPrompt, setSimulationPrompt] = useState("Draft an optimized AST tree parser matching SOLID criteria");
  const [requiredCaps, setRequiredCaps] = useState<AICapability[]>([AICapability.Coding, AICapability.StructuredOutput]);
  const [providerSimLogs, setProviderSimLogs] = useState<string[]>([
    "[READY] Intelligent Orchestrator Idle. Awaiting pipeline instruction.",
    "[CONFIG] Isolating session variables for default workspace 'ws-aether-dev'."
  ]);
  const [providerSimResult, setProviderSimResult] = useState("");
  const [isSimulatingBroker, setIsSimulatingBroker] = useState(false);
  const [simPreference, setSimPreference] = useState<"none" | "offline" | "cost">("none");
  const [simulateOutages, setSimulateOutages] = useState<boolean>(false);

  // Context Manager states
  const [contextQuery, setContextQuery] = useState("Explain how the decentralized event bus guarantees transaction isolation");
  const [compressSemantic, setCompressSemantic] = useState(true);
  const [contextManagerLogs, setContextManagerLogs] = useState<string[]>([
    "[READY] Context Manager Pipeline idle. Sourced 8 information providers.",
    "[INFO] Cache temperature: COLD. Expiry TTL: 60s."
  ]);
  const [contextPackageResult, setContextPackageResult] = useState<IContextPackage | null>(null);
  const [isBuildingContext, setIsBuildingContext] = useState(false);
  const [contextMetrics, setContextMetrics] = useState<ContextMetrics>(() => ContextManager.getInstance().getMetrics());
  const [contextProviders, setContextProviders] = useState(() => ContextManager.getInstance().listProviders());

  // Intent Analyzer states
  const [intentInput, setIntentInput] = useState("We need to write a secure auth middleware with JWT tokens and high performance");
  const [isAnalyzingIntent, setIsAnalyzingIntent] = useState(false);
  const [intentPackageResult, setIntentPackageResult] = useState<IIntentPackage | null>(null);
  const [intentAnalyzerLogs, setIntentAnalyzerLogs] = useState<string[]>([
    "[READY] Intent Analyzer Gateway idle. Monitoring status: ON.",
    "[INFO] Threshold set to 65% confidence. Listening for user intent prompts."
  ]);
  const [intentMetrics, setIntentMetrics] = useState<IntentMetrics>(() => IntentAnalyzer.getInstance().getMetrics());

  // Planner states
  const [selectedPlanningStrategy, setSelectedPlanningStrategy] = useState<PlanningStrategyType>(PlanningStrategyType.FeatureDevelopment);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningPackageResult, setPlanningPackageResult] = useState<IPlanningPackage | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<ITask | null>(null);
  const [plannerLogs, setPlannerLogs] = useState<string[]>([
    "[READY] Planner PM Daemon idle. Awaiting Intent Package trigger...",
    "[INFO] Ready to decompose complex software requirements into parallelizable DAG tasks."
  ]);
  const [plannerMetrics, setPlannerMetrics] = useState<PlannerMetrics>(() => Planner.getInstance().getMetrics());

  // Router states
  const [selectedRoutingStrategy, setSelectedRoutingStrategy] = useState<RoutingStrategyType>(RoutingStrategyType.BALANCED);
  const [isRouting, setIsRouting] = useState(false);
  const [routingPackageResult, setRoutingPackageResult] = useState<IRoutingPackage | null>(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState<IJob | null>(null);
  const [routerLogs, setRouterLogs] = useState<string[]>([
    "[READY] Intelligent Router active.",
    "[INFO] Ready to match task capabilities to providers and schedule execution pipelines."
  ]);
  const [routerMetrics, setRouterMetrics] = useState<RouterMetrics>(() => Router.getInstance().getMetrics());

  // Decision Engine states
  const [selectedDecisionStrategy, setSelectedDecisionStrategy] = useState<DecisionStrategyType>(DecisionStrategyType.SECURITY_FIRST);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [candidateProposals, setCandidateProposals] = useState<IProposal[]>(() => 
    DecisionEngine.getInstance().generateCandidateProposalsForPlan("ws-default-plan")
  );
  const [decisionPackageResult, setDecisionPackageResult] = useState<IDecisionPackage | null>(null);
  const [selectedProposalDetail, setSelectedProposalDetail] = useState<IProposal | null>(null);
  const [selectedConflictDetail, setSelectedConflictDetail] = useState<IConflict | null>(null);
  const [decisionLogs, setDecisionLogs] = useState<string[]>([
    "[READY] Decision Engine active.",
    "[INFO] Ready to weigh competing solutions, score metrics, and resolve architectural conflicts."
  ]);
  const [decisionMetrics, setDecisionMetrics] = useState<DecisionMetrics>(() => 
    DecisionEngine.getInstance().getMetrics()
  );


  // Registration of custom provider
  const [newProvName, setNewProvName] = useState("");
  const [newProvType, setNewProvType] = useState<ContextSourceType>(ContextSourceType.CODE);
  const [newProvContent, setNewProvContent] = useState("");


  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Kernel Telemetry Simulator
  useEffect(() => {
    if (kernelBootState !== "running") {
      setCpuUsage(0);
      setMemUsage(0);
      return;
    }

    const interval = setInterval(() => {
      setKernelUptime(prev => prev + 1);
      setEventsProcessed(prev => prev + Math.floor(Math.random() * 5) + 1);
      setCpuUsage(Math.floor(Math.random() * 15) + 5); // 5% - 20%
      setMemUsage(Math.floor(Math.random() * 2) + 42); // 42MB - 44MB
    }, 1000);

    return () => clearInterval(interval);
  }, [kernelBootState]);

  const handleExecuteBrokerSimulation = async () => {
    if (isSimulatingBroker) return;
    setIsSimulatingBroker(true);
    setProviderSimResult("");
    
    const timeStr = new Date().toLocaleTimeString();
    const newLogs = [
      `[${timeStr}] [ROUTING] Evaluating candidates for capabilities: [${requiredCaps.join(", ")}]`,
      simPreference !== "none" ? `[${timeStr}] [PREFERENCE] Applying optimization metric: '${simPreference}'` : `[${timeStr}] [ROUTING] Applying default reliability weightings.`
    ];
    setProviderSimLogs(newLogs);

    await new Promise(r => setTimeout(r, 600));

    try {
      const registry = ProviderRegistry.getInstance();
      
      if (simulateOutages) {
        newLogs.push(`[${new Date().toLocaleTimeString()}] [SIMULATION] Network Outages active! Primary routed service will fail to trigger Circuit Breakers.`);
        
        // Find primary route
        const route = registry.route(requiredCaps, {
          preferOffline: simPreference === "offline",
          preferLowestCost: simPreference === "cost"
        });
        
        newLogs.push(`[${new Date().toLocaleTimeString()}] [ROUTING] Route resolved: Provider '${route.provider.name}' Model '${route.model.name}'`);
        newLogs.push(`[${new Date().toLocaleTimeString()}] [ATTEMPT 1] Initiating stream socket client handshake to '${route.provider.name}' on port 443.`);
        await new Promise(r => setTimeout(r, 800));
        
        newLogs.push(`[${new Date().toLocaleTimeString()}] [TIMEOUT] Network timeout reached on '${route.provider.name}' after 2500ms.`);
        newLogs.push(`[${new Date().toLocaleTimeString()}] [CIRCUIT] Recording failure for '${route.provider.name}'. Outage threshold reached.`);
        
        // Temporarily change status in state
        const updatedProvs = providers.map(p => {
          if (p.id === route.provider.id) {
            return {
              ...p,
              status: ProviderStatus.ERROR_COOLDOWN,
              metrics: {
                ...p.metrics,
                errorRate: 100,
                availability: 0,
                reliabilityScore: 0
              }
            };
          }
          return p;
        });
        setProviders(updatedProvs);
        
        newLogs.push(`[${new Date().toLocaleTimeString()}] [FAILOVER] Primary route severed. Circuit Breaker tripped to OPEN for provider '${route.provider.id}'!`);
        newLogs.push(`[${new Date().toLocaleTimeString()}] [ROUTING] Re-evaluating available capability pool...`);
        await new Promise(r => setTimeout(r, 600));

        // Fallback search
        const fallbackCandidates = updatedProvs.filter(p => p.id !== route.provider.id && p.status === ProviderStatus.ENABLED);
        if (fallbackCandidates.length > 0) {
          const fallback = fallbackCandidates[0];
          const model = fallback.supportedModels[0];
          newLogs.push(`[${new Date().toLocaleTimeString()}] [FAILOVER] Rerouted to fallback pool member: Provider '${fallback.name}' Model '${model.name}'.`);
          newLogs.push(`[${new Date().toLocaleTimeString()}] [ATTEMPT 2] Stream socket client handshake succeeded on '${fallback.name}'.`);
          await new Promise(r => setTimeout(r, 500));
          
          let responseText = "";
          if (fallback.id === "gemini") {
            try {
              const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: [{ role: "user", content: simulationPrompt }],
                  selectedStack: ["all-in-one"],
                  systemRules: ["You are a resilient helper AI."]
                })
              });
              if (res.ok) {
                const data = await res.json();
                responseText = data.content;
              } else {
                throw new Error("Local fallback endpoint offline");
              }
            } catch {
              responseText = `[Real-Time Fallback to Gemini] I have compiled the AST parsing module cleanly offline. The event-driven architecture successfully self-healed after the primary channel outage.`;
            }
          } else {
            responseText = `[Fallback Response from ${fallback.name}] Executed request successfully under graceful degradation rules. Output written to local-first cache.`;
          }

          newLogs.push(`[${new Date().toLocaleTimeString()}] [SUCCESS] GRACEFUL RECOVERY: Failover routed output fetched from '${fallback.name}' in 340ms.`);
          setProviderSimLogs([...newLogs]);
          setProviderSimResult(responseText);
          addSystemLog("SYS", "ROUTER", `Failover recovery completed successfully. Rerouted from ${route.provider.name} to ${fallback.name}.`);
        } else {
          throw new Error("No secondary failover providers available in capabilities registry!");
        }

      } else {
        // Normal execution path
        const route = registry.route(requiredCaps, {
          preferOffline: simPreference === "offline",
          preferLowestCost: simPreference === "cost"
        });

        newLogs.push(`[${new Date().toLocaleTimeString()}] [ROUTING] Optimally routed to Provider '${route.provider.name}' Model '${route.model.name}' based on health scores.`);
        newLogs.push(`[${new Date().toLocaleTimeString()}] [SUCCESS] Established handshake with gateway. Processing completion request.`);
        await new Promise(r => setTimeout(r, 900));

        let responseText = "";
        if (route.provider.id === "gemini") {
          try {
            const res = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: [{ role: "user", content: simulationPrompt }],
                selectedStack: ["all-in-one"],
                systemRules: ["You are a helpful software engineering assistant."]
              })
            });
            if (res.ok) {
              const data = await res.json();
              responseText = data.content;
            } else {
              throw new Error("Endpoint error");
            }
          } catch {
            responseText = `[Google Gemini 2.5 Flash] Sourced AST parser matching SOLID principles:\n\n\`\`\`typescript\nexport class ASTParser implements ISolidParser {\n  public parse(tokens: Token[]): ASTNode {\n    // Node parsing logic\n  }\n}\n\`\`\``;
          }
        } else {
          responseText = `[${route.provider.name} - ${route.model.name} Response]\nSourced and structured parser logic matching requested parameters. Workspace directories synced.`;
        }

        newLogs.push(`[${new Date().toLocaleTimeString()}] [SUCCESS] Core broker query completed successfully. Input tokens: 42, Output tokens: 84. Total cost: $${(route.model.estimatedCostPer1MInput * 42 / 1000000).toFixed(6)}.`);
        setProviderSimLogs([...newLogs]);
        setProviderSimResult(responseText);
        addSystemLog("INFO", "ROUTER", `Executed AI completion via ${route.provider.name} for required capabilities.`);
      }

    } catch (err: any) {
      newLogs.push(`[${new Date().toLocaleTimeString()}] [CRITICAL] Broker execution halted: ${err.message}`);
      setProviderSimLogs([...newLogs]);
      addSystemLog("WARN", "ROUTER", `Broker execution failed: ${err.message}`);
    } finally {
      setIsSimulatingBroker(false);
    }
  };

  const handleExecuteContextBuild = async (forceFresh = false) => {
    if (isBuildingContext) return;
    setIsBuildingContext(true);
    
    const logs: string[] = [];
    const pushLog = (log: string) => {
      logs.push(log);
      setContextManagerLogs([...logs]);
    };

    pushLog(`[${new Date().toLocaleTimeString()}] [PIPELINE] Initializing Context Pipeline.`);
    await new Promise(r => setTimeout(r, 400));

    try {
      const manager = ContextManager.getInstance();
      const pkg = await manager.buildContext(contextQuery, pushLog, {
        compressSemantic,
        forceFresh
      });
      setContextPackageResult(pkg);
      setContextMetrics(manager.getMetrics());
      addSystemLog("INFO", "CONTEXT", `Synthesized Context Package (${pkg.metadata.tokensEstimated} tokens) for query: "${contextQuery.substring(0, 30)}..."`);
    } catch (err: any) {
      pushLog(`[${new Date().toLocaleTimeString()}] [CRITICAL] Pipeline failed: ${err.message}`);
      addSystemLog("WARN", "CONTEXT", `Context synthesis failed: ${err.message}`);
    } finally {
      setIsBuildingContext(false);
    }
  };

  const handleExecuteIntentAnalysis = async () => {
    if (isAnalyzingIntent) return;
    setIsAnalyzingIntent(true);
    
    const logs: string[] = [];
    const pushLog = (log: string) => {
      logs.push(log);
      setIntentAnalyzerLogs([...logs]);
    };

    pushLog(`[${new Date().toLocaleTimeString()}] [INTENT GATEWAY] Activating Intent Analyzer pipeline.`);
    
    try {
      const analyzer = IntentAnalyzer.getInstance();
      const pkg = await analyzer.analyzePrompt(intentInput, pushLog);
      setIntentPackageResult(pkg);
      setIntentMetrics(analyzer.getMetrics());
      addSystemLog("INFO", "INTENT", `Analyzed prompt. Category: ${pkg.intentCategory}, Complexity: ${pkg.complexity}, Confidence: ${(pkg.confidenceScore * 100).toFixed(0)}%`);
    } catch (err: any) {
      pushLog(`[${new Date().toLocaleTimeString()}] [CRITICAL] Analysis failed: ${err.message}`);
      addSystemLog("WARN", "INTENT", `Intent analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzingIntent(false);
    }
  };

  const handleExecutePlanning = async (forceWithStrategy?: PlanningStrategyType) => {
    if (isPlanning) return;
    setIsPlanning(true);
    
    const logs: string[] = [];
    const pushLog = (log: string) => {
      logs.push(log);
      setPlannerLogs([...logs]);
    };

    pushLog(`[${new Date().toLocaleTimeString()}] [PLANNER DAEMON] Initializing Project Planner.`);
    await new Promise(r => setTimeout(r, 200));

    try {
      let activeIntent = intentPackageResult;
      if (!activeIntent) {
        pushLog(`[${new Date().toLocaleTimeString()}] [PLANNER DAEMON] No active Intent Package found in state cache.`);
        pushLog(`[${new Date().toLocaleTimeString()}] [INTENT NESTING] Executing on-the-fly Intent Ingress cascade first.`);
        const analyzer = IntentAnalyzer.getInstance();
        activeIntent = await analyzer.analyzePrompt(intentInput, (str) => pushLog(`   ${str}`));
        setIntentPackageResult(activeIntent);
        setIntentMetrics(analyzer.getMetrics());
      }

      const planner = Planner.getInstance();
      const plan = await planner.planExecution(activeIntent, pushLog, {
        forceStrategy: forceWithStrategy || selectedPlanningStrategy
      });

      setPlanningPackageResult(plan);
      setPlannerMetrics(planner.getMetrics());
      addSystemLog("INFO", "PLANNER", `Compiled execution graph for strategy: ${plan.strategyUsed} with ${plan.tasks.length} tasks and ${plan.riskAssessment.length} risks.`);
    } catch (err: any) {
      pushLog(`[${new Date().toLocaleTimeString()}] [CRITICAL] Planning execution failed: ${err.message}`);
      addSystemLog("WARN", "PLANNER", `Planning compilation failed: ${err.message}`);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleExecuteRouting = async (forceWithStrategy?: RoutingStrategyType) => {
    if (isRouting) return;
    setIsRouting(true);

    const logs: string[] = [];
    const pushLog = (log: string) => {
      logs.push(log);
      setRouterLogs([...logs]);
    };

    pushLog(`[${new Date().toLocaleTimeString()}] [ROUTER DAEMON] Initializing Intelligent Router...`);
    await new Promise(r => setTimeout(r, 200));

    try {
      let activePlan = planningPackageResult;
      if (!activePlan) {
        pushLog(`[${new Date().toLocaleTimeString()}] [PLAN CASCADE] No active Planning Package found in state.`);
        pushLog(`[${new Date().toLocaleTimeString()}] [PLAN CASCADE] Executing on-the-fly Planning compilation cascade first.`);
        
        let activeIntent = intentPackageResult;
        if (!activeIntent) {
          pushLog(`[${new Date().toLocaleTimeString()}] [INTENT NESTING] Executing on-the-fly Intent Ingress cascade first.`);
          const analyzer = IntentAnalyzer.getInstance();
          activeIntent = await analyzer.analyzePrompt(intentInput, (str) => pushLog(`   ${str}`));
          setIntentPackageResult(activeIntent);
          setIntentMetrics(analyzer.getMetrics());
        }

        const planner = Planner.getInstance();
        activePlan = await planner.planExecution(activeIntent, (str) => pushLog(`   ${str}`), {
          forceStrategy: selectedPlanningStrategy
        });

        setPlanningPackageResult(activePlan);
        setPlannerMetrics(planner.getMetrics());
      }

      if (!activePlan || activePlan.tasks.length === 0) {
        throw new Error("Cannot run router: No valid tasks found in synthesized plan.");
      }

      const router = Router.getInstance();
      const routingPack = await router.routePlan(activePlan, forceWithStrategy || selectedRoutingStrategy, pushLog);

      setRoutingPackageResult(routingPack);
      setRouterMetrics(router.getMetrics());
      addSystemLog("INFO", "ROUTER", `Compiled Routing Package for plan ${activePlan.id} with ${routingPack.jobs.length} jobs.`);
    } catch (err: any) {
      pushLog(`[${new Date().toLocaleTimeString()}] [CRITICAL] Routing compilation failed: ${err.message}`);
      addSystemLog("WARN", "ROUTER", `Routing compilation failed: ${err.message}`);
    } finally {
      setIsRouting(false);
    }
  };

  const handleExecuteDecision = async (forceWithStrategy?: DecisionStrategyType) => {
    if (isEvaluating) return;
    setIsEvaluating(true);

    const logs: string[] = [];
    const pushLog = (log: string) => {
      logs.push(log);
      setDecisionLogs([...logs]);
    };

    pushLog(`[${new Date().toLocaleTimeString()}] [DECISION DAEMON] Activating Decision Engine Core...`);
    await new Promise(r => setTimeout(r, 200));

    try {
      let activeRoute = routingPackageResult;
      if (!activeRoute) {
        pushLog(`[${new Date().toLocaleTimeString()}] [ROUTING CASCADE] No active Routing Package found in state cache.`);
        pushLog(`[${new Date().toLocaleTimeString()}] [ROUTING CASCADE] Executing on-the-fly Routing compilation first.`);
        
        // Cascades
        let activePlan = planningPackageResult;
        if (!activePlan) {
          pushLog(`[${new Date().toLocaleTimeString()}] [PLAN CASCADE] Executing on-the-fly Planning compilation first.`);
          let activeIntent = intentPackageResult;
          if (!activeIntent) {
            pushLog(`[${new Date().toLocaleTimeString()}] [INTENT NESTING] Executing on-the-fly Intent Ingress cascade first.`);
            const analyzer = IntentAnalyzer.getInstance();
            activeIntent = await analyzer.analyzePrompt(intentInput, (str) => pushLog(`   ${str}`));
            setIntentPackageResult(activeIntent);
            setIntentMetrics(analyzer.getMetrics());
          }

          const planner = Planner.getInstance();
          activePlan = await planner.planExecution(activeIntent, (str) => pushLog(`   ${str}`), {
            forceStrategy: selectedPlanningStrategy
          });
          setPlanningPackageResult(activePlan);
          setPlannerMetrics(planner.getMetrics());
        }

        const router = Router.getInstance();
        activeRoute = await router.routePlan(activePlan, selectedRoutingStrategy, (str) => pushLog(`   ${str}`));
        setRoutingPackageResult(activeRoute);
        setRouterMetrics(router.getMetrics());
      }

      const engine = DecisionEngine.getInstance();
      const decisionPack = await engine.evaluateProposals(
        activeRoute.planId, 
        activeRoute.planId, 
        activeRoute.id, 
        candidateProposals, 
        forceWithStrategy || selectedDecisionStrategy, 
        pushLog
      );

      setDecisionPackageResult(decisionPack);
      setDecisionMetrics(engine.getMetrics());
      addSystemLog("INFO", "DECISION", `Compiled Decision Package ${decisionPack.id} under ${decisionPack.strategyUsed}`);
    } catch (err: any) {
      pushLog(`[${new Date().toLocaleTimeString()}] [CRITICAL] Decision evaluation failed: ${err.message}`);
      addSystemLog("WARN", "DECISION", `Decision evaluation failed: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };


  const handleRegisterCustomProvider = () => {
    if (!newProvName.trim()) return;
    
    const manager = ContextManager.getInstance();
    const typeUpper = newProvType;
    const contentText = newProvContent.trim() || `Default mock structured information returned for custom adapter ${newProvName}.`;
    
    const customProvider = {
      id: `prov-custom-${Date.now()}`,
      name: newProvName,
      type: typeUpper,
      fetchContext: async (query: string) => {
        return [
          {
            id: `custom-item-${Date.now()}`,
            source: typeUpper,
            title: `Custom Source: ${newProvName}`,
            content: contentText,
            relevanceScore: 0.9,
            recencyTimestamp: Date.now(),
            importanceWeight: 8,
            dependencyLinks: [],
            confidence: ContextItemConfidence.HIGH,
            tokenCount: Math.round(contentText.length / 4)
          }
        ];
      }
    };

    manager.registerProvider(customProvider);
    setContextProviders(manager.listProviders());
    
    const newLogs = [
      ...contextManagerLogs,
      `[${new Date().toLocaleTimeString()}] [OCP REGISTRY] Successfully registered pluggable provider adapter: '${newProvName}' (${typeUpper}).`
    ];
    setContextManagerLogs(newLogs);
    addSystemLog("INFO", "CONTEXT", `Pluggable context source registered: '${newProvName}'`);

    setNewProvName("");
    setNewProvContent("");
  };

  const handleToggleProvider = (providerId: string) => {
    const manager = ContextManager.getInstance();
    manager.unregisterProvider(providerId);
    setContextProviders(manager.listProviders());
    const newLogs = [
      ...contextManagerLogs,
      `[${new Date().toLocaleTimeString()}] [OCP REGISTRY] Unregistered/Disabled provider adapter: '${providerId}'.`
    ];
    setContextManagerLogs(newLogs);
    addSystemLog("INFO", "CONTEXT", `Unregistered context source: '${providerId}'`);
  };

  const startKernelBootstrapSimulation = async () => {
    if (kernelBootState === "booting" || kernelBootState === "shutting_down") return;

    setKernelBootState("booting");
    setActiveBootStep(0);
    setKernelUptime(0);
    setEventsProcessed(0);
    setKernelLogs([
      `[${new Date().toLocaleTimeString()}] [SYS] KERNEL BOOT: Initializing All-In-One core registry...`,
      `[${new Date().toLocaleTimeString()}] [SYS] KERNEL BOOT: Detecting system hardware constraints.`
    ]);

    const bootSteps = [
      { id: "logger", label: "Structured Logger", priority: 10, log: "Initializing Logger Service: Bound JSON format stream." },
      { id: "config", label: "Configuration Service", priority: 20, log: "Loading config.yaml overrides & strict parsing schemas." },
      { id: "event_bus", label: "Unified Event Bus", priority: 30, log: "Starting in-process subscription broker." },
      { id: "security", label: "Security Guard", priority: 40, log: "Compiling file whitelists & regex filter structures." },
      { id: "workspace", label: "Workspace Manager", priority: 50, log: "Scanning sandbox workspace folder directories..." },
      { id: "memory", label: "Long-Term Memory", priority: 60, log: "Mounting SQLite transactional journals & ChromaDB indexes." },
      { id: "providers", label: "AI Provider Layer", priority: 70, log: "Registering Gemini and Ollama socket clients." },
      { id: "plugins", label: "Plugin SDK Registry", priority: 80, log: "Scanning declarative plugin manifest signatures." }
    ];

    addSystemLog("SYS", "KERNEL", "Boot sequence started.");

    for (let i = 0; i < bootSteps.length; i++) {
      setActiveBootStep(i);
      const step = bootSteps[i];

      // Delay to simulate processing latency
      await new Promise(resolve => setTimeout(resolve, 800));

      const timeStr = new Date().toLocaleTimeString();

      // Check for simulated failure
      if (bootFailSimulationModule !== "none") {
        if (
          (bootFailSimulationModule === "config" && step.id === "config") ||
          (bootFailSimulationModule === "security" && step.id === "security") ||
          (bootFailSimulationModule === "memory" && step.id === "memory")
        ) {
          // Failure hit! Run Rollback policy
          setKernelLogs(prev => [
            ...prev,
            `[${timeStr}] [CRITICAL] [${step.label.toUpperCase()}] FAILED: Simulated fault triggered!`,
            `[${timeStr}] [SYS] KERNEL: Graceful Rollback Initiated to prevent partial state corruption...`
          ]);
          setKernelBootState("rollback_active");
          addSystemLog("WARN", "KERNEL", `Startup failed on ${step.label}. Triggering cleanup rollback...`);

          // Run backward rollback sequence
          for (let r = i - 1; r >= 0; r--) {
            await new Promise(res => setTimeout(res, 600));
            const rollStep = bootSteps[r];
            const rollTime = new Date().toLocaleTimeString();
            setKernelLogs(prev => [
              ...prev,
              `[${rollTime}] [SYS] ROLLBACK: Invoking .terminate() on service: ${rollStep.label}... SUCCESS.`
            ]);
          }

          await new Promise(res => setTimeout(res, 600));
          setKernelLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] [FATAL] KERNEL CRASHED. Safe shutdown complete.`
          ]);
          setKernelBootState("crashed");
          return;
        }
      }

      // Normal success logs
      setKernelLogs(prev => [
        ...prev,
        `[${timeStr}] [INFO] [${step.label}] ${step.log}`,
        `[${timeStr}] [INFO] [${step.label}] Priority: ${step.priority} -> OK.`
      ]);
    }

    // Finish boot successfully
    await new Promise(resolve => setTimeout(resolve, 600));
    const finalTimeStr = new Date().toLocaleTimeString();
    setKernelLogs(prev => [
      ...prev,
      `[${finalTimeStr}] [SYS] KERNEL STATUS: Run checks...`,
      `[${finalTimeStr}] [SYS] Uptime monitor live.`,
      `[${finalTimeStr}] [SYS] KERNEL BOOT SUCCESS. System state -> RUNNING.`
    ]);
    setKernelBootState("running");
    setActiveWorkspaceCount(2);
    setLoadedPluginsCount(1);
    addSystemLog("SYS", "KERNEL", "All services active. State transitioned to RUNNING.");
  };

  const startKernelShutdownSimulation = async () => {
    if (kernelBootState !== "running") return;

    setKernelBootState("shutting_down");
    addSystemLog("SYS", "KERNEL", "Initiating graceful shutdown protocol...");
    
    const shutdownSteps = [
      "Rejecting new incoming user prompt plans...",
      "Stopping running browser automation threads...",
      "Saving unsaved planner log records to local SQLite...",
      "Flushing log streams & closing directory file locks...",
      "Disconnecting external LLM model socket pools...",
      "Releasing system resource locks... System shutdown SUCCESS."
    ];

    for (let i = 0; i < shutdownSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      const timeStr = new Date().toLocaleTimeString();
      setKernelLogs(prev => [
        ...prev,
        `[${timeStr}] [SYS] SHUTDOWN: ${shutdownSteps[i]}`
      ]);
    }

    setKernelBootState("uninitialized");
    setActiveBootStep(-1);
    setActiveWorkspaceCount(0);
    setLoadedPluginsCount(0);
    addSystemLog("SYS", "KERNEL", "Kernel shut down safely. Zero data loss occurred.");
  };

  const triggerEventBusPublishSimulation = async () => {
    if (ebIsDispatching) return;
    setEbIsDispatching(true);

    const eventId = "evt_" + Math.random().toString(36).substr(2, 9);
    const correlationId = "corr_" + Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(ebEventPayload);
    } catch (e) {
      parsedPayload = { raw_payload: ebEventPayload };
    }

    const newEvent: IEvent = {
      event_id: eventId,
      event_type: ebEventType,
      source_module: ebEventCategory,
      timestamp,
      workspace_id: "ws-aether-dev",
      correlation_id: correlationId,
      priority: ebEventPriority,
      payload: parsedPayload,
      metadata: { environment: "development", user_email: "funvishbrother25@gmail.com" }
    };

    setEbDispatchLogs([
      `[${new Date().toLocaleTimeString()}] [PUBLISH] Initiating Event Bus transmission pipeline...`,
      `[${new Date().toLocaleTimeString()}] [1. INSTANTIATE] Event created: type="${newEvent.event_type}", ID="${newEvent.event_id}"`,
      `[${new Date().toLocaleTimeString()}] [2. VALIDATE] Schema Check: Enforcing UniversalEvent strict typing... PASS.`,
    ]);

    await new Promise(resolve => setTimeout(resolve, 600));

    setEbDispatchLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [3. QUEUE] Enqueued event in broker queue with priority weight = ${newEvent.priority}.`
    ]);

    await new Promise(resolve => setTimeout(resolve, 600));

    setEbDispatchLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [4. MIDDLEWARE] Audit log interceptor generated telemetry trace.`,
      `[${new Date().toLocaleTimeString()}] [5. FILTER] Pattern matcher scanning active subscriptions for target "${newEvent.event_type}"...`
    ]);

    await new Promise(resolve => setTimeout(resolve, 800));

    // Determine matching simulated subscribers
    const matchingSubscribers = [
      { id: "sub:audit_recorder", pattern: "*", priority: 90, name: "Universal Audit Recorder" },
      { id: `sub:${newEvent.source_module}_monitor`, pattern: `${newEvent.source_module}:*`, priority: 40, name: `${newEvent.source_module.toUpperCase()} Monitor` },
      { id: "sub:realtime_pusher", pattern: "*", priority: 80, name: "Socket.io Frame Pusher" }
    ];

    setEbDispatchLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [6. MATCHED] Found ${matchingSubscribers.length} candidate subscribers:`,
      ...matchingSubscribers.map(sub => `     • Subscriber ID: "${sub.id}" [Pattern: "${sub.pattern}", Priority Weight: ${sub.priority}]`)
    ]);

    await new Promise(resolve => setTimeout(resolve, 800));

    // Sort matching subscribers by Priority Weight
    const sortedSubscribers = [...matchingSubscribers].sort((a, b) => a.priority - b.priority);

    setEbDispatchLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [7. PRIORITY SORT] Resolved topological execution sequence (lowest priority weight first):`,
      ...sortedSubscribers.map((sub, idx) => `     ${idx + 1}. [${sub.id}] (Priority Weight: ${sub.priority})`)
    ]);

    await new Promise(resolve => setTimeout(resolve, 800));

    // Execute subscribers
    let hasFailedSubscriber = false;

    for (let i = 0; i < sortedSubscribers.length; i++) {
      const sub = sortedSubscribers[i];
      const stepTime = new Date().toLocaleTimeString();

      if (ebSimulateSubscriberError && sub.id.includes("_monitor")) {
        // Trigger simulated subscriber error
        hasFailedSubscriber = true;
        setEbDispatchLogs(prev => [
          ...prev,
          `[${stepTime}] [8. RUNNING] [${sub.id}] executing callback...`,
          `[${stepTime}] [CRITICAL] [${sub.id}] Handler threw an unhandled reference error during context parsing!`,
          `[${stepTime}] [SECURE ISOLATION] Caught error in Event Bus frame. Preventing crash escalation!`,
          `[${stepTime}] [INFO] Event Bus proceeding safely to next subscriber in priority queue.`
        ]);
        addSystemLog("WARN", "EVENT_BUS", `Isolated subscriber error on [${sub.id}] for event ${newEvent.event_type}`);
      } else {
        setEbDispatchLogs(prev => [
          ...prev,
          `[${stepTime}] [8. RUNNING] [${sub.id}] successfully handled callback (latency: 1.1ms).`
        ]);
      }
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    const finalTime = new Date().toLocaleTimeString();
    setEbDispatchLogs(prev => [
      ...prev,
      `[${finalTime}] [9. COMPLETE] Event "${newEvent.event_type}" successfully retired from dispatch queue.`,
      `[${finalTime}] [SYS] Audit database synced. Zero packet loss.`
    ]);

    // Save event to history
    setEbEvents(prev => [newEvent, ...prev]);

    // Update metrics
    setEbMetrics(prev => ({
      published: prev.published + 1,
      failed: prev.failed + (hasFailedSubscriber ? 1 : 0),
      latencyAvg: parseFloat(((prev.latencyAvg * prev.published + (1.1 + Math.random() * 0.4)) / (prev.published + 1)).toFixed(2))
    }));

    setEventsProcessed(prev => prev + 1);
    addSystemLog("INFO", "EVENT_BUS", `Dispatched event: ${newEvent.event_type} (${newEvent.event_id})`);
    setEbIsDispatching(false);
  };

  // Helper to append console/system logs
  const addSystemLog = (level: "INFO" | "SECURE" | "WARN" | "SYS", module: string, message: string) => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    setSystemLogs(prev => [
      { timestamp, level, module, message },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  };

  // Calculate scores based on stack choices
  const currentStackOptions = STACK_OPTIONS.filter(o => selectedStackIds.includes(o.id));
  const avgScalability = currentStackOptions.length > 0
    ? Math.round((currentStackOptions.reduce((acc, o) => acc + o.scalability, 0) / currentStackOptions.length) * 20)
    : 0;
  const avgSecurity = currentStackOptions.length > 0
    ? Math.round((currentStackOptions.reduce((acc, o) => acc + o.security, 0) / currentStackOptions.length) * 20)
    : 0;

  // Toggle stack selection
  const toggleStackOption = (option: StackOption) => {
    setSelectedStackIds(prev => {
      // Find other option of same category
      const others = STACK_OPTIONS.filter(o => o.category === option.category && o.id !== option.id).map(o => o.id);
      const filtered = prev.filter(id => !others.includes(id));
      if (filtered.includes(option.id)) {
        addSystemLog("WARN", "CONFIG", `Removed stack item: ${option.name}`);
        return filtered.filter(id => id !== option.id);
      } else {
        addSystemLog("INFO", "CONFIG", `Selected stack item: ${option.name}`);
        return [...filtered, option.id];
      }
    });
  };

  // Run Sandbox Simulation
  const handleSimulateCommand = () => {
    if (!simCommand.trim()) return;
    setIsSimulating(true);
    addSystemLog("INFO", "SANDBOX", `Command simulator requested execution of: "${simCommand}"`);

    const steps: SimStep[] = [
      {
        name: "Command Parsing & Extraction",
        module: "Security Engine",
        status: "processing",
        log: `Analyzing command structure: "${simCommand}"`,
        details: "Parsing tokens, identifying binary executable, stripping env overrides."
      }
    ];
    setSimLogs(steps);

    // Run simulation loop step-by-step
    setTimeout(() => {
      const isDangerousWord = ["rm", "sudo", "mv", "chmod", "kill", "format", "dd", "sh", "bash"].some(w => simCommand.toLowerCase().includes(w));
      const isRestrictedPath = policy.restrictedPaths.some(p => simCommand.toLowerCase().includes(p.toLowerCase()));
      const isWhitelisted = policy.allowedCommands.some(c => simCommand.toLowerCase() === c.toLowerCase() || simCommand.toLowerCase().startsWith(c.toLowerCase() + " "));

      let finalStatus: "success" | "warning" | "failed" = "success";
      let authDetails = "Command conforms to whitelisted operations policy.";
      let step2Status: "success" | "warning" | "failed" = "success";

      if (isDangerousWord || isRestrictedPath) {
        step2Status = "failed";
        finalStatus = "failed";
        authDetails = `CRITICAL: Blocked dangerous sequence. Attempted execution violating protected scopes.`;
        addSystemLog("SECURE", "SECURITY", `Access VIOLATION blocked: "${simCommand}"`);
      } else if (!isWhitelisted) {
        if (policy.autoApproveSafe) {
          step2Status = "warning";
          finalStatus = "warning";
          authDetails = "No exact match in whitelist. Allowed due to permissive bypass state.";
          addSystemLog("WARN", "SECURITY", `Permissive command bypass applied to: "${simCommand}"`);
        } else {
          step2Status = "failed";
          finalStatus = "failed";
          authDetails = "Access Denied: Command is not explicitly whitelisted.";
          addSystemLog("SECURE", "SECURITY", `Command blocked (not whitelisted): "${simCommand}"`);
        }
      } else {
        addSystemLog("INFO", "SANDBOX", `Sandbox execution successful: "${simCommand}"`);
      }

      setSimLogs([
        {
          name: "Command Parsing & Extraction",
          module: "Security Engine",
          status: "success",
          log: `Command verified: Binary identified.`,
          details: "Structure conforms to standard shell specifications."
        },
        {
          name: "Security Whitelist Validation",
          module: "Security Engine",
          status: step2Status,
          log: step2Status === "success" ? "Access Granted: Command matches whitelist guidelines." : step2Status === "warning" ? "Bypass Granted: Review recommended." : "Access BLOCKED: Security rule violation.",
          details: authDetails
        },
        {
          name: "Interactive Execution Isolation",
          module: "Terminal Executor",
          status: finalStatus,
          log: finalStatus === "success" ? "Subprocess run completed safely." : finalStatus === "warning" ? "Executed with trace warning." : "Execution aborted to protect virtual system.",
          details: finalStatus === "success" ? "Command exited with status code 0." : finalStatus === "warning" ? "Executed under active tracer watch." : "Sandbox active containment prevented process spawn."
        }
      ]);
      setIsSimulating(false);
    }, 1200);
  };

  // Chat with AI Architect
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsChatLoading(true);
    addSystemLog("INFO", "ROUTER", "Routing consultation prompt to Gemini 3.5 Architect...");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, { role: "user", content: userMsg }],
          selectedStack: currentStackOptions.map(o => ({ name: o.name, category: o.category })),
          systemRules: CODING_STANDARDS
        })
      });

      const data = await response.json();
      if (response.ok) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.content }]);
        addSystemLog("INFO", "PROVIDERS", "Consultation response synthesized successfully.");
      } else {
        throw new Error(data.error || "An error occurred");
      }
    } catch (error: any) {
      console.error(error);
      setChatMessages(prev => [...prev, {
        role: "system",
        content: `Connection failed: ${error.message || "Failed to reach backend."}. Please verify GEMINI_API_KEY is configured correctly.`
      }]);
      addSystemLog("WARN", "PROVIDERS", "AI response failed. Verify API configuration.");
    } finally {
      setIsChatLoading(false);
    }
  };

  // Toggle folder tree expansion
  const toggleFolder = (name: string) => {
    setExpandedFolders(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Folder tree renderer
  const renderFolderNode = (node: any, depth = 0) => {
    const isDir = node.type === "directory";
    const isExpanded = expandedFolders[node.name];

    return (
      <div key={node.name} style={{ paddingLeft: `${depth * 12}px` }} className="text-xs">
        <div
          onClick={() => isDir ? toggleFolder(node.name) : null}
          className={`group flex items-center py-1.5 px-2 rounded cursor-pointer transition-colors ${isDir ? "hover:bg-slate-900/40 text-slate-200" : "hover:bg-cyan-950/20 text-slate-400"}`}
        >
          {isDir ? (
            <span className="mr-1.5 text-cyan-600 transition-transform duration-200">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <span className="w-3.5 h-3.5 mr-1.5 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            </span>
          )}
          <span className={`font-mono ${isDir ? "font-bold text-slate-300" : "text-slate-400"}`}>
            {node.name}
          </span>
          <span className="ml-auto text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[150px] italic">
            {node.description}
          </span>
        </div>
        {isDir && isExpanded && node.children && (
          <div className="border-l border-slate-800/60 ml-2.5">
            {node.children.map((child: any) => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#050507] text-slate-300 font-sans p-4 md:p-6 overflow-y-auto flex flex-col border-4 border-[#0a0a0f] crt-glow relative">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b border-cyan-950 pb-4 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-500 font-bold mb-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
            AETHER AI DEVELOPMENT CORE
          </div>
          <h1 className="text-3xl font-light text-white flex items-center gap-3 font-display">
            ALL-IN-ONE
            <span className="text-cyan-500 font-bold text-[11px] bg-cyan-950/50 px-2 py-0.5 border border-cyan-800/40 rounded tracking-widest uppercase">
              v1.0.0-ALPHA
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-left bg-slate-900/30 p-2 rounded border border-slate-900">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">Security Sandbox</div>
            <div className="text-amber-500 font-bold flex items-center gap-1">
              <Shield size={12} /> SHIELD_ACTIVE
            </div>
          </div>
          <div className="text-left bg-slate-900/30 p-2 rounded border border-slate-900">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">Cognitive Link</div>
            <div className="text-cyan-400 font-bold flex items-center gap-1">
              <Activity size={12} /> ONLINE
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-1">Local Orchestration</div>
            <div className="text-sm font-bold text-cyan-400 font-mono tracking-widest">PHASE_01: DESIGN</div>
          </div>
        </div>
      </div>

      {/* METRIC RIBBON */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0b0b11] border border-slate-900 p-3 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Scalability Capacity</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{avgScalability}%</div>
          </div>
          <div className="w-10 h-10 rounded bg-cyan-950/20 border border-cyan-900/30 flex items-center justify-center text-cyan-400 font-mono text-sm">
            X10
          </div>
        </div>
        <div className="bg-[#0b0b11] border border-slate-900 p-3 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Security Coefficient</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{avgSecurity}%</div>
          </div>
          <div className="w-10 h-10 rounded bg-amber-950/20 border border-amber-900/30 flex items-center justify-center text-amber-500 font-mono text-sm">
            SEC
          </div>
        </div>
        <div className="bg-[#0b0b11] border border-slate-900 p-3 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Registered Modules</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{CORE_MODULES.length}</div>
          </div>
          <div className="w-10 h-10 rounded bg-slate-900/40 border border-slate-800 flex items-center justify-center text-slate-400">
            <Layers size={18} />
          </div>
        </div>
        <div className="bg-[#0b0b11] border border-slate-900 p-3 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Design Standard</div>
            <div className="text-xs font-bold text-cyan-400 font-mono mt-1">PEP8 & strictly typed</div>
          </div>
          <div className="w-10 h-10 rounded bg-slate-900/40 border border-slate-800 flex items-center justify-center text-slate-400">
            <BookOpen size={18} />
          </div>
        </div>
      </div>

      {/* THREE-COLUMN WORKSPACE */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-[500px]">
        
        {/* LEFT PANEL: ARCHITECTURE METADATA (MODULES, FILE SYSTEM, STANDARDS) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          
          {/* Navigation Tab Header */}
          <div className="flex border-b border-slate-900 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => {
                setActiveTab("modules");
                addSystemLog("INFO", "GUI", "Switched left menu to module blueprints.");
              }}
              className={`flex-1 px-2 py-2 text-[10px] font-mono uppercase tracking-wider border-b-2 text-center transition-all ${activeTab === "modules" ? "border-cyan-500 text-white font-bold" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              Modules
            </button>
            <button
              onClick={() => {
                setActiveTab("explorer");
                addSystemLog("INFO", "GUI", "Opened physical folder structure explorer.");
              }}
              className={`flex-1 px-2 py-2 text-[10px] font-mono uppercase tracking-wider border-b-2 text-center transition-all ${activeTab === "explorer" ? "border-cyan-500 text-white font-bold" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              Files Tree
            </button>
            <button
              onClick={() => {
                setActiveTab("blueprint");
                addSystemLog("INFO", "GUI", "Opened master platform architectural blueprints.");
              }}
              className={`flex-1 px-2 py-2 text-[10px] font-mono uppercase tracking-wider border-b-2 text-center transition-all ${activeTab === "blueprint" ? "border-cyan-500 text-white font-bold" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              Blueprint
            </button>
            <button
              onClick={() => {
                setActiveTab("standards");
                addSystemLog("INFO", "GUI", "Opened engineering standards registry.");
              }}
              className={`flex-1 px-2 py-2 text-[10px] font-mono uppercase tracking-wider border-b-2 text-center transition-all ${activeTab === "standards" ? "border-cyan-500 text-white font-bold" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              Standards
            </button>
          </div>

          {/* Tab 1: Module Registry */}
          {activeTab === "modules" && (
            <div className="bg-[#0b0b11] border border-slate-900 p-4 rounded-lg flex-1 flex flex-col min-h-[350px]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                Module Registry
              </h2>
              <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                Core logical blocks defined for Phase 1. Click a module to inspect interfaces.
              </p>

              <div className="space-y-1.5 overflow-y-auto flex-1 max-h-[300px] pr-1">
                {CORE_MODULES.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => {
                      setSelectedModule(mod);
                      addSystemLog("INFO", "GUI", `Inspecting module details for: ${mod.name}`);
                    }}
                    className={`w-full text-left p-2.5 rounded border transition-all flex items-center justify-between ${selectedModule.id === mod.id ? "bg-cyan-950/20 border-cyan-800/60 text-white" : "bg-[#07070a]/50 border-slate-950 hover:bg-slate-900/30 text-slate-400"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedModule.id === mod.id ? "bg-cyan-400" : "bg-slate-600"}`}></div>
                      <span className="font-mono text-[11px] font-medium tracking-tight truncate max-w-[170px]">
                        {mod.name}
                      </span>
                    </div>
                    <ChevronRight size={12} className={selectedModule.id === mod.id ? "text-cyan-400" : "text-slate-600"} />
                  </button>
                ))}
              </div>

              {/* Blueprint details drawer */}
              <div className="mt-4 pt-3 border-t border-slate-900 bg-[#07070a] p-3 rounded border border-slate-900/60">
                <div className="text-[9px] uppercase tracking-wider text-cyan-500 font-mono font-bold mb-1">
                  Active Spec Details
                </div>
                <div className="text-xs text-white font-medium mb-1.5">{selectedModule.name}</div>
                <div className="text-[10px] text-slate-400 leading-relaxed mb-2.5">
                  {selectedModule.responsibility}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Primary Interfaces
                </div>
                <div className="space-y-1 font-mono text-[9px] bg-black/40 p-1.5 rounded text-cyan-300 border border-slate-900/80">
                  {selectedModule.keyInterfaces.map((item, idx) => (
                    <div key={idx} className="truncate">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Codebase Files Tree */}
          {activeTab === "explorer" && (
            <div className="bg-[#0b0b11] border border-slate-900 p-4 rounded-lg flex-1 flex flex-col min-h-[350px]">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <FolderGit2 size={13} className="text-cyan-500" />
                  Scalable Folders Structure
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                Click folders to expand. This structure is mapped to safely exceed 100,000 LOC.
              </p>
              
              <div className="bg-black/40 border border-slate-950 p-3 rounded-lg overflow-y-auto flex-1 max-h-[400px]">
                {renderFolderNode(FOLDER_STRUCTURE)}
              </div>
            </div>
          )}

          {/* Tab 2.5: Architectural Blueprint */}
          {activeTab === "blueprint" && (
            <div className="bg-[#0b0b11] border border-slate-900 p-4 rounded-lg flex-1 flex flex-col min-h-[350px]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <BookOpen size={13} className="text-cyan-500" />
                Operating Blueprint
              </h2>
              <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                Browse designed blueprints, interfaces, and flow systems.
              </p>

              {/* Selector */}
              <div className="mb-3">
                <select
                  value={selectedBlueprintSection}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    setSelectedBlueprintSection(idx);
                    addSystemLog("INFO", "GUI", `Viewing blueprint section: ${BLUEPRINT_SECTIONS[idx].title}`);
                  }}
                  className="w-full bg-black border border-slate-900 text-[11px] font-mono text-cyan-400 p-2 rounded focus:outline-none focus:border-cyan-500"
                >
                  {BLUEPRINT_SECTIONS.map((sec, idx) => (
                    <option key={idx} value={idx} className="bg-black text-slate-300">
                      {sec.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Blueprint Content Card */}
              <div className="flex-1 overflow-y-auto max-h-[320px] space-y-3 pr-1">
                <div className="bg-black/40 border border-slate-950 p-2.5 rounded-lg">
                  <div className="text-[11px] text-white font-bold mb-1">
                    {BLUEPRINT_SECTIONS[selectedBlueprintSection].title}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {BLUEPRINT_SECTIONS[selectedBlueprintSection].description}
                  </p>
                </div>

                {/* ASCII Diagram or visual */}
                {BLUEPRINT_SECTIONS[selectedBlueprintSection].diagram && (
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono mb-1 font-bold">
                      System Diagram & Structure
                    </div>
                    <pre className="p-2 bg-black/60 border border-slate-900 rounded font-mono text-[9px] text-cyan-300 overflow-x-auto leading-relaxed">
                      {BLUEPRINT_SECTIONS[selectedBlueprintSection].diagram}
                    </pre>
                  </div>
                )}

                {/* Key Interfaces list */}
                {BLUEPRINT_SECTIONS[selectedBlueprintSection].interfaces && BLUEPRINT_SECTIONS[selectedBlueprintSection].interfaces.length > 0 && (
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono mb-1 font-bold">
                      Primary Module Methods
                    </div>
                    <div className="space-y-1 font-mono text-[9px] bg-black/40 p-2 rounded text-emerald-400 border border-slate-900/80">
                      {BLUEPRINT_SECTIONS[selectedBlueprintSection].interfaces.map((item, idx) => (
                        <div key={idx} className="truncate">
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schema JSON or classes declarations */}
                {BLUEPRINT_SECTIONS[selectedBlueprintSection].schema && (
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono mb-1 font-bold">
                      Data Schema & Definitions
                    </div>
                    <pre className="p-2 bg-black/80 border border-slate-950 rounded font-mono text-[9px] text-slate-400 overflow-x-auto">
                      {BLUEPRINT_SECTIONS[selectedBlueprintSection].schema}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Coding Standards */}
          {activeTab === "standards" && (
            <div className="bg-[#0b0b11] border border-slate-900 p-4 rounded-lg flex-1 flex flex-col min-h-[350px]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <Code size={13} className="text-cyan-500" />
                Engineering Standards
              </h2>
              <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                Guidelines adopted for standard consistency across modules.
              </p>

              <div className="space-y-4 overflow-y-auto flex-1 max-h-[400px]">
                {/* Naming */}
                <div>
                  <div className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider font-mono mb-1.5">
                    Naming Whitelist
                  </div>
                  <div className="space-y-1 bg-[#07070a] p-2 rounded border border-slate-900">
                    {CODING_STANDARDS.naming.map((n, i) => (
                      <div key={i} className="text-[11px] flex flex-col border-b border-slate-900/40 pb-1 last:border-0 last:pb-0">
                        <span className="text-slate-400 font-mono font-medium">{n.rule}</span>
                        <span className="text-white font-mono text-[10px]">{n.example}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Style */}
                <div>
                  <div className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider font-mono mb-1.5">
                    Coding Style Rules
                  </div>
                  <div className="space-y-2 bg-[#07070a] p-2 rounded border border-slate-900">
                    {CODING_STANDARDS.style.map((s, i) => (
                      <div key={i} className="text-[11px]">
                        <span className="text-white font-bold text-[10px] bg-slate-900 px-1 rounded inline-block mb-1">{s.language}</span>
                        <p className="text-slate-400 leading-relaxed text-[11px]">{s.standard}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testing */}
                <div>
                  <div className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider font-mono mb-1.5">
                    Testing Strategy
                  </div>
                  <div className="space-y-2 bg-[#07070a] p-2 rounded border border-slate-900">
                    {CODING_STANDARDS.testing.map((t, i) => (
                      <div key={i} className="text-[11px]">
                        <span className="text-cyan-400 font-mono font-bold text-[10px]">{t.type}</span>
                        <p className="text-slate-400 leading-relaxed text-[11px] mt-0.5">{t.tools}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Sandbox Status indicators */}
          <div className="bg-[#0b0b11] border border-slate-900 p-4 rounded-lg">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Milestone Tracking</div>
            <div className="space-y-2">
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                <div className="bg-cyan-500 h-full w-[25%] shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-cyan-500">M1: Foundation Design</span>
                <span className="text-white">25% Done</span>
              </div>
            </div>
          </div>

        </div>

        {/* CENTER PANEL: INTERACTIVE CANVAS OR AI CONSULTATION */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          
          {/* Main Visual Header Navigation */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCenterView("flow");
                  addSystemLog("INFO", "GUI", "View changed: Live Interactive Flow Map.");
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all uppercase tracking-wider ${centerView === "flow" ? "bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 font-bold" : "text-slate-500 hover:text-slate-300"}`}
              >
                Interactive Flow Map
              </button>
              <button
                onClick={() => {
                  setCenterView("kernel");
                  addSystemLog("INFO", "GUI", "View changed: Kernel Lifecycle & Telemetry Center.");
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all uppercase tracking-wider flex items-center gap-1.5 ${centerView === "kernel" ? "bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 font-bold" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Cpu size={12} className={kernelBootState === "running" ? "text-emerald-400 animate-pulse" : kernelBootState === "booting" ? "text-cyan-400 animate-spin" : kernelBootState === "crashed" ? "text-rose-500" : "text-slate-500"} />
                Kernel Console
              </button>
              <button
                onClick={() => {
                  setCenterView("consultation");
                  addSystemLog("INFO", "GUI", "View changed: AI Architect Chat Console.");
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all uppercase tracking-wider flex items-center gap-1.5 ${centerView === "consultation" ? "bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 font-bold animate-pulse" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Sparkles size={12} />
                AI Architect Chat
              </button>
              <button
                onClick={() => {
                  setCenterView("providers");
                  addSystemLog("INFO", "GUI", "View changed: AI Provider Manager dashboard.");
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all uppercase tracking-wider flex items-center gap-1.5 ${centerView === "providers" ? "bg-[#18112d] text-purple-400 border border-purple-800/50 font-bold" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Server size={12} />
                AI Providers
              </button>
              <button
                onClick={() => {
                  setCenterView("context");
                  addSystemLog("INFO", "GUI", "View changed: Intelligent Context Manager pipeline.");
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all uppercase tracking-wider flex items-center gap-1.5 ${centerView === "context" ? "bg-[#0b1c1e] text-cyan-400 border border-cyan-900/50 font-bold animate-pulse" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Database size={12} />
                Context Manager
              </button>
              <button
                onClick={() => {
                  setCenterView("intent");
                  addSystemLog("INFO", "GUI", "View changed: Dynamic Cognitive Intent Analyzer gateway.");
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all uppercase tracking-wider flex items-center gap-1.5 ${centerView === "intent" ? "bg-[#1e1e0b] text-yellow-500 border border-yellow-900/50 font-bold animate-pulse" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Zap size={12} />
                Intent Analyzer
              </button>
              <button
                onClick={() => {
                  setCenterView("planner");
                  addSystemLog("INFO", "GUI", "View changed: Project Management Planner DAG engine.");
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all uppercase tracking-wider flex items-center gap-1.5 ${centerView === "planner" ? "bg-[#0b1e1e] text-emerald-400 border border-emerald-900/50 font-bold animate-pulse" : "text-slate-500 hover:text-slate-300"}`}
              >
                <ListTodo size={12} />
                Project Planner
              </button>
              <button
                onClick={() => {
                  setCenterView("router");
                  addSystemLog("INFO", "GUI", "View changed: Intelligent Routing Engine orchestration.");
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all uppercase tracking-wider flex items-center gap-1.5 ${centerView === "router" ? "bg-[#1e0b1e] text-fuchsia-400 border border-fuchsia-900/50 font-bold animate-pulse" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Shuffle size={12} />
                Intelligent Router
              </button>
              <button
                onClick={() => {
                  setCenterView("decision");
                  addSystemLog("INFO", "GUI", "View changed: Decision Engine solution arbiter.");
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all uppercase tracking-wider flex items-center gap-1.5 ${centerView === "decision" ? "bg-[#0b1b1b] text-teal-400 border border-teal-900/50 font-bold animate-pulse" : "text-slate-500 hover:text-slate-300"}`}
              >
                <CheckCircle size={12} />
                Decision Engine
              </button>
            </div>
            
            <div className="text-[10px] font-mono text-slate-600 bg-[#07070a] px-2 py-0.5 rounded border border-slate-950">
              {centerView === "decision" ? "SOVEREIGN_DECISION_ENGINE" : centerView === "router" ? "INTELLIGENT_ROUTING_CORE" : centerView === "planner" ? "PROJECT_PLANNER_DAG_ENGINE" : centerView === "intent" ? "COGNITIVE_INTENT_GATEWAY" : centerView === "context" ? "INTELLIGENT_CONTEXT_PIPELINE" : centerView === "flow" ? "DYNAMIC_BLUEPRINT_CANVAS" : centerView === "kernel" ? "KERNEL_LIFECYCLE_DAEMON" : centerView === "consultation" ? "GEMINI_COGNITIVE_SOCKET" : "PROVIDER_ROUTING_POOL"}
            </div>
          </div>

          {/* View 1: Flow Map Canvas */}
          {centerView === "flow" && (
            <div className="bg-[#07070a]/80 border border-slate-900 rounded-xl p-6 flex-1 flex flex-col items-center justify-center relative min-h-[450px] shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.06),transparent_70%)] pointer-events-none"></div>

              {/* Interactive Module Layout Canvas */}
              <div className="relative flex flex-col items-center w-full max-w-lg">
                
                {/* Upper modules row */}
                <div className="grid grid-cols-3 gap-3 w-full mb-6">
                  <div className={`p-2.5 rounded-lg border text-center transition-all ${selectedStackIds.includes("python") || selectedStackIds.includes("typescript") ? "bg-[#0b0b11] border-cyan-800/40" : "bg-[#050507] border-slate-950 opacity-40"}`}>
                    <div className="text-[9px] uppercase font-mono text-slate-500">Selected Core Runtime</div>
                    <div className="text-xs text-white font-bold truncate mt-0.5">
                      {selectedStackIds.includes("python") ? "Python 3.12+" : selectedStackIds.includes("typescript") ? "NodeJS ESM" : "Rust Kernel"}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-lg border text-center transition-all ${selectedStackIds.includes("fastapi") || selectedStackIds.includes("nestjs") ? "bg-[#0b0b11] border-cyan-800/40" : "bg-[#050507] border-slate-950 opacity-40"}`}>
                    <div className="text-[9px] uppercase font-mono text-slate-500">API Framework</div>
                    <div className="text-xs text-white font-bold truncate mt-0.5">
                      {selectedStackIds.includes("fastapi") ? "FastAPI ASGI" : "NestJS REST"}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-lg border text-center transition-all ${selectedStackIds.includes("yaml") || selectedStackIds.includes("sqlite_config") ? "bg-[#0b0b11] border-cyan-800/40" : "bg-[#050507] border-slate-950 opacity-40"}`}>
                    <div className="text-[9px] uppercase font-mono text-slate-500">Config Schema</div>
                    <div className="text-xs text-white font-bold truncate mt-0.5">
                      {selectedStackIds.includes("yaml") ? "Pydantic YAML" : "SQLite DB KV"}
                    </div>
                  </div>
                </div>

                {/* Central Circle Core Node */}
                <div className="relative flex items-center justify-center my-6">
                  
                  {/* Decorative pulse glow background */}
                  <div className="absolute w-60 h-60 rounded-full border border-cyan-500/10 animate-ping opacity-20 pointer-events-none"></div>
                  
                  <div className="w-56 h-56 rounded-full border border-cyan-500/20 flex items-center justify-center p-4 bg-black/40 shadow-inner">
                    <div className="w-44 h-44 rounded-full border-2 border-cyan-500/30 flex items-center justify-center p-4 bg-cyan-950/10 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative group cursor-pointer hover:border-cyan-400 transition-colors">
                      
                      <div className="absolute -top-3 px-2 bg-slate-950 border border-cyan-800/60 rounded text-[9px] font-mono text-cyan-400 uppercase tracking-widest">
                        Orchestrator
                      </div>

                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto mb-2">
                          <Cpu size={24} className="animate-spin" style={{ animationDuration: "12s" }} />
                        </div>
                        <span className="text-2xl font-mono tracking-tighter text-white font-bold block">ALL-IN-ONE</span>
                        <span className="text-[9px] tracking-[0.3em] text-cyan-500 font-bold block mt-0.5 uppercase">SYSTEM KERNEL</span>
                      </div>
                    </div>
                  </div>

                  {/* Absolute positioning tags showcasing links in architecture */}
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 bg-[#0a0a0f] border border-slate-900 rounded text-[10px] font-mono text-slate-400 flex items-center gap-1.5 shadow-lg">
                    <Database size={10} className="text-cyan-500" /> Storage Pipeline
                  </div>
                  <div className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 bg-[#0a0a0f] border border-slate-900 rounded text-[10px] font-mono text-slate-400 flex items-center gap-1.5 shadow-lg">
                    <Shield size={10} className="text-amber-500" /> Security Fence
                  </div>
                </div>

                {/* Lower databases row */}
                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                  <div className={`p-3 rounded-lg border transition-all ${selectedStackIds.includes("sqlite") || selectedStackIds.includes("postgresql") ? "bg-[#0b0b11] border-cyan-800/40" : "bg-[#050507] border-slate-950 opacity-40"}`}>
                    <div className="text-[9px] uppercase font-mono text-slate-500">Relational Database</div>
                    <div className="text-xs text-white font-bold mt-1">
                      {selectedStackIds.includes("sqlite") ? "SQLite (WAL Mode)" : "PostgreSQL Database"}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {selectedStackIds.includes("sqlite") ? "Zero network overhead, file-based embedded store" : "Heavy enterprise concurrency support"}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border transition-all ${selectedStackIds.includes("chromadb") || selectedStackIds.includes("qdrant") ? "bg-[#0b0b11] border-cyan-800/40" : "bg-[#050507] border-slate-950 opacity-40"}`}>
                    <div className="text-[9px] uppercase font-mono text-slate-500">Semantic Vector Store</div>
                    <div className="text-xs text-white font-bold mt-1">
                      {selectedStackIds.includes("chromadb") ? "ChromaDB Embedded" : "Qdrant Vector Server"}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {selectedStackIds.includes("chromadb") ? "Fast in-memory cosine matching of project code snippets" : "Distributed high density indexer"}
                    </div>
                  </div>
                </div>

                {/* Descriptive banner */}
                <div className="mt-8 bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-[11px] text-slate-400 leading-relaxed text-center w-full">
                  <span className="text-cyan-400 font-bold font-mono mr-1">COGNITIVE PATH:</span> 
                  User Instruction is parsed by the <span className="text-white font-mono">Planner</span>, routed through the <span className="text-white font-mono">Model Router</span>, executed inside a restricted <span className="text-amber-500 font-mono">Security Sandbox</span>, indexed in the <span className="text-white font-mono">Memory Vault</span>, and safely committed via the <span className="text-white font-mono">GitHub Engine</span>.
                </div>

              </div>
            </div>
          )}

          {/* View 1.5: Kernel Lifecycle Control Console */}
          {centerView === "kernel" && (
            <div className="bg-[#0b0b11] border border-slate-900 rounded-xl p-4 flex-1 flex flex-col min-h-[500px] shadow-lg text-left">
              
              {/* Header: Status bar */}
              <div className="bg-black/40 border border-slate-950 p-3 rounded-lg mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded bg-slate-900 border ${kernelBootState === "running" ? "border-emerald-800/40 text-emerald-400" : kernelBootState === "booting" ? "border-cyan-800/40 text-cyan-400" : kernelBootState === "crashed" ? "border-rose-950 text-rose-500" : kernelBootState === "rollback_active" ? "border-amber-950 text-amber-500" : "border-slate-800 text-slate-500"}`}>
                    <Cpu size={16} className={kernelBootState === "booting" ? "animate-spin" : kernelBootState === "running" ? "animate-pulse" : ""} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Kernel State Manager</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${kernelBootState === "running" ? "bg-emerald-500 animate-ping" : kernelBootState === "booting" ? "bg-cyan-500 animate-pulse" : kernelBootState === "crashed" ? "bg-rose-500" : kernelBootState === "rollback_active" ? "bg-amber-500 animate-bounce" : "bg-slate-600"}`} />
                      <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                        {kernelBootState === "uninitialized" && "COLD_STANDBY / IDLE"}
                        {kernelBootState === "booting" && "BOOT_SEQUENCE_ACTIVE"}
                        {kernelBootState === "running" && "SYS_READY / DAEMON_ONLINE"}
                        {kernelBootState === "rollback_active" && "SAFE_ROLLBACK_IN_PROGRESS"}
                        {kernelBootState === "crashed" && "SYS_HALTED / DIAG_CRITICAL"}
                        {kernelBootState === "shutting_down" && "GRACEFUL_SHUTDOWN_ACTIVE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-tab selection buttons */}
                <div className="flex bg-black p-1 rounded border border-slate-900">
                  <button
                    onClick={() => setKernelConsoleTab("lifecycle")}
                    className={`px-3 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 ${kernelConsoleTab === "lifecycle" ? "bg-cyan-950/80 text-cyan-400 border border-cyan-800/50" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    <Layers size={11} />
                    Lifecycle
                  </button>
                  <button
                    onClick={() => setKernelConsoleTab("eventbus")}
                    className={`px-3 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 ${kernelConsoleTab === "eventbus" ? "bg-cyan-950/80 text-cyan-400 border border-cyan-800/50" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    <Network size={11} />
                    Event Bus
                  </button>
                </div>
              </div>

              {kernelConsoleTab === "lifecycle" ? (
                <>
                  {/* FAULT SIMULATOR BAR */}
                  <div className="bg-black/30 border border-slate-900/50 p-2 rounded-lg mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-amber-500" />
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Fault Simulator:</span>
                    </div>
                    <select
                      value={bootFailSimulationModule}
                      onChange={(e) => setBootFailSimulationModule(e.target.value as any)}
                      disabled={kernelBootState === "booting" || kernelBootState === "running" || kernelBootState === "shutting_down"}
                      className="bg-black border border-slate-900 text-[10px] font-mono text-cyan-400 p-1 rounded focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                    >
                      <option value="none">No Fault (Success Boot)</option>
                      <option value="config">Fault on Configuration Service</option>
                      <option value="security">Fault on Security Guard</option>
                      <option value="memory">Fault on Long-Term Memory</option>
                    </select>
                  </div>

                  {/* Main controls & priority sequence side-by-side */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                    
                    {/* Left controls column */}
                    <div className="md:col-span-5 flex flex-col gap-3">
                      <div className="bg-[#07070a] border border-slate-950 p-3 rounded-lg flex-1 flex flex-col justify-center">
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2.5 font-bold">Orchestrator Controls</h3>
                        
                        <div className="flex flex-col gap-2">
                          {kernelBootState === "uninitialized" || kernelBootState === "crashed" ? (
                            <button
                              onClick={startKernelBootstrapSimulation}
                              disabled={kernelBootState === "booting"}
                              className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 font-mono text-xs font-bold rounded transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                            >
                              <Play size={13} className="fill-cyan-400" />
                              Bootstrap System
                            </button>
                          ) : kernelBootState === "running" ? (
                            <button
                              onClick={startKernelShutdownSimulation}
                              className="w-full py-2 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-900/60 text-amber-400 font-mono text-xs font-bold rounded transition-all flex items-center justify-center gap-2"
                            >
                              <Lock size={13} />
                              Shutdown Gracefully
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-500 font-mono text-xs font-bold rounded flex items-center justify-center gap-2 cursor-not-allowed"
                            >
                              <RefreshCw size={13} className="animate-spin" />
                              Orchestrating...
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setKernelBootState("uninitialized");
                              setActiveBootStep(-1);
                              setKernelLogs([
                                "[SYSTEM] Kernel Service Registry waiting for boot trigger...",
                                "[SYSTEM] Ready to simulate linear sequences."
                              ]);
                              setKernelUptime(0);
                              setEventsProcessed(0);
                              addSystemLog("INFO", "KERNEL", "Kernel control state reset by user.");
                            }}
                            disabled={kernelBootState === "booting" || kernelBootState === "shutting_down"}
                            className="w-full py-2 bg-black hover:bg-slate-950 border border-slate-900 text-slate-400 font-mono text-xs rounded transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                          >
                            <RefreshCw size={12} />
                            Reset Core Registry
                          </button>
                        </div>

                        {bootFailSimulationModule !== "none" && (
                          <div className="mt-3 p-2 bg-amber-950/20 border border-amber-900/30 rounded text-[10px] text-amber-500 leading-relaxed font-mono">
                            <AlertTriangle size={12} className="inline mr-1" />
                            A fatal fault is armed to inject on the next boot sequence.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right linear Priority sequence column */}
                    <div className="md:col-span-7 bg-[#07070a] border border-slate-950 p-3 rounded-lg flex flex-col justify-between">
                      <div>
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 font-bold">Subsystem Priority Boot Matrix</h3>
                        <p className="text-[9px] text-slate-500 leading-tight mb-2.5">Lower priority values bootstrap first.</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
                        {[
                          { label: "Logger Service", pri: "P: 10", stepIdx: 0, id: "logger" },
                          { label: "Config Loader", pri: "P: 20", stepIdx: 1, id: "config" },
                          { label: "Unified Event Bus", pri: "P: 30", stepIdx: 2, id: "event_bus" },
                          { label: "Security Guard", pri: "P: 40", stepIdx: 3, id: "security" },
                          { label: "Workspace Mgr", pri: "P: 50", stepIdx: 4, id: "workspace" },
                          { label: "Memory (SQLite)", pri: "P: 60", stepIdx: 5, id: "memory" },
                          { label: "AI Provider Mgr", pri: "P: 70", stepIdx: 6, id: "providers" },
                          { label: "Plugin SDK Reg", pri: "P: 80", stepIdx: 7, id: "plugins" }
                        ].map((item) => {
                          const isActive = activeBootStep === item.stepIdx && (kernelBootState === "booting" || kernelBootState === "rollback_active");
                          const isCompleted = (activeBootStep > item.stepIdx && kernelBootState === "running") || (kernelBootState === "running") || (kernelBootState === "shutting_down");
                          const isFailedStep = kernelBootState === "crashed" && bootFailSimulationModule === item.id;
                          
                          return (
                            <div
                              key={item.label}
                              className={`p-1.5 rounded border flex items-center justify-between transition-all ${
                                isFailedStep
                                  ? "bg-rose-950/20 border-rose-900/60 text-rose-400"
                                  : isActive
                                  ? "bg-cyan-950/30 border-cyan-500 text-cyan-300 animate-pulse font-bold"
                                  : isCompleted
                                  ? "bg-slate-950 border-emerald-950/50 text-emerald-500/90"
                                  : "bg-black/40 border-slate-900/60 text-slate-500"
                              }`}
                            >
                              <span className="truncate">{item.label}</span>
                              <span className="text-[8px] bg-slate-900 px-1 rounded text-slate-400">{item.pri}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Live Terminal Logger Box */}
                  <div className="flex-1 min-h-[140px] max-h-[180px] bg-black border border-slate-950 rounded-lg p-2.5 font-mono text-[10px] text-slate-300 flex flex-col mb-4 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[9px] uppercase font-bold tracking-wider">
                        <TerminalIcon size={11} className="text-cyan-500" />
                        Structured Log Trace
                      </div>
                      <div className="text-[8px] text-slate-600 font-mono">SYS_CONSOLE_OUT</div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-left scrollbar-thin select-text selection:bg-cyan-950">
                      {kernelLogs.map((logLine, idx) => {
                        let colorClass = "text-slate-400";
                        if (logLine.includes("[CRITICAL]") || logLine.includes("[FATAL]")) {
                          colorClass = "text-rose-500 font-bold bg-rose-950/10 px-1 rounded border border-rose-900/30";
                        } else if (logLine.includes("[SYS]")) {
                          colorClass = "text-cyan-400";
                        } else if (logLine.includes("[INFO]")) {
                          colorClass = "text-slate-300";
                        } else if (logLine.includes("ROLLBACK")) {
                          colorClass = "text-amber-500";
                        }
                        return (
                          <div key={idx} className={`${colorClass} leading-relaxed break-all`}>
                            {logLine}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Diagnostic Metrics Bento Grid */}
                  <div>
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 font-bold">Diagnostic Telemetry Sensors</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                      {/* Metric 1 */}
                      <div className="bg-[#07070a] border border-slate-950 p-2.5 rounded-lg flex flex-col justify-between">
                        <span className="text-[9px] text-slate-500 font-mono uppercase">Uptime Monitor</span>
                        <span className="text-sm font-bold text-white font-mono mt-1">
                          {kernelBootState === "running" ? `${kernelUptime}s` : "0s"}
                        </span>
                        <span className="text-[8px] text-slate-600 font-mono mt-0.5">Ticking active daemon</span>
                      </div>

                      {/* Metric 2 */}
                      <div className="bg-[#07070a] border border-slate-950 p-2.5 rounded-lg flex flex-col justify-between">
                        <span className="text-[9px] text-slate-500 font-mono uppercase">Memory Overhead</span>
                        <span className="text-sm font-bold text-white font-mono mt-1">
                          {kernelBootState === "running" ? `${memUsage}.4 MB` : "0.0 MB"}
                        </span>
                        <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-500"
                            style={{ width: kernelBootState === "running" ? "35%" : "0%" }}
                          />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className="bg-[#07070a] border border-slate-950 p-2.5 rounded-lg flex flex-col justify-between">
                        <span className="text-[9px] text-slate-500 font-mono uppercase">CPU Core Usage</span>
                        <span className="text-sm font-bold text-white font-mono mt-1">
                          {kernelBootState === "running" ? `${cpuUsage}%` : "0%"}
                        </span>
                        <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-cyan-500 h-full transition-all duration-300"
                            style={{ width: `${cpuUsage}%` }}
                          />
                        </div>
                      </div>

                      {/* Metric 4 */}
                      <div className="bg-[#07070a] border border-slate-950 p-2.5 rounded-lg flex flex-col justify-between">
                        <span className="text-[9px] text-slate-500 font-mono uppercase">Event Bus Traffic</span>
                        <span className="text-sm font-bold text-white font-mono mt-1">
                          {kernelBootState === "running" ? eventsProcessed : "0"}
                        </span>
                        <span className="text-[8px] text-emerald-500 font-mono mt-0.5">
                          {kernelBootState === "running" ? "● Publish/Sub Active" : "Bus cold standby"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // EVENT BUS SIMULATOR LAYOUT
                <div className="flex-1 flex flex-col gap-4">
                  
                  {/* Event Bus Metrics Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#07070a] border border-slate-950 p-2.5 rounded-lg flex flex-col">
                      <span className="text-[9px] text-slate-500 font-mono uppercase">Published Events</span>
                      <span className="text-sm font-bold text-cyan-400 font-mono mt-1">{ebMetrics.published}</span>
                    </div>
                    <div className="bg-[#07070a] border border-slate-950 p-2.5 rounded-lg flex flex-col">
                      <span className="text-[9px] text-slate-500 font-mono uppercase">Isolated Failures</span>
                      <span className="text-sm font-bold text-rose-500 font-mono mt-1">{ebMetrics.failed}</span>
                    </div>
                    <div className="bg-[#07070a] border border-slate-950 p-2.5 rounded-lg flex flex-col">
                      <span className="text-[9px] text-slate-500 font-mono uppercase">Avg Bus Latency</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono mt-1">{ebMetrics.latencyAvg} ms</span>
                    </div>
                    <div className="bg-[#07070a] border border-slate-950 p-2.5 rounded-lg flex flex-col">
                      <span className="text-[9px] text-slate-500 font-mono uppercase">Active Subscribers</span>
                      <span className="text-sm font-bold text-white font-mono mt-1">{ebActiveSubscribersCount}</span>
                    </div>
                  </div>

                  {/* Main dual-pane area */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
                    
                    {/* Left Pane: Dispatch Form (Col Span 5) */}
                    <div className="lg:col-span-5 flex flex-col gap-3">
                      <div className="bg-[#07070a] border border-[#13131a] p-3 rounded-lg flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Event Generator</h3>
                            <span className="text-[8px] bg-cyan-950/40 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-900/30 font-mono uppercase">REST SDK / Local Host</span>
                          </div>

                          <div className="space-y-3 font-mono text-[11px]">
                            {/* Category selector */}
                            <div>
                              <label className="text-slate-500 text-[10px] block mb-1 uppercase">1. Event Category (Namespace)</label>
                              <select
                                value={ebEventCategory}
                                onChange={(e) => {
                                  const cat = e.target.value;
                                  setEbEventCategory(cat);
                                  // Update types and default payloads automatically
                                  if (cat === "system") {
                                    setEbEventType("system:heartbeat");
                                    setEbEventPayload('{\n  "status": "healthy",\n  "active_sessions": 2,\n  "load_index": 0.04\n}');
                                  } else if (cat === "workspace") {
                                    setEbEventType("workspace:sync_completed");
                                    setEbEventPayload('{\n  "sync_duration_ms": 142,\n  "files_written": 4,\n  "branch": "main"\n}');
                                  } else if (cat === "security") {
                                    setEbEventType("security:block_command");
                                    setEbEventPayload('{\n  "command": "rm -rf /",\n  "reason": "Dangerous recursive path delete detected",\n  "policy_violation": true\n}');
                                  } else if (cat === "memory") {
                                    setEbEventType("memory:vector_saved");
                                    setEbEventPayload('{\n  "vector_id": "vec_d78a9c",\n  "embedding_dimension": 1536,\n  "text_preview": "class EventBus implements IEventBus..."\n}');
                                  } else if (cat === "providers") {
                                    setEbEventType("providers:rate_limit_near");
                                    setEbEventPayload('{\n  "provider": "gemini",\n  "tokens_remaining": 4500,\n  "window_seconds": 60\n}');
                                  } else if (cat === "execution") {
                                    setEbEventType("execution:command_start");
                                    setEbEventPayload('{\n  "subprocess_id": "proc_831",\n  "command_line": "npm run build",\n  "env": "production"\n}');
                                  } else if (cat === "plugin") {
                                    setEbEventType("plugin:loaded");
                                    setEbEventPayload('{\n  "plugin_id": "plugin_git_copilot",\n  "version": "1.2.0",\n  "endpoints_registered": 3\n}');
                                  }
                                }}
                                className="w-full bg-black border border-slate-900 rounded p-1.5 text-slate-300 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                              >
                                <option value="security">security</option>
                                <option value="system">system</option>
                                <option value="workspace">workspace</option>
                                <option value="memory">memory</option>
                                <option value="providers">providers</option>
                                <option value="execution">execution</option>
                                <option value="plugin">plugin</option>
                              </select>
                            </div>

                            {/* Event Type */}
                            <div>
                              <label className="text-slate-500 text-[10px] block mb-1 uppercase">2. Event Type</label>
                              <input
                                type="text"
                                value={ebEventType}
                                onChange={(e) => setEbEventType(e.target.value)}
                                className="w-full bg-black border border-slate-900 rounded p-1.5 text-cyan-400 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                              />
                            </div>

                            {/* Event Priority */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-slate-500 text-[10px] uppercase">3. Event Priority (1-100)</label>
                                <span className="text-cyan-400 text-xs font-bold">{ebEventPriority}</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={ebEventPriority}
                                onChange={(e) => setEbEventPriority(parseInt(e.target.value))}
                                className="w-full accent-cyan-500 bg-slate-950 cursor-pointer h-1.5 rounded-lg"
                              />
                            </div>

                            {/* Payload Area */}
                            <div>
                              <label className="text-slate-500 text-[10px] block mb-1 uppercase">4. Payload Object (JSON format)</label>
                              <textarea
                                value={ebEventPayload}
                                onChange={(e) => setEbEventPayload(e.target.value)}
                                rows={5}
                                className="w-full bg-black border border-slate-900 rounded p-1.5 text-slate-400 focus:outline-none focus:border-cyan-500 font-mono text-[10px] leading-relaxed resize-none h-24"
                              />
                            </div>

                            {/* Fault Injector Toggle */}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="checkbox"
                                id="injectError"
                                checked={ebSimulateSubscriberError}
                                onChange={(e) => setEbSimulateSubscriberError(e.target.checked)}
                                className="rounded border-slate-900 bg-black text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                              />
                              <label htmlFor="injectError" className="text-[10px] text-amber-500 font-mono cursor-pointer flex items-center gap-1">
                                <AlertTriangle size={11} className="inline animate-pulse" />
                                Simulate Subscriber Failure (Test Isolation)
                              </label>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={triggerEventBusPublishSimulation}
                          disabled={ebIsDispatching}
                          className="w-full mt-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 font-mono text-xs font-bold rounded transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(6,182,212,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Network size={13} className={ebIsDispatching ? "animate-spin" : ""} />
                          {ebIsDispatching ? "Dispatching..." : "Publish Event"}
                        </button>
                      </div>
                    </div>

                    {/* Right Pane: Logs & Event Archive (Col Span 7) */}
                    <div className="lg:col-span-7 flex flex-col gap-3 min-h-[350px]">
                      
                      {/* Sub-Pane 1: Dispatch Pipeline console (height-controlled) */}
                      <div className="bg-black border border-[#13131a] rounded-lg p-3 flex-1 flex flex-col min-h-[160px] max-h-[220px] overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">
                            <TerminalIcon size={12} className="text-cyan-500" />
                            9-Stage Pipeline Logs
                          </div>
                          <span className="text-[8px] text-slate-600 font-mono">BROKER_ENGINE</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-left font-mono text-[10px] scrollbar-thin select-text">
                          {ebDispatchLogs.map((log, idx) => {
                            let cl = "text-slate-400";
                            if (log.includes("[PUBLISH]")) cl = "text-cyan-400 font-bold border-l-2 border-cyan-500 pl-1.5";
                            else if (log.includes("[CRITICAL]")) cl = "text-rose-500 bg-rose-950/20 px-1 rounded border border-rose-900/30";
                            else if (log.includes("[SECURE ISOLATION]")) cl = "text-emerald-400 font-bold bg-emerald-950/10 px-1 rounded border border-emerald-900/30";
                            else if (log.includes("COMPLETE")) cl = "text-emerald-400 font-bold";
                            else if (log.includes("• Subscriber")) cl = "text-slate-500 pl-4";
                            else if (log.includes("[6. MATCHED]") || log.includes("[7. PRIORITY SORT]")) cl = "text-yellow-500/90";
                            return (
                              <div key={idx} className={`${cl} leading-relaxed break-all`}>
                                {log}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sub-Pane 2: Universal Event Registry (History) */}
                      <div className="bg-[#07070a] border border-[#13131a] rounded-lg p-3 flex-1 flex flex-col min-h-[160px] overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2">
                          <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Universal Event History Registry</h3>
                          <button
                            onClick={() => {
                              setEbEvents([]);
                              setSelectedEbEvent(null);
                              addSystemLog("INFO", "EVENT_BUS", "Event bus historical records cleared.");
                            }}
                            className="text-[9px] font-mono text-slate-600 hover:text-slate-400 transition-colors uppercase"
                          >
                            [Clear History]
                          </button>
                        </div>

                        {ebEvents.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center text-center text-slate-600 font-mono text-[10px]">
                            No events currently in local history buffer.
                          </div>
                        ) : (
                          <div className="flex-1 flex gap-3 overflow-hidden">
                            {/* List of events */}
                            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                              {ebEvents.map((evt) => (
                                <button
                                  key={evt.event_id}
                                  onClick={() => setSelectedEbEvent(evt)}
                                  className={`w-full text-left p-1.5 rounded border font-mono text-[9px] transition-all flex items-center justify-between gap-1.5 ${
                                    selectedEbEvent?.event_id === evt.event_id
                                      ? "bg-cyan-950/30 border-cyan-500/60 text-white"
                                      : "bg-black border-slate-900 text-slate-400 hover:border-slate-800"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      evt.source_module === "security" ? "bg-amber-500" :
                                      evt.source_module === "system" ? "bg-cyan-500" :
                                      evt.source_module === "workspace" ? "bg-blue-500" :
                                      evt.source_module === "memory" ? "bg-emerald-500" : "bg-slate-500"
                                    }`} />
                                    <span className="font-bold truncate">{evt.event_type}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
                                    <span>P:{evt.priority}</span>
                                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                </button>
                              ))}
                            </div>

                            {/* Click detail panel */}
                            <div className="w-[180px] shrink-0 bg-black/60 border border-slate-900 rounded p-2 overflow-y-auto text-left scrollbar-thin flex flex-col font-mono text-[8px] leading-relaxed">
                              {selectedEbEvent ? (
                                <div className="space-y-2">
                                  <div className="border-b border-slate-900 pb-1 flex justify-between">
                                    <span className="text-cyan-400 font-bold uppercase">Event Metadata</span>
                                    <button onClick={() => setSelectedEbEvent(null)} className="text-slate-600 hover:text-white">[X]</button>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 uppercase block">Event ID:</span>
                                    <span className="text-slate-300 break-all">{selectedEbEvent.event_id}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 uppercase block">Correlation ID:</span>
                                    <span className="text-slate-300 break-all">{selectedEbEvent.correlation_id}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 uppercase block">Payload:</span>
                                    <pre className="text-emerald-400 text-[8px] bg-black p-1 rounded overflow-x-auto whitespace-pre-wrap leading-tight break-all border border-slate-950">
                                      {JSON.stringify(selectedEbEvent.payload, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 uppercase block">Origin metadata:</span>
                                    <span className="text-slate-400 block">Env: {selectedEbEvent.metadata.environment}</span>
                                    {selectedEbEvent.metadata.user_email && <span className="text-slate-400 block truncate">User: {selectedEbEvent.metadata.user_email}</span>}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center text-center text-slate-600">
                                  Select an event to view full JSON payload & telemetry parameters.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* View 2: AI Architect Consultation Chat */}
          {centerView === "consultation" && (
            <div className="bg-[#0b0b11] border border-slate-900 rounded-xl p-4 flex-1 flex flex-col min-h-[450px] max-h-[550px]">
              
              {/* Chat info banner */}
              <div className="bg-[#07070a] border border-slate-950 p-2.5 rounded-lg mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles size={14} className="text-cyan-400 animate-pulse" />
                  <div>
                    <span className="text-slate-200 font-medium font-mono">Consultative Chat Module</span>
                    <span className="text-[9px] text-slate-500 block">Direct pipeline to Gemini 3.5 LLM system architect</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setChatMessages([
                      {
                        role: "assistant",
                        content: "Architecture context state reset. How else can I help design the ALL-IN-ONE foundation?"
                      }
                    ]);
                    addSystemLog("INFO", "ROUTER", "Consultation chat history cleared.");
                  }}
                  className="p-1 text-slate-500 hover:text-white hover:bg-slate-900 rounded transition-colors text-[10px] uppercase font-mono flex items-center gap-1"
                  title="Clear Conversation"
                >
                  <RefreshCw size={10} /> Clear
                </button>
              </div>

              {/* Chat messages stream */}
              <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-black/40 border border-slate-950 rounded-lg max-h-[350px]">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col max-w-[90%] text-xs p-3 rounded-lg leading-relaxed ${msg.role === "user" ? "ml-auto bg-cyan-950/30 border border-cyan-800/40 text-slate-200" : msg.role === "system" ? "mx-auto bg-amber-950/20 border border-amber-900/40 text-amber-300 font-mono" : "mr-auto bg-[#0d0d14] border border-slate-900 text-slate-300"}`}
                  >
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500 mb-1">
                      <span>{msg.role === "user" ? "USER_ENGINEER" : msg.role === "system" ? "SANDBOX_ALERT" : "PRINCIPAL_AI_ARCHITECT"}</span>
                    </div>
                    <p className="whitespace-pre-line font-sans">{msg.content}</p>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="mr-auto bg-[#0d0d14] border border-slate-900 text-slate-400 text-xs p-3 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]"></span>
                    <span className="font-mono text-[10px] text-slate-500">Synthesizing design patterns...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input field */}
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendChat();
                  }}
                  placeholder="Ask about performance, folder layout, model routing, or plugin safety..."
                  className="flex-1 bg-black/80 border border-slate-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  disabled={isChatLoading}
                />
                <button
                  onClick={handleSendChat}
                  className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-400 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                  disabled={isChatLoading}
                >
                  <Send size={12} /> Send
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="text-[9px] text-slate-500 uppercase font-mono py-1">Quick Prompts:</span>
                <button
                  onClick={() => setChatInput("Explain how the Event Bus orchestrates modules.")}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-[10px] text-slate-400 transition-colors"
                >
                  Event Bus
                </button>
                <button
                  onClick={() => setChatInput("What are the trade-offs of SQLite WAL mode versus PostgreSQL for local operations?")}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-[10px] text-slate-400 transition-colors"
                >
                  SQLite vs. Postgres
                </button>
                <button
                  onClick={() => setChatInput("Suggest custom security rules for terminal operations.")}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-[10px] text-slate-400 transition-colors"
                >
                  Sandbox Policy
                </button>
              </div>

            </div>
          )}

          {/* View 4: AI Provider Manager & Resilient Sandbox Broker */}
          {centerView === "providers" && (
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Provider Quick Stats Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                <div className="bg-[#07070a] border border-slate-900 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Active Model Pool</span>
                  <span className="text-sm font-bold text-purple-400 font-mono mt-1">14 Models registered</span>
                </div>
                <div className="bg-[#07070a] border border-slate-900 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Avg Gate Latency</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-1">185 ms</span>
                </div>
                <div className="bg-[#07070a] border border-slate-900 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Uptime Score</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono mt-1">99.98%</span>
                </div>
                <div className="bg-[#07070a] border border-slate-900 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Active Circuit Breakers</span>
                  <span className="text-sm font-bold text-amber-500 font-mono mt-1">
                    {providers.filter(p => p.status === ProviderStatus.ERROR_COOLDOWN).length > 0 ? "1 COOLDOWN" : "0 TRIPPED"}
                  </span>
                </div>
              </div>

              {/* Main Dual-Pane layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 text-left">
                
                {/* Left Pane: Registry & Capability Filter (Col Span 5) */}
                <div className="lg:col-span-5 flex flex-col gap-3">
                  <div className="bg-[#07070a] border border-slate-900 p-3 rounded-lg flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
                      <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Capabilities Registry</h3>
                      <span className="text-[8px] bg-purple-950/40 text-purple-400 px-1.5 py-0.5 rounded border border-purple-900/30 font-mono uppercase">SOLID OCP compliant</span>
                    </div>

                    {/* Capability Filter Tabs */}
                    <div className="flex flex-wrap gap-1 mb-4 font-mono text-[9px]">
                      {["All", "Coding", "Reasoning", "Vision", "StructuredOutput", "Offline"].map((cap) => (
                        <button
                          key={cap}
                          onClick={() => setCapabilityFilter(cap)}
                          className={`px-2 py-1 rounded transition-colors ${capabilityFilter === cap ? "bg-[#18112d] text-purple-400 border border-purple-800/40" : "bg-slate-900/40 text-slate-400 border border-transparent hover:bg-slate-900"}`}
                        >
                          {cap}
                        </button>
                      ))}
                    </div>

                    {/* Active Providers List */}
                    <div className="space-y-2 overflow-y-auto max-h-[380px] flex-1 pr-1">
                      {providers
                        .filter(p => {
                          if (capabilityFilter === "All") return true;
                          const capEnum = capabilityFilter as AICapability;
                          return p.supportedCapabilities.includes(capEnum);
                        })
                        .map((prov) => {
                          const isSelected = selectedProviderId === prov.id;
                          return (
                            <div
                              key={prov.id}
                              onClick={() => setSelectedProviderId(prov.id)}
                              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${isSelected ? "bg-[#18112d]/10 border-purple-800/60" : "bg-black/20 border-slate-900 hover:bg-[#0c0c12]"}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${prov.status === ProviderStatus.ENABLED ? "bg-emerald-500 animate-pulse" : prov.status === ProviderStatus.ERROR_COOLDOWN ? "bg-amber-500 animate-ping" : "bg-slate-600"}`}></span>
                                  <span className="text-xs font-bold text-white font-mono">{prov.name}</span>
                                </div>
                                <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${prov.status === ProviderStatus.ENABLED ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400" : prov.status === ProviderStatus.ERROR_COOLDOWN ? "bg-amber-950/20 border-amber-900/30 text-amber-400" : "bg-slate-950 border-slate-900 text-slate-500"}`}>
                                  {prov.status === ProviderStatus.ENABLED ? "ACTIVE" : prov.status === ProviderStatus.ERROR_COOLDOWN ? "COOLDOWN" : "DISABLED"}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5 mt-2.5 text-[9px] font-mono text-slate-500">
                                <div className="flex flex-col">
                                  <span>AVG LATENCY</span>
                                  <span className="text-slate-300 font-bold">{prov.metrics.avgLatencyMs} ms</span>
                                </div>
                                <div className="flex flex-col">
                                  <span>RELIABILITY</span>
                                  <span className="text-slate-300 font-bold">{(prov.metrics.reliabilityScore * 100).toFixed(0)}%</span>
                                </div>
                              </div>

                              {/* Capability Icons row */}
                              <div className="flex flex-wrap gap-1 mt-2.5">
                                {prov.supportedCapabilities.map(cap => (
                                  <span key={cap} className="text-[7px] font-mono uppercase bg-slate-950 border border-slate-900 text-slate-400 px-1 rounded-sm">
                                    {cap}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Right Pane: Interactive Playground / Detailed Settings (Col Span 7) */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                  
                  {/* Provider Detail Pane */}
                  <div className="bg-[#07070a] border border-slate-900 p-3 rounded-lg flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2">
                        <Server size={14} className="text-purple-400" />
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Resilient Sandbox Broker</h3>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[9px]">
                        <span className="text-slate-500">OUTAGE EMULATION</span>
                        <button
                          onClick={() => setSimulateOutages(!simulateOutages)}
                          className={`w-8 h-4 rounded-full transition-all relative ${simulateOutages ? "bg-rose-500" : "bg-slate-800"}`}
                        >
                          <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${simulateOutages ? "left-4" : "left-0.5"}`}></span>
                        </button>
                      </div>
                    </div>

                    {/* Resilient Broker Panel content */}
                    <div className="flex-1 flex flex-col gap-3 font-mono text-[11px] text-slate-300">
                      
                      {/* Select Capabilities */}
                      <div>
                        <span className="text-slate-500 text-[9px] block mb-1 uppercase">1. Require Capabilities</span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.values(AICapability).map((cap) => {
                            const isSelected = requiredCaps.includes(cap);
                            return (
                              <button
                                key={cap}
                                onClick={() => {
                                  if (isSelected) {
                                    setRequiredCaps(requiredCaps.filter(c => c !== cap));
                                  } else {
                                    setRequiredCaps([...requiredCaps, cap]);
                                  }
                                }}
                                className={`px-2 py-1 rounded border text-[9px] transition-all cursor-pointer ${isSelected ? "bg-[#18112d] text-purple-400 border-purple-800/50 font-bold" : "bg-black/20 border-slate-900 text-slate-500 hover:text-slate-400"}`}
                              >
                                {cap}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Select Preference */}
                      <div>
                        <span className="text-slate-500 text-[9px] block mb-1 uppercase">2. Router Path Optimization Metric</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "none", label: "Reliability Weight" },
                            { id: "cost", label: "Lowest Cost" },
                            { id: "offline", label: "Offline First" }
                          ].map(pref => (
                            <button
                              key={pref.id}
                              onClick={() => setSimPreference(pref.id as any)}
                              className={`p-1.5 rounded border text-center text-[10px] transition-all cursor-pointer ${simPreference === pref.id ? "bg-[#18112d] border-purple-850 text-purple-400 font-bold" : "bg-black/20 border-slate-900 text-slate-500 hover:bg-slate-900/10"}`}
                            >
                              {pref.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Playground Prompt */}
                      <div>
                        <span className="text-slate-500 text-[9px] block mb-1 uppercase">3. Prompt Request</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={simulationPrompt}
                            onChange={(e) => setSimulationPrompt(e.target.value)}
                            className="flex-1 bg-black border border-slate-900 rounded p-1.5 text-xs focus:outline-none focus:border-purple-500"
                            placeholder="Draft code, query database parameters, execute workspace commands..."
                          />
                          <button
                            onClick={handleExecuteBrokerSimulation}
                            disabled={isSimulatingBroker}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 uppercase cursor-pointer ${isSimulatingBroker ? "bg-slate-900 text-slate-500 cursor-not-allowed" : "bg-[#18112d] hover:bg-purple-900/20 text-purple-400 border border-purple-800/60"}`}
                          >
                            <Shuffle size={11} className={isSimulatingBroker ? "animate-spin" : ""} />
                            {isSimulatingBroker ? "Routing..." : "Broker Request"}
                          </button>
                        </div>
                      </div>

                      {/* Dual split: Terminal Logs vs. Output result */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-[160px]">
                        
                        {/* Terminal Logs */}
                        <div className="flex flex-col bg-black border border-slate-900 rounded p-2 text-[10px] font-mono text-slate-400">
                          <span className="text-slate-500 text-[8px] uppercase tracking-wider mb-1 flex items-center gap-1 border-b border-slate-950 pb-1">
                            <History size={9} /> Resilient Trace Console
                          </span>
                          <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-left select-none max-h-[140px]">
                            {providerSimLogs.map((log, index) => {
                              let color = "text-slate-400";
                              if (log.includes("[ROUTING]")) color = "text-cyan-400";
                              if (log.includes("[SUCCESS]")) color = "text-emerald-400";
                              if (log.includes("[TIMEOUT]") || log.includes("[CRITICAL]")) color = "text-rose-400";
                              if (log.includes("[CIRCUIT]") || log.includes("[FAILOVER]")) color = "text-amber-400 font-bold";
                              return (
                                <div key={index} className={`${color} leading-normal`}>
                                  {log}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Broker Response */}
                        <div className="flex flex-col bg-black border border-slate-900 rounded p-2 text-left">
                          <span className="text-slate-500 text-[8px] uppercase tracking-wider mb-1 flex items-center gap-1 border-b border-slate-950 pb-1">
                            <CheckCircle size={9} className="text-purple-400" /> Synthesized Response
                          </span>
                          <div className="flex-1 overflow-y-auto text-[10px] text-slate-300 pr-1 max-h-[140px] whitespace-pre-wrap font-sans">
                            {providerSimResult ? providerSimResult : (
                              <div className="text-slate-600 flex flex-col items-center justify-center h-full gap-1 py-4">
                                <Zap size={14} className="opacity-40 animate-pulse text-purple-500 animate-bounce" />
                                <span>Awaiting resilient pipeline execution...</span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>

                  {/* Provider Settings Panel */}
                  {selectedProviderId && (
                    <div className="bg-[#07070a] border border-slate-900 p-3 rounded-lg flex flex-col text-xs font-mono">
                      <div className="flex items-center justify-between mb-2 border-b border-slate-950 pb-1.5">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">Active Configuration Settings</span>
                        <span className="text-[8px] text-slate-400">PROVIDER_ID: {selectedProviderId}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="flex flex-col">
                          <label className="text-[8px] text-slate-500 uppercase">Gateway Target URL</label>
                          <input
                            type="text"
                            value={
                              selectedProviderId === "gemini" ? "https://generativelanguage.googleapis.com" :
                              selectedProviderId === "openai" ? "https://api.openai.com/v1" :
                              selectedProviderId === "anthropic" ? "https://api.anthropic.com/v1" :
                              selectedProviderId === "ollama" ? "http://localhost:11434" :
                              "https://api.deepseek.com/v1"
                            }
                            className="bg-black/40 border border-slate-950 p-1.5 rounded text-[10px] text-slate-300 mt-1 focus:outline-none"
                            readOnly
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[8px] text-slate-500 uppercase">Authentication Mode</label>
                          <span className="bg-black/40 border border-slate-950 p-1.5 rounded text-[10px] text-slate-300 mt-1 uppercase">
                            {selectedProviderId === "ollama" ? "None (Local Socket)" : "API Secret Key"}
                          </span>
                        </div>
                        <div className="flex flex-col col-span-2 md:col-span-1">
                          <label className="text-[8px] text-slate-500 uppercase">Default Model Registry</label>
                          <span className="bg-black/40 border border-slate-950 p-1.5 rounded text-[10px] text-purple-400 mt-1 font-bold">
                            {selectedProviderId === "gemini" ? "Gemini-2.5-Flash" :
                             selectedProviderId === "openai" ? "GPT-4o-Mini" :
                             selectedProviderId === "anthropic" ? "Claude-3-5-Sonnet" :
                             selectedProviderId === "ollama" ? "Llama-3-8B" :
                             "DeepSeek-V3"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* View 5: AI Context Manager & Sourcing Dashboard */}
          {centerView === "context" && (
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Context Pipeline Quick Stats Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                <div className="bg-[#070b0c] border border-cyan-950 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-cyan-500 font-mono uppercase">Avg Retrieval Latency</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono mt-1">
                    {contextMetrics.retrievalTimeMs} ms
                  </span>
                </div>
                <div className="bg-[#070b0c] border border-cyan-950 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-cyan-500 font-mono uppercase">Token Savings Ratio</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-1">
                    {contextMetrics.tokenSavingsPercent}% Saved
                  </span>
                </div>
                <div className="bg-[#070b0c] border border-cyan-950 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-cyan-500 font-mono uppercase">Cache Hit Density</span>
                  <span className="text-sm font-bold text-cyan-300 font-mono mt-1">
                    {contextMetrics.cacheHitRate.toFixed(1)}% Hit
                  </span>
                </div>
                <div className="bg-[#070b0c] border border-cyan-950 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-cyan-500 font-mono uppercase">Pipeline Accuracy</span>
                  <span className="text-sm font-bold text-yellow-500 font-mono mt-1">
                    {contextMetrics.retrievalAccuracy}% Conf.
                  </span>
                </div>
              </div>

              {/* Main Dual-Pane layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 text-left">
                
                {/* Left Pane: Providers & Dynamic Registration (Col Span 5) */}
                <div className="lg:col-span-5 flex flex-col gap-3">
                  <div className="bg-[#07070a] border border-slate-900 p-3 rounded-lg flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2.5 border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Layers size={13} className="text-cyan-400 animate-pulse" />
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Information Providers</h3>
                      </div>
                      <span className="text-[8px] bg-cyan-950/40 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-900/30 font-mono uppercase font-bold">SOLID pluggable</span>
                    </div>

                    <p className="text-[10px] text-slate-500 mb-3 leading-tight">
                      Independent adapters gathering workspace signals. New providers register cleanly under Open-Closed parameters.
                    </p>

                    {/* Active Providers List */}
                    <div className="space-y-2 overflow-y-auto max-h-[220px] flex-1 pr-1 mb-3">
                      {contextProviders.map((prov) => {
                        let iconColor = "text-cyan-400";
                        if (prov.type === ContextSourceType.CODE) iconColor = "text-purple-400";
                        if (prov.type === ContextSourceType.GIT) iconColor = "text-amber-400";
                        if (prov.type === ContextSourceType.MEMORY) iconColor = "text-pink-400";
                        if (prov.type === ContextSourceType.EVENT) iconColor = "text-emerald-400";

                        return (
                          <div
                            key={prov.id}
                            className="p-2.5 rounded-lg border border-slate-900 bg-black/30 hover:bg-[#0c0c12] transition-all flex items-center justify-between"
                          >
                            <div className="flex flex-col text-left gap-0.5 max-w-[70%]">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] font-mono font-bold uppercase ${iconColor}`}>
                                  [{prov.type}]
                                </span>
                                <span className="text-xs text-white font-bold font-mono truncate">{prov.name}</span>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono truncate">ID: {prov.id}</span>
                            </div>
                            <button
                              onClick={() => handleToggleProvider(prov.id)}
                              className="px-2 py-1 rounded bg-rose-950/20 border border-rose-900/30 text-[9px] text-rose-400 font-mono uppercase hover:bg-rose-900/30 cursor-pointer"
                            >
                              Mute
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Dynamic Provider Registration form */}
                    <div className="bg-black/50 border border-slate-900 p-2.5 rounded-lg">
                      <div className="text-[9px] uppercase font-mono text-cyan-400 font-bold mb-2">
                        + Register Custom Adapter (OCP)
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Provider Name"
                            value={newProvName}
                            onChange={(e) => setNewProvName(e.target.value)}
                            className="bg-black border border-slate-900 rounded p-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                          />
                          <select
                            value={newProvType}
                            onChange={(e) => setNewProvType(e.target.value as ContextSourceType)}
                            className="bg-black border border-slate-900 rounded p-1.5 text-[10px] font-mono text-slate-400 focus:outline-none focus:border-cyan-500"
                          >
                            {Object.values(ContextSourceType).map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Default return payload snippet..."
                          value={newProvContent}
                          onChange={(e) => setNewProvContent(e.target.value)}
                          className="w-full bg-black border border-slate-900 rounded p-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          onClick={handleRegisterCustomProvider}
                          className="w-full py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 text-[10px] font-mono uppercase font-bold rounded cursor-pointer transition-colors"
                        >
                          Pluggable Register
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Pane: Interactive Playground (Col Span 7) */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                  
                  {/* Pipeline Console Panel */}
                  <div className="bg-[#07070a] border border-slate-900 p-3 rounded-lg flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-cyan-400" />
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Pipeline Orchestrator Playground</h3>
                      </div>
                      
                      <div className="flex items-center gap-2 font-mono text-[9px]">
                        <span className="text-slate-500 font-bold uppercase">SEMANTIC COMPRESSION</span>
                        <button
                          onClick={() => setCompressSemantic(!compressSemantic)}
                          className={`w-8 h-4 rounded-full transition-all relative ${compressSemantic ? "bg-cyan-500" : "bg-slate-800"}`}
                        >
                          <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${compressSemantic ? "left-4" : "left-0.5"}`}></span>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-3 font-mono text-[11px] text-slate-300">
                      
                      {/* Search Request */}
                      <div>
                        <span className="text-slate-500 text-[8px] block mb-1 uppercase">Sourced Search Request / Intent Input</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={contextQuery}
                            onChange={(e) => setContextQuery(e.target.value)}
                            className="flex-1 bg-black border border-slate-900 rounded p-1.5 text-xs focus:outline-none focus:border-cyan-500 text-cyan-100 font-mono"
                            placeholder="Type prompt to analyze, retrieve, rank and synthesize..."
                          />
                          <button
                            onClick={() => handleExecuteContextBuild(false)}
                            disabled={isBuildingContext}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 uppercase cursor-pointer ${isBuildingContext ? "bg-slate-900 text-slate-500 cursor-not-allowed" : "bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800"}`}
                          >
                            <RefreshCw size={11} className={isBuildingContext ? "animate-spin" : ""} />
                            {isBuildingContext ? "Processing..." : "Synthesize"}
                          </button>
                        </div>
                      </div>

                      {/* Dual split: Terminal Logs vs. Standardized Context Package Output */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-[180px]">
                        
                        {/* Terminal Logs (Trace Console) - Col Span 5 */}
                        <div className="md:col-span-5 flex flex-col bg-black border border-slate-900 rounded p-2 text-[10px] font-mono text-slate-400">
                          <span className="text-slate-500 text-[8px] uppercase tracking-wider mb-1 flex items-center gap-1 border-b border-slate-950 pb-1">
                            <History size={9} /> Execution Trace Logs
                          </span>
                          <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-left select-none max-h-[160px]">
                            {contextManagerLogs.map((log, index) => {
                              let color = "text-slate-500";
                              if (log.includes("[PIPELINE]")) color = "text-cyan-400 font-bold";
                              if (log.includes("[STAGE")) color = "text-purple-400";
                              if (log.includes("[CACHE")) color = "text-emerald-400";
                              if (log.includes("[RANKED TOP]")) color = "text-yellow-400";
                              if (log.includes("[RETRIEVED]")) color = "text-slate-300";
                              if (log.includes("[COMPRESSION")) color = "text-pink-400";
                              if (log.includes("[OCP REGISTRY]")) color = "text-emerald-300";
                              return (
                                <div key={index} className={`${color} leading-tight text-[9px]`}>
                                  {log}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Standardized Independent Context Package - Col Span 7 */}
                        <div className="md:col-span-7 flex flex-col bg-black border border-slate-900 rounded p-2 text-left">
                          <span className="text-slate-500 text-[8px] uppercase tracking-wider mb-1 flex items-center justify-between border-b border-slate-950 pb-1">
                            <span className="flex items-center gap-1">
                              <CheckCircle size={9} className="text-cyan-400" /> Standard Context Package
                            </span>
                            {contextPackageResult && (
                              <span className="text-[7px] text-cyan-500 font-mono font-bold">VERSION: {contextPackageResult.version}</span>
                            )}
                          </span>
                          
                          <div className="flex-1 overflow-y-auto text-[10px] text-slate-300 pr-1 max-h-[160px]">
                            {contextPackageResult ? (
                              <div className="space-y-3 font-sans text-slate-300">
                                <div>
                                  <div className="text-[8px] font-mono text-slate-500 uppercase">1. INTENT SUMMARY SUMMARY</div>
                                  <p className="text-[10px] italic leading-tight text-cyan-200 mt-0.5">{contextPackageResult.intentSummary}</p>
                                </div>

                                {contextPackageResult.relevantFiles.length > 0 && (
                                  <div>
                                    <div className="text-[8px] font-mono text-slate-500 uppercase">2. RELEVANT WORKSPACE CODE EXCERPTS</div>
                                    <div className="space-y-1.5 mt-1">
                                      {contextPackageResult.relevantFiles.map((file, idx) => (
                                        <div key={idx} className="bg-slate-950/80 p-1.5 rounded border border-slate-900">
                                          <div className="flex justify-between font-mono text-[9px] text-cyan-400">
                                            <span>{file.filePath}</span>
                                            <span>Rel: {(file.relevance * 100).toFixed(0)}%</span>
                                          </div>
                                          <pre className="font-mono text-[8px] text-slate-400 overflow-x-auto p-1 bg-black/60 rounded mt-1 whitespace-pre">
                                            {file.contentExcerpt}
                                          </pre>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {contextPackageResult.memoryReferences.length > 0 && (
                                  <div>
                                    <div className="text-[8px] font-mono text-slate-500 uppercase">3. RECALLED EPISODIC MEMORY REFERENCES</div>
                                    <div className="space-y-1 mt-1 font-mono text-[9px]">
                                      {contextPackageResult.memoryReferences.map((mem, idx) => (
                                        <div key={idx} className="bg-pink-950/10 border border-pink-950/20 p-1.5 rounded text-pink-300">
                                          <span className="font-bold text-pink-400">{mem.key}</span>
                                          <p className="text-[9px] leading-tight text-slate-400 mt-0.5">{mem.value}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {contextPackageResult.eventLogsExcerpt.length > 0 && (
                                  <div>
                                    <div className="text-[8px] font-mono text-slate-500 uppercase">4. DISCOVERED EVENT TRACES (LIVE SIGNAL)</div>
                                    <pre className="p-1.5 bg-black text-emerald-400 font-mono text-[8px] rounded border border-slate-900 mt-1">
                                      {contextPackageResult.eventLogsExcerpt.join("\n")}
                                    </pre>
                                  </div>
                                )}

                                <div>
                                  <div className="text-[8px] font-mono text-slate-500 uppercase">5. PACKAGE METADATA SPEC</div>
                                  <div className="grid grid-cols-2 gap-2 mt-1 font-mono text-[9px] bg-slate-950 p-1.5 rounded border border-slate-900 text-slate-400">
                                    <div>WORKSPACE: <span className="text-white">{contextPackageResult.metadata.workspaceId}</span></div>
                                    <div>SIZE TOKENS: <span className="text-white">{contextPackageResult.metadata.tokensEstimated}</span></div>
                                    <div>COMPRESSION: <span className="text-white">{(contextPackageResult.metadata.compressionRatio * 100).toFixed(1)}%</span></div>
                                    <div>CONFIDENCE: <span className="text-white">{(contextPackageResult.metadata.confidenceScore * 100).toFixed(1)}%</span></div>
                                  </div>
                                </div>

                              </div>
                            ) : (
                              <div className="text-slate-600 flex flex-col items-center justify-center h-full gap-1 py-10">
                                <Database size={16} className="opacity-40 animate-pulse text-cyan-500 animate-bounce" />
                                <span>Awaiting dynamic context compilation...</span>
                                <span className="text-[9px] text-slate-500">Provide an intent query above and click Synthesize</span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* View 6: Dynamic Cognitive Intent Analyzer */}
          {centerView === "intent" && (
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Intent Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                <div className="bg-[#0b0c07] border border-yellow-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-yellow-500 font-mono uppercase">Prompts Evaluated</span>
                  <span className="text-sm font-bold text-yellow-400 font-mono mt-1">
                    {intentMetrics.totalAnalyzed} Requests
                  </span>
                </div>
                <div className="bg-[#0b0c07] border border-yellow-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-yellow-500 font-mono uppercase">Avg Analysis Latency</span>
                  <span className="text-sm font-bold text-amber-400 font-mono mt-1">
                    {intentMetrics.averageAnalysisTimeMs} ms
                  </span>
                </div>
                <div className="bg-[#0b0c07] border border-yellow-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-yellow-500 font-mono uppercase">Gateway Confidence</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-1">
                    {(intentMetrics.confidenceAvg * 100).toFixed(1)}% Accuracy
                  </span>
                </div>
                <div className="bg-[#0b0c07] border border-yellow-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-yellow-500 font-mono uppercase">Clarification Frequency</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono mt-1">
                    {(intentMetrics.clarificationFrequency * 100).toFixed(1)}% Prompts
                  </span>
                </div>
              </div>

              {/* Main Dual-Pane layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 text-left">
                
                {/* Left Pane: Testing Ingress (Col Span 5) */}
                <div className="lg:col-span-5 flex flex-col gap-3">
                  <div className="bg-[#07070a] border border-slate-900 p-3 rounded-lg flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5 border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Zap size={13} className="text-yellow-400 animate-pulse" />
                          <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Intent Ingress Gateway</h3>
                        </div>
                        <span className="text-[8px] bg-yellow-950/40 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-900/30 font-mono uppercase font-bold">INTELLIGENT PARSER</span>
                      </div>

                      <p className="text-[10px] text-slate-500 mb-3 leading-tight">
                        Input a raw prompt to trace the OS intent analyzer engine. It parses categories, evaluates complexity, and recommends workflows without executing.
                      </p>

                      {/* Prompt Presets Selector */}
                      <div className="mb-3">
                        <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1">Pre-configured Testing Signals</span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {[
                            { label: "🚨 Crisis: Crash in auth middleware", prompt: "Fix my crashing auth middleware! It throws a null pointer exception on line 42 in session.ts and crashes production." },
                            { label: "💻 Feature: High-perf rust parser", prompt: "Write an high-performance rust AST compiler with zero-allocation modules" },
                            { label: "🚀 Action: deploy docker container", prompt: "deploy a container image using Docker scripts to Cloud Run automatically" },
                            { label: "📋 Plan: Roadmap for Sprint 3.2", prompt: "Let's plan the milestone targets and sprint backlog for Sprint 3.2" },
                            { label: "🗣️ Vague: fix my project", prompt: "Fix my project errors now." }
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              onClick={() => setIntentInput(preset.prompt)}
                              className="w-full text-left p-1.5 rounded bg-black/40 hover:bg-slate-900/60 border border-slate-950 hover:border-slate-800 transition-all text-[10px] font-mono text-slate-300 truncate"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dynamic Ingress Form */}
                      <div className="space-y-2.5">
                        <div>
                          <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1">Raw User Signal Prompt</span>
                          <textarea
                            value={intentInput}
                            onChange={(e) => setIntentInput(e.target.value)}
                            rows={3}
                            placeholder="Type prompt to execute analyzer logic..."
                            className="w-full bg-black border border-slate-900 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-yellow-500"
                          />
                        </div>

                        <button
                          onClick={handleExecuteIntentAnalysis}
                          disabled={isAnalyzingIntent}
                          className={`w-full py-2 rounded font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${isAnalyzingIntent ? "bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800" : "bg-yellow-950/40 hover:bg-yellow-950/80 text-yellow-500 border border-yellow-800/60"}`}
                        >
                          {isAnalyzingIntent ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              Parsing Gateway...
                            </>
                          ) : (
                            <>
                              <Zap size={12} />
                              Analyze Prompt Signal
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Console Logger */}
                    <div className="mt-4 flex flex-col bg-black border border-slate-900 rounded p-2 text-[10px] font-mono text-slate-400">
                      <span className="text-slate-500 text-[8px] uppercase tracking-wider mb-1 flex items-center gap-1 border-b border-slate-950 pb-1">
                        <History size={9} /> Gateway Trace Consoles
                      </span>
                      <div className="overflow-y-auto space-y-1 pr-1 text-left select-none max-h-[140px] h-[140px]">
                        {intentAnalyzerLogs.map((log, index) => {
                          let color = "text-slate-500";
                          if (log.includes("[INTENT GATEWAY]")) color = "text-yellow-500 font-bold";
                          if (log.includes("[STAGE")) color = "text-purple-400";
                          if (log.includes("[CLASSIFIER RESULT]")) color = "text-emerald-400 font-bold";
                          if (log.includes("[AMBIGUITY")) color = "text-rose-400";
                          if (log.includes("[CAPABILITY MATCH]")) color = "text-cyan-400";
                          if (log.includes("[COMPLEXITY RESULT]")) color = "text-slate-300";
                          return (
                            <div key={index} className={`${color} leading-tight text-[9px]`}>
                              {log}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Pane: Intent Package Output (Col Span 7) */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                  <div className="bg-[#07070a] border border-slate-900 p-3 rounded-lg flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-yellow-500" />
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Synthesized Intent Package Schema</h3>
                      </div>
                      
                      {intentPackageResult && (
                        <span className="text-[8px] font-mono text-slate-500 uppercase">
                          ID: <span className="text-yellow-500 font-bold">{intentPackageResult.intentId.substring(0, 8)}...</span>
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 max-h-[460px]">
                      {intentPackageResult ? (
                        <div className="space-y-4">
                          
                          {/* User Goal & Safety Banner */}
                          <div className="bg-black/40 border border-slate-900 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <span className="text-[8px] font-mono text-slate-500 uppercase">Extracted User Objective Goal</span>
                              <p className="text-sm font-semibold text-white leading-snug mt-0.5">
                                "{intentPackageResult.userGoal}"
                              </p>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-[8px] font-mono text-slate-500 uppercase">Safety Rating</span>
                              <span className={`text-[10px] font-mono uppercase font-bold mt-1 px-2 py-0.5 rounded border ${intentPackageResult.safetyLevel === "SECURE" ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" : intentPackageResult.safetyLevel === "SANDBOXED" ? "bg-yellow-950/40 text-yellow-400 border-yellow-900/50" : "bg-rose-950/40 text-rose-400 border-rose-900/50 animate-pulse"}`}>
                                {intentPackageResult.safetyLevel.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>

                          {/* Dual Matrix Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            
                            {/* Classification details */}
                            <div className="bg-black/30 border border-slate-900 p-2.5 rounded-lg">
                              <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1">Intent Category</span>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-white font-mono">{intentPackageResult.intentCategory}</span>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                                Priority Level: <span className="text-slate-300 font-bold">{intentPackageResult.priority}</span>
                              </span>
                            </div>

                            {/* Complexity rating */}
                            <div className="bg-black/30 border border-slate-900 p-2.5 rounded-lg">
                              <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1">Complexity & Resource Load</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-400 font-mono">{intentPackageResult.complexity}</span>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                                Confidence Score: <span className="text-emerald-400 font-bold">{(intentPackageResult.confidenceScore * 100).toFixed(0)}%</span>
                              </span>
                            </div>

                          </div>

                          {/* Core Capability Chips */}
                          <div>
                            <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1.5">Demanded Core Engine Capabilities</span>
                            <div className="flex flex-wrap gap-1.5">
                              {intentPackageResult.requiredCapabilities.map((cap) => (
                                <span
                                  key={cap}
                                  className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/30 text-cyan-400 border border-cyan-900/30 flex items-center gap-1"
                                >
                                  <span className="w-1 h-1 rounded-full bg-cyan-400"></span>
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Expected Performance Metrics */}
                          <div className="bg-black border border-slate-900 rounded-lg p-3">
                            <span className="text-[8px] font-mono text-slate-500 uppercase block mb-2">Estimated Execution Parameters</span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-900">
                                <span className="text-[8px] text-slate-500 font-mono block">Files Affected</span>
                                <span className="text-xs text-white font-bold font-mono">~{intentPackageResult.metadata.estimatedFilesAffected}</span>
                              </div>
                              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-900">
                                <span className="text-[8px] text-slate-500 font-mono block">Execution Time</span>
                                <span className="text-xs text-white font-bold font-mono">{intentPackageResult.metadata.estimatedExecutionTimeMinutes} min</span>
                              </div>
                              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-900">
                                <span className="text-[8px] text-slate-500 font-mono block">Security Impact</span>
                                <span className="text-xs text-rose-400 font-bold font-mono">{intentPackageResult.metadata.securityImpactScore}/10</span>
                              </div>
                              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-900">
                                <span className="text-[8px] text-slate-500 font-mono block">Required Sources</span>
                                <span className="text-[9px] text-cyan-400 font-bold font-mono">{intentPackageResult.requiredContextSources.slice(0, 2).join(", ")}</span>
                              </div>
                            </div>
                            {intentPackageResult.metadata.detectedTechnologies.length > 0 && (
                              <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                                <span>Detected Stack Context:</span>
                                <div className="flex gap-1">
                                  {intentPackageResult.metadata.detectedTechnologies.map(tech => (
                                    <span key={tech} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-white text-[9px]">
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Workflow Recommendation Advice */}
                          <div className="p-3 rounded-lg border border-yellow-950/40 bg-yellow-950/10 text-yellow-500/90 flex items-start gap-2.5">
                            <Shuffle size={14} className="mt-0.5 shrink-0" />
                            <div className="text-xs">
                              <span className="font-bold text-yellow-400 font-mono block mb-0.5">Workflow Routing Strategy Recommendation</span>
                              Recommend orchestrating via the <span className="text-white font-bold font-mono underline">{intentPackageResult.suggestedWorkflow}</span> paradigm. This fits identified constraints and coordinates context injection seamlessly.
                            </div>
                          </div>

                          {/* Ambiguity & Clarification Blocks */}
                          {intentPackageResult.missingInformation.length > 0 ? (
                            <div className="bg-rose-950/15 border border-rose-900/30 p-3 rounded-lg flex flex-col gap-2">
                              <div className="flex items-center gap-1.5 text-rose-400">
                                <ShieldAlert size={14} />
                                <span className="text-[10px] font-mono font-bold uppercase">Ambiguity / Unspecified Coordinates Found!</span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-tight">
                                Cognitive accuracy dropped below the standard boundary because the raw user request did not identify specific variables.
                              </p>
                              <div className="space-y-1 mt-1">
                                {intentPackageResult.missingInformation.map((info, idx) => (
                                  <div key={idx} className="bg-black/40 border border-rose-950 p-2 rounded text-[10px] text-white flex items-center justify-between font-mono">
                                    <span>⚠️ Clarifying Question: <span className="text-rose-300 font-bold">Which {info.toLowerCase()}?</span></span>
                                    <button
                                      onClick={() => {
                                        let extraText = " ";
                                        if (info.includes("file")) extraText = " targeting file session.ts";
                                        if (info.includes("error")) extraText = " matching error 'Session closed by host'.";
                                        if (info.includes("command")) extraText = " of command 'npm run test:coverage'.";
                                        setIntentInput(intentInput + extraText);
                                        addSystemLog("INFO", "INTENT", `Appended clarifying criteria for ${info}`);
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-900 text-[8px] uppercase hover:bg-rose-900 transition-colors cursor-pointer"
                                    >
                                      Simulate Response
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-950/10 border border-emerald-900/30 p-2.5 rounded-lg flex items-center gap-2 text-emerald-400">
                              <CheckCircle size={14} />
                              <span className="text-[10px] font-mono font-bold uppercase">Zero-Ambiguity Verified. Semantic Confidence High.</span>
                            </div>
                          )}

                          {/* Extension Points for Learning Strategy */}
                          <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 text-slate-400 font-mono text-[9px]">
                            <span className="text-[8px] text-slate-500 uppercase block mb-1">Architecture Extension (Future Preference Hook)</span>
                            <div className="flex justify-between">
                              <span>Preference Bias: Multi-Agent</span>
                              <span>Technology Match: TypeScript / React</span>
                              <span>Task Status: Pending Record</span>
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="text-slate-600 flex flex-col items-center justify-center h-full gap-2 py-24">
                          <Zap size={22} className="opacity-40 text-yellow-500 animate-bounce" />
                          <span>Awaiting dynamic prompt analysis...</span>
                          <span className="text-[9px] text-slate-500">Provide an intent query or select a preset and click Analyze</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* View 7: Project Planner */}
          {centerView === "planner" && (
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Planner Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                <div className="bg-[#070b09] border border-emerald-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-emerald-500 font-mono uppercase">Cumulative Tasks</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-1">
                    {plannerMetrics.tasksGeneratedCount} Generated
                  </span>
                </div>
                <div className="bg-[#070b09] border border-emerald-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-emerald-500 font-mono uppercase">Parallel Concurrency Rate</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono mt-1">
                    {plannerMetrics.parallelizationRatePercent}% Speedup
                  </span>
                </div>
                <div className="bg-[#070b09] border border-emerald-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-emerald-500 font-mono uppercase">Risks Intercepted</span>
                  <span className="text-sm font-bold text-rose-400 font-mono mt-1">
                    {plannerMetrics.riskCount} Tracked
                  </span>
                </div>
                <div className="bg-[#070b09] border border-emerald-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-emerald-500 font-mono uppercase">Adaptability Accuracy</span>
                  <span className="text-sm font-bold text-amber-400 font-mono mt-1">
                    {plannerMetrics.planningAccuracyPercent}% SLA
                  </span>
                </div>
              </div>

              {/* Main Dual Pane Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 text-left">
                
                {/* Left Pane: Controls & Signals Ingress (Col Span 4) */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                  <div className="bg-[#07070a] border border-slate-900 p-3 rounded-lg flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5 border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-1.5">
                          <ListTodo size={13} className="text-emerald-400" />
                          <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Planner Control Tower</h3>
                        </div>
                        <span className="text-[8px] bg-emerald-950/40 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/30 font-mono uppercase font-bold">DAEMON</span>
                      </div>

                      <p className="text-[10px] text-slate-500 mb-3 leading-tight">
                        Convert Intent Packages into multi-stage execution plans. Select custom templates or plug strategies dynamically.
                      </p>

                      {/* Planning Strategy selector */}
                      <div className="mb-4">
                        <label className="text-[8px] font-mono text-slate-500 uppercase block mb-1.5">Activated Planning Strategy Template</label>
                        <div className="space-y-1">
                          {[
                            { value: PlanningStrategyType.FeatureDevelopment, label: "🛠️ Feature Development Sequence", desc: "For building new screens, APIs, or database components." },
                            { value: PlanningStrategyType.BugFix, label: "🚨 Critical Bug Fix Sequence", desc: "Reproduce failure logs, apply safe patches, run boundary reviews." },
                            { value: PlanningStrategyType.Research, label: "🔬 Deep Technical Research & Spec", desc: "Literature review, trade-offs synthesis, blueprint drafting." }
                          ].map((strat) => (
                            <button
                              key={strat.value}
                              onClick={() => {
                                setSelectedPlanningStrategy(strat.value);
                                addSystemLog("INFO", "PLANNER", `Planning strategy override template: ${strat.value}`);
                              }}
                              className={`w-full text-left p-2 rounded transition-all text-xs border ${selectedPlanningStrategy === strat.value ? "bg-emerald-950/20 border-emerald-800 text-emerald-400" : "bg-black/30 border-slate-950 text-slate-400 hover:border-slate-800"}`}
                            >
                              <div className="font-bold font-mono text-white">{strat.label}</div>
                              <div className="text-[9px] text-slate-500 leading-tight mt-0.5">{strat.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Adaptive / Hook Gating Params */}
                      <div className="bg-black/40 border border-slate-900 rounded p-2.5 space-y-2 mb-4 text-[10px]">
                        <span className="text-[8px] font-mono text-slate-500 uppercase block">Extension parameters & Approval hooks</span>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-mono">Adaptive Self-Correction</span>
                          <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.5 rounded uppercase font-bold">READY</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-mono">Historical Project Feedback</span>
                          <span className="text-[9px] text-slate-500 font-mono">BIAS: NONE</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-mono">Interactive Human Approval Gates</span>
                          <span className="text-[9px] text-cyan-400 font-mono bg-cyan-950/40 border border-cyan-900/40 px-1.5 py-0.5 rounded uppercase font-bold">ACTIVE</span>
                        </div>
                      </div>

                      {/* Trigger Button */}
                      <button
                        onClick={() => handleExecutePlanning()}
                        disabled={isPlanning}
                        className={`w-full py-2.5 rounded font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${isPlanning ? "bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800" : "bg-emerald-950/40 hover:bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-[0_0_8px_rgba(16,185,129,0.2)]"}`}
                      >
                        {isPlanning ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            Decomposing tasks...
                          </>
                        ) : (
                          <>
                            <Play size={11} />
                            Generate Execution Plan
                          </>
                        )}
                      </button>
                    </div>

                    {/* Console logger */}
                    <div className="mt-4 flex flex-col bg-black border border-slate-900 rounded p-2 text-[10px] font-mono text-slate-400">
                      <span className="text-slate-500 text-[8px] uppercase tracking-wider mb-1 flex items-center gap-1 border-b border-slate-950 pb-1">
                        <History size={9} /> PM Daemon Log Trace
                      </span>
                      <div className="overflow-y-auto space-y-1 pr-1 text-left select-none max-h-[140px] h-[140px]">
                        {plannerLogs.map((log, idx) => {
                          let color = "text-slate-500";
                          if (log.includes("[PLANNING INGEST]")) color = "text-emerald-500 font-bold";
                          if (log.includes("[STAGE")) color = "text-cyan-400 font-bold";
                          if (log.includes("[DECOMPOSITION")) color = "text-emerald-400";
                          if (log.includes("[DAG")) color = "text-amber-400";
                          if (log.includes("[PLANNING FINISHED]")) color = "text-emerald-400 font-bold";
                          return (
                            <div key={idx} className={`${color} leading-tight text-[9px]`}>
                              {log}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Pane: Complete Planning Package (Col Span 8) */}
                <div className="lg:col-span-8 flex flex-col gap-3">
                  <div className="bg-[#07070a] border border-slate-900 p-4 rounded-lg flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Synthesized Planning Package</h3>
                      </div>
                      
                      {planningPackageResult && (
                        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                          <span>VERSION: <span className="text-slate-300">{planningPackageResult.version}</span></span>
                          <span className="text-slate-800">|</span>
                          <span>EST DURATION: <span className="text-emerald-400 font-bold">{planningPackageResult.estimatedCompletionMinutes}m</span></span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 max-h-[500px]">
                      {planningPackageResult ? (
                        <div className="space-y-5">
                          
                          {/* Planning Header Context */}
                          <div className="bg-black/40 border border-slate-900 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                            <div>
                              <span className="text-[8px] font-mono text-slate-500 uppercase block">Extracted Goal Objective</span>
                              <p className="text-xs font-semibold text-white leading-normal mt-0.5">
                                "{planningPackageResult.goalSummary}"
                              </p>
                            </div>
                            <div className="shrink-0 flex flex-col md:items-end">
                              <span className="text-[8px] font-mono text-slate-500 uppercase">Strategy Executed</span>
                              <span className="text-[9px] text-emerald-400 font-mono font-bold mt-1 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                                {planningPackageResult.strategyUsed}
                              </span>
                            </div>
                          </div>

                          {/* Interactive DAG Topological Flow Visualizer */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[8px] font-mono text-slate-500 uppercase">Interactive Directed Acyclic Graph (DAG) Trace</span>
                              <span className="text-[8px] text-slate-600 font-mono">Click any task node below to view requirements</span>
                            </div>
                            
                            <div className="bg-black/50 border border-slate-950 rounded-xl p-4 overflow-x-auto">
                              <div className="flex flex-row flex-nowrap gap-4 min-w-[600px] justify-between relative py-2">
                                {planningPackageResult.parallelGroups.map((group, groupIdx) => (
                                  <div key={groupIdx} className="flex flex-col gap-3 items-center flex-1 relative">
                                    <div className="text-[8px] font-mono text-slate-600 uppercase border-b border-slate-950 pb-1 mb-1 w-full text-center">
                                      Stage 0{groupIdx + 1}
                                    </div>
                                    {group.map((taskId) => {
                                      const task = planningPackageResult.tasks.find(t => t.id === taskId)!;
                                      if (!task) return null;
                                      const isSelected = selectedTaskDetail?.id === taskId;
                                      return (
                                        <div
                                          key={taskId}
                                          onClick={() => {
                                            setSelectedTaskDetail(task);
                                            addSystemLog("INFO", "PLANNER", `Selected DAG node detail: "${task.title}"`);
                                          }}
                                          className={`w-full p-2 rounded-lg border text-left transition-all cursor-pointer relative group ${isSelected ? "bg-emerald-950/30 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)] scale-[1.02]" : "bg-slate-950 border-slate-900 hover:border-slate-700"}`}
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="text-[8px] font-mono text-slate-500 uppercase truncate">
                                              {task.id.split("-")[1]?.toUpperCase() || "TASK"}
                                            </span>
                                            <span className={`text-[7px] font-mono px-1 rounded uppercase font-bold ${task.priority === "CRITICAL" ? "bg-rose-950/40 text-rose-400" : task.priority === "HIGH" ? "bg-amber-950/40 text-amber-400" : "bg-slate-900 text-slate-400"}`}>
                                              {task.priority}
                                            </span>
                                          </div>
                                          <div className="text-[10px] font-bold text-white font-mono mt-1 line-clamp-1">
                                            {task.title}
                                          </div>
                                          <div className="text-[9px] text-slate-500 font-mono mt-0.5 flex justify-between">
                                            <span>Est: {task.estimatedDurationMinutes}m</span>
                                            <span className="text-cyan-500 font-bold">{task.complexity}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Selected Node Details Block */}
                          {selectedTaskDetail && (
                            <div className="bg-[#0b0c11] border border-slate-800 p-3.5 rounded-lg text-left relative">
                              <button
                                onClick={() => setSelectedTaskDetail(null)}
                                className="absolute top-2 right-2 text-slate-500 hover:text-white font-mono text-[9px]"
                              >
                                [CLOSE ×]
                              </button>
                              
                              <div className="flex items-center gap-2 border-b border-slate-900 pb-2 mb-2">
                                <span className="text-[8px] font-mono bg-emerald-950/40 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/40">NODE DETAILS</span>
                                <h4 className="text-xs font-bold text-white font-mono uppercase">{selectedTaskDetail.title}</h4>
                              </div>

                              <p className="text-[11px] text-slate-400 leading-normal mb-3">
                                {selectedTaskDetail.description}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2 text-[10px] font-mono">
                                <div>
                                  <span className="text-slate-500 block mb-1 font-bold">Context Requirements</span>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedTaskDetail.contextRequirements.map(req => (
                                      <span key={req} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-900 text-slate-300 text-[8px]">
                                        {req}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-500 block mb-1 font-bold">Required Capabilities</span>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedTaskDetail.requiredCapabilities.map(cap => (
                                      <span key={cap} className="px-1.5 py-0.5 rounded bg-cyan-950/20 border border-cyan-900/30 text-cyan-400 text-[8px]">
                                        {cap}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 bg-black/40 p-2.5 rounded border border-slate-900">
                                <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1.5">Acceptance Criteria (Gates)</span>
                                <div className="space-y-1">
                                  {selectedTaskDetail.acceptanceCriteria.map((crit, idx) => (
                                    <div key={idx} className="text-[10px] text-slate-300 flex items-start gap-1.5 font-mono">
                                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                      <span>{crit}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Parallel Concurrency Stages List */}
                          <div>
                            <span className="text-[8px] font-mono text-slate-500 uppercase block mb-2">Topological Execution Stages</span>
                            <div className="space-y-2">
                              {planningPackageResult.parallelGroups.map((group, groupIdx) => (
                                <div key={groupIdx} className="bg-black/30 border border-slate-900/50 p-2.5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase bg-emerald-950/50 px-2 py-0.5 border border-emerald-900/30 rounded">
                                      Stage {groupIdx + 1}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                                      {group.length} Concurrency Targets
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {group.map((id) => {
                                      const task = planningPackageResult.tasks.find(t => t.id === id)!;
                                      return (
                                        <span
                                          key={id}
                                          onClick={() => setSelectedTaskDetail(task)}
                                          className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-900 text-slate-300 hover:border-slate-600 transition-all cursor-pointer"
                                        >
                                          {task?.title.substring(0, 30)}...
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Milestones Panel */}
                          <div>
                            <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1.5">Tracked Delivery Milestones</span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-left">
                              {planningPackageResult.milestones.map((ms, idx) => (
                                <div key={idx} className="bg-black/30 border border-slate-900 p-2.5 rounded-lg flex flex-col">
                                  <span className="text-[8px] text-slate-500 font-mono uppercase">Milestone 0{idx + 1}</span>
                                  <span className="text-[11px] text-white font-bold font-mono mt-0.5 line-clamp-1">{ms.title}</span>
                                  <span className="text-[9px] text-slate-500 font-mono mt-1">Targets: {ms.targetTaskIds.length} tasks</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Risk Assessment & Safeguards Matrix */}
                          <div>
                            <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1.5">Risk & Impact Analysis Safeguards</span>
                            <div className="space-y-2">
                              {planningPackageResult.riskAssessment.map((risk) => (
                                <div key={risk.id} className="bg-black/40 border border-slate-950 p-3 rounded-lg flex items-start gap-3 text-left">
                                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${risk.impact === "HIGH" ? "bg-rose-500 animate-pulse" : risk.impact === "MEDIUM" ? "bg-amber-500" : "bg-cyan-500"}`}></div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">{risk.type}</span>
                                      <span className={`text-[8px] font-mono uppercase font-bold px-1.5 py-0.2 rounded border ${risk.impact === "HIGH" ? "bg-rose-950/40 text-rose-400 border-rose-900/50" : "bg-amber-950/40 text-amber-400 border-amber-900/50"}`}>
                                        IMPACT: {risk.impact}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-normal">
                                      {risk.description}
                                    </p>
                                    <p className="text-[10px] text-emerald-500 font-mono leading-tight bg-emerald-950/10 p-1.5 rounded border border-emerald-950/50">
                                      <span className="font-bold uppercase mr-1">Mitigation:</span> {risk.mitigation}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Human Gated Controls Checkpoints */}
                          {planningPackageResult.approvalPoints.length > 0 && (
                            <div className="bg-yellow-950/10 border border-yellow-900/30 p-3 rounded-lg flex items-start gap-2.5">
                              <ShieldAlert size={15} className="text-yellow-500 shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <span className="font-bold text-yellow-400 font-mono block mb-1">Human Approval Gated Checkpoints Required</span>
                                <p className="text-[11px] text-slate-400 mb-2">
                                  The following operations carry structural risks. All-In-One will prompt for human authorization before executing:
                                </p>
                                <div className="space-y-1">
                                  {planningPackageResult.approvalPoints.map((pt, idx) => (
                                    <div key={idx} className="text-[10px] text-yellow-500 font-mono flex items-center gap-1.5">
                                      <span className="text-yellow-600 font-bold">•</span>
                                      <span>{pt}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Learning Strategy Placeholder */}
                          <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 text-slate-400 font-mono text-[9px]">
                            <span className="text-[8px] text-slate-500 uppercase block mb-1">Adaptive Learning Matrix (Feedback Gate)</span>
                            <div className="flex justify-between items-center">
                              <span>Accuracy SLA Weight: 98.4%</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    Planner.getInstance().adaptivePlanningFeedback(planningPackageResult.id, false);
                                    addSystemLog("INFO", "PLANNER", "Registered positive feedback backpropagation to planning weights.");
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 text-[8px] uppercase hover:bg-emerald-900 transition-colors cursor-pointer animate-pulse"
                                >
                                  Good Plan (Reinforce)
                                </button>
                                <button
                                  onClick={() => {
                                    Planner.getInstance().adaptivePlanningFeedback(planningPackageResult.id, true, "Tasks too large");
                                    setPlannerMetrics(Planner.getInstance().getMetrics());
                                    addSystemLog("WARN", "PLANNER", "Registered negative feedback. Prompted revision count increase.");
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-900 text-[8px] uppercase hover:bg-rose-900 transition-colors cursor-pointer"
                                >
                                  Needs Revision
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="text-slate-600 flex flex-col items-center justify-center h-full gap-2 py-24">
                          <ListTodo size={22} className="opacity-40 text-emerald-500 animate-bounce" />
                          <span>Awaiting execution graph synthesis...</span>
                          <span className="text-[9px] text-slate-500">Select a strategy template or input custom requirements above and click Generate.</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* View 8: Intelligent Router */}
          {centerView === "router" && (
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Router Quick Telemetry Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                <div className="bg-[#0b070f] border border-purple-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-fuchsia-500 font-mono uppercase">Jobs Orchestrated</span>
                  <span className="text-sm font-bold text-fuchsia-400 font-mono mt-1">
                    {routerMetrics.jobsRoutedCount} Active Jobs
                  </span>
                </div>
                <div className="bg-[#0b070f] border border-purple-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-fuchsia-500 font-mono uppercase">Cumulative Model Cost</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono mt-1">
                    ${routerMetrics.cumulativeCost.toFixed(5)} USD
                  </span>
                </div>
                <div className="bg-[#0b070f] border border-purple-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-fuchsia-500 font-mono uppercase">Orchestration Latency</span>
                  <span className="text-sm font-bold text-amber-400 font-mono mt-1">
                    {routerMetrics.routingTimeMs || "0"} ms
                  </span>
                </div>
                <div className="bg-[#0b070f] border border-purple-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-fuchsia-500 font-mono uppercase">Fallback Triggers</span>
                  <span className="text-sm font-bold text-rose-400 font-mono mt-1">
                    {routerMetrics.fallbackTriggerCount} Safety Gates
                  </span>
                </div>
              </div>

              {/* Main Dual Pane Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 text-left">
                
                {/* Left Pane: Strategy Selector & Settings (Col Span 4) */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                  <div className="bg-[#07070a] border border-slate-900 p-3 rounded-lg flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5 border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Shuffle size={13} className="text-fuchsia-400" />
                          <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Router Controller</h3>
                        </div>
                        <span className="text-[8px] bg-fuchsia-950/40 text-fuchsia-400 px-1.5 py-0.5 rounded border border-fuchsia-900/30 font-mono uppercase font-bold">ACTIVE</span>
                      </div>

                      <p className="text-[10px] text-slate-500 mb-3 leading-tight">
                        Match task requirements to provider metadata and dispatch parallel execution job sequences.
                      </p>

                      {/* Routing Strategy Options */}
                      <div className="mb-4">
                        <label className="text-[8px] font-mono text-slate-500 uppercase block mb-1.5">Orchestration & Dispatch Strategy</label>
                        <div className="space-y-1">
                          {[
                            { value: RoutingStrategyType.BALANCED, label: "⚖️ Balanced Strategy", desc: "Optimal quality/cost trade-off." },
                            { value: RoutingStrategyType.QUALITY, label: "💎 Highest Quality", desc: "Prioritize sovereign heavy models (Claude 3.5, Pro)." },
                            { value: RoutingStrategyType.CHEAPEST, label: "🪙 Cheapest Rate", desc: "Select low-token cost API routes." },
                            { value: RoutingStrategyType.FASTEST, label: "⚡ Fastest Response", desc: "Prioritize lowest average latency." },
                            { value: RoutingStrategyType.OFFLINE_FIRST, label: "🔌 Offline First", desc: "Force zero-cost local Ollama compute paths." }
                          ].map((strat) => (
                            <button
                              key={strat.value}
                              onClick={() => {
                                setSelectedRoutingStrategy(strat.value as RoutingStrategyType);
                                addSystemLog("INFO", "ROUTER", `Routing strategy selected: ${strat.value}`);
                              }}
                              className={`w-full text-left p-2 rounded transition-all text-xs border ${selectedRoutingStrategy === strat.value ? "bg-fuchsia-950/20 border-fuchsia-800 text-fuchsia-400" : "bg-black/30 border-slate-950 text-slate-400 hover:border-slate-800"}`}
                            >
                              <div className="font-bold font-mono text-white">{strat.label}</div>
                              <div className="text-[9px] text-slate-500 leading-tight mt-0.5">{strat.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Advanced Orchestration Controls */}
                      <div className="bg-black/40 border border-slate-900 rounded p-2.5 space-y-2 mb-4 text-[10px]">
                        <span className="text-[8px] font-mono text-slate-500 uppercase block">Engine Policy Controls</span>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-mono">Circuit Breaker Failovers</span>
                          <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.5 rounded uppercase font-bold">READY</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-mono">Self-Learning Engine Bias</span>
                          <span className="text-[9px] text-cyan-400 font-mono bg-cyan-950/20 border border-cyan-900/30 px-1.5 py-0.5 rounded uppercase font-bold">ACTIVE</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-mono">Parallel Execution Scheduler</span>
                          <span className="text-[9px] text-fuchsia-400 font-mono bg-fuchsia-950/40 border border-fuchsia-900/40 px-1.5 py-0.5 rounded uppercase font-bold">ACTIVE</span>
                        </div>
                      </div>

                      {/* Trigger Router Compilation */}
                      <button
                        onClick={() => handleExecuteRouting()}
                        disabled={isRouting}
                        className={`w-full py-2.5 rounded font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${isRouting ? "bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800" : "bg-fuchsia-950/40 hover:bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-800/60 shadow-[0_0_8px_rgba(217,70,239,0.2)]"}`}
                      >
                        {isRouting ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            Routing execution paths...
                          </>
                        ) : (
                          <>
                            <Play size={11} />
                            Compile Routing Package
                          </>
                        )}
                      </button>
                    </div>

                    {/* Router Log Console */}
                    <div className="mt-4 flex flex-col bg-black border border-slate-900 rounded p-2 text-[10px] font-mono text-slate-400">
                      <span className="text-slate-500 text-[8px] uppercase tracking-wider mb-1 flex items-center gap-1 border-b border-slate-950 pb-1">
                        <History size={9} /> Router Core Log Trace
                      </span>
                      <div className="overflow-y-auto space-y-1 pr-1 text-left select-none max-h-[140px] h-[140px]">
                        {routerLogs.map((log, idx) => {
                          let color = "text-slate-500";
                          if (log.includes("[SUCCESS]")) color = "text-emerald-400 font-bold";
                          if (log.includes("[ROUTER DAEMON]")) color = "text-fuchsia-400 font-bold";
                          if (log.includes("[STRATEGY]")) color = "text-cyan-400";
                          if (log.includes("Evaluating Task")) color = "text-slate-300";
                          if (log.includes("[CRITICAL]")) color = "text-rose-400 font-bold";
                          return (
                            <div key={idx} className={`${color} leading-tight text-[9px]`}>
                              {log}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Pane: Orchestrated Routing Package (Col Span 8) */}
                <div className="lg:col-span-8 flex flex-col gap-3">
                  <div className="bg-[#07070a] border border-slate-900 p-4 rounded-lg flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-fuchsia-500" />
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Orchestrated Dispatch Package</h3>
                      </div>
                      
                      {routingPackageResult && (
                        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                          <span>PACKAGE: <span className="text-slate-300">{routingPackageResult.id}</span></span>
                          <span className="text-slate-800">|</span>
                          <span>EST COST: <span className="text-cyan-400 font-bold">${routingPackageResult.estimatedTotalCost.toFixed(5)}</span></span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 max-h-[500px]">
                      {routingPackageResult ? (
                        <div className="space-y-5">
                          
                          {/* Strategic Explanation Block */}
                          <div className="bg-black/40 border border-slate-900 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                            <div>
                              <span className="text-[8px] font-mono text-slate-500 uppercase block">Global Routing Explanation</span>
                              <p className="text-xs font-semibold text-white leading-normal mt-0.5">
                                "{routingPackageResult.routingExplanation}"
                              </p>
                            </div>
                          </div>

                          {/* Interactive Jobs Topological execution graph */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[8px] font-mono text-slate-500 uppercase">Interactive Job Execution Pipeline (Topological DAG)</span>
                              <span className="text-[8px] text-slate-600 font-mono">Select a job node to examine orchestration details</span>
                            </div>
                            
                            <div className="bg-black/50 border border-slate-950 rounded-xl p-4 overflow-x-auto">
                              <div className="flex flex-row flex-nowrap gap-4 min-w-[600px] justify-between relative py-2">
                                {routingPackageResult.parallelBatches.map((batch, batchIdx) => (
                                  <div key={batchIdx} className="flex flex-col gap-3 items-center flex-1 relative">
                                    <div className="text-[8px] font-mono text-slate-600 uppercase border-b border-slate-950 pb-1 mb-1 w-full text-center">
                                      Wave 0{batchIdx + 1}
                                    </div>
                                    {batch.map((jobId) => {
                                      const job = routingPackageResult.jobs.find(j => j.id === jobId)!;
                                      if (!job) return null;
                                      const isSelected = selectedJobDetail?.id === jobId;
                                      
                                      // Assign styled provider coloring
                                      let providerColor = "bg-slate-900 text-slate-300 border-slate-800";
                                      if (job.assignedProviderId === "gemini") providerColor = "bg-emerald-950/30 text-emerald-400 border-emerald-900/40";
                                      if (job.assignedProviderId === "openai") providerColor = "bg-cyan-950/30 text-cyan-400 border-cyan-900/40";
                                      if (job.assignedProviderId === "claude") providerColor = "bg-orange-950/30 text-orange-400 border-orange-900/40";
                                      if (job.assignedProviderId === "ollama") providerColor = "bg-fuchsia-950/30 text-fuchsia-400 border-fuchsia-900/40";
                                      if (job.assignedProviderId === "deepseek") providerColor = "bg-blue-950/30 text-blue-400 border-blue-900/40";

                                      return (
                                        <div
                                          key={jobId}
                                          onClick={() => {
                                            setSelectedJobDetail(job);
                                            addSystemLog("INFO", "ROUTER", `Selected Job detail: "${job.id}"`);
                                          }}
                                          className={`w-full p-2 rounded-lg border text-left transition-all cursor-pointer relative group ${isSelected ? "bg-fuchsia-950/30 border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.15)] scale-[1.02]" : "bg-slate-950 border-slate-900 hover:border-slate-700"}`}
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="text-[8px] font-mono text-slate-500 uppercase">
                                              {job.id.toUpperCase()}
                                            </span>
                                            <span className={`text-[7px] font-mono px-1 rounded uppercase font-bold ${providerColor}`}>
                                              {job.assignedProviderId.toUpperCase()}
                                            </span>
                                          </div>
                                          <div className="text-[10px] font-bold text-white font-mono mt-1 line-clamp-1">
                                            {job.metadata.originalTaskTitle}
                                          </div>
                                          <div className="text-[9px] text-slate-500 font-mono mt-1 flex justify-between">
                                            <span>Est: ${job.estimatedCost.toFixed(5)}</span>
                                            <span className="text-cyan-500 font-semibold">{job.priority}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Selected Job Node Details Modal Panel */}
                          {selectedJobDetail && (
                            <div className="bg-[#0b0c11] border border-slate-800 p-3.5 rounded-lg text-left relative">
                              <button
                                onClick={() => setSelectedJobDetail(null)}
                                className="absolute top-2 right-2 text-slate-500 hover:text-white font-mono text-[9px]"
                              >
                                [CLOSE ×]
                              </button>
                              
                              <div className="flex items-center gap-2 border-b border-slate-900 pb-2 mb-2">
                                <span className="text-[8px] font-mono bg-fuchsia-950/40 text-fuchsia-400 px-1.5 py-0.5 rounded border border-fuchsia-900/40">ORCHESTRATION DETAILS</span>
                                <h4 className="text-xs font-bold text-white font-mono uppercase">{selectedJobDetail.id.toUpperCase()} (Task ID: {selectedJobDetail.taskId})</h4>
                              </div>

                              <div className="bg-black/40 p-2.5 rounded border border-slate-900 text-[10px] text-slate-300 font-mono mb-3 space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold uppercase">Assigned Agent Specialist:</span>
                                  <span className="text-white font-bold">{selectedJobDetail.assignedAgent}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold uppercase">Provider / Target Model:</span>
                                  <span className="text-fuchsia-400 font-bold">{selectedJobDetail.assignedProviderId.toUpperCase()} ({selectedJobDetail.assignedModel})</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold uppercase">Collaboration Topology:</span>
                                  <span className="text-cyan-400">{selectedJobDetail.collaborationModel}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold uppercase">Est Job Duration:</span>
                                  <span className="text-white">{selectedJobDetail.estimatedDurationMinutes} minutes</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold uppercase">Approval Gated Checkpoint:</span>
                                  <span className={selectedJobDetail.approvalRequirements ? "text-rose-400 font-bold" : "text-slate-500"}>
                                    {selectedJobDetail.approvalRequirements ? "YES (MANDATORY)" : "NO"}
                                  </span>
                                </div>
                              </div>

                              {/* Human Readable Explanation */}
                              <div className="bg-black/60 p-3 rounded-lg border border-slate-900 mb-3">
                                <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1">Human-Readable Justification</span>
                                <p className="text-[11px] text-slate-300 leading-normal">
                                  {selectedJobDetail.explanation}
                                </p>
                              </div>

                              {/* Fallback Plan */}
                              <div className="bg-rose-950/10 border border-rose-900/30 p-2.5 rounded text-[10px] font-mono text-slate-400">
                                <span className="text-rose-400 font-bold uppercase block mb-1">Graceful Resilience Fallback Strategy</span>
                                <div className="flex justify-between">
                                  <span>Failure Backup Route:</span>
                                  <span className="text-rose-300">{selectedJobDetail.retryPolicy.fallbackProviderId.toUpperCase()} ({selectedJobDetail.retryPolicy.fallbackModel})</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                  <span>Allowed Max Retries:</span>
                                  <span>{selectedJobDetail.retryPolicy.maxRetries} with exponential backoff</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Parallel waves listing */}
                          <div>
                            <span className="text-[8px] font-mono text-slate-500 uppercase block mb-2">Sequential Waves Execution Flow</span>
                            <div className="space-y-2">
                              {routingPackageResult.parallelBatches.map((batch, batchIdx) => (
                                <div key={batchIdx} className="bg-black/30 border border-slate-900/50 p-2.5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold text-fuchsia-400 uppercase bg-fuchsia-950/50 px-2 py-0.5 border border-fuchsia-900/30 rounded">
                                      Wave {batchIdx + 1}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                                      {batch.length} Parallel Threads
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {batch.map((id) => {
                                      const job = routingPackageResult.jobs.find(j => j.id === id)!;
                                      return (
                                        <span
                                          key={id}
                                          onClick={() => setSelectedJobDetail(job)}
                                          className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-900 text-slate-300 hover:border-slate-600 transition-all cursor-pointer"
                                        >
                                          {job?.id.toUpperCase()} ({job?.assignedProviderId.toUpperCase()})
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Self Learning Hook Placeholder */}
                          <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 text-slate-400 font-mono text-[9px]">
                            <span className="text-[8px] text-slate-500 uppercase block mb-1">Self-Learning Optimization Engine Hook</span>
                            <div className="flex justify-between items-center">
                              <span>Router Accuracy Weight: {routerMetrics.routingAccuracyPercent.toFixed(1)}%</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    Router.getInstance().selfLearnFeedback("global", 150, true);
                                    setRouterMetrics(Router.getInstance().getMetrics());
                                    addSystemLog("INFO", "ROUTER", "Positive routing feedforward loop reinforced model bias scores.");
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-900 text-[8px] uppercase hover:bg-fuchsia-900 transition-colors cursor-pointer animate-pulse"
                                >
                                  Accurate Mapping
                                </button>
                                <button
                                  onClick={() => {
                                    Router.getInstance().selfLearnFeedback("global", 150, false);
                                    setRouterMetrics(Router.getInstance().getMetrics());
                                    addSystemLog("WARN", "ROUTER", "Negative feedback registered. Penalty applied to active model routing weight.");
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-900 text-[8px] uppercase hover:bg-rose-900 transition-colors cursor-pointer"
                                >
                                  Mismatch (Melt Bias)
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="text-slate-600 flex flex-col items-center justify-center h-full gap-2 py-24">
                          <Shuffle size={22} className="opacity-40 text-fuchsia-500 animate-bounce" />
                          <span>Awaiting orchestration pipeline assignment...</span>
                          <span className="text-[9px] text-slate-500">Select an execution strategy and click Compile Routing Package.</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* View 9: Decision Engine */}
          {centerView === "decision" && (
            <div className="flex-1 flex flex-col gap-4 text-left">
              
              {/* Decision Telemetry Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                <div className="bg-[#070b0a] border border-teal-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-teal-400 font-mono uppercase font-bold">Decisions Compiled</span>
                  <span className="text-sm font-bold text-teal-300 font-mono mt-1">
                    {decisionMetrics.totalDecisionsMade} Total Packages
                  </span>
                </div>
                <div className="bg-[#070b0a] border border-teal-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-teal-400 font-mono uppercase font-bold">Average Confidence</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-1">
                    {decisionMetrics.averageConfidencePercent || "0"}% Accuracy
                  </span>
                </div>
                <div className="bg-[#070b0a] border border-teal-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-teal-400 font-mono uppercase font-bold">Incompatibility Rate</span>
                  <span className="text-sm font-bold text-amber-400 font-mono mt-1">
                    {decisionMetrics.conflictFrequencyPercent || "0"}% Scanned
                  </span>
                </div>
                <div className="bg-[#070b0a] border border-teal-950/40 p-2.5 rounded-lg flex flex-col">
                  <span className="text-[9px] text-teal-400 font-mono uppercase font-bold">Evaluation Speed</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono mt-1">
                    {decisionMetrics.averageEvaluationLatencyMs || "0"} ms
                  </span>
                </div>
              </div>

              {/* Dual Pane Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
                
                {/* Left Pane: Strategy Selector & Settings (Col Span 4) */}
                <div className="lg:col-span-4 flex flex-col gap-3 text-left">
                  <div className="bg-[#07070a] border border-slate-900 p-3 rounded-lg flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5 border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={13} className="text-teal-400" />
                          <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Consensus Arbiter</h3>
                        </div>
                        <span className="text-[8px] bg-teal-950/40 text-teal-400 px-1.5 py-0.5 rounded border border-teal-900/30 font-mono uppercase font-bold">REASONING CORE</span>
                      </div>

                      <p className="text-[10px] text-slate-500 mb-3 leading-tight">
                        Weigh multiple competing AI-generated code blocks, compute multi-criteria benchmarks, and automatically unify conflicting library imports.
                      </p>

                      {/* Decision Strategy Options */}
                      <div className="mb-4">
                        <label className="text-[8px] font-mono text-slate-500 uppercase block mb-1.5">Consensus Formulation Strategy</label>
                        <div className="space-y-1">
                          {[
                            { value: DecisionStrategyType.SECURITY_FIRST, label: "🛡️ Security First", desc: "Prioritize lowest vulnerability score." },
                            { value: DecisionStrategyType.PERFORMANCE_FIRST, label: "⚡ Performance First", desc: "Favor lightning-fast computation runtime." },
                            { value: DecisionStrategyType.MAINTAINABILITY_FIRST, label: "🧼 Clean Code First", desc: "Avoid boilerplate; choose modularity." },
                            { value: DecisionStrategyType.COST_FIRST, label: "🪙 Budget Optimization", desc: "Evaluate API expense and low complexity." },
                            { value: DecisionStrategyType.MAJORITY_CONSENSUS, label: "⚖️ Majority Consensus", desc: "Balanced peer compromise formulation." }
                          ].map((strat) => (
                            <button
                              key={strat.value}
                              onClick={() => {
                                setSelectedDecisionStrategy(strat.value as DecisionStrategyType);
                                addSystemLog("INFO", "DECISION", `Selected decision strategy: ${strat.value}`);
                              }}
                              className={`w-full text-left p-2 rounded transition-all text-xs border ${selectedDecisionStrategy === strat.value ? "bg-teal-950/20 border-teal-800 text-teal-400" : "bg-black/30 border-slate-950 text-slate-400 hover:border-slate-800"}`}
                            >
                              <div className="font-bold font-mono text-white text-[11px]">{strat.label}</div>
                              <div className="text-[9px] text-slate-500 leading-tight mt-0.5">{strat.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Active Candidate Proposals */}
                      <div className="mb-4">
                        <label className="text-[8px] font-mono text-slate-500 uppercase block mb-1.5">Submitted Candidate Proposals</label>
                        <div className="space-y-1.5">
                          {candidateProposals.map(prop => (
                            <div 
                              key={prop.id}
                              onClick={() => {
                                setSelectedProposalDetail(prop);
                                addSystemLog("INFO", "DECISION", `Selected proposal node: ${prop.id}`);
                              }}
                              className={`p-2 rounded border transition-all cursor-pointer text-[10px] font-mono flex items-center justify-between ${selectedProposalDetail?.id === prop.id ? "bg-teal-950/15 border-teal-600 text-teal-300" : "bg-black/40 border-slate-900 text-slate-400 hover:border-slate-700"}`}
                            >
                              <div>
                                <span className="font-bold text-white uppercase">{prop.id}</span>
                                <span className="text-[8px] text-slate-500 block">via {prop.providerId.toUpperCase()} ({prop.modelId})</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] font-bold text-teal-400 block">Complexity: {prop.complexity}</span>
                                <span className="text-[8px] text-slate-500">Est: ${prop.estimatedExecutionCost.toFixed(4)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Trigger Arbiter Engine */}
                      <button
                        onClick={() => handleExecuteDecision()}
                        disabled={isEvaluating}
                        className={`w-full py-2.5 rounded font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${isEvaluating ? "bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800" : "bg-teal-950/40 hover:bg-teal-950/80 text-teal-400 border border-teal-800/60 shadow-[0_0_8px_rgba(20,184,166,0.2)]"}`}
                      >
                        {isEvaluating ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            Weighing algorithms...
                          </>
                        ) : (
                          <>
                            <Play size={11} />
                            Resolve & Arbitrate Solutions
                          </>
                        )}
                      </button>
                    </div>

                    {/* Decision Log Console */}
                    <div className="mt-4 flex flex-col bg-black border border-slate-900 rounded p-2 text-[10px] font-mono text-slate-400">
                      <span className="text-slate-500 text-[8px] uppercase tracking-wider mb-1 flex items-center gap-1 border-b border-slate-950 pb-1">
                        <History size={9} /> Decision Core Trace logs
                      </span>
                      <div className="overflow-y-auto space-y-1 pr-1 text-left select-none max-h-[140px] h-[140px]">
                        {decisionLogs.map((log, idx) => {
                          let color = "text-slate-500";
                          if (log.includes("[SUCCESS]")) color = "text-emerald-400 font-bold";
                          if (log.includes("[DECISION DAEMON]")) color = "text-teal-400 font-bold";
                          if (log.includes("[STRATEGY]")) color = "text-cyan-400";
                          if (log.includes("[ANALYSIS]")) color = "text-slate-300";
                          if (log.includes("[CRITICAL]")) color = "text-rose-400 font-bold";
                          return (
                            <div key={idx} className={`${color} leading-tight text-[9px]`}>
                              {log}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Pane: Decision Outcome View (Col Span 8) */}
                <div className="lg:col-span-8 flex flex-col gap-3">
                  
                  {/* Sub-node Proposal Detail Drawer Modal */}
                  {selectedProposalDetail && (
                    <div className="bg-[#070b0a] border border-teal-900/40 p-4 rounded-lg text-left relative">
                      <button
                        onClick={() => setSelectedProposalDetail(null)}
                        className="absolute top-2.5 right-2.5 text-slate-500 hover:text-white font-mono text-[9px]"
                      >
                        [CLOSE ×]
                      </button>
                      <div className="flex items-center gap-2 border-b border-slate-900 pb-2 mb-3">
                        <span className="text-[8px] font-mono bg-teal-950/40 text-teal-400 px-1.5 py-0.5 rounded border border-teal-900/40 font-bold">CANDIDATE CODE PROPOSAL</span>
                        <h4 className="text-xs font-bold text-white font-mono uppercase">{selectedProposalDetail.id} ({selectedProposalDetail.modelId})</h4>
                      </div>

                      {/* Criteria Score Meter */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
                        {Object.entries(selectedProposalDetail.scores).map(([crit, val]) => (
                          <div key={crit} className="bg-black/60 border border-slate-900 p-2 rounded text-center">
                            <div className="text-[8px] text-slate-500 uppercase font-mono truncate">{crit}</div>
                            <div className="text-xs font-mono font-bold text-teal-400 mt-0.5">{val}/10</div>
                          </div>
                        ))}
                      </div>

                      {/* Snippet */}
                      <div className="bg-black p-3 rounded border border-slate-900 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-[160px] whitespace-pre select-all">
                        {selectedProposalDetail.proposedSolution}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#07070a] border border-slate-900 p-4 rounded-lg flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-teal-400" />
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold font-bold">Consensus Decision Package</h3>
                      </div>
                      
                      {decisionPackageResult && (
                        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                          <span>DECISION: <span className="text-slate-300">{decisionPackageResult.id}</span></span>
                          <span className="text-slate-800">|</span>
                          <span>CONFIDENCE: <span className="text-emerald-400 font-bold">{decisionPackageResult.scores.overallConfidence}%</span></span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 max-h-[500px]">
                      {decisionPackageResult ? (
                        <div className="space-y-4">
                          
                          {/* Top Verdict Block */}
                          <div className="bg-black/50 border border-slate-900 p-3 rounded-lg flex flex-col gap-2">
                            <span className="text-[8px] font-mono text-slate-500 uppercase font-bold">Decision Summary & Supporting Evidence</span>
                            <p className="text-xs text-white leading-relaxed">
                              {decisionPackageResult.supportingEvidence}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-[8px] font-mono bg-teal-950/30 text-teal-400 px-2 py-0.5 rounded border border-teal-900/40">
                                Winner ID: {decisionPackageResult.selectedProposalId.toUpperCase()}
                              </span>
                              <span className="text-[8px] font-mono bg-cyan-950/30 text-cyan-400 px-2 py-0.5 rounded border border-cyan-900/40">
                                Strategy: {decisionPackageResult.strategyUsed}
                              </span>
                            </div>
                          </div>

                          {/* Interactive Conflicts Section */}
                          {decisionPackageResult.conflicts.length > 0 && (
                            <div>
                              <span className="text-[8px] font-mono text-rose-400 uppercase block mb-1.5 font-bold">Detected Architectural Conflicts & Unified Solutions</span>
                              <div className="space-y-2">
                                {decisionPackageResult.conflicts.map(cf => (
                                  <div key={cf.id} className="bg-[#110708] border border-rose-950/50 p-3 rounded-lg text-left">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[9px] font-mono font-bold text-rose-400 uppercase bg-rose-950/50 px-1.5 py-0.5 border border-rose-900/30 rounded">
                                        {cf.category} CONFLICT
                                      </span>
                                      <span className="text-[8px] text-slate-500 font-mono">Involved: [{cf.involvedProposals.join(", ")}]</span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-normal mb-2">
                                      {cf.description}
                                    </p>
                                    <div className="bg-black/40 p-2 rounded border border-rose-950 text-[10px] text-slate-400 font-mono mb-2">
                                      <span className="text-rose-400 font-bold uppercase block text-[8px] mb-0.5">Complexity Trade-off Breakdown</span>
                                      {cf.tradeOffsDescription}
                                    </div>
                                    <div className="bg-emerald-950/15 border border-emerald-900/40 p-2 rounded text-[10px] text-emerald-400 font-mono">
                                      <span className="font-bold text-white uppercase block text-[8px] mb-0.5">Consensus Auto-Resolution Applied</span>
                                      {cf.resolutionSelectedValue}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Agreements Section */}
                          {decisionPackageResult.agreements.length > 0 && (
                            <div>
                              <span className="text-[8px] font-mono text-emerald-400 uppercase block mb-1.5">Unanimous Proposal Agreements</span>
                              <div className="space-y-1.5">
                                {decisionPackageResult.agreements.map(ag => (
                                  <div key={ag.id} className="bg-[#071109] border border-emerald-950/40 p-2.5 rounded text-xs text-left">
                                    <div className="font-bold text-emerald-300 font-mono">{ag.topic}</div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{ag.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Winning Solution Code Box */}
                          <div>
                            <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1.5">Selected Unified Sovereign Code Block</span>
                            <div className="bg-black rounded-lg border border-slate-900 overflow-hidden">
                              <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-900 flex justify-between items-center text-[9px] font-mono text-slate-400">
                                <span>Main Unified Entry Point</span>
                                <span className="text-emerald-400 font-bold uppercase">[VERIFIED CONSISTENT]</span>
                              </div>
                              <div className="p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[220px] whitespace-pre select-all bg-[#030305]">
                                {decisionPackageResult.selectedSolution}
                              </div>
                            </div>
                          </div>

                          {/* Criteria Radial Radar Stats */}
                          <div>
                            <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1.5">Winner Metric Benchmarks</span>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
                              <div className="bg-black/40 border border-slate-950 p-2 rounded">
                                <div className="text-[8px] text-slate-500 uppercase font-mono">Correctness</div>
                                <div className="text-sm font-mono font-bold text-white mt-0.5">{decisionPackageResult.scores.correctness}/10</div>
                              </div>
                              <div className="bg-black/40 border border-slate-950 p-2 rounded">
                                <div className="text-[8px] text-slate-500 uppercase font-mono">Security</div>
                                <div className="text-sm font-mono font-bold text-rose-400 mt-0.5">{decisionPackageResult.scores.security}/10</div>
                              </div>
                              <div className="bg-black/40 border border-slate-950 p-2 rounded">
                                <div className="text-[8px] text-slate-500 uppercase font-mono">Performance</div>
                                <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">{decisionPackageResult.scores.performance}/10</div>
                              </div>
                              <div className="bg-black/40 border border-slate-950 p-2 rounded">
                                <div className="text-[8px] text-slate-500 uppercase font-mono">Scalability</div>
                                <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">{decisionPackageResult.scores.scalability}/10</div>
                              </div>
                              <div className="bg-black/40 border border-slate-950 p-2 rounded">
                                <div className="text-[8px] text-slate-500 uppercase font-mono">Maintainability</div>
                                <div className="text-sm font-mono font-bold text-fuchsia-400 mt-0.5">{decisionPackageResult.scores.maintainability}/10</div>
                              </div>
                            </div>
                          </div>

                          {/* Risk Matrix & Non-functional remaining risks */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                            <div className="bg-black/30 border border-slate-900 p-3 rounded-lg">
                              <span className="text-[8px] font-mono text-rose-400 uppercase block mb-1 font-bold">Remaining Residual Risks</span>
                              <div className="space-y-1">
                                {decisionPackageResult.riskAssessment.remainingRisks.map((risk, idx) => (
                                  <div key={idx} className="text-[10px] text-slate-300 font-mono leading-tight flex items-start gap-1">
                                    <span className="text-rose-500 shrink-0">•</span>
                                    <span>{risk}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-black/30 border border-slate-900 p-3 rounded-lg">
                              <span className="text-[8px] font-mono text-cyan-400 uppercase block mb-1 font-bold">Unknown Architecture Parameters</span>
                              <div className="space-y-1">
                                {decisionPackageResult.riskAssessment.unknowns.map((un, idx) => (
                                  <div key={idx} className="text-[10px] text-slate-300 font-mono leading-tight flex items-start gap-1">
                                    <span className="text-cyan-500 shrink-0">•</span>
                                    <span>{un}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Gated Override & Sign-off Actions */}
                          <div className="bg-teal-950/10 border border-teal-900/30 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-left">
                            <div>
                              <span className="text-[8px] font-mono text-teal-400 uppercase block font-bold">Recommended Gated Next Step</span>
                              <span className="text-slate-300">{decisionPackageResult.recommendedNextStep}</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  DecisionEngine.getInstance().registerHumanOverride();
                                  setDecisionMetrics(DecisionEngine.getInstance().getMetrics());
                                  addSystemLog("SECURE", "DECISION", "Human architect signature-off verified. Deploy authorization code generated.");
                                }}
                                className="px-3 py-1.5 rounded bg-teal-900 hover:bg-teal-850 text-teal-300 border border-teal-700/60 font-bold font-mono text-[10px] uppercase cursor-pointer"
                              >
                                Sign-off & Override
                              </button>
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="text-slate-600 flex flex-col items-center justify-center h-full gap-2 py-24">
                          <CheckCircle size={22} className="opacity-40 text-teal-500 animate-bounce" />
                          <span>Awaiting dynamic consensus computation...</span>
                          <span className="text-[9px] text-slate-500">Select a consensus strategy and click Resolve & Arbitrate Solutions.</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}


        </div>

        {/* RIGHT PANEL: INTERACTIVE CONFIGURATION & SECURITY POLICY */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          
          {/* Navigation Tab Header */}
          <div className="flex border-b border-slate-900">
            <button
              onClick={() => {
                setRightTab("stack");
                addSystemLog("INFO", "GUI", "Switched right configuration panel to Tech Stack.");
              }}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider border-b-2 text-center transition-all ${rightTab === "stack" ? "border-cyan-500 text-white font-bold" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              Technology Stack
            </button>
            <button
              onClick={() => {
                setRightTab("security");
                addSystemLog("INFO", "GUI", "Switched right configuration panel to Security Guard.");
              }}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider border-b-2 text-center transition-all ${rightTab === "security" ? "border-cyan-500 text-white font-bold" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              Security Policy
            </button>
          </div>

          {/* Tab 1: Tech Stack Selection */}
          {rightTab === "stack" && (
            <div className="bg-[#0b0b11] border border-slate-900 p-4 rounded-lg flex-1 flex flex-col min-h-[350px]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                <Settings size={13} className="text-cyan-500" />
                Stack Customizer
              </h2>
              <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                Tweak technology parameters to modify global Scalability & Security scores.
              </p>

              {/* Stack Category Sections */}
              <div className="space-y-4 overflow-y-auto flex-1 max-h-[380px] pr-1">
                
                {/* Languages */}
                <div>
                  <div className="text-[9px] text-cyan-500 font-bold uppercase font-mono tracking-widest mb-1.5">
                    Core programming language
                  </div>
                  <div className="space-y-1.5">
                    {STACK_OPTIONS.filter(o => o.category === "language").map(option => (
                      <div
                        key={option.id}
                        onClick={() => toggleStackOption(option)}
                        className={`p-2 rounded border cursor-pointer transition-all text-xs ${selectedStackIds.includes(option.id) ? "bg-cyan-950/20 border-cyan-800/60" : "bg-black/20 border-slate-950 hover:bg-slate-900/20"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${selectedStackIds.includes(option.id) ? "text-white" : "text-slate-400"}`}>
                            {option.name}
                          </span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] ${selectedStackIds.includes(option.id) ? "border-cyan-500 bg-cyan-500 text-black font-bold" : "border-slate-700"}`}>
                            {selectedStackIds.includes(option.id) && "✓"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{option.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Databases */}
                <div>
                  <div className="text-[9px] text-cyan-500 font-bold uppercase font-mono tracking-widest mb-1.5">
                    Local Structured Database
                  </div>
                  <div className="space-y-1.5">
                    {STACK_OPTIONS.filter(o => o.category === "database").map(option => (
                      <div
                        key={option.id}
                        onClick={() => toggleStackOption(option)}
                        className={`p-2 rounded border cursor-pointer transition-all text-xs ${selectedStackIds.includes(option.id) ? "bg-cyan-950/20 border-cyan-800/60" : "bg-black/20 border-slate-950 hover:bg-slate-900/20"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${selectedStackIds.includes(option.id) ? "text-white" : "text-slate-400"}`}>
                            {option.name}
                          </span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] ${selectedStackIds.includes(option.id) ? "border-cyan-500 bg-cyan-500 text-black font-bold" : "border-slate-700"}`}>
                            {selectedStackIds.includes(option.id) && "✓"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{option.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vector Database */}
                <div>
                  <div className="text-[9px] text-cyan-500 font-bold uppercase font-mono tracking-widest mb-1.5">
                    Cognitive Vector Index
                  </div>
                  <div className="space-y-1.5">
                    {STACK_OPTIONS.filter(o => o.category === "vectordb").map(option => (
                      <div
                        key={option.id}
                        onClick={() => toggleStackOption(option)}
                        className={`p-2 rounded border cursor-pointer transition-all text-xs ${selectedStackIds.includes(option.id) ? "bg-cyan-950/20 border-cyan-800/60" : "bg-black/20 border-slate-950 hover:bg-slate-900/20"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${selectedStackIds.includes(option.id) ? "text-white" : "text-slate-400"}`}>
                            {option.name}
                          </span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] ${selectedStackIds.includes(option.id) ? "border-cyan-500 bg-cyan-500 text-black font-bold" : "border-slate-700"}`}>
                            {selectedStackIds.includes(option.id) && "✓"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{option.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Security Config & Simulator */}
          {rightTab === "security" && (
            <div className="bg-[#0b0b11] border border-slate-900 p-4 rounded-lg flex-1 flex flex-col min-h-[350px]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                <Shield size={13} className="text-amber-500" />
                Security Whitelists
              </h2>

              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Configure direct regex / parameter constraints. Standard files are locked.
              </p>

              <div className="space-y-4 flex-1 overflow-y-auto max-h-[250px] pr-1">
                
                {/* Whitelisted commands */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] text-amber-500 font-bold uppercase font-mono tracking-widest">
                      Allowed Exec commands
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">({policy.allowedCommands.length})</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto bg-black/40 border border-slate-950 rounded p-1.5 space-y-1">
                    {policy.allowedCommands.map(cmd => (
                      <div key={cmd} className="flex justify-between items-center text-[10px] font-mono p-1 bg-[#07070a] rounded text-slate-300">
                        <span className="truncate max-w-[140px]">{cmd}</span>
                        <button
                          onClick={() => {
                            setPolicy(prev => ({ ...prev, allowedCommands: prev.allowedCommands.filter(c => c !== cmd) }));
                            addSystemLog("WARN", "SECURITY", `Removed "${cmd}" from allowed command whitelists.`);
                          }}
                          className="text-slate-600 hover:text-rose-400 transition-colors"
                        >
                          <Trash size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <input
                      type="text"
                      value={newCommand}
                      onChange={(e) => setNewCommand(e.target.value)}
                      placeholder="Add command pattern..."
                      className="flex-1 bg-black/60 border border-slate-900 rounded p-1 text-[10px] text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => {
                        if (!newCommand.trim()) return;
                        setPolicy(prev => ({ ...prev, allowedCommands: [...prev.allowedCommands, newCommand.trim()] }));
                        addSystemLog("SECURE", "SECURITY", `Added custom allowed pattern: "${newCommand.trim()}"`);
                        setNewCommand("");
                      }}
                      className="p-1 bg-amber-950 border border-amber-900/60 text-amber-400 hover:bg-amber-900 rounded text-[10px]"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Restricted Paths */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] text-rose-500 font-bold uppercase font-mono tracking-widest">
                      Restricted File Scopes
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">({policy.restrictedPaths.length})</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto bg-black/40 border border-slate-950 rounded p-1.5 space-y-1">
                    {policy.restrictedPaths.map(p => (
                      <div key={p} className="flex justify-between items-center text-[10px] font-mono p-1 bg-[#07070a] rounded text-slate-300">
                        <span className="truncate text-rose-400 font-bold">{p}</span>
                        <button
                          onClick={() => {
                            setPolicy(prev => ({ ...prev, restrictedPaths: prev.restrictedPaths.filter(path => path !== p) }));
                            addSystemLog("WARN", "SECURITY", `Removed restricted scope: "${p}"`);
                          }}
                          className="text-slate-600 hover:text-rose-400 transition-colors"
                        >
                          <Trash size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <input
                      type="text"
                      value={newPath}
                      onChange={(e) => setNewPath(e.target.value)}
                      placeholder="Add system path..."
                      className="flex-1 bg-black/60 border border-slate-900 rounded p-1 text-[10px] text-white font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (!newPath.trim()) return;
                        setPolicy(prev => ({ ...prev, restrictedPaths: [...prev.restrictedPaths, newPath.trim()] }));
                        addSystemLog("SECURE", "SECURITY", `Added restriction folder scope: "${newPath.trim()}"`);
                        setNewPath("");
                      }}
                      className="p-1 bg-rose-950 border border-rose-900/60 text-rose-400 hover:bg-rose-900 rounded text-[10px]"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Whitelists domain bypass settings */}
                <div className="pt-2 border-t border-slate-950">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Auto-Approve Safe Flags</span>
                    <button
                      onClick={() => {
                        setPolicy(prev => {
                          const val = !prev.autoApproveSafe;
                          addSystemLog("SECURE", "SECURITY", `Bypass state updated to: ${val ? "Permissive (Auto-Approve)" : "Strict (Manual Consent Required)"}`);
                          return { ...prev, autoApproveSafe: val };
                        });
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors border ${policy.autoApproveSafe ? "bg-amber-950/40 text-amber-500 border-amber-900/60" : "bg-slate-950 text-slate-500 border-slate-900"}`}
                    >
                      {policy.autoApproveSafe ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>

              </div>

              {/* Real-time Sandbox Command Execution Tester */}
              <div className="mt-4 pt-4 border-t border-slate-900 bg-[#07070a] p-3 rounded-lg border border-slate-900">
                <div className="text-[10px] uppercase tracking-wider text-amber-500 font-mono font-bold mb-2 flex items-center gap-1">
                  <TerminalIcon size={12} /> Live Command Sandbox Tester
                </div>

                <div className="flex gap-1.5 mb-3">
                  <input
                    type="text"
                    value={simCommand}
                    onChange={(e) => setSimCommand(e.target.value)}
                    placeholder="Type bash sequence (e.g., git status)"
                    className="flex-1 bg-black border border-slate-900 rounded px-2 py-1.5 text-[11px] font-mono text-white focus:outline-none"
                    disabled={isSimulating}
                  />
                  <button
                    onClick={handleSimulateCommand}
                    disabled={isSimulating}
                    className="bg-amber-950 hover:bg-amber-900 border border-amber-900/60 text-amber-400 px-3 py-1.5 rounded text-[11px] font-mono flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    {isSimulating ? "RUNNING" : "EXEC"} <Play size={9} />
                  </button>
                </div>

                {/* Simulation Output list */}
                {simLogs.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {simLogs.map((step, idx) => (
                      <div key={idx} className="bg-black/50 p-2 rounded border border-slate-950 text-[10px] leading-relaxed">
                        <div className="flex items-center justify-between font-mono mb-1">
                          <span className="text-white font-bold">{step.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border ${step.status === "success" ? "bg-emerald-950/20 border-emerald-900/60 text-emerald-400" : step.status === "warning" ? "bg-amber-950/20 border-amber-900/60 text-amber-400 animate-pulse" : step.status === "failed" ? "bg-rose-950/20 border-rose-900/60 text-rose-400" : "bg-cyan-950/20 border-cyan-900/40 text-cyan-400 animate-pulse"}`}>
                            {step.status}
                          </span>
                        </div>
                        <div className="font-mono text-slate-400 text-[10px] italic">{step.log}</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{step.details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-600 text-center py-2 font-mono italic">
                    Type a command or select a preset below to see the Sandbox Security intercept logs.
                  </div>
                )}

                {/* Preset helpers */}
                <div className="mt-3 flex flex-wrap gap-1">
                  <button
                    onClick={() => setSimCommand("git commit -m 'feat: initial config'")}
                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-[9px] text-slate-400 font-mono transition-all"
                  >
                    git commit
                  </button>
                  <button
                    onClick={() => setSimCommand("rm -rf /etc/passwd")}
                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-[9px] text-rose-400 font-mono transition-all"
                  >
                    rm -rf
                  </button>
                  <button
                    onClick={() => setSimCommand("curl http://malicious-server.net")}
                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-[9px] text-rose-400 font-mono transition-all"
                  >
                    curl http
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      {/* ROADMAP TIMELINE EXPANSION (Collapsible / Expandable Panel) */}
      <div className="mt-6 bg-[#0b0b11] border border-slate-900 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <ListTodo size={14} className="text-cyan-500" />
            Phase 1 Foundation Development Roadmap
          </h2>
          <span className="text-[9px] font-mono text-cyan-600 uppercase">Independent testable increments</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {ROADMAP_MILESTONES.map((milestone, index) => (
            <div key={index} className="bg-black/40 border border-slate-950 p-3 rounded-lg relative overflow-hidden flex flex-col justify-between">
              
              {/* Badge */}
              <div className="absolute top-0 right-0 bg-[#0d0d14] border-l border-b border-slate-900 px-2 py-0.5 text-[9px] font-mono text-cyan-500 uppercase tracking-widest">
                {milestone.phase}
              </div>

              <div>
                <h3 className="text-xs font-bold text-white mb-2 max-w-[150px] leading-tight font-display">{milestone.title}</h3>
                
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold mb-1">Deliverables</div>
                <ul className="space-y-1 mb-3">
                  {milestone.deliverables.map((del, i) => (
                    <li key={i} className="text-[10px] text-slate-400 leading-snug flex items-start gap-1">
                      <span className="text-cyan-600 font-bold">•</span>
                      <span>{del}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2.5 border-t border-slate-900/60">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold mb-1">Milestone Test Strategy</div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-mono italic">
                  {milestone.testStrategy}
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM IMMERSIVE TERMINAL (Live System Output Logs & Interactive Shell trace) */}
      <div className="mt-6 bg-black border border-cyan-950 p-4 font-mono text-[11px] leading-relaxed relative rounded">
        
        {/* Terminal Header Info */}
        <div className="absolute top-0 right-4 bg-black px-2 -translate-y-1/2 text-cyan-800 text-[9px] uppercase tracking-widest font-mono flex items-center gap-1">
          <Activity size={10} className="text-cyan-500" /> Live Audited Event Log stream
        </div>

        {/* Stream */}
        <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
          {systemLogs.map((log, idx) => (
            <div key={idx} className="flex gap-2 items-start hover:bg-slate-950/60 p-0.5 rounded transition-colors">
              <span className="text-slate-600 select-none">[{log.timestamp}]</span>
              
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold select-none ${log.level === "SYS" ? "bg-cyan-950/30 text-cyan-500 border border-cyan-900/40" : log.level === "SECURE" ? "bg-amber-950/30 text-amber-500 border border-amber-900/40" : log.level === "WARN" ? "bg-rose-950/20 text-rose-500 border border-rose-900/40" : "bg-slate-900 text-slate-400"}`}>
                {log.level}
              </span>

              <span className="text-cyan-700 font-bold">[{log.module}]</span>
              <span className="text-slate-400 flex-1">{log.message}</span>
            </div>
          ))}
          <div className="text-cyan-500 animate-pulse font-bold mt-1.5">
            &gt; SYSTEM CORE ENGINE IN STANDBY STATUS. AWAITING DESIGN REFINEMENT INSTRUCTIONS...
          </div>
        </div>

      </div>

    </div>
  );
}
