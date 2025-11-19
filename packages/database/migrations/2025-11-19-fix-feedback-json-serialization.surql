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

-- Paso 3: Convertir datos existentes que sean objects a strings JSON
-- (Esto actualiza los registros que ya tienen datos)
UPDATE exercise_progress SET
  feedback_json = string::is::string(feedback_json)
    ? feedback_json
    : type::is::none(feedback_json)
      ? NONE
      : <string>feedback_json
WHERE feedback_json != NONE;

UPDATE exercise_progress SET
  feedback_data = string::is::string(feedback_data)
    ? feedback_data
    : type::is::none(feedback_data)
      ? NONE
      : <string>feedback_data
WHERE feedback_data != NONE;

UPDATE exercise_progress SET
  datos_guardados = string::is::string(datos_guardados)
    ? datos_guardados
    : type::is::none(datos_guardados)
      ? NONE
      : <string>datos_guardados
WHERE datos_guardados != NONE;

UPDATE exercise_progress SET
  datos = string::is::string(datos)
    ? datos
    : type::is::none(datos)
      ? NONE
      : <string>datos
WHERE datos != NONE;

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
--
-- 3. No se requieren cambios en el frontend - la API sigue retornando objetos JavaScript
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
