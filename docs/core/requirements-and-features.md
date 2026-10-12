# Nilumi — Requirements and Features

**Version:** 2.4 · **Date:** 11 October 2026 · **Status:** Baseline for Phase 1 build and pilot; agreed stack recorded in companion docs.

[Product plan and vision](product-plan.md) · [Requirements and features](requirements-and-features.md) · [Architecture](architecture.md) · [Tech stack](tech-stack.md)

These four documents collectively form the Nilumi v2.4 baseline and supersede all earlier versions and notes. Original section numbers are retained for traceability.

The authoritative feature catalogue, Phase 1 user journeys, product policies, non-functional requirements and release criteria. Technical contracts are specified in [Architecture](architecture.md); product strategy, phase gates and pilot measures are in the [product plan](product-plan.md).

---

<a id="section-9"></a>

## 9. Acceptance demonstrations

<a id="section-9-2"></a>

### 9.2 Signature demonstrations as acceptance journeys

| Demo | Journey (see [§11.3](requirements-and-features.md#section-11-3)) | Fully passes in | Tests |
|---|---|---|---|
| **A — The house remembers a real-world event** | UJ4 → P2 passport/timeline recall | Capture, attribution, proposal **P1**; asset timeline, cost card, long-horizon recall **P2 wave B** | DF1 DF2 DF3 DF5 DF6 |
| **B — One spouse delegates without becoming a manager** | UJ3 | **P1** | DF1 DF4 DF6 X11 |
| **C — Questions create a useful, changing UI** | UJ5 / UJ6 → P2 vehicle change journal with derived follow-ups | View selection and grounded answer **P1**; journal, derived follow-ups, invoice gaps **P2 wave C** | DF1 DF2 DF3 DF5 X7 |
| **D — Shared space respects private information** | UJ9 privacy model (phone) → P3 speaker handoff and caregiver capsule | Privacy model **P1**; speaker and capsule **P3** | DF1 DF2 X1 X2 |

---

<a id="section-10"></a>

## 10. Feature requirements catalogue (final product, phase-tagged)

Tags: **P1** = must ship for the pilot · **P2 / P3 / P4** = later phases · **Never** = out of scope. **Test** = admission criteria met ([§5.3](product-plan.md#section-5-3)) or *infra*. **Source** = flagship differentiator (**DF1–DF6**) or exploration item (**X1–X12**), both defined in [§5.2](product-plan.md#section-5-2). The catalogue is the authoritative requirement list; [§11](requirements-and-features.md#section-11)–[§15](product-plan.md#section-15) reference it rather than restating it.

<a id="section-10-1"></a>

### 10.1 Identity, household, consent, recovery

| ID | Feature | Phase | Test | Notes |
|---|---|---|---|---|
| A1 | Adult sign-in (phone OTP; Google optional); authenticated principal ↔ member mapping; optional verified **personal email recovery factor** offered at onboarding and settings | P1 | infra | Skipping email is allowed; clearly disclose that recovery may be unavailable without the registered number or a previously verified email. Phone hash is identity data, not authority |
| A2 | Create household; single-use, 7-day, revocable invitations; membership states (`invited`, `active`, `left`, `revoked`); invitation attempts to a declining number capped (1 per 30 days) | P1 | infra | Pilot: exactly 2 active adults; up to 6 in P2 |
| A3 | Roles: **Admin**, **Adult**, **Child profile** (no principal), **Reference person** (no principal; e.g., elder, cook — may be a fact subject, never an owner), **Elder** (P3), **Caregiver-limited** (P3) | P1 core | infra | Access matrix [§11.4](architecture.md#section-11-4) |
| A4 | Purpose-specific consent records per adult, incl. AI-processing disclosure; separate consent for optional channels and for **optional research analytics** | P1 | infra | — |
| A5 | Member profile: structured default-duty mapping per category; availability tags; language and script preference; notification/quiet/digest preferences | P1 | infra | — |
| A6 | Leave / revoke with immediate effect on live access (sessions, cached actions, capabilities, queued deliveries); **account-owned exit rights** (A12) | P1 | infra | — |
| A7 | Export (versioned JSON + Markdown) through authenticated, revocable downloads and delete (7-day grace) per retention matrix; admin export excludes others' `self` records; any adult may export the shared context they can read | P1 | infra | Manifest/deletion/access checked per download; [§13.1](architecture.md#section-13-1) |
| A8 | Additional adults (3–6) with pooled-claim semantics; caregiver; multi-household | P2 / P3 | 3 | — |
| A9 | Household "constitution" card | P2 | 1,3 | — |
| A10 | Child-data pathway: guardian link, consent record, minimisation (nickname, class), withdrawal, adulthood transition, no behaviour inference; verification mechanics per final Rules | P1 core → P2 mechanics | infra | [§13.2](requirements-and-features.md#section-13-2) |
| A11 | **Caregiver handover capsule** (X2): time-bound, revocable grant of selected care records/tasks; audit; current-vs-stale; disclosed that downloaded copies cannot be recalled | P3 | 3,4,6 | — |
| A12 | **Exit and separation rights:** after membership ends (left or revoked) the person keeps, via their *account* for 90 days, read/export/erase of their own `self` records and a read-only **exit snapshot** of `household` records as they stood at exit; no edits, new records or live household access. A sole admin may leave by designating a successor; if the other adult declines within 7 days the household is **suspended** (no new captures/reminders), both receive exit snapshots, and it is deleted after 30 days unless someone accepts admin | P1 | infra | Freeze snapshot content/evidence in the exit transaction before live access ends; background serialization and post-exit retention do not restore membership; forget/deletion suppression still applies. [Database contract](architecture.md#section-11-15) |
| A13 | **Account recovery:** OTP to registered number; number change via old-number OTP or a previously verified personal email factor + 48 h cooling-off, with verification of the new number and a content-free "recovery occurred" notice to the other adult; re-authentication for destructive actions; recovery restores the account only, never another member's private access or revoked membership; sole-admin inactivity ≥ 14 days lets the other adult request admin under the A12 suspension rules | P1 | infra | Email is optional; a newly supplied unverified email or another adult's approval is not proof of account ownership. Disclose that recovery may be unavailable when the registered number and any previously verified email are inaccessible |

<a id="section-10-2"></a>

### 10.2 Capture

| ID | Feature | Phase | Test | Notes |
|---|---|---|---|---|
| B1 | In-app text: English, Tamil script, Romanised Tamil (Tanglish); **display script follows the member's preference** | P1 | 1,5 | — |
| B2 | Push-to-talk voice (English / Tamil / Tanglish) with **editable transcript**; ≤ 30 s synchronous, 30 s–2 min batch path with a "processing" state, > 2 min rejected with guidance | P1 | 1,5 | **Selected:** Sarvam `saaras:v4`, following founder evaluation; application accuracy/latency gates still apply ([§12.1](tech-stack.md#section-12-1-stack)) |
| B3 | **Android share-sheet** for text and WhatsApp voice notes — device-tested (X12); first-run sharing walkthrough | P1 | 1,5 | Tap count provisional |
| B4 | Paste capture | P1 | 1 | — |
| B5 | Widget / lock-screen quick capture | P2 | 1,5 | — |
| B6 | Telegram bot | P2-opt | 5 | — |
| B7 | **Multimodal "capture once"** (X3): receipt/warranty photo → one reviewable service fact with image-region provenance and masking | P2 wave B | 1,2,6 | No image input in P1 |
| B8 | **Hindi / Hinglish** capture (then Telugu, Kannada, Malayalam per demand) | P2 wave A | 5 | — |
| B9 | Email forwarding | P3 | 1 | — |
| B10 | Calendar import (read-only) | P3 | 1 | — |
| B11 | Elder voice mode (large UI, spoken Tamil brief) | P3 | 5 | — |
| B12 | iOS native | P3 | 5 | P1–P2: responsive web/PWA; iOS web actions are tap-to-open |
| B13 | WhatsApp inbound bot / joining family groups / unofficial automation | **Never** | — | Re-evaluate quarterly |
| B14 | **Room speaker ↔ authenticated phone handoff** (X1) | P3+ | 3,5,6 | Separately validated device/runtime |
| B15 | **Offline mode (bounded):** local drafts and visibly pending actions; no Saved/Scheduled receipt before server acknowledgement; stale-read banner with cache age; cache expiry 24 h; account-scoped cache; reconnect conflicts resolved by revision with a visible receipt; expired actions rejected; revocation blocks future server access immediately but **cannot erase downloaded copies instantly** (disclosed) | P1 | infra | — |

<a id="section-10-3"></a>

### 10.3 Understanding (intent → structure → view)

| ID | Feature | Phase | Test | Source |
|---|---|---|---|---|
| C1 | Multi-action extraction into **Item**, **Commitment**, **Fact**, **Event** via the mutation contract ([§11.6](architecture.md#section-11-6)) | P1 | 1,5 | DF4 |
| C2 | Confidence-gated **confirm card**; **one necessary question at a time** (≤ 3 options) with a persisted pending-intent (identity, remaining fields, 24 h expiry) that **resumes with revalidation**; undo | P1 | 1,5 | DF2 |
| C3 | Temporal resolver ([§11.7](requirements-and-features.md#section-11-7)): Asia/Kolkata, day-first, **clause-level** reporting-time / occurred-time / due-time resolution, time-of-day **windows** as confirmed product defaults, source-date anchoring, past-due handling, calendar-month intervals | P1 | 1 | DF4 |
| C4 | Owner ladder: explicit active adult (via confirmed alias) → structured default-duty → **clarify**. Reference persons, children, "us", unknown names and ex-members never become owners. Fact-based inference → P2 with one-time confirmation | P1 / P2 | 3,4 | DF4 |
| C5 | Idempotency: client capture ID + action IDs + server uniqueness; semantic duplicate *suggestions* | P1 | 4 | — |
| C6 | Unknown types → **proposed facts** | P1 | 2 | — |
| C7 | Recurrence (series/occurrence identity, exceptions, edit-one/future, month-end, stop); **P1 receipt offers a confirmed one-off** | P2 wave A | 1,2 | — |
| C8 | Collections | P2 wave C | 1 | — |
| C9 | **Alias contract** ([§11.5](architecture.md#section-11-5)): confirmed household nicknames; reference persons vs assignable adults; requester-relative kinship ("en husband"); collision clarification; original spelling preserved; phonetic resemblance never authorises assignment or merge; alias visibility inherits its source | P1 (people) / P2 (assets) | 2,6 | X4 |
| C10 | Regional-input normalisation with original text preserved | P1 (Tamil) / P2 | 5 | X4 |
| C11 | Event–Commitment linkage | P1 | 4 | DF4 |
| C12 | **View-intent selection** from the trusted catalogue; never manufactures handles, actions, URLs or code | P1 | 5,6 | DF1 |
| C13 | **Answerability** (full / partial / unknown within authorised recorded evidence) and a bounded query grammar (subject, type, date range, status, simple sum/count/latest) | P1 (simple) / P2 (multi-hop) | 2,5 | DF2 |
| C14 | **Conversational reference** ("adhu mudinjiduchu") binds only to the record last acted on in the current authenticated session on this device within 10 min; otherwise the target is shown and confirmed | P1 | 5 | DF1 |

<a id="section-10-4"></a>

### 10.4 Shared, correctable household memory

| ID | Feature | Phase | Test | Source |
|---|---|---|---|---|
| D1 | Records with **action-scoped provenance**; mixed captures stay creator-private unless shared | P1 | 2,3 | DF5 |
| D2 | Visibility: `household` (default), `self`; authorised-recipient lists for later roles | P1 | 3 | — |
| D3 | **Grounded search/ask** with claim-level citations; no existence leaks; conflicting P1 facts shown as both attributed values | P1 | 2,3,5 | DF2 |
| D4 | Lifecycle ops ([§11.8](architecture.md#section-11-8)): correct, reschedule, propose, reassign, cancel, undo/reopen, snooze-vs-reschedule — attributed, revision-checked, propagating | P1 | 4 | DF5 |
| D5 | Audit log inheriting record visibility | P1 | 3 | — |
| D6 | Semantic recall (pgvector) | P2 | 2 | Only if authorized structured/alias/FTS + `pg_trgm` retrieval fails the evaluation; no separate vector service required |
| D7 | People & vendors directory | P2 wave B | 2 | DF3 |
| D8 | Document vault; health docs behind authorised-recipient consent | P3 | 2,3 | — |
| D9 | Memory review with forget | P1 (per-record) / P2 (surface) | 2 | DF5 |
| D10 | Nightly consolidation | P2 | 2 | — |
| D11 | **Grounded answer contract** ([§11.10](architecture.md#section-11-10)): claims each with evidence refs; answerability; `missing_context`; suggested view; one follow-up that **never contacts anyone or creates work without confirmation** | P1 | 2,5 | DF2 |
| D12 | **Dynamic suggested questions** — P2, **one selected asset only**; each with question type, evidence basis and answerability label; revalidated on tap and permission change; bounded panel, never a stream | P2 wave C | 2,5 | DF2 |
| D13 | **Contradiction inbox** | P2 wave C | 2,3 | DF5 |
| D14 | **Correction vs change**: `supersede_reason ∈ {correction, change}`; **confirmed on the card when ambiguous** (dates, providers), never derived from the verb alone; corrections retract (visible only in "why?" as *retracted*), changes retain history | P1 | 2 | DF5 |
| D15 | **"Why do you think…?"** evidence view | P1 | 2,5 | DF5 |
| D16 | **Forget propagation** with shared-source dependency rules ([§13.1](architecture.md#section-13-1)) | P1 | 2,3 | DF5 |
| D17 | Temporal fields: immutable `learned_at`; `occurred_at` + `occurred_precision ∈ {exact, day, month, year, unknown}`; fact `effective_from/to`; stable record identity/revision history and dependency edges binding exact source revisions/spans | P1 | 2 | DF3; dependent task changes proposed for confirmation first |

<a id="section-10-5"></a>

### 10.5 Delegation, routing and notifications (the core)

| ID | Feature | Phase | Test | Source |
|---|---|---|---|---|
| E1 | Handoff lifecycle per the **transition table** ([§11.8](architecture.md#section-11-8)): accept / decline / propose another time / ask / done from the push; Done-on-first-push = explicit accept-and-complete | P1 | 3,4 | DF4 |
| E2 | Reminders by **recipient** preferences and quiet hours (creator cannot override) | P1 | 3 | DF4 |
| E3 | **Deadline alert to originator** — opt-in, informational, once | P1 | 3 | DF4 |
| E4 | **Daily personal pulse** (time per member; default 07:00): up to 3 items needing *my* response + up to 2 household items; every item sourced; repeat-suppressed | P1 | 1,3,5 | DF6 |
| E5 | **Weekly reset** (opt-in; default Sun 18:00): a **deterministic review of existing recorded obligations** — unresolved, upcoming 7 days, open shopping — each resolvable with existing actions; "conflicts" are limited to overlapping *recorded* commitments; no inferred planning | P1 | 1,4,5 | DF6 |
| E6 | Two state machines (transport vs responsibility) | P1 | 4 | X11 |
| E7 | Deterministic scheduler: transactional outbox; `dedupe_key = assignment_id:version:kind:slot`; deadline-aware retry/TTL; stale-job cancellation; rights re-check at dispatch and execution; volume caps | P1 | 4 | X11 |
| E8 | WhatsApp outbound utility templates — **policy-conditional; full gate list in [§15.1](product-plan.md#section-15-1)** | P2 | 5 | — |
| E9 | Recurring reminders | P2 wave A | 1 | — |
| E10 | "Who's home" routing | P2 wave A | 3 | — |
| E11 | Low-noise shared-item notices | P2 | 3 | — |
| E12 | SMS/RCS critical fallback | P3 | 5 | Not emergency-grade |
| E13 | **Needs my response + Due now** views ([§11.10](architecture.md#section-11-10)) — complete, fresh, DB-computed; work with notifications disabled; last-sync and pending indicators | P1 | 4 | X11 |
| E14 | Notification permission status, token health, per-recipient preview richness, device removal | P1 | infra | — |
| E15 | **Trust receipts** with *not applicable* (facts), *delivery unknown* (no device confirmation) and *pending (offline)* states; "Did you remind him?" answers each state separately | P1 | 4,5 | X11 |
| E16 | **Status query** — side-effect-free `status_read` (no push, badge or auto-nudge); logged for the effort guardrail | P1 | 3,4 | DF4 |
| E17 | Changes since last check | P2 wave C | 1,5 | DF6 |
| E18 | Interval-based suggestions from a recorded interval, labelled estimate, proposal only | P2 wave B | 1,2 | DF6 / X8 |
| E19 | Quiet modes (digest-only) | P1 | 3 | DF6 |
| E20 | **Anti-harassment controls:** recipient can pause inbound handoffs from a member (originator sees "paused", no reason), mute a task, report content (reported member not notified); caps: ≤ 10 open handoffs per recipient from one originator, ≤ 3 reassignments per task; no automatic mediation or third-adult escalation | P1 | infra | — |

<a id="section-10-6"></a>

### 10.6 Surfaces — trusted generative UI (founder decision FD-1: Phase 1)

| ID | Feature | Phase | Test | Source |
|---|---|---|---|---|
| F1 | **Model-ordered home feed** below the deterministic mandatory panels ([§11.10](architecture.md#section-11-10)): validated card names, bindings and actions; fixed-precedence fallback; per-viewer cache keyed by permission version + revisions; regeneration debounced ≥ 10 min, ≤ 4/day/viewer; data refreshed immediately on change even when layout is not regenerated | P1 | 5,6 | DF1 |
| F2 | Card set v1: mandatory panels `NeedsMyResponse` (incl. `Confirm` items), `DueNow`; optional cards `Today`, `SomeoneNeedsTo`, `Shopping`, `Upcoming`, `PeopleAndPreferences` (feed or search) | P1 | 5 | — |
| F3 | Stable shell: capture bar, search/ask, settings, flag-this-answer; member switcher is a view filter | P1 | 5 | — |
| F4 | **Three result views**: `answer-card`, `grouped-list` (board; by owner/day/category), `timeline` — source chips, "known records" banner, server-issued capabilities only | P1 | 5,6 | DF1 |
| F5 | `clarify-form` (one necessary question, ≤ 3 options, resumes intent) | P1 | 5 | DF2 |
| F6 | **Two pre-registered experiments** ([§11.10](architecture.md#section-11-10)): household-randomised feed arms; paired counterbalanced view-vs-text tasks; directional, not statistical | P1 | 6 | DF1 |
| F7 | Web companion (responsive; iOS Home-Screen web push; tap-to-open actions) | P1 | 5 | — |
| F8 | Card set v2 and views (`AssetPassport`, `FeesAndDeadlines`, `HelpAndVendors`, `ElderCare`, `Collection`; `comparison-table`, `category-breakdown`, `assignment-proposal`) | P2 | 5,6 | DF1 / DF3 |
| F9 | Spoken brief / elder surface | P3 | 5 | — |
| F10 | **Accessibility baseline (P1):** Tamil glyph shaping and mixed-script names; font scaling without clipped actions; labelled controls; screen-reader order and focus retention when the feed re-orders; ≥ 44 px targets; contrast; reduced motion; readable dates/currency; UI language vs input/answer language declared | P1 | infra | — |

<a id="section-10-7"></a>

### 10.7 India-specific workflows

| ID | Feature | Phase | Test | Notes |
|---|---|---|---|---|
| G1 | School & tuition — generic capture P1; structured P2 wave A | P1 / P2 | 1,4 | — |
| G2 | Domestic-help coordination | P2 wave A | 1,3 | No payroll/attendance/payments |
| G3 | Elder logistics (check-ups, refill *pickups*) — **admitted only with its own consent/visibility rules for sensitive logistics**, independent of the P3 vault | P2 wave B | 1,3 | No dosing/adherence/medical advice |
| G4 | Vendors & dues | P2 wave B | 1,2 | — |
| G5 | Festival collections (Deepavali, Pongal, Navaratri) | P2 wave C | 1 | — |
| G6 | Quick-commerce hand-off → deep links P3 | P2 / P3 | 1 | Copy of the shopping card available in P1 |
| G7 | Society notices → tasks | P2 wave A | 1 | — |
| G8 | Tiffin/meal coordination via facts | P1 / P2 | 1,3 | Not recipes |
| G9 | **Service-event seed** ([§11.5](architecture.md#section-11-5)): service event with canonical cost, provisional subject key, attributed **non-medical** recommendation with interval value/unit/anchor, *proposed* follow-up labelled estimate | P1 | 1,2,4 | Demo A seed |
| G10 | Household decision assistant (X5) — one weekend comparison from recorded shared availability | P3 | 3,5 | — |
| G11 | Preparation generator (X6) — one editable checklist from a user-selected template and confirmed facts | P3 | 1,5 | — |
| G12 | Transitions (X10) — one grounded transition workspace first; "emergency prep" never implies monitoring | P3 | 1,6 | — |

<a id="section-10-8"></a>

### 10.8 Home Assets and the household knowledge graph (DF3) — Phase 2, waves

| ID | Feature | Wave | Test | Notes |
|---|---|---|---|---|
| N1 | **Asset entity** (kind, label, aliases, location, purchase, invoice/warranty refs, warranty end, providers); migrated from P1 `subject_key` **with user confirmation, without retyping** | B | 2,6 | Typed entity-relation model |
| N2 | **Service/repair events** linked to assets (from P1 `EVENT.kind=service`) | B | 2 | — |
| N3 | **Passport card + timeline** for **one asset workflow first** (purifier/AC class) | B | 2,5 | — |
| N4 | Cross-record questions (multi-hop) | C | 2,5,6 | — |
| N5 | Change journal / time travel (X7) with redaction after forget/unshare | C | 2,5 | — |
| N6 | Maintenance intelligence (X8): recorded last date + recorded interval, labelled estimate | B | 1,2 | — |
| N7 | Aliases, merges (reversible), contradictions, source-specific visibility for assets | C | 2,3 | — |
| N8 | Recorded costs on service events; totals labelled "recorded"; gap prompts; **no budgeting, ledger, bank linking or equipment-health inference** | B | 2 | — |

<a id="section-10-9"></a>

### 10.9 Commerce and billing

**Deferred:** development and the real eight-week pilot are free. H1–H5 are future commercial scope requiring a separate charging review; none adds SDKs, billing tables, credentials, checkout UI, payment webhooks or subscription enforcement to the current build. Razorpay is the future provider choice. The current feature/usage policy is in [§16.2](requirements-and-features.md#section-16-2).

| ID | Feature | Phase | Notes |
|---|---|---|---|
| H1 | Future household subscription through Razorpay; price, entitlement, cancellation/refund and non-payment behavior separately reviewed | Deferred (earliest P2) | Prior pricing scenarios are hypotheses only; [§16.1](product-plan.md#section-16-1) |
| H2 | Trial/paywall policy, if charging is admitted | Deferred (earliest P2) | No current trial or paywall |
| H3 | Annual billing/pricing, if charging is admitted | Deferred (earliest P2) | Recompute contribution with measured costs |
| H4 | UPI AutoPay with grace/retry; refunds; involuntary-churn diagnostics | Deferred (earliest P2) | — |
| H5 | Store billing/checkout where policy requires for a separately admitted paid distribution | Deferred (earliest P2) | P1 device spike concerns free-app distribution only |
| H6 | Referral credits (counted in CAC) | P3 | — |
| H7 | B2B2C sponsorship | P3 | — |
| H8 | Global English option | P3 | — |
| H9 | Ads, affiliates, data monetisation | **Never** | — |

<a id="section-10-10"></a>

### 10.10 Trust, privacy, safety

| ID | Feature | Phase | Notes |
|---|---|---|---|
| I1 | **Access matrix** ([§11.4](architecture.md#section-11-4)) via RLS + write checks + tenant-scoped FKs; worker re-checks | P1 | — |
| I2 | **Processor / data-flow register**; Sarvam selected for India-hosted speech; outside-India LLM processing permitted in development/private pilot with applicable notice/consent; no incompatible routing or silent failover under `india_only` | P1 | [Processing boundaries](tech-stack.md#section-13-1-processors); production target reviewed before production |
| I3 | Raw audio deleted on confirmed transcription; 24 h hard expiry; no vendor training where substantiated | P1 | — |
| I4 | Export/delete per retention matrix; versioned export contract | P1 | — |
| I5 | Child profiles: no principal, minimisation, guardian link, consent record | P1 | — |
| I6 | **Health/sensitive content refused at capture in P1** (receipt shown; refusal is best-effort — automated detection cannot guarantee no sensitive input reaches transcription, which is disclosed); recommendations stored as attributed facts are **non-medical service recommendations only**; P2 elder logistics needs its own consent/visibility rules; P3 authorised-recipient health flow | P1 / P2 / P3 | — |
| I7 | Generic lock-screen preview; per-recipient rich-preview opt-in; opaque action IDs | P1 | — |
| I8 | DPDP readiness per **stage-gated** compliance checklist ([§13.2](requirements-and-features.md#section-13-2)); breach runbook | P1 start | — |
| I9 | No fairness scores / covert monitoring / automatic third-party escalation | P1 rule | — |
| I10 | Forwarded/imported text is **data** | P1 | — |
| I11 | Security basics; revoked-session and revoked-capability tests | P1 | — |
| I12 | **View/answer safety**: bindings resolved server-side under the requester's authorisation; missing and forbidden are **indistinguishable** to the client; private existence/counts/labels/order never leak | P1 | — |
| I13 | **AI-output reporting (Play):** "flag this answer/view" on every generated answer and view; triage within 72 h; safety testing documented before any applicable Play-distributed build; policy applicability reconfirmed at distribution review | P1 | — |
| I14 | **Analytics consent:** necessary reliability telemetry (no content) separated from **optional research analytics** (A/B arm, chase-checks, roles, completion timings) with its own consent, fields, retention and withdrawal that does not disable coordination; no automatic raw transcript upload to support | P1 | — |

<a id="section-10-11"></a>

### 10.11 Operations, quality, cost, service

| ID | Feature | Phase | Notes |
|---|---|---|---|
| J1 | **Eval protocol** ([§12.2](requirements-and-features.md#section-12-2)): extraction (pre- and post-correction), Q&A grounding, view-intent safety, Tanglish speech | P1 | — |
| J2 | Model/provider/prompt/schema/catalogue version pinning; backend AI role configuration; AI SDK + Vercel AI Gateway; direct selected Sarvam speech APIs | P1 | Initial Gemini candidates qualified per role; vetted provider allowlist, bounded fallback/retry/time/token policy |
| J3 | Per-family variable-provider cost telemetry; **single alarm at > ₹120/month**; per-intent p50/p95 latency and tokens | P1 | Fixed infrastructure and one-time SMS onboarding reported separately |
| J4 | Founder intervention log; weekly support-hours metric; absolute cap ([§18.1](product-plan.md#section-18-1)) | P1 | — |
| J5 | Pilot instrumentation per [§14.1](product-plan.md#section-14-1) | P1 | — |
| J6 | Incident/status process; backup + restore test (no resurrection) **before real household pilot data**; backup/disaster recovery may be omitted only for disposable development/test data | P1 | Durable worker restart recovery is required independently of backups |
| J7 | Self-service help | P2 | — |
| J8 | Cost controls: small-model routing, budgeted regeneration, per-family budgets with budget-limit UX | P1 | — |
| J9 | **Real-device spike** with the full checklist ([§12.1](requirements-and-features.md#section-12-1-device)) | P1 (days 1–21) | — |
| J10 | Provisional SLOs with percentiles | P1 | — |
| J11 | **Pilot service terms:** free eight-week pilot; supported devices/channels; non-emergency use; support window (evenings/weekends) and honest response target (next support window); incident/status route; what works during outages and usage limits; exit/export-notice policy; internal SLOs are not an SLA | P1 | — |
| J12 | MSG91 prepaid SMS for authentication/recovery through Better Auth; Resend for account email; Mailpit and isolated OTP locally | P1 | OTP controls/carrier qualification; email application ledger, signed delivery webhooks and redacted telemetry; no active payments |
| J13 | Nilumi-owned UI components over Tamagui unstyled primitives, adopting Pastel Rooms catalogue recipes | P1 | [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md); native/web accessibility and representative real-device spike |
| J14 | Shared versioned REST/OpenAPI client and validated Q&A progress; compatible installed clients, safe errors/pagination and exact date/money wire values | P1 | [API contract](architecture.md#section-11-14); cancel abandoned read-only Q&A best effort, preserve submitted captures/confirmed work, validate both clients before admission |
| J15 | Database-role/schema isolation; enabled/forced RLS; transaction-local identity; atomic domain/job writes; bounded post-exit lifecycle procedures | P1 | Drizzle with `pg`; actual restricted-role and pooled-connection tests; frozen exit-time snapshots; [database contract](architecture.md#section-11-15) |

<a id="section-10-12"></a>

### 10.12 Integrations, platform, exploratory

| ID | Feature | Phase |
|---|---|---|
| K1 | Google/Apple calendar two-way sync | P3 |
| K2 | Quick-commerce deep links / cart APIs | P3 |
| K3–K5 | Society-app, school and pharmacy partners | P3 |
| K6 | Small consented partner-integration experiment | P3 |
| L1–L2 | Household-context API, partner SDK, governance | P4 |
| X9 | **Respectful load-sharing insights** — *exploratory only, outside the roadmap*; even couple consent does not make incomplete logs a fairness measure | Exploratory |

<a id="section-10-13"></a>

### 10.13 Explicit non-goals

Hardware hub · humans-in-the-loop concierge · payroll/payments/marketplace · medication dosing/adherence · personal finance/budgeting/bank linking · meal planning/recipes · general chatbot features · gamified chores/fairness scores · WhatsApp inbound/group bot · ads/affiliates · emergency or safety-critical reminders · "always listening" · multi-household data sharing without per-record consent · auto-inventing relationships or requirements from missing records · automatic mediation of household conflict.

---

<a id="section-11"></a>

## 11. Phase 1 — MVP "Household Handoff + Trusted Views" (specification)


<a id="section-11-0"></a>

### 11.0 Adoption-record index (Phase 1 flagships)

| Flagship | User job | Demo journey | Baseline comparator (pilot task) | Smallest slice | Privacy/consent | Trust | Evaluation | Gate (expand / hold / abandon) |
|---|---|---|---|---|---|---|---|---|
| **DF4 Two-sided delegation** | Stop the coordinator chasing | UJ3 | Same handoff via the family's WhatsApp chat + phone reminder: time to set up, chases, completion | One owner, accept/decline/propose/ask/done, recipient-preference reminders | Owner-only actions; opt-in originator alert; pause/mute/report | Transition table; receipts; status_read side-effect-free | [§14.1](product-plan.md#section-14-1) primary metric; chases; effort vs baseline | Expand on ≥ 10/20; hold 6–9; abandon ≤ 5 |
| **DF1 Trusted views + ordered feed** | Answer/act without navigating | UJ5 | Same question answered as plain text; same feed in fixed order | 3 result views + ordered optional cards below deterministic mandatory panels | Server-issued handles/capabilities; existence safety | Fallback; zero unauthorised bindings | [§11.10](architecture.md#section-11-10) gates; two experiments | Views stay (FD-1); ordering reverts on its own rule |
| **DF2 Grounded answers + clarification** | Trust what the house "knows" | UJ6 | Scrolling the family chat / asking the spouse | Claim-level citations; answerability; one necessary question at a time | Private existence never alters answers | Abstention; conflicts shown | Q&A set ([§12.2](requirements-and-features.md#section-12-2)) | Hold suggestions (P2) until answers pass |
| **DF5-thin Correctable memory** | Fix the house's memory without losing history | UJ7 | Editing a note/ list manually | Correction vs change (confirmed when ambiguous); why?; forget | Visibility inherits on supersession | Retracted assertions only in why? | Correction/change fixtures | Expand inbox/merges in P2 wave C |
| **DF6-thin Pulse + reset** | Know what needs me without checking | UJ8 | Checking the chat/list each morning | Deterministic pulse; deterministic weekly review of existing obligations | Only `household` records in shared lines | Repeat suppression; quiet modes | Useful-action rate; mute rate | Add deltas/intervals in P2 only if used unprompted |
| **X11 Receipts** | Know what actually happened | UJ3 | "Did you get my message?" | Heard→…→Done with N/A, unknown, pending states | Opaque action IDs | Never "done" before commit | Receipt accuracy audit | Foundational; no abandon |

<a id="section-11-1"></a>

### 11.1 Objective and scope

Prove, with a free eight-week pilot of 20 Tamil/English-speaking families (two consenting adults each), that **the non-keeper adult reliably accepts and completes coordinator-originated commitments without chasing**, and that **generated views and grounded answers are used in place of navigation with zero unauthorised bindings**, without increasing coordinator effort. Charging and willingness-to-pay validation are deferred; free-pilot retention is not payment evidence.

**In scope:** A1–A7, A10 core, A12–A13, B1–B4, B15, C1–C6, C9 (people), C10 (Tamil), C11–C14, D1–D5, D9 (per-record), D11, D14–D17, E1–E7, E13–E16, E19–E20, F1–F7, F10, G1 (generic), G8, G9, I1–I14, J1–J6, J8–J13.
**Deferred:** billing/payments/trial/paywall/subscription enforcement (H1–H5), images, Telegram, WhatsApp outbound, collections, consolidation, suggested questions, contradiction inbox, Home Assets, Hinglish, recurrence, fact-based inference, 3–6 adults, quick-commerce share, festival parsing, inferred conflict detection.

<a id="section-11-2"></a>

### 11.2 The six MVP capabilities

1. **Two-adult household** — sign-in, invitation, consent, default duties, recovery, exit rights, export/delete.
2. **Natural capture** — type or speak in English / Tamil / Tanglish with an editable transcript; tested share-sheet for WhatsApp text and voice notes; paste; bounded offline drafts.
3. **Intent → structure → view** — mutation contract; one necessary question at a time with resume; recipient/date/deletion always confirmed; model proposes which trusted view answers the request.
4. **Shared, correctable memory with grounded answers** — provenance, claim-level citations, answerability, correction-vs-change, why?, forget.
5. **Closed-loop delegation with receipts** — transition table, recipient-preference reminders, windows, status query, deadline alert (opt-in), receipts, pulse, weekly review, Needs-my-response/Due now, anti-harassment controls.
6. **Trusted generative surfaces** — deterministic mandatory panels, model-ordered optional cards, three result views, clarification form, fixed fallback.

<a id="section-11-3"></a>

### 11.3 Core user journeys (acceptance criteria; today is Sun 11 Oct 2026)

**UJ0 — First run (each adult independently).** Install → sign-in → consent screens (what is shared, private vs household, non-emergency limits, AI processing, optional research analytics) → language and display script → notification permission with an honest fallback ("without notifications you'll use Due now") → quiet hours and pulse time → only the essential default duties (shopping, school) → iOS: Home-Screen install walkthrough → first real handoff created by one adult and accepted by the other. **AC:** invitation that never activates is visible to the inviter with resend/cancel; each adult can state in their own words what the other adult can see; onboarding handoffs are **excluded** from qualifying metrics.

Offer a personal recovery email after sign-in, verified through Resend; include a visible Skip action and allow setup later in settings. Notice: "Recovery may be unavailable without access to your registered phone number or a previously verified recovery email." Skipping does not prevent household activation, capture or handoffs. Unverified/skipped email cannot be used as a recovery factor; notices contain no household content.

**UJ1 — Say it once (Tanglish voice).** Divya: *"Naalaikku Aarav oda PTM naalu manikku, Karthik poraan. Paal mudinjiduchu."* Transcript (script per her preference) → receipt *Heard → Understood* → confirm card: **Event** PTM — *Mon 12 Oct 2026, 4:00 pm* (PM inferred from "school" and shown); **Commitment** "attend PTM" — owner Karthik, timed deadline Mon 12 Oct 4:00 pm, linked to the event; **Item** *paal*. One tap → *Saved → Scheduled*. Karthik's preview: "You have a household handoff." **AC:** no save without the confirm step; the accepted action group and its jobs commit atomically under [§11.6](architecture.md#section-11-6); failure rolls back the whole group and shows a failed/pending receipt, never a partial-save or Saved receipt for that group; Tamil names resolve via confirmed aliases.

**UJ2 — Forward from WhatsApp (text).** *"Dear parents, Friday is colour day — send children in yellow."* → capture source "WhatsApp (shared)", anchor Sun 11 Oct → **Commitment** "send Aarav in yellow" — *Fri 16 Oct 2026, all-day (morning reminder)* — owner = default-duty for school prep; card flags "forwarded — is Fri 16 Oct right?". **AC:** share → confirm in ≤ 3 taps on the tested matrix; forwarded text cannot mutate anything.

**UJ3 — Demo B: delegation without becoming a manager.** Divya: *"Karthik-ku Tuesday saayangalam petrol pottu sollu."* → **Commitment** "fill petrol" — owner Karthik — **window Tue 13 Oct 17:00–21:00** (product default window; confirmed). Karthik: *Accept / Not me / Propose another time / Ask / Done*. If he proposes Wednesday evening, Divya confirms; until then the Tuesday window stays effective and his acceptance (if any) is preserved. Divya asks *"petrol status enna?"* → side-effect-free status answer. Not done by window end → one informational alert to Divya (opt-in). **AC:** every transition in [§11.8](architecture.md#section-11-8) reachable from push on the Android matrix; iOS web opens an authenticated screen; on-behalf completion attributed and excluded from the owner-completed metric; "Did you remind him?" answers *scheduled / submitted / delivery unknown or delivered / accepted* separately.

**UJ4 — Demo A seed: the house remembers a service.** Suresh: *"Purifier service pannitaanga innaiku, ₹1,800 kuduthom. Aaru maasathula filter maathanum-nu sonnaanga."* Clause-level resolution: clause 1 → **service event**, occurred Sun 11 Oct 2026 (precision: day), subject key *purifier* (confirmed; if two purifiers exist, one question); clause 2 → canonical cost ₹1,800 **on the event**; clause 3 → reported speech containing a **future** obligation → **attributed non-medical recommendation** (interval 6, unit calendar-months, anchor = event date) and a **proposed commitment** "change purifier filter" — *Sun 11 Apr 2027* (calendar-month rule; month-end clamping), labelled **estimate**, owner → clarify. Result view: `timeline` for the subject with source chips and "recorded events only". **AC:** no commitment without owner confirmation; no separate cost fact; recommendation stored as attributed, not asserted; months later *"last time enna pannom?"* answers with source and date.

**UJ5 — Demo C-lite: questions create the view.** Karthik: *"Intha week veetukku enna enna pannanum, yaar pannuraanga-nu kaattu."* → view intent `grouped-list` (owner, this-week, active) → server issues a `VIEW_HANDLE` and capabilities (`commitment.complete`, `commitment.reschedule_propose`) scoped to the listed records and versions. Divya's `self` items are absent **and do not alter counts or group order**. Tapping *Done* calls the same audited service as voice; *"adhu mudinjiduchu"* within 10 minutes on this device resolves to that record, otherwise the target is shown and confirmed. **AC:** zero unauthorised bindings/actions; invalid payload → text + fixed cards; p90 within [§12.1](requirements-and-features.md#section-12-1-slos) SLO.

**UJ6 — Grounded ask with abstention.** *"Aarav oda shoe size enna?"* → "UK 1 (said by Divya, 3 Sep)" with the record cited. Unknown → "I don't have that — ask Divya?" (creates a handoff **only** on confirmation). *"Car-ku intha varusham evlo selavu?"* → "**Recorded** service payments this year: 2, totalling ₹3,200 — older visits may not be recorded" (answerability: partial; computation deterministic server-side). Conflicting facts → both attributed values shown.

**UJ7 — Correction vs change.** *"Sorry, warranty July-la mudiyum, June illa."* → card asks "Correcting a mistake, or did the date change?" → *correction*: June retracted (visible only under why? as retracted), July recorded as a new revision of the same logical fact; dependency edges invalidate stale derived answers and produce a proposed task change. An accepted task keeps its confirmed deadline/schedule until an authorized adult confirms that change; a confirmed material change requires owner re-acceptance and cancels/replans obsolete jobs atomically. *"Munnadi Kumar service pannaar, ippo Ravi."* → *change*: Kumar retained with `effective_to`, Ravi current. *"Yen July-nu nenaikkira?"* → exact authorized source revision/span shown. **AC:** no silent deadline changes or implied acceptance from correcting the basis; concurrent task changes require refresh/reconfirmation.

**UJ8 — Pulse and weekly review.** Pulse at the member's chosen time: ≤ 3 items needing *my* response + ≤ 2 household items, each sourced; suppressed if unchanged since last pulse. Weekly review (opt-in): deterministic list of unresolved, upcoming-7-days and open shopping with existing actions; "among recorded commitments, two overlap on Saturday 5–7 pm".

**UJ9 — Exit and separation.** Divya revokes Karthik: his live access, capabilities and queued deliveries stop immediately; he is offered (via his account, 90 days) export/erase of his `self` records and a read-only exit snapshot of household records as of revocation; he cannot see later changes. Sole-admin leave: successor designated or household suspended per A12. **AC:** revoked session fails a cached action and a cached handle; the exit snapshot contains no later records.

The remaining Phase 1 technical specification is in [Architecture: access matrix](architecture.md#section-11-4), [data model](architecture.md#section-11-5), [mutation contract](architecture.md#section-11-6), [handoff lifecycle](architecture.md#section-11-8), [routing and scheduling](architecture.md#section-11-9) and [trusted generative surfaces](architecture.md#section-11-10). The product date/time policy follows here.

<a id="section-11-7"></a>

### 11.7 Date, time and window policy (English + Tamil; product defaults, not universal semantics)

| Input | Rule |
|---|---|
| Timezone / format | Household timezone defaults to Asia/Kolkata; day-first; absolute date **always echoed**. Resolve/store the deadline timezone and UTC instant at confirmation; recipient travel/reassignment or a later household timezone change cannot reinterpret it |
| **Clause-level resolution** | Each clause gets its own *reporting time* (when it was said), *occurred time* (when the thing happened) and *due time* (when something must happen). Reported speech (*-nu sonnaanga*, "they said") sets reporting attribution only; an embedded future obligation ("change in six months") still becomes a **proposed** commitment after confirmation. Past-tense event clauses become events/facts, not commitments |
| *naalaikku* / *naalanikku* / *nethu* / *innaiku* | tomorrow / day after / yesterday / today, relative to the **capture anchor** (never to the reporting tense) |
| Time-of-day words → **windows** (confirmed defaults) | *kaalaila* 06:00–11:00 · *madhyanam* 12:00–16:00 · *saayangalam* 17:00–21:00 · *raathiri* 21:00–23:00; English morning/afternoon/evening/night likewise; overnight windows ask |
| Clock without AM/PM (*naalu manikku*, "4 baje") | Infer from context (school, office, dinner) **and show it**; no context → ask |
| Weekday / *adutha vellikizhamai* | This coming occurrence; if today is that weekday or the day before → ask "Fri 16 Oct or Fri 23 Oct?" |
| Forwarded text | Anchor = capture time; card flags the forwarded origin; never invent the original timestamp |
| Missing time | `all_day` with default 08:00 reminder on the saved day in its deadline timezone, subject to recipient preferences/quiet hours; effective expiry is the start of the next local calendar day (exclusive boundary) |
| Past-due on creation | Allowed; overdue flag; no past reminders |
| Contradictions, approximate dates ("around Pongal") | Ask; approximate → `occurred_precision = month` or ask |
| Festival names | **P2**; P1 asks for an absolute date |
| Recurring wish (*ella Monday-um*) | **P1 receipt:** offer a confirmed one-off |
| Relative intervals ("filter in 6 months") | **Calendar-month arithmetic**: anchor + N months, same day-of-month, clamped to month end (31 Oct + 6 → 30 Apr); leap years follow the calendar; anchor = event occurred date; result labelled **estimate**; owner clarified before creation. *11 Oct 2026 + 6 months = Sun 11 Apr 2027* |
| Native-speaker validation | Tamil-script and Roman variants, negation, reported future speech, "next" weekday ambiguity and approximate dates are validated by native speakers before the release gate |

<a id="section-12"></a>

## 12. Non-functional requirements and quality

<a id="section-12-1"></a>

### 12.1 Device spike and SLOs

Technology choices are in the [tech stack](tech-stack.md#section-12-1-stack).

**Implementation baseline:** Expo Android + Expo Router responsive web/PWA for iOS; custom Pastel Rooms catalogue components over Tamagui unstyled primitives; Fastify/TypeScript API with Better Auth, Drizzle/`pg` and one PostgreSQL database with enabled/forced RLS; shared `openapi-typescript`/`openapi-fetch` OpenAPI client with TanStack Query; separate pg-boss worker; Linux VM + Docker Compose via Dokploy; SeaweedFS storage; Resend email and MSG91 SMS authentication/recovery. Retrieval, offline behavior, API contracts and database isolation are defined in [§11.12–§11.15](architecture.md#section-11-12). All authoritative logic runs in the backend; the pilot is free and selecting the stack does not waive the release gates.

**Client/API behavior (J14):** application REST/JSON routes use `/api/v1`, Better Auth retains `/api/auth` and its SDK, and the PWA/API share an HTTPS origin. Android application requests attach Better Auth Expo cookies with `credentials: "omit"`; web uses browser cookies and existing origin/CSRF checks. Account/household/permission-scoped query keys and account-switch clearing preserve cache isolation. v1 remains compatible with installed clients, with CI checks for generated-type drift and incompatible changes. Problem Details errors have stable localizable codes and safe request IDs; missing/inaccessible resources are indistinguishable. Lists use live, scoped opaque cursors (default 20, maximum 100), stable ID tie-breakers and current access checks, refreshing from the first page after mutations/reconnect. Mandatory panel counts and aggregates use complete authorized queries. Instants use UTC RFC 3339, dates use `YYYY-MM-DD` with the saved deadline timezone, and monetary amounts use decimal strings plus currency with exact backend arithmetic and separate totals per currency.

**Processing UX:** Q&A fetch-based SSE emits content-free `progress`, then a complete validated `result` or safe `error`; no raw model tokens or unchecked claims/bindings reach the UI. Leaving/backgrounding aborts unfinished read-only Q&A best effort and prevents further retries/escalation; reopening offers an explicit retry, and billing cessation is not guaranteed. Submitted captures and confirmed work continue independently. Long-running operations return 202 with an opaque ID and authenticated status endpoint; foreground polling backs off from two to ten seconds and stops in the background. Processing acceptance is not Saved/Scheduled. `Cache-Control: no-store` excludes protected responses from HTTP/service-worker caches; explicitly managed offline content retains B15's existing rules.

<a id="section-12-1-device"></a>

**Device spike checklist (J9, days 1–21):** Android share-target for WhatsApp text and voice note (tap count, OEM variants); push with app killed; OEM battery restrictions (Xiaomi/Vivo/Oppo/Samsung); notifications disabled path; inline actions from push; iOS Home-Screen install, permission prompt, push receipt and tap-to-open action; stale/offline action rejection; long voice-note size; free-app distribution policy. Validate representative text/button/field/task-tick/card/sheet/feedback components against [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md): bundled Nunito/Noto Sans Tamil and mixed-script runs, Phosphor duotone treatment, light/dark/context tokens, responsive layout, large text, keyboard/focus, screen readers, Android Back and reduced motion. Run on real Android and iPhone Safari/PWA before broad UI implementation; browser-only prototypes do not qualify native behavior. Output: supported-device/UI matrix published in service terms.

<a id="section-12-1-slos"></a>

**Provisional SLOs (p90, supported matrix, Wi-Fi/4G; finalised after the spike):** capture acknowledged ≤ 1 s · transcript ≤ 4 s for ≤ 15 s audio · proposal card ≤ 6 s · result view first paint ≤ 4 s, complete ≤ 8 s · outbox dispatch ≤ 30 s · provider submission ≤ 60 s. Client receipt is not an SLO.

<a id="section-12-2"></a>

### 12.2 Evaluation protocol and release gate

- **Extraction set:** 200 → 500 utterances; English / Tamil script / Tanglish strata (min 60 each); ambiguity, relative dates, windows, forwards (incl. stale), duplicates, negation, correction-vs-change, reported future speech, multi-action, unauthorised recall, prompt injection, health content; held-out speakers/names/date patterns. **Metrics reported separately:** pre-correction proposal accuracy (type + fields) · **consequential-error rate** (wrong recipient/date/target/amount *proposed*, whether or not caught) · abstention/clarification rate · correction burden (edits per saved action) · capture abandonment · post-confirmation success. **Gate:** consequential-error ≤ 2%; abstention ≤ 25% overall / ≤ 40% per stratum; zero silent wrong-recipient/date saves; zero successful injection/cross-household/fabricated-ID cases.
- **Speech set:** 150 consented voice notes (Chennai/Coimbatore/Bengaluru speakers; noise; spelling variants); **raw STT** entity/quantity/date/window accuracy reported separately from text-only extraction and end-to-end post-correction success; gate: raw member-resolution ≥ 85% and post-confirmation ≥ 95%; abandonment < 10%; long-audio path verified.
- **Q&A set:** 150 questions (changed, missing, conflicting, forgotten, private facts); correctness ≥ 90% on answerable; **claim-level citation correctness ≥ 95%**; abstention ≥ 95% on unanswerable; existence leaks = 0. Include Tamil/Tanglish cross-script topic terms, visible alias collisions, exact subject/date/status filters, complete aggregates beyond a text-result cap, effective history and correction/forget/revoke during synthesis. Diagnose retrieval vs interpretation/synthesis failures separately; authorize citations at their exact source revision before serving.
- **Surface suite:** [§11.10](architecture.md#section-11-10) gates (a)–(d).
- **Privacy/permission suite:** revoked session/capability, private/shared source, paired-world, forget propagation, restore-no-resurrection, exit snapshot — all pass.
- Confidence gates only clarification; recipient/date/deletion confirmation never bypassed. Regression sets retained; rollback/disable rule defined. Passing is evidence about the sets, not a production guarantee.

**Speech selection is complete:** the founder has evaluated Sarvam and chosen `saaras:v4` for STT and `bulbul:v4-flash` for TTS. The speech set above validates Nilumi's actual script handling, names, dates, audio paths and latency; it is not a new speech-provider bake-off, and the founder's evaluation is not a claim that these release metrics have already passed. TTS selection preserves the existing phases for spoken brief/elder features.

**Runtime acceptance checks for the chosen stack:** record/job atomic rollback; identical command replay and mismatched idempotency-payload rejection; simultaneous correction/completion/reassignment without lost updates; assignment-state projection consistency; all-day boundary, travel/reassignment and saved-timezone invariance; confirmation-first dependent task correction and material-change re-acceptance; worker crash/restart and retry idempotency; stale/revoked/expired job suppression; configured dispatch latency; OpenAPI/runtime-schema consistency; SeaweedFS transfer expiry/CORS/deletion; authenticated export downloads rejected after included-record forget, grant expiry or loss of applicable access; offline account isolation, expiry and revision conflicts; telemetry content redaction. Before real household admission, run the required backup/restore and forget-no-resurrection checks. These extend the existing release suites rather than replace them.

**API/client acceptance (J14):** generated OpenAPI types match runtime schemas and compile for Android and web; CI detects drift and incompatible v1 changes. Verify native Cookie transport, browser cookies/CSRF, session revocation and account/household/permission cache isolation on Android and Safari/PWA. Cursor tampering, changed filters and cross-viewer/household requests, status endpoints, panel counts and errors reveal no inaccessible records; complete aggregates remain correct beyond page limits. Round-trip Tamil/Tanglish, calendar dates, UTC instants, saved timezone boundaries and decimal-string currency values without precision loss or currency mixing. Duplicate/replayed commands re-check current rights and cause no duplicate side effects or stale sensitive-response leaks; stale revisions require refresh/confirmation with no partial Saved receipt. Parse SSE across split event frames and multibyte Tamil characters, reject invalid payloads and treat missing terminal events as incomplete; correction/forget/revoke during generation suppresses invalid final answers. Leaving/backgrounding stops Q&A retries/escalation and ignores late results, while accepted captures/confirmed work survive navigation and worker restarts; status polling pauses/resumes correctly and protected HTTP responses use `no-store` without breaking explicit bounded offline storage.

**Database acceptance (J15):** run tests with the actual API/auth/worker/queue credentials, not a table owner or test superuser. Verify enabled/forced RLS, denied owner/executor-role assumption, unauthorized-schema access, DDL/truncate denial, invoker views and restricted helper execution. Missing context, another household, private history, invisible dependency endpoints and cross-household foreign keys fail safely. Reuse a pool connection after commit, rollback, timeout and cancellation; no prior account/household/membership context or transaction lock may survive. Concurrent revocation/permission/visibility changes, forgetting, editing and completion preserve current rights and revisions with consistent lock ordering. Domain/ledger/job writes roll back together via `fromDrizzle(tx, sql)`; restart/retry produces no duplicate effects. Freeze snapshots at exit, exclude others' private content, deny later editing/creation/live access, and verify account-owned read/export/erase through the 90-day window with forget suppression. Retention continues after departure using database-time expiry/tombstones without returning sensitive content. Restricted Better Auth/queue startup and enqueue/claim/supervision work; pending migrations or grant mismatch fail readiness without expanding privileges. Verify bounded connection totals and that provider/storage calls do not hold product transactions open.

**LLM qualification:** evaluate `google/gemini-3.5-flash-lite` and `google/gemini-3.8-flash` per backend role on the held-out extraction/Q&A/surface sets, latency and measured cost. They are candidates, not evidence of passing. Pin passing model/provider/prompt/schema/routing configuration, with a hard vetted provider allowlist and total timeout/retry/token limits; fail safely on unavailable providers, invalid output or exhausted budgets. Report model-only extraction, retrieval completeness and grounded synthesis separately. Production release remains gated if no candidate passes a role; production residency is reviewed separately.

**Operational qualification:** approve MSG91's actual DLT/header/template/route and test authentication/recovery on Airtel, Jio, Vodafone Idea and BSNL; exercise OTP expiry/single use, resend and verification/send limits, provider failures, delivery-vs-verification reporting and content-redacted logs. Verify the Resend domain and signed webhook handling, including duplicate/out-of-order events, worker retries and manual re-drive after its 24-hour idempotency window. Measure actual SMS/LLM costs and verify the free pilot has no checkout, payment credentials/webhooks, subscription gate or non-payment reminder pause.

**Authentication acceptance:** Android session credentials stay in Expo SecureStore through Better Auth's Expo integration, outside content caches; web session cookies are Secure/HttpOnly over HTTPS. PostgreSQL-backed session validation and current membership checks reject revoked access on the next backend request, including when the client displays a cached session. Test logout/account-switch cache clearing, trusted-origin/CSRF enforcement, optional-email Skip and later verification, rejection of unverified recovery factors, new-number verification/cooling-off, and recovery without restoring revoked household membership. When neither a registered number nor a previously verified email is accessible, disclose possible recovery unavailability rather than granting private access through a household member or support override.

<a id="section-12-3"></a>

### 12.3 Capabilities to solve deeply (engineering edge → acceptance)

| Capability | Distinguishing outcome | Acceptance | First gate |
|---|---|---|---|
| Deterministic mandatory work + safe generative surfaces | Required work can never be hidden, filtered or stale; model chooses only presentation of the rest | [§11.10](architecture.md#section-11-10) suites (a)–(d); paired-world tests | P1 release |
| Grounded dynamic Q&A | Claim-level citations; answerability within recorded evidence; questions (P2) only from authorised evidence | Q&A set; existence leaks = 0 | P1 answers / P2 questions |
| One necessary question at a time | Suspend, persist, resume with revalidation | Clarification turns; interruption/cross-device fixtures | P1 |
| Temporal household memory | Correction vs change confirmed; precision-aware dates; retracted assertions visible only in why? | Fixtures: correction / change / late-learned / unknown date / forget | P1 |
| Cross-member access boundaries | Household vs private correct in UI, views, notifications, search, pulse, aliases, exports, exit snapshots | Zero leaks in the adversarial suite | P1 (release-blocking) |
| Action/notification receipts | Never "done" before commit or "delivered" from provider acceptance; N/A, unknown, pending states | Duplicate requests, stale jobs, push failures, concurrent edits, offline | P1 |
| Voice-to-action continuity | Spoken request, view, capability, follow-up voice update the same record within a bounded context | Session/device/time-bound reference tests | P1 |
| Multilingual entity resolution | Tamil/English/romanised aliases resolve the same person (P1) and asset (P2); phonetic resemblance never authorises | Two-Paati, similar-name, private-alias fixtures | P1 people / P2 assets |
| Retrieval with incomplete data | "Recorded" totals; gap prompts; no pretended completeness | Numerical consistency tests | P1 |
| Proactive relevance with consent | Pulse/review help without auto-editing or excess pushes | Useful-action rate; mute rate | P1 review / P2 intervals |
| Forgetting, revocation, exit | Data stops appearing everywhere derived; exit snapshots respect visibility; downloaded copies disclosed | Seed → share → query → forget/revoke/exit → search/pulse/export/restore tests | P1 |
| Cost/latency control | Fast trivial commands; heavier reasoning only when needed; budgeted generation | Per-intent p50/p95, tokens, successful-command ratio | P1 |

**Critical principle:** a technically impressive capability is not differentiation unless the family notices *less effort, more trust or more follow-through*.

---

<a id="section-13"></a>

## 13. Compliance requirements

Privacy and security implementation rules are in [Architecture](architecture.md#section-13-1); the [tech stack](tech-stack.md#section-13-1-processors) contains the processor/data-flow register.

<a id="section-13-2"></a>

### 13.2 Compliance checklist (stage-gated and dated)

| Stage / date | Required before |
|---|---|
| **Pre-collection** (before any consented recording or interview data, day 1) | Evaluation consent and notice; STT/LLM processor terms for evaluation data; legal review of pilot processing scope; data minimisation for eval sets |
| **Pre-dogfood** (day 36) | Access matrix, deletion/forget, exit rights and notification privacy implemented; synthetic data until then |
| **Pre-external pilot** (day ≤ 112) | Full release suites ([§12.2](requirements-and-features.md#section-12-2)); privacy notice (purposes, processor register, retention matrix, grievance contact); consent records; AI-use disclosure; child-data pathway; breach runbook tested; flag-this-answer live; analytics consent separation; service terms published |
| **Nov 2026** | Consent-manager provisions commence — confirm applicability (using consent controls ≠ operating a statutory Consent Manager) |
| **Before public beta (Phase 2)** | Verifiable-parental-consent mechanics; processor contracts; data-flow register published; store-policy and checkout decisions; Play generative-AI policy applicability reconfirmed |
| **May 2027** | Core DPDP Rules duties operative (notice, consent, security, breach without delay / 72 h, erasure, children's data) |
| **Quarterly** | Re-evaluate Meta WhatsApp policy, store policies, processor locations/training settings |

---

<a id="section-16"></a>

## 16. Free-pilot feature and budget behavior

<a id="section-16-1-budget"></a>

### 16.1 Budget-limit behavior

The workload envelope and unit economics are in the [product plan](product-plan.md#section-16-1).

**Aggregate pilot AI target:** ₹2,000/month for LLM calls plus Sarvam speech-to-text across the real 20-family pilot; VM/fixed infrastructure, SMS and separate evaluation runs are excluded. Track aggregate spending as well as per-household usage and validate the target with qualified model rates and measured workload. It is a starting target, not an automatic hard cutoff or a fixed per-household allocation; configure aggregate enforcement/escalation before admission while preserving confirmed reminders and data rights.

Budget-limit UX: at 80% of a household's monthly variable-provider envelope, feed regeneration drops to fixed order and voice falls back to typed capture with a notice; **single alarm at > ₹120/month** (2-adult). Account for LLM, speech and SMS consumption separately from fixed infrastructure and one-time onboarding/prepaid funding; calibrate the envelope with qualified models and measured usage. These operational controls apply to free households and do not introduce payment states. Mandatory panels, already-confirmed reminders and read/export/correct/erase remain available; no reminder is paused for non-payment.

<a id="section-16-2"></a>

### 16.2 Free-pilot feature policy (Phase 1)

Development and all eight weeks of the real 20-family pilot are free. Backend feature availability is governed by phase, active membership, consent and usage policy; clients render that policy and never determine authority. There are no subscription/trial/paywall states, payer/renewal counters, receipts or payment-dependent reminder pauses. Pilot completion does not automatically convert a household to a paid plan or lock its data. Pricing and any later Razorpay checkout, entitlements, cancellation/refund or non-payment behavior require a separate charging review before implementation.

---

<a id="section-18"></a>

## 18. Pilot service requirements

<a id="section-18-2"></a>

### 18.2 Pilot service terms (summary, published to families)

Free eight-week pilot; no payment offer or automatic paid conversion · supported devices and channels per the device matrix · non-emergency use only; reminders are best-effort and device-dependent · support window: weekday evenings and weekends; response by the next support window · incident/status route in-app · during outages: bounded offline capture and clearly labelled last-authorized snapshots; current actions require backend revalidation · usage limits may reduce AI/voice generation with notice, while confirmed reminders and data rights remain · authenticated export and applicable account-owned exit snapshot access; exit/export notice ≥ 30 days before any shutdown · internal SLOs are engineering targets, not an SLA.

---
