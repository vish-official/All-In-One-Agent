export enum DecisionStrategyType {
  MAJORITY_CONSENSUS = "Majority Consensus (Peer Agreement)",
  WEIGHTED_CONSENSUS = "Weighted Consensus (Power Bias)",
  SECURITY_FIRST = "Security First (Lowest Vulnerability)",
  MAINTAINABILITY_FIRST = "Maintainability First (Lowest Technical Debt)",
  COST_FIRST = "Cost First (Budget Optimization)",
  PERFORMANCE_FIRST = "Performance First (Lowest Latency)"
}

export interface IProposal {
  id: string; // Proposal ID
  providerId: string; // The AI provider that generated this proposal
  modelId: string; // The model used
  proposedSolution: string; // Content of the proposed solution / code / architecture
  scores: {
    correctness: number; // 0 to 10
    security: number; // 0 to 10
    performance: number; // 0 to 10
    scalability: number; // 0 to 10
    maintainability: number; // 0 to 10
    readability: number; // 0 to 10
  };
  complexity: "LOW" | "MEDIUM" | "HIGH";
  dependenciesAdded: string[];
  estimatedExecutionCost: number;
}

export interface IConflict {
  id: string;
  category: "ARCHITECTURE" | "LIBRARY" | "API" | "ALGORITHM" | "FILE_STRUCTURE" | "SECURITY_MODEL";
  description: string;
  involvedProposals: string[]; // Proposal IDs
  tradeOffsDescription: string;
  resolutionSelectedValue: string;
}

export interface IAgreement {
  id: string;
  topic: string;
  description: string;
  involvedProposals: string[];
}

export interface IDecisionPackage {
  id: string;
  intentId: string;
  planId: string;
  routingId: string;
  strategyUsed: DecisionStrategyType;
  selectedProposalId: string;
  selectedSolution: string;
  agreements: IAgreement[];
  conflicts: IConflict[];
  scores: {
    correctness: number;
    security: number;
    performance: number;
    scalability: number;
    maintainability: number;
    readability: number;
    overallConfidence: number; // Percentage
  };
  tradeOffs: {
    advantages: string[];
    disadvantages: string[];
  };
  riskAssessment: {
    remainingRisks: string[];
    unknowns: string[];
    securityGatingRequired: boolean;
  };
  supportingEvidence: string;
  rejectedAlternatives: { proposalId: string; reason: string }[];
  recommendedNextStep: string;
  approvalRequirements: boolean;
  metadata: {
    timestamp: number;
    proposalsEvaluatedCount: number;
    conflictsResolvedCount: number;
    humanReviewRecommended: boolean;
  };
}

export interface DecisionMetrics {
  totalDecisionsMade: number;
  averageConfidencePercent: number;
  conflictFrequencyPercent: number;
  averageEvaluationLatencyMs: number;
  consensusRatePercent: number;
  humanOverrideCount: number;
  strategyDistribution: Record<DecisionStrategyType, number>;
}
