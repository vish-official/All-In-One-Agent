export enum IntentCategory {
  Coding = "Coding",
  BugFix = "Bug Fix",
  Refactoring = "Refactoring",
  Architecture = "Architecture",
  Documentation = "Documentation",
  Testing = "Testing",
  Research = "Research",
  Brainstorming = "Brainstorming",
  Planning = "Planning",
  Deployment = "Deployment",
  GitHub = "GitHub",
  BrowserAutomation = "Browser Automation",
  TerminalCommands = "Terminal Commands",
  PluginManagement = "Plugin Management",
  WorkspaceManagement = "Workspace Management",
  MemoryManagement = "Memory Management",
  Configuration = "Configuration",
  GeneralConversation = "General Conversation"
}

export enum TaskComplexity {
  Simple = "Simple",
  Moderate = "Moderate",
  Complex = "Complex",
  MultiAgent = "Multi-Agent",
  LongRunning = "Long-Running"
}

export enum WorkflowRecommendation {
  SingleAgent = "Single Agent",
  MultiAgentDiscussion = "Multi-Agent Discussion",
  ArchitectureReview = "Architecture Review",
  CodeGeneration = "Code Generation",
  Documentation = "Documentation",
  Research = "Research",
  Execution = "Execution",
  ReviewOnly = "Review Only",
  PlanningOnly = "Planning Only"
}

export enum CoreCapabilityRequirement {
  Reasoning = "Reasoning",
  Coding = "Coding",
  Vision = "Vision",
  Planning = "Planning",
  Browser = "Browser",
  Terminal = "Terminal",
  GitHub = "GitHub",
  Memory = "Memory",
  Offline = "Offline",
  LargeContext = "Large Context"
}

export interface IIntentPackage {
  intentId: string;
  workspaceId: string;
  intentCategory: IntentCategory;
  userGoal: string;
  requiredCapabilities: CoreCapabilityRequirement[];
  complexity: TaskComplexity;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  confidenceScore: number; // 0.0 to 1.0
  requiredContextSources: string[];
  missingInformation: string[];
  suggestedWorkflow: WorkflowRecommendation;
  safetyLevel: "SECURE" | "SANDBOXED" | "HUMAN_APPROVAL_REQUIRED";
  metadata: {
    estimatedFilesAffected: number;
    estimatedExecutionTimeMinutes: number;
    securityImpactScore: number; // 1 to 10
    detectedTechnologies: string[];
  };
}

export interface IntentMetrics {
  categoryDistribution: Record<IntentCategory, number>;
  confidenceAvg: number;
  ambiguousRequestsCount: number;
  clarificationFrequency: number;
  workflowRecommendationCounts: Record<WorkflowRecommendation, number>;
  averageAnalysisTimeMs: number;
  totalAnalyzed: number;
}
