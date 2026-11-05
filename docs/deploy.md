# Deploy

Flow: **PR → CI green → merge to main → Release builds `ghcr.io/<owner>/<repo>:<sha>` → manual Deploy → health gate → auto-rollback on failure.**
Never build on the server. Never use the `latest` tag.

## One-time server setup (VPS)

1. Install Docker Engine + compose plugin. Create a deploy user in the `docker` group.
2. Create the app dir, e.g. `/srv/<project>`, owned by the deploy user, containing:
   - `docker-compose.yml` (copy from this repo)
   - `.env` with server values (`APP_PORT`, secrets). Permissions `600`.
3. Reverse proxy terminates TLS and forwards to `127.0.0.1:<APP_PORT>`. Caddy example (`/etc/caddy/Caddyfile`):

   ```caddy
   example.com {
     encode zstd gzip
     reverse_proxy 127.0.0.1:3000
   }
   ```

4. Create a GitHub token with `read:packages` only (for pulling images).

## GitHub settings

| Kind        | Name                         | Value                                 |
| ----------- | ---------------------------- | ------------------------------------- |
| Environment | `production`                 | Add required reviewer = owner         |
| Variable    | `NEXT_PUBLIC_SITE_URL`       | `https://example.com`                 |
| Variable    | `NEXT_PUBLIC_API_URL`        | `/` or the API origin                 |
| Variable    | `DEPLOY_PATH`                | `/srv/<project>`                      |
| Secret      | `DEPLOY_HOST`, `DEPLOY_USER` | server address and user               |
| Secret      | `DEPLOY_SSH_KEY`             | private key of a deploy-only key pair |
| Secret      | `DEPLOY_KNOWN_HOSTS`         | output of `ssh-keyscan <host>`        |
| Secret      | `GHCR_READ_TOKEN`            | the `read:packages` token             |

GitHub Free has no branch protection on private repos: the `pre-push` hook blocks pushes to `main`, and the PR template asks for green CI.

## Deploy

Actions → **Deploy** → Run workflow → optional `sha` (default: latest main). The job:

1. Logs the server into GHCR, pulls `<image>:<sha>`.
2. `docker compose up -d`.
3. Polls `/api/health` (30 × 2 s).
4. Healthy → writes `.deployed-tag`. Unhealthy → starts the previous tag again and fails the job.

Manual rollback: run Deploy with the previous sha (see `.deployed-tag` history in the job logs).

## Environments

Public env (`NEXT_PUBLIC_*`) is inlined at build, so one image = one environment. For staging, add a `staging` environment with its own variables and a second release job (or `workflow_dispatch` input) that builds `<sha>-staging`.

## Logs

Optional Loki logging block is commented in `docker-compose.yml` (needs the Loki Docker driver on the host).

## GitLab

`pnpm template:init --ci gitlab` keeps `.gitlab-ci.yml` (verify → release to the GitLab registry → manual deploy using the same `scripts/deploy/remote.sh`). Set `PROD_SITE_URL`, `PROD_API_URL`, `DEPLOY_*` CI/CD variables and a deploy token (`CI_DEPLOY_USER`/`CI_DEPLOY_PASSWORD`).
