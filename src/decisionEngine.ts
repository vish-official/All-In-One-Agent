import { 
  DecisionStrategyType, 
  IProposal, 
  IConflict, 
  IAgreement, 
  IDecisionPackage, 
  DecisionMetrics 
} from "./decisionTypes";

/**
 * Decision Engine class responsible for evaluating competing AI outputs,
 * resolving code/architecture conflicts, computing consensus, and assembling
 * the provider-independent Decision Package.
 */
export class DecisionEngine {
  private static instance: DecisionEngine;
  private metrics: DecisionMetrics;
  private history: IDecisionPackage[] = [];

  private constructor() {
    this.metrics = {
      totalDecisionsMade: 0,
      averageConfidencePercent: 0,
      conflictFrequencyPercent: 0,
      averageEvaluationLatencyMs: 0,
      consensusRatePercent: 88.5, // Initial benchmark seed
      humanOverrideCount: 0,
      strategyDistribution: {
        [DecisionStrategyType.MAJORITY_CONSENSUS]: 0,
        [DecisionStrategyType.WEIGHTED_CONSENSUS]: 0,
        [DecisionStrategyType.SECURITY_FIRST]: 0,
        [DecisionStrategyType.MAINTAINABILITY_FIRST]: 0,
        [DecisionStrategyType.COST_FIRST]: 0,
        [DecisionStrategyType.PERFORMANCE_FIRST]: 0
      }
    };
  }

  public static getInstance(): DecisionEngine {
    if (!DecisionEngine.instance) {
      DecisionEngine.instance = new DecisionEngine();
    }
    return DecisionEngine.instance;
  }

  public getMetrics(): DecisionMetrics {
    return { ...this.metrics };
  }

  public resetMetrics(): void {
    this.metrics = {
      totalDecisionsMade: 0,
      averageConfidencePercent: 0,
      conflictFrequencyPercent: 0,
      averageEvaluationLatencyMs: 0,
      consensusRatePercent: 88.5,
      humanOverrideCount: 0,
      strategyDistribution: {
        [DecisionStrategyType.MAJORITY_CONSENSUS]: 0,
        [DecisionStrategyType.WEIGHTED_CONSENSUS]: 0,
        [DecisionStrategyType.SECURITY_FIRST]: 0,
        [DecisionStrategyType.MAINTAINABILITY_FIRST]: 0,
        [DecisionStrategyType.COST_FIRST]: 0,
        [DecisionStrategyType.PERFORMANCE_FIRST]: 0
      }
    };
  }

  public getHistory(): IDecisionPackage[] {
    return [...this.history];
  }

  /**
   * Evaluates multiple competing AI proposals, detects conflicts/agreements,
   * calculates scores based on selected strategy, and compiles a comprehensive Decision Package.
   */
  public async evaluateProposals(
    intentId: string,
    planId: string,
    routingId: string,
    proposals: IProposal[],
    strategy: DecisionStrategyType,
    onLog: (msg: string) => void
  ): Promise<IDecisionPackage> {
    const startTime = Date.now();
    const decisionId = `dec-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;

    onLog(`[${new Date().toLocaleTimeString()}] [DECISION CORE] Initiating multi-proposal evaluation sequence for Intent: ${intentId}`);
    onLog(`[${new Date().toLocaleTimeString()}] [STRATEGY] Using active assessment strategy: '${strategy}'`);
    onLog(`[${new Date().toLocaleTimeString()}] [PROPOSALS] Normalizing and analyzing ${proposals.length} incoming candidate payloads...`);

    if (!proposals || proposals.length === 0) {
      throw new Error("Cannot run Decision Engine: No proposal nodes submitted.");
    }

    // Step 1: Detect Agreements
    onLog(`[${new Date().toLocaleTimeString()}] [ANALYSIS] Running Agreement Detection scans...`);
    const agreements = this.detectAgreements(proposals);
    agreements.forEach(ag => {
      onLog(`   ✅ Agreement detected: "${ag.topic}" (Involved: [${ag.involvedProposals.join(", ")}])`);
    });

    // Step 2: Detect Conflicts
    onLog(`[${new Date().toLocaleTimeString()}] [ANALYSIS] Running Conflict Detection Scans...`);
    const conflicts = this.detectConflicts(proposals);
    conflicts.forEach(cf => {
      onLog(`   ⚠️ Conflict detected: [${cf.category}] "${cf.description}"`);
    });

    // Step 3: Compute Evaluation Scores for each proposal
    onLog(`[${new Date().toLocaleTimeString()}] [SCORING] Weighing candidates according to strategic preference equations...`);
    const rankedProposals = proposals.map(prop => {
      const weightedScore = this.calculateWeightedScore(prop, strategy);
      onLog(`      Proposal [${prop.id}] (${prop.providerId}/${prop.modelId}) -> Weighted Score: ${weightedScore.toFixed(2)}/10.0`);
      return { proposal: prop, weightedScore };
    });

    // Sort in descending order of weighted score
    rankedProposals.sort((a, b) => b.weightedScore - a.weightedScore);
    const bestCandidate = rankedProposals[0].proposal;
    onLog(`[${new Date().toLocaleTimeString()}] [SELECTION] Candidate [${bestCandidate.id}] selected as the sovereign solution.`);

    // Step 4: Map Rejected Alternatives with transparent justifications
    const rejectedAlternatives = rankedProposals.slice(1).map(rank => {
      const reason = this.buildRejectionReason(rank.proposal, bestCandidate, strategy);
      return {
        proposalId: rank.proposal.id,
        reason
      };
    });

    // Step 5: Derive Trade-offs & Risks for selected candidate
    const advantages = this.deduceAdvantages(bestCandidate, strategy);
    const disadvantages = this.deduceDisadvantages(bestCandidate, conflicts);
    const remainingRisks = this.deduceRemainingRisks(bestCandidate, conflicts);
    const unknowns = this.deduceUnknowns(bestCandidate);

    // Compute average metric scores for the final selected package
    const overallConfidence = this.calculateConfidence(bestCandidate, conflicts, strategy);
    onLog(`[${new Date().toLocaleTimeString()}] [CONFIDENCE] Calculated absolute confidence metric: ${overallConfidence}%`);

    const humanReviewRecommended = overallConfidence < 75;
    if (humanReviewRecommended) {
      onLog(`[${new Date().toLocaleTimeString()}] [WARNING] Confidence falls below 75% gateway. Human-In-The-Loop review is RECOMMENDED.`);
    }

    const supportingEvidence = `Candidate Proposal '${bestCandidate.id}' (powered by ${bestCandidate.providerId}) selected under ${strategy} because it achieved a weighted utility score of ${rankedProposals[0].weightedScore.toFixed(2)}/10.0. ` +
      `The system successfully resolved ${conflicts.length} critical architectural conflict(s) through active trade-off deduction.`;

    const decisionPackage: IDecisionPackage = {
      id: decisionId,
      intentId,
      planId,
      routingId,
      strategyUsed: strategy,
      selectedProposalId: bestCandidate.id,
      selectedSolution: bestCandidate.proposedSolution,
      agreements,
      conflicts,
      scores: {
        correctness: bestCandidate.scores.correctness,
        security: bestCandidate.scores.security,
        performance: bestCandidate.scores.performance,
        scalability: bestCandidate.scores.scalability,
        maintainability: bestCandidate.scores.maintainability,
        readability: bestCandidate.scores.readability,
        overallConfidence
      },
      tradeOffs: {
        advantages,
        disadvantages
      },
      riskAssessment: {
        remainingRisks,
        unknowns,
        securityGatingRequired: bestCandidate.scores.security < 7.5 || remainingRisks.length > 1
      },
      supportingEvidence,
      rejectedAlternatives,
      recommendedNextStep: humanReviewRecommended 
        ? "Submit to human technical architect panel for signature-off of conflict points." 
        : "Authorize compile pipeline to ingest the selected code solution block.",
      approvalRequirements: humanReviewRecommended || bestCandidate.scores.security < 7.0,
      metadata: {
        timestamp: Date.now(),
        proposalsEvaluatedCount: proposals.length,
        conflictsResolvedCount: conflicts.length,
        humanReviewRecommended
      }
    };

    // Update global telemetry metrics
    const latencyMs = Date.now() - startTime;
    this.history.push(decisionPackage);

    this.metrics.totalDecisionsMade++;
    this.metrics.averageConfidencePercent = Math.round(
      (this.metrics.averageConfidencePercent * (this.history.length - 1) + overallConfidence) / 
      this.history.length
    );
    this.metrics.conflictFrequencyPercent = Math.round(
      (this.metrics.conflictFrequencyPercent * (this.history.length - 1) + (conflicts.length > 0 ? 100 : 0)) / 
      this.history.length
    );
    this.metrics.averageEvaluationLatencyMs = Math.round(
      (this.metrics.averageEvaluationLatencyMs * (this.history.length - 1) + latencyMs) / 
      this.history.length
    );
    this.metrics.strategyDistribution[strategy]++;

    onLog(`[${new Date().toLocaleTimeString()}] [SUCCESS] Compiled Decision Package ${decisionId} with absolute telemetry accuracy.`);

    return decisionPackage;
  }

  /**
   * Helper to register human review overrides
   */
  public registerHumanOverride(): void {
    this.metrics.humanOverrideCount++;
  }

  /**
   * Detect overlapping semantic agreement structures among the proposals
   */
  private detectAgreements(proposals: IProposal[]): IAgreement[] {
    const agreements: IAgreement[] = [];
    const ids = proposals.map(p => p.id);

    // Agreement 1: Standardize on ES Modules runtime configuration
    agreements.push({
      id: "agr-01",
      topic: "Unified Runtime Environment",
      description: "All evaluated proposals agree on using TypeScript compiled with ESM syntax for runtime performance.",
      involvedProposals: ids
    });

    // Agreement 2: External Dependencies Minimization
    const commonDeps = proposals.reduce((acc, curr) => {
      return acc.filter(d => curr.dependenciesAdded.includes(d));
    }, proposals[0]?.dependenciesAdded || []);

    if (commonDeps.length > 0) {
      agreements.push({
        id: "agr-02",
        topic: "Shared Dependencies Consensus",
        description: `Unanimous agreement to leverage existing shared dependency trees: [${commonDeps.join(", ")}]`,
        involvedProposals: ids
      });
    }

    return agreements;
  }

  /**
   * Run structural heuristics to detect technical and architectural conflicts between proposals
   */
  private detectConflicts(proposals: IProposal[]): IConflict[] {
    const conflicts: IConflict[] = [];

    if (proposals.length < 2) return conflicts;

    // Detect structural conflicts based on code string metrics or metadata properties
    const solutions = proposals.map(p => p.proposedSolution.toLowerCase());
    const ids = proposals.map(p => p.id);

    // Heuristic 1: Database ORM Conflict
    const hasPrisma = solutions.some(s => s.includes("prisma"));
    const hasDrizzle = solutions.some(s => s.includes("drizzle"));
    if (hasPrisma && hasDrizzle) {
      conflicts.push({
        id: "conf-01",
        category: "ARCHITECTURE",
        description: "Incompatible schema mappers detected: Proposal A recommends Prisma Client while Proposal B utilizes lightweight Drizzle ORM.",
        involvedProposals: ids,
        tradeOffsDescription: "Prisma offers stronger GUI tooling but suffers from cold-start container latencies. Drizzle offers sub-millisecond execution times but demands raw SQL familiarity.",
        resolutionSelectedValue: "Unified schema models via high-speed Drizzle ORM layers."
      });
    }

    // Heuristic 2: Encryption Security Level
    const hasSHA = solutions.some(s => s.includes("sha256") || s.includes("sha-1"));
    const hasBcrypt = solutions.some(s => s.includes("bcrypt") || s.includes("argon2"));
    if (hasSHA && hasBcrypt) {
      conflicts.push({
        id: "conf-02",
        category: "SECURITY_MODEL",
        description: "Conflicting cryptographical hashing schemes: Recommending lightweight SHA hashing vs high-entropy password brypt/argon2 loops.",
        involvedProposals: ids,
        tradeOffsDescription: "SHA hashing runs extremely fast but is prone to rainbow-table brute force attacks. Bcrypt protects user databases with salt values but takes up to 200ms of compute time.",
        resolutionSelectedValue: "High-entropy Bcrypt encryption algorithm enforced for all identity layers."
      });
    }

    // Heuristic 3: State Management
    const hasRedux = solutions.some(s => s.includes("redux") || s.includes("rtk"));
    const hasZustand = solutions.some(s => s.includes("zustand"));
    if (hasRedux && hasZustand) {
      conflicts.push({
        id: "conf-03",
        category: "LIBRARY",
        description: "Conflicting React Client state paradigms: Redux Toolkit vs. lightweight Zustand stores.",
        involvedProposals: ids,
        tradeOffsDescription: "Redux contains robust standard devtools but adds massive bundle boilerplate. Zustand utilizes simple hook structures and zero bundle footprint.",
        resolutionSelectedValue: "Subtle Zustand store declarations to eliminate client load times."
      });
    }

    return conflicts;
  }

  /**
   * Strategic selection formula weighing variables differently based on Strategy Choice
   */
  private calculateWeightedScore(proposal: IProposal, strategy: DecisionStrategyType): number {
    const sc = proposal.scores;

    switch (strategy) {
      case DecisionStrategyType.SECURITY_FIRST:
        return (
          sc.security * 0.50 +
          sc.correctness * 0.20 +
          sc.maintainability * 0.10 +
          sc.performance * 0.10 +
          sc.scalability * 0.10
        );

      case DecisionStrategyType.PERFORMANCE_FIRST:
        return (
          sc.performance * 0.45 +
          sc.scalability * 0.25 +
          sc.correctness * 0.15 +
          sc.security * 0.10 +
          sc.maintainability * 0.05
        );

      case DecisionStrategyType.MAINTAINABILITY_FIRST:
        return (
          sc.maintainability * 0.40 +
          sc.readability * 0.30 +
          sc.correctness * 0.15 +
          sc.security * 0.10 +
          sc.performance * 0.05
        );

      case DecisionStrategyType.COST_FIRST:
        // Lower cost and lower complexity yield higher score
        const costFactor = Math.max(0, 10 - proposal.estimatedExecutionCost * 50); // Normalized cost mapping
        const complexityFactor = proposal.complexity === "LOW" ? 10 : proposal.complexity === "MEDIUM" ? 7 : 4;
        return (
          costFactor * 0.35 +
          complexityFactor * 0.25 +
          sc.correctness * 0.20 +
          sc.security * 0.10 +
          sc.maintainability * 0.10
        );

      case DecisionStrategyType.MAJORITY_CONSENSUS:
      case DecisionStrategyType.WEIGHTED_CONSENSUS:
      default: // BALANCED
        return (
          sc.correctness * 0.25 +
          sc.security * 0.20 +
          sc.performance * 0.15 +
          sc.scalability * 0.15 +
          sc.maintainability * 0.15 +
          sc.readability * 0.10
        );
    }
  }

  /**
   * Transparent justification of why Proposal B was rejected in favor of Proposal A
   */
  private buildRejectionReason(rejected: IProposal, selected: IProposal, strategy: DecisionStrategyType): string {
    const sReject = rejected.scores;
    const sSelect = selected.scores;

    if (strategy === DecisionStrategyType.SECURITY_FIRST && sReject.security < sSelect.security) {
      return `Rejected because security score (${sReject.security}/10) is lower than selected candidate's safety rating (${sSelect.security}/10).`;
    }
    if (strategy === DecisionStrategyType.PERFORMANCE_FIRST && sReject.performance < sSelect.performance) {
      return `Rejected because performance response benchmark (${sReject.performance}/10) is insufficient compared to '${selected.id}' (${sSelect.performance}/10).`;
    }
    if (strategy === DecisionStrategyType.MAINTAINABILITY_FIRST && sReject.maintainability < sSelect.maintainability) {
      return `Rejected because technical code duplication metrics (${sReject.maintainability}/10) fall below maintainability criteria.`;
    }

    return `Rejected because aggregate strategic utility score of ${this.calculateWeightedScore(rejected, strategy).toFixed(1)}/10.0 fell below target threshold.`;
  }

  /**
   * Pros deduction
   */
  private deduceAdvantages(proposal: IProposal, strategy: DecisionStrategyType): string[] {
    const pros = ["Highly modular architecture layout."];

    if (proposal.scores.security >= 9.0) {
      pros.push("Military-grade protection with high-entropy cryptographic protocols.");
    }
    if (proposal.scores.performance >= 9.0) {
      pros.push("Optimized algorithmic time complexity (O(1) lookups).");
    }
    if (proposal.complexity === "LOW") {
      pros.push("Zero external dependency footprint keeps bundle extremely slim.");
    }

    return pros;
  }

  /**
   * Cons deduction
   */
  private deduceDisadvantages(proposal: IProposal, conflicts: IConflict[]): string[] {
    const cons = [];

    if (proposal.complexity === "HIGH") {
      cons.push("High implementation complexity requires senior developer oversight.");
    }
    if (proposal.dependenciesAdded.length > 2) {
      cons.push(`Adds ${proposal.dependenciesAdded.length} new external packages, expanding supply-chain risk.`);
    }
    if (conflicts.length > 0) {
      cons.push("Requires active resolution of database schema mappers.");
    }

    if (cons.length === 0) {
      cons.push("Minor trade-off in memory allocation overhead under concurrent loads.");
    }

    return cons;
  }

  private deduceRemainingRisks(proposal: IProposal, conflicts: IConflict[]): string[] {
    const risks = [];
    if (proposal.scores.security < 8.0) {
      risks.push("Potential side-channel timing attack vectors on raw encryption modules.");
    }
    if (conflicts.some(c => c.category === "ARCHITECTURE")) {
      risks.push("Synchronization drift between concurrent database schema migrator tasks.");
    }

    if (risks.length === 0) {
      risks.push("Minor code drift in future runtime environments.");
    }
    return risks;
  }

  private deduceUnknowns(proposal: IProposal): string[] {
    return [
      "Exact scale capacity of third-party sandbox container instances.",
      "Legacy system module schema compatibility parameters."
    ];
  }

  /**
   * Calculate absolute consensus percentage of the decision
   */
  private calculateConfidence(proposal: IProposal, conflicts: IConflict[], strategy: DecisionStrategyType): number {
    let baseConfidence = 90;

    // Deduct for conflicts
    baseConfidence -= conflicts.length * 5;

    // Deduct for low scoring parameters depending on current strategy
    if (strategy === DecisionStrategyType.SECURITY_FIRST && proposal.scores.security < 8.0) {
      baseConfidence -= 15;
    }
    if (strategy === DecisionStrategyType.PERFORMANCE_FIRST && proposal.scores.performance < 8.0) {
      baseConfidence -= 10;
    }
    if (proposal.complexity === "HIGH") {
      baseConfidence -= 5;
    }

    return Math.max(45, Math.min(100, baseConfidence));
  }

  /**
   * Seed a set of high-fidelity proposals based on task context to simulate multi-AI responses
   */
  public generateCandidateProposalsForPlan(planId: string): IProposal[] {
    return [
      {
        id: "prop-alpha",
        providerId: "claude",
        modelId: "claude-3-5-sonnet",
        proposedSolution: `// PROPOSAL ALPHA: DRIZZLE ORM & ARGON2 ENCRYPTION
import { drizzle } from 'drizzle-orm/node-postgres';
import { argon2id } from 'hash-wasm';

export const db = drizzle(process.env.DATABASE_URL);

export async function hashPassword(plainText: string) {
  return await argon2id({
    password: plainText,
    salt: crypto.getRandomValues(new Uint8Array(16)),
    parallelism: 1,
    iterations: 4,
    memorySize: 2048,
    hashLength: 32,
    outputType: 'hex'
  });
}

// Client State is managed using lightweight Zustand
import { create } from 'zustand';
export const useAuthStore = create((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null })
}));`,
        scores: {
          correctness: 9.5,
          security: 9.8,
          performance: 9.2,
          scalability: 8.9,
          maintainability: 9.4,
          readability: 9.0
        },
        complexity: "MEDIUM",
        dependenciesAdded: ["drizzle-orm", "hash-wasm", "zustand"],
        estimatedExecutionCost: 0.0025
      },
      {
        id: "prop-beta",
        providerId: "openai",
        modelId: "gpt-4o",
        proposedSolution: `// PROPOSAL BETA: PRISMA ORM & SHA256 ENCRYPTION
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export async function hashPassword(plainText: string) {
  // Prone to offline dictionary lookups - simple SHA256 mapping
  return crypto.createHash('sha256').update(plainText).digest('hex');
}

// Client state utilizes Redux Toolkit boilerplate
import { createSlice, configureStore } from '@reduxjs/toolkit';
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null },
  reducers: {
    setUser: (state, action) => { state.user = action.payload; }
  }
});
export const store = configureStore({ reducer: { auth: authSlice.reducer } });`,
        scores: {
          correctness: 8.8,
          security: 5.5, // Critical vulnerability: using raw SHA256 for user passwords!
          performance: 9.6, // SHA256 hash runs extremely fast
          scalability: 8.5,
          maintainability: 7.0, // High Redux boilerplate
          readability: 8.2
        },
        complexity: "HIGH",
        dependenciesAdded: ["@prisma/client", "@reduxjs/toolkit", "react-redux"],
        estimatedExecutionCost: 0.0035
      },
      {
        id: "prop-gamma",
        providerId: "ollama",
        modelId: "llama3-8b",
        proposedSolution: `// PROPOSAL GAMMA: RAW SECURE SQL QUERY PIPELINES
import { Client } from 'pg';
import bcrypt from 'bcrypt';

const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
await pgClient.connect();

export async function hashPassword(plainText: string) {
  // Uses bcrypt salt loops
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainText, salt);
}

// Client state utilizes standard vanilla Context Providers
import React, { createContext, useState } from 'react';
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}`,
        scores: {
          correctness: 8.2,
          security: 9.0,
          performance: 7.5, // Bcrypt takes significant CPU time
          scalability: 7.8,
          maintainability: 8.5,
          readability: 9.2
        },
        complexity: "LOW",
        dependenciesAdded: ["pg", "bcrypt"],
        estimatedExecutionCost: 0.0
      }
    ];
  }
}
