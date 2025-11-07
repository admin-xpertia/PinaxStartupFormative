-- ============================================================================
-- XPERTIA CLASSROOM - STUDENT EXECUTION SCHEMA
-- ============================================================================
-- Schema para gestión de estudiantes, cohortes, progreso y evaluación
-- Fecha: 2025-11-07
-- ============================================================================

USE NS xpertia;
USE DB plataforma;

-- ============================================================================
-- COHORTES Y ESTUDIANTES
-- ============================================================================

-- Tabla: cohorte
-- Una cohorte es una ejecución específica de un programa con estudiantes
DEFINE TABLE IF NOT EXISTS cohorte SCHEMAFULL;

DEFINE FIELD nombre ON cohorte TYPE string ASSERT string::len($value) >= 3;
DEFINE FIELD programa ON cohorte TYPE record<programa>;
DEFINE FIELD instructor ON cohorte TYPE record<user>;
DEFINE FIELD snapshot_programa ON cohorte TYPE option<record<snapshot_programa>>;
DEFINE FIELD fecha_inicio ON cohorte TYPE datetime;
DEFINE FIELD fecha_fin ON cohorte TYPE datetime;
DEFINE FIELD estado ON cohorte TYPE string ASSERT $value IN ['planificado', 'activo', 'finalizado', 'archivado'] DEFAULT 'planificado';
DEFINE FIELD capacidad_maxima ON cohorte TYPE option<number>;
DEFINE FIELD descripcion ON cohorte TYPE option<string>;
DEFINE FIELD configuracion ON cohorte TYPE object DEFAULT {};
DEFINE FIELD created_at ON cohorte TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cohorte TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_cohorte_programa ON cohorte FIELDS programa;
DEFINE INDEX idx_cohorte_instructor ON cohorte FIELDS instructor;
DEFINE INDEX idx_cohorte_estado ON cohorte FIELDS estado;

-- Tabla: estudiante
-- Perfil extendido de un usuario con rol estudiante
DEFINE TABLE IF NOT EXISTS estudiante SCHEMAFULL;

DEFINE FIELD user ON estudiante TYPE record<user>;
DEFINE FIELD metadata ON estudiante TYPE object DEFAULT {};
DEFINE FIELD pais ON estudiante TYPE option<string>;
DEFINE FIELD ciudad ON estudiante TYPE option<string>;
DEFINE FIELD nivel_educativo ON estudiante TYPE option<string>;
DEFINE FIELD intereses ON estudiante TYPE array DEFAULT [];
DEFINE FIELD biografia ON estudiante TYPE option<string>;
DEFINE FIELD avatar_url ON estudiante TYPE option<string>;
DEFINE FIELD created_at ON estudiante TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON estudiante TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_estudiante_user ON estudiante FIELDS user UNIQUE;

-- Tabla: inscripcion_cohorte
-- Relación entre estudiante y cohorte con seguimiento de progreso
DEFINE TABLE IF NOT EXISTS inscripcion_cohorte SCHEMAFULL;

DEFINE FIELD estudiante ON inscripcion_cohorte TYPE record<estudiante>;
DEFINE FIELD cohorte ON inscripcion_cohorte TYPE record<cohorte>;
DEFINE FIELD estado ON inscripcion_cohorte TYPE string ASSERT $value IN ['activo', 'completado', 'abandonado', 'suspendido'] DEFAULT 'activo';
DEFINE FIELD fecha_inscripcion ON inscripcion_cohorte TYPE datetime DEFAULT time::now();
DEFINE FIELD fecha_completacion ON inscripcion_cohorte TYPE option<datetime>;
DEFINE FIELD progreso_general ON inscripcion_cohorte TYPE number DEFAULT 0;
DEFINE FIELD ultima_actividad ON inscripcion_cohorte TYPE option<datetime>;
DEFINE FIELD notas_instructor ON inscripcion_cohorte TYPE option<string>;
DEFINE FIELD created_at ON inscripcion_cohorte TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON inscripcion_cohorte TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_inscripcion_estudiante ON inscripcion_cohorte FIELDS estudiante;
DEFINE INDEX idx_inscripcion_cohorte ON inscripcion_cohorte FIELDS cohorte;
DEFINE INDEX idx_inscripcion_unique ON inscripcion_cohorte FIELDS estudiante, cohorte UNIQUE;

-- ============================================================================
-- PROGRESO DEL ESTUDIANTE
-- ============================================================================

-- Tabla: progreso_proof_point
-- Progreso del estudiante en un proof point completo
DEFINE TABLE IF NOT EXISTS progreso_proof_point SCHEMAFULL;

DEFINE FIELD inscripcion ON progreso_proof_point TYPE record<inscripcion_cohorte>;
DEFINE FIELD estudiante ON progreso_proof_point TYPE record<estudiante>;
DEFINE FIELD proof_point ON progreso_proof_point TYPE record<snapshot_proofpoint>;
DEFINE FIELD estado ON progreso_proof_point TYPE string ASSERT $value IN ['no_iniciado', 'en_progreso', 'completado', 'bloqueado'] DEFAULT 'no_iniciado';
DEFINE FIELD progreso_porcentaje ON progreso_proof_point TYPE number DEFAULT 0;
DEFINE FIELD fecha_inicio ON progreso_proof_point TYPE option<datetime>;
DEFINE FIELD fecha_completacion ON progreso_proof_point TYPE option<datetime>;
DEFINE FIELD ultima_actividad ON progreso_proof_point TYPE option<datetime>;
DEFINE FIELD created_at ON progreso_proof_point TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON progreso_proof_point TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_progreso_pp_estudiante ON progreso_proof_point FIELDS estudiante;
DEFINE INDEX idx_progreso_pp_proof_point ON progreso_proof_point FIELDS proof_point;
DEFINE INDEX idx_progreso_pp_unique ON progreso_proof_point FIELDS estudiante, proof_point UNIQUE;

-- Tabla: progreso_nivel
-- Progreso del estudiante en un nivel específico
DEFINE TABLE IF NOT EXISTS progreso_nivel SCHEMAFULL;

DEFINE FIELD progreso_proof_point ON progreso_nivel TYPE record<progreso_proof_point>;
DEFINE FIELD estudiante ON progreso_nivel TYPE record<estudiante>;
DEFINE FIELD nivel ON progreso_nivel TYPE record<snapshot_nivel>;
DEFINE FIELD estado ON progreso_nivel TYPE string ASSERT $value IN ['no_iniciado', 'en_progreso', 'completado', 'bloqueado'] DEFAULT 'no_iniciado';
DEFINE FIELD progreso_porcentaje ON progreso_nivel TYPE number DEFAULT 0;
DEFINE FIELD score_promedio ON progreso_nivel TYPE option<number>;
DEFINE FIELD fecha_inicio ON progreso_nivel TYPE option<datetime>;
DEFINE FIELD fecha_completacion ON progreso_nivel TYPE option<datetime>;
DEFINE FIELD ultima_actividad ON progreso_nivel TYPE option<datetime>;
DEFINE FIELD created_at ON progreso_nivel TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON progreso_nivel TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_progreso_nivel_estudiante ON progreso_nivel FIELDS estudiante;
DEFINE INDEX idx_progreso_nivel_nivel ON progreso_nivel FIELDS nivel;
DEFINE INDEX idx_progreso_nivel_unique ON progreso_nivel FIELDS estudiante, nivel UNIQUE;

-- Tabla: progreso_componente
-- Progreso detallado del estudiante en un componente/ejercicio
DEFINE TABLE IF NOT EXISTS progreso_componente SCHEMAFULL;

DEFINE FIELD progreso_nivel ON progreso_componente TYPE option<record<progreso_nivel>>;
DEFINE FIELD estudiante ON progreso_componente TYPE record<estudiante>;
DEFINE FIELD componente ON progreso_componente TYPE record<snapshot_componente>;
DEFINE FIELD estado ON progreso_componente TYPE string ASSERT $value IN ['no_iniciado', 'en_progreso', 'completado', 'revision_requerida', 'bloqueado'] DEFAULT 'no_iniciado';
DEFINE FIELD intentos ON progreso_componente TYPE number DEFAULT 0;
DEFINE FIELD tiempo_invertido_minutos ON progreso_componente TYPE number DEFAULT 0;
DEFINE FIELD score ON progreso_componente TYPE option<number>;
DEFINE FIELD feedback_ia ON progreso_componente TYPE option<string>;
DEFINE FIELD notas_estudiante ON progreso_componente TYPE option<string>;
DEFINE FIELD fecha_inicio ON progreso_componente TYPE option<datetime>;
DEFINE FIELD fecha_completacion ON progreso_componente TYPE option<datetime>;
DEFINE FIELD ultima_actividad ON progreso_componente TYPE option<datetime>;
DEFINE FIELD created_at ON progreso_componente TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON progreso_componente TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_progreso_comp_estudiante ON progreso_componente FIELDS estudiante;
DEFINE INDEX idx_progreso_comp_componente ON progreso_componente FIELDS componente;
DEFINE INDEX idx_progreso_comp_estado ON progreso_componente FIELDS estado;
DEFINE INDEX idx_progreso_comp_unique ON progreso_componente FIELDS estudiante, componente UNIQUE;

-- ============================================================================
-- DATOS Y EVALUACIÓN DEL ESTUDIANTE
-- ============================================================================

-- Tabla: datos_estudiante
-- Almacena las respuestas y trabajos del estudiante
DEFINE TABLE IF NOT EXISTS datos_estudiante SCHEMAFULL;

DEFINE FIELD progreso_componente ON datos_estudiante TYPE record<progreso_componente>;
DEFINE FIELD tipo ON datos_estudiante TYPE string ASSERT $value IN ['respuestas_cuaderno', 'trabajo_simulacion', 'entregable', 'trabajo_herramienta', 'otro'];
DEFINE FIELD datos ON datos_estudiante TYPE object;
DEFINE FIELD archivos_adjuntos ON datos_estudiante TYPE array DEFAULT [];
DEFINE FIELD version ON datos_estudiante TYPE number DEFAULT 1;
DEFINE FIELD metadata ON datos_estudiante TYPE object DEFAULT {};
DEFINE FIELD created_at ON datos_estudiante TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON datos_estudiante TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_datos_estudiante_progreso ON datos_estudiante FIELDS progreso_componente;
DEFINE INDEX idx_datos_estudiante_tipo ON datos_estudiante FIELDS tipo;

-- Tabla: evaluacion_resultado
-- Resultados de evaluación (automática o manual) del trabajo del estudiante
DEFINE TABLE IF NOT EXISTS evaluacion_resultado SCHEMAFULL;

DEFINE FIELD progreso_componente ON evaluacion_resultado TYPE record<progreso_componente>;
DEFINE FIELD score_general ON evaluacion_resultado TYPE number;
DEFINE FIELD scores_por_dimension ON evaluacion_resultado TYPE object DEFAULT {};
DEFINE FIELD feedback_general ON evaluacion_resultado TYPE option<string>;
DEFINE FIELD analisis_cualitativo ON evaluacion_resultado TYPE option<string>;
DEFINE FIELD fortalezas ON evaluacion_resultado TYPE array DEFAULT [];
DEFINE FIELD areas_mejora ON evaluacion_resultado TYPE array DEFAULT [];
DEFINE FIELD evaluado_por ON evaluacion_resultado TYPE string ASSERT $value IN ['ai', 'instructor', 'peer', 'auto'];
DEFINE FIELD evaluador_id ON evaluacion_resultado TYPE option<record<user>>;
DEFINE FIELD rubrica_utilizada ON evaluacion_resultado TYPE option<record<snapshot_rubrica>>;
DEFINE FIELD evaluado_at ON evaluacion_resultado TYPE datetime DEFAULT time::now();
DEFINE FIELD created_at ON evaluacion_resultado TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_evaluacion_progreso ON evaluacion_resultado FIELDS progreso_componente;
DEFINE INDEX idx_evaluacion_tipo ON evaluacion_resultado FIELDS evaluado_por;

-- Tabla: feedback_generado
-- Feedback personalizado generado por IA
DEFINE TABLE IF NOT EXISTS feedback_generado SCHEMAFULL;

DEFINE FIELD progreso_componente ON feedback_generado TYPE record<progreso_componente>;
DEFINE FIELD tipo_feedback ON feedback_generado TYPE string ASSERT $value IN ['formativo', 'sumativo', 'motivacional', 'correctivo', 'sugerencia'];
DEFINE FIELD contenido ON feedback_generado TYPE string;
DEFINE FIELD contexto ON feedback_generado TYPE object DEFAULT {};
DEFINE FIELD modelo_ia_utilizado ON feedback_generado TYPE option<string>;
DEFINE FIELD metadata_generacion ON feedback_generado TYPE object DEFAULT {};
DEFINE FIELD visto_por_estudiante ON feedback_generado TYPE bool DEFAULT false;
DEFINE FIELD util_para_estudiante ON feedback_generado TYPE option<bool>;
DEFINE FIELD created_at ON feedback_generado TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_feedback_progreso ON feedback_generado FIELDS progreso_componente;
DEFINE INDEX idx_feedback_tipo ON feedback_generado FIELDS tipo_feedback;
DEFINE INDEX idx_feedback_visto ON feedback_generado FIELDS visto_por_estudiante;

-- ============================================================================
-- ANALYTICS Y MÉTRICAS
-- ============================================================================

-- Tabla: metricas_componente
-- Métricas agregadas de un componente en una cohorte
DEFINE TABLE IF NOT EXISTS metricas_componente SCHEMAFULL;

DEFINE FIELD componente_snapshot ON metricas_componente TYPE record<snapshot_componente>;
DEFINE FIELD cohorte ON metricas_componente TYPE record<cohorte>;
DEFINE FIELD tasa_completacion ON metricas_componente TYPE number;
DEFINE FIELD tiempo_promedio_minutos ON metricas_componente TYPE number;
DEFINE FIELD tiempo_mediana_minutos ON metricas_componente TYPE number;
DEFINE FIELD score_promedio ON metricas_componente TYPE option<number>;
DEFINE FIELD score_mediana ON metricas_componente TYPE option<number>;
DEFINE FIELD estudiantes_count ON metricas_componente TYPE number;
DEFINE FIELD distribucion_scores ON metricas_componente TYPE object DEFAULT {};
DEFINE FIELD calculado_at ON metricas_componente TYPE datetime DEFAULT time::now();
DEFINE FIELD created_at ON metricas_componente TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_metricas_componente ON metricas_componente FIELDS componente_snapshot;
DEFINE INDEX idx_metricas_cohorte ON metricas_componente FIELDS cohorte;

-- Tabla: punto_de_friccion
-- Detección automática de puntos problemáticos en el contenido
DEFINE TABLE IF NOT EXISTS punto_de_friccion SCHEMAFULL;

DEFINE FIELD componente_snapshot ON punto_de_friccion TYPE record<snapshot_componente>;
DEFINE FIELD cohorte ON punto_de_friccion TYPE record<cohorte>;
DEFINE FIELD tipo_problema ON punto_de_friccion TYPE string ASSERT $value IN ['tiempo_excesivo', 'abandono_alto', 'scores_bajos', 'confusion_conceptual', 'bloqueador'];
DEFINE FIELD estudiantes_afectados ON punto_de_friccion TYPE number;
DEFINE FIELD estudiantes_totales ON punto_de_friccion TYPE number;
DEFINE FIELD porcentaje_afectados ON punto_de_friccion TYPE number;
DEFINE FIELD severidad ON punto_de_friccion TYPE string ASSERT $value IN ['baja', 'media', 'alta', 'critica'];
DEFINE FIELD descripcion ON punto_de_friccion TYPE string;
DEFINE FIELD analisis_ia ON punto_de_friccion TYPE option<string>;
DEFINE FIELD sugerencias ON punto_de_friccion TYPE array DEFAULT [];
DEFINE FIELD tiempo_promedio ON punto_de_friccion TYPE option<number>;
DEFINE FIELD tiempo_esperado ON punto_de_friccion TYPE option<number>;
DEFINE FIELD tasa_abandono ON punto_de_friccion TYPE option<number>;
DEFINE FIELD estado ON punto_de_friccion TYPE string ASSERT $value IN ['detectado', 'en_revision', 'en_resolucion', 'resuelto', 'ignorado'] DEFAULT 'detectado';
DEFINE FIELD resolucion ON punto_de_friccion TYPE option<string>;
DEFINE FIELD resuelto_por ON punto_de_friccion TYPE option<record<user>>;
DEFINE FIELD resuelto_at ON punto_de_friccion TYPE option<datetime>;
DEFINE FIELD detectado_at ON punto_de_friccion TYPE datetime DEFAULT time::now();
DEFINE FIELD created_at ON punto_de_friccion TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON punto_de_friccion TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_friccion_componente ON punto_de_friccion FIELDS componente_snapshot;
DEFINE INDEX idx_friccion_cohorte ON punto_de_friccion FIELDS cohorte;
DEFINE INDEX idx_friccion_severidad ON punto_de_friccion FIELDS severidad;
DEFINE INDEX idx_friccion_estado ON punto_de_friccion FIELDS estado;

-- Tabla: analisis_cualitativo
-- Análisis cualitativo de tendencias y patrones en una cohorte
DEFINE TABLE IF NOT EXISTS analisis_cualitativo SCHEMAFULL;

DEFINE FIELD cohorte ON analisis_cualitativo TYPE record<cohorte>;
DEFINE FIELD tema ON analisis_cualitativo TYPE string;
DEFINE FIELD frecuencia ON analisis_cualitativo TYPE number;
DEFINE FIELD sentimiento ON analisis_cualitativo TYPE string ASSERT $value IN ['positivo', 'neutral', 'negativo'];
DEFINE FIELD concepto_erroneo ON analisis_cualitativo TYPE option<string>;
DEFINE FIELD descripcion_error ON analisis_cualitativo TYPE option<string>;
DEFINE FIELD ejemplos_error ON analisis_cualitativo TYPE array DEFAULT [];
DEFINE FIELD componentes_afectados ON analisis_cualitativo TYPE array DEFAULT [];
DEFINE FIELD sugerencias_mejora ON analisis_cualitativo TYPE array DEFAULT [];
DEFINE FIELD created_at ON analisis_cualitativo TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_analisis_cohorte ON analisis_cualitativo FIELDS cohorte;
DEFINE INDEX idx_analisis_sentimiento ON analisis_cualitativo FIELDS sentimiento;

-- ============================================================================
-- SNAPSHOTS (Versionamiento de Contenido)
-- ============================================================================

-- Tabla: snapshot_programa
-- Snapshot inmutable del programa al crear una cohorte
DEFINE TABLE IF NOT EXISTS snapshot_programa SCHEMAFULL;

DEFINE FIELD programa_original ON snapshot_programa TYPE record<programa>;
DEFINE FIELD version ON snapshot_programa TYPE string;
DEFINE FIELD nombre ON snapshot_programa TYPE string;
DEFINE FIELD descripcion ON snapshot_programa TYPE string;
DEFINE FIELD instructor ON snapshot_programa TYPE record<user>;
DEFINE FIELD duracion_semanas ON snapshot_programa TYPE number;
DEFINE FIELD objetivos_aprendizaje ON snapshot_programa TYPE array DEFAULT [];
DEFINE FIELD metadata ON snapshot_programa TYPE object DEFAULT {};
DEFINE FIELD created_at ON snapshot_programa TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_snapshot_programa_original ON snapshot_programa FIELDS programa_original;

-- Tabla: snapshot_fase
DEFINE TABLE IF NOT EXISTS snapshot_fase SCHEMAFULL;

DEFINE FIELD snapshot_programa ON snapshot_fase TYPE record<snapshot_programa>;
DEFINE FIELD fase_original ON snapshot_fase TYPE record<fase>;
DEFINE FIELD nombre ON snapshot_fase TYPE string;
DEFINE FIELD numero_fase ON snapshot_fase TYPE number;
DEFINE FIELD orden ON snapshot_fase TYPE number;
DEFINE FIELD descripcion ON snapshot_fase TYPE option<string>;
DEFINE FIELD duracion_semanas_estimada ON snapshot_fase TYPE option<number>;
DEFINE FIELD objetivos_aprendizaje ON snapshot_fase TYPE array DEFAULT [];
DEFINE FIELD created_at ON snapshot_fase TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_snapshot_fase_programa ON snapshot_fase FIELDS snapshot_programa;
DEFINE INDEX idx_snapshot_fase_original ON snapshot_fase FIELDS fase_original;

-- Tabla: snapshot_proofpoint
DEFINE TABLE IF NOT EXISTS snapshot_proofpoint SCHEMAFULL;

DEFINE FIELD snapshot_fase ON snapshot_proofpoint TYPE record<snapshot_fase>;
DEFINE FIELD proofpoint_original ON snapshot_proofpoint TYPE record<proof_point>;
DEFINE FIELD nombre ON snapshot_proofpoint TYPE string;
DEFINE FIELD pregunta_central ON snapshot_proofpoint TYPE option<string>;
DEFINE FIELD orden_en_fase ON snapshot_proofpoint TYPE number;
DEFINE FIELD descripcion ON snapshot_proofpoint TYPE option<string>;
DEFINE FIELD duracion_estimada_horas ON snapshot_proofpoint TYPE option<number>;
DEFINE FIELD documentacion_contexto ON snapshot_proofpoint TYPE string DEFAULT '';
DEFINE FIELD created_at ON snapshot_proofpoint TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_snapshot_pp_fase ON snapshot_proofpoint FIELDS snapshot_fase;
DEFINE INDEX idx_snapshot_pp_original ON snapshot_proofpoint FIELDS proofpoint_original;

-- Tabla: snapshot_nivel
DEFINE TABLE IF NOT EXISTS snapshot_nivel SCHEMAFULL;

DEFINE FIELD snapshot_proofpoint ON snapshot_nivel TYPE record<snapshot_proofpoint>;
DEFINE FIELD nivel_original ON snapshot_nivel TYPE option<record>;
DEFINE FIELD numero_nivel ON snapshot_nivel TYPE number;
DEFINE FIELD objetivo_especifico ON snapshot_nivel TYPE string;
DEFINE FIELD criterio_completacion ON snapshot_nivel TYPE object DEFAULT {};
DEFINE FIELD created_at ON snapshot_nivel TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_snapshot_nivel_pp ON snapshot_nivel FIELDS snapshot_proofpoint;

-- Tabla: snapshot_componente
DEFINE TABLE IF NOT EXISTS snapshot_componente SCHEMAFULL;

DEFINE FIELD snapshot_nivel ON snapshot_componente TYPE record<snapshot_nivel>;
DEFINE FIELD componente_original ON snapshot_componente TYPE option<record>;
DEFINE FIELD exercise_instance_original ON snapshot_componente TYPE option<record<exercise_instance>>;
DEFINE FIELD tipo ON snapshot_componente TYPE string;
DEFINE FIELD nombre ON snapshot_componente TYPE string;
DEFINE FIELD orden ON snapshot_componente TYPE number;
DEFINE FIELD duracion_estimada_min ON snapshot_componente TYPE option<number>;
DEFINE FIELD es_evaluable ON snapshot_componente TYPE bool DEFAULT false;
DEFINE FIELD es_obligatorio ON snapshot_componente TYPE bool DEFAULT true;
DEFINE FIELD created_at ON snapshot_componente TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_snapshot_comp_nivel ON snapshot_componente FIELDS snapshot_nivel;
DEFINE INDEX idx_snapshot_comp_original ON snapshot_componente FIELDS componente_original;
DEFINE INDEX idx_snapshot_comp_exercise ON snapshot_componente FIELDS exercise_instance_original;

-- Tabla: snapshot_contenido
DEFINE TABLE IF NOT EXISTS snapshot_contenido SCHEMAFULL;

DEFINE FIELD snapshot_componente ON snapshot_contenido TYPE record<snapshot_componente>;
DEFINE FIELD contenido_original ON snapshot_contenido TYPE option<record<exercise_content>>;
DEFINE FIELD contenido ON snapshot_contenido TYPE object;
DEFINE FIELD version ON snapshot_contenido TYPE number DEFAULT 1;
DEFINE FIELD metadata ON snapshot_contenido TYPE object DEFAULT {};
DEFINE FIELD created_at ON snapshot_contenido TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_snapshot_contenido_comp ON snapshot_contenido FIELDS snapshot_componente;

-- Tabla: snapshot_rubrica
DEFINE TABLE IF NOT EXISTS snapshot_rubrica SCHEMAFULL;

DEFINE FIELD snapshot_componente ON snapshot_rubrica TYPE record<snapshot_componente>;
DEFINE FIELD rubrica_original ON snapshot_rubrica TYPE option<record>;
DEFINE FIELD dimensiones ON snapshot_rubrica TYPE array DEFAULT [];
DEFINE FIELD criterios_evaluacion ON snapshot_rubrica TYPE object DEFAULT {};
DEFINE FIELD created_at ON snapshot_rubrica TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_snapshot_rubrica_comp ON snapshot_rubrica FIELDS snapshot_componente;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Permisos para cohorte
PERMISSIONS ON cohorte
  FOR select WHERE true
  FOR create, update, delete WHERE $auth.rol IN ['admin', 'instructor'];

-- Permisos para estudiante
PERMISSIONS ON estudiante
  FOR select WHERE user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR create WHERE $auth.rol IN ['admin', 'instructor', 'estudiante']
  FOR update WHERE user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR delete WHERE $auth.rol = 'admin';

-- Permisos para inscripcion_cohorte
PERMISSIONS ON inscripcion_cohorte
  FOR select WHERE estudiante.user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR create, update, delete WHERE $auth.rol IN ['admin', 'instructor'];

-- Permisos para progreso (todas las tablas de progreso)
PERMISSIONS ON progreso_proof_point
  FOR select WHERE estudiante.user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR create, update WHERE estudiante.user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR delete WHERE $auth.rol = 'admin';

PERMISSIONS ON progreso_nivel
  FOR select WHERE estudiante.user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR create, update WHERE estudiante.user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR delete WHERE $auth.rol = 'admin';

PERMISSIONS ON progreso_componente
  FOR select WHERE estudiante.user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR create, update WHERE estudiante.user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR delete WHERE $auth.rol = 'admin';

-- Permisos para datos_estudiante
PERMISSIONS ON datos_estudiante
  FOR select WHERE progreso_componente.estudiante.user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR create, update WHERE progreso_componente.estudiante.user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR delete WHERE $auth.rol = 'admin';

-- Permisos para evaluacion_resultado
PERMISSIONS ON evaluacion_resultado
  FOR select WHERE progreso_componente.estudiante.user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR create, update WHERE $auth.rol IN ['admin', 'instructor']
  FOR delete WHERE $auth.rol = 'admin';

-- Permisos para feedback_generado
PERMISSIONS ON feedback_generado
  FOR select WHERE progreso_componente.estudiante.user = $auth.id OR $auth.rol IN ['admin', 'instructor']
  FOR create, update WHERE $auth.rol IN ['admin', 'instructor']
  FOR delete WHERE $auth.rol = 'admin';

-- Permisos para métricas y análisis (solo instructores y admin)
PERMISSIONS ON metricas_componente
  FOR select WHERE $auth.rol IN ['admin', 'instructor']
  FOR create, update, delete WHERE $auth.rol IN ['admin', 'instructor'];

PERMISSIONS ON punto_de_friccion
  FOR select WHERE $auth.rol IN ['admin', 'instructor']
  FOR create, update, delete WHERE $auth.rol IN ['admin', 'instructor'];

PERMISSIONS ON analisis_cualitativo
  FOR select WHERE $auth.rol IN ['admin', 'instructor']
  FOR create, update, delete WHERE $auth.rol IN ['admin', 'instructor'];

-- Permisos para snapshots (read-only para todos, write para sistema)
PERMISSIONS ON snapshot_programa FOR select WHERE true;
PERMISSIONS ON snapshot_fase FOR select WHERE true;
PERMISSIONS ON snapshot_proofpoint FOR select WHERE true;
PERMISSIONS ON snapshot_nivel FOR select WHERE true;
PERMISSIONS ON snapshot_componente FOR select WHERE true;
PERMISSIONS ON snapshot_contenido FOR select WHERE true;
PERMISSIONS ON snapshot_rubrica FOR select WHERE true;

-- ============================================================================
-- FINALIZACIÓN
-- ============================================================================
-- Schema de Student Execution inicializado correctamente
