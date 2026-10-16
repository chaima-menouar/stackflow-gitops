# StackFlow — verification evidence and completion status

## GitHub Actions

- `Validate GitOps`: static security checks, Python tests and Kustomize manifest rendering.
- `Demo App - Test Scan Build and Propose`: Python API tests, vulnerability gate, immutable GHCR image publication (if gate passes), reviewed staging PR proposal.
- `Platform API - Tests`: authorization, allowlist, idempotency, dispatch guard and audit tests.
- `StackFlow Frontend - Build`: TypeScript compilation and production build.

Latest CI run status is in the repository's Actions tab. **Do not infer health, deployment, or publication without inspecting actual check results.**

## Evidence still needed before claiming a completed end-to-end platform

1. GitHub image package is published and pullable, staging has a **real** digest (not 64 zeros).
2. kind+Argo CD are bootstrapped; the reviewed staging Git revision reconciles.
3. Application image digest and health checks match what was approved.
4. An authorized person reviews production promotion, and manual production sync is healthy.
5. Rollback is rehearsed by a reviewed Git revert; recovery image and health are verified.
6. Prometheus/Grafana show real sampled data. All secrets are kept outside Git.
7. Security and role-based access acceptance testing is completed (GitHub OAuth / multi-user RBAC are not implemented by this local MVP).

This is not a production-ready service, even if every unit/build job is green.
