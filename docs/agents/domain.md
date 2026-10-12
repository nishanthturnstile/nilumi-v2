# Domain docs

## Baseline and reading order

`docs/core/` remains the authoritative baseline. Read it and the relevant
implementation plan before changes, following `AGENTS.md` and
`CONTRIBUTING.md`.

Before exploring an area, also read:

- Root `GLOSSARY.md`, when present.
- Relevant decisions in `docs/adr/`, when present.

If glossary or ADR files are absent, proceed silently. Create them lazily
when domain terms or decisions are resolved; setup does not create them.

## Layout

Use a single-context layout across the eight private workspace packages:

- `GLOSSARY.md`: shared Nilumi domain vocabulary.
- `docs/adr/`: shared architectural decision records.

Package boundaries do not automatically imply separate domain contexts.

## Vocabulary and decisions

Use glossary terms in issue titles, proposals, hypotheses and test names.
Reconsider invented synonyms; note real vocabulary gaps for later domain
modeling.

Surface conflicts with existing ADRs explicitly, identifying the decision
and explaining why it should be reconsidered. Do not silently override
ADRs or the authoritative core baseline.
