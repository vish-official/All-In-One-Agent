import {
  IntentCategory,
  TaskComplexity,
  WorkflowRecommendation,
  CoreCapabilityRequirement,
  IIntentPackage,
  IntentMetrics
} from "./intentTypes";

/**
 * Generates random UUID
 */
function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Extension hook for future user preference learning algorithms
 */
export interface ILearningSupport {
  recordTaskOutcome(intentId: string, success: boolean): void;
  getUserPreferenceBias(userId: string): Record<string, any>;
  analyzeHistoricalPatterns(): any;
}

export class MockLearningSupport implements ILearningSupport {
  public recordTaskOutcome(intentId: string, success: boolean): void {
    console.log(`[LEARNING SYSTEM] Intent ${intentId} resolved with status: ${success ? "SUCCESS" : "FAILURE"}. Weights adjusted.`);
  }

  public getUserPreferenceBias(userId: string): Record<string, any> {
    return {
      preferredWorkflow: WorkflowRecommendation.MultiAgentDiscussion,
      frequentTechnologies: ["TypeScript", "React", "Rust"],
      safetyStrictness: "HIGH"
    };
  }

  public analyzeHistoricalPatterns(): any {
    return {
      frequentCategory: IntentCategory.Coding,
      averageConfidence: 0.94,
      commonWorkflow: WorkflowRecommendation.CodeGeneration
    };
  }
}

/**
 * Intent Analyzer
 * Serves as the intelligent gateway of ALL-IN-ONE.
 */
export class IntentAnalyzer {
  private static instance: IntentAnalyzer;
  private learningSupport: ILearningSupport;
  private metrics: IntentMetrics;

  private constructor() {
    this.learningSupport = new MockLearningSupport();
    this.metrics = {
      categoryDistribution: {
        [IntentCategory.Coding]: 42,
        [IntentCategory.BugFix]: 18,
        [IntentCategory.Refactoring]: 12,
        [IntentCategory.Architecture]: 8,
        [IntentCategory.Documentation]: 5,
        [IntentCategory.Testing]: 4,
        [IntentCategory.Research]: 14,
        [IntentCategory.Brainstorming]: 11,
        [IntentCategory.Planning]: 6,
        [IntentCategory.Deployment]: 3,
        [IntentCategory.GitHub]: 5,
        [IntentCategory.BrowserAutomation]: 2,
        [IntentCategory.TerminalCommands]: 7,
        [IntentCategory.PluginManagement]: 1,
        [IntentCategory.WorkspaceManagement]: 2,
        [IntentCategory.MemoryManagement]: 1,
        [IntentCategory.Configuration]: 3,
        [IntentCategory.GeneralConversation]: 15
      },
      confidenceAvg: 0.92,
      ambiguousRequestsCount: 8,
      clarificationFrequency: 0.12, // 12%
      workflowRecommendationCounts: {
        [WorkflowRecommendation.SingleAgent]: 34,
        [WorkflowRecommendation.MultiAgentDiscussion]: 18,
        [WorkflowRecommendation.ArchitectureReview]: 12,
        [WorkflowRecommendation.CodeGeneration]: 42,
        [WorkflowRecommendation.Documentation]: 10,
        [WorkflowRecommendation.Research]: 15,
        [WorkflowRecommendation.Execution]: 22,
        [WorkflowRecommendation.ReviewOnly]: 8,
        [WorkflowRecommendation.PlanningOnly]: 11
      },
      averageAnalysisTimeMs: 145,
      totalAnalyzed: 169
    };
  }

  public static getInstance(): IntentAnalyzer {
    if (!IntentAnalyzer.instance) {
      IntentAnalyzer.instance = new IntentAnalyzer();
    }
    return IntentAnalyzer.instance;
  }

  public getMetrics(): IntentMetrics {
    return { ...this.metrics };
  }

  public getLearningSupport(): ILearningSupport {
    return this.learningSupport;
  }

  /**
   * Main pipeline entry point. Parses raw user prompt into strongly structured Intent Package.
   */
  public async analyzePrompt(
    prompt: string,
    onTraceLog: (log: string) => void,
    options?: { workspaceId?: string; confidenceThreshold?: number }
  ): Promise<IIntentPackage> {
    const startTime = Date.now();
    const workspaceId = options?.workspaceId || "ws-aether-dev";
    const minConfidence = options?.confidenceThreshold ?? 0.65;

    onTraceLog(`[GATEWAY INGEST] Ingesting raw user prompt (${prompt.length} chars).`);
    await new Promise(resolve => setTimeout(resolve, 200));

    // Stage 1: Categorization Analysis
    onTraceLog(`[STAGE 1/6: CLASSIFICATION] Parsing semantic syntax clusters.`);
    const category = this.classifyCategory(prompt);
    onTraceLog(`[CLASSIFIER RESULT] Assigned Category: '${category}'`);

    // Stage 2: Ambiguity & Completeness Check
    onTraceLog(`[STAGE 2/6: AMBIGUITY CHECK] Inspecting for vague references or missing metrics.`);
    const missingInfo = this.detectAmbiguity(prompt, category);
    if (missingInfo.length > 0) {
      onTraceLog(`[AMBIGUITY DETECTED] Missing critical inputs: [${missingInfo.join(", ")}]`);
    } else {
      onTraceLog(`[COMPLETENESS VERIFIED] Prompt matches semantic sufficiency thresholds.`);
    }

    // Stage 3: Required Core Capabilities Selection
    onTraceLog(`[STAGE 3/6: CAPABILITY MAPPING] Mapping request objectives to platform specifications.`);
    const capabilities = this.mapRequiredCapabilities(prompt, category);
    onTraceLog(`[CAPABILITY MATCH] Requirements mapped: [${capabilities.join(", ")}]`);

    // Stage 4: Complexity Scoring & Constraints
    onTraceLog(`[STAGE 4/6: COMPLEXITY EVALUATION] Assessing technology, security risk and execution depth.`);
    const complexitySpecs = this.evaluateComplexity(prompt, category);
    onTraceLog(`[COMPLEXITY RESULT] Level: '${complexitySpecs.complexity}'. Risk: ${complexitySpecs.securityImpactScore}/10. Affected Files ~${complexitySpecs.estimatedFilesAffected}.`);

    // Stage 5: Confidence Calculation
    onTraceLog(`[STAGE 5/6: CONFIDENCE CALCULATION] Calculating statistical convergence validation index.`);
    const confidence = this.calculateConfidence(prompt, category, missingInfo);
    onTraceLog(`[CONFIDENCE INDEX] Score: ${(confidence * 100).toFixed(1)}% (Threshold constraint: ${(minConfidence * 100).toFixed(0)}%)`);

    // Stage 6: Workflow & Orchestration Recommendation
    onTraceLog(`[STAGE 6/6: ROUTING ADVICE] Choosing structural planning and execution pattern.`);
    const suggestedWorkflow = this.recommendWorkflow(category, complexitySpecs.complexity, missingInfo.length > 0);
    onTraceLog(`[ROUTING RESULT] Recommended workflow: '${suggestedWorkflow}'`);

    // Safety Level grading
    let safetyLevel: IIntentPackage["safetyLevel"] = "SECURE";
    if (complexitySpecs.securityImpactScore >= 7) {
      safetyLevel = "HUMAN_APPROVAL_REQUIRED";
    } else if (category === IntentCategory.TerminalCommands || category === IntentCategory.Deployment) {
      safetyLevel = "SANDBOXED";
    }

    const intentId = uuid();
    const intentPackage: IIntentPackage = {
      intentId,
      workspaceId,
      intentCategory: category,
      userGoal: this.extractGoalSummary(prompt),
      requiredCapabilities: capabilities,
      complexity: complexitySpecs.complexity,
      priority: this.evaluatePriority(prompt),
      confidenceScore: confidence,
      requiredContextSources: this.mapContextSources(category, capabilities),
      missingInformation: missingInfo,
      suggestedWorkflow,
      safetyLevel,
      metadata: {
        estimatedFilesAffected: complexitySpecs.estimatedFilesAffected,
        estimatedExecutionTimeMinutes: complexitySpecs.estimatedExecutionTimeMinutes,
        securityImpactScore: complexitySpecs.securityImpactScore,
        detectedTechnologies: this.detectTechnologies(prompt)
      }
    };

    // Update real-time monitoring records
    const elapsed = Date.now() - startTime;
    this.updateMetrics(category, confidence, missingInfo.length > 0, suggestedWorkflow, elapsed);

    onTraceLog(`[GATEWAY FINISHED] Intent analyzed successfully in ${elapsed}ms.`);
    return intentPackage;
  }

  /**
   * Evaluates text clusters to categorize the prompt
   */
  private classifyCategory(prompt: string): IntentCategory {
    const text = prompt.toLowerCase();

    if (text.includes("fix") || text.includes("bug") || text.includes("error") || text.includes("crash") || text.includes("broken") || text.includes("fails")) {
      return IntentCategory.BugFix;
    }
    if (text.includes("refactor") || text.includes("clean") || text.includes("decouple") || text.includes("reorganize")) {
      return IntentCategory.Refactoring;
    }
    if (text.includes("architecture") || text.includes("design pattern") || text.includes("blueprint") || text.includes("uic") || text.includes("system spec")) {
      return IntentCategory.Architecture;
    }
    if (text.includes("document") || text.includes("readme") || text.includes("comments") || text.includes("explain code") || text.includes("wiki")) {
      return IntentCategory.Documentation;
    }
    if (text.includes("test") || text.includes("jest") || text.includes("vitest") || text.includes("mocha") || text.includes("junit")) {
      return IntentCategory.Testing;
    }
    if (text.includes("deploy") || text.includes("cloud run") || text.includes("kubernetes") || text.includes("docker") || text.includes("production")) {
      return IntentCategory.Deployment;
    }
    if (text.includes("git ") || text.includes("commit") || text.includes("push") || text.includes("github") || text.includes("pull request")) {
      return IntentCategory.GitHub;
    }
    if (text.includes("browser") || text.includes("scrape") || text.includes("puppeteer") || text.includes("click button") || text.includes("automation")) {
      return IntentCategory.BrowserAutomation;
    }
    if (text.includes("run command") || text.includes("terminal") || text.includes("bash") || text.includes("exec") || text.includes("shell")) {
      return IntentCategory.TerminalCommands;
    }
    if (text.includes("plugin") || text.includes("extension") || text.includes("addon")) {
      return IntentCategory.PluginManagement;
    }
    if (text.includes("workspace") || text.includes("sandbox folder") || text.includes("isolated environment")) {
      return IntentCategory.WorkspaceManagement;
    }
    if (text.includes("memory") || text.includes("episodic") || text.includes("recall") || text.includes("preference")) {
      return IntentCategory.MemoryManagement;
    }
    if (text.includes("config") || text.includes("env") || text.includes("setting") || text.includes(".env")) {
      return IntentCategory.Configuration;
    }
    if (text.includes("plan") || text.includes("roadmap") || text.includes("milestone") || text.includes("sprint")) {
      return IntentCategory.Planning;
    }
    if (text.includes("research") || text.includes("deep dive") || text.includes("search web") || text.includes("google")) {
      return IntentCategory.Research;
    }
    if (text.includes("brainstorm") || text.includes("ideas") || text.includes("suggest") || text.includes("creative")) {
      return IntentCategory.Brainstorming;
    }
    if (text.includes("code") || text.includes("write") || text.includes("implement") || text.includes("create") || text.includes("build") || text.includes("function") || text.includes("class")) {
      return IntentCategory.Coding;
    }
    if (text.length < 30 || text.includes("hello") || text.includes("who are you") || text.includes("how is the weather")) {
      return IntentCategory.GeneralConversation;
    }

    return IntentCategory.Coding; // Default fallback OCP robust pattern
  }

  /**
   * Missing information detection based on Category
   */
  private detectAmbiguity(prompt: string, category: IntentCategory): string[] {
    const text = prompt.toLowerCase();
    const missing: string[] = [];

    // Rule 1: Code/BugFix prompts should ideally state the target file or technology context
    if (category === IntentCategory.BugFix) {
      if (!text.includes(".") && !text.includes("file") && !text.includes("line") && !text.includes("function") && !text.includes("class")) {
        missing.push("Target file, class name, or exact line coordinate");
      }
      if (!text.includes("error") && !text.includes("fail") && !text.includes("trace") && !text.includes("exception") && !text.includes("behavior")) {
        missing.push("Error message or expected/actual behavior specification");
      }
    }

    if (category === IntentCategory.Coding) {
      if (prompt.split(/\s+/).length < 5) {
        missing.push("Detailed functional requirements or implementation parameters");
      }
    }

    if (category === IntentCategory.TerminalCommands) {
      if (!text.includes("run") && !text.includes("bash") && !text.includes("sh") && !text.includes("command")) {
        missing.push("Exact command line arguments to run safely");
      }
    }

    return missing;
  }

  /**
   * Map intent properties to platform capability requirements
   */
  private mapRequiredCapabilities(prompt: string, category: IntentCategory): CoreCapabilityRequirement[] {
    const caps: Set<CoreCapabilityRequirement> = new Set();
    const text = prompt.toLowerCase();

    // All logic/architecture/general requires Reasoning
    caps.add(CoreCapabilityRequirement.Reasoning);

    if (category === IntentCategory.Coding || category === IntentCategory.BugFix || category === IntentCategory.Refactoring) {
      caps.add(CoreCapabilityRequirement.Coding);
    }
    if (category === IntentCategory.Planning || category === IntentCategory.Architecture) {
      caps.add(CoreCapabilityRequirement.Planning);
    }
    if (category === IntentCategory.TerminalCommands || category === IntentCategory.Deployment) {
      caps.add(CoreCapabilityRequirement.Terminal);
    }
    if (category === IntentCategory.GitHub) {
      caps.add(CoreCapabilityRequirement.GitHub);
    }
    if (category === IntentCategory.BrowserAutomation) {
      caps.add(CoreCapabilityRequirement.Browser);
    }
    if (category === IntentCategory.MemoryManagement) {
      caps.add(CoreCapabilityRequirement.Memory);
    }
    if (text.includes("image") || text.includes("screenshot") || text.includes("diagram") || text.includes("pdf")) {
      caps.add(CoreCapabilityRequirement.Vision);
    }
    if (text.includes("offline") || text.includes("local only") || text.includes("no network")) {
      caps.add(CoreCapabilityRequirement.Offline);
    }
    if (text.includes("large") || text.includes("monorepo") || text.includes("entire project")) {
      caps.add(CoreCapabilityRequirement.LargeContext);
    }

    return Array.from(caps);
  }

  /**
   * Complexity evaluation based on multiple technology indicators
   */
  private evaluateComplexity(prompt: string, category: IntentCategory): {
    complexity: TaskComplexity;
    estimatedFilesAffected: number;
    estimatedExecutionTimeMinutes: number;
    securityImpactScore: number;
  } {
    const text = prompt.toLowerCase();
    let score = 0;

    // File multipliers
    let estimatedFilesAffected = 1;
    if (text.includes("project") || text.includes("all files") || text.includes("monorepo")) {
      score += 4;
      estimatedFilesAffected = 12;
    } else if (text.includes("module") || text.includes("across components") || text.includes("several files")) {
      score += 2;
      estimatedFilesAffected = 4;
    }

    // Technology counts
    const technologies = this.detectTechnologies(prompt);
    score += technologies.length;

    // Critical security categories
    let securityImpactScore = 2;
    if (category === IntentCategory.TerminalCommands || text.includes("sudo") || text.includes("rm -rf") || text.includes("kill")) {
      score += 4;
      securityImpactScore = 8;
    }
    if (category === IntentCategory.Deployment || text.includes("env") || text.includes("api_key") || text.includes("password") || text.includes("secret")) {
      score += 3;
      securityImpactScore = 7;
    }

    // Complexity mapping
    let complexity: TaskComplexity = TaskComplexity.Simple;
    let estimatedExecutionTimeMinutes = 2;

    if (score >= 8) {
      complexity = TaskComplexity.LongRunning;
      estimatedExecutionTimeMinutes = 45;
    } else if (score >= 6) {
      complexity = TaskComplexity.MultiAgent;
      estimatedExecutionTimeMinutes = 15;
    } else if (score >= 4) {
      complexity = TaskComplexity.Complex;
      estimatedExecutionTimeMinutes = 8;
    } else if (score >= 2) {
      complexity = TaskComplexity.Moderate;
      estimatedExecutionTimeMinutes = 4;
    }

    return {
      complexity,
      estimatedFilesAffected,
      estimatedExecutionTimeMinutes,
      securityImpactScore
    };
  }

  /**
   * Calculates confidence of matching
   */
  private calculateConfidence(prompt: string, category: IntentCategory, missingInfo: string[]): number {
    let score = 0.95;

    // Lower confidence if critical requirements are missing
    score -= (missingInfo.length * 0.15);

    // Short vague queries get heavily penalized
    if (prompt.trim().split(/\s+/).length < 4) {
      score -= 0.3;
    }

    return Math.max(0.1, parseFloat(score.toFixed(2)));
  }

  /**
   * Priority evaluation based on keyword indicators
   */
  private evaluatePriority(prompt: string): IIntentPackage["priority"] {
    const text = prompt.toLowerCase();
    if (text.includes("urgent") || text.includes("critical") || text.includes("asap") || text.includes("emergency") || text.includes("production down")) {
      return "CRITICAL";
    }
    if (text.includes("important") || text.includes("soon") || text.includes("high priority")) {
      return "HIGH";
    }
    if (text.includes("low priority") || text.includes("when you have time") || text.includes("backlog")) {
      return "LOW";
    }
    return "NORMAL";
  }

  /**
   * Recommend matching orchestration workflow pattern
   */
  private recommendWorkflow(category: IntentCategory, complexity: TaskComplexity, isAmbiguous: boolean): WorkflowRecommendation {
    if (isAmbiguous) return WorkflowRecommendation.PlanningOnly;

    if (category === IntentCategory.Architecture || complexity === TaskComplexity.MultiAgent) {
      return WorkflowRecommendation.ArchitectureReview;
    }
    if (category === IntentCategory.Research || category === IntentCategory.Brainstorming) {
      return WorkflowRecommendation.Research;
    }
    if (category === IntentCategory.Coding && complexity === TaskComplexity.Complex) {
      return WorkflowRecommendation.CodeGeneration;
    }
    if (category === IntentCategory.Documentation) {
      return WorkflowRecommendation.Documentation;
    }
    if (category === IntentCategory.TerminalCommands || category === IntentCategory.Deployment) {
      return WorkflowRecommendation.Execution;
    }
    if (complexity === TaskComplexity.LongRunning) {
      return WorkflowRecommendation.MultiAgentDiscussion;
    }
    if (complexity === TaskComplexity.Simple) {
      return WorkflowRecommendation.SingleAgent;
    }

    return WorkflowRecommendation.SingleAgent;
  }

  private mapContextSources(category: IntentCategory, capabilities: CoreCapabilityRequirement[]): string[] {
    const sources: string[] = ["WORKSPACE", "SYSTEM"];

    if (category === IntentCategory.Coding || category === IntentCategory.BugFix) {
      sources.push("CODE", "GIT");
    }
    if (capabilities.includes(CoreCapabilityRequirement.Memory)) {
      sources.push("MEMORY");
    }
    if (category === IntentCategory.Architecture || category === IntentCategory.Planning) {
      sources.push("DOCUMENTATION", "CONVERSATION");
    }
    if (category === IntentCategory.TerminalCommands) {
      sources.push("EVENT");
    }

    return sources;
  }

  private detectTechnologies(prompt: string): string[] {
    const techs: string[] = [];
    const text = prompt.toLowerCase();

    const techCatalog = [
      "typescript", "javascript", "react", "vue", "angular", "node", "express",
      "docker", "kubernetes", "postgres", "mysql", "mongodb", "redis", "python",
      "go", "rust", "vitest", "jest", "tailwind", "html", "css", "firebase"
    ];

    for (const tech of techCatalog) {
      if (text.includes(tech)) {
        techs.push(tech.charAt(0).toUpperCase() + tech.slice(1));
      }
    }

    return techs;
  }

  private extractGoalSummary(prompt: string): string {
    if (prompt.length <= 80) return prompt;
    // Extract first sentence or truncate nicely
    const endOfFirstSentence = prompt.indexOf(".");
    if (endOfFirstSentence > 10 && endOfFirstSentence < 90) {
      return prompt.substring(0, endOfFirstSentence + 1);
    }
    return prompt.substring(0, 80) + "...";
  }

  private updateMetrics(
    category: IntentCategory,
    confidence: number,
    wasAmbiguous: boolean,
    workflow: WorkflowRecommendation,
    timeSpent: number
  ): void {
    this.metrics.totalAnalyzed++;
    this.metrics.categoryDistribution[category] = (this.metrics.categoryDistribution[category] || 0) + 1;
    this.metrics.workflowRecommendationCounts[workflow] = (this.metrics.workflowRecommendationCounts[workflow] || 0) + 1;
    
    // Running averages
    this.metrics.confidenceAvg = parseFloat(((this.metrics.confidenceAvg * 0.9) + (confidence * 0.1)).toFixed(3));
    this.metrics.averageAnalysisTimeMs = Math.round((this.metrics.averageAnalysisTimeMs * 0.9) + (timeSpent * 0.1));

    if (wasAmbiguous) {
      this.metrics.ambiguousRequestsCount++;
    }

    this.metrics.clarificationFrequency = parseFloat(
      (this.metrics.ambiguousRequestsCount / this.metrics.totalAnalyzed).toFixed(3)
    );
  }
}
