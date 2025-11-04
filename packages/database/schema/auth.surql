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
DEFINE TABLE user SCHEMAFULL;

-- Campos principales
DEFINE FIELD email ON user TYPE string
    ASSERT $value != NONE
    AND string::contains($value, '@')
    AND string::len($value) >= 5;

DEFINE FIELD nombre ON user TYPE string
    ASSERT $value != NONE AND string::len($value) >= 2;

DEFINE FIELD password_hash ON user TYPE string
    ASSERT $value != NONE;

DEFINE FIELD rol ON user TYPE string
    ASSERT $value IN ['admin', 'instructor', 'estudiante']
    DEFAULT 'estudiante';

DEFINE FIELD preferencias ON user TYPE object
    DEFAULT {};

DEFINE FIELD activo ON user TYPE bool
    DEFAULT true;

-- Timestamps
DEFINE FIELD created_at ON user TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON user TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices para búsquedas rápidas y login
DEFINE INDEX userEmailIdx ON user FIELDS email UNIQUE;
DEFINE INDEX userRolIdx ON user FIELDS rol;
DEFINE INDEX userActivoIdx ON user FIELDS activo;

-- ----------------------------------------------------------------------------
-- TABLA: session
-- Descripción: Sesiones activas de usuarios para control de autenticación
-- ----------------------------------------------------------------------------
DEFINE TABLE session SCHEMAFULL;

DEFINE FIELD user ON session TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD token ON session TYPE string
    ASSERT $value != NONE;

DEFINE FIELD ip_address ON session TYPE string;

DEFINE FIELD user_agent ON session TYPE string;

DEFINE FIELD expires_at ON session TYPE datetime
    ASSERT $value != NONE;

DEFINE FIELD created_at ON session TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD last_activity ON session TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX sessionTokenIdx ON session FIELDS token UNIQUE;
DEFINE INDEX sessionUserIdx ON session FIELDS user;
DEFINE INDEX sessionExpiresIdx ON session FIELDS expires_at;

-- ----------------------------------------------------------------------------
-- TABLA: refresh_token
-- Descripción: Tokens de refresco para mantener sesiones activas
-- ----------------------------------------------------------------------------
DEFINE TABLE refresh_token SCHEMAFULL;

DEFINE FIELD user ON refresh_token TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD token ON refresh_token TYPE string
    ASSERT $value != NONE;

DEFINE FIELD expires_at ON refresh_token TYPE datetime
    ASSERT $value != NONE;

DEFINE FIELD revoked ON refresh_token TYPE bool
    DEFAULT false;

DEFINE FIELD created_at ON refresh_token TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX refreshTokenIdx ON refresh_token FIELDS token UNIQUE;
DEFINE INDEX refreshUserIdx ON refresh_token FIELDS user;
DEFINE INDEX refreshRevokedIdx ON refresh_token FIELDS revoked;

-- ----------------------------------------------------------------------------
-- TABLA: password_reset
-- Descripción: Tokens para reseteo de contraseña
-- ----------------------------------------------------------------------------
DEFINE TABLE password_reset SCHEMAFULL;

DEFINE FIELD user ON password_reset TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD token ON password_reset TYPE string
    ASSERT $value != NONE;

DEFINE FIELD expires_at ON password_reset TYPE datetime
    ASSERT $value != NONE;

DEFINE FIELD used ON password_reset TYPE bool
    DEFAULT false;

DEFINE FIELD created_at ON password_reset TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX passwordResetTokenIdx ON password_reset FIELDS token UNIQUE;
DEFINE INDEX passwordResetUserIdx ON password_reset FIELDS user;

-- ----------------------------------------------------------------------------
-- SCOPE: instructor_scope
-- Descripción: Scope para autenticación de instructores y administradores
-- ----------------------------------------------------------------------------
DEFINE SCOPE instructor_scope
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
DEFINE SCOPE estudiante_scope
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
