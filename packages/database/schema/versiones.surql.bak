-- ============================================================================
-- ESQUEMA DE VERSIONAMIENTO
-- ============================================================================
-- Define las tablas para control de versiones de contenido y programas
-- Fecha: 2025-11-04
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA: version_contenido
-- Descripción: Historial de versiones de contenido de componentes
-- ----------------------------------------------------------------------------
DEFINE TABLE version_contenido SCHEMAFULL;

DEFINE FIELD componente ON version_contenido TYPE record<componente>
    ASSERT $value != NONE;

DEFINE FIELD numero_version ON version_contenido TYPE int
    ASSERT $value > 0;

-- Snapshot del contenido completo
DEFINE FIELD contenido_snapshot ON version_contenido TYPE object
    ASSERT $value != NONE;

DEFINE FIELD cambios_descripcion ON version_contenido TYPE string;

-- Tipo de cambio
DEFINE FIELD tipo_cambio ON version_contenido TYPE string
    ASSERT $value IN ['mayor', 'menor', 'patch', 'revision']
    DEFAULT 'patch';

DEFINE FIELD creado_por ON version_contenido TYPE record<user>
    ASSERT $value != NONE;

-- Checksum para verificar integridad
DEFINE FIELD checksum ON version_contenido TYPE string;

DEFINE FIELD tags ON version_contenido TYPE array
    DEFAULT [];

-- Timestamps
DEFINE FIELD created_at ON version_contenido TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX versionContCompIdx ON version_contenido FIELDS componente;
DEFINE INDEX versionContNumIdx ON version_contenido FIELDS componente, numero_version UNIQUE;

-- ----------------------------------------------------------------------------
-- TABLA: snapshot_programa
-- Descripción: Snapshots completos de programas (versiones congeladas)
-- ----------------------------------------------------------------------------
DEFINE TABLE snapshot_programa SCHEMAFULL;

DEFINE FIELD programa ON snapshot_programa TYPE record<programa>
    ASSERT $value != NONE;

-- Estructura completa del programa congelada
DEFINE FIELD programa_completo ON snapshot_programa TYPE object
    ASSERT $value != NONE;

DEFINE FIELD version ON snapshot_programa TYPE string
    ASSERT $value != NONE;

DEFINE FIELD descripcion ON snapshot_programa TYPE string;

-- Checksum para verificar integridad
DEFINE FIELD checksum ON snapshot_programa TYPE string;

DEFINE FIELD creado_por ON snapshot_programa TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD usado_por_cohortes ON snapshot_programa TYPE int
    DEFAULT 0;

-- Timestamps
DEFINE FIELD created_at ON snapshot_programa TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX snapshotProgIdx ON snapshot_programa FIELDS programa;
DEFINE INDEX snapshotVersionIdx ON snapshot_programa FIELDS programa, version UNIQUE;

-- ----------------------------------------------------------------------------
-- TABLA: cambio_contenido
-- Descripción: Log de cambios realizados en el contenido
-- ----------------------------------------------------------------------------
DEFINE TABLE cambio_contenido SCHEMAFULL;

DEFINE FIELD version_contenido ON cambio_contenido TYPE record<version_contenido>
    ASSERT $value != NONE;

DEFINE FIELD usuario ON cambio_contenido TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD tipo_operacion ON cambio_contenido TYPE string
    ASSERT $value IN ['crear', 'actualizar', 'eliminar', 'restaurar'];

DEFINE FIELD campo_modificado ON cambio_contenido TYPE string;

DEFINE FIELD valor_anterior ON cambio_contenido TYPE string;

DEFINE FIELD valor_nuevo ON cambio_contenido TYPE string;

DEFINE FIELD razon ON cambio_contenido TYPE string;

DEFINE FIELD timestamp ON cambio_contenido TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX cambioVersionIdx ON cambio_contenido FIELDS version_contenido;
DEFINE INDEX cambioUsuarioIdx ON cambio_contenido FIELDS usuario;
DEFINE INDEX cambioTimestampIdx ON cambio_contenido FIELDS timestamp;

-- ----------------------------------------------------------------------------
-- TABLA: comparacion_version
-- Descripción: Comparaciones entre versiones para revisión
-- ----------------------------------------------------------------------------
DEFINE TABLE comparacion_version SCHEMAFULL;

DEFINE FIELD version_anterior ON comparacion_version TYPE record<version_contenido>
    ASSERT $value != NONE;

DEFINE FIELD version_nueva ON comparacion_version TYPE record<version_contenido>
    ASSERT $value != NONE;

-- Diferencias detectadas
DEFINE FIELD diferencias ON comparacion_version TYPE object
    DEFAULT {};

DEFINE FIELD resumen_cambios ON comparacion_version TYPE string;

DEFINE FIELD realizada_por ON comparacion_version TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD created_at ON comparacion_version TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX comparacionVersionesIdx ON comparacion_version FIELDS version_anterior, version_nueva;

-- ----------------------------------------------------------------------------
-- TABLA: rollback_historia
-- Descripción: Historial de rollbacks realizados
-- ----------------------------------------------------------------------------
DEFINE TABLE rollback_historia SCHEMAFULL;

DEFINE FIELD componente ON rollback_historia TYPE record<componente>
    ASSERT $value != NONE;

DEFINE FIELD version_desde ON rollback_historia TYPE record<version_contenido>
    ASSERT $value != NONE;

DEFINE FIELD version_hacia ON rollback_historia TYPE record<version_contenido>
    ASSERT $value != NONE;

DEFINE FIELD realizado_por ON rollback_historia TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD razon ON rollback_historia TYPE string
    ASSERT $value != NONE;

DEFINE FIELD timestamp ON rollback_historia TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX rollbackCompIdx ON rollback_historia FIELDS componente;
DEFINE INDEX rollbackUsuarioIdx ON rollback_historia FIELDS realizado_por;

-- ----------------------------------------------------------------------------
-- TABLA: aprobacion_version
-- Descripción: Flujo de aprobación de versiones
-- ----------------------------------------------------------------------------
DEFINE TABLE aprobacion_version SCHEMAFULL;

DEFINE FIELD version_contenido ON aprobacion_version TYPE record<version_contenido>
    ASSERT $value != NONE;

DEFINE FIELD solicitante ON aprobacion_version TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD aprobadores_requeridos ON aprobacion_version TYPE array<record<user>>
    DEFAULT [];

DEFINE FIELD aprobadores_completados ON aprobacion_version TYPE array<record<user>>
    DEFAULT [];

DEFINE FIELD estado ON aprobacion_version TYPE string
    ASSERT $value IN ['pendiente', 'aprobado', 'rechazado', 'cancelado']
    DEFAULT 'pendiente';

DEFINE FIELD comentarios ON aprobacion_version TYPE array
    DEFAULT [];

DEFINE FIELD fecha_aprobacion ON aprobacion_version TYPE datetime;

DEFINE FIELD fecha_rechazo ON aprobacion_version TYPE datetime;

-- Timestamps
DEFINE FIELD created_at ON aprobacion_version TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON aprobacion_version TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX aprobacionVersionIdx ON aprobacion_version FIELDS version_contenido;
DEFINE INDEX aprobacionEstadoIdx ON aprobacion_version FIELDS estado;
DEFINE INDEX aprobacionSolicitanteIdx ON aprobacion_version FIELDS solicitante;

-- ----------------------------------------------------------------------------
-- TABLA: conflicto_version
-- Descripción: Conflictos detectados en ediciones concurrentes
-- ----------------------------------------------------------------------------
DEFINE TABLE conflicto_version SCHEMAFULL;

DEFINE FIELD componente ON conflicto_version TYPE record<componente>
    ASSERT $value != NONE;

DEFINE FIELD version_base ON conflicto_version TYPE record<version_contenido>
    ASSERT $value != NONE;

DEFINE FIELD version_conflicto_1 ON conflicto_version TYPE record<version_contenido>
    ASSERT $value != NONE;

DEFINE FIELD version_conflicto_2 ON conflicto_version TYPE record<version_contenido>
    ASSERT $value != NONE;

DEFINE FIELD campos_conflicto ON conflicto_version TYPE array
    DEFAULT [];

DEFINE FIELD estado ON conflicto_version TYPE string
    ASSERT $value IN ['detectado', 'en_resolucion', 'resuelto', 'ignorado']
    DEFAULT 'detectado';

DEFINE FIELD resuelto_por ON conflicto_version TYPE record<user>;

DEFINE FIELD version_resolucion ON conflicto_version TYPE record<version_contenido>;

DEFINE FIELD notas_resolucion ON conflicto_version TYPE string;

-- Timestamps
DEFINE FIELD detectado_at ON conflicto_version TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD resuelto_at ON conflicto_version TYPE datetime;

-- Índices
DEFINE INDEX conflictoCompIdx ON conflicto_version FIELDS componente;
DEFINE INDEX conflictoEstadoIdx ON conflicto_version FIELDS estado;
