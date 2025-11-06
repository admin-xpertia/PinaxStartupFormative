-- ============================================================================
-- ESQUEMA DE EJERCICIOS MEDIADOS POR IA
-- ============================================================================
-- Define las tablas para el nuevo sistema de ejercicios basado en templates
-- Fecha: 2025-11-06
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA: exercise_template
-- Descripción: Catálogo de 10 tipos de ejercicios mediados por IA
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS exercise_template SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['admin']
    FOR update WHERE $auth != NONE AND $auth.rol IN ['admin']
    FOR delete WHERE $auth != NONE AND $auth.rol IN ['admin'];

DEFINE FIELD IF NOT EXISTS nombre ON exercise_template TYPE string
    ASSERT $value != NONE AND string::len($value) >= 3;

DEFINE FIELD IF NOT EXISTS categoria ON exercise_template TYPE string
    ASSERT $value IN [
        'leccion_interactiva',
        'cuaderno_trabajo',
        'simulacion_interaccion',
        'mentor_asesor_ia',
        'herramienta_analisis',
        'herramienta_creacion',
        'sistema_tracking',
        'herramienta_revision',
        'simulador_entorno',
        'sistema_progresion'
    ];

DEFINE FIELD IF NOT EXISTS descripcion ON exercise_template TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS objetivo_pedagogico ON exercise_template TYPE string;

DEFINE FIELD IF NOT EXISTS rol_ia ON exercise_template TYPE string;

-- Schema JSON que define los campos configurables del ejercicio
-- Ejemplo: { duracion: { type: 'number', default: 20 }, profundidad: { type: 'select', options: ['basica', 'intermedia', 'avanzada'] } }
DEFINE FIELD IF NOT EXISTS configuracion_schema ON exercise_template TYPE object
    DEFAULT {};

-- Configuración default para nuevas instancias
DEFINE FIELD IF NOT EXISTS configuracion_default ON exercise_template TYPE object
    DEFAULT {};

-- Template del prompt para generar contenido con IA
-- Usa placeholders: {{contexto_fase}}, {{proof_point}}, {{configuracion}}, {{consideraciones}}
DEFINE FIELD IF NOT EXISTS prompt_template ON exercise_template TYPE string;

-- Schema del output esperado de la IA (estructura JSON)
DEFINE FIELD IF NOT EXISTS output_schema ON exercise_template TYPE object;

-- Configuración del componente React para preview
DEFINE FIELD IF NOT EXISTS preview_config ON exercise_template TYPE object
    DEFAULT {};

-- Icono y color para la UI
DEFINE FIELD IF NOT EXISTS icono ON exercise_template TYPE string
    DEFAULT '📝';

DEFINE FIELD IF NOT EXISTS color ON exercise_template TYPE string
    DEFAULT '#6366f1';

-- Si es oficial (viene con el sistema) o creado por instructor
DEFINE FIELD IF NOT EXISTS es_oficial ON exercise_template TYPE bool
    DEFAULT true;

DEFINE FIELD IF NOT EXISTS activo ON exercise_template TYPE bool
    DEFAULT true;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON exercise_template TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON exercise_template TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS exerciseTemplateCategoriaIdx ON exercise_template FIELDS categoria;
DEFINE INDEX IF NOT EXISTS exerciseTemplateActivoIdx ON exercise_template FIELDS activo;

-- ----------------------------------------------------------------------------
-- TABLA: exercise_instance
-- Descripción: Instancia de un ejercicio aplicado a un Proof Point
-- Reemplaza la tabla 'componente' y 'nivel'
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS exercise_instance SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (proof_point.fase.programa.creador = $auth OR proof_point.fase.programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (proof_point.fase.programa.creador = $auth OR proof_point.fase.programa.creador = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD IF NOT EXISTS template ON exercise_instance TYPE record<exercise_template>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS proof_point ON exercise_instance TYPE record<proof_point>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS nombre ON exercise_instance TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS descripcion_breve ON exercise_instance TYPE option<string>;

-- Contexto específico que el instructor quiere enfatizar para este ejercicio
-- Ejemplo: "Enfatizar la diferencia entre validación y verificación"
DEFINE FIELD IF NOT EXISTS consideraciones_contexto ON exercise_instance TYPE string
    DEFAULT '';

-- Configuración personalizada para esta instancia (override de template defaults)
DEFINE FIELD IF NOT EXISTS configuracion_personalizada ON exercise_instance TYPE object
    DEFAULT {};

-- Orden de ejecución dentro del Proof Point
DEFINE FIELD IF NOT EXISTS orden ON exercise_instance TYPE int
    ASSERT $value >= 0;

-- Duración estimada en minutos
DEFINE FIELD IF NOT EXISTS duracion_estimada_minutos ON exercise_instance TYPE int
    ASSERT $value > 0
    DEFAULT 20;

-- Estado del contenido generado
DEFINE FIELD IF NOT EXISTS estado_contenido ON exercise_instance TYPE string
    ASSERT $value IN ['sin_generar', 'generando', 'draft', 'publicado']
    DEFAULT 'sin_generar';

-- Link al contenido generado (reemplaza version_contenido_actual)
DEFINE FIELD IF NOT EXISTS contenido_actual ON exercise_instance TYPE option<record<exercise_content>>;

-- Si el ejercicio es obligatorio para completar el proof point
DEFINE FIELD IF NOT EXISTS es_obligatorio ON exercise_instance TYPE bool
    DEFAULT true;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON exercise_instance TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON exercise_instance TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS exerciseInstanceProofPointIdx ON exercise_instance FIELDS proof_point;
DEFINE INDEX IF NOT EXISTS exerciseInstanceTemplateIdx ON exercise_instance FIELDS template;
DEFINE INDEX IF NOT EXISTS exerciseInstanceOrdenIdx ON exercise_instance FIELDS proof_point, orden;
DEFINE INDEX IF NOT EXISTS exerciseInstanceEstadoIdx ON exercise_instance FIELDS estado_contenido;

-- ----------------------------------------------------------------------------
-- TABLA: exercise_content
-- Descripción: Contenido generado para una instancia de ejercicio
-- Reemplaza 'componente_contenido' con estructura simplificada
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS exercise_content SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS exercise_instance ON exercise_content TYPE record<exercise_instance>
    ASSERT $value != NONE;

-- El contenido estructurado según el output_schema del template
DEFINE FIELD IF NOT EXISTS contenido ON exercise_content TYPE object
    ASSERT $value != NONE;

-- Estado: draft (editable por instructor) o publicado (inmutable para cohortes)
DEFINE FIELD IF NOT EXISTS estado ON exercise_content TYPE string
    ASSERT $value IN ['draft', 'publicado']
    DEFAULT 'draft';

-- Link a la request de generación (para trazabilidad)
DEFINE FIELD IF NOT EXISTS generacion_request ON exercise_content TYPE option<record<generacion_request>>;

-- Versión del contenido (para historial)
DEFINE FIELD IF NOT EXISTS version ON exercise_content TYPE int
    DEFAULT 1;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON exercise_content TYPE datetime
    DEFAULT time::now();

DEFINE FIELD IF NOT EXISTS updated_at ON exercise_content TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS exerciseContentInstanceIdx ON exercise_content FIELDS exercise_instance;
DEFINE INDEX IF NOT EXISTS exerciseContentEstadoIdx ON exercise_content FIELDS estado;

-- ----------------------------------------------------------------------------
-- TABLA: exercise_progress
-- Descripción: Progreso del estudiante en ejercicios específicos
-- Reemplaza 'progreso_componente' y 'progreso_nivel'
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS exercise_progress SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE AND (estudiante = $auth OR estudiante = $auth.id OR $auth.rol IN ['instructor', 'admin'])
    FOR create WHERE $auth != NONE AND estudiante = $auth.id
    FOR update WHERE $auth != NONE AND (estudiante = $auth OR estudiante = $auth.id)
    FOR delete WHERE $auth != NONE AND $auth.rol = 'admin';

DEFINE FIELD IF NOT EXISTS exercise_instance ON exercise_progress TYPE record<exercise_instance>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS estudiante ON exercise_progress TYPE record<estudiante>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS cohorte ON exercise_progress TYPE record<cohorte>
    ASSERT $value != NONE;

-- Estado del progreso
DEFINE FIELD IF NOT EXISTS estado ON exercise_progress TYPE string
    ASSERT $value IN ['no_iniciado', 'en_progreso', 'completado', 'pendiente_revision']
    DEFAULT 'no_iniciado';

-- Porcentaje de completitud (0-100)
DEFINE FIELD IF NOT EXISTS porcentaje_completitud ON exercise_progress TYPE int
    ASSERT $value >= 0 AND $value <= 100
    DEFAULT 0;

-- Fecha de inicio y completación
DEFINE FIELD IF NOT EXISTS fecha_inicio ON exercise_progress TYPE option<datetime>;

DEFINE FIELD IF NOT EXISTS fecha_completado ON exercise_progress TYPE option<datetime>;

-- Tiempo total invertido en minutos
DEFINE FIELD IF NOT EXISTS tiempo_invertido_minutos ON exercise_progress TYPE int
    DEFAULT 0;

-- Número de intentos (para ejercicios que permiten reintentos)
DEFINE FIELD IF NOT EXISTS numero_intentos ON exercise_progress TYPE int
    DEFAULT 0;

-- Score final (0-10) si el ejercicio tiene evaluación
DEFINE FIELD IF NOT EXISTS score_final ON exercise_progress TYPE option<float>;

-- Link a los datos del estudiante (respuestas, outputs, etc.)
DEFINE FIELD IF NOT EXISTS datos_estudiante ON exercise_progress TYPE option<record<datos_estudiante>>;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON exercise_progress TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON exercise_progress TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS exerciseProgressStudentIdx ON exercise_progress FIELDS estudiante, cohorte;
DEFINE INDEX IF NOT EXISTS exerciseProgressExerciseIdx ON exercise_progress FIELDS exercise_instance;
DEFINE INDEX IF NOT EXISTS exerciseProgressEstadoIdx ON exercise_progress FIELDS estado;
DEFINE INDEX IF NOT EXISTS exerciseProgressCohortIdx ON exercise_progress FIELDS cohorte;

-- Índice único para prevenir duplicados
DEFINE INDEX IF NOT EXISTS exerciseProgressUniqueIdx ON exercise_progress FIELDS exercise_instance, estudiante, cohorte UNIQUE;
