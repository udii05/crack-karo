#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to the Postgres connection string}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/interview-copilot}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/copilot-$STAMP.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$FILE"
echo "Wrote $FILE"

# Keep 14 days locally. Copy this file off the VM as well.
find "$BACKUP_DIR" -type f -name 'copilot-*.sql.gz' -mtime +14 -delete

# Optional: upload to Cloudflare R2 / S3 with rclone or aws-cli.
# rclone copy "$FILE" r2:interview-copilot-backups/
