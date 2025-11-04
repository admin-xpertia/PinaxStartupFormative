#!/bin/bash

# ============================================================================
# Script de Inicialización del Esquema SurrealDB
# ============================================================================
# Este script ejecuta todos los archivos .surql en el orden correcto
# para inicializar el esquema completo de la base de datos
# ============================================================================

set -e  # Salir si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
SURREAL_URL="${SURREAL_URL:-http://localhost:8000}"
SURREAL_USER="${SURREAL_USER:-root}"
SURREAL_PASS="${SURREAL_PASS:-root}"
NAMESPACE="${NAMESPACE:-xpertia}"
DATABASE="${DATABASE:-plataforma}"

SCHEMA_DIR="$(cd "$(dirname "$0")/schema" && pwd)"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Inicialización del Esquema SurrealDB${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "URL: ${GREEN}${SURREAL_URL}${NC}"
echo -e "Namespace: ${GREEN}${NAMESPACE}${NC}"
echo -e "Database: ${GREEN}${DATABASE}${NC}"
echo ""

# Verificar que surreal CLI está instalado
if ! command -v surreal &> /dev/null; then
    echo -e "${RED}Error: surreal CLI no está instalado${NC}"
    echo "Instala SurrealDB desde: https://surrealdb.com/install"
    exit 1
fi

# Función para ejecutar un archivo .surql
execute_schema() {
    local file=$1
    local filename=$(basename "$file")

    echo -e "${YELLOW}Ejecutando: ${filename}${NC}"

    if surreal sql \
        --endpoint "${SURREAL_URL}" \
        --username "${SURREAL_USER}" \
        --password "${SURREAL_PASS}" \
        --namespace "${NAMESPACE}" \
        --database "${DATABASE}" \
        --file "${file}"; then
        echo -e "${GREEN}✓ ${filename} ejecutado correctamente${NC}"
        echo ""
    else
        echo -e "${RED}✗ Error ejecutando ${filename}${NC}"
        exit 1
    fi
}

# Ejecutar esquemas en orden
echo -e "${BLUE}Iniciando ejecución de esquemas...${NC}"
echo ""

# 1. Autenticación
execute_schema "${SCHEMA_DIR}/auth.surql"

# 2. Contenido y Autoría
execute_schema "${SCHEMA_DIR}/contenido.surql"

# 3. Generación con IA
execute_schema "${SCHEMA_DIR}/generacion.surql"

# 4. Ejecución y Estudiantes
execute_schema "${SCHEMA_DIR}/ejecucion.surql"

# 5. Portafolio
execute_schema "${SCHEMA_DIR}/portafolio.surql"

# 6. Analytics
execute_schema "${SCHEMA_DIR}/analytics.surql"

# 7. Versionamiento
execute_schema "${SCHEMA_DIR}/versiones.surql"

# 8. Inicialización y datos semilla
execute_schema "${SCHEMA_DIR}/init.surql"

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✓ Esquema inicializado correctamente${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}Usuarios creados por defecto:${NC}"
echo -e "  Admin: ${GREEN}admin@xpertia.com${NC} / ${GREEN}changeme123!${NC}"
echo -e "  Instructor: ${GREEN}instructor@xpertia.com${NC} / ${GREEN}instructor123!${NC}"
echo ""
echo -e "${RED}⚠️  IMPORTANTE: Cambiar las contraseñas en producción${NC}"
echo ""
