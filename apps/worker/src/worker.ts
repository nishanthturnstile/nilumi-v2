export interface WorkerDependencies {
  prepare: (signal: AbortSignal) => Promise<void>;
  isReady: (signal: AbortSignal) => Promise<boolean>;
  dispose: () => Promise<void>;
  heartbeat: (state: Readonly<{ ready: boolean }>) => void;
}

export function createWorker(
  dependencies: WorkerDependencies,
  options: {
    heartbeatMs?: number;
    operationTimeoutMs?: number;
    shutdownTimeoutMs?: number;
  } = {},
) {
  let ready = false;
  let stopped = false;
  let started = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let shutdown: Promise<void> | undefined;
  const lifetime = new AbortController();
  async function bounded<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    lifetime.signal.addEventListener("abort", abort, { once: true });
    if (lifetime.signal.aborted) abort();
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation(controller.signal),
        new Promise<never>((_resolve, reject) => {
          deadline = setTimeout(() => {
            controller.abort();
            reject(new Error("worker_operation_timeout"));
          }, timeoutMs);
        }),
      ]);
    } finally {
      clearTimeout(deadline);
      lifetime.signal.removeEventListener("abort", abort);
      controller.abort();
    }
  }
  async function pulse() {
    try {
      const result = await bounded(dependencies.isReady, options.operationTimeoutMs ?? 1000);
      ready = !stopped && result;
    } catch {
      ready = false;
    }
    if (stopped) return;
    dependencies.heartbeat({ ready });
    timer = setTimeout(() => {
      void pulse();
    }, options.heartbeatMs ?? 10000);
  }
  return {
    get ready() {
      return ready;
    },
    async start() {
      if (started || stopped) throw new Error("worker_already_started_or_stopped");
      started = true;
      try {
        await bounded(dependencies.prepare, options.operationTimeoutMs ?? 1000);
        if (!stopped) await pulse();
      } catch {
        await this.stop();
        throw new Error("worker_startup_failed");
      }
    },
    stop() {
      if (shutdown) return shutdown;
      stopped = true;
      ready = false;
      clearTimeout(timer);
      lifetime.abort();
      shutdown = bounded(() => dependencies.dispose(), options.shutdownTimeoutMs ?? 5000).then(
        () => undefined,
      );
      return shutdown;
    },
  };
}
