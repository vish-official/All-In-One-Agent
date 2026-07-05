export enum ContextSourceType {
  CODE = "CODE",
  GIT = "GIT",
  MEMORY = "MEMORY",
  DOCUMENTATION = "DOCUMENTATION",
  WORKSPACE = "WORKSPACE",
  CONVERSATION = "CONVERSATION",
  EVENT = "EVENT",
  SYSTEM = "SYSTEM"
}

export enum ContextItemConfidence {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}

export interface IContextItem {
  id: string;
  source: ContextSourceType;
  title: string;
  content: string;
  relevanceScore: number;    // 0 to 1
  recencyTimestamp: number;   // Epoch ms
  importanceWeight: number;   // 0 to 10
  dependencyLinks: string[];  // IDs of related items or files
  fileChangesCount?: number;  // For Git/Code context
  taskAssociation?: string;   // Task ID or topic if applicable
  confidence: ContextItemConfidence;
  tokenCount: number;
}

export interface IContextProvider {
  id: string;
  name: string;
  type: ContextSourceType;
  fetchContext(query: string, options?: any): Promise<IContextItem[]>;
}

export interface IContextPackage {
  id: string;
  timestamp: number;
  version: string;
  intentSummary: string;
  metadata: {
    workspaceId: string;
    originalQuery: string;
    tokensEstimated: number;
    compressionRatio: number; // e.g. 0.4 = 40% size of original
    confidenceScore: number;  // Average relevance
  };
  relevantFiles: {
    filePath: string;
    summary: string;
    contentExcerpt: string;
    relevance: number;
  }[];
  summaries: string[];
  referencedDocuments: {
    title: string;
    urlOrPath: string;
    excerpt: string;
  }[];
  memoryReferences: {
    key: string;
    value: string;
    recency: string;
  }[];
  taskInformation?: {
    activeTaskId?: string;
    status?: string;
    associatedMilestones?: string[];
  };
  eventLogsExcerpt: string[];
}

export interface ContextCacheEntry {
  key: string;
  package: IContextPackage;
  temperature: "HOT" | "WARM" | "COLD";
  createdAt: number;
  expiresAt: number;
  hitCount: number;
}

export interface ContextMetrics {
  retrievalTimeMs: number;
  rankingTimeMs: number;
  compressionTimeMs: number;
  originalSizeTokens: number;
  compressedSizeTokens: number;
  tokenSavingsPercent: number;
  cacheHitRate: number;
  averageContextSize: number;
  retrievalAccuracy: number; // 0 to 100
}
