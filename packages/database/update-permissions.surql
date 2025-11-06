-- ============================================================================
-- ACTUALIZAR PERMISOS DE TABLAS DE CONTENIDO
-- ============================================================================
-- Este script actualiza solo los permisos de las tablas existentes
-- sin modificar la estructura de campos
-- ============================================================================

-- TABLA: programa
DEFINE TABLE programa SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (creador = $auth OR creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (creador = $auth OR creador = $auth.id OR $auth.rol = 'admin');

-- TABLA: fase
DEFINE TABLE fase SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (programa.creador = $auth OR programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (programa.creador = $auth OR programa.creador = $auth.id OR $auth.rol = 'admin');

-- TABLA: fase_documentation
DEFINE TABLE fase_documentation SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin');

-- TABLA: proof_point
DEFINE TABLE proof_point SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin');

-- TABLA: nivel
DEFINE TABLE nivel SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (proof_point.fase.programa.creador = $auth OR proof_point.fase.programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (proof_point.fase.programa.creador = $auth OR proof_point.fase.programa.creador = $auth.id OR $auth.rol = 'admin');

-- TABLA: componente
DEFINE TABLE componente SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (nivel.proof_point.fase.programa.creador = $auth OR nivel.proof_point.fase.programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (nivel.proof_point.fase.programa.creador = $auth OR nivel.proof_point.fase.programa.creador = $auth.id OR $auth.rol = 'admin');

-- TABLA: cohorte
DEFINE TABLE cohorte SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (instructor = $auth OR instructor = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (instructor = $auth OR instructor = $auth.id OR $auth.rol = 'admin');
