import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ENV_PATH = path.resolve(__dirname, '../../apps/api/.env');
const DEFAULT_SCHEMA_DIR = path.resolve(__dirname, 'schema');

const SCHEMA_EXECUTION_ORDER = [
  'auth.surql',
  'contenido.surql',
  'generacion.surql',
  'ejecucion.surql',
  'portafolio.surql',
  'analytics.surql',
  'versiones.surql',
  'init.surql',
  'schema-ddd.surql', // Base schema - debe ejecutarse primero
  'student-execution.surql', // Execution schema - depende de schema-ddd
];

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseEnvFile(contents: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const lineWithoutExport = line.startsWith('export ') ? line.slice(7) : line;
    const separatorIndex = lineWithoutExport.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = lineWithoutExport.slice(0, separatorIndex).trim();
    let value = lineWithoutExport.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

async function loadEnv(envPath: string): Promise<void> {
  if (!(await pathExists(envPath))) {
    console.warn(`[apply-schema] Archivo .env no encontrado en ${envPath}. Se usarán variables de entorno existentes.`);
    return;
  }

  const contents = await fs.readFile(envPath, 'utf8');
  const parsed = parseEnvFile(contents);

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof process.env[key] === 'undefined') {
      process.env[key] = value;
    }
  }
}

async function loadSchemaFiles(schemaDir: string): Promise<Array<{ name: string; contents: string }>> {
  if (!(await pathExists(schemaDir))) {
    throw new Error(`Directorio de esquemas no encontrado: ${schemaDir}`);
  }

  const entries = await fs.readdir(schemaDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.surql'))
    .map((entry) => entry.name);

  if (files.length === 0) {
    throw new Error(`No se encontraron archivos .surql en ${schemaDir}`);
  }

  const orderedFiles = files.sort((a, b) => {
    const indexA = SCHEMA_EXECUTION_ORDER.indexOf(a);
    const indexB = SCHEMA_EXECUTION_ORDER.indexOf(b);

    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b);
    }

    if (indexA === -1) {
      return 1;
    }

    if (indexB === -1) {
      return -1;
    }

    return indexA - indexB;
  });

  const schemas: Array<{ name: string; contents: string }> = [];

  for (const filename of orderedFiles) {
    const fullPath = path.join(schemaDir, filename);
    const contents = await fs.readFile(fullPath, 'utf8');
    schemas.push({ name: filename, contents });
  }

  return schemas;
}

function buildTransactionPayload(schemas: Array<{ name: string; contents: string }>): string {
  const joinedSchemas = schemas
    .map(
      ({ name, contents }) =>
        `-- Archivo: ${name}\n${contents.trim()}`,
    )
    .join('\n\n');

  // NO usar transacciones para permitir que los DEFINE IF NOT EXISTS funcionen correctamente
  return joinedSchemas;
}

type SurrealConstructor = new () => {
  connect(url: string): Promise<void>;
  authenticate(token: string): Promise<void>;
  signin(credentials: Record<string, unknown>): Promise<void>;
  use(config: { namespace: string; database: string }): Promise<void>;
  query<T = any>(sql: string): Promise<Array<{ result: T }>>;
  close(): Promise<void>;
};

async function resolveSurreal(): Promise<SurrealConstructor> {
  try {
    const module = await import('surrealdb.js');
    return (module as any).default ?? module;
  } catch (error) {
    const fallbackCandidate = path.resolve(__dirname, '../../apps/api/node_modules/surrealdb.js/esm/index.js');

    if (await pathExists(fallbackCandidate)) {
      const module = await import(pathToFileURL(fallbackCandidate).href);
      return (module as any).default ?? module;
    }

    throw error;
  }
}

async function main(): Promise<void> {
  const envPathArg = process.argv.find((arg) => arg.startsWith('--env='));
  const schemaDirArg = process.argv.find((arg) => arg.startsWith('--schema-dir='));

  const envPath = envPathArg
    ? path.resolve(process.cwd(), envPathArg.split('=').slice(1).join('='))
    : DEFAULT_ENV_PATH;

  const schemaDir = schemaDirArg
    ? path.resolve(process.cwd(), schemaDirArg.split('=').slice(1).join('='))
    : DEFAULT_SCHEMA_DIR;

  await loadEnv(envPath);

  const surrealUrl = process.env.SURREAL_URL ?? process.env.SURREAL_ENDPOINT;
  const namespace = process.env.SURREAL_NAMESPACE;
  const database = process.env.SURREAL_DATABASE;
  const user = process.env.SURREAL_USER;
  const pass = process.env.SURREAL_PASS;
  const token = process.env.SURREAL_TOKEN;
  const scope = process.env.SURREAL_SCOPE;
  const extraSignin = process.env.SURREAL_SIGNIN_PAYLOAD;

  if (!surrealUrl) {
    throw new Error('Variable de entorno SURREAL_URL (o SURREAL_ENDPOINT) no definida.');
  }

  if (!namespace) {
    throw new Error('Variable de entorno SURREAL_NAMESPACE no definida.');
  }

  if (!database) {
    throw new Error('Variable de entorno SURREAL_DATABASE no definida.');
  }

  if (!token && (!user || !pass)) {
    throw new Error('Variables de entorno SURREAL_USER y SURREAL_PASS no definidas.');
  }

  const schemas = await loadSchemaFiles(schemaDir);
  const payload = buildTransactionPayload(schemas);

  const Surreal = await resolveSurreal();
  const db = new Surreal();

  console.log(`[apply-schema] Conectando a SurrealDB en ${surrealUrl}`);

  try {
    await db.connect(surrealUrl);

    if (token) {
      await db.authenticate(token);
    } else {
      const credentialCandidates: Record<string, unknown>[] = [];

      if (extraSignin) {
        try {
          const parsed = JSON.parse(extraSignin);
          if (parsed && typeof parsed === 'object') {
            credentialCandidates.push(parsed as Record<string, unknown>);
          }
        } catch (error) {
          console.warn('[apply-schema] No se pudo parsear SURREAL_SIGNIN_PAYLOAD como JSON, se ignorará.', error);
        }
      }

      if (scope) {
        credentialCandidates.push({
          NS: namespace,
          DB: database,
          SC: scope,
          user,
          pass,
        });
      }

      credentialCandidates.push({ user, pass });
      credentialCandidates.push({ username: user, password: pass });
      credentialCandidates.push({ NS: namespace, DB: database, user, pass });
      credentialCandidates.push({ NS: namespace, DB: database, username: user, password: pass });

      let authenticated = false;
      const errors: unknown[] = [];

      for (const candidate of credentialCandidates) {
        if (authenticated) {
          break;
        }

        try {
          await db.signin(candidate);
          authenticated = true;
        } catch (error) {
          errors.push({ candidate, error });
        }
      }

      if (!authenticated) {
        console.error('[apply-schema] No fue posible autenticarse. Detalle de intentos fallidos:');
        for (const entry of errors) {
          console.error(JSON.stringify(entry, null, 2));
        }
        throw new Error('Falló la autenticación con las credenciales proporcionadas.');
      }
    }

    await db.use({ namespace, database });

    console.log(`[apply-schema] Aplicando esquema en ${namespace}/${database}`);

    const result = await db.query(payload);

    console.log(`[apply-schema] Esquema aplicado correctamente. Respuestas recibidas: ${result.length}`);
  } finally {
    await db.close();
  }
}

main().catch((error) => {
  console.error('[apply-schema] Error al aplicar el esquema:', error instanceof Error ? error.message : error);
  process.exit(1);
});
