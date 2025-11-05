#!/bin/bash

# ============================================================================
# Script de Inicialización de SurrealDB
# ============================================================================
# Este script aplica todos los schemas de SurrealDB en el orden correcto
# ============================================================================

set -e  # Salir si hay algún error

echo "=================================================="
echo "Iniciando configuración de SurrealDB"
echo "=================================================="

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cargar variables de entorno desde el archivo .env de la API
if [ -f "../../apps/api/.env" ]; then
    echo -e "${BLUE}Cargando variables de entorno...${NC}"
    export $(cat ../../apps/api/.env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}Advertencia: No se encontró el archivo .env${NC}"
    echo "Usando valores por defecto..."
fi

# Variables de conexión
SURREAL_URL=${SURREAL_URL:-"wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud"}
SURREAL_NAMESPACE=${SURREAL_NAMESPACE:-"StartupFormative"}
SURREAL_DATABASE=${SURREAL_DATABASE:-"Roadmap"}
SURREAL_USER=${SURREAL_USER:-"admin"}
SURREAL_PASS=${SURREAL_PASS:-"xpertia123"}

echo -e "${BLUE}Conexión:${NC}"
echo "  URL: $SURREAL_URL"
echo "  Namespace: $SURREAL_NAMESPACE"
echo "  Database: $SURREAL_DATABASE"
echo ""

# Verificar que surreal CLI está instalado
if ! command -v surreal &> /dev/null; then
    echo -e "${YELLOW}El CLI de SurrealDB no está instalado.${NC}"
    echo "Instalando SurrealDB CLI..."

    # Detectar el sistema operativo
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install surrealdb/tap/surreal
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -sSf https://install.surrealdb.com | sh
    else
        echo "Sistema operativo no soportado. Por favor instala SurrealDB manualmente."
        echo "Visita: https://surrealdb.com/install"
        exit 1
    fi
fi

echo -e "${GREEN}✓ SurrealDB CLI encontrado${NC}"
echo ""

# Función para ejecutar un archivo SQL
execute_schema() {
    local file=$1
    local description=$2

    echo -e "${BLUE}Aplicando: ${description}${NC}"
    echo "  Archivo: $file"

    cat "$file" | surreal sql \
        --endpoint "$SURREAL_URL" \
        --username "$SURREAL_USER" \
        --password "$SURREAL_PASS" \
        --namespace "$SURREAL_NAMESPACE" \
        --database "$SURREAL_DATABASE" \
        --hide-welcome

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Completado${NC}"
    else
        echo -e "${YELLOW}⚠ Hubo un problema${NC}"
    fi
    echo ""
}

# Aplicar schemas en orden
echo -e "${BLUE}=================================================="
echo "Aplicando schemas..."
echo "==================================================${NC}"
echo ""

execute_schema "schema/auth.surql" "1. Esquema de Autenticación"
execute_schema "schema/contenido.surql" "2. Esquema de Contenido y Autoría"
execute_schema "schema/generacion.surql" "3. Esquema de Generación con IA"
execute_schema "schema/ejecucion.surql" "4. Esquema de Ejecución y Estudiantes"
execute_schema "schema/portafolio.surql" "5. Esquema de Portafolio"
execute_schema "schema/analytics.surql" "6. Esquema de Analytics"
execute_schema "schema/versiones.surql" "7. Esquema de Versionamiento"

# Aplicar datos semilla
echo -e "${BLUE}=================================================="
echo "Aplicando datos semilla..."
echo "==================================================${NC}"
echo ""

execute_schema "schema/init.surql" "Datos iniciales y usuarios de prueba"

echo -e "${GREEN}=================================================="
echo "✓ Inicialización completada"
echo "==================================================${NC}"
echo ""
echo "Usuarios de prueba creados:"
echo "  Admin: admin@xpertia.com / changeme123!"
echo "  Instructor: instructor@xpertia.com / instructor123!"
echo ""
echo -e "${YELLOW}IMPORTANTE: Cambiar las contraseñas en producción${NC}"
