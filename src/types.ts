export interface StackOption {
  id: string;
  name: string;
  category: "language" | "framework" | "database" | "vectordb" | "config" | "logger";
  description: string;
  pros: string[];
  cons: string[];
  scalability: number; // 1-5
  security: number; // 1-5
}

export interface SecurityPolicy {
  allowedCommands: string[];
  restrictedPaths: string[];
  allowedDomains: string[];
  maxExecutionTimeout: number; // in seconds
  autoApproveSafe: boolean;
}

export interface CoreModule {
  id: string;
  name: string;
  responsibility: string;
  keyInterfaces: string[];
  dependencies: string[];
  diagramFlow: string;
}

export interface SimStep {
  name: string;
  module: string;
  status: "idle" | "processing" | "success" | "warning" | "failed";
  log: string;
  details: string;
}

// Event Bus Interface Definitions
export interface IEventMetadata {
  environment: string;
  user_email?: string;
  [key: string]: any;
}

export interface IEvent<P = any> {
  event_id: string;
  event_type: string;       // namespace pattern (e.g. "security:block")
  source_module: string;    // module name
  timestamp: number;
  workspace_id: string;
  correlation_id: string;
  priority: number;         // 1-100 (lower executes first)
  payload: P;
  metadata: IEventMetadata;
}

export interface IEventSubscriber {
  subscriber_id: string;
  subscription_pattern: string; // "security:*" or "*"
  priority_weight: number;      // subscription priority order
}

