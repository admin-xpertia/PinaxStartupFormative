-- ============================================================================
-- QUERIES DE EJEMPLO - Xpertia Plataforma
-- ============================================================================
-- Colección de queries útiles para trabajar con el esquema
-- ============================================================================

-- ============================================================================
-- AUTENTICACIÓN Y USUARIOS
-- ============================================================================

-- Crear un nuevo instructor
CREATE user SET
    email = 'nuevo.instructor@xpertia.com',
    nombre = 'Nuevo Instructor',
    password_hash = crypto::argon2::generate('password123'),
    rol = 'instructor',
    activo = true,
    preferencias = {},
    created_at = time::now(),
    updated_at = time::now();

-- Buscar usuario por email
SELECT * FROM user WHERE email = 'instructor@xpertia.com';

-- Listar todos los instructores activos
SELECT * FROM user WHERE rol = 'instructor' AND activo = true;

-- Verificar contraseña
SELECT * FROM user
WHERE email = 'admin@xpertia.com'
AND crypto::argon2::compare(password_hash, 'changeme123!');

-- ============================================================================
-- PROGRAMAS Y CONTENIDO
-- ============================================================================

-- Crear un programa completo
LET $programa = CREATE programa SET
    nombre = 'Programa de Data Science',
    descripcion = 'Aprende ciencia de datos desde cero',
    duracion_semanas = 12,
    estado = 'draft',
    version_actual = '1.0.0',
    creador = user:instructor_demo,
    created_at = time::now(),
    updated_at = time::now();

-- Crear una fase para el programa
LET $fase = CREATE fase SET
    programa = $programa.id,
    numero_fase = 1,
    nombre = 'Fundamentos de Python',
    descripcion = 'Aprende los fundamentos del lenguaje Python',
    objetivos_aprendizaje = [
        'Entender variables y tipos de datos',
        'Dominar estructuras de control',
        'Escribir funciones'
    ],
    duracion_semanas_estimada = 3,
    orden = 0,
    created_at = time::now(),
    updated_at = time::now();

-- Crear un Proof Point
LET $pp = CREATE proof_point SET
    fase = $fase.id,
    nombre = 'Variables y Tipos de Datos',
    slug = 'variables-y-tipos',
    descripcion = 'Comprende cómo Python maneja datos',
    pregunta_central = '¿Cómo almacena Python diferentes tipos de información?',
    orden_en_fase = 0,
    duracion_estimada_horas = 4,
    tipo_entregable_final = 'notebook',
    created_at = time::now(),
    updated_at = time::now();

-- Obtener un programa con todas sus fases
SELECT *,
    (SELECT * FROM fase WHERE programa = $parent.id ORDER BY orden) AS fases
FROM programa WHERE id = programa:programa_id;

-- Obtener una fase con todos sus proof points
SELECT *,
    (SELECT * FROM proof_point WHERE fase = $parent.id ORDER BY orden_en_fase) AS proof_points
FROM fase WHERE id = fase:fase_id;

-- Obtener estructura completa: Programa > Fases > Proof Points > Niveles > Componentes
SELECT *,
    (SELECT *,
        (SELECT *,
            (SELECT *,
                (SELECT * FROM componente WHERE nivel = $parent.id ORDER BY orden) AS componentes
            FROM nivel WHERE proof_point = $parent.id ORDER BY numero_nivel) AS niveles
        FROM proof_point WHERE fase = $parent.id ORDER BY orden_en_fase) AS proof_points
    FROM fase WHERE programa = $parent.id ORDER BY orden) AS fases
FROM programa WHERE id = programa:programa_id;

-- Buscar componentes por tipo
SELECT * FROM componente WHERE tipo = 'cuaderno';

-- ============================================================================
-- COHORTES E INSCRIPCIONES
-- ============================================================================

-- Crear una cohorte
LET $cohorte = CREATE cohorte SET
    programa = programa:programa_id,
    nombre = 'Cohorte Enero 2025',
    fecha_inicio = time::now(),
    fecha_fin_estimada = <datetime>"2025-04-01T00:00:00Z",
    instructor = user:instructor_demo,
    activo = true,
    created_at = time::now(),
    updated_at = time::now();

-- Inscribir estudiante en cohorte
CREATE inscripcion_cohorte SET
    estudiante = estudiante:estudiante_id,
    cohorte = cohorte:cohorte_id,
    estado = 'activo',
    fecha_inscripcion = time::now(),
    progreso_general = 0.0,
    created_at = time::now(),
    updated_at = time::now();

-- Obtener estudiantes de una cohorte
SELECT *,
    ->estudiante.* AS estudiante_info
FROM inscripcion_cohorte
WHERE cohorte = cohorte:cohorte_id
AND estado = 'activo';

-- Contar estudiantes por estado en una cohorte
SELECT estado, count() AS cantidad
FROM inscripcion_cohorte
WHERE cohorte = cohorte:cohorte_id
GROUP BY estado;

-- ============================================================================
-- PROGRESO DE ESTUDIANTES
-- ============================================================================

-- Iniciar progreso en un Proof Point
CREATE progreso_proof_point SET
    estudiante = estudiante:estudiante_id,
    proof_point = proof_point:pp_id,
    estado = 'en_progreso',
    fecha_inicio = time::now(),
    score_final = 0.0,
    tiempo_total_minutos = 0,
    created_at = time::now(),
    updated_at = time::now();

-- Iniciar progreso en un componente
CREATE progreso_componente SET
    progreso_nivel = progreso_nivel:nivel_id,
    estudiante = estudiante:estudiante_id,
    componente = componente:componente_id,
    estado = 'en_progreso',
    intentos = 1,
    tiempo_invertido_minutos = 0,
    score = 0.0,
    fecha_inicio = time::now(),
    ultima_actividad = time::now(),
    created_at = time::now(),
    updated_at = time::now();

-- Obtener progreso completo de un estudiante
SELECT *,
    (SELECT *,
        ->proof_point.* AS proof_point_info
    FROM progreso_proof_point WHERE estudiante = $parent.id) AS progreso_proof_points
FROM estudiante WHERE id = estudiante:estudiante_id;

-- Obtener componentes completados por un estudiante
SELECT *,
    ->componente.* AS componente_info
FROM progreso_componente
WHERE estudiante = estudiante:estudiante_id
AND estado = 'completado'
ORDER BY fecha_completacion DESC;

-- Calcular progreso porcentual en un Proof Point
LET $total_componentes = (
    SELECT count() FROM componente
    WHERE nivel IN (SELECT id FROM nivel WHERE proof_point = proof_point:pp_id)
).count;

LET $completados = (
    SELECT count() FROM progreso_componente
    WHERE estudiante = estudiante:estudiante_id
    AND estado = 'completado'
    AND componente IN (
        SELECT id FROM componente
        WHERE nivel IN (SELECT id FROM nivel WHERE proof_point = proof_point:pp_id)
    )
).count;

RETURN {
    total: $total_componentes,
    completados: $completados,
    porcentaje: ($completados / $total_componentes) * 100
};

-- ============================================================================
-- EVALUACIONES Y FEEDBACK
-- ============================================================================

-- Crear resultado de evaluación
CREATE evaluacion_resultado SET
    progreso_componente = progreso_componente:prog_comp_id,
    score_general = 85.5,
    scores_por_dimension = {
        comprension: 90,
        aplicacion: 85,
        sintaxis: 80
    },
    analisis_cualitativo = 'Buen dominio de conceptos básicos',
    evaluado_por = 'ai',
    evaluado_at = time::now();

-- Generar feedback para evaluación
CREATE feedback_generado SET
    evaluacion_resultado = evaluacion_resultado:eval_id,
    feedback_texto = 'Excelente trabajo en la comprensión de variables...',
    highlights_positivos = [
        'Uso correcto de tipos de datos',
        'Nomenclatura clara de variables'
    ],
    areas_mejora = [
        'Practicar más con listas',
        'Revisar operadores lógicos'
    ],
    siguientes_pasos = [
        'Completar ejercicios adicionales de listas',
        'Revisar documentación sobre operadores'
    ],
    recursos_recomendados = [
        'Python Lists Tutorial',
        'Logical Operators Guide'
    ],
    created_at = time::now();

-- Obtener feedback de un estudiante para un componente
SELECT *,
    ->evaluacion_resultado.* AS evaluacion,
    ->evaluacion_resultado->feedback_generado.* AS feedback
FROM progreso_componente
WHERE estudiante = estudiante:estudiante_id
AND componente = componente:componente_id;

-- ============================================================================
-- PORTAFOLIO
-- ============================================================================

-- Crear portafolio para estudiante
CREATE portafolio SET
    estudiante = estudiante:estudiante_id,
    configuracion_privacidad = {
        publico: false,
        mostrar_scores: true,
        mostrar_feedback: true
    },
    titulo = 'Mi Portafolio de Aprendizaje',
    descripcion = 'Colección de mis trabajos y proyectos',
    tema = 'default',
    created_at = time::now(),
    updated_at = time::now();

-- Agregar artefacto al portafolio
CREATE artefacto SET
    portafolio = portafolio:portafolio_id,
    tipo = 'documento',
    nombre = 'Análisis de Datos de Ventas',
    descripcion = 'Proyecto final del Proof Point de análisis',
    file_url = 'https://storage.example.com/artifacts/analisis-ventas.pdf',
    file_size_bytes = 1024000,
    mime_type = 'application/pdf',
    proof_point = proof_point:pp_id,
    metadata = {},
    tags = ['analisis', 'ventas', 'python'],
    destacado = true,
    created_at = time::now(),
    updated_at = time::now();

-- Crear enlace compartido para portafolio
CREATE shared_portfolio_link SET
    portafolio = portafolio:portafolio_id,
    token = rand::uuid::v4(),
    nombre_link = 'Mi Portafolio Público',
    password_protegido = false,
    activo = true,
    elementos_incluidos = {
        reportes: true,
        artefactos: true,
        scores: true,
        feedback: false
    },
    created_at = time::now(),
    updated_at = time::now();

-- Obtener portafolio completo con artefactos
SELECT *,
    (SELECT * FROM artefacto WHERE portafolio = $parent.id ORDER BY created_at DESC) AS artefactos,
    (SELECT * FROM reporte_integral WHERE portafolio = $parent.id) AS reportes
FROM portafolio WHERE estudiante = estudiante:estudiante_id;

-- ============================================================================
-- ANALYTICS Y MÉTRICAS
-- ============================================================================

-- Registrar evento de telemetría
CREATE evento_telemetria SET
    estudiante = estudiante:estudiante_id,
    componente = componente:componente_id,
    tipo_evento = 'completado',
    metadata = {
        tiempo_total: 45,
        intentos: 1
    },
    duracion_ms = 2700000,
    timestamp = time::now(),
    session_id = 'session_123',
    dispositivo = 'desktop';

-- Calcular métricas de un componente
LET $progresos = SELECT * FROM progreso_componente WHERE componente = componente:componente_id;
LET $completados = SELECT * FROM $progresos WHERE estado = 'completado';

CREATE metricas_componente SET
    componente = componente:componente_id,
    cohorte = cohorte:cohorte_id,
    tasa_completacion = (count($completados) / count($progresos)) * 100,
    tiempo_promedio_minutos = math::mean($completados.tiempo_invertido_minutos),
    score_promedio = math::mean($completados.score),
    estudiantes_count = count($progresos),
    calculado_at = time::now(),
    created_at = time::now(),
    updated_at = time::now();

-- Detectar punto de fricción
CREATE punto_de_friccion SET
    componente = componente:componente_id,
    cohorte = cohorte:cohorte_id,
    tipo_problema = 'tiempo_excesivo',
    estudiantes_afectados = 15,
    porcentaje_afectados = 45.5,
    severidad = 'alta',
    descripcion = 'Los estudiantes tardan 3x más de lo estimado',
    datos_soporte = {
        tiempo_estimado: 30,
        tiempo_promedio: 90
    },
    estado = 'detectado',
    detectado_at = time::now(),
    created_at = time::now(),
    updated_at = time::now();

-- Obtener métricas de cohorte
SELECT
    count() AS total_estudiantes,
    count(WHERE estado = 'activo') AS activos,
    math::mean(progreso_general) AS progreso_promedio
FROM inscripcion_cohorte
WHERE cohorte = cohorte:cohorte_id;

-- Obtener puntos de fricción activos
SELECT *,
    ->componente.* AS componente_info
FROM punto_de_friccion
WHERE cohorte = cohorte:cohorte_id
AND estado IN ['detectado', 'en_revision']
ORDER BY severidad DESC, detectado_at DESC;

-- ============================================================================
-- BADGES Y LOGROS
-- ============================================================================

-- Otorgar badge a estudiante
CREATE estudiante_badge SET
    estudiante = estudiante:estudiante_id,
    badge = badge:completacion_fase,
    proof_point = proof_point:pp_id,
    obtenido_at = time::now(),
    visible_en_portafolio = true;

-- Obtener badges de un estudiante
SELECT *,
    ->badge.* AS badge_info
FROM estudiante_badge
WHERE estudiante = estudiante:estudiante_id
ORDER BY obtenido_at DESC;

-- Contar badges por tipo
SELECT badge->tipo AS tipo, count() AS cantidad
FROM estudiante_badge
WHERE estudiante = estudiante:estudiante_id
GROUP BY badge->tipo;

-- ============================================================================
-- VERSIONAMIENTO
-- ============================================================================

-- Crear nueva versión de contenido
CREATE version_contenido SET
    componente = componente:componente_id,
    numero_version = 2,
    contenido_snapshot = {
        titulo: 'Variables en Python',
        contenido: '...'
    },
    cambios_descripcion = 'Actualización de ejemplos y ejercicios',
    tipo_cambio = 'menor',
    creado_por = user:instructor_demo,
    tags = ['actualizado', 'ejercicios'],
    created_at = time::now();

-- Obtener historial de versiones de un componente
SELECT * FROM version_contenido
WHERE componente = componente:componente_id
ORDER BY numero_version DESC;

-- Comparar dos versiones
SELECT
    v1.numero_version AS version_anterior,
    v2.numero_version AS version_nueva,
    v1.contenido_snapshot AS contenido_anterior,
    v2.contenido_snapshot AS contenido_nuevo
FROM version_contenido v1, version_contenido v2
WHERE v1.id = version_contenido:version1_id
AND v2.id = version_contenido:version2_id;

-- ============================================================================
-- QUERIES AVANZADOS
-- ============================================================================

-- Obtener estudiantes en riesgo (bajo progreso)
SELECT *,
    ->estudiante.* AS estudiante_info,
    ->estudiante->user.nombre AS nombre_estudiante
FROM inscripcion_cohorte
WHERE cohorte = cohorte:cohorte_id
AND estado = 'activo'
AND progreso_general < 30
ORDER BY progreso_general ASC;

-- Ranking de estudiantes por score en un Proof Point
SELECT
    estudiante,
    ->estudiante->user.nombre AS nombre,
    score_final,
    tiempo_total_minutos
FROM progreso_proof_point
WHERE proof_point = proof_point:pp_id
AND estado = 'completado'
ORDER BY score_final DESC, tiempo_total_minutos ASC
LIMIT 10;

-- Componentes más desafiantes (mayor tiempo y menor score)
SELECT
    componente,
    ->componente.nombre AS nombre_componente,
    math::mean(tiempo_invertido_minutos) AS tiempo_promedio,
    math::mean(score) AS score_promedio,
    count() AS estudiantes
FROM progreso_componente
WHERE estado = 'completado'
GROUP BY componente
HAVING score_promedio < 70
ORDER BY tiempo_promedio DESC;

-- Actividad reciente de un estudiante
SELECT
    tipo_evento,
    componente->nombre AS componente_nombre,
    timestamp
FROM evento_telemetria
WHERE estudiante = estudiante:estudiante_id
ORDER BY timestamp DESC
LIMIT 20;
