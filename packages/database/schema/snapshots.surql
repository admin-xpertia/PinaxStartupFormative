-- Snapshot schema mirroring program structure
DEFINE TABLE IF NOT EXISTS snapshot_programa SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS programa_original ON snapshot_programa TYPE record<programa>;
DEFINE FIELD IF NOT EXISTS version ON snapshot_programa TYPE string;
DEFINE FIELD IF NOT EXISTS nombre ON snapshot_programa TYPE string;
DEFINE FIELD IF NOT EXISTS descripcion ON snapshot_programa TYPE string;
DEFINE FIELD IF NOT EXISTS instructor ON snapshot_programa TYPE record<user>;
DEFINE FIELD IF NOT EXISTS created_at ON snapshot_programa TYPE datetime DEFAULT time::now();

DEFINE TABLE IF NOT EXISTS snapshot_fase SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS snapshot_programa ON snapshot_fase TYPE record<snapshot_programa>;
DEFINE FIELD IF NOT EXISTS fase_original ON snapshot_fase TYPE record<fase>;
DEFINE FIELD IF NOT EXISTS nombre ON snapshot_fase TYPE string;
DEFINE FIELD IF NOT EXISTS numero_fase ON snapshot_fase TYPE int;
DEFINE FIELD IF NOT EXISTS orden ON snapshot_fase TYPE int;

DEFINE TABLE IF NOT EXISTS snapshot_proofpoint SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS snapshot_fase ON snapshot_proofpoint TYPE record<snapshot_fase>;
DEFINE FIELD IF NOT EXISTS proofpoint_original ON snapshot_proofpoint TYPE record<proofpoint>;
DEFINE FIELD IF NOT EXISTS nombre ON snapshot_proofpoint TYPE string;
DEFINE FIELD IF NOT EXISTS pregunta_central ON snapshot_proofpoint TYPE string;
DEFINE FIELD IF NOT EXISTS orden_en_fase ON snapshot_proofpoint TYPE int;
DEFINE FIELD IF NOT EXISTS prerequisitos ON snapshot_proofpoint TYPE array<record<snapshot_proofpoint>>;

DEFINE TABLE IF NOT EXISTS snapshot_nivel SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS snapshot_proofpoint ON snapshot_nivel TYPE record<snapshot_proofpoint>;
DEFINE FIELD IF NOT EXISTS nivel_original ON snapshot_nivel TYPE record<nivel>;
DEFINE FIELD IF NOT EXISTS numero_nivel ON snapshot_nivel TYPE int;
DEFINE FIELD IF NOT EXISTS objetivo_especifico ON snapshot_nivel TYPE string;
DEFINE FIELD IF NOT EXISTS criterio_completacion ON snapshot_nivel TYPE object;

DEFINE TABLE IF NOT EXISTS snapshot_componente SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS snapshot_nivel ON snapshot_componente TYPE record<snapshot_nivel>;
DEFINE FIELD IF NOT EXISTS componente_original ON snapshot_componente TYPE record<componente>;
DEFINE FIELD IF NOT EXISTS tipo ON snapshot_componente TYPE string;
DEFINE FIELD IF NOT EXISTS nombre ON snapshot_componente TYPE string;
DEFINE FIELD IF NOT EXISTS orden ON snapshot_componente TYPE int;
DEFINE FIELD IF NOT EXISTS contenido ON snapshot_componente TYPE record<snapshot_contenido>;
DEFINE FIELD IF NOT EXISTS rubrica ON snapshot_componente TYPE record<snapshot_rubrica>;
DEFINE FIELD IF NOT EXISTS prerequisitos ON snapshot_componente TYPE array<record<snapshot_componente>>;

DEFINE TABLE IF NOT EXISTS snapshot_contenido SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS snapshot_componente ON snapshot_contenido TYPE record<snapshot_componente>;
DEFINE FIELD IF NOT EXISTS contenido_original ON snapshot_contenido TYPE record<componente_contenido>;
DEFINE FIELD IF NOT EXISTS contenido ON snapshot_contenido TYPE object;

DEFINE TABLE IF NOT EXISTS snapshot_rubrica SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS snapshot_componente ON snapshot_rubrica TYPE record<snapshot_componente>;
DEFINE FIELD IF NOT EXISTS rubrica_original ON snapshot_rubrica TYPE record<rubrica_evaluacion>;
DEFINE FIELD IF NOT EXISTS dimensiones ON snapshot_rubrica TYPE array;
