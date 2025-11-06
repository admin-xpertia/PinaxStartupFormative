-- ============================================================================
-- ESQUEMA DE CONTENIDO Y AUTORÍA
-- ============================================================================
-- Define las tablas para programas, fases, proof points, niveles y componentes
-- Fecha: 2025-11-04
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA: programa
-- Descripción: Programas educativos con sus características principales
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS programa SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (creador = $auth OR creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (creador = $auth OR creador = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD IF NOT EXISTS nombre ON programa TYPE string
    ASSERT $value != NONE AND string::len($value) >= 3;

DEFINE FIELD IF NOT EXISTS descripcion ON programa TYPE string;

DEFINE FIELD IF NOT EXISTS duracion_semanas ON programa TYPE int
    ASSERT $value > 0;

DEFINE FIELD IF NOT EXISTS estado ON programa TYPE string
    ASSERT $value IN ['draft', 'borrador', 'revision', 'publicado', 'archivado']
    DEFAULT 'draft';

DEFINE FIELD IF NOT EXISTS version_actual ON programa TYPE string
    DEFAULT '1.0.0';

-- Campos opcionales del editor
DEFINE FIELD IF NOT EXISTS categoria ON programa TYPE option<string>;
DEFINE FIELD IF NOT EXISTS nivel_dificultad ON programa TYPE option<string>
    ASSERT $value = NONE OR $value IN ['principiante', 'intermedio', 'avanzado'];
DEFINE FIELD IF NOT EXISTS imagen_portada_url ON programa TYPE option<string>;
DEFINE FIELD IF NOT EXISTS objetivos_aprendizaje ON programa TYPE option<array<string>>;
DEFINE FIELD IF NOT EXISTS prerequisitos ON programa TYPE option<array<string>>;
DEFINE FIELD IF NOT EXISTS audiencia_objetivo ON programa TYPE option<string>;
DEFINE FIELD IF NOT EXISTS tags ON programa TYPE option<array<string>>;
DEFINE FIELD IF NOT EXISTS visible ON programa TYPE option<bool> DEFAULT true;

-- Record Link al creador (debe ser instructor o admin)
DEFINE FIELD IF NOT EXISTS creador ON programa TYPE record<user>
    ASSERT $value != NONE;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON programa TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON programa TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS programaEstadoIdx ON programa FIELDS estado;
DEFINE INDEX IF NOT EXISTS programaCreadorIdx ON programa FIELDS creador;

-- ----------------------------------------------------------------------------
-- TABLA: version_programa
-- Descripción: Historial de versiones de programas
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS version_programa SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS programa ON version_programa TYPE record<programa>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS version ON version_programa TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS cambios_descripcion ON version_programa TYPE string;

DEFINE FIELD IF NOT EXISTS contenido_snapshot ON version_programa TYPE object;

DEFINE FIELD IF NOT EXISTS creado_por ON version_programa TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS created_at ON version_programa TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX IF NOT EXISTS versionProgramaIdx ON version_programa FIELDS programa;

-- ----------------------------------------------------------------------------
-- TABLA: cohorte
-- Descripción: Instancias de ejecución de programas
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS cohorte SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (instructor = $auth OR instructor = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (instructor = $auth OR instructor = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD IF NOT EXISTS programa ON cohorte TYPE record<programa>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS nombre ON cohorte TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS fecha_inicio ON cohorte TYPE datetime
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS fecha_fin_estimada ON cohorte TYPE datetime;

DEFINE FIELD IF NOT EXISTS snapshot_programa ON cohorte TYPE record<snapshot_programa>;

DEFINE FIELD IF NOT EXISTS instructor ON cohorte TYPE record<user>;

DEFINE FIELD IF NOT EXISTS activo ON cohorte TYPE bool
    DEFAULT true;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON cohorte TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON cohorte TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS cohorteActivoIdx ON cohorte FIELDS activo;
DEFINE INDEX IF NOT EXISTS cohorteProgramaIdx ON cohorte FIELDS programa;
DEFINE INDEX IF NOT EXISTS cohorteInstructorIdx ON cohorte FIELDS instructor;

-- ----------------------------------------------------------------------------
-- TABLA: fase
-- Descripción: Fases dentro de un programa
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS fase SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (programa.creador = $auth OR programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (programa.creador = $auth OR programa.creador = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD IF NOT EXISTS programa ON fase TYPE record<programa>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS numero_fase ON fase TYPE int
    ASSERT $value > 0;

DEFINE FIELD IF NOT EXISTS nombre ON fase TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS descripcion ON fase TYPE string;

DEFINE FIELD IF NOT EXISTS objetivos_aprendizaje ON fase TYPE array
    DEFAULT [];

DEFINE FIELD IF NOT EXISTS duracion_semanas_estimada ON fase TYPE int
    ASSERT $value > 0;

DEFINE FIELD IF NOT EXISTS orden ON fase TYPE int
    ASSERT $value >= 0;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON fase TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON fase TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS faseProgramaIdx ON fase FIELDS programa;
DEFINE INDEX IF NOT EXISTS faseOrdenIdx ON fase FIELDS programa, orden;

-- ----------------------------------------------------------------------------
-- TABLA: fase_documentation
-- Descripción: Documentación extendida de cada fase
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS fase_documentation SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD IF NOT EXISTS fase ON fase_documentation TYPE record<fase>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS contexto_general ON fase_documentation TYPE string;

DEFINE FIELD IF NOT EXISTS conceptos_clave ON fase_documentation TYPE array
    DEFAULT [];

DEFINE FIELD IF NOT EXISTS casos_ejemplo ON fase_documentation TYPE array
    DEFAULT [];

DEFINE FIELD IF NOT EXISTS errores_comunes ON fase_documentation TYPE array
    DEFAULT [];

DEFINE FIELD IF NOT EXISTS recursos_referencia ON fase_documentation TYPE array
    DEFAULT [];

DEFINE FIELD IF NOT EXISTS criterios_evaluacion ON fase_documentation TYPE object
    DEFAULT {};

DEFINE FIELD IF NOT EXISTS updated_at ON fase_documentation TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS faseDocFaseIdx ON fase_documentation FIELDS fase UNIQUE;

-- ----------------------------------------------------------------------------
-- TABLA: proof_point
-- Descripción: Proof Points dentro de cada fase
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS proof_point SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD IF NOT EXISTS fase ON proof_point TYPE record<fase>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS nombre ON proof_point TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS slug ON proof_point TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS descripcion ON proof_point TYPE string;

DEFINE FIELD IF NOT EXISTS pregunta_central ON proof_point TYPE string;

DEFINE FIELD IF NOT EXISTS orden_en_fase ON proof_point TYPE int
    ASSERT $value >= 0;

DEFINE FIELD IF NOT EXISTS duracion_estimada_horas ON proof_point TYPE int
    ASSERT $value > 0;

DEFINE FIELD IF NOT EXISTS tipo_entregable_final ON proof_point TYPE string;

-- Documentación contextual específica del proof point (markdown)
-- Usado para generar ejercicios con contexto específico
DEFINE FIELD IF NOT EXISTS documentacion_contexto ON proof_point TYPE string
    DEFAULT '';

-- Array de prerequisitos (record links a otros proof points)
-- Este campo permite gestionar dependencias entre proof points de forma más directa
DEFINE FIELD IF NOT EXISTS prerequisitos ON proof_point TYPE array<record<proof_point>>
    DEFAULT [];

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON proof_point TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON proof_point TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS proofPointFaseIdx ON proof_point FIELDS fase;
DEFINE INDEX IF NOT EXISTS proofPointSlugIdx ON proof_point FIELDS slug UNIQUE;
DEFINE INDEX IF NOT EXISTS proofPointOrdenIdx ON proof_point FIELDS fase, orden_en_fase;

-- ----------------------------------------------------------------------------
-- TABLA: prerequisitos_proof_point
-- Descripción: Relación de prerrequisitos entre Proof Points
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS prerequisitos_proof_point SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS proof_point ON prerequisitos_proof_point TYPE record<proof_point>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS prerequisito ON prerequisitos_proof_point TYPE record<proof_point>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS created_at ON prerequisitos_proof_point TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX IF NOT EXISTS prereqPPIdx ON prerequisitos_proof_point FIELDS proof_point, prerequisito UNIQUE;

-- ============================================================================
-- LEGACY TABLES REMOVED
-- ============================================================================
-- The following tables were removed as part of the migration to the new
-- simplified 3-level hierarchy (Programa → Fase → ProofPoint → ExerciseInstance):
-- - nivel (lines 287-320)
-- - componente (lines 325-363)
-- - prerequisitos_componente (lines 368-381)
--
-- See migrations/001-remove-nivel-componente-tables.surql for details.
-- See LEGACY_CLEANUP.md for the complete migration guide.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA: rubrica_evaluacion
-- Descripción: Rúbricas de evaluación para componentes
-- DEPRECATED: This table references the legacy 'componente' table.
-- TODO: Update to reference exercise_instance or remove entirely.
-- ----------------------------------------------------------------------------
DEFINE TABLE rubrica_evaluacion SCHEMAFULL;

-- DEPRECATED: componente field references removed table
-- DEFINE FIELD componente ON rubrica_evaluacion TYPE record<componente>
--     ASSERT $value != NONE;

-- 'dimensiones' contendrá: { nombre: string, peso: int, descriptores: [...] }
DEFINE FIELD dimensiones ON rubrica_evaluacion TYPE array;

DEFINE FIELD pesos_validados ON rubrica_evaluacion TYPE bool
    DEFAULT false;

DEFINE FIELD created_at ON rubrica_evaluacion TYPE datetime
    DEFAULT time::now();

DEFINE FIELD updated_at ON rubrica_evaluacion TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX rubricaCompIdx ON rubrica_evaluacion FIELDS componente;
