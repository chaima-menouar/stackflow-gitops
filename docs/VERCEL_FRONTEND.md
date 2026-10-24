# StackFlow — free Vercel frontend deployment

This deploys the **React frontend only**. It does not deploy the FastAPI platform API, PostgreSQL, Kubernetes, Argo CD or monitoring. The dashboard's authenticated API actions will not work until a compatible backend is hosted and connected. Do not describe this as a complete StackFlow deployment.

## Vercel Hobby setup

1. Import `chaima-menouar/stackflow-gitops` as a new Vercel project.
2. Set **Root Directory** to `services/platform/frontend`.
3. Use Framework Preset **Vite**, Install Command `npm ci` (if the lockfile is present), Build Command `npm run build`, Output Directory `dist`.
4. Deploy a preview from the dedicated branch, review it, and only then promote the approved version.
5. Confirm the landing page loads and browser navigation refreshes correctly.

## Limitations

Vercel Hobby hosts this static Vite frontend under free-plan limits. Its static deployment is not a substitute for a long-running backend or a Kubernetes cluster. The Vite development proxy only runs locally; it is **not** a production API proxy. Never place GitHub tokens or the local admin API token into public frontend environment variables. For a real online platform, design and verify a separately hosted API, storage, authentication, CORS and server-side secret management before enabling actions.

The existing local Docker Compose flow remains the supported functional MVP.
