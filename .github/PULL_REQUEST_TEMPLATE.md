## Change

Describe the concrete problem, resulting behavior and relevant requirement/plan.

## Validation

Record checks and environments that actually passed, including relevant negative cases. Identify remaining device/runtime checks and any compatibility exceptions.

`Foundation required` must be green before merging to protected `main`. It gates Linux foundation,
Windows smoke, restricted-role integration, web browser, image smoke and Android when triggered.
Link the GitHub run/job URLs; local checks alone do not establish CI acceptance. Record contract
drift/PR-base compatibility, image health/readiness/shutdown and applicable Android build evidence.

## Recovery

Explain compatibility or recovery implications where applicable. Do not include credentials, household content or private device information.
