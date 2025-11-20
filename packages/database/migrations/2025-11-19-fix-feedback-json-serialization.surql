-- ============================================================================
-- MIGRACIÓN: Cambiar feedback_json y datos_guardados de object a string
-- ============================================================================
-- Fecha: 2025-11-19
-- Motivo: SurrealDB no maneja correctamente objetos complejos con arrays anidados
-- Solución: Serializar como JSON strings
-- Issue: Fix feedback IA vacío y problemas de persistencia
-- ============================================================================

-- Paso 1: Eliminar las definiciones actuales de los campos problemáticos
-- (Esto NO elimina los datos, solo la restricción de tipo)
REMOVE FIELD feedback_json ON exercise_progress;
REMOVE FIELD feedback_data ON exercise_progress;
REMOVE FIELD datos_guardados ON exercise_progress;
REMOVE FIELD datos ON exercise_progress;

-- Paso 2: Redefinir los campos como strings para almacenar JSON serializado
DEFINE FIELD feedback_json ON exercise_progress TYPE option<string>;
DEFINE FIELD feedback_data ON exercise_progress TYPE option<string>;
DEFINE FIELD datos_guardados ON exercise_progress TYPE option<string>;
DEFINE FIELD datos ON exercise_progress TYPE option<string>;

-- Paso 3: Los datos existentes se convertirán automáticamente
-- SurrealDB intentará convertir los objects a strings cuando se lean/escriban
-- El backend ya maneja deserialización con normalizeFeedbackPayload()
-- Los nuevos registros (después del fix de código) se guardarán como strings JSON

-- Paso 4: Verificar la migración
SELECT
  COUNT(*) as total_registros,
  COUNT(feedback_json) as con_feedback_json,
  COUNT(datos_guardados) as con_datos_guardados
FROM exercise_progress;

-- ============================================================================
-- RESULTADO ESPERADO:
-- Deberías ver un objeto con:
-- {
--   total_registros: N,
--   con_feedback_json: X,
--   con_datos_guardados: Y
-- }
-- ============================================================================

-- ============================================================================
-- CAMBIOS EN EL CÓDIGO RELACIONADOS:
-- ============================================================================
-- 1. apps/api/src/application/exercise-progress/use-cases/SubmitExerciseForGrading/SubmitExerciseForGradingUseCase.ts
--    - Ahora serializa feedbackValue y submissionData con JSON.stringify() antes de guardar
--
-- 2. apps/api/src/presentation/controllers/exercise-progress/exercise-progress.controller.ts
--    - normalizeFeedbackPayload() maneja tanto strings como objects (ya existía)
--    - Los datos se deserializan automáticamente al leer
--    - Agregados logs de debugging para submissions endpoint
--
-- 3. apps/instructor-app/app/api/cohorts/[id]/analytics/route.ts
--    - Normalización de IDs antes de comparar cohorts
--    - Logs de debugging para identificar problemas de matching
--
-- 4. No se requieren cambios en el frontend - la API sigue retornando objetos JavaScript
-- ============================================================================

-- ============================================================================
-- ROLLBACK (si es necesario):
-- ============================================================================
-- Si necesitas revertir esta migración:
--
-- REMOVE FIELD feedback_json ON exercise_progress;
-- REMOVE FIELD feedback_data ON exercise_progress;
-- REMOVE FIELD datos_guardados ON exercise_progress;
-- REMOVE FIELD datos ON exercise_progress;
--
-- DEFINE FIELD feedback_json ON exercise_progress TYPE option<object> DEFAULT {};
-- DEFINE FIELD feedback_data ON exercise_progress TYPE option<object> DEFAULT {};
-- DEFINE FIELD datos_guardados ON exercise_progress TYPE option<object> DEFAULT {};
-- DEFINE FIELD datos ON exercise_progress TYPE option<object> DEFAULT {};
--
-- Nota: También deberás revertir los cambios en el código que serializan los datos
-- ============================================================================
