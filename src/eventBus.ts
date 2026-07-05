import { IEvent, IEventSubscriber, IEventMetadata } from "./types";

/**
 * Event Bus implementation for ALL-IN-ONE
 * Handles prioritized subscription, wildcard namespace matching (e.g. "security:*"),
 * stage validation, middleware hooks, and error isolated event delivery.
 */
export class Event<P = any> implements IEvent<P> {
  public event_id: string;
  public event_type: string;
  public source_module: string;
  public timestamp: number;
  public workspace_id: string;
  public correlation_id: string;
  public priority: number;
  public payload: P;
  public metadata: IEventMetadata;

  constructor(params: Omit<IEvent<P>, "event_id" | "timestamp">) {
    this.event_id = crypto.randomUUID ? crypto.randomUUID() : this.generateUUID();
    this.timestamp = Date.now();
    this.event_type = params.event_type;
    this.source_module = params.source_module;
    this.workspace_id = params.workspace_id;
    this.correlation_id = params.correlation_id || this.event_id;
    this.priority = params.priority || 50;
    this.payload = params.payload;
    this.metadata = params.metadata || { environment: "production" };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export type MiddlewareFn = (event: IEvent) => Promise<boolean> | boolean;
export type SubscriberCallback = (event: IEvent) => Promise<void> | void;

export interface RegisteredSubscriber {
  info: IEventSubscriber;
  callback: SubscriberCallback;
}

export class EventBus {
  private static instance: EventBus;
  private subscribers: Map<string, RegisteredSubscriber> = new Map();
  private middlewares: MiddlewareFn[] = [];
  private eventHistory: IEvent[] = [];
  private maxHistorySize = 100;

  private constructor() {}

  /**
   * Singleton accessor
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Registers a global middleware executed before event distribution
   */
  public use(middleware: MiddlewareFn): void {
    this.middlewares.push(middleware);
  }

  /**
   * Registers a subscriber callback for a specific event type pattern
   */
  public subscribe(
    subscriber: IEventSubscriber,
    callback: SubscriberCallback
  ): () => void {
    this.subscribers.set(subscriber.subscriber_id, { info: subscriber, callback });
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriber.subscriber_id);
    };
  }

  /**
   * Dispatches an event through the pipeline stages:
   * 1. Instantiation
   * 2. Validation
   * 3. Middleware processing
   * 4. Namespace routing / matching
   * 5. Priority sorting of matched subscribers
   * 6. Async execution with isolated error capture
   */
  public async publish(event: IEvent): Promise<{
    success: boolean;
    subscriberCount: number;
    failedCount: number;
    errors: Error[];
  }> {
    // Stage 1: Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Stage 2: Validation
    if (!event.event_type || !event.source_module) {
      return { success: false, subscriberCount: 0, failedCount: 0, errors: [new Error("Invalid event: missing type or source")] };
    }

    // Stage 3: Middleware Execution
    for (const middleware of this.middlewares) {
      try {
        const allowed = await middleware(event);
        if (!allowed) {
          return { success: false, subscriberCount: 0, failedCount: 0, errors: [new Error("Event blocked by middleware guard")] };
        }
      } catch (err) {
        return { success: false, subscriberCount: 0, failedCount: 0, errors: [err as Error] };
      }
    }

    // Stage 4: Pattern Matching (e.g. "security:block" matches "security:*")
    const matchedSubscribers: RegisteredSubscriber[] = [];
    for (const sub of this.subscribers.values()) {
      if (this.matchPattern(event.event_type, sub.info.subscription_pattern)) {
        matchedSubscribers.push(sub);
      }
    }

    // Stage 5: Priority Sorting (lower numbers execute first)
    matchedSubscribers.sort((a, b) => {
      // Sorting based on combined priority calculations
      return a.info.priority_weight - b.info.priority_weight;
    });

    // Stage 6: Safe Delivery with Isolation
    const errors: Error[] = [];
    let failedCount = 0;

    for (const sub of matchedSubscribers) {
      try {
        await sub.callback(event);
      } catch (err) {
        failedCount++;
        errors.push(err instanceof Error ? err : new Error(String(err)));
        // Error isolation: failing subscribers don't stop other subscribers
      }
    }

    return {
      success: errors.length === 0,
      subscriberCount: matchedSubscribers.length,
      failedCount,
      errors
    };
  }

  /**
   * Helper to fetch full historical events trace
   */
  public getHistory(): IEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Matches string namespaces using wildcard search
   */
  private matchPattern(type: string, pattern: string): boolean {
    if (pattern === "*") return true;
    if (pattern.endsWith(":*")) {
      const namespace = pattern.slice(0, -2);
      return type.startsWith(namespace + ":");
    }
    return type === pattern;
  }
}
