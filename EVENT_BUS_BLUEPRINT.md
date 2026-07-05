# ALL-IN-ONE — Sprint 2.2: Event Bus
## Enterprise-Grade Decoupled Pub/Sub Messaging Backbone

This document defines the production-ready Event Bus architecture, universal data representations, thread-safe queuing/dispatch flows, and error isolation policies designed to power **ALL-IN-ONE** as an asynchronous, highly decoupled AI Development Operating System.

---

## 1. Event Bus Architecture

The Event Bus acts as the central reactive message broker for all subsystems. It replaces direct service calls with a decoupled event stream, preventing circular references and enabling transparent monitoring, telemetry logging, and security interception.

```
 [ Subsystem A ] ── Publish ──> [ Event Bus Engine ]
                                      │
              ┌───────────────────────┼───────────────────────┐ Validate & Prioritize
              ▼                       ▼                       ▼
    [ Queue Worker 1 ]      [ Queue Worker 2 ]      [ Queue Worker 3 ]
              │                       │                       │
              ▼                       ▼                       ▼
     [ Subscriber A1 ]       [ Subscriber B1 ]       [ Subscriber C1 ]
      Priority: 100           Priority: 50            Priority: 10
      (Security Check)        (Audit Logger)          (Local Store)
```

---

## 2. Universal Event Model (JSON Schema)

Every event emitted within the system conforms to the following schema, ensuring absolute traceability across parent-child tasks via `correlation_id` and strict payload validation.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UniversalEvent",
  "type": "object",
  "properties": {
    "event_id": { "type": "string", "format": "uuid" },
    "event_type": { "type": "string", "pattern": "^[a-z_]+:[a-z_]+$" },
    "source_module": { "type": "string" },
    "timestamp": { "type": "number" },
    "workspace_id": { "type": "string" },
    "correlation_id": { "type": "string", "format": "uuid" },
    "priority": { "type": "integer", "minimum": 1, "maximum": 100 },
    "payload": { "type": "object" },
    "metadata": {
      "type": "object",
      "properties": {
        "user_email": { "type": "string", "format": "email" },
        "ip_address": { "type": "string" },
        "environment": { "type": "string" }
      },
      "required": ["environment"]
    }
  },
  "required": [
    "event_id",
    "event_type",
    "source_module",
    "timestamp",
    "workspace_id",
    "correlation_id",
    "priority",
    "payload",
    "metadata"
  ]
}
```

---

## 3. Core interfaces

### A. Event Structures and Subscriber Definition

```typescript
export interface IEventMetadata {
  environment: string;
  user_email?: string;
  [key: string]: any;
}

export interface IEvent<P = any> {
  event_id: string;         // Unique UUIDv4
  event_type: string;       // Namespace format e.g. "security:block_command"
  source_module: string;    // E.g., "terminal", "security", "planner"
  timestamp: number;        // Epoch unix millisecond timestamp
  workspace_id: string;     // Context directory target
  correlation_id: string;   // Traceability correlation ID
  priority: number;         // 1 to 100. Lower number executes first.
  payload: P;               // Structurally validated event attributes
  metadata: IEventMetadata; // Environment context indicators
}

export interface IEventSubscriber {
  subscriber_id: string;
  subscription_pattern: string; // Wildcards supported (e.g. "security:*" or "*")
  priority_weight: number;      // Determines execute order relative to other subscribers
  on_event(event: IEvent): Promise<void>;
}
```

### B. Event Bus Controller Interface

```typescript
export interface IEventBus {
  /**
   * Broadcast an event. Dispatches to matching listeners concurrently or sequentially based on priority.
   */
  publish(event: IEvent): Promise<void>;

  /**
   * Register a persistent subscription.
   */
  subscribe(subscriber: IEventSubscriber): void;

  /**
   * Deregister an active subscriber.
   */
  unsubscribe(subscriber_id: string): void;

  /**
   * Fetch historical records of events passing through the queue.
   */
  getHistory(filter_type?: string): IEvent[];

  /**
   * Query telemetry counters.
   */
  getMetrics(): {
    published_count: number;
    failed_count: number;
    active_subscribers_count: number;
    average_latency_ms: number;
  };
}
```

---

## 4. Complete Event Lifecycle

The life of an event follows 9 deterministic stages:

```
[ Module Action ]
        │
        ▼
[ 1. Instantiate Event ] ────► Hydrates IDs, Timestamps, Context variables.
        │
        ▼
[ 2. Schema Validation ] ────► Ensures payload complies with category-specific contract.
        │
        ▼
[ 3. Publish Trigger ] ──────► Pipes serialized event into Event Bus memory broker.
        │
        ▼
[ 4. Queue / Enqueue ] ──────► Arranges events chronologically or by high-priority interrupts.
        │
        ▼
[ 5. Middleware Chain ] ─────► Intercepts event for security auditing or tracing metrics.
        │
        ▼
[ 6. Filter Matcher ] ──────► Inspects wildcards/namespaces to identify targets.
        │
        ▼
[ 7. Priority Sort ] ────────► Sorts matching subscribers by priority weights.
        │
        ▼
[ 8. Isolated Dispatch ] ────► Dispatches to listener tasks inside safe try/catch structures.
        │
        ▼
[ 9. Audit Logs Archive ] ───► Stores telemetry state in rel logs & updates sensors.
```

---

## 5. Event Categories

To ensure frictionless future scalability, the architecture implements rigid namespaces:

| Category | Typical Event Types | Purpose |
| :--- | :--- | :--- |
| **system** | `system:boot`, `system:shutdown`, `system:health` | Main daemon lifecycle alerts |
| **workspace** | `workspace:create`, `workspace:archive` | Sandbox directories configurations |
| **security** | `security:block_command`, `security:verify_signature` | Policy intercepts and firewalls |
| **memory** | `memory:indexed`, `memory:query` | Vector embeddings updates & SQL inserts |
| **providers** | `providers:ready`, `providers:failed` | LLM socket connection updates |
| **execution** | `execution:command_start`, `execution:command_finish` | Thread spawning & subprocess diagnostics |

---

## 6. Subscriber Isolation & Fault Tolerance Policy

If any single subscriber throws an unhandled exception or hangs during `on_event`:
1. **Never Escalate**: The exception is caught at the Dispatcher frame, preventing an event listener bug from crashing the host kernel process.
2. **Audit Telemetry**: Write a critical `system:error` trace specifying subscriber ID, source event ID, and the exact exception.
3. **Continue Queue Processing**: The Event Bus immediately dispatches the event to the remaining subscribers in the sorted list.
4. **Adaptive Backoff**: For durable message queues, the failed dispatch is rescheduled to retrying queues with exponential backoff thresholds (max 3 retries).
