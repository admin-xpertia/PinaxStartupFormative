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
DEFINE TABLE IF NOT EXISTS programa SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS nombre ON programa TYPE string
    ASSERT $value != NONE AND string::len($value) >= 3;

DEFINE FIELD IF NOT EXISTS descripcion ON programa TYPE string;

DEFINE FIELD IF NOT EXISTS duracion_semanas ON programa TYPE int
    ASSERT $value > 0;

DEFINE FIELD IF NOT EXISTS estado ON programa TYPE string
    ASSERT $value IN ['draft', 'publicado', 'archivado']
    DEFAULT 'draft';

DEFINE FIELD IF NOT EXISTS version_actual ON programa TYPE string
    DEFAULT '1.0.0';

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
DEFINE TABLE IF NOT EXISTS cohorte SCHEMAFULL;

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
DEFINE TABLE IF NOT EXISTS fase SCHEMAFULL;

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
DEFINE TABLE IF NOT EXISTS fase_documentation SCHEMAFULL;

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
DEFINE TABLE IF NOT EXISTS proof_point SCHEMAFULL;

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

-- ----------------------------------------------------------------------------
-- TABLA: nivel
-- Descripción: Niveles dentro de un Proof Point
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS nivel SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS proof_point ON nivel TYPE record<proof_point>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS numero_nivel ON nivel TYPE int
    ASSERT $value > 0;

DEFINE FIELD IF NOT EXISTS nombre ON nivel TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS objetivo_especifico ON nivel TYPE string;

-- Criterio de completación con lógica AND/OR
DEFINE FIELD IF NOT EXISTS criterio_completacion ON nivel TYPE object
    DEFAULT { logica: 'AND', reglas: [] };

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON nivel TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON nivel TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS nivelProofPointIdx ON nivel FIELDS proof_point;
DEFINE INDEX IF NOT EXISTS nivelNumeroIdx ON nivel FIELDS proof_point, numero_nivel;

-- ----------------------------------------------------------------------------
-- TABLA: componente
-- Descripción: Componentes de aprendizaje (lección, cuaderno, simulación, herramienta)
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS componente SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS nivel ON componente TYPE record<nivel>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS tipo ON componente TYPE string
    ASSERT $value IN ['leccion', 'cuaderno', 'simulacion', 'herramienta'];

DEFINE FIELD IF NOT EXISTS nombre ON componente TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS descripcion_breve ON componente TYPE string;

DEFINE FIELD IF NOT EXISTS duracion_estimada_minutos ON componente TYPE int
    ASSERT $value > 0;

DEFINE FIELD IF NOT EXISTS orden ON componente TYPE int
    ASSERT $value >= 0;

DEFINE FIELD IF NOT EXISTS version_contenido_actual ON componente TYPE record<componente_contenido>;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON componente TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON componente TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS componenteNivelIdx ON componente FIELDS nivel;
DEFINE INDEX IF NOT EXISTS componenteTipoIdx ON componente FIELDS tipo;
DEFINE INDEX IF NOT EXISTS componenteOrdenIdx ON componente FIELDS nivel, orden;

-- ----------------------------------------------------------------------------
-- TABLA: prerequisitos_componente
-- Descripción: Relación de prerrequisitos entre Componentes
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS prerequisitos_componente SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS componente ON prerequisitos_componente TYPE record<componente>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS prerequisito ON prerequisitos_componente TYPE record<componente>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS created_at ON prerequisitos_componente TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE INDEX IF NOT EXISTS prereqCompIdx ON prerequisitos_componente FIELDS componente, prerequisito UNIQUE;

-- ----------------------------------------------------------------------------
-- TABLA: rubrica_evaluacion
-- Descripción: Rúbricas de evaluación para componentes
-- ----------------------------------------------------------------------------
DEFINE TABLE rubrica_evaluacion SCHEMAFULL;

DEFINE FIELD componente ON rubrica_evaluacion TYPE record<componente>
    ASSERT $value != NONE;

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
