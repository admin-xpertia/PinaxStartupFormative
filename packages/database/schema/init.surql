-- ============================================================================
-- SCRIPT DE INICIALIZACIÓN DEL ESQUEMA COMPLETO
-- ============================================================================
-- Este script inicializa el esquema completo de SurrealDB
-- Ejecutar en orden: auth -> contenido -> generacion -> ejecucion -> portafolio -> analytics -> versiones
-- Fecha: 2025-11-04
-- ============================================================================

-- Configuración de la base de datos
DEFINE NAMESPACE IF NOT EXISTS xpertia;
USE NS xpertia;

DEFINE DATABASE IF NOT EXISTS plataforma;
USE DB plataforma;

-- ============================================================================
-- MENSAJE DE INICIO
-- ============================================================================
-- Iniciando la creación del esquema completo de la plataforma Xpertia...

-- ============================================================================
-- 1. ESQUEMA DE AUTENTICACIÓN
-- ============================================================================
-- Importar desde: auth.surql

-- ============================================================================
-- 2. ESQUEMA DE CONTENIDO Y AUTORÍA
-- ============================================================================
-- Importar desde: contenido.surql

-- ============================================================================
-- 3. ESQUEMA DE GENERACIÓN CON IA
-- ============================================================================
-- Importar desde: generacion.surql

-- ============================================================================
-- 4. ESQUEMA DE EJECUCIÓN Y ESTUDIANTES
-- ============================================================================
-- Importar desde: ejecucion.surql

-- ============================================================================
-- 5. ESQUEMA DE PORTAFOLIO
-- ============================================================================
-- Importar desde: portafolio.surql

-- ============================================================================
-- 6. ESQUEMA DE ANALYTICS
-- ============================================================================
-- Importar desde: analytics.surql

-- ============================================================================
-- 7. ESQUEMA DE VERSIONAMIENTO
-- ============================================================================
-- Importar desde: versiones.surql

-- ============================================================================
-- DATOS SEMILLA (SEED DATA)
-- ============================================================================

-- Crear usuario admin por defecto (usar UPDATE para idempotencia)
LET $admin_user = UPDATE user:admin CONTENT {
    email: 'admin@xpertia.com',
    nombre: 'Administrador',
    password_hash: crypto::argon2::generate('changeme123!'),
    rol: 'admin',
    activo: true,
    preferencias: {},
    created_at: time::now(),
    updated_at: time::now()
};

-- Crear usuario instructor de prueba (usar UPDATE para idempotencia)
LET $instructor_user = UPDATE user:instructor_demo CONTENT {
    email: 'instructor@xpertia.com',
    nombre: 'Instructor Demo',
    password_hash: crypto::argon2::generate('instructor123!'),
    rol: 'instructor',
    activo: true,
    preferencias: {},
    created_at: time::now(),
    updated_at: time::now()
};

-- Crear algunos badges básicos (usar UPDATE para idempotencia)
UPDATE badge:completacion_fase CONTENT {
    nombre: 'Completador de Fase',
    descripcion: 'Completa exitosamente una fase del programa',
    icon_url: '/badges/completacion_fase.svg',
    tipo: 'completacion',
    criterios: { tipo: 'fase_completada' },
    puntos: 100,
    rareza: 'comun',
    created_at: time::now()
};

UPDATE badge:primera_simulacion CONTENT {
    nombre: 'Primera Simulación',
    descripcion: 'Completa tu primera simulación',
    icon_url: '/badges/primera_simulacion.svg',
    tipo: 'completacion',
    criterios: { tipo: 'primera_simulacion' },
    puntos: 50,
    rareza: 'comun',
    created_at: time::now()
};

UPDATE badge:excelencia_proof_point CONTENT {
    nombre: 'Excelencia en Proof Point',
    descripcion: 'Obtén una calificación superior al 90% en un Proof Point',
    icon_url: '/badges/excelencia.svg',
    tipo: 'excelencia',
    criterios: { tipo: 'score_alto', minimo: 90 },
    puntos: 200,
    rareza: 'raro',
    created_at: time::now()
};

UPDATE badge:velocista CONTENT {
    nombre: 'Velocista',
    descripcion: 'Completa un componente en menos del 50% del tiempo estimado',
    icon_url: '/badges/velocista.svg',
    tipo: 'velocidad',
    criterios: { tipo: 'tiempo_rapido', porcentaje: 50 },
    puntos: 150,
    rareza: 'raro',
    created_at: time::now()
};

-- ============================================================================
-- MENSAJE DE FINALIZACIÓN
-- ============================================================================
-- Esquema inicializado correctamente.
-- Usuario admin creado: admin@xpertia.com / changeme123!
-- Usuario instructor creado: instructor@xpertia.com / instructor123!
-- IMPORTANTE: Cambiar las contraseñas por defecto en producción.
