# Deployment

Target: Oracle Always Free VM running Docker Compose, with Neon Postgres and
Cloudflare in front. Frontend deploys separately to Vercel or Cloudflare Pages.

## 1. Backend environment

Copy `backend/.env.example` to `backend/.env` on the server and set:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST/DB?sslmode=require
KEY_ENCRYPTION_KEY=<long-random-string>
SECRET_KEY=<long-random-string>
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=.example.com
FRONTEND_ORIGIN=https://app.example.com
REDIS_URL=redis://redis:6379/0
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
ADMIN_EMAILS=udita.chakraborty05@gmail.com,asmita.chakrab@gmail.com
SENTRY_DSN=
```

For same-site cookies, use `app.example.com` and `api.example.com`.
If the frontend and API are on unrelated domains, use `COOKIE_SAMESITE=none`
with HTTPS.

## 2. DNS and TLS

Point `api.example.com` at the Oracle VM public IP, proxied through Cloudflare.
Caddy obtains the certificate. Keep ports 80 and 443 open; keep 8000 private.

## 3. Run migrations

```bash
cd deploy
docker compose --env-file .env run --rm api alembic upgrade head
```

## 4. Start

```bash
docker compose --env-file .env up -d --build
```

Caddy serves HTTPS on the domain in `deploy/.env`.

## 5. Backups

Install `postgresql-client` on the VM and run `backup.sh` from cron:

```cron
15 2 * * * DATABASE_URL='...' /opt/interview-copilot/deploy/backup.sh >> /var/log/copilot-backup.log 2>&1
```

Copy backups off the VM (R2, B2, or another host) and test a restore.

## 6. Scale-out

- Run multiple API containers behind Caddy or a managed load balancer.
- Keep Redis for shared rate limits and auth/session state.
- Use a managed Postgres connection pooler and read replicas when needed.
- Run the realtime voice gateway separately from the CRUD API.
- Move migrations to a deploy job so replicas do not race.


