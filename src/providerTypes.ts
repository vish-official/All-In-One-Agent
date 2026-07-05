export enum AICapability {
  Reasoning = "Reasoning",
  Coding = "Coding",
  Vision = "Vision",
  LargeContext = "LargeContext",
  FastResponse = "FastResponse",
  Offline = "Offline",
  LowCost = "LowCost",
  ToolCalling = "ToolCalling",
  StructuredOutput = "StructuredOutput",
  Multimodal = "Multimodal"
}

export enum AuthMethod {
  API_KEY = "API_KEY",
  OAUTH = "OAUTH",
  LOCAL = "LOCAL",
  TOKEN_REFRESH = "TOKEN_REFRESH"
}

export enum ProviderStatus {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
  ERROR_COOLDOWN = "ERROR_COOLDOWN"
}

export interface ProviderMetrics {
  availability: number;        // Percentage (0-100)
  avgLatencyMs: number;        // Milliseconds
  errorRate: number;           // Percentage (0-100)
  totalTokensUsed: number;     // Token count
  totalCostUsd: number;        // Dollars
  requestsPerMinute: number;   // RPM
  rateLimitRemaining: number;  // Under limit
  queueLength: number;         // Queued requests
  reliabilityScore: number;    // Calculated metric (0-100)
  currentLoad: number;         // Load index (0-1)
}

export interface ProviderConfig {
  apiKey: string;              // Secure API key (can be mask representation in UI)
  endpoint?: string;           // Custom endpoint for local/private deployments
  organizationId?: string;     // e.g. for OpenAI
  localModelPath?: string;     // e.g. for Ollama / local GGUF
  timeoutMs: number;           // Timeout constraint
  rateLimitRpm: number;        // Rate limit constraint (RPM)
  maxCostLimitUsd: number;     // Cost ceiling threshold
  defaultModel: string;        // Fallback model for this provider
  customHeaders?: Record<string, string>;
  workspaceSettings?: Record<string, any>;
}

export interface ModelMetadata {
  name: string;
  id: string;
  contextWindow: number;       // Token count (e.g. 128000)
  capabilities: AICapability[];
  estimatedCostPer1MInput: number; // USD
  estimatedCostPer1MOutput: number; // USD
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ChatCompletionParams {
  model: string;
  messages: ChatMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
  tools?: ToolDeclaration[];
  signal?: AbortSignal; // For cancellation
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  text: string;
  role: "assistant";
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
  };
  toolCalls?: ToolCall[];
  finishReason: "stop" | "length" | "tool_calls" | "content_filter" | "error";
}

export interface ChatCompletionChunk {
  text: string;
  toolCalls?: ToolCall[];
  done: boolean;
}

/**
 * Universal Interface for AI Providers
 */
export interface IAIProvider {
  id: string;                 // e.g. "gemini", "openai", "claude"
  name: string;               // e.g. "Google Gemini", "OpenAI"
  version: string;            // SDK or integration version
  status: ProviderStatus;
  authMethod: AuthMethod;
  capabilities: AICapability[];
  config: ProviderConfig;
  metrics: ProviderMetrics;
  supportedModels: ModelMetadata[];
  
  /**
   * Generates a non-streaming chat completion
   */
  chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  
  /**
   * Streams chat completion chunks
   */
  chatCompletionStream(
    params: ChatCompletionParams,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<ChatCompletionResponse>;
  
  /**
   * Performs an active health check ping
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Circuit Breaker Pattern State Manager
 */
export interface CircuitBreakerState {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failureCount: number;
  lastFailureTime?: number;
  cooldownPeriodMs: number;
  failureThreshold: number;
}
