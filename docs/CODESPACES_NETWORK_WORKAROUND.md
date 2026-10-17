# Codespaces: Docker bridge connectivity failure

## Symptoms

- `pg_isready` succeeds *inside* the db container, but the demo/API container times out opening TCP to `db:5432`.
- `web` may fail npm DNS resolution (`EAI_AGAIN`).
- These symptoms indicate Docker bridge networking is failing; merely restarting application code is not a fix.

## Temporary local workaround: host networking

The optional override `compose.codespaces.yaml` routes lab services through the Linux Docker host's network stack, bypassing broken cross-container bridge routing. It is **not** enabled by default, and **must never** be used as the production deployment configuration. Docker host networking does not support regular port mapping or service-name DNS: this override clears published ports and changes service connections to localhost.

**Prerequisites:** Linux-based Codespaces, Docker Engine supporting host networking, available host ports 5432, 5173, 8001 and 8000, and a configured private `.env`. Make sure all Codespaces forwarded ports remain **PRIVATE**.

From the **repository root**:

```bash
git pull --ff-only
docker compose down                  # no -v; PostgreSQL data retained
docker compose -f compose.yaml -f compose.codespaces.yaml config --quiet
docker compose -f compose.yaml -f compose.codespaces.yaml up -d --build
docker compose -f compose.yaml -f compose.codespaces.yaml ps -a
curl --max-time 10 -f http://127.0.0.1:8001/health
curl --max-time 10 -f http://127.0.0.1:8000/health/ready
curl --max-time 10 -I http://127.0.0.1:5173
```

The db service runs PostgreSQL bound to `127.0.0.1` **on the Docker host**. This protects the database from being bound to the host's other network interfaces, but all containers that share host networking have access to it. Other ports from the demo/API/web may listen on other interfaces; keep the Codespaces port visibility **Private**.

If `config --quiet` reports a Compose syntax or networking conflict, verify `docker compose version`: Compose needs `!reset` support. If `up` reports port already in use or the host cannot access `127.0.0.1` from the Codespaces terminal, stop and check the logs instead of deleting volumes, changing network security policies or exposing public ports.

**Do not mix commands**: with the host-network workaround use `-f compose.yaml -f compose.codespaces.yaml` for every up, ps, logs and down operation. Revert to default only with a controlled `down` (never `down -v`) and `docker compose up -d` after bridge networking is repaired.

## Known limitations

Host network mode is a workaround, not evidence that Docker bridge networking has been repaired. It may be unsupported by some hosted configurations. A full secure Kubernetes/Argo CD workflow still requires a working cluster and properly protected GitOps releases.
