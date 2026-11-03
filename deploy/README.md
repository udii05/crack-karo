# Deployment

Target: a single Oracle Always Free VM running Caddy, the Next.js frontend,
FastAPI, and Redis with Docker Compose. The public site and the API share one
origin, so authentication cookies are first-party and no Vercel/Netlify proxy is
involved.

```
Browser -> Caddy :443
             |-- /api/*  -> FastAPI :8000
             `-- /*      -> Next.js :3000
```

Postgres remains external (Neon or Supabase) by default. Redis runs on the VM.

## What you need

- Oracle VM public IP and SSH access.
- A hostname pointed at that IP:
  - DuckDNS: `crackkaro.duckdns.org`
  - or a custom domain: `app.example.com`
- A Postgres URL from Neon/Supabase.
- Admin email addresses.
- Ports `22`, `80`, and `443` open in the Oracle security list.

The site will be available at `https://<DOMAIN>` and the API at
`https://<DOMAIN>/api`.

Do not put a proxy between Caddy and the internet if you want Oracle to be the
only infrastructure provider handling the request. In particular:

- Cloudflare must be **DNS-only / grey cloud**, not orange-cloud proxied.
- Do not terminate TLS at an Oracle load balancer or WAF. Caddy terminates TLS
  on the VM.

## 1. Point DNS at the VM

For DuckDNS, create a subdomain and point it at the Oracle public IP. For a
custom domain, create an `A` record for the hostname.

The DNS record must resolve before Caddy can obtain a certificate.

## 2. Backend environment

On the VM:

```bash
cd /opt/crack-karo
cp backend/.env.example backend/.env
nano backend/.env
```

Set the production values:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST/DATABASE?sslmode=require

SECRET_KEY=<long-random-value>
KEY_ENCRYPTION_KEY=<long-random-value>

COOKIE_SECURE=true
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=

FRONTEND_ORIGIN=https://crackkaro.duckdns.org
REDIS_URL=redis://redis:6379/0
ADMIN_EMAILS=your-admin-email@example.com

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
SENTRY_DSN=
```

Important:

- `FRONTEND_ORIGIN` must match the public hostname exactly, with no trailing slash.
- `COOKIE_DOMAIN` must stay empty. The frontend and API share a host, so a
  host-only cookie is correct.
- `COOKIE_SECURE=true` requires HTTPS, which Caddy provides.
- Keep `KEY_ENCRYPTION_KEY` stable and backed up. It decrypts saved BYOK keys.

Generate secrets with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Run it twice, once for each key.

## 3. Deployment environment

```bash
cd /opt/crack-karo
cp deploy/.env.example deploy/.env
nano deploy/.env
```

Set:

```env
DOMAIN=crackkaro.duckdns.org
```

Use the hostname only, without `https://`.

## 4. Prepare the VM

Install Docker, Git, and the Compose plugin:

```bash
sudo apt update
sudo apt install -y docker.io git docker-compose-plugin
sudo usermod -aG docker "$USER"
newgrp docker
```

Clone the repository:

```bash
sudo mkdir -p /opt/crack-karo
sudo chown "$USER":"$USER" /opt/crack-karo
git clone https://github.com/udii05/crack-karo.git /opt/crack-karo
cd /opt/crack-karo
```

If the repository is private, use your normal GitHub authentication outside
this guide; do not put a token in a committed file.

## 5. Build and migrate

```bash
cd /opt/crack-karo/deploy
docker compose --env-file .env build
docker compose --env-file .env run --rm api alembic upgrade head
```

## 6. Start everything

```bash
cd /opt/crack-karo/deploy
docker compose --env-file .env up -d
```

Check status and logs:

```bash
docker compose --env-file .env ps
docker compose --env-file .env logs -f frontend
docker compose --env-file .env logs -f api
docker compose --env-file .env logs -f caddy
```

Verify:

```bash
curl -fsS https://crackkaro.duckdns.org/api/health
curl -fsS https://crackkaro.duckdns.org/api/ready
curl -I https://crackkaro.duckdns.org/
```

Then open `https://crackkaro.duckdns.org`, register, and confirm that login
survives a page refresh.

## 7. Backups

Install the Postgres client on the VM:

```bash
sudo apt install -y postgresql-client
```

Add a cron job:

```cron
15 2 * * * DATABASE_URL='postgresql://...' /opt/crack-karo/deploy/backup.sh >> /var/log/crack-karo-backup.log 2>&1
```

Copy backups off the VM and test a restore. The Redis volume is not a source of
truth; Postgres is.

## 8. Redeploying updates

```bash
cd /opt/crack-karo
git pull
cd deploy
docker compose --env-file .env run --rm api alembic upgrade head
docker compose --env-file .env up -d --build
```

The frontend is rebuilt and restarted by the same command.

## Security notes

- Keep ports `3000` and `8000` private; only Caddy exposes `80/443`.
- Keep Cloudflare DNS-only unless you intentionally accept Cloudflare seeing
  request bodies (including BYOK keys).
- Caddy terminates TLS on the VM and does not log request bodies by default.
- Do not log API keys in FastAPI, Caddy, Sentry, or any proxy.
- Back up `SECRET_KEY`, `KEY_ENCRYPTION_KEY`, and the Postgres database.
- A single VM is not highly available. Treat it as an early-stage host and keep
  reproducible backups.
