# StackFlow kind + Terraform infrastructure bootstrap

The cluster is owned by `kind` and the Argo CD installation is owned by Terraform (Helm release + namespace). Argo CD owns the deployed demo application: **never let Terraform and Argo CD manage the same application resources**.

> Lab baseline only. Run commands on a **local computer with Docker, kind, kubectl and Terraform installed**. This setup has NOT been executed or verified in the assistant environment.

```bash
kind create cluster --config infra/kind/cluster.yaml
kubectl config current-context  # must be kind-stackflow
cd infra/terraform
terraform init
terraform plan
terraform apply
kubectl -n argocd get pods
```

Before applying, verify provider and chart versions are supported on your machine and examine the plan. State is local and can contain sensitive operational information: keep it private, backed up, and outside Git.

Only after a real GHCR digest is merged into staging and the cluster can access the container image, from repository root:

```bash
python3 scripts/validate.py --environment staging --deployable
kubectl apply -f argocd/project.yaml
kubectl apply -f argocd/demo-staging.yaml
kubectl -n argocd get applications
```

Argo CD configuration synchronization is not equal to a healthy application. Verify pod image digests and /health/ready after reconciliation. Production remains manual-sync-only pending administrator-approved promotion.

Cleanup the lab cluster when no longer needed: `kind delete cluster --name stackflow`. Do not point these examples at a real production cluster.
