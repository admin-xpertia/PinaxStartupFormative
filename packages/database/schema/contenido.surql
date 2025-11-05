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
DEFINE TABLE programa SCHEMAFULL;

DEFINE FIELD nombre ON programa TYPE string
    ASSERT $value != NONE AND string::len($value) >= 3;

DEFINE FIELD descripcion ON programa TYPE string;

DEFINE FIELD duracion_semanas ON programa TYPE int
    ASSERT $value > 0;

DEFINE FIELD estado ON programa TYPE string
    ASSERT $value IN ['draft', 'publicado', 'archivado']
    DEFAULT 'draft';

DEFINE FIELD version_actual ON programa TYPE string
    DEFAULT '1.0.0';

-- Record Link al creador (debe ser instructor o admin)
DEFINE FIELD creador ON programa TYPE record<user>
    ASSERT $value != NONE;

-- Timestamps
DEFINE FIELD created_at ON programa TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON programa TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX programaEstadoIdx ON programa FIELDS estado;
DEFINE INDEX programaCreadorIdx ON programa FIELDS creador;

-- ----------------------------------------------------------------------------
-- TABLA: version_programa
-- Descripción: Historial de versiones de programas
-- ----------------------------------------------------------------------------
DEFINE TABLE version_programa SCHEMAFULL;

DEFINE FIELD programa ON version_programa TYPE record<programa>
    ASSERT $value != NONE;

DEFINE FIELD version ON version_programa TYPE string
    ASSERT $value != NONE;

DEFINE FIELD cambios_descripcion ON version_programa TYPE string;

DEFINE FIELD contenido_snapshot ON version_programa TYPE object;

DEFINE FIELD creado_por ON version_programa TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD created_at ON version_programa TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX versionProgramaIdx ON version_programa FIELDS programa;

-- ----------------------------------------------------------------------------
-- TABLA: cohorte
-- Descripción: Instancias de ejecución de programas
-- ----------------------------------------------------------------------------
DEFINE TABLE cohorte SCHEMAFULL;

DEFINE FIELD programa ON cohorte TYPE record<programa>
    ASSERT $value != NONE;

DEFINE FIELD nombre ON cohorte TYPE string
    ASSERT $value != NONE;

DEFINE FIELD fecha_inicio ON cohorte TYPE datetime
    ASSERT $value != NONE;

DEFINE FIELD fecha_fin_estimada ON cohorte TYPE datetime;

DEFINE FIELD snapshot_programa ON cohorte TYPE record<snapshot_programa>;

DEFINE FIELD instructor ON cohorte TYPE record<user>;

DEFINE FIELD activo ON cohorte TYPE bool
    DEFAULT true;

-- Timestamps
DEFINE FIELD created_at ON cohorte TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON cohorte TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX cohorteActivoIdx ON cohorte FIELDS activo;
DEFINE INDEX cohorteProgramaIdx ON cohorte FIELDS programa;
DEFINE INDEX cohorteInstructorIdx ON cohorte FIELDS instructor;

-- ----------------------------------------------------------------------------
-- TABLA: fase
-- Descripción: Fases dentro de un programa
-- ----------------------------------------------------------------------------
DEFINE TABLE fase SCHEMAFULL;

DEFINE FIELD programa ON fase TYPE record<programa>
    ASSERT $value != NONE;

DEFINE FIELD numero_fase ON fase TYPE int
    ASSERT $value > 0;

DEFINE FIELD nombre ON fase TYPE string
    ASSERT $value != NONE;

DEFINE FIELD descripcion ON fase TYPE string;

DEFINE FIELD objetivos_aprendizaje ON fase TYPE array
    DEFAULT [];

DEFINE FIELD duracion_semanas_estimada ON fase TYPE int
    ASSERT $value > 0;

DEFINE FIELD orden ON fase TYPE int
    ASSERT $value >= 0;

-- Timestamps
DEFINE FIELD created_at ON fase TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON fase TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX faseProgramaIdx ON fase FIELDS programa;
DEFINE INDEX faseOrdenIdx ON fase FIELDS programa, orden;

-- ----------------------------------------------------------------------------
-- TABLA: fase_documentation
-- Descripción: Documentación extendida de cada fase
-- ----------------------------------------------------------------------------
DEFINE TABLE fase_documentation SCHEMAFULL;

DEFINE FIELD fase ON fase_documentation TYPE record<fase>
    ASSERT $value != NONE;

DEFINE FIELD contexto_general ON fase_documentation TYPE string;

DEFINE FIELD conceptos_clave ON fase_documentation TYPE array
    DEFAULT [];

DEFINE FIELD casos_ejemplo ON fase_documentation TYPE array
    DEFAULT [];

DEFINE FIELD errores_comunes ON fase_documentation TYPE array
    DEFAULT [];

DEFINE FIELD recursos_referencia ON fase_documentation TYPE array
    DEFAULT [];

DEFINE FIELD criterios_evaluacion ON fase_documentation TYPE object
    DEFAULT {};

DEFINE FIELD updated_at ON fase_documentation TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX faseDocFaseIdx ON fase_documentation FIELDS fase UNIQUE;

-- ----------------------------------------------------------------------------
-- TABLA: proof_point
-- Descripción: Proof Points dentro de cada fase
-- ----------------------------------------------------------------------------
DEFINE TABLE proof_point SCHEMAFULL;

DEFINE FIELD fase ON proof_point TYPE record<fase>
    ASSERT $value != NONE;

DEFINE FIELD nombre ON proof_point TYPE string
    ASSERT $value != NONE;

DEFINE FIELD slug ON proof_point TYPE string
    ASSERT $value != NONE;

DEFINE FIELD descripcion ON proof_point TYPE string;

DEFINE FIELD pregunta_central ON proof_point TYPE string;

DEFINE FIELD orden_en_fase ON proof_point TYPE int
    ASSERT $value >= 0;

DEFINE FIELD duracion_estimada_horas ON proof_point TYPE int
    ASSERT $value > 0;

DEFINE FIELD tipo_entregable_final ON proof_point TYPE string;

-- Array de prerequisitos (record links a otros proof points)
-- Este campo permite gestionar dependencias entre proof points de forma más directa
DEFINE FIELD prerequisitos ON proof_point TYPE array<record<proof_point>>
    DEFAULT [];

-- Timestamps
DEFINE FIELD created_at ON proof_point TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON proof_point TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX proofPointFaseIdx ON proof_point FIELDS fase;
DEFINE INDEX proofPointSlugIdx ON proof_point FIELDS slug UNIQUE;
DEFINE INDEX proofPointOrdenIdx ON proof_point FIELDS fase, orden_en_fase;

-- ----------------------------------------------------------------------------
-- TABLA: prerequisitos_proof_point
-- Descripción: Relación de prerrequisitos entre Proof Points
-- ----------------------------------------------------------------------------
DEFINE TABLE prerequisitos_proof_point SCHEMAFULL;

DEFINE FIELD proof_point ON prerequisitos_proof_point TYPE record<proof_point>
    ASSERT $value != NONE;

DEFINE FIELD prerequisito ON prerequisitos_proof_point TYPE record<proof_point>
    ASSERT $value != NONE;

DEFINE FIELD created_at ON prerequisitos_proof_point TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX prereqPPIdx ON prerequisitos_proof_point FIELDS proof_point, prerequisito UNIQUE;

-- ----------------------------------------------------------------------------
-- TABLA: nivel
-- Descripción: Niveles dentro de un Proof Point
-- ----------------------------------------------------------------------------
DEFINE TABLE nivel SCHEMAFULL;

DEFINE FIELD proof_point ON nivel TYPE record<proof_point>
    ASSERT $value != NONE;

DEFINE FIELD numero_nivel ON nivel TYPE int
    ASSERT $value > 0;

DEFINE FIELD nombre ON nivel TYPE string
    ASSERT $value != NONE;

DEFINE FIELD objetivo_especifico ON nivel TYPE string;

-- Criterio de completación con lógica AND/OR
DEFINE FIELD criterio_completacion ON nivel TYPE object
    DEFAULT { logica: 'AND', reglas: [] };

-- Timestamps
DEFINE FIELD created_at ON nivel TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON nivel TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX nivelProofPointIdx ON nivel FIELDS proof_point;
DEFINE INDEX nivelNumeroIdx ON nivel FIELDS proof_point, numero_nivel;

-- ----------------------------------------------------------------------------
-- TABLA: componente
-- Descripción: Componentes de aprendizaje (lección, cuaderno, simulación, herramienta)
-- ----------------------------------------------------------------------------
DEFINE TABLE componente SCHEMAFULL;

DEFINE FIELD nivel ON componente TYPE record<nivel>
    ASSERT $value != NONE;

DEFINE FIELD tipo ON componente TYPE string
    ASSERT $value IN ['leccion', 'cuaderno', 'simulacion', 'herramienta'];

DEFINE FIELD nombre ON componente TYPE string
    ASSERT $value != NONE;

DEFINE FIELD descripcion_breve ON componente TYPE string;

DEFINE FIELD duracion_estimada_minutos ON componente TYPE int
    ASSERT $value > 0;

DEFINE FIELD orden ON componente TYPE int
    ASSERT $value >= 0;

DEFINE FIELD version_contenido_actual ON componente TYPE record<componente_contenido>;

-- Timestamps
DEFINE FIELD created_at ON componente TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON componente TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX componenteNivelIdx ON componente FIELDS nivel;
DEFINE INDEX componenteTipoIdx ON componente FIELDS tipo;
DEFINE INDEX componenteOrdenIdx ON componente FIELDS nivel, orden;

-- ----------------------------------------------------------------------------
-- TABLA: prerequisitos_componente
-- Descripción: Relación de prerrequisitos entre Componentes
-- ----------------------------------------------------------------------------
DEFINE TABLE prerequisitos_componente SCHEMAFULL;

DEFINE FIELD componente ON prerequisitos_componente TYPE record<componente>
    ASSERT $value != NONE;

DEFINE FIELD prerequisito ON prerequisitos_componente TYPE record<componente>
    ASSERT $value != NONE;

DEFINE FIELD created_at ON prerequisitos_componente TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX prereqCompIdx ON prerequisitos_componente FIELDS componente, prerequisito UNIQUE;

-- ----------------------------------------------------------------------------
-- TABLA: componente_contenido
-- Descripción: Contenido de los componentes (estructura polimórfica)
-- ----------------------------------------------------------------------------
DEFINE TABLE componente_contenido SCHEMAFULL;

DEFINE FIELD componente ON componente_contenido TYPE record<componente>
    ASSERT $value != NONE;

DEFINE FIELD tipo ON componente_contenido TYPE string
    ASSERT $value IN ['leccion', 'cuaderno', 'simulacion', 'herramienta'];

-- Contenido polimórfico según el tipo
DEFINE FIELD contenido ON componente_contenido TYPE object
    ASSERT $value != NONE;

DEFINE FIELD estado ON componente_contenido TYPE string
    ASSERT $value IN ['draft', 'revision', 'publicado']
    DEFAULT 'draft';

-- Timestamps
DEFINE FIELD created_at ON componente_contenido TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON componente_contenido TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX compContenidoCompIdx ON componente_contenido FIELDS componente;
DEFINE INDEX compContenidoEstadoIdx ON componente_contenido FIELDS estado;

-- ----------------------------------------------------------------------------
-- TABLA: rubrica_evaluacion
-- Descripción: Rúbricas de evaluación para componentes
-- ----------------------------------------------------------------------------
DEFINE TABLE rubrica_evaluacion SCHEMAFULL;

DEFINE FIELD componente ON rubrica_evaluacion TYPE record<componente>
    ASSERT $value != NONE;

-- Dimensiones de evaluación
DEFINE FIELD dimensiones ON rubrica_evaluacion TYPE array
    DEFAULT [];

-- Descriptores por nivel
DEFINE FIELD descriptores_nivel ON rubrica_evaluacion TYPE object
    DEFAULT {};

-- Pesos de cada dimensión
DEFINE FIELD pesos ON rubrica_evaluacion TYPE object
    DEFAULT {};

-- Timestamps
DEFINE FIELD created_at ON rubrica_evaluacion TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON rubrica_evaluacion TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX rubricaCompIdx ON rubrica_evaluacion FIELDS componente;
