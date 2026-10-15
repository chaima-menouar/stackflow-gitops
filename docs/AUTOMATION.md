# Automation roadmap and boundaries

## Implemented in this repository

1. **PR and main validation:** workflow `Validate GitOps` runs safety unit tests, validates GitOps configuration and renders both Kustomize overlays.
2. **Optional staging PR proposal:** workflow `Propose staging release` takes an immutable GHCR digest, modifies only staging, validates it and opens a PR. The change does **not** bypass review or directly patch Kubernetes.
3. **Manual production promotion helper:** `python3 scripts/promote.py` copies the same staging digest to production, after an operator has separately verified staging health. This makes a local file change that must go through an administrator-approved PR.
4. **Git revert rollback:** Git history is the release desired-state authority; staging Argo CD can reconcile merged reverts. Production still requires an authorized manual sync in this scaffold.

## Github Actions setup

The staging PR workflow requires permission to create branches and pull requests. In repository settings, configure the minimum necessary workflow permissions and enable **Allow GitHub Actions to create and approve pull requests** if the account supports it. **Do not give workflows Kubernetes admin secrets.**

**Important:** A PR opened with the default `GITHUB_TOKEN` normally does not trigger another `pull_request` workflow. The proposal workflow performs validation before creating the PR, but it is **not** a replacement for independent PR review, a protected `main` branch or an external CI status requirement. For production-grade PR status enforcement, use a narrowly scoped GitHub App token to create PRs and enable required checks.

## Not yet implemented

- GitHub App credentials and cross-repository release dispatch from `stackflow-demo-app` (CI).
- Verifying the running digest, staging smoke tests and health before production promotion in the platform API.
- Observability dashboards, alert routing and on-call notifications.
- Optional n8n workflow for human-readable incident alerts / deployment summaries (read-only input, no unsupervised production changes).

A rollout is accepted only when **Git desired state, cluster observed digest and application health** all agree. CI success is not a deployment success.
