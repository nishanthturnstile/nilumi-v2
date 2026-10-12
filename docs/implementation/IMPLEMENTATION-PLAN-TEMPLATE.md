# Implementation plan: <title>

**Plan ID:** <ID> · **Version:** <version> · **Date:** <date>
**Status:** Draft / Reviewed, awaiting execution / In progress / Complete
**Owner:** <owner> · **Requirements baseline:** <version and links>

This template is Nilumi's reusable implementation-plan format. It separates proposed work from implementation evidence. Remove guidance placeholders when filling it in; use “not applicable” where a section does not apply.

## 1. Summary and outcome

State the concrete outcome, principal recommendation and completion boundary.

## 2. Scope

List included deliverables and excluded work. Identify the next plan that follows this one.

## 3. Inputs and traceability

| Input / requirement | Planned work | Acceptance evidence |
|---|---|---|
| <requirement ID and source> | <work package> | <check or artifact> |

Record inspected repository/machine state separately from assumptions. Never treat a documented decision as a passing integration.

## 4. Decisions and technical design

Record recommended choices, reasons, dependencies, package/process boundaries and compatibility constraints. Reference authoritative architecture and design contracts rather than duplicating them.

## 5. Work packages and sequence

For each work package:

- **ID and title:** <ID> — <title>
- **Depends on:** <IDs or none>
- **Tasks and files:** <concrete implementation steps and intended paths>
- **Acceptance:** <observable completion criteria>
- **Status:** Not started / In progress / Blocked / Complete

Keep tasks reviewable. Add estimates only when their assumptions are useful; estimates are not deadlines or release approval.

## 6. Verification and definition of done

| Check | Environment | Required evidence |
|---|---|---|
| <behavior or property> | <runtime / device / CI> | <result and evidence location> |

Define failure behavior, platform limitations and what the checks cannot establish.

## 7. Release, migration and recovery

Describe applicable data/schema compatibility, deploy order, rollback limits and preservation of existing work. Use “not applicable” with a reason for documentation-only work.

## 8. Risks, dependencies and open questions

| Item | Impact | Resolution / trigger | Blocks which work? |
|---|---|---|---|
| <risk or unknown> | <practical consequence> | <action or necessary clarification> | <ID or none> |

Distinguish user product decisions from routine engineering choices. Identify which decisions can wait until implementation.

## 9. Review record

Record the second-pass review: scope, requirement coverage, platform compatibility, dependency direction, privacy/correctness contracts, verification, release/recovery and unresolved assumptions. List identified issues and how the plan addresses them. A plan review does not certify runtime behavior.

## 10. Execution handoff

State the first action, required inputs and the conditions for proceeding to the next plan. Update work-package status and evidence during execution.
