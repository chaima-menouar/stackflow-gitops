#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required"; exit 2; }
for env in staging production; do
  echo "Rendering $env"
  output="$(kubectl kustomize "apps/demo/overlays/$env")"
  printf '%s\n' "$output" | grep -Fq "name: demo-$env"
  printf '%s\n' "$output" | grep -Fq "demo-api"
done
echo "Both Kustomize overlays rendered"
