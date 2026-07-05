import {
  IAIProvider,
  AICapability,
  AuthMethod,
  ProviderStatus,
  ProviderConfig,
  ProviderMetrics,
  ModelMetadata,
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatCompletionChunk,
  CircuitBreakerState
} from "./providerTypes";

/**
 * Base abstract class for Providers providing shared utilities
 */
export abstract class BaseProvider implements IAIProvider {
  public abstract id: string;
  public abstract name: string;
  public abstract version: string;
  public abstract authMethod: AuthMethod;
  public abstract capabilities: AICapability[];
  public abstract supportedModels: ModelMetadata[];
  
  public status: ProviderStatus = ProviderStatus.ENABLED;
  public config: ProviderConfig;
  public metrics: ProviderMetrics;
  protected circuitBreaker: CircuitBreakerState;

  constructor(defaultConfig: ProviderConfig, defaultMetrics: ProviderMetrics) {
    this.config = { ...defaultConfig };
    this.metrics = { ...defaultMetrics };
    this.circuitBreaker = {
      state: "CLOSED",
      failureCount: 0,
      cooldownPeriodMs: 10000, // 10s cooldown for simulation ease
      failureThreshold: 3
    };
  }

  /**
   * Safe execution with Circuit Breaker and simulation parameters
   */
  protected checkCircuit(): void {
    if (this.circuitBreaker.state === "OPEN") {
      const now = Date.now();
      if (this.circuitBreaker.lastFailureTime && (now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.cooldownPeriodMs)) {
        // Transition to Half-Open on cooldown expiry
        this.circuitBreaker.state = "HALF_OPEN";
        this.status = ProviderStatus.ENABLED;
      } else {
        throw new Error(`Circuit Breaker is OPEN for provider '${this.id}'. Requests blocked.`);
      }
    }
  }

  protected recordSuccess(): void {
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.state = "CLOSED";
    this.status = ProviderStatus.ENABLED;
    
    // Update metrics dynamically
    this.metrics.availability = Math.min(100, this.metrics.availability * 0.95 + 5);
    this.metrics.errorRate = Math.max(0, this.metrics.errorRate * 0.9);
  }

  protected recordFailure(err: Error): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    // Update metrics
    this.metrics.errorRate = Math.min(100, this.metrics.errorRate * 0.9 + 10);
    this.metrics.availability = Math.max(0, this.metrics.availability * 0.95);

    if (this.circuitBreaker.failureCount >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = "OPEN";
      this.status = ProviderStatus.ERROR_COOLDOWN;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      this.checkCircuit();
      const start = Date.now();
      // Mock light-weight ping
      await new Promise((resolve) => setTimeout(resolve, 150));
      this.metrics.avgLatencyMs = Math.round(this.metrics.avgLatencyMs * 0.8 + (Date.now() - start) * 0.2);
      this.recordSuccess();
      return true;
    } catch (e) {
      this.recordFailure(e as Error);
      return false;
    }
  }

  public abstract chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  public abstract chatCompletionStream(
    params: ChatCompletionParams,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<ChatCompletionResponse>;
}

/**
 * Standard Provider 1: Gemini Provider (Google AI)
 */
export class GeminiProvider extends BaseProvider {
  public id = "gemini";
  public name = "Google Gemini";
  public version = "v2.5.0-genai";
  public authMethod = AuthMethod.API_KEY;
  public capabilities = [
    AICapability.Reasoning,
    AICapability.Coding,
    AICapability.Vision,
    AICapability.LargeContext,
    AICapability.FastResponse,
    AICapability.ToolCalling,
    AICapability.StructuredOutput,
    AICapability.Multimodal
  ];

  public supportedModels: ModelMetadata[] = [
    {
      name: "Gemini 3.5 Flash",
      id: "gemini-3.5-flash",
      contextWindow: 1048576,
      capabilities: [AICapability.FastResponse, AICapability.LowCost, AICapability.Multimodal, AICapability.ToolCalling],
      estimatedCostPer1MInput: 0.075,
      estimatedCostPer1MOutput: 0.30,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true
    },
    {
      name: "Gemini 3.1 Pro Preview",
      id: "gemini-3.1-pro-preview",
      contextWindow: 2097152,
      capabilities: [AICapability.Reasoning, AICapability.Coding, AICapability.LargeContext, AICapability.StructuredOutput, AICapability.ToolCalling],
      estimatedCostPer1MInput: 1.25,
      estimatedCostPer1MOutput: 5.00,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true
    }
  ];

  constructor() {
    super(
      {
        apiKey: "••••••••••••••••",
        timeoutMs: 15000,
        rateLimitRpm: 120,
        maxCostLimitUsd: 15.00,
        defaultModel: "gemini-3.5-flash"
      },
      {
        availability: 99.8,
        avgLatencyMs: 380,
        errorRate: 0.2,
        totalTokensUsed: 145020,
        totalCostUsd: 0.12,
        requestsPerMinute: 0,
        rateLimitRemaining: 120,
        queueLength: 0,
        reliabilityScore: 98.5,
        currentLoad: 0.08
      }
    );
  }

  public async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    this.checkCircuit();
    const start = Date.now();
    try {
      // If we are in the real browser environment and have access to our server proxy, we call it
      let textResponse = "";
      const modelMeta = this.supportedModels.find(m => m.id === params.model) || this.supportedModels[0];

      // Bridge to Express backend if we are requesting chat and can reach it
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: params.messages.map(m => ({ role: m.role, content: m.content })),
          selectedStack: ["all-in-one"],
          systemRules: [params.systemInstruction || ""]
        })
      });

      if (response.ok) {
        const json = await response.json();
        textResponse = json.content;
      } else {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const end = Date.now();
      const inputTokens = Math.round(params.messages.reduce((acc, m) => acc + m.content.length, 0) / 4);
      const outputTokens = Math.round(textResponse.length / 4);
      const cost = (inputTokens * modelMeta.estimatedCostPer1MInput + outputTokens * modelMeta.estimatedCostPer1MOutput) / 1000000;

      this.metrics.totalTokensUsed += (inputTokens + outputTokens);
      this.metrics.totalCostUsd += cost;
      this.metrics.avgLatencyMs = Math.round(this.metrics.avgLatencyMs * 0.8 + (end - start) * 0.2);
      this.recordSuccess();

      return {
        id: `chat-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : "gemini-11a"}`,
        model: params.model,
        text: textResponse,
        role: "assistant",
        usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, costUsd: cost },
        finishReason: "stop"
      };
    } catch (err) {
      this.recordFailure(err as Error);
      throw err;
    }
  }

  public async chatCompletionStream(
    params: ChatCompletionParams,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<ChatCompletionResponse> {
    // Basic streaming simulation wrapping the endpoint
    const response = await this.chatCompletion(params);
    const words = response.text.split(" ");
    for (let i = 0; i < words.length; i++) {
      onChunk({
        text: words[i] + (i === words.length - 1 ? "" : " "),
        done: i === words.length - 1
      });
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    return response;
  }
}

/**
 * Standard Provider 2: OpenAI Provider
 */
export class OpenAIProvider extends BaseProvider {
  public id = "openai";
  public name = "OpenAI GPT";
  public version = "v4.0.0-node";
  public authMethod = AuthMethod.API_KEY;
  public capabilities = [
    AICapability.Reasoning,
    AICapability.Coding,
    AICapability.Vision,
    AICapability.FastResponse,
    AICapability.ToolCalling,
    AICapability.StructuredOutput,
    AICapability.Multimodal
  ];

  public supportedModels: ModelMetadata[] = [
    {
      name: "GPT-4o",
      id: "gpt-4o",
      contextWindow: 128000,
      capabilities: [AICapability.Reasoning, AICapability.Coding, AICapability.Vision, AICapability.ToolCalling],
      estimatedCostPer1MInput: 5.00,
      estimatedCostPer1MOutput: 15.00,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true
    },
    {
      name: "GPT-4o-mini",
      id: "gpt-4o-mini",
      contextWindow: 128000,
      capabilities: [AICapability.FastResponse, AICapability.LowCost, AICapability.ToolCalling],
      estimatedCostPer1MInput: 0.150,
      estimatedCostPer1MOutput: 0.600,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true
    }
  ];

  constructor() {
    super(
      {
        apiKey: "••••••••••••••••",
        timeoutMs: 12000,
        rateLimitRpm: 100,
        maxCostLimitUsd: 10.00,
        defaultModel: "gpt-4o-mini"
      },
      {
        availability: 99.5,
        avgLatencyMs: 450,
        errorRate: 0.5,
        totalTokensUsed: 89000,
        totalCostUsd: 0.35,
        requestsPerMinute: 0,
        rateLimitRemaining: 100,
        queueLength: 0,
        reliabilityScore: 97.2,
        currentLoad: 0.05
      }
    );
  }

  public async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    this.checkCircuit();
    const start = Date.now();
    try {
      // Simulated delivery
      await new Promise((resolve) => setTimeout(resolve, 800));
      const textResponse = `[OpenAI GPT Response Node] Processed message chain using model '${params.model}'. 
Ready to index structured entities into workspace files.`;

      const end = Date.now();
      const inputTokens = 42;
      const outputTokens = 22;
      const cost = 0.00015;

      this.metrics.totalTokensUsed += (inputTokens + outputTokens);
      this.metrics.totalCostUsd += cost;
      this.metrics.avgLatencyMs = Math.round(this.metrics.avgLatencyMs * 0.8 + (end - start) * 0.2);
      this.recordSuccess();

      return {
        id: `chat-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : "openai-ab"}`,
        model: params.model,
        text: textResponse,
        role: "assistant",
        usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, costUsd: cost },
        finishReason: "stop"
      };
    } catch (err) {
      this.recordFailure(err as Error);
      throw err;
    }
  }

  public async chatCompletionStream(
    params: ChatCompletionParams,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<ChatCompletionResponse> {
    const response = await this.chatCompletion(params);
    const words = response.text.split(" ");
    for (let i = 0; i < words.length; i++) {
      onChunk({
        text: words[i] + (i === words.length - 1 ? "" : " "),
        done: i === words.length - 1
      });
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return response;
  }
}

/**
 * Standard Provider 3: Anthropic Claude Provider
 */
export class AnthropicProvider extends BaseProvider {
  public id = "claude";
  public name = "Anthropic Claude";
  public version = "v3.1.0-api";
  public authMethod = AuthMethod.API_KEY;
  public capabilities = [
    AICapability.Reasoning,
    AICapability.Coding,
    AICapability.Vision,
    AICapability.LargeContext,
    AICapability.ToolCalling,
    AICapability.StructuredOutput
  ];

  public supportedModels: ModelMetadata[] = [
    {
      name: "Claude 3.5 Sonnet",
      id: "claude-3-5-sonnet",
      contextWindow: 200000,
      capabilities: [AICapability.Reasoning, AICapability.Coding, AICapability.Vision, AICapability.ToolCalling],
      estimatedCostPer1MInput: 3.00,
      estimatedCostPer1MOutput: 15.00,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true
    },
    {
      name: "Claude 3 Haiku",
      id: "claude-3-haiku",
      contextWindow: 200000,
      capabilities: [AICapability.FastResponse, AICapability.LowCost, AICapability.ToolCalling],
      estimatedCostPer1MInput: 0.25,
      estimatedCostPer1MOutput: 1.25,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false
    }
  ];

  constructor() {
    super(
      {
        apiKey: "••••••••••••••••",
        timeoutMs: 18000,
        rateLimitRpm: 80,
        maxCostLimitUsd: 25.00,
        defaultModel: "claude-3-5-sonnet"
      },
      {
        availability: 99.4,
        avgLatencyMs: 620,
        errorRate: 0.4,
        totalTokensUsed: 54000,
        totalCostUsd: 0.48,
        requestsPerMinute: 0,
        rateLimitRemaining: 80,
        queueLength: 0,
        reliabilityScore: 96.9,
        currentLoad: 0.02
      }
    );
  }

  public async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    this.checkCircuit();
    const start = Date.now();
    try {
      await new Promise((resolve) => setTimeout(resolve, 950));
      const textResponse = `[Claude Claude-3-5-Sonnet Response] Handled complex architecture validation rules. Output is clean code according to SOLID.`;

      const end = Date.now();
      const inputTokens = 50;
      const outputTokens = 25;
      const cost = 0.00028;

      this.metrics.totalTokensUsed += (inputTokens + outputTokens);
      this.metrics.totalCostUsd += cost;
      this.metrics.avgLatencyMs = Math.round(this.metrics.avgLatencyMs * 0.8 + (end - start) * 0.2);
      this.recordSuccess();

      return {
        id: `chat-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : "anthropic-c1"}`,
        model: params.model,
        text: textResponse,
        role: "assistant",
        usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, costUsd: cost },
        finishReason: "stop"
      };
    } catch (err) {
      this.recordFailure(err as Error);
      throw err;
    }
  }

  public async chatCompletionStream(
    params: ChatCompletionParams,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<ChatCompletionResponse> {
    const response = await this.chatCompletion(params);
    const words = response.text.split(" ");
    for (let i = 0; i < words.length; i++) {
      onChunk({
        text: words[i] + (i === words.length - 1 ? "" : " "),
        done: i === words.length - 1
      });
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    return response;
  }
}

/**
 * Standard Provider 4: Ollama Local Provider (Zero Cost, Offline)
 */
export class OllamaProvider extends BaseProvider {
  public id = "ollama";
  public name = "Ollama Local";
  public version = "v0.1.48-local";
  public authMethod = AuthMethod.LOCAL;
  public capabilities = [
    AICapability.Reasoning,
    AICapability.Coding,
    AICapability.Offline,
    AICapability.LowCost,
    AICapability.ToolCalling
  ];

  public supportedModels: ModelMetadata[] = [
    {
      name: "Qwen 2.5 Coder 7B (Local)",
      id: "qwen2.5-coder-7b",
      contextWindow: 32000,
      capabilities: [AICapability.Coding, AICapability.Offline, AICapability.LowCost],
      estimatedCostPer1MInput: 0.00,
      estimatedCostPer1MOutput: 0.00,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false
    },
    {
      name: "DeepSeek R1 8B (Local)",
      id: "deepseek-r1-8b",
      contextWindow: 16000,
      capabilities: [AICapability.Reasoning, AICapability.Offline, AICapability.LowCost],
      estimatedCostPer1MInput: 0.00,
      estimatedCostPer1MOutput: 0.00,
      supportsStreaming: true,
      supportsTools: false,
      supportsVision: false
    }
  ];

  constructor() {
    super(
      {
        apiKey: "LOCAL_HOST_DEVMISC",
        endpoint: "http://127.0.0.1:11434",
        timeoutMs: 30000,
        rateLimitRpm: 1000, // No cloud rate limits
        maxCostLimitUsd: 0.00,
        defaultModel: "qwen2.5-coder-7b"
      },
      {
        availability: 100.0,
        avgLatencyMs: 180, // Fast local bus
        errorRate: 0.0,
        totalTokensUsed: 450000,
        totalCostUsd: 0.00, // Completely free
        requestsPerMinute: 0,
        rateLimitRemaining: 1000,
        queueLength: 0,
        reliabilityScore: 100.0,
        currentLoad: 0.00
      }
    );
  }

  public async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    this.checkCircuit();
    const start = Date.now();
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const textResponse = `[Ollama Local Engine] Processed prompt offline using local weight file '${params.model}'. Output generated without passing third-party firewalls.`;

      const end = Date.now();
      const inputTokens = 60;
      const outputTokens = 30;

      this.metrics.totalTokensUsed += (inputTokens + outputTokens);
      this.metrics.avgLatencyMs = Math.round(this.metrics.avgLatencyMs * 0.8 + (end - start) * 0.2);
      this.recordSuccess();

      return {
        id: `chat-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : "local-qwen"}`,
        model: params.model,
        text: textResponse,
        role: "assistant",
        usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, costUsd: 0 },
        finishReason: "stop"
      };
    } catch (err) {
      this.recordFailure(err as Error);
      throw err;
    }
  }

  public async chatCompletionStream(
    params: ChatCompletionParams,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<ChatCompletionResponse> {
    const response = await this.chatCompletion(params);
    const words = response.text.split(" ");
    for (let i = 0; i < words.length; i++) {
      onChunk({
        text: words[i] + (i === words.length - 1 ? "" : " "),
        done: i === words.length - 1
      });
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
    return response;
  }
}

/**
 * Standard Provider 5: DeepSeek Cloud Provider
 */
export class DeepSeekProvider extends BaseProvider {
  public id = "deepseek";
  public name = "DeepSeek AI";
  public version = "v1.1.2-web";
  public authMethod = AuthMethod.API_KEY;
  public capabilities = [
    AICapability.Reasoning,
    AICapability.Coding,
    AICapability.LowCost,
    AICapability.ToolCalling,
    AICapability.StructuredOutput
  ];

  public supportedModels: ModelMetadata[] = [
    {
      name: "DeepSeek-V3",
      id: "deepseek-v3",
      contextWindow: 128000,
      capabilities: [AICapability.Coding, AICapability.LowCost, AICapability.ToolCalling, AICapability.StructuredOutput],
      estimatedCostPer1MInput: 0.14,
      estimatedCostPer1MOutput: 0.28,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false
    },
    {
      name: "DeepSeek-R1 (Reasoning)",
      id: "deepseek-r1",
      contextWindow: 64000,
      capabilities: [AICapability.Reasoning, AICapability.LowCost],
      estimatedCostPer1MInput: 0.55,
      estimatedCostPer1MOutput: 2.19,
      supportsStreaming: true,
      supportsTools: false,
      supportsVision: false
    }
  ];

  constructor() {
    super(
      {
        apiKey: "••••••••••••••••",
        timeoutMs: 25000, // Longer timeouts for deep reasoning models
        rateLimitRpm: 60,
        maxCostLimitUsd: 8.00,
        defaultModel: "deepseek-v3"
      },
      {
        availability: 98.7,
        avgLatencyMs: 950, // Higher latency due to R1 chain-of-thought calculation
        errorRate: 1.1,
        totalTokensUsed: 121000,
        totalCostUsd: 0.04,
        requestsPerMinute: 0,
        rateLimitRemaining: 60,
        queueLength: 0,
        reliabilityScore: 95.4,
        currentLoad: 0.12
      }
    );
  }

  public async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    this.checkCircuit();
    const start = Date.now();
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const textResponse = `<think>
Validating stack configurations and planning pipeline steps...
1. Selected SQLite relational data.
2. Verified event-driven orchestration metrics.
3. Checking failover routes.
</think>
[DeepSeek Response] All components mapped with structural decoupling. Ready to compile.`;

      const end = Date.now();
      const inputTokens = 120;
      const outputTokens = 85;
      const cost = 0.000045;

      this.metrics.totalTokensUsed += (inputTokens + outputTokens);
      this.metrics.totalCostUsd += cost;
      this.metrics.avgLatencyMs = Math.round(this.metrics.avgLatencyMs * 0.8 + (end - start) * 0.2);
      this.recordSuccess();

      return {
        id: `chat-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : "deepseek-v3"}`,
        model: params.model,
        text: textResponse,
        role: "assistant",
        usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, costUsd: cost },
        finishReason: "stop"
      };
    } catch (err) {
      this.recordFailure(err as Error);
      throw err;
    }
  }

  public async chatCompletionStream(
    params: ChatCompletionParams,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<ChatCompletionResponse> {
    const response = await this.chatCompletion(params);
    const words = response.text.split(" ");
    for (let i = 0; i < words.length; i++) {
      onChunk({
        text: words[i] + (i === words.length - 1 ? "" : " "),
        done: i === words.length - 1
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return response;
  }
}

/**
 * Universal Provider Registry System
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, IAIProvider> = new Map();
  private activeWorkspaceId = "ws-aether-dev";

  private constructor() {
    // Register default built-in providers
    this.register(new GeminiProvider());
    this.register(new OpenAIProvider());
    this.register(new AnthropicProvider());
    this.register(new OllamaProvider());
    this.register(new DeepSeekProvider());
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * Registers a new provider (supports pluggable additions)
   */
  public register(provider: IAIProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Disables/Enables a provider
   */
  public setProviderStatus(id: string, status: ProviderStatus): void {
    const provider = this.providers.get(id);
    if (provider) {
      provider.status = status;
    }
  }

  /**
   * Removes a provider
   */
  public remove(id: string): boolean {
    return this.providers.delete(id);
  }

  /**
   * Fetches a registered provider by ID
   */
  public getProvider(id: string): IAIProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Lists all discovered providers
   */
  public listProviders(): IAIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Isolates configurations per Workspace Workspace ID
   */
  public isolateWorkspaceConfig(workspaceId: string): void {
    this.activeWorkspaceId = workspaceId;
    // Real systems would fetch stored credentials from Firestore or secure vault and hot-reload.
  }

  /**
   * Capability Gated Intelligent Router
   * Resolves the best provider & model for a set of capabilities and constraints
   */
  public route(
    requiredCapabilities: AICapability[],
    preferences?: {
      preferOffline?: boolean;
      preferLowestCost?: boolean;
      maxLatencyMs?: number;
    }
  ): { provider: IAIProvider; model: ModelMetadata } {
    const candidates: { provider: IAIProvider; model: ModelMetadata }[] = [];

    // Gather all enabled providers that match the exact requested capabilities
    for (const provider of this.providers.values()) {
      if (provider.status !== ProviderStatus.ENABLED) continue;

      for (const model of provider.supportedModels) {
        // Must contain all requested capabilities
        const matchesCapabilities = requiredCapabilities.every(cap =>
          model.capabilities.includes(cap) || provider.capabilities.includes(cap)
        );

        if (matchesCapabilities) {
          candidates.push({ provider, model });
        }
      }
    }

    if (candidates.length === 0) {
      // Fallback: search even disabled ones or just return Gemini as standard default
      const gemini = this.providers.get("gemini")!;
      return { provider: gemini, model: gemini.supportedModels[0] };
    }

    // Sort candidates according to criteria
    candidates.sort((a, b) => {
      // Preference 1: Offline gating
      if (preferences?.preferOffline) {
        const aOffline = a.model.capabilities.includes(AICapability.Offline) || a.provider.capabilities.includes(AICapability.Offline);
        const bOffline = b.model.capabilities.includes(AICapability.Offline) || b.provider.capabilities.includes(AICapability.Offline);
        if (aOffline && !bOffline) return -1;
        if (!aOffline && bOffline) return 1;
      }

      // Preference 2: Lowest cost Gating
      if (preferences?.preferLowestCost) {
        const costA = a.model.estimatedCostPer1MInput + a.model.estimatedCostPer1MOutput;
        const costB = b.model.estimatedCostPer1MInput + b.model.estimatedCostPer1MOutput;
        return costA - costB;
      }

      // Preference 3: Latency & Reliability weighting
      const scoreA = a.provider.metrics.reliabilityScore - (a.provider.metrics.avgLatencyMs / 50);
      const scoreB = b.provider.metrics.reliabilityScore - (b.provider.metrics.avgLatencyMs / 50);
      return scoreB - scoreA; // Highest score first
    });

    return candidates[0];
  }

  /**
   * Resilient execution orchestrator with Exponential Backoff Retries,
   * Circuit Breaker protection, and Fallback triggers.
   */
  public async executeWithResilience(
    params: ChatCompletionParams,
    requiredCapabilities: AICapability[],
    onTraceLog: (log: string) => void
  ): Promise<ChatCompletionResponse> {
    const primaryRoute = this.route(requiredCapabilities);
    let currentProvider = primaryRoute.provider;
    let currentModel = primaryRoute.model;

    const maxAttempts = 3;
    let delayMs = 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        onTraceLog(`[ROUTING] Attempt ${attempt}/${maxAttempts} routed to Provider: '${currentProvider.name}' using Model: '${currentModel.name}'.`);
        
        // Execute request
        const result = await currentProvider.chatCompletion({
          ...params,
          model: currentModel.id
        });

        onTraceLog(`[SUCCESS] Provider '${currentProvider.name}' successfully completed execution on attempt ${attempt}.`);
        return result;

      } catch (err: any) {
        onTraceLog(`[ERROR] Attempt ${attempt} failed on '${currentProvider.name}': ${err.message}.`);

        if (attempt < maxAttempts) {
          // Exponential backoff logic
          onTraceLog(`[RESILIENCE] Backing off for ${delayMs}ms before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs *= 2;

          // Failover triggers: on the 3rd attempt, fall back to a completely separate capable provider!
          if (attempt === 2) {
            onTraceLog(`[FAILOVER] Primary provider failed twice. Triggering router fallback logic...`);
            // Exclude current provider from list of available ones for routing
            const otherCapable = this.listProviders()
              .filter(p => p.id !== currentProvider.id && p.status === ProviderStatus.ENABLED)
              .map(p => ({
                provider: p,
                model: p.supportedModels.find(m => m.capabilities.includes(requiredCapabilities[0]) || p.capabilities.includes(requiredCapabilities[0]))
              }))
              .filter(item => item.model !== undefined) as { provider: IAIProvider; model: ModelMetadata }[];

            if (otherCapable.length > 0) {
              currentProvider = otherCapable[0].provider;
              currentModel = otherCapable[0].model;
              onTraceLog(`[FAILOVER] Route re-mapped to failover provider: '${currentProvider.name}', model: '${currentModel.name}'.`);
            }
          }
        } else {
          // Final fallback graceful degradation
          onTraceLog(`[GRACEFUL DEGRADATION] All attempts and failover candidates exhausted. Rendering safe error payload.`);
          throw new Error("Resilient AI Broker pipeline failed. Graceful recovery limit reached.");
        }
      }
    }

    throw new Error("Resilient broker finished without result.");
  }
}
