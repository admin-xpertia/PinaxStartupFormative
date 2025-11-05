-- ============================================================================
-- ESQUEMA DE AUTENTICACIÓN Y USUARIOS
-- ============================================================================
-- Define las tablas para gestión de usuarios, autenticación y permisos
-- Fecha: 2025-11-04
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA: user
-- Descripción: Usuarios del sistema (Instructores, Estudiantes, Admins)
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS user SCHEMAFULL PERMISSIONS
    FOR select WHERE id = $auth OR id = $auth.id
    FOR update WHERE id = $auth OR id = $auth.id
    FOR delete NONE;

-- Campos principales
DEFINE FIELD IF NOT EXISTS email ON user TYPE string
    ASSERT $value != NONE
    AND string::contains($value, '@')
    AND string::len($value) >= 5;

DEFINE FIELD IF NOT EXISTS nombre ON user TYPE string
    ASSERT $value != NONE AND string::len($value) >= 2;

DEFINE FIELD IF NOT EXISTS password_hash ON user TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS rol ON user TYPE string
    ASSERT $value IN ['admin', 'instructor', 'estudiante']
    DEFAULT 'estudiante';

DEFINE FIELD IF NOT EXISTS preferencias ON user TYPE object
    DEFAULT {};

DEFINE FIELD IF NOT EXISTS activo ON user TYPE bool
    DEFAULT true;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON user TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON user TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices para búsquedas rápidas y login
DEFINE INDEX IF NOT EXISTS userEmailIdx ON user FIELDS email UNIQUE;
DEFINE INDEX IF NOT EXISTS userRolIdx ON user FIELDS rol;
DEFINE INDEX IF NOT EXISTS userActivoIdx ON user FIELDS activo;


-- ----------------------------------------------------------------------------
-- TABLA: session
-- Descripción: Sesiones activas de usuarios para control de autenticación
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS session SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS user ON session TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS token ON session TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS ip_address ON session TYPE string;

DEFINE FIELD IF NOT EXISTS user_agent ON session TYPE string;

DEFINE FIELD IF NOT EXISTS expires_at ON session TYPE datetime
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS created_at ON session TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS last_activity ON session TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS sessionTokenIdx ON session FIELDS token UNIQUE;
DEFINE INDEX IF NOT EXISTS sessionUserIdx ON session FIELDS user;
DEFINE INDEX IF NOT EXISTS sessionExpiresIdx ON session FIELDS expires_at;

-- ----------------------------------------------------------------------------
-- TABLA: refresh_token
-- Descripción: Tokens de refresco para mantener sesiones activas
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS refresh_token SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS user ON refresh_token TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS token ON refresh_token TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS expires_at ON refresh_token TYPE datetime
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS revoked ON refresh_token TYPE bool
    DEFAULT false;

DEFINE FIELD IF NOT EXISTS created_at ON refresh_token TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX IF NOT EXISTS refreshTokenIdx ON refresh_token FIELDS token UNIQUE;
DEFINE INDEX IF NOT EXISTS refreshUserIdx ON refresh_token FIELDS user;
DEFINE INDEX IF NOT EXISTS refreshRevokedIdx ON refresh_token FIELDS revoked;

-- ----------------------------------------------------------------------------
-- TABLA: password_reset
-- Descripción: Tokens para reseteo de contraseña
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS password_reset SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS user ON password_reset TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS token ON password_reset TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS expires_at ON password_reset TYPE datetime
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS used ON password_reset TYPE bool
    DEFAULT false;

DEFINE FIELD IF NOT EXISTS created_at ON password_reset TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX IF NOT EXISTS passwordResetTokenIdx ON password_reset FIELDS token UNIQUE;
DEFINE INDEX IF NOT EXISTS passwordResetUserIdx ON password_reset FIELDS user;

-- ----------------------------------------------------------------------------
-- SCOPE: instructor_scope
-- Descripción: Scope para autenticación de instructores y administradores
-- ----------------------------------------------------------------------------
DEFINE SCOPE IF NOT EXISTS instructor_scope
    SESSION 14d
    SIGNUP (
        CREATE user SET
            email = $email,
            nombre = $nombre,
            password_hash = crypto::argon2::generate($password),
            rol = 'instructor',
            activo = true,
            preferencias = {},
            created_at = time::now(),
            updated_at = time::now()
    )
    SIGNIN (
        SELECT * FROM user
        WHERE email = $email
        AND rol IN ['instructor', 'admin']
        AND crypto::argon2::compare(password_hash, $password)
        AND activo = true
    );

-- ----------------------------------------------------------------------------
-- SCOPE: estudiante_scope
-- Descripción: Scope para autenticación de estudiantes
-- ----------------------------------------------------------------------------
DEFINE SCOPE IF NOT EXISTS estudiante_scope
    SESSION 30d
    SIGNUP (
        CREATE user SET
            email = $email,
            nombre = $nombre,
            password_hash = crypto::argon2::generate($password),
            rol = 'estudiante',
            activo = true,
            preferencias = {},
            created_at = time::now(),
            updated_at = time::now()
    )
    SIGNIN (
        SELECT * FROM user
        WHERE email = $email
        AND rol = 'estudiante'
        AND crypto::argon2::compare(password_hash, $password)
        AND activo = true
    );
