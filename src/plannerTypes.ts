export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  BLOCKED = "BLOCKED",
  FAILED = "FAILED"
}

export enum PlanningStrategyType {
  FeatureDevelopment = "Feature Development",
  BugFix = "Bug Fix",
  Research = "Research",
  Architecture = "Architecture",
  Documentation = "Documentation",
  Testing = "Testing",
  Deployment = "Deployment",
  Refactoring = "Refactoring",
  Maintenance = "Maintenance",
  WorkspaceOperations = "Workspace Operations",
  PluginDevelopment = "Plugin Development"
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  complexity: "Simple" | "Moderate" | "Complex";
  dependencies: string[]; // Parent task IDs
  estimatedDurationMinutes: number;
  requiredCapabilities: string[];
  suggestedWorkflow: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  contextRequirements: string[];
  acceptanceCriteria: string[];
  status: TaskStatus;
  workspaceId: string;
  intentId: string;
  metadata: any;
}

export interface IRisk {
  id: string;
  type: "SECURITY" | "PERFORMANCE" | "ARCHITECTURE" | "BREAKING_CHANGES" | "DEPENDENCY" | "RESOURCE" | "UNKNOWN";
  description: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  mitigation: string;
}

export interface IPlanningPackage {
  id: string;
  intentId: string;
  goalSummary: string;
  strategyUsed: PlanningStrategyType;
  tasks: ITask[];
  dependencies: { from: string; to: string }[]; // Directed Graph Edges
  parallelGroups: string[][]; // Lists of Task IDs that are mutually independent
  milestones: { id: string; title: string; targetTaskIds: string[] }[];
  estimatedCompletionMinutes: number;
  riskAssessment: IRisk[];
  contextRequirements: string[];
  requiredCapabilities: string[];
  workflowRecommendations: string[];
  approvalPoints: string[];
  version: string;
  metadata: any;
}

export interface PlannerMetrics {
  planningTimeMs: number;
  tasksGeneratedCount: number;
  averageTaskComplexityScore: number; // 1 to 5 scale
  dependencyCount: number;
  parallelizationRatePercent: number;
  riskCount: number;
  planningAccuracyPercent: number;
  revisionsCount: number;
}
