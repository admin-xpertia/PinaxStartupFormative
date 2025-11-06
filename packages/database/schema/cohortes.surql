DEFINE TABLE IF NOT EXISTS cohorte SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS nombre ON cohorte TYPE string;
DEFINE FIELD IF NOT EXISTS fecha_inicio ON cohorte TYPE datetime;
DEFINE FIELD IF NOT EXISTS fecha_fin_estimada ON cohorte TYPE datetime;
DEFINE FIELD IF NOT EXISTS instructor ON cohorte TYPE record<user>;
DEFINE FIELD IF NOT EXISTS snapshot_programa ON cohorte TYPE record<snapshot_programa>;
DEFINE FIELD IF NOT EXISTS created_at ON cohorte TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS estudiantes ON cohorte FLEXIBLE TYPE array<record<user>>;

-- Note: inscripcion_cohorte is defined in ejecucion.surql with estudiante as record<estudiante>
-- This schema only defines cohorte-related tables

DEFINE TABLE IF NOT EXISTS tiene_estudiantes SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS in ON tiene_estudiantes TYPE record<user>;
DEFINE FIELD IF NOT EXISTS out ON tiene_estudiantes TYPE record<cohorte>;
