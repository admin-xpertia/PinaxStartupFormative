-- ============================================================================
-- FIX EXERCISE_PROGRESS SCHEMA
-- ============================================================================
-- Reparación del schema de exercise_progress para permitir guardado correcto
-- de datos_guardados como objetos flexibles
--
-- APLICADO: 2025-11-19
-- ============================================================================

-- ⚠️ Esto elimina la tabla y todos sus datos
REMOVE TABLE exercise_progress;

-- Definición limpia y alineada con el código
DEFINE TABLE IF NOT EXISTS exercise_progress SCHEMAFULL;

-- Campos principales
DEFINE FIELD exercise_instance       ON exercise_progress TYPE record<exercise_instance>;
DEFINE FIELD estudiante              ON exercise_progress TYPE record<estudiante>;
DEFINE FIELD cohorte                 ON exercise_progress TYPE option<record<cohorte>>;

-- Estados en español (usado por backend antiguo)
DEFINE FIELD estado ON exercise_progress TYPE string
  ASSERT $value INSIDE ['no_iniciado','en_progreso','completado','pendiente_revision','revision_requerida'];

-- Estados en inglés (usado por backend y UI actual)
DEFINE FIELD status ON exercise_progress TYPE string
  ASSERT $value INSIDE ['not_started','in_progress','submitted_for_review','pending_review','requires_iteration','approved','graded','submitted'];

-- Porcentaje de completitud
DEFINE FIELD porcentaje_completitud  ON exercise_progress TYPE number DEFAULT 0;

-- Fechas importantes
DEFINE FIELD fecha_inicio            ON exercise_progress TYPE option<datetime> DEFAULT time::now();
DEFINE FIELD fecha_completado        ON exercise_progress TYPE option<datetime>;
DEFINE FIELD submitted_at            ON exercise_progress TYPE option<datetime>;
DEFINE FIELD graded_at               ON exercise_progress TYPE option<datetime>;
DEFINE FIELD fecha_ultimo_acceso     ON exercise_progress TYPE option<datetime>;

-- Tiempo y intentos
DEFINE FIELD tiempo_invertido_minutos ON exercise_progress TYPE number DEFAULT 0;
DEFINE FIELD numero_intentos          ON exercise_progress TYPE number DEFAULT 1;

-- Puntajes (opcionales)
DEFINE FIELD ai_score         ON exercise_progress TYPE option<number>;
DEFINE FIELD instructor_score ON exercise_progress TYPE option<number>;
DEFINE FIELD score_final      ON exercise_progress TYPE option<number>;
DEFINE FIELD final_score      ON exercise_progress TYPE option<number>;

-- Feedback y datos
DEFINE FIELD feedback_json       ON exercise_progress TYPE option<object> DEFAULT {};
DEFINE FIELD feedback_data       ON exercise_progress TYPE option<object> DEFAULT {};
DEFINE FIELD manual_feedback     ON exercise_progress TYPE option<string>;
DEFINE FIELD instructor_feedback ON exercise_progress TYPE option<object> DEFAULT {};

-- ⚠️ CRITICAL: datos_guardados debe ser FLEXIBLE (object, no any)
-- Este campo almacena el trabajo del estudiante con estructura variable según el tipo de ejercicio
DEFINE FIELD datos_guardados ON exercise_progress TYPE option<object> DEFAULT {};
DEFINE FIELD datos           ON exercise_progress TYPE option<object> DEFAULT {};

-- Timestamps
DEFINE FIELD created_at ON exercise_progress TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON exercise_progress TYPE datetime DEFAULT time::now();

-- Índices útiles
DEFINE INDEX idx_exercise_progress_unique ON exercise_progress FIELDS exercise_instance, estudiante, cohorte UNIQUE;
DEFINE INDEX idx_exercise_progress_status ON exercise_progress FIELDS status;
DEFINE INDEX idx_exercise_progress_student ON exercise_progress FIELDS estudiante;
DEFINE INDEX idx_exercise_progress_cohorte ON exercise_progress FIELDS cohorte;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

PERMISSIONS ON exercise_progress
  FOR select WHERE
    estudiante = type::thing($auth.id) OR
    $auth.rol IN ['admin', 'instructor']
  FOR create, update WHERE
    estudiante = type::thing($auth.id) OR
    $auth.rol IN ['admin', 'instructor']
  FOR delete WHERE
    $auth.rol = 'admin';

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. datos_guardados es TYPE option<object> DEFAULT {}
--    - Esto permite guardar cualquier estructura JSON
--    - Es flexible para todos los tipos de ejercicios
--    - DEFAULT {} asegura que siempre hay un objeto, no null
--
-- 2. feedback_json, feedback_data también son option<object> DEFAULT {}
--    - Mismo razonamiento que datos_guardados
--
-- 3. El índice UNIQUE en (exercise_instance, estudiante, cohorte)
--    - Asegura que solo haya un registro de progreso por estudiante/ejercicio/cohorte
--
-- 4. Los campos option<datetime> permiten null cuando el estado no se ha alcanzado
--
-- 5. Se mantiene compatibilidad con campos antiguos (estado, datos, score_final)
--    para no romper código legacy
-- ============================================================================
