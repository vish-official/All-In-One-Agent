# ALL-IN-ONE — Sprint 2.1: Kernel (Application Core)
## Enterprise-Grade System Lifecycle & Service Registry Blueprint

This document defines the production-ready architecture, interfaces, state machines, and lifecycle management protocols for the **ALL-IN-ONE Core Kernel**. The Kernel is the foundational orchestrator and service coordinator of the platform. It handles synchronous boot-strapping, health diagnostics telemetry, security isolation triggers, and graceful shutdown workflows under a zero-circular-dependency regime.

---

## 1. Kernel Architecture

The Kernel is built upon the **Service Registry** and **Dependency Injection** patterns. Subsystems register themselves under explicit interfaces, avoiding direct, tight coupling or global singleton references. 

```
               ┌───────────────────────────────────────┐
               │         Kernel Lifecycle Manager       │
               └──────────────────┬────────────────────┘
                                  │ Uses
               ┌──────────────────▼────────────────────┐
               │           Service Registry            │
               └──────┬─────────────────────────┬──────┘
                      │                         │
         ┌────────────▼────────────┐  ┌─────────▼─────────────┐
         │ IConfigService          │  │ IEventBusService      │
         └─────────────────────────┘  └───────────────────────┘
         ┌────────────▼────────────┐  ┌─────────▼─────────────┐
         │ ISecurityService        │  │ IMemoryService        │
         └─────────────────────────┘  └───────────────────────┘
         ┌────────────▼────────────┐  ┌─────────▼─────────────┐
         │ IWorkspaceService       │  │ IProviderService      │
         └─────────────────────────┘  └───────────────────────┘
```

### Core Design Principles
1. **Interface-Driven Dependency Resolution**: Modules only request references to interfaces (e.g. `IConfigService`), ensuring any subsystem (such as local vs cloud database) can be swapped out with zero impact on core kernel files.
2. **Deterministic Sequence Boot**: Components declare their boot priority weights. The Kernel resolves these into a step-by-step linear pipeline.
3. **Fail-Fast Isolated Initialization**: If a dependency fails to satisfy health checks during boot, the Kernel triggers an automatic rollback of already-running systems, flushes logger streams, and terminates cleanly to prevent memory-corrupted partial state.

---

## 2. Interface Definitions

### A. The Service Registry & Kernel Interface

```python
from enum import Enum
from typing import Dict, Any, Type, TypeVar, Optional, List
from abc import ABC, abstractmethod

T = TypeVar('T')

class KernelState(Enum):
    UNINITIALIZED = "uninitialized"
    BOOTING = "booting"
    RUNNING = "running"
    SHUTTING_DOWN = "shutting_down"
    CRASHED = "crashed"

class IServiceRegistry(ABC):
    @abstractmethod
    def register(self, service_type: Type[T], instance: T) -> None:
        """Add a service instance bound to its base interface class."""
        pass

    @abstractmethod
    def get(self, service_type: Type[T]) -> T:
        """Retrieve a registered service. Raises ServiceNotRegisteredException if missing."""
        pass

class IKernel(ABC):
    @property
    @abstractmethod
    def state(self) -> KernelState:
        """Read current live operating state of the system."""
        pass

    @property
    @abstractmethod
    def registry(self) -> IServiceRegistry:
        """Access the centralized service registration store."""
        pass

    @abstractmethod
    def bootstrap(self) -> bool:
        """Execute the entire linear boot sequence. Returns True if fully ready."""
        pass

    @abstractmethod
    def shutdown(self, exit_code: int = 0) -> None:
        """Trigger complete graceful shutdown, releasing file locks and active resources."""
        pass
```

### B. The Unified Service Interface (Subsystem Base)

Every core module (Memory, Security, Event Bus, Workspace) must subclass this interface to be orchestratable by the Kernel:

```python
@dataclass
class ServiceHealth:
    is_healthy: bool
    latency_ms: float
    status_message: str
    metrics: Dict[str, Any]

class IService(ABC):
    @property
    @abstractmethod
    def service_id(self) -> str:
        """Unique identifier of the service (e.g., 'service:memory')."""
        pass

    @property
    @abstractmethod
    def boot_priority(self) -> int:
        """Weights determining initialization order (Lower weights boot first)."""
        pass

    @abstractmethod
    def initialize(self, registry: IServiceRegistry) -> None:
        """Set up listeners, read config parameters, allocate local resources."""
        pass

    @abstractmethod
    def check_health(self) -> ServiceHealth:
        """Query diagnostic metrics, verify local file/socket descriptors."""
        pass

    @abstractmethod
    def terminate(self) -> None:
        """Release locks, close active connection pools, flush buffered data."""
        pass
```

---

## 3. Dynamic Boot & Shutdown Sequence

### A. Linear Startup Flowchart
The bootstrap sequence evaluates service weights and executes components in this exact order:

```
[ Application Launch ]
          │
          ▼
┌──────────────────┐
│  Configure Log   ├───────► Instantiates Structured Logger
└─────────┬────────┘
          ▼
┌──────────────────┐
│   Load Config    ├───────► Verifies YAML configurations and Secrets
└─────────┬────────┘
          ▼
┌──────────────────┐
│    Event Bus     ├───────► Starts asynchronous publish/subscribe broker
└─────────┬────────┘
          ▼
┌──────────────────┐
│ Security Engine  ├───────► Restricts filesystem & compiles command regex Whitelists
└─────────┬────────┘
          ▼
┌──────────────────┐
│ Workspace System ├───────► Mounts workspace DB, reads directory permissions
└─────────┬────────┘
          ▼
┌──────────────────┐
│ Memory & Vector  ├───────► Instantiates local SQLite & ChromaDB adapters
└─────────┬────────┘
          ▼
┌──────────────────┐
│  AI Providers    ├───────► Connects to Gemini API and local Ollama
└─────────┬────────┘
          ▼
┌──────────────────┐
│  Plugin Manager  ├───────► Scans, validates, and initializes active SDK Extensions
└─────────┬────────┘
          ▼
┌──────────────────┐
│  Health Checks   ├───────► Verify system statuses & trigger state -> RUNNING
└──────────────────┘
```

### B. Safe Rollback Policy on Startup Failures
If any subsystem throws an unhandled exception during the `initialize()` method:
1. **Intercept State**: Intercept exception, transition state to `KernelState.CRASHED`.
2. **Log Stack Trace**: Write a high-priority, cryptographic log entry detailing the exact module, exception type, and configuration parameter state.
3. **Backward Rollback Loop**: Iterate through all services with *lower* boot priority that were *already initialized*, invoking their `.terminate()` methods in reverse order to cleanly close database handles.
4. **Halt Application**: Safe-exit with code `1`, reporting a highly structural visual debug trace to prevent broken or corrupted partial setups from processing instructions.

---

## 4. Health Monitoring & Diagnostic Telemetry

The Kernel runs a lightweight, low-overhead asynchronous telemetry daemon to trace resource metrics, memory consumption thresholds, queue lengths, and provider connection latencies.

### Telemetry Health Report Schema (JSON Schema)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "KernelHealthTelemetry",
  "type": "object",
  "properties": {
    "timestamp": { "type": "number" },
    "kernel_state": { "type": "string", "enum": ["uninitialized", "booting", "running", "shutting_down", "crashed"] },
    "uptime_seconds": { "type": "integer" },
    "resources": {
      "type": "object",
      "properties": {
        "memory_rss_bytes": { "type": "integer" },
        "cpu_percentage": { "type": "number" },
        "active_threads": { "type": "integer" }
      },
      "required": ["memory_rss_bytes", "cpu_percentage"]
    },
    "services_status": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "healthy": { "type": "boolean" },
          "latency_ms": { "type": "number" },
          "message": { "type": "string" }
        },
        "required": ["healthy", "latency_ms"]
      }
    },
    "event_bus": {
      "type": "object",
      "properties": {
        "pending_messages_count": { "type": "integer" },
        "total_events_processed": { "type": "integer" }
      },
      "required": ["pending_messages_count", "total_events_processed"]
    }
  },
  "required": ["timestamp", "kernel_state", "uptime_seconds", "resources", "services_status", "event_bus"]
}
```

---

## 5. Graceful Shutdown Protocol

When receiving critical termination signals (e.g., `SIGTERM`, `SIGINT`), the Kernel triggers a thread-safe shutdown lifecycle:

```python
class KernelShutdownCoordinator:
    def __init__(self, kernel: IKernel, logger: Any):
        self.kernel = kernel
        self.logger = logger

    def handle_signal(self, signum: int, frame: Any) -> None:
        self.logger.warning(f"Intercepted system shutdown signal ({signum}). Starting safe release protocol...")
        self.kernel.shutdown()
```

### Steps Executed on Shutdown
1. **Halt Input Processing**: Disable the user prompt interface and reject new incoming task plans.
2. **Stop Running Services**: Stop browser automation sessions (e.g. `playwright.stop()`), terminate sandboxed terminal subprocesses, and halt running worker threads.
3. **Persist State**: Write active workspace session contexts, unsaved planner logs, and diagnostic files back to their local SQLite tables.
4. **Flush Buffers**: Flush internal buffered logging logs to disk and close open file-system file descriptors.
5. **Release Resources**: Disconnect from external LLM socket hosts and close database transaction pool queues.
6. **Graceful Exit**: Emit a final system shutdown event and exit. No data loss occurs.
