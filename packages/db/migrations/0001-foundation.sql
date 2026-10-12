-- No product tables or product policies in this baseline.
CREATE TABLE private.setup_migrations (id text PRIMARY KEY, checksum text NOT NULL);
REVOKE ALL ON private.setup_migrations FROM PUBLIC;
GRANT SELECT ON private.setup_migrations TO nilumi_api, nilumi_auth, nilumi_worker, nilumi_queue;
GRANT USAGE ON SCHEMA private TO nilumi_api, nilumi_auth, nilumi_worker, nilumi_queue;
GRANT USAGE ON SCHEMA app TO nilumi_api, nilumi_worker;
GRANT USAGE ON SCHEMA auth TO nilumi_auth;
GRANT USAGE ON SCHEMA pgboss TO nilumi_api, nilumi_queue;
REVOKE ALL ON ALL TABLES IN SCHEMA pgboss FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA pgboss FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pgboss.job_now() TO nilumi_api, nilumi_queue;
GRANT SELECT ON pgboss.version, pgboss.queue TO nilumi_api, nilumi_queue;
GRANT SELECT, INSERT ON pgboss.job, pgboss.job_common TO nilumi_api;
-- Shared storage only. No partition creation, queue administration, runtime migration or reindex.
GRANT SELECT, INSERT, UPDATE, DELETE ON pgboss.job, pgboss.job_common,
  pgboss.job_dependency, pgboss.instance, pgboss.warning TO nilumi_queue;
GRANT UPDATE (flow_on, monitor_backoff_on) ON pgboss.version TO nilumi_queue;
GRANT UPDATE (monitor_claim_on, monitor_on, maintain_on, deferred_count, blocked_count,
  queued_count, ready_count, active_count, failed_count, total_count, singletons_active,
  ready_history) ON pgboss.queue TO nilumi_queue;
