# StackFlow — verification evidence and completion status

## GitHub Actions

- `Validate GitOps`: static security checks, Python tests and Kustomize manifest rendering.
- `Demo App - Test Scan Build and Propose`: Python API tests, vulnerability gate, immutable GHCR image publication (if gate passes), reviewed staging PR proposal.
- `Platform API - Tests`: authorization, allowlist, idempotency, dispatch guard and audit tests.
- `StackFlow Frontend - Build`: TypeScript compilation and production build.

Latest CI run status is in the repository's Actions tab. **Do not infer health, deployment, or publication without inspecting actual check results.**

## Verified CI evidence — 16 October 2026

- [GitOps validation #38925544977](https://github.com/chaima-menouar/stackflow-gitops/actions/runs/38925544977): **passed** on the initial staging PR.
- [Platform API tests #38925193270](https://github.com/chaima-menouar/stackflow-gitops/actions/runs/38925193270): **passed**.
- [Frontend build #38925351347](https://github.com/chaima-menouar/stackflow-gitops/actions/runs/38925351347): **passed**.
- [Demo build/publish #38925188161](https://github.com/chaima-menouar/stackflow-gitops/actions/runs/38925188161): unit tests, scan and GHCR publish **passed**, but overall workflow was **red** due to GitHub Actions being disallowed from opening PRs. Confirmed successful published digest: `sha256:ac084154ab73da36d74d3c45a335a23d92e907150c42af4068c35372c320b8d1`.
- [Staging release PR #5](https://github.com/chaima-menouar/stackflow-gitops/pull/5): **open, not merged or deployed**. Requires human review and a pullable container / initialized Kubernetes cluster.
- [Workflow policy workaround](https://github.com/chaima-menouar/stackflow-gitops/commit/3fcdc8b3c63fec64e1ebf62b4b7f7f5f73aecdd8): the script now emits an explicit warning if auto-PR creation is blocked instead of treating image publishing as a failure. Configure GitHub Actions PR permission to enable fully automatic PR proposals.

These are **as-observed snapshots**, not guarantees about all future runs. Always inspect current Actions status before demonstrating.

## Evidence still needed before claiming a completed end-to-end platform

1. GitHub image package is published and pullable, staging has a **real** digest (not 64 zeros).
2. kind+Argo CD are bootstrapped; the reviewed staging Git revision reconciles.
3. Application image digest and health checks match what was approved.
4. An authorized person reviews production promotion, and manual production sync is healthy.
5. Rollback is rehearsed by a reviewed Git revert; recovery image and health are verified.
6. Prometheus/Grafana show real sampled data. All secrets are kept outside Git.
7. Security and role-based access acceptance testing is completed (GitHub OAuth / multi-user RBAC are not implemented by this local MVP).

This is not a production-ready service, even if every unit/build job is green.
