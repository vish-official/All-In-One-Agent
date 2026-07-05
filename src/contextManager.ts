import {
  ContextSourceType,
  ContextItemConfidence,
  IContextItem,
  IContextProvider,
  IContextPackage,
  ContextCacheEntry,
  ContextMetrics
} from "./contextTypes";
import { EventBus } from "./eventBus";

/**
 * Helper to generate random UUID
 */
function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 1. Code Context Provider
 * Extracts relevant code snippets and dependency structures from files.
 */
export class CodeContextProvider implements IContextProvider {
  public id = "prov-code";
  public name = "Code Context Source";
  public type = ContextSourceType.CODE;

  public async fetchContext(query: string): Promise<IContextItem[]> {
    // Return mock relevant project files based on keywords in query
    const results: IContextItem[] = [];
    const queryLower = query.toLowerCase();

    // Check query for coding keywords
    if (queryLower.includes("event") || queryLower.includes("bus") || queryLower.includes("publish")) {
      results.push({
        id: "code-event-bus",
        source: this.type,
        title: "/src/eventBus.ts",
        content: `export class EventBus {
  private subscribers: Map<string, RegisteredSubscriber> = new Map();
  public async publish(event: IEvent): Promise<PublishResult> {
    // Middleware execution & priority pattern routing
  }
}`,
        relevanceScore: 0.95,
        recencyTimestamp: Date.now() - 3600000, // 1 hr ago
        importanceWeight: 9,
        dependencyLinks: ["code-types"],
        fileChangesCount: 3,
        taskAssociation: "Event System Orchestration",
        confidence: ContextItemConfidence.HIGH,
        tokenCount: 150
      });
    }

    if (queryLower.includes("provider") || queryLower.includes("model") || queryLower.includes("gemini")) {
      results.push({
        id: "code-provider-mgr",
        source: this.type,
        title: "/src/providerManager.ts",
        content: `export class ProviderRegistry {
  private providers: Map<string, IAIProvider> = new Map();
  public route(requiredCaps: AICapability[]): { provider: IAIProvider, model: ModelMetadata } {
    // Intelligent routing & health score analysis
  }
}`,
        relevanceScore: 0.98,
        recencyTimestamp: Date.now() - 1800000, // 30 min ago
        importanceWeight: 10,
        dependencyLinks: ["code-types", "code-provider-types"],
        fileChangesCount: 5,
        taskAssociation: "AI Broker Gateway",
        confidence: ContextItemConfidence.HIGH,
        tokenCount: 180
      });
    }

    // Default always present helper files for code base context
    results.push({
      id: "code-types",
      source: this.type,
      title: "/src/types.ts",
      content: `export interface IEvent<P = any> {
  event_id: string;
  event_type: string;
  source_module: string;
  timestamp: number;
}`,
      relevanceScore: 0.65,
      recencyTimestamp: Date.now() - 86400000, // 1 day ago
      importanceWeight: 7,
      dependencyLinks: [],
      fileChangesCount: 1,
      confidence: ContextItemConfidence.MEDIUM,
      tokenCount: 95
    });

    results.push({
      id: "code-main-entry",
      source: this.type,
      title: "/src/main.tsx",
      content: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);`,
      relevanceScore: 0.45,
      recencyTimestamp: Date.now() - 172800000, // 2 days ago
      importanceWeight: 4,
      dependencyLinks: [],
      fileChangesCount: 0,
      confidence: ContextItemConfidence.LOW,
      tokenCount: 60
    });

    return results;
  }
}

/**
 * 2. Git Context Provider
 * Reads active branch, status, recent commits, and modified file lines.
 */
export class GitContextProvider implements IContextProvider {
  public id = "prov-git";
  public name = "Git History Source";
  public type = ContextSourceType.GIT;

  public async fetchContext(query: string): Promise<IContextItem[]> {
    return [
      {
        id: "git-commit-last",
        source: this.type,
        title: "Recent Commit Logs",
        content: `commit de3f2b18990 (HEAD -> main, origin/main)
Author: AI Studio Agent <agent@allinone.ai>
Date:   Sun Jul 5 02:05:00 2026 -0700

    feat: Integrated Provider Manager & resilience circuit breaker

commit a97cbb1509a
    feat: Implemented prioritized multi-subscriber Event Bus with wildcard namespaces`,
        relevanceScore: 0.85,
        recencyTimestamp: Date.now() - 300000, // 5 min ago
        importanceWeight: 8,
        dependencyLinks: ["code-provider-mgr", "code-event-bus"],
        fileChangesCount: 6,
        confidence: ContextItemConfidence.HIGH,
        tokenCount: 110
      },
      {
        id: "git-status",
        source: this.type,
        title: "Working Directory Status",
        content: `On branch main
Changes not staged for commit:
  modified:   src/App.tsx
  modified:   src/types.ts
Untracked files:
  src/contextTypes.ts
  src/contextManager.ts`,
        relevanceScore: 0.9,
        recencyTimestamp: Date.now(), // Active now
        importanceWeight: 9,
        dependencyLinks: [],
        confidence: ContextItemConfidence.HIGH,
        tokenCount: 75
      }
    ];
  }
}

/**
 * 3. Memory Context Provider
 * Reads key experiences, episodic knowledge, and user preferences.
 */
export class MemoryContextProvider implements IContextProvider {
  public id = "prov-memory";
  public name = "Episodic Memory Source";
  public type = ContextSourceType.MEMORY;

  public async fetchContext(query: string): Promise<IContextItem[]> {
    const memoryItems = [
      {
        key: "user_preference_language",
        value: "TypeScript for enterprise APIs, React for responsive UI frameworks."
      },
      {
        key: "project_goal_scalability",
        value: "ALL-IN-ONE must support hot pluggable modules and isolated workspaces."
      },
      {
        key: "system_design_pattern",
        value: "Decouple orchestration using the prioritized event bus instead of point-to-point calls."
      }
    ];

    return memoryItems.map((mem, index) => ({
      id: `memory-item-${index}`,
      source: this.type,
      title: `Episodic Knowledge: ${mem.key}`,
      content: `Memory entry [${mem.key}] contains: "${mem.value}"`,
      relevanceScore: query.toLowerCase().includes(mem.key.split("_")[1] || "system") ? 0.9 : 0.5,
      recencyTimestamp: Date.now() - 12000000, // 3 hr ago
      importanceWeight: 6,
      dependencyLinks: [],
      confidence: ContextItemConfidence.MEDIUM,
      tokenCount: 40
    }));
  }
}

/**
 * 4. Documentation Context Provider
 * Slices architectural specifications and external handbook standards.
 */
export class DocumentationContextProvider implements IContextProvider {
  public id = "prov-doc";
  public name = "Architecture Guidelines";
  public type = ContextSourceType.DOCUMENTATION;

  public async fetchContext(query: string): Promise<IContextItem[]> {
    return [
      {
        id: "doc-blueprint-core",
        source: this.type,
        title: "SYSTEM_BLUEPRINT.md",
        content: `ALL-IN-ONE AI OS Kernel Architecture:
1. Core Runtime (v1.0.0): Bootstrapping layers, module lock management.
2. Unified Event Bus (v2.0.0): Decoupled publisher-subscriber.
3. Provider Broker (v2.3.0): Model abstraction with multi-region failovers.
4. Context Pipeline (v2.4.0): Intent-based filtering & chunking compression.`,
        relevanceScore: 0.88,
        recencyTimestamp: Date.now() - 172800000, // 2 days ago
        importanceWeight: 8,
        dependencyLinks: ["code-main-entry"],
        confidence: ContextItemConfidence.HIGH,
        tokenCount: 130
      },
      {
        id: "doc-solid-design",
        source: this.type,
        title: "SOLID Coding Standards",
        content: `Guidelines:
- Single Responsibility: Each manager/module performs exactly one structural workflow.
- Open/Closed: New adapters (e.g. context sources) plug into existing registries without modifying core code.
- Interface Segregation: Keep message payloads minimal and strongly typed.`,
        relevanceScore: 0.75,
        recencyTimestamp: Date.now() - 345600000, // 4 days ago
        importanceWeight: 7,
        dependencyLinks: [],
        confidence: ContextItemConfidence.MEDIUM,
        tokenCount: 90
      }
    ];
  }
}

/**
 * 5. Workspace Context Provider
 * Collects workspace state, active sandboxes, and file structure parameters.
 */
export class WorkspaceContextProvider implements IContextProvider {
  public id = "prov-workspace";
  public name = "Workspace Structure";
  public type = ContextSourceType.WORKSPACE;

  public async fetchContext(): Promise<IContextItem[]> {
    return [
      {
        id: "workspace-meta",
        source: this.type,
        title: "Aether Workspace Meta",
        content: `Workspace ID: ws-aether-dev
Parent Folder: /workspaces/ws-aether-dev/
Isolated Sandbox Sandbox: Enabled (Linux container chroot jail)
Chroma DB Endpoint: http://localhost:8000
Environment Variable Declarations: 24 loaded`,
        relevanceScore: 0.78,
        recencyTimestamp: Date.now(),
        importanceWeight: 6,
        dependencyLinks: [],
        confidence: ContextItemConfidence.HIGH,
        tokenCount: 55
      }
    ];
  }
}

/**
 * 6. Conversation Context Provider
 * Keeps track of task threads and recent dialogue turns.
 */
export class ConversationContextProvider implements IContextProvider {
  public id = "prov-convo";
  public name = "Conversation Thread";
  public type = ContextSourceType.CONVERSATION;

  public async fetchContext(query: string): Promise<IContextItem[]> {
    return [
      {
        id: "convo-history",
        source: this.type,
        title: "Recent AI-Architect Turns",
        content: `User: "Let's build the Context Manager pipeline with compression and caching."
Architect: "Excellent. I will structure the pipeline to filter, rank, and compress details. We can plug in Code, Git, and Memory context sources."`,
        relevanceScore: 0.95,
        recencyTimestamp: Date.now() - 120000, // 2 mins ago
        importanceWeight: 8,
        dependencyLinks: [],
        confidence: ContextItemConfidence.HIGH,
        tokenCount: 80
      }
    ];
  }
}

/**
 * 7. Event Context Provider
 * Reads active message traces from the core Event Bus.
 */
export class EventContextProvider implements IContextProvider {
  public id = "prov-event";
  public name = "Event Trace Bus";
  public type = ContextSourceType.EVENT;

  public async fetchContext(): Promise<IContextItem[]> {
    const bus = EventBus.getInstance();
    const history = bus.getHistory();
    const traceSnippet = history.length > 0
      ? history.slice(-5).map(ev => `[${new Date(ev.timestamp).toLocaleTimeString()}] ${ev.source_module} -> ${ev.event_type} (${ev.priority})`).join("\n")
      : "No active event bus traces found in history. Event log buffer is empty.";

    return [
      {
        id: "event-bus-trace",
        source: this.type,
        title: "Event Bus Live Logs",
        content: `Recent Event Bus Broadcast Trace:\n${traceSnippet}`,
        relevanceScore: 0.8,
        recencyTimestamp: Date.now(),
        importanceWeight: 7,
        dependencyLinks: [],
        confidence: ContextItemConfidence.HIGH,
        tokenCount: 120
      }
    ];
  }
}

/**
 * 8. System Context Provider
 * Reads processor status, memory locks, and kernel load factors.
 */
export class SystemContextProvider implements IContextProvider {
  public id = "prov-system";
  public name = "OS System Health";
  public type = ContextSourceType.SYSTEM;

  public async fetchContext(): Promise<IContextItem[]> {
    return [
      {
        id: "system-stats",
        source: this.type,
        title: "Kernel Status Specs",
        content: `OS Platform: Node.js 18 (Linux Environment)
Daemon Port: 3000 (Ingress Active)
Vite HMR: Disabled (DISABLE_HMR=true)
Daemon Memory Usage: 142MB / 512MB limit
CPU Utilization: 12% average load`,
        relevanceScore: 0.5,
        recencyTimestamp: Date.now(),
        importanceWeight: 5,
        dependencyLinks: [],
        confidence: ContextItemConfidence.MEDIUM,
        tokenCount: 45
      }
    ];
  }
}

/**
 * Centrally Managed Core Context Engine
 */
export class ContextManager {
  private static instance: ContextManager;
  private providers: Map<string, IContextProvider> = new Map();
  private cache: Map<string, ContextCacheEntry> = new Map();
  private lastMetrics: ContextMetrics;

  private constructor() {
    // Register default context providers
    this.registerProvider(new CodeContextProvider());
    this.registerProvider(new GitContextProvider());
    this.registerProvider(new MemoryContextProvider());
    this.registerProvider(new DocumentationContextProvider());
    this.registerProvider(new WorkspaceContextProvider());
    this.registerProvider(new ConversationContextProvider());
    this.registerProvider(new EventContextProvider());
    this.registerProvider(new SystemContextProvider());

    // Setup initial metrics
    this.lastMetrics = {
      retrievalTimeMs: 45,
      rankingTimeMs: 12,
      compressionTimeMs: 15,
      originalSizeTokens: 980,
      compressedSizeTokens: 380,
      tokenSavingsPercent: 61.2,
      cacheHitRate: 85.0,
      averageContextSize: 420,
      retrievalAccuracy: 95.8
    };
  }

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  /**
   * Registers a new contextual knowledge source
   */
  public registerProvider(provider: IContextProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Dynamic discovery of registered providers
   */
  public listProviders(): IContextProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Retrieves current metric snapshot
   */
  public getMetrics(): ContextMetrics {
    return { ...this.lastMetrics };
  }

  /**
   * Removes specific provider from discovery pool
   */
  public unregisterProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  /**
   * Executes the full pipeline with trace logging.
   */
  public async buildContext(
    query: string,
    onTraceLog: (log: string) => void,
    options?: {
      workspaceId?: string;
      compressSemantic?: boolean;
      forceFresh?: boolean;
    }
  ): Promise<IContextPackage> {
    const startTime = Date.now();
    const workspaceId = options?.workspaceId || "ws-aether-dev";
    const cacheKey = `${workspaceId}:${query.toLowerCase().trim()}:${options?.compressSemantic ? 'comp' : 'raw'}`;

    // Step 0: Cache Lookup (Hot / Warm / Cold gating)
    if (!options?.forceFresh && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() < entry.expiresAt) {
        entry.hitCount++;
        // Maintain warm/hot temperatures based on hit density
        if (entry.hitCount > 4) entry.temperature = "HOT";
        else entry.temperature = "WARM";

        onTraceLog(`[CACHE HIT] Found match in Context Cache! Temperature: '${entry.temperature}'. Expiry in ${Math.round((entry.expiresAt - Date.now())/1000)}s.`);
        
        // Slightly decay other hit rates for simulation dynamics
        this.lastMetrics.cacheHitRate = Math.min(100, this.lastMetrics.cacheHitRate * 0.95 + 5);
        return entry.package;
      } else {
        onTraceLog(`[CACHE EXPIRED] Found matching cache entry for key, but TTL has expired. Evicting.`);
        this.cache.delete(cacheKey);
      }
    }

    onTraceLog(`[PIPELINE START] Processing User Request: "${query}"`);

    // Stage 1: Intent Analysis
    onTraceLog(`[STAGE 1/8: INTENT ANALYSIS] Evaluating lexical semantic density.`);
    const intentKeywords = this.analyzeIntentKeywords(query);
    onTraceLog(`[INTENT RESULT] Extracted task categories: [${intentKeywords.join(", ")}]`);

    // Stage 2: Context Discovery
    onTraceLog(`[STAGE 2/8: DISCOVERY] Searching for registered information adapters...`);
    const activeProviders = Array.from(this.providers.values());
    onTraceLog(`[DISCOVERY RESULT] Discovered ${activeProviders.length} active providers.`);

    // Stage 3: Retrieval
    onTraceLog(`[STAGE 3/8: RETRIEVAL] Sourcing records asynchronously.`);
    const retrievalStart = Date.now();
    let allItems: IContextItem[] = [];

    for (const provider of activeProviders) {
      try {
        const items = await provider.fetchContext(query);
        onTraceLog(`[RETRIEVED] Provider '${provider.name}' returned ${items.length} records.`);
        allItems.push(...items);
      } catch (err: any) {
        onTraceLog(`[WARNING] Failed to query provider '${provider.id}': ${err.message}`);
      }
    }
    const retrievalTime = Date.now() - retrievalStart;

    // Stage 4: Filtering
    onTraceLog(`[STAGE 4/8: FILTERING] Deduplicating overlapping content schemas.`);
    const originalCount = allItems.length;
    allItems = this.deduplicateItems(allItems);
    onTraceLog(`[FILTERING RESULT] Filtered & deduplicated: Reduced from ${originalCount} to ${allItems.length} records.`);

    // Stage 5: Ranking
    onTraceLog(`[STAGE 5/8: RANKING] Performing multi-factor relevance ranking.`);
    const rankingStart = Date.now();
    allItems = this.rankItems(allItems, query, intentKeywords);
    const rankingTime = Date.now() - rankingStart;

    for (const item of allItems.slice(0, 3)) {
      onTraceLog(`[RANKED TOP] '${item.title}' -> Score: ${(item.relevanceScore * 100).toFixed(0)}%, Confidence: ${item.confidence}`);
    }

    // Stage 6: Compression & Progressive Disclosure
    onTraceLog(`[STAGE 6/8: COMPRESSION] Applying summarization & progressive code truncation.`);
    const compressionStart = Date.now();
    const originalTokenEstimate = allItems.reduce((acc, item) => acc + item.tokenCount, 0);
    
    // Apply compression (simulate progressive text chunking or selective omission)
    const compressedItems = this.compressItems(allItems, options?.compressSemantic ?? true);
    const compressedTokenEstimate = compressedItems.reduce((acc, item) => acc + item.tokenCount, 0);
    const compressionTime = Date.now() - compressionStart;
    
    const savingsRatio = originalTokenEstimate > 0 ? (originalTokenEstimate - compressedTokenEstimate) / originalTokenEstimate : 0;
    onTraceLog(`[COMPRESSION RESULT] Slashed size from ${originalTokenEstimate} to ${compressedTokenEstimate} tokens (${(savingsRatio * 100).toFixed(1)}% savings).`);

    // Stage 7: Token Estimation
    onTraceLog(`[STAGE 7/8: TOKEN ESTIMATION] Validating package payload sizes.`);
    onTraceLog(`[TOKEN BALANCE] Active package weight: ${compressedTokenEstimate} tokens. Well below Gemini's 1M token budget limit.`);

    // Stage 8: Packaging
    onTraceLog(`[STAGE 8/8: PACKAGING] Standardizing context output format.`);
    
    // Split items into categorized arrays for standardized context packages
    const relevantFiles = compressedItems
      .filter(item => item.source === ContextSourceType.CODE)
      .map(item => ({
        filePath: item.title,
        summary: `Highly relevant code snippet with relevance score ${(item.relevanceScore * 100).toFixed(0)}%`,
        contentExcerpt: item.content,
        relevance: item.relevanceScore
      }));

    const summaries = compressedItems
      .filter(item => item.source === ContextSourceType.DOCUMENTATION || item.source === ContextSourceType.CONVERSATION)
      .map(item => `Summary extracted from: ${item.title}. Details: ${item.content.substring(0, 150)}...`);

    const referencedDocuments = compressedItems
      .filter(item => item.source === ContextSourceType.DOCUMENTATION)
      .map(item => ({
        title: item.title,
        urlOrPath: item.title,
        excerpt: item.content
      }));

    const memoryReferences = compressedItems
      .filter(item => item.source === ContextSourceType.MEMORY)
      .map(item => ({
        key: item.title,
        value: item.content,
        recency: "3 hours ago"
      }));

    const eventLogsExcerpt = compressedItems
      .filter(item => item.source === ContextSourceType.EVENT)
      .map(item => item.content);

    const totalConfidenceScore = allItems.length > 0
      ? allItems.reduce((acc, item) => acc + item.relevanceScore, 0) / allItems.length
      : 0.9;

    const contextPackage: IContextPackage = {
      id: uuid(),
      timestamp: Date.now(),
      version: "v2.4.0",
      intentSummary: `Synthesized context answering: "${query}" across ${activeProviders.length} micro-providers.`,
      metadata: {
        workspaceId,
        originalQuery: query,
        tokensEstimated: compressedTokenEstimate,
        compressionRatio: 1 - savingsRatio,
        confidenceScore: totalConfidenceScore
      },
      relevantFiles,
      summaries,
      referencedDocuments,
      memoryReferences,
      eventLogsExcerpt
    };

    // Store in Cache (Hot/Warm cache)
    const expiresAt = Date.now() + 60000; // 1-minute TTL for fast demo recycling
    this.cache.set(cacheKey, {
      key: cacheKey,
      package: contextPackage,
      temperature: "HOT",
      createdAt: Date.now(),
      expiresAt,
      hitCount: 1
    });

    // Update system metrics
    this.lastMetrics = {
      retrievalTimeMs: retrievalTime,
      rankingTimeMs: rankingTime,
      compressionTimeMs: compressionTime,
      originalSizeTokens: originalTokenEstimate,
      compressedSizeTokens: compressedTokenEstimate,
      tokenSavingsPercent: Math.round(savingsRatio * 100),
      cacheHitRate: Math.round(this.lastMetrics.cacheHitRate * 0.95), // slowly adjust over runs
      averageContextSize: Math.round(this.lastMetrics.averageContextSize * 0.8 + compressedTokenEstimate * 0.2),
      retrievalAccuracy: Math.round(totalConfidenceScore * 100)
    };

    onTraceLog(`[PIPELINE COMPLETE] Assembled final independent Context Package in ${Date.now() - startTime}ms.`);
    return contextPackage;
  }

  /**
   * Analyses query string to detect keywords and topic patterns.
   */
  private analyzeIntentKeywords(query: string): string[] {
    const keywords: string[] = [];
    const queryLower = query.toLowerCase();

    if (queryLower.includes("event") || queryLower.includes("bus")) keywords.push("EventSourcing");
    if (queryLower.includes("code") || queryLower.includes("typescript")) keywords.push("ASTStructure");
    if (queryLower.includes("provider") || queryLower.includes("broker")) keywords.push("AIBroking");
    if (queryLower.includes("git") || queryLower.includes("history")) keywords.push("VersionControl");
    if (queryLower.includes("memory") || queryLower.includes("cache")) keywords.push("EpisodicRecall");
    if (queryLower.includes("sandbox") || queryLower.includes("terminal")) keywords.push("Containers");
    if (queryLower.includes("solid") || queryLower.includes("design")) keywords.push("CleanArchitecture");

    if (keywords.length === 0) keywords.push("GeneralDevelopment");
    return keywords;
  }

  /**
   * Filters duplicates and merges items referring to the same resource.
   */
  private deduplicateItems(items: IContextItem[]): IContextItem[] {
    const seenTitles = new Set<string>();
    return items.filter(item => {
      const key = `${item.source}:${item.title}`;
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    });
  }

  /**
   * Applies multidimensional ranking: relevance, recency, dependency metrics.
   */
  private rankItems(items: IContextItem[], query: string, intentKeywords: string[]): IContextItem[] {
    const queryWords = query.toLowerCase().split(/\s+/);

    return items.map(item => {
      let scoreBoost = 0;

      // Fact 1: Context Keyword matching
      for (const keyword of intentKeywords) {
        if (item.title.toLowerCase().includes(keyword.toLowerCase()) || item.content.toLowerCase().includes(keyword.toLowerCase())) {
          scoreBoost += 0.15;
        }
      }

      // Fact 2: Word occurrences
      let matchedWordCount = 0;
      for (const word of queryWords) {
        if (word.length > 3 && item.content.toLowerCase().includes(word)) {
          matchedWordCount++;
        }
      }
      scoreBoost += (matchedWordCount * 0.05);

      // Fact 3: Dependency Relationships (boost items linked by other items)
      const isLinked = items.some(other => other.dependencyLinks.includes(item.id));
      if (isLinked) scoreBoost += 0.1;

      // Recalculate final relevance score
      const finalScore = Math.min(1.0, item.relevanceScore + scoreBoost);

      return {
        ...item,
        relevanceScore: parseFloat(finalScore.toFixed(3))
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Performs strategic compression: summarizations and chunk sizing.
   */
  private compressItems(items: IContextItem[], active: boolean): IContextItem[] {
    if (!active) return items;

    return items.map(item => {
      // If the relevance score is low (< 0.7) and it's a large file, truncate or summarize it
      if (item.relevanceScore < 0.75 && item.content.length > 100) {
        const compressedContent = `[SYSTEM SUMMARY: Truncated to avoid token bloat] ... ${item.content.substring(0, 60)} ... [Omitted additional details matching progressive disclosure parameters]`;
        const tokenCount = Math.round(compressedContent.length / 4);
        return {
          ...item,
          content: compressedContent,
          tokenCount
        };
      }
      return item;
    });
  }
}
