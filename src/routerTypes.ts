export enum JobStatus {
  PENDING = "PENDING",
  READY = "READY",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  ABORTED = "ABORTED"
}

export enum RoutingStrategyType {
  FASTEST = "Fastest Execution (High Latency Priority)",
  CHEAPEST = "Cheapest Rate (Budget Constraint)",
  QUALITY = "Highest Quality (Sovereign Reasoning)",
  BALANCED = "Balanced (Optimal Quality/Cost Curve)",
  OFFLINE_FIRST = "Offline First (Local Compute Core)",
  PRIVACY_FIRST = "Privacy Safeguard (Isolated Sandboxed Core)"
}

export enum CollaborationModel {
  SINGLE_AGENT = "Single Specialist Agent",
  PAIR_PROGRAMMING = "Pair Programming (Writer + Reviewer)",
  RESEARCH_TEAM = "Research Team (Collector + Analyst)",
  ARCHITECTURE_REVIEW = "Architecture Panel (Multi-Agent Consensus)"
}

export interface IJob {
  id: string;
  taskId: string;
  assignedAgent: string;
  assignedProviderId: string; // References Provider ID from Provider Manager
  assignedModel: string;
  requiredCapabilities: string[];
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  estimatedCost: number;
  estimatedDurationMinutes: number;
  retryPolicy: {
    maxRetries: number;
    fallbackProviderId: string;
    fallbackModel: string;
  };
  dependencies: string[]; // Parent Job IDs
  collaborationModel: CollaborationModel;
  approvalRequirements: boolean;
  explanation: string;
  status: JobStatus;
  workspaceId: string;
  metadata: any;
}

export interface IRoutingPackage {
  id: string;
  planId: string;
  strategyUsed: RoutingStrategyType;
  jobs: IJob[];
  parallelBatches: string[][]; // Lists of Job IDs that can run concurrently
  executionOrder: string[];
  estimatedTotalCost: number;
  estimatedTotalDurationMinutes: number;
  routingExplanation: string;
  metadata: {
    timestamp: number;
    unlockedCapabilities: string[];
    riskSafeguardsDeployed: boolean;
  };
}

export interface RouterMetrics {
  routingTimeMs: number;
  jobsRoutedCount: number;
  providerUtilization: Record<string, number>; // providerId -> count of jobs
  agentUtilization: Record<string, number>; // agent -> count of jobs
  cumulativeCost: number;
  averageRoutingLatencyMs: number;
  fallbackTriggerCount: number;
  routingAccuracyPercent: number;
  queueDepth: number;
}
