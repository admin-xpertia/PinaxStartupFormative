#!/bin/bash

# ============================================================================
# Reset Database Script
# ============================================================================
# Este script ejecuta el reset y migración completa de la base de datos
#
# Uso:
#   ./reset-db.sh [opciones]
#
# Opciones:
#   --skip-seed    No insertar datos de seed
#   --confirm      Confirmar automáticamente (para CI/CD)
#   --help         Mostrar esta ayuda
#
# Variables de entorno:
#   SURREAL_URL    URL de SurrealDB (default: http://127.0.0.1:8000/rpc)
#   SURREAL_USER   Usuario de SurrealDB (default: root)
#   SURREAL_PASS   Contraseña de SurrealDB (default: root)
#   SURREAL_NS     Namespace (default: xpertia)
#   SURREAL_DB     Database (default: plataforma)
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funciones auxiliares
log() {
  echo -e "${2}${1}${NC}"
}

log_section() {
  echo ""
  echo "================================================================================"
  log "$1" "$CYAN"
  echo "================================================================================"
  echo ""
}

# Cargar variables de entorno desde apps/api/.env si existe
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../../apps/api/.env"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Configuración por defecto
SURREAL_URL="${SURREAL_URL:-http://127.0.0.1:8000/rpc}"
SURREAL_USER="${SURREAL_USER:-root}"
SURREAL_PASS="${SURREAL_PASS:-root}"
SURREAL_NS="${SURREAL_NS:-${SURREAL_NAMESPACE:-xpertia}}"
SURREAL_DB="${SURREAL_DB:-${SURREAL_DATABASE:-plataforma}}"

# Verificar argumentos
if [[ "$1" == "--help" ]]; then
  cat << EOF
Reset Database Script

Este script elimina TODAS las tablas y datos existentes, y aplica el nuevo schema DDD.

Uso:
  ./reset-db.sh [opciones]

Opciones:
  --skip-seed    No insertar datos de seed después de la migración
  --confirm      Confirmar automáticamente (útil para scripts CI/CD)
  --help         Mostrar esta ayuda

Variables de entorno:
  SURREAL_URL    URL de SurrealDB (default: http://127.0.0.1:8000/rpc)
  SURREAL_USER   Usuario de SurrealDB (default: root)
  SURREAL_PASS   Contraseña de SurrealDB (default: root)
  SURREAL_NS     Namespace (default: xpertia)
  SURREAL_DB     Database (default: plataforma)

Ejemplos:
  ./reset-db.sh                        # Reset completo con confirmación
  ./reset-db.sh --confirm              # Reset sin confirmación
  ./reset-db.sh --skip-seed --confirm  # Reset sin seed data

EOF
  exit 0
fi

# Banner
log_section "RESET Y MIGRACIÓN DE BASE DE DATOS"

log "⚠️  ADVERTENCIA: Este script eliminará TODOS los datos existentes" "$RED"
log "⚠️  Esta operación es IRREVERSIBLE" "$RED"
echo ""
log "Base de datos: ${SURREAL_NS}.${SURREAL_DB}" "$YELLOW"
log "URL: ${SURREAL_URL}" "$YELLOW"
echo ""

# Verificar que existe el script TypeScript
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TS_SCRIPT="${SCRIPT_DIR}/reset-and-migrate.ts"

if [ ! -f "$TS_SCRIPT" ]; then
  log "✗ Error: No se encuentra el script reset-and-migrate.ts" "$RED"
  exit 1
fi

# Verificar que existe el schema
SCHEMA_FILE="${SCRIPT_DIR}/schema/schema-ddd.surql"

if [ ! -f "$SCHEMA_FILE" ]; then
  log "✗ Error: No se encuentra el archivo schema-ddd.surql" "$RED"
  exit 1
fi

# Nota: La verificación de conexión se realiza en el script TypeScript
# porque soporta tanto HTTP como WebSocket (ws:// y wss://)
log "Configuración de SurrealDB:" "$BLUE"
log "  URL: ${SURREAL_URL}" "$CYAN"
log "  Namespace: ${SURREAL_NS}" "$CYAN"
log "  Database: ${SURREAL_DB}" "$CYAN"

# Ejecutar el script de migración
log_section "EJECUTANDO MIGRACIÓN"

cd "$SCRIPT_DIR"

# Construir comando con argumentos
CMD="pnpm tsx reset-and-migrate.ts $*"

log "Ejecutando: $CMD" "$BLUE"
echo ""

# Ejecutar
if eval "$CMD"; then
  log_section "✓ MIGRACIÓN COMPLETADA EXITOSAMENTE"

  log "La base de datos ha sido reseteada y el nuevo schema DDD ha sido aplicado." "$GREEN"
  echo ""
  log "Credenciales por defecto:" "$CYAN"
  log "  Admin: admin@xpertia.com / Admin123!" "$GREEN"
  log "  Instructor: instructor@xpertia.com / Instructor123!" "$GREEN"
  echo ""
  log "⚠️  IMPORTANTE: Cambiar estas contraseñas en producción" "$YELLOW"

  exit 0
else
  log_section "✗ ERROR EN LA MIGRACIÓN"
  log "La migración falló. Revisa los logs arriba para más detalles." "$RED"
  exit 1
fi
