import {
  createPool,
  createQueueRuntime,
  databaseReady,
  handleSyntheticJob,
  setupQueue,
} from "@nilumi/db";

export function createApiDependencies(
  apiUrl: string,
  authUrl: string,
  endpoints: ReadonlyArray<string>,
) {
  const api = createPool(apiUrl);
  const auth = createPool(authUrl);
  const producer = createQueueRuntime(apiUrl, false);
  let queueStarted = false;
  let queueHealthy = true;
  producer.on("error", () => {
    queueHealthy = false;
  });
  return {
    async prepare() {
      await producer.start();
      queueStarted = true;
    },
    async isReady(signal: AbortSignal) {
      return (
        queueStarted &&
        queueHealthy &&
        (
          await Promise.all([
            databaseReady(api, "nilumi_api", signal),
            databaseReady(auth, "nilumi_auth", signal),
            dependenciesReachable(endpoints, signal),
          ])
        ).every(Boolean)
      );
    },
    async dispose() {
      await producer.stop();
      await Promise.all([api.end(), auth.end()]);
    },
  };
}
export function createWorkerDependencies(
  workerUrl: string,
  queueUrl: string,
  endpoints: ReadonlyArray<string>,
) {
  const worker = createPool(workerUrl);
  const queue = createPool(queueUrl);
  const boss = createQueueRuntime(queueUrl, true);
  let started = false;
  let healthy = true;
  boss.on("error", () => {
    healthy = false;
  });
  return {
    async prepare() {
      if (
        !(await databaseReady(worker, "nilumi_worker")) ||
        !(await databaseReady(queue, "nilumi_queue"))
      )
        throw new Error("database_not_ready");
      await boss.start();
      await boss.work(setupQueue, { pollingIntervalSeconds: 1 }, async (jobs) => {
        for (const job of jobs) handleSyntheticJob(job.data);
      });
      started = true;
    },
    async isReady(signal: AbortSignal) {
      return (
        started &&
        healthy &&
        (
          await Promise.all([
            databaseReady(worker, "nilumi_worker", signal),
            databaseReady(queue, "nilumi_queue", signal),
            dependenciesReachable(endpoints, signal),
          ])
        ).every(Boolean)
      );
    },
    async dispose() {
      started = false;
      await boss.stop({ timeout: 2000 });
      await Promise.all([worker.end(), queue.end()]);
    },
  };
}
export async function dependenciesReachable(endpoints: ReadonlyArray<string>, signal: AbortSignal) {
  if (endpoints.length !== 2) return false;
  try {
    return (
      await Promise.all(
        endpoints.map(async (endpoint) => {
          const response = await fetch(endpoint, {
            signal: AbortSignal.any([signal, AbortSignal.timeout(700)]),
            redirect: "error",
          });
          await response.body?.cancel();
          return response.ok;
        }),
      )
    ).every(Boolean);
  } catch {
    return false;
  }
}
