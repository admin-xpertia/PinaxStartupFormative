-- ============================================================================
-- RECREAR TABLAS CON PERMISOS CORRECTOS
-- ============================================================================
-- Este script elimina y recrea las tablas principales con sus permisos
-- ============================================================================

-- Eliminar tablas en orden inverso de dependencias
REMOVE TABLE componente;
REMOVE TABLE nivel;
REMOVE TABLE proof_point;
REMOVE TABLE fase_documentation;
REMOVE TABLE fase;
REMOVE TABLE cohorte;
REMOVE TABLE programa;

-- RECREAR TABLA: programa
DEFINE TABLE programa SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (creador = $auth OR creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (creador = $auth OR creador = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD nombre ON programa TYPE string ASSERT $value != NONE AND string::len($value) >= 3;
DEFINE FIELD descripcion ON programa TYPE string;
DEFINE FIELD duracion_semanas ON programa TYPE int ASSERT $value > 0;
DEFINE FIELD estado ON programa TYPE string ASSERT $value IN ['draft', 'publicado', 'archivado'] DEFAULT 'draft';
DEFINE FIELD version_actual ON programa TYPE string DEFAULT '1.0.0';
DEFINE FIELD creador ON programa TYPE record<user> ASSERT $value != NONE;
DEFINE FIELD created_at ON programa TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updated_at ON programa TYPE datetime DEFAULT time::now() VALUE time::now();
DEFINE INDEX programaEstadoIdx ON programa FIELDS estado;
DEFINE INDEX programaCreadorIdx ON programa FIELDS creador;

-- RECREAR TABLA: cohorte
DEFINE TABLE cohorte SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (instructor = $auth OR instructor = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (instructor = $auth OR instructor = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD programa ON cohorte TYPE record<programa> ASSERT $value != NONE;
DEFINE FIELD nombre ON cohorte TYPE string ASSERT $value != NONE;
DEFINE FIELD fecha_inicio ON cohorte TYPE datetime ASSERT $value != NONE;
DEFINE FIELD fecha_fin_estimada ON cohorte TYPE datetime;
DEFINE FIELD snapshot_programa ON cohorte TYPE record<snapshot_programa>;
DEFINE FIELD instructor ON cohorte TYPE record<user>;
DEFINE FIELD activo ON cohorte TYPE bool DEFAULT true;
DEFINE FIELD created_at ON cohorte TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updated_at ON cohorte TYPE datetime DEFAULT time::now() VALUE time::now();
DEFINE INDEX cohorteActivoIdx ON cohorte FIELDS activo;
DEFINE INDEX cohorteProgramaIdx ON cohorte FIELDS programa;
DEFINE INDEX cohorteInstructorIdx ON cohorte FIELDS instructor;

-- RECREAR TABLA: fase
DEFINE TABLE fase SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (programa.creador = $auth OR programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (programa.creador = $auth OR programa.creador = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD programa ON fase TYPE record<programa> ASSERT $value != NONE;
DEFINE FIELD numero_fase ON fase TYPE int ASSERT $value > 0;
DEFINE FIELD nombre ON fase TYPE string ASSERT $value != NONE;
DEFINE FIELD descripcion ON fase TYPE string;
DEFINE FIELD objetivos_aprendizaje ON fase TYPE array DEFAULT [];
DEFINE FIELD duracion_semanas_estimada ON fase TYPE int ASSERT $value > 0;
DEFINE FIELD orden ON fase TYPE int ASSERT $value >= 0;
DEFINE FIELD created_at ON fase TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updated_at ON fase TYPE datetime DEFAULT time::now() VALUE time::now();
DEFINE INDEX faseProgramaIdx ON fase FIELDS programa;
DEFINE INDEX faseOrdenIdx ON fase FIELDS programa, orden;

-- RECREAR TABLA: fase_documentation
DEFINE TABLE fase_documentation SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD fase ON fase_documentation TYPE record<fase> ASSERT $value != NONE;
DEFINE FIELD contexto_general ON fase_documentation TYPE string;
DEFINE FIELD conceptos_clave ON fase_documentation TYPE array DEFAULT [];
DEFINE FIELD casos_ejemplo ON fase_documentation TYPE array DEFAULT [];
DEFINE FIELD errores_comunes ON fase_documentation TYPE array DEFAULT [];
DEFINE FIELD recursos_referencia ON fase_documentation TYPE array DEFAULT [];
DEFINE FIELD criterios_evaluacion ON fase_documentation TYPE object DEFAULT {};
DEFINE FIELD updated_at ON fase_documentation TYPE datetime DEFAULT time::now() VALUE time::now();
DEFINE INDEX faseDocFaseIdx ON fase_documentation FIELDS fase UNIQUE;

-- RECREAR TABLA: proof_point
DEFINE TABLE proof_point SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (fase.programa.creador = $auth OR fase.programa.creador = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD fase ON proof_point TYPE record<fase> ASSERT $value != NONE;
DEFINE FIELD nombre ON proof_point TYPE string ASSERT $value != NONE;
DEFINE FIELD slug ON proof_point TYPE string ASSERT $value != NONE;
DEFINE FIELD descripcion ON proof_point TYPE string;
DEFINE FIELD pregunta_central ON proof_point TYPE string;
DEFINE FIELD tipo_entregable_final ON proof_point TYPE string;
DEFINE FIELD orden_en_fase ON proof_point TYPE int ASSERT $value >= 0;
DEFINE FIELD prerequisitos ON proof_point TYPE array DEFAULT [];
DEFINE FIELD duracion_estimada_horas ON proof_point TYPE int ASSERT $value > 0;
DEFINE FIELD created_at ON proof_point TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updated_at ON proof_point TYPE datetime DEFAULT time::now() VALUE time::now();
DEFINE INDEX proofPointFaseIdx ON proof_point FIELDS fase;
DEFINE INDEX proofPointSlugIdx ON proof_point FIELDS slug;

-- RECREAR TABLA: nivel
DEFINE TABLE nivel SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (proof_point.fase.programa.creador = $auth OR proof_point.fase.programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (proof_point.fase.programa.creador = $auth OR proof_point.fase.programa.creador = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD proof_point ON nivel TYPE record<proof_point> ASSERT $value != NONE;
DEFINE FIELD numero_nivel ON nivel TYPE int ASSERT $value > 0;
DEFINE FIELD nombre ON nivel TYPE string ASSERT $value != NONE;
DEFINE FIELD objetivo_especifico ON nivel TYPE string;
DEFINE FIELD criterio_completacion ON nivel TYPE object DEFAULT { logica: 'AND', reglas: [] };
DEFINE FIELD created_at ON nivel TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updated_at ON nivel TYPE datetime DEFAULT time::now() VALUE time::now();
DEFINE INDEX nivelProofPointIdx ON nivel FIELDS proof_point;
DEFINE INDEX nivelNumeroIdx ON nivel FIELDS proof_point, numero_nivel;

-- RECREAR TABLA: componente
DEFINE TABLE componente SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE
    FOR create WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR update WHERE $auth != NONE AND (nivel.proof_point.fase.programa.creador = $auth OR nivel.proof_point.fase.programa.creador = $auth.id OR $auth.rol = 'admin')
    FOR delete WHERE $auth != NONE AND (nivel.proof_point.fase.programa.creador = $auth OR nivel.proof_point.fase.programa.creador = $auth.id OR $auth.rol = 'admin');

DEFINE FIELD nivel ON componente TYPE record<nivel> ASSERT $value != NONE;
DEFINE FIELD nombre ON componente TYPE string ASSERT $value != NONE;
DEFINE FIELD tipo ON componente TYPE string ASSERT $value IN ['leccion', 'cuaderno', 'simulacion', 'herramienta'];
DEFINE FIELD orden ON componente TYPE int ASSERT $value >= 0;
DEFINE FIELD duracion_estimada_minutos ON componente TYPE int ASSERT $value > 0;
DEFINE FIELD created_at ON componente TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updated_at ON componente TYPE datetime DEFAULT time::now() VALUE time::now();
DEFINE INDEX componenteNivelIdx ON componente FIELDS nivel;
DEFINE INDEX componenteOrdenIdx ON componente FIELDS nivel, orden;
