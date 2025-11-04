# Base de Datos - Xpertia Plataforma

Este paquete contiene el esquema completo de SurrealDB para la plataforma Xpertia, definido usando el modo **SCHEMAFULL** con Record Links para relaciones.

## Estructura del Esquema

El esquema está organizado en módulos por dominio:

### 1. **auth.surql** - Autenticación y Usuarios
- `user`: Usuarios del sistema (admin, instructor, estudiante)
- `session`: Sesiones activas
- `refresh_token`: Tokens de refresco
- `password_reset`: Tokens para reseteo de contraseña
- **SCOPE**: `usuario_scope` para autenticación con Argon2

### 2. **contenido.surql** - Contenido y Autoría
- `programa`: Programas educativos
- `version_programa`: Historial de versiones de programas
- `cohorte`: Instancias de ejecución de programas
- `fase`: Fases dentro de programas
- `fase_documentation`: Documentación extendida de fases
- `proof_point`: Proof Points dentro de fases
- `prerequisitos_proof_point`: Relaciones de prerrequisitos entre PP
- `nivel`: Niveles dentro de Proof Points
- `componente`: Componentes de aprendizaje (lección, cuaderno, simulación, herramienta)
- `prerequisitos_componente`: Relaciones de prerrequisitos entre componentes
- `componente_contenido`: Contenido polimórfico de componentes
- `rubrica_evaluacion`: Rúbricas de evaluación

### 3. **generacion.surql** - Generación con IA
- `generacion_request`: Solicitudes de generación de contenido con IA
- `contenido_generado`: Contenido producido por IA
- `validacion_calidad`: Validación de calidad del contenido generado
- `generacion_feedback`: Feedback humano sobre contenido generado

### 4. **ejecucion.surql** - Ejecución y Estudiantes
- `estudiante`: Perfiles de estudiantes
- `inscripcion_cohorte`: Inscripciones de estudiantes en cohortes
- `progreso_proof_point`: Progreso en Proof Points
- `progreso_nivel`: Progreso en Niveles
- `progreso_componente`: Progreso en Componentes
- `datos_estudiante`: Datos generados por estudiantes (polimórfico)
- `evaluacion_resultado`: Resultados de evaluaciones
- `feedback_generado`: Feedback para evaluaciones

### 5. **portafolio.surql** - Portafolio y Reportes
- `portafolio`: Portafolio de cada estudiante
- `reporte_integral`: Reportes integrales por Proof Point
- `artefacto`: Artefactos creados por estudiantes
- `shared_portfolio_link`: Enlaces para compartir portafolios
- `vista_portafolio`: Log de vistas de portafolios
- `badge`: Insignias y logros
- `estudiante_badge`: Relación estudiantes-badges

### 6. **analytics.surql** - Analytics y Telemetría
- `evento_telemetria`: Eventos de telemetría del sistema
- `metricas_componente`: Métricas agregadas por componente
- `metricas_proof_point`: Métricas agregadas por Proof Point
- `punto_de_friccion`: Detección de puntos de fricción
- `metricas_cohorte`: Métricas generales de cohortes
- `alerta_sistema`: Alertas para instructores y admins

### 7. **versiones.surql** - Versionamiento
- `version_contenido`: Historial de versiones de contenido
- `snapshot_programa`: Snapshots completos de programas
- `cambio_contenido`: Log de cambios realizados
- `comparacion_version`: Comparaciones entre versiones
- `rollback_historia`: Historial de rollbacks
- `aprobacion_version`: Flujo de aprobación de versiones
- `conflicto_version`: Conflictos en ediciones concurrentes

## Instalación y Configuración

### Prerequisitos

1. **Instalar SurrealDB**:
   ```bash
   # macOS/Linux
   curl -sSf https://install.surrealdb.com | sh

   # O con Homebrew
   brew install surrealdb/tap/surreal
   ```

2. **Iniciar SurrealDB**:
   ```bash
   surreal start --log trace --user root --pass root file:data.db
   ```

### Inicializar el Esquema

Ejecutar el script de inicialización:

```bash
cd packages/database
./init-schema.sh
```

El script ejecutará todos los archivos `.surql` en el orden correcto y creará:
- Namespace: `xpertia`
- Database: `plataforma`
- Usuarios por defecto (admin e instructor)
- Badges básicos

### Variables de Entorno

Puedes personalizar la configuración con estas variables:

```bash
export SURREAL_URL="http://localhost:8000"
export SURREAL_USER="root"
export SURREAL_PASS="root"
export NAMESPACE="xpertia"
export DATABASE="plataforma"

./init-schema.sh
```

## Características Clave

### 1. Record Links
Todas las relaciones usan **Record Links** en lugar de UUIDs simples:

```surql
DEFINE FIELD programa ON fase TYPE record<programa>
    ASSERT $value != NONE;
```

Esto permite:
- Navegación natural entre registros relacionados
- Queries de grafo eficientes
- Type safety en las relaciones

### 2. Modo SCHEMAFULL
Todas las tablas están en modo `SCHEMAFULL` para garantizar:
- Validación de datos en la base de datos
- Type safety
- Documentación clara de la estructura

### 3. Validaciones
Validaciones robustas en todos los campos:

```surql
DEFINE FIELD email ON user TYPE string
    ASSERT is::email($value) AND $value != NONE;

DEFINE FIELD rol ON user TYPE string
    ASSERT $value IN ['admin', 'instructor', 'estudiante'];
```

### 4. Timestamps Automáticos
Campos `created_at` y `updated_at` con valores automáticos:

```surql
DEFINE FIELD created_at ON tabla TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON tabla TYPE datetime
    DEFAULT time::now()
    VALUE time::now();
```

### 5. Índices Optimizados
Índices para queries comunes:

```surql
DEFINE INDEX userEmailIdx ON user FIELDS email UNIQUE;
DEFINE INDEX componenteNivelIdx ON componente FIELDS nivel;
```

## Datos Polimórficos

Para campos que varían según el tipo de componente, usamos objetos flexibles:

```surql
DEFINE FIELD contenido ON componente_contenido TYPE object
    ASSERT $value != NONE;
```

Esto permite diferentes estructuras según el tipo (lección, cuaderno, simulación, herramienta).

## Autenticación

El esquema incluye un SCOPE para autenticación:

```surql
DEFINE SCOPE usuario_scope
    SESSION 24h
    SIGNUP (...)
    SIGNIN (...)
```

Usa **Argon2** para hashing de contraseñas.

### Usuarios por Defecto

**⚠️ CAMBIAR EN PRODUCCIÓN**

- **Admin**: `admin@xpertia.com` / `changeme123!`
- **Instructor**: `instructor@xpertia.com` / `instructor123!`

## Queries de Ejemplo

### Obtener un Programa con sus Fases

```surql
SELECT *,
    (SELECT * FROM fase WHERE programa = $parent.id ORDER BY orden) AS fases
FROM programa:programa_id;
```

### Obtener Progreso de un Estudiante

```surql
SELECT *,
    ->progreso_proof_point->proof_point AS proof_points_en_progreso
FROM estudiante:estudiante_id;
```

### Métricas de un Componente

```surql
SELECT * FROM metricas_componente
WHERE componente = componente:componente_id
AND cohorte = cohorte:cohorte_id;
```

## Migraciones

Para modificar el esquema:

1. Edita el archivo `.surql` correspondiente
2. Ejecuta el archivo actualizado:
   ```bash
   surreal sql --file schema/contenido.surql \
     --endpoint http://localhost:8000 \
     --username root --password root \
     --namespace xpertia --database plataforma
   ```

## Próximos Pasos

1. ✅ Esquema definido completamente
2. 🔲 Implementar cliente SurrealDB en `apps/api`
3. 🔲 Crear repositorios DDD que usen el esquema
4. 🔲 Implementar autenticación JWT con el SCOPE
5. 🔲 Conectar frontend `instructor-app` con API

## Recursos

- [SurrealDB Documentation](https://surrealdb.com/docs)
- [SurrealQL Syntax](https://surrealdb.com/docs/surrealql)
- [Record Links](https://surrealdb.com/docs/surrealql/datamodel/records)
- [Scopes & Authentication](https://surrealdb.com/docs/surrealql/statements/define/scope)
