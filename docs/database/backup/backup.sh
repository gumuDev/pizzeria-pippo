#!/usr/bin/env bash
set -euo pipefail

# Genera un backup completo (schema + data) de la base de producción usando
# pg_dump dentro de un contenedor Docker (no requiere pg_dump instalado en el host).
#
# Uso:
#   ./backup.sh "postgresql://usuario:password@host:5432/postgres"
# o dejando DATABASE_URL_PROD en docs/database/backup/.env (gitignored) y corriendo:
#   ./backup.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "${1:-}" ] && [ -f "${SCRIPT_DIR}/.env" ]; then
  set -a
  source "${SCRIPT_DIR}/.env"
  set +a
fi

CONNECTION_STRING="${1:-${DATABASE_URL_PROD:-}}"

if [ -z "$CONNECTION_STRING" ]; then
  echo "Falta el connection string de producción." >&2
  echo "Pasalo como argumento o exportá DATABASE_URL_PROD." >&2
  exit 1
fi

OUTPUT_DIR="$(cd "$SCRIPT_DIR/../local-dumps" && pwd)"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_FILE="pippo-backup-${TIMESTAMP}.sql"

echo "Generando backup en ${OUTPUT_DIR}/${OUTPUT_FILE}..."

docker run --rm \
  -v "${OUTPUT_DIR}:/backup" \
  postgres:17 \
  pg_dump "${CONNECTION_STRING}" --no-owner --no-privileges --format=plain -f "/backup/${OUTPUT_FILE}"

echo "Backup completado: ${OUTPUT_DIR}/${OUTPUT_FILE}"
