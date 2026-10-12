# Issue tracker: GitHub

Issues and specs live in GitHub Issues for
`nishanthturnstile/nilumi-v2`. Use the `gh` CLI from this repository.

## Operations

- Create: `gh issue create --repo nishanthturnstile/nilumi-v2 --title "..." --body-file <file>`
- Read: `gh issue view <number> --json number,title,body,labels,comments`
- List: `gh issue list --state open --json number,title,body,labels`
- Comment: `gh issue comment <number> --body-file <file>`
- Apply or remove labels: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- Close: `gh issue close <number> --comment "..."`

Write multiline bodies to temporary files and pass `--body-file`.

Publishing to the issue tracker means creating a GitHub issue.
Fetching a relevant ticket means reading its body and comments.

## Relationships

Publish blockers before dependent tickets.

Use native GitHub sub-issues and blocking dependencies when available:

- Read an issue's database ID:
  `gh api repos/nishanthturnstile/nilumi-v2/issues/<number> --jq .id`
- Attach a child to its parent:
  `gh api --method POST repos/nishanthturnstile/nilumi-v2/issues/<parent>/sub_issues -F sub_issue_id=<child-database-id>`
- Record a blocker:
  `gh api --method POST repos/nishanthturnstile/nilumi-v2/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-database-id>`

Use numeric database IDs, not issue numbers, for these ID fields.
If native relationships are unavailable, put `Part of #<parent>` and
`Blocked by: #<number>` references at the top of the child body.

## Pull requests as a triage surface

**PRs as a request surface: no.**
