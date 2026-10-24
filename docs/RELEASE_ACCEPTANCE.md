# StackFlow release acceptance

This is an operator checklist, not proof of deployment.

- [ ] Confirm CI tests and image scan passed for the release commit.
- [ ] Record the published immutable image digest and verify it can be pulled.
- [ ] Review and merge the staging overlay pull request.
- [ ] Bootstrap a disposable local Kubernetes cluster and Argo CD.
- [ ] Verify the deployed image digest matches the approved staging revision.
- [ ] Verify readiness, monitoring metrics and dashboard observations.
- [ ] Review production promotion separately and rehearse rollback in a test environment.
- [ ] Document evidence links, results and unresolved blockers.

Do not claim a production deployment from successful CI alone. Multi-user authentication and the three-repository split remain separate work items.
