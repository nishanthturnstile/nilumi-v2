# Nilumi — Tech Stack

**Version:** 2.4 · **Date:** 11 October 2026 · **Status:** Agreed development and Phase 1 stack; production deployment decisions deferred.

[Product plan and vision](product-plan.md) · [Requirements and features](requirements-and-features.md) · [Architecture](architecture.md) · [Tech stack](tech-stack.md)

These four documents collectively form the Nilumi v2.4 baseline and supersede all earlier versions and notes. Original section numbers are retained for traceability.

This document records the chosen stack, services and processing boundaries, without the comparisons considered during selection. The [architecture](architecture.md) defines the technical contracts and [requirements](requirements-and-features.md#section-12) define device checks, SLOs and release gates. Selecting a tool does not establish that its integration has passed those gates.

---

<a id="section-12"></a>

## 12. Technology choices

<a id="section-12-1-stack"></a>

### 12.1 Technology stack and rationale

| Layer | Choice | Why |
|---|---|---|
| Client | Expo + React Native + Expo Router; installed Android application and responsive web/PWA for iOS | Shared UI and contracts with platform-specific components where needed |
| UI primitives / design system | Tamagui unstyled primitives beneath a Nilumi-owned component library; Pastel Rooms catalogue recipes in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Custom tokens and visual identity shared across native/web; accessible behavior completed and tested by Nilumi |
| Fonts / icons / motion | Bundled Nunito and Noto Sans Tamil; Phosphor SVG assets with contextual duotone treatment; catalogue motion tokens | Mixed-script readability, design fidelity and reduced-motion behavior; native/web adaptations remain explicit |
| Backend runtime | Node.js 24 LTS + TypeScript | One language across application services and clients |
| Application API | Fastify modular monolith; business rules and authorization run in backend services | Any client can use the same authoritative application logic |
| Database | One self-hosted PostgreSQL database as a separate service; enabled/forced RLS + service write checks + tenant-scoped FKs | Authoritative relational records, permissions and transactional work |
| Database access / isolation | `auth`, `app`, `pgboss`, `private` schemas; purpose-specific credentials and transaction-local context | Separate identity/product/queue privileges; scoped helpers for authorization and lifecycle work |
| ORM / driver / migrations | Drizzle ORM using `pg` (node-postgres); Drizzle Kit with reviewed, versioned release migrations | Typed access on a single transaction connection; runtime roles cannot own/alter product tables |
| Authentication | Better Auth inside the API, using PostgreSQL through its Drizzle adapter | Centralized identity and sessions; Nilumi owns household authorization and recovery rules |
| Session transport / storage | Better Auth Expo integration (`@better-auth/expo`) + `expo-secure-store` on Android; Secure/HttpOnly cookies on web; PostgreSQL-backed sessions with server cookie-cache validation disabled | Fresh session/membership checks satisfy revocation requirements; credentials stay outside offline content caches |
| API contracts | REST/JSON under `/api/v1`; Zod runtime schemas, `@fastify/type-provider-zod` and `@fastify/swagger` generate OpenAPI contracts | Runtime validation and versioned, compatible contracts for Android, web and future clients |
| Shared API client | `openapi-typescript` generated types + `openapi-fetch`; TanStack Query domain hooks | One typed application client; platform-specific cookie transport and account/household/permission-scoped cache keys |
| Q&A progress transport | Fetch-based SSE; `expo/fetch` on Android, browser fetch on web, `eventsource-parser` framing and runtime-validated events | Content-free progress followed by a fully validated answer; best-effort cancellation on leaving/backgrounding |
| Durable work | pg-boss in the application PostgreSQL database; separate Node.js worker process/container | Transactional enqueue, delayed work, retries and restart recovery |
| Hosting / deployment | Linux VM + Docker Compose, deployed and managed through self-hosted Dokploy | Lean development/private-pilot deployment with independently managed services |
| Routing / TLS | Dokploy-managed Traefik routing and HTTPS; PWA and application/auth APIs share one origin | Use the deployment platform's ingress and browser cookie transport |
| Object storage | Self-hosted SeaweedFS through an S3-compatible application adapter | Audio, exports and snapshots outside the relational database |
| STT | **Selected:** Sarvam Saaras v4, explicitly pinned as `saaras:v4`; `translit` for Roman display and `codemix` for Tamil-script output, selected by member preference | Founder has evaluated Sarvam; English / Tamil / Tanglish speech path |
| TTS | **Selected:** Sarvam Bulbul v4 Flash, explicitly pinned as `bulbul:v4-flash`; voice chosen for the output language | Speech synthesis provider for features that require spoken output; existing feature phases still apply |
| LLM access | Vercel AI SDK + Vercel AI Gateway, called only from API/worker services | Common model access, streaming and bounded routing from our Linux deployment |
| LLM model policy | Initial candidates: `google/gemini-3.5-flash-lite` for routine extraction/interpretation and `google/gemini-3.8-flash` for harder cases; qualify per role, escalation ≤ 20%, version approved models/providers/fallbacks | Candidate selection is not a claim of passing Nilumi's multilingual evaluation |
| Retrieval | Typed records + confirmed `ALIAS` + PostgreSQL full-text search using `simple` + `pg_trgm`; complete structured aggregates; pgvector only after a demonstrated semantic-recall gap | Authorized, current records remain the evidence; no initial GraphRAG or separate search/vector database |
| Client synchronization | TanStack Query; refetch after mutations, reconnect, foregrounding and notification open | Server remains authoritative; bounded offline support |
| Offline persistence | Expo SQLite on Android; Dexie/IndexedDB on web | Account-scoped pending drafts and expiring authorized snapshots |
| Push | Direct FCM for Android using native device tokens; standards-based Web Push for the iOS PWA | Backend owns dispatch; device receipt is distinct from provider submission |
| Surfaces | Own small catalogue renderer; model emits view intent / card order only; server issues handles and capabilities; A2UI-style compatibility evaluated, not adopted | P6, cost |
| Logs / tracing | Pino structured logs + OpenTelemetry instrumentation, including AI SDK telemetry with input/output recording disabled | Diagnose latency, failures and cost without routine household-content logging |
| Error / uptime monitoring | Self-hosted GlitchTip + Uptime Kuma; Grafana OTel LGTM for local development diagnostics | Lean starting observability stack |
| Development email | Mailpit | Capture test email without sending it to real recipients |
| Delivery email | Resend API through a backend adapter and application delivery ledger | Account/onboarding/recovery email; durable retries and deduplication beyond provider retention windows |
| Phone OTP / SMS | MSG91 prepaid SMS transport through Better Auth's `sendOTP` callback | Better Auth owns OTP generation and verification; SMS is initially for authentication/recovery |
| Payment provider (deferred) | Razorpay for a future charging review; no payment integration in the current build | Development and the real eight-week pilot are free; no billing UI, SDK, webhooks or subscription enforcement |
| Repository tooling | pnpm workspaces; pinned `@biomejs/biome` and committed `biome.json` when projects are initialized | Shared packages and consistent formatting/linting for supported languages |
| Verification tools | Vitest for backend/domain integration checks; Playwright for web; Maestro and physical-device checks for Android | Exercise API/worker behavior and client journeys |

Device validation and provisional latency targets are in [Device spike](requirements-and-features.md#section-12-1-device) and [SLOs](requirements-and-features.md#section-12-1-slos).

<a id="section-12-2-runtime"></a>

### 12.2 Backend, contracts and durable execution

The API and worker share backend application/domain packages and adapters but run as separate processes. One PostgreSQL database and SeaweedFS are separate services. Drizzle uses the `pg` driver. The clients share presentation components and contracts; assignment transitions, permissions, date interpretation, aggregates, free-pilot feature/usage policy and scheduling rules execute in the backend. There is no payment-dependent feature or reminder state in P1.

**Database privileges:** separate `auth` (Better Auth), `app` (product), `pgboss` (queue) and `private` (restricted helpers). `nilumi_api` and `nilumi_worker` perform product operations under enabled/forced RLS; `nilumi_auth` accesses authentication tables only; `nilumi_queue` polls/supervises queue storage only. The non-login `nilumi_owner` owns objects, and `nilumi_migrator` credentials are release-only. Non-login `nilumi_acl_executor` and `nilumi_lifecycle_executor` own bounded permission and retention/erasure helpers with explicit grants/policies. Runtime roles cannot assume owner/executor roles, bypass RLS, create roles/schemas, truncate tables or change policies. Helper functions revoke public execution, use safe fixed search paths and return only necessary results. The complete [role matrix and contracts](architecture.md#section-11-15) govern implementation; backend-established identity remains the trust boundary.

**Transaction and pooling configuration:** `withHouseholdTx`, `withAccountExitTx` and `withJobTx` derive the applicable identity from backend validation and reload current rights. Use parameterized transaction-local `set_config(..., true)` for account/household/membership/access mode, fail closed on missing context, and pass the same Drizzle transaction into every repository and enqueue call. Use short `READ COMMITTED` transactions, row/revision checks and transaction advisory locks: shared for ordinary household work, exclusive for membership/permission/visibility changes and forgetting, with the required mode acquired initially and consistent lock ordering. Provider/storage calls occur outside transactions; fresh final checks precede answers and dispatch. Start with bounded native `pg` pools, no PgBouncer; budget all API/auth/worker/queue/listener connections and operational headroom.

OpenAPI is generated from the validated route schemas. Schema validation applies to incoming requests, outgoing responses and model proposals. Generate shared `openapi-typescript` types from the document and use `openapi-fetch` beneath TanStack Query domain hooks; generated types do not replace runtime validation. Application routes use `/api/v1`, while Better Auth retains `/api/auth` and its own SDK. Serve the PWA and API through the same HTTPS origin. Keep v1 changes compatible with installed clients, with optional additions and a new API version for breaking changes; CI checks generated-type drift and incompatible contract changes. Pin compatible dependency versions and commit the lockfile when implementation begins. Better Auth's identity result is never sufficient by itself to grant household access.

**API conventions:** application errors follow RFC 9457 Problem Details with stable codes and safe request IDs; missing/inaccessible resources are both 404, and stale versions or idempotency-payload conflicts are 409. Lists use live, viewer/household/filter/order-bound opaque keyset cursors, 20 records by default and at most 100; mandatory counts/aggregates use all authorized matching records. Instants use UTC RFC 3339, dates use `YYYY-MM-DD` with the saved IANA deadline timezone, and monetary amounts use decimal strings plus currency. Replays revalidate current rights; Saved/Scheduled requires backend acknowledgment. The normative status mapping and public contracts are in [§11.14](architecture.md#section-11-14).

**Progress and durability:** Q&A uses fetch-based SSE with typed `progress`, `result` and `error` events, `expo/fetch` on Android, browser fetch on web and `eventsource-parser` framing. Validate event payloads at runtime; show content-free processing states, then the complete answer/view after final rights, revision and citation checks. Leaving/backgrounding cancels unfinished read-only Q&A best effort, disables further retries/escalation and offers explicit retry on return; provider billing may continue. Submitted captures and confirmed work continue independently. Long-running operations return 202 with an opaque operation ID and authenticated status endpoint; foreground polling backs off from two to ten seconds and stops in the background. Application responses use `Cache-Control: no-store`, while explicit bounded offline caches keep their existing isolation/expiry rules. These choices add no infrastructure service.

**Authentication configuration:** use Better Auth's documented Expo integration for native session cookies, persisted with Expo SecureStore; use its cookie accessor to attach the native Cookie header with `credentials: "omit"` when calling Nilumi's protected API. The browser uses Secure/HttpOnly cookies over HTTPS. Sessions remain in PostgreSQL; disable server session-cookie caching so a cached client session cannot bypass current session or membership checks. Configure explicit trusted origins and preserve CSRF/origin validation for cookie-authenticated mutations. Query keys include account, household and permission context, and account changes clear caches. Do not use a stateless session as household authority or store credentials in SQLite, IndexedDB, TanStack content caches or localStorage.

**Recovery decision (founder, 11 October 2026):** personal recovery email stays optional, offered at onboarding and later settings, with verification delivered by Resend. Clearly state that recovery may be unavailable without the registered number or a previously verified email. Skipping does not gate household activation or features. Nilumi's recovery service applies the existing number-change cooling-off and new-number verification, rechecks membership and never substitutes another adult's approval for ownership of a private account. See [A1/A13 and onboarding](requirements-and-features.md#section-10-1), [Better Auth Expo](https://better-auth.com/docs/integrations/expo), [session management](https://better-auth.com/docs/concepts/session-management) and [cookies](https://better-auth.com/docs/concepts/cookies).

pg-boss stores durable job state in its own schema within the application database. Enqueue with `fromDrizzle(tx, sql)` on the same transaction connection as accepted record changes and the notification ledger; separate queue-pool calls cannot provide atomic enqueueing. API producer grants permit enqueueing/required metadata reads, without claiming or queue administration. Commit logical cancellation in the product ledger; handlers suppress obsolete queue entries. Queue execution uses `nilumi_queue`, while handlers use `nilumi_worker` and fresh actor/recipient or account/lifecycle rights. Handlers receive identifiers and revisions and are idempotent because execution is at least once. Job recovery after a process restart is required even in disposable development; it is different from backup/disaster recovery.

Provision queue definitions and schema/grant changes during releases. Runtime instances use `migrate: false`, retain worker supervision/recovery and cannot perform DDL; producer instances do not supervise workers. Begin with shared queue storage, without dynamically created partitions or persisted statistics requiring runtime DDL. Pending migrations or insufficient grants fail readiness. The [runtime architecture](architecture.md#section-11-11) and [database contract](architecture.md#section-11-15) define atomicity, obsolescence and permission checks; per-queue numerical policies remain the later review.

**Exit and retention:** former members have 90-day account-owned read/export/erase rights, with no editing/creation or live household access. Freeze snapshot content/evidence in the exit transaction before membership ends, then serialize the staged bundle through the worker without scanning later live data. Retention/erasure procedures validate database-time expiry/tombstones and target rights and continue after departure; snapshot staging/files/manifests still honor forget/deletion suppression.

Implementation references: [Fastify Zod/OpenAPI integration](https://github.com/fastify/fastify-type-provider-zod), [OpenAPI TypeScript](https://openapi-ts.dev/introduction), [openapi-fetch](https://openapi-ts.dev/openapi-fetch/api), [Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html), [Expo fetch](https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api), [SSE parser](https://github.com/rexxars/eventsource-parser), [Drizzle PostgreSQL drivers](https://orm.drizzle.team/docs/get-started-postgresql), [node-postgres transactions](https://node-postgres.com/features/transactions), [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [pg-boss Drizzle adapter](https://pgboss.io/api/adapters), [pg-boss installation](https://pgboss.io/install), [pg-boss runtime configuration](https://pgboss.io/api/constructor), [pg-boss delivery semantics](https://pgboss.io/introduction).

<a id="section-12-3-deployment"></a>

### 12.3 Development and private-pilot deployment

Use Dokploy's **Docker Compose** deployment mode on a Linux VM. The Compose configuration describes the web companion, API, worker, PostgreSQL, SeaweedFS and selected monitoring services. Dokploy supplies Traefik domain routing and HTTPS. API and worker are separately restartable; named volumes persist PostgreSQL and object-store data across application deployments. Dokploy's own database/cache services, if required by its installation, are infrastructure dependencies rather than Nilumi's application queue or cache.

Keep database, queue and storage administration endpoints on internal networks; expose only the required application routes and bounded S3 transfer routes. Inject only each service's required secrets from deployment configuration. Storage acceptance checks cover presigned uploads/downloads, browser CORS, expiry and deletion; generic S3 compatibility is not a substitute for these checks.

**Fixed infrastructure budget target:** ₹3,000–₹5,000/month for the 20-family pilot, excluding AI usage and SMS. VM capacity and storage/log growth must be measured against that target; this is not a provider quote or a verified capacity promise.

**Pilot AI budget target:** ₹2,000/month for LLM calls plus Sarvam STT across the real 20-family pilot (founder decision, 11 October 2026). Exclude VM/fixed infrastructure, SMS and separate evaluation runs; account for each separately. Qualify models and measure usage against the target before pinning aggregate enforcement/escalation settings. This is a starting spending target, not a promised workload capacity or an automatic hard cutoff.

**Recovery boundary:** backup/disaster recovery is deferred only for disposable development/test data. Before the first real household pilot, backups, restore testing and the no-resurrection check are required under J6 and the retention matrix. Production VM provider, sizing, HA topology and final recovery design will be reviewed later; this document does not choose them.

Deployment references: [Dokploy Docker Compose](https://docs.dokploy.com/docs/core/docker-compose), [Dokploy domains and Traefik](https://docs.dokploy.com/docs/core/docker-compose/domains), [SeaweedFS](https://github.com/seaweedfs/seaweedfs).

<a id="section-12-4-observability"></a>

### 12.4 Observability and operational adapters

Pino and OpenTelemetry record request/job correlation, intent, durations, queue age, attempts, error codes, model/prompt/schema versions, tokens and cost. Redact request bodies, transcripts, prompts, outputs, phone numbers, credentials, cookies and authorization headers; disable AI SDK telemetry input/output recording. Reliability telemetry and consented research analytics remain separate under I14.

GlitchTip is the self-hosted error tracker; Uptime Kuma checks availability and worker heartbeat. A monitor running only on the application VM cannot report that VM's total outage, so independent availability monitoring is required before the real pilot. Local Grafana OTel LGTM is a development diagnostic tool, not the chosen production observability deployment.

Phone OTP, delivery email, push and storage sit behind backend adapters. Development uses isolated OTP/email transports and the same free-pilot feature/usage policy as the real pilot. Android uses direct FCM through Expo native tokens; iOS uses standard Web Push with home-screen installation and user permission. No live integrations are provisioned by this documentation decision.

**SMS:** use MSG91 prepaid SMS as transport, with Better Auth generating and verifying the codes through its phone-number plugin. Do not adopt a second OTP authority or a provider OTP widget. SMS initially covers authentication/recovery, not household reminders or marketing. Apply resend/attempt/send limits in the shared backend, redact codes and phone numbers from telemetry, and distinguish provider submission, reported delivery and successful verification. Qualify the approved route/template on Indian carriers before pilot admission.

**SMS budget (published rates checked 11 October 2026; not an account quote):** MSG91 lists 5,000 India-to-India SMS at ₹0.25 each, ₹1,250 before applicable taxes. Its DLT guidance quotes ₹5,000 plus GST for entity registration; verify the current operator charge, template onboarding, route, credit validity and actual deductions before purchase. Onboarding and prepaid wallet funding are separate from recurring consumption and the fixed infrastructure budget. Development does not send live SMS by default.

**Email:** use Resend for actual delivery and Mailpit locally. Verify the sending domain, authenticate delivery webhooks and handle duplicate/out-of-order events. A PostgreSQL application delivery ledger records the logical message, recipient, attempts and provider reference; pg-boss retries reload it before sending. Resend idempotency keys last 24 hours, so they are insufficient alone for later re-drives. Keep routine email content limited to account/onboarding/recovery needs, without household transcripts. Resend stores account metadata/logs in the US regardless of sending region; record this separately from LLM inference.

**Payments:** record Razorpay as the future provider only. Do not add SDKs, credentials, billing tables, payment webhooks, checkout UI, trial/paywall states or subscription enforcement in this build. Pilot usage budgets are operational controls, not payment entitlements.

Initial application infrastructure does not require Redis, GraphRAG, a graph database, a separate vector/search service, full client database replication or a large AI-observability platform. Add a service only to meet a demonstrated requirement. TTS provider selection does not move elder/spoken-brief features into Phase 1.

Operational references: [GlitchTip installation](https://glitchtip.com/documentation/install/), [Grafana OTel LGTM](https://grafana.com/docs/opentelemetry/docker-lgtm/), [AI SDK telemetry](https://ai-sdk.dev/docs/ai-sdk-core/telemetry), [direct native push delivery](https://docs.expo.dev/push-notifications/sending-notifications-custom/), [Better Auth phone-number plugin](https://better-auth.com/docs/plugins/phone-number), [MSG91 SMS pricing](https://msg91.com/in/pricing/sms), [MSG91 DLT guidance](https://msg91.com/help/dlt-registration-in-india/dlt-faqs), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [Resend regions](https://resend.com/docs/dashboard/domains/regions), [Resend webhooks](https://resend.com/docs/webhooks/introduction).

<a id="section-12-4-ui-ai"></a>

### 12.4.1 UI and LLM configuration

**UI:** centralize tokens and production components in Nilumi's shared UI package. Use Tamagui unstyled primitives, then apply the catalogue recipes rather than the older implemented control geometry. Provide text, button, field, task-tick, card, sheet and feedback components. Preserve contextual colors, solid reading surfaces, bundled fonts, Phosphor icons and authored motion. Implement script-aware Tamil/Latin rendering, system text scaling, focus management, screen-reader semantics, Android Back and reduced motion. Validate representative components on real Android and iPhone Safari/PWA before expanding the UI; add the optional compiler only after correctness and compatibility checks. The reference's extra permission badges and continuous voice examples do not add P1 capabilities. See [client architecture](architecture.md#section-11-13) and [Tamagui](https://tamagui.dev/docs/intro/introduction).

**LLM:** backend configuration is keyed by extraction, query interpretation, grounded answer and view-suggestion role. Version the model ID, approved provider allowlist, fallback order, prompt, output schema, token cap, total timeout/retry budget and cost policy together. Initial candidates are [Gemini 3.5 Flash Lite](https://vercel.com/ai-gateway/models/gemini-3.5-flash-lite) and [Gemini 3.8 Flash](https://vercel.com/ai-gateway/models/gemini-3.8-flash), not production-qualified models. Promote the cheapest candidate that passes each role's existing evaluation and latency gates; a role with no passing candidate remains blocked from real-family release. Bound escalation under the workload envelope and report actual cost. Invalid output, missing evidence or cost/timeout exhaustion produces clarification, abstention or the existing fixed-view fallback, never fabricated evidence.

Use Gateway provider `only` for the explicit vetted allowlist; `order` expresses preference and does not restrict fallback by itself. Configure both approved model and provider fallbacks, with a total retry/time budget across SDK, Gateway and worker attempts. Schema-validate model proposals/outputs; models cannot generate SQL, authorize actions or mutate records. Disable input/output content recording in AI telemetry. [Provider routing](https://vercel.com/docs/ai-gateway/models-and-providers/provider-options), [AI SDK structured outputs](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data).

<a id="section-12-5-review"></a>

### 12.5 Remaining review order

The architecture decisions above are settled for development. The remaining work validates and configures them:

**Settled contracts:** shared API/client generation, errors, live cursor pagination, time/money encoding, Q&A SSE/cancellation and durable-operation status are defined in [§11.14](architecture.md#section-11-14). The `pg` driver, database roles/schema boundaries, transaction-local context/locks, atomic enqueueing, bounded lifecycle helpers and read/export/erase-only exit rights are defined in [§11.15](architecture.md#section-11-15). Session transport and optional recovery email are also settled. Implementation and the release checks remain required; this documentation does not claim passing integrations or a provisioned database.

**Next decision reviews, in order:**

1. **Source provenance and offline clocks:** source-span coordinate units, captured/source-time trust and expiry behavior under device-clock skew.
2. **Worker policies:** per-queue concurrency, retries/backoff, execution timeouts, recovery and re-drive behavior within provider/SLO budgets.
3. **Session/OTP limits and AI enforcement:** explicit session lifetimes/refresh and OTP send/attempt limits; aggregate enforcement/escalation and qualified model limits for the selected ₹2,000/month pilot AI target.
4. **Repository/release and deletion policies:** workspace/CI layout, migration/release compatibility and household deletion grace-period behavior.

**Implementation qualification, alongside those reviews:**

1. **Retrieval evaluation:** Tamil/Tanglish cross-script fixtures, confirmed alias collisions, complete aggregates, temporal conflicts, private/forgotten records and citation revisions. Add pgvector only through the semantic-recall gate.
2. **Data/API/database verification:** atomic action groups, assignment state authority, fixed household-timezone deadlines, revision conflicts, confirmation-first dependent corrections, forget propagation and revocable export downloads; actual runtime-role isolation, missing/reused transaction context, concurrent permissions/data changes, frozen exit snapshots, post-exit erasure/retention and restricted auth/queue startup; generated-type/runtime consistency, pagination/count/error existence safety and exact multilingual/date/money serialization.
3. **Client spike:** catalogue components/accessibility, fonts/icons/themes, Android share/voice integration, cookie transport/revocation/cache isolation, offline replay/conflict UX and real iOS PWA installation/push behavior; split SSE events, Q&A cancellation and durable operations through navigation/restarts.
4. **AI qualification:** compare the selected candidates per role; pin passing configuration, prompt/schema versions, approved routing and measured timeout/token/cost limits. Verify Sarvam script/voice settings and application regressions; no new speech-provider bake-off.
5. **Pilot operations:** MSG91 DLT/template/route readiness and carrier tests, Resend domain/webhooks and retry deduplication, alerts/support workflow, backup/restore and deletion suppression. Payments remain deferred.

Production hosting topology, capacity, recovery objectives and the final India-only processor configuration are a later production-readiness review.

---

<a id="section-13"></a>

## 13. Processor constraints

<a id="section-13-1-processors"></a>

### 13.1 Processor / data-flow register

| Processor / flow | Selected path | Boundary and remaining verification |
|---|---|---|
| Speech-to-text | Direct Sarvam API, `saaras:v4` | Selected India-hosted speech path; record the endpoint/account terms, retention, training settings and batch deletion behavior |
| Text-to-speech | Direct Sarvam API, `bulbul:v4-flash` | Selected India-hosted speech path; record endpoint/account terms and output retention when the consuming feature ships |
| LLM inference | AI SDK → Vercel AI Gateway → approved model/provider | Outside-India processing allowed in development and the private pilot; record actual providers, regions, retention/training controls and fallbacks |
| Database / jobs / application | Our Linux VM, PostgreSQL, Fastify API and pg-boss worker | Actual VM provider/location entered at deployment; no implied managed-database region |
| Files / snapshots / exports | SeaweedFS S3-compatible storage on our deployment | Record volume location, access policy and deletion behavior; backup destinations entered before real pilot use |
| Notifications | FCM / standards-based Web Push | Generic preview, opaque identifiers; register push processors and metadata flows separately from content inference |
| Errors / telemetry | Self-hosted GlitchTip, Pino and OpenTelemetry | Content-free reliability data; location follows the actual deployment, including any diagnostic collector |
| Phone OTP / SMS | Better Auth → MSG91 prepaid SMS transport | Phone number and code go to the approved route; register endpoint, identity metadata/log retention and subprocessors before live use |
| Delivery email | Resend API; Mailpit only in local development | Recipient/account metadata and account email content; sending region recorded at setup, account metadata/logs stored in US regardless of sending region; verify applicable retention/subprocessors |
| Payments (deferred) | Razorpay selected for a future charging review; no active flow | No payment metadata processed by Nilumi in the current free-pilot build; register the actual flow when charging is separately admitted |

For every processor, maintain endpoint region, retention, training settings, subprocessors and fallback policy. Sarvam is selected based on the founder's evaluation; its current documentation identifies [Saaras v4](https://docs.sarvam.ai/api/getting-started/models/saaras) and [Bulbul v4 Flash](https://docs.sarvam.ai/api/getting-started/models/bulbul). Sarvam publishes India-processing statements for [STT](https://www.sarvam.ai/speech-to-text) and [TTS](https://www.sarvam.ai/text-to-speech); the register still needs the applicable service/account terms. Selection does not establish that every downstream AI flow stays in India.

**Preproduction exception (founder decision, 11 October 2026):** development and the private pilot may send household content to Vercel AI Gateway and approved model providers outside India, with the applicable notices and consent. AI SDK/Gateway can be called from [our own infrastructure](https://vercel.com/docs/ai-gateway). Gateway's current [regional inference controls](https://vercel.com/docs/ai-gateway/security-and-compliance/regional-inference) document US/EU regions and do not pin all gateway processing to an inference region; they do not establish an India-only path.

`processing_boundary = india_only` continues to fail closed: disable incompatible routes and non-India fallbacks, retry a compliant path or offer typed capture. Do not mark a household/deployment `india_only` while its content still uses the preproduction Gateway route. The India-only production target and final provider configuration must be revisited and verified before production; the preproduction exception does not automatically carry forward. There is no automatic cross-provider STT fallback in the selected speech path.

Retention, privacy and export contracts are in [Architecture](architecture.md#section-13-1); stage-gated legal requirements are in the [compliance checklist](requirements-and-features.md#section-13-2).
