-- ============================================================================
-- XPERTIA CLASSROOM - DDD SCHEMA
-- ============================================================================
-- Schema basado en Domain-Driven Design
-- Arquitectura: Clean Architecture con 3 Bounded Contexts
-- Fecha: 2024-11-06
-- ============================================================================

-- Configuración de la base de datos
DEFINE NAMESPACE IF NOT EXISTS xpertia;
USE NS xpertia;

DEFINE DATABASE IF NOT EXISTS plataforma;
USE DB plataforma;

-- ============================================================================
-- BOUNDED CONTEXT 1: PROGRAM DESIGN
-- ============================================================================
-- Gestión del diseño de programas educativos

-- Tabla: programa
DEFINE TABLE IF NOT EXISTS programa SCHEMAFULL;

DEFINE FIELD nombre ON programa TYPE string ASSERT string::len($value) >= 3;
DEFINE FIELD descripcion ON programa TYPE string;
DEFINE FIELD duracion_semanas ON programa TYPE number ASSERT $value > 0;
DEFINE FIELD estado ON programa TYPE string ASSERT $value IN ['borrador', 'publicado', 'archivado'] DEFAULT 'borrador';
DEFINE FIELD version_actual ON programa TYPE number DEFAULT 1;
DEFINE FIELD categoria ON programa TYPE option<string>;
DEFINE FIELD nivel_dificultad ON programa TYPE option<string>;
DEFINE FIELD imagen_portada_url ON programa TYPE option<string>;
DEFINE FIELD objetivos_aprendizaje ON programa TYPE array DEFAULT [];
DEFINE FIELD prerequisitos ON programa TYPE array DEFAULT [];
DEFINE FIELD audiencia_objetivo ON programa TYPE option<string>;
DEFINE FIELD tags ON programa TYPE array DEFAULT [];
DEFINE FIELD visible ON programa TYPE bool DEFAULT true;
DEFINE FIELD creador ON programa TYPE record<user>;
DEFINE FIELD created_at ON programa TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON programa TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_programa_estado ON programa FIELDS estado;
DEFINE INDEX idx_programa_creador ON programa FIELDS creador;
DEFINE INDEX idx_programa_visible ON programa FIELDS visible;

-- Tabla: fase
DEFINE TABLE IF NOT EXISTS fase SCHEMAFULL;

DEFINE FIELD programa ON fase TYPE record<programa>;
DEFINE FIELD numero_fase ON fase TYPE number ASSERT $value > 0;
DEFINE FIELD nombre ON fase TYPE string ASSERT string::len($value) >= 3;
DEFINE FIELD descripcion ON fase TYPE option<string>;
DEFINE FIELD objetivos_aprendizaje ON fase TYPE array DEFAULT [];
DEFINE FIELD duracion_semanas ON fase TYPE number ASSERT $value > 0;
DEFINE FIELD orden ON fase TYPE number ASSERT $value >= 0;
DEFINE FIELD created_at ON fase TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON fase TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_fase_programa ON fase FIELDS programa;
DEFINE INDEX idx_fase_orden ON fase FIELDS programa, orden;

-- Tabla: proof_point
DEFINE TABLE IF NOT EXISTS proof_point SCHEMAFULL;

DEFINE FIELD fase ON proof_point TYPE record<fase>;
DEFINE FIELD nombre ON proof_point TYPE string ASSERT string::len($value) >= 3;
DEFINE FIELD slug ON proof_point TYPE string ASSERT string::len($value) >= 3;
DEFINE FIELD descripcion ON proof_point TYPE option<string>;
DEFINE FIELD pregunta_central ON proof_point TYPE option<string>;
DEFINE FIELD orden_en_fase ON proof_point TYPE number ASSERT $value >= 0;
DEFINE FIELD duracion_horas ON proof_point TYPE number ASSERT $value > 0;
DEFINE FIELD tipo_entregable_final ON proof_point TYPE option<string>;
DEFINE FIELD documentacion_contexto ON proof_point TYPE string DEFAULT '';
DEFINE FIELD prerequisitos ON proof_point TYPE array DEFAULT [];
DEFINE FIELD created_at ON proof_point TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON proof_point TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_proof_point_fase ON proof_point FIELDS fase;
DEFINE INDEX idx_proof_point_slug ON proof_point FIELDS slug UNIQUE;
DEFINE INDEX idx_proof_point_orden ON proof_point FIELDS fase, orden_en_fase;

-- ============================================================================
-- BOUNDED CONTEXT 2: EXERCISE CATALOG
-- ============================================================================
-- Catálogo de templates de ejercicios mediados por IA

-- Tabla: exercise_template
DEFINE TABLE IF NOT EXISTS exercise_template SCHEMAFULL;

DEFINE FIELD nombre ON exercise_template TYPE string ASSERT string::len($value) >= 3;
DEFINE FIELD categoria ON exercise_template TYPE string ASSERT $value IN [
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
DEFINE FIELD descripcion ON exercise_template TYPE string;
DEFINE FIELD objetivo_pedagogico ON exercise_template TYPE option<string>;
DEFINE FIELD rol_ia ON exercise_template TYPE option<string>;
DEFINE FIELD configuracion_schema ON exercise_template TYPE object DEFAULT {};
DEFINE FIELD configuracion_default ON exercise_template TYPE object DEFAULT {};
DEFINE FIELD prompt_template ON exercise_template TYPE string ASSERT string::len($value) > 0;
DEFINE FIELD output_schema ON exercise_template TYPE object DEFAULT {};
DEFINE FIELD preview_config ON exercise_template TYPE object DEFAULT {};
DEFINE FIELD icono ON exercise_template TYPE string;
DEFINE FIELD color ON exercise_template TYPE string DEFAULT '#6366f1';
DEFINE FIELD es_oficial ON exercise_template TYPE bool DEFAULT true;
DEFINE FIELD activo ON exercise_template TYPE bool DEFAULT true;
DEFINE FIELD created_at ON exercise_template TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON exercise_template TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_exercise_template_categoria ON exercise_template FIELDS categoria;
DEFINE INDEX idx_exercise_template_activo ON exercise_template FIELDS activo;

-- ============================================================================
-- BOUNDED CONTEXT 3: EXERCISE INSTANCE
-- ============================================================================
-- Instancias de ejercicios asignados a proof points

-- Tabla: exercise_instance
DEFINE TABLE IF NOT EXISTS exercise_instance SCHEMAFULL;

DEFINE FIELD template ON exercise_instance TYPE record<exercise_template>;
DEFINE FIELD proof_point ON exercise_instance TYPE record<proof_point>;
DEFINE FIELD nombre ON exercise_instance TYPE string ASSERT string::len($value) >= 3;
DEFINE FIELD descripcion_breve ON exercise_instance TYPE option<string>;
DEFINE FIELD consideraciones_contexto ON exercise_instance TYPE string DEFAULT '';
DEFINE FIELD configuracion_personalizada ON exercise_instance TYPE object DEFAULT {};
DEFINE FIELD orden ON exercise_instance TYPE number ASSERT $value >= 0;
DEFINE FIELD duracion_estimada_minutos ON exercise_instance TYPE number ASSERT $value > 0;
DEFINE FIELD estado_contenido ON exercise_instance TYPE string ASSERT $value IN ['sin_generar', 'generando', 'draft', 'publicado'] DEFAULT 'sin_generar';
DEFINE FIELD contenido_actual ON exercise_instance TYPE option<record<exercise_content>>;
DEFINE FIELD es_obligatorio ON exercise_instance TYPE bool DEFAULT true;
DEFINE FIELD created_at ON exercise_instance TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON exercise_instance TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_exercise_instance_proof_point ON exercise_instance FIELDS proof_point;
DEFINE INDEX idx_exercise_instance_template ON exercise_instance FIELDS template;
DEFINE INDEX idx_exercise_instance_orden ON exercise_instance FIELDS proof_point, orden;

-- Tabla: exercise_content
DEFINE TABLE IF NOT EXISTS exercise_content SCHEMAFULL;

DEFINE FIELD exercise_instance ON exercise_content TYPE record<exercise_instance>;
DEFINE FIELD version ON exercise_content TYPE number DEFAULT 1;
DEFINE FIELD contenido_generado ON exercise_content TYPE object;
DEFINE FIELD metadata_generacion ON exercise_content TYPE object DEFAULT {};
DEFINE FIELD estado ON exercise_content TYPE string ASSERT $value IN ['draft', 'publicado', 'archivado'] DEFAULT 'draft';
DEFINE FIELD feedback_instructor ON exercise_content TYPE option<string>;
DEFINE FIELD created_at ON exercise_content TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON exercise_content TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_exercise_content_instance ON exercise_content FIELDS exercise_instance;
DEFINE INDEX idx_exercise_content_estado ON exercise_content FIELDS estado;

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================
-- Gestión básica de usuarios

DEFINE TABLE IF NOT EXISTS user SCHEMAFULL;

DEFINE FIELD email ON user TYPE string ASSERT string::is::email($value);
DEFINE FIELD nombre ON user TYPE string ASSERT string::len($value) >= 2;
DEFINE FIELD password_hash ON user TYPE string;
DEFINE FIELD rol ON user TYPE string ASSERT $value IN ['admin', 'instructor', 'estudiante'] DEFAULT 'estudiante';
DEFINE FIELD activo ON user TYPE bool DEFAULT true;
DEFINE FIELD preferencias ON user TYPE object DEFAULT {};
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_user_email ON user FIELDS email UNIQUE;
DEFINE INDEX idx_user_rol ON user FIELDS rol;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Permisos básicos para las tablas

-- Scope para estudiantes (signup crea estudiantes)
DEFINE SCOPE user_scope SESSION 24h
  SIGNIN (
    SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password_hash, $password)
  )
  SIGNUP (
    CREATE user SET
      email = $email,
      nombre = $nombre,
      password_hash = crypto::argon2::generate($password),
      rol = 'estudiante',
      activo = true
  );

-- Scope para instructores (signup crea instructores, signin valida activo)
DEFINE SCOPE instructor_scope SESSION 24h
  SIGNIN (
    SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password_hash, $password) AND rol = 'instructor' AND activo = true
  )
  SIGNUP (
    CREATE user SET
      email = $email,
      nombre = $nombre,
      password_hash = crypto::argon2::generate($password),
      rol = 'instructor',
      activo = true
  );

-- Permisos tabla programa
PERMISSIONS ON programa
  FOR select WHERE visible = true OR creador = $auth.id
  FOR create, update, delete WHERE $auth.rol IN ['admin', 'instructor'];

-- Permisos tabla fase
PERMISSIONS ON fase
  FOR select WHERE true
  FOR create, update, delete WHERE $auth.rol IN ['admin', 'instructor'];

-- Permisos tabla proof_point
PERMISSIONS ON proof_point
  FOR select WHERE true
  FOR create, update, delete WHERE $auth.rol IN ['admin', 'instructor'];

-- Permisos tabla exercise_template
PERMISSIONS ON exercise_template
  FOR select WHERE activo = true OR $auth.rol IN ['admin', 'instructor']
  FOR create, update, delete WHERE $auth.rol IN ['admin'];

-- Permisos tabla exercise_instance
PERMISSIONS ON exercise_instance
  FOR select WHERE true
  FOR create, update, delete WHERE $auth.rol IN ['admin', 'instructor'];

-- Permisos tabla exercise_content
PERMISSIONS ON exercise_content
  FOR select WHERE estado = 'publicado' OR $auth.rol IN ['admin', 'instructor']
  FOR create, update, delete WHERE $auth.rol IN ['admin', 'instructor'];

-- Permisos tabla user
PERMISSIONS ON user
  FOR select WHERE id = $auth.id OR $auth.rol = 'admin'
  FOR create WHERE $auth.rol = 'admin'
  FOR update WHERE id = $auth.id OR $auth.rol = 'admin'
  FOR delete WHERE $auth.rol = 'admin';

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Usuario admin
UPDATE user:admin SET
  email = 'admin@xpertia.com',
  nombre = 'Administrador',
  password_hash = crypto::argon2::generate('Admin123!'),
  rol = 'admin',
  activo = true,
  preferencias = {},
  created_at = time::now(),
  updated_at = time::now();

-- Usuario instructor demo
UPDATE user:instructor_demo SET
  email = 'instructor@xpertia.com',
  nombre = 'Instructor Demo',
  password_hash = crypto::argon2::generate('Instructor123!'),
  rol = 'instructor',
  activo = true,
  preferencias = {},
  created_at = time::now(),
  updated_at = time::now();

-- ============================================================================
-- FINALIZACIÓN
-- ============================================================================
-- Schema DDD inicializado correctamente
-- Admin: admin@xpertia.com / Admin123!
-- Instructor: instructor@xpertia.com / Instructor123!
-- IMPORTANTE: Cambiar contraseñas en producción
