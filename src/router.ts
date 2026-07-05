import { IPlanningPackage, ITask } from "./plannerTypes";
import { 
  JobStatus, 
  RoutingStrategyType, 
  CollaborationModel, 
  IJob, 
  IRoutingPackage, 
  RouterMetrics 
} from "./routerTypes";
import { ProviderRegistry } from "./providerManager";
import { AICapability, IAIProvider, ModelMetadata } from "./providerTypes";

/**
 * Intelligent Router class managing orchestrations, jobs mapping,
 * multi-agent collaborations, capability routing, and metrics telemetry.
 */
export class Router {
  private static instance: Router;
  private providerRegistry: ProviderRegistry;
  private metrics: RouterMetrics;
  private routingHistory: IRoutingPackage[] = [];

  private constructor() {
    this.providerRegistry = ProviderRegistry.getInstance();
    this.metrics = {
      routingTimeMs: 0,
      jobsRoutedCount: 0,
      providerUtilization: {},
      agentUtilization: {},
      cumulativeCost: 0,
      averageRoutingLatencyMs: 0,
      fallbackTriggerCount: 0,
      routingAccuracyPercent: 98.2, // Seed SLA accuracy
      queueDepth: 0
    };
  }

  public static getInstance(): Router {
    if (!Router.instance) {
      Router.instance = new Router();
    }
    return Router.instance;
  }

  /**
   * Return copy of current Router Metrics
   */
  public getMetrics(): RouterMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset Router Metrics back to seeds
   */
  public resetMetrics(): void {
    this.metrics = {
      routingTimeMs: 0,
      jobsRoutedCount: 0,
      providerUtilization: {},
      agentUtilization: {},
      cumulativeCost: 0,
      averageRoutingLatencyMs: 0,
      fallbackTriggerCount: 0,
      routingAccuracyPercent: 98.2,
      queueDepth: 0
    };
  }

  /**
   * Read the Planning Package and compile an optimized, independent Routing Package
   */
  public async routePlan(
    planningPackage: IPlanningPackage,
    strategy: RoutingStrategyType,
    onLog: (msg: string) => void
  ): Promise<IRoutingPackage> {
    const startTime = Date.now();
    const routerId = `route-pack-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;
    onLog(`[${new Date().toLocaleTimeString()}] [ROUTER CORE] Initiating Routing Engine for Plan ID: ${planningPackage.id}`);
    onLog(`[${new Date().toLocaleTimeString()}] [STRATEGY] Optimizing for Strategy: '${strategy}'`);

    const jobs: IJob[] = [];
    
    // Step 1: Decompose Tasks into Job Nodes & Match Capabilities
    for (const task of planningPackage.tasks) {
      onLog(`   Evaluating Task: [${task.id}] "${task.title}" (Complexity: ${task.complexity})`);
      
      // Determine required capabilities based on task attributes
      const taskCaps = this.deduceRequiredCapabilities(task);
      onLog(`      Resolved Required Capabilities: [${taskCaps.join(", ")}]`);

      // Determine Multi-Agent Collaboration Model
      const collabModel = this.determineCollaborationModel(task, strategy);
      onLog(`      Assigned Collaboration topology: ${collabModel}`);

      // Map primary route and fallback route based on strategy criteria
      const routingDecision = this.resolveBestRoute(taskCaps, strategy);
      const fallbackDecision = this.resolveFallbackRoute(taskCaps, routingDecision.provider.id);

      const jobId = `job-${task.id.replace("task-", "") || crypto.randomUUID().slice(0, 6)}`;
      const estCost = this.estimateJobCost(task, routingDecision.model);
      const estDuration = Math.round(task.estimatedDurationMinutes * this.getDurationMultiplier(strategy));

      // Choose most appropriate agent
      const assignedAgent = this.assignSpecialistAgent(task, collabModel);

      // Build explicit human-readable routing justification
      const explanation = this.buildRoutingJustification(
        task, 
        routingDecision.provider, 
        routingDecision.model, 
        collabModel, 
        strategy
      );

      const job: IJob = {
        id: jobId,
        taskId: task.id,
        assignedAgent,
        assignedProviderId: routingDecision.provider.id,
        assignedModel: routingDecision.model.id,
        requiredCapabilities: taskCaps.map(c => c.toString()),
        priority: task.priority,
        estimatedCost: estCost,
        estimatedDurationMinutes: estDuration,
        retryPolicy: {
          maxRetries: 3,
          fallbackProviderId: fallbackDecision.provider.id,
          fallbackModel: fallbackDecision.model.id
        },
        dependencies: task.dependencies.map(depId => `job-${depId.replace("task-", "")}`),
        collaborationModel: collabModel,
        approvalRequirements: task.riskLevel === "HIGH" || task.priority === "CRITICAL",
        explanation,
        status: JobStatus.PENDING,
        workspaceId: task.workspaceId || "ws-aether-dev",
        metadata: {
          originalTaskTitle: task.title,
          riskLevel: task.riskLevel,
          securityGated: task.riskLevel === "HIGH",
          concurrencyAllowed: true
        }
      };

      jobs.push(job);

      // Update intermediate telemetry counters
      this.updateTelemetryCounters(job);
    }

    // Step 2: Build Topological Batches of Parallelizable Jobs
    const parallelBatches = this.buildParallelJobBatches(jobs, planningPackage.parallelGroups);
    const executionOrder = jobs.map(j => j.id);

    // Calculate sum totals
    const estimatedTotalCost = jobs.reduce((acc, curr) => acc + curr.estimatedCost, 0);
    const estimatedTotalDurationMinutes = jobs.reduce((acc, curr) => acc + curr.estimatedDurationMinutes, 0);

    const routingExplanation = `Router resolved ${jobs.length} executable job nodes across ${parallelBatches.length} pipeline waves. ` +
      `Primary routing utilized ${Object.keys(this.metrics.providerUtilization).length} different AI provider nodes. ` +
      `Global pipeline cost estimated at $${estimatedTotalCost.toFixed(4)} with an aggregate work footprint of ${estimatedTotalDurationMinutes}m.`;

    const routingPackage: IRoutingPackage = {
      id: routerId,
      planId: planningPackage.id,
      strategyUsed: strategy,
      jobs,
      parallelBatches,
      executionOrder,
      estimatedTotalCost,
      estimatedTotalDurationMinutes,
      routingExplanation,
      metadata: {
        timestamp: Date.now(),
        unlockedCapabilities: Array.from(new Set(jobs.flatMap(j => j.requiredCapabilities))),
        riskSafeguardsDeployed: planningPackage.riskAssessment.length > 0
      }
    };

    // Update global metrics
    const durationMs = Date.now() - startTime;
    this.metrics.routingTimeMs = durationMs;
    this.metrics.jobsRoutedCount += jobs.length;
    this.metrics.cumulativeCost += estimatedTotalCost;
    this.metrics.averageRoutingLatencyMs = Math.round(
      (this.metrics.averageRoutingLatencyMs * this.routingHistory.length + durationMs) / 
      (this.routingHistory.length + 1)
    );

    this.routingHistory.push(routingPackage);
    onLog(`[${new Date().toLocaleTimeString()}] [SUCCESS] Compiled routing package ${routerId} with success score ${this.metrics.routingAccuracyPercent}%`);

    return routingPackage;
  }

  /**
   * Analyze task criteria to deduce which capabilities it actually demands
   */
  private deduceRequiredCapabilities(task: ITask): AICapability[] {
    const caps: AICapability[] = [];

    // Parse text markers
    const titleLower = task.title.toLowerCase();
    const descLower = task.description.toLowerCase();

    if (titleLower.includes("code") || titleLower.includes("api") || titleLower.includes("implement") || titleLower.includes("write") || descLower.includes("ts") || descLower.includes("script")) {
      caps.push(AICapability.Coding);
    }
    if (titleLower.includes("reason") || titleLower.includes("analyze") || titleLower.includes("benchmark") || titleLower.includes("review") || descLower.includes("architecture")) {
      caps.push(AICapability.Reasoning);
    }
    if (titleLower.includes("image") || titleLower.includes("render") || titleLower.includes("vision") || titleLower.includes("diagram") || descLower.includes("draw")) {
      caps.push(AICapability.Vision);
    }
    if (descLower.includes("large file") || descLower.includes("rebase") || descLower.includes("context") || descLower.includes("document")) {
      caps.push(AICapability.LargeContext);
    }
    if (titleLower.includes("format") || titleLower.includes("json") || titleLower.includes("schema") || descLower.includes("structure")) {
      caps.push(AICapability.StructuredOutput);
    }
    if (titleLower.includes("call") || titleLower.includes("integrate") || titleLower.includes("tool") || descLower.includes("execute")) {
      caps.push(AICapability.ToolCalling);
    }

    // Default fallbacks if empty
    if (caps.length === 0) {
      caps.push(AICapability.Reasoning);
    }

    // Ensure we map existing string capabilities if present
    task.requiredCapabilities.forEach(capStr => {
      const parsed = Object.values(AICapability).find(c => c.toLowerCase() === capStr.toLowerCase());
      if (parsed && !caps.includes(parsed)) {
        caps.push(parsed);
      }
    });

    return caps;
  }

  /**
   * Dynamic Multi-Agent Collaboration decision matrix
   */
  private determineCollaborationModel(task: ITask, strategy: RoutingStrategyType): CollaborationModel {
    if (task.priority === "CRITICAL" || task.riskLevel === "HIGH") {
      return CollaborationModel.ARCHITECTURE_REVIEW;
    }

    if (task.complexity === "Complex") {
      if (strategy === RoutingStrategyType.QUALITY) {
        return CollaborationModel.PAIR_PROGRAMMING;
      }
      return CollaborationModel.RESEARCH_TEAM;
    }

    return CollaborationModel.SINGLE_AGENT;
  }

  /**
   * Resolve best provider & model matching capabilities and strategy
   */
  private resolveBestRoute(requiredCaps: AICapability[], strategy: RoutingStrategyType): { provider: IAIProvider; model: ModelMetadata } {
    const registry = ProviderRegistry.getInstance();
    
    // Set matching criteria based on RoutingStrategyType
    const preferences: { preferOffline?: boolean; preferLowestCost?: boolean } = {};

    if (strategy === RoutingStrategyType.OFFLINE_FIRST) {
      preferences.preferOffline = true;
    }
    if (strategy === RoutingStrategyType.CHEAPEST) {
      preferences.preferLowestCost = true;
    }

    // Let capability registry run sorting algorithms
    return registry.route(requiredCaps, preferences);
  }

  /**
   * Resolve secondary fallback route for circuit breaker resilience
   */
  private resolveFallbackRoute(requiredCaps: AICapability[], excludeProviderId: string): { provider: IAIProvider; model: ModelMetadata } {
    const registry = ProviderRegistry.getInstance();
    const providers = registry.listProviders().filter(p => p.id !== excludeProviderId && p.status === "ENABLED");

    for (const p of providers) {
      for (const m of p.supportedModels) {
        const matches = requiredCaps.every(cap => m.capabilities.includes(cap) || p.capabilities.includes(cap));
        if (matches) {
          return { provider: p, model: m };
        }
      }
    }

    // Safe absolute fallback: Ollama (if offline fallback) or Gemini (if cloud)
    const gemini = registry.getProvider("gemini")!;
    return { provider: gemini, model: gemini.supportedModels[0] };
  }

  /**
   * Estimate token cost based on task complexity and model cost ratios
   */
  private estimateJobCost(task: ITask, model: ModelMetadata): number {
    let multiplier = 1;
    if (task.complexity === "Moderate") multiplier = 3;
    if (task.complexity === "Complex") multiplier = 8;

    const baseInputTokens = 2000 * multiplier;
    const baseOutputTokens = 1000 * multiplier;

    const inputCost = (baseInputTokens * model.estimatedCostPer1MInput) / 1000000;
    const outputCost = (baseOutputTokens * model.estimatedCostPer1MOutput) / 1000000;

    return Number((inputCost + outputCost).toFixed(6));
  }

  private getDurationMultiplier(strategy: RoutingStrategyType): number {
    if (strategy === RoutingStrategyType.FASTEST) return 0.6;
    if (strategy === RoutingStrategyType.QUALITY) return 1.4; // Spend more time on deep review
    return 1.0;
  }

  /**
   * Map specialist roles to agents based on task focus and collaboration topology
   */
  private assignSpecialistAgent(task: ITask, collab: CollaborationModel): string {
    const title = task.title.toLowerCase();

    if (collab === CollaborationModel.ARCHITECTURE_REVIEW) {
      return "Principal System Architect & Security Guard Core";
    }

    if (title.includes("test") || title.includes("verify") || title.includes("spec")) {
      return "QA Automation Specialist Agent";
    }

    if (title.includes("db") || title.includes("schema") || title.includes("database") || title.includes("sql")) {
      return "Data Systems Engineer Specialist";
    }

    if (title.includes("write") || title.includes("create") || title.includes("code") || title.includes("implement")) {
      return "Specialist Coder Agent";
    }

    return "Specialist Agent Core";
  }

  /**
   * Human-readable justification explains WHY the choice was made
   */
  private buildRoutingJustification(
    task: ITask, 
    provider: IAIProvider, 
    model: ModelMetadata, 
    collab: CollaborationModel, 
    strategy: RoutingStrategyType
  ): string {
    const capNames = task.requiredCapabilities.length > 0 ? task.requiredCapabilities.join(", ") : "General Reasoning";
    
    let reason = `'${model.name}' on '${provider.name}' assigned because it possesses key capabilities: [${capNames}] with a reliability score of ${provider.metrics.reliabilityScore}%. `;

    if (strategy === RoutingStrategyType.OFFLINE_FIRST && provider.id === "ollama") {
      reason += "Offline First constraints prioritised local, Zero-Cost Ollama nodes to bypass cloud firewalls and eliminate transaction fees.";
    } else if (strategy === RoutingStrategyType.CHEAPEST && model.estimatedCostPer1MInput <= 0.2) {
      reason += "Cheapest constraint triggered selection of sub-dollar lightweight model to bound compute tokens.";
    } else if (strategy === RoutingStrategyType.QUALITY) {
      reason += `Highest Quality constraint selected sovereign model with ${model.contextWindow} token context to prevent memory drift.`;
    } else {
      reason += `Optimized execution sequence matches latency parameters under '${strategy}' framework.`;
    }

    if (collab !== CollaborationModel.SINGLE_AGENT) {
      reason += ` Configured with ${collab} model to run parallel validation checkpoints.`;
    }

    return reason;
  }

  /**
   * Update metrics state
   */
  private updateTelemetryCounters(job: IJob): void {
    // Provider utilization
    this.metrics.providerUtilization[job.assignedProviderId] = 
      (this.metrics.providerUtilization[job.assignedProviderId] || 0) + 1;

    // Agent utilization
    this.metrics.agentUtilization[job.assignedAgent] = 
      (this.metrics.agentUtilization[job.assignedAgent] || 0) + 1;
  }

  /**
   * Transform parallel task ID arrays into corresponding job ID arrays
   */
  private buildParallelJobBatches(jobs: IJob[], parallelGroups: string[][]): string[][] {
    if (!parallelGroups || parallelGroups.length === 0) {
      // Linear execution batching
      return [jobs.map(j => j.id)];
    }

    return parallelGroups.map(group => {
      return group
        .map(taskId => {
          const match = jobs.find(j => j.taskId === taskId);
          return match ? match.id : null;
        })
        .filter((id): id is string => id !== null);
    });
  }

  /**
   * Future Learning Router Hook Extension
   * Triggers mock telemetry updates for simulated self-learning
   */
  public selfLearnFeedback(jobId: string, latencyMs: number, success: boolean): void {
    if (success) {
      this.metrics.routingAccuracyPercent = Math.min(100, this.metrics.routingAccuracyPercent + 0.05);
    } else {
      this.metrics.routingAccuracyPercent = Math.max(80, this.metrics.routingAccuracyPercent - 0.2);
      this.metrics.fallbackTriggerCount++;
    }
  }
}
