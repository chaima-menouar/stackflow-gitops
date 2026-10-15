# StackFlow · GitOps

This repository is the **desired-state source of truth** for StackFlow's Kubernetes demo application. It is intentionally separate from the application source and the StackFlow web platform.

## What belongs here

- `apps/demo/base/`: reusable Kubernetes Deployment and Service.
- `apps/demo/overlays/staging/`: staging configuration.
- `apps/demo/overlays/production/`: production configuration.
- `argocd/`: the Argo CD AppProject and Applications, installed **only after** cluster bootstrap and a real container image are ready.
- `scripts/`: manifest checks, digest pinning, and controlled promotion.
- `.github/workflows/`: automated validation of proposed configuration changes.

**Release policy:** Docker images are referenced by immutable `sha256` digests. Source CI publishes the image, then a reviewed pull request updates staging. Argo CD reconciles the merged Git state. Production promotion reuses that **same tested digest** and requires an administrator-approved pull request. Git history is the rollback mechanism. Never directly edit the cluster to deploy a release.

**Current status:** repository scaffold. The pinned zero digest is an intentionally invalid placeholder until `stackflow-demo-app` CI publishes a real image. **Do not apply the Argo CD Applications yet.** A running Kubernetes cluster, CI image, RBAC and repository approval policy are not configured here.

See [the bootstrap and deployment guide](docs/BOOTSTRAP.md) for the precise follow-up steps.
