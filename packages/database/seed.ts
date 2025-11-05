/**
 * Script de Seed para Xpertia Plataforma
 *
 * Este script genera datos realistas para probar la plataforma:
 * - Crea un instructor y un programa completo
 * - Crea una cohorte con snapshot del programa
 * - Simula 20 estudiantes con diferentes perfiles de progreso
 * - Calcula métricas agregadas y puntos de fricción
 * - Genera análisis cualitativo simulado
 */

import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ENV_PATH = path.resolve(__dirname, '../../apps/api/.env');

// ============================================================================
// TYPES
// ============================================================================

type StudentProfile = 'excellent' | 'good' | 'average' | 'struggling' | 'dropout';

interface StudentData {
  profile: StudentProfile;
  nombre: string;
  email: string;
  avatar: string;
  completionRate: number;
  avgScore: number;
  dropoutAfterComponent?: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

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
    console.warn(`[seed] Archivo .env no encontrado en ${envPath}. Se usarán variables de entorno existentes.`);
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

function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[random(0, arr.length - 1)];
}

// ============================================================================
// STUDENT PROFILES
// ============================================================================

const STUDENT_PROFILES: StudentData[] = [
  // Excellent students (3)
  { profile: 'excellent', nombre: 'Ana García', email: 'ana.garcia@ejemplo.com', avatar: 'AG', completionRate: 100, avgScore: 92 },
  { profile: 'excellent', nombre: 'Carlos Rodríguez', email: 'carlos.rodriguez@ejemplo.com', avatar: 'CR', completionRate: 100, avgScore: 95 },
  { profile: 'excellent', nombre: 'María López', email: 'maria.lopez@ejemplo.com', avatar: 'ML', completionRate: 100, avgScore: 90 },

  // Good students (5)
  { profile: 'good', nombre: 'David Martínez', email: 'david.martinez@ejemplo.com', avatar: 'DM', completionRate: 100, avgScore: 85 },
  { profile: 'good', nombre: 'Laura Sánchez', email: 'laura.sanchez@ejemplo.com', avatar: 'LS', completionRate: 95, avgScore: 82 },
  { profile: 'good', nombre: 'Pedro González', email: 'pedro.gonzalez@ejemplo.com', avatar: 'PG', completionRate: 90, avgScore: 80 },
  { profile: 'good', nombre: 'Sofia Fernández', email: 'sofia.fernandez@ejemplo.com', avatar: 'SF', completionRate: 100, avgScore: 86 },
  { profile: 'good', nombre: 'Javier Pérez', email: 'javier.perez@ejemplo.com', avatar: 'JP', completionRate: 95, avgScore: 83 },

  // Average students (6)
  { profile: 'average', nombre: 'Carmen Torres', email: 'carmen.torres@ejemplo.com', avatar: 'CT', completionRate: 80, avgScore: 75 },
  { profile: 'average', nombre: 'Roberto Ruiz', email: 'roberto.ruiz@ejemplo.com', avatar: 'RR', completionRate: 75, avgScore: 72 },
  { profile: 'average', nombre: 'Isabel Moreno', email: 'isabel.moreno@ejemplo.com', avatar: 'IM', completionRate: 85, avgScore: 76 },
  { profile: 'average', nombre: 'Diego Jiménez', email: 'diego.jimenez@ejemplo.com', avatar: 'DJ', completionRate: 70, avgScore: 70 },
  { profile: 'average', nombre: 'Beatriz Álvarez', email: 'beatriz.alvarez@ejemplo.com', avatar: 'BA', completionRate: 80, avgScore: 74 },
  { profile: 'average', nombre: 'Miguel Romero', email: 'miguel.romero@ejemplo.com', avatar: 'MR', completionRate: 75, avgScore: 71 },

  // Struggling students (4)
  { profile: 'struggling', nombre: 'Elena Navarro', email: 'elena.navarro@ejemplo.com', avatar: 'EN', completionRate: 60, avgScore: 65 },
  { profile: 'struggling', nombre: 'Alberto Castro', email: 'alberto.castro@ejemplo.com', avatar: 'AC', completionRate: 55, avgScore: 62 },
  { profile: 'struggling', nombre: 'Patricia Ortiz', email: 'patricia.ortiz@ejemplo.com', avatar: 'PO', completionRate: 50, avgScore: 60 },
  { profile: 'struggling', nombre: 'Francisco Ramos', email: 'francisco.ramos@ejemplo.com', avatar: 'FR', completionRate: 45, avgScore: 58 },

  // Dropout students (2)
  { profile: 'dropout', nombre: 'Lucía Vega', email: 'lucia.vega@ejemplo.com', avatar: 'LV', completionRate: 30, avgScore: 55, dropoutAfterComponent: 3 },
  { profile: 'dropout', nombre: 'Antonio Gil', email: 'antonio.gil@ejemplo.com', avatar: 'AG2', completionRate: 25, avgScore: 52, dropoutAfterComponent: 2 },
];

// ============================================================================
// MOCK CONTENT
// ============================================================================

const MOCK_NOTEBOOK_CONTENT = `## Análisis de Caso

**Pregunta 1:** ¿Cuáles son los principales desafíos que enfrentan las startups en su etapa inicial?

**Respuesta:** Los principales desafíos incluyen:
- Validación del producto-mercado
- Gestión del flujo de caja
- Construcción del equipo fundador
- Escalamiento sostenible

**Pregunta 2:** Diseña una estrategia de validación para una startup de tecnología educativa.

**Respuesta:** La estrategia incluiría:
1. Entrevistas con potenciales usuarios (profesores y estudiantes)
2. Creación de un MVP funcional
3. Pruebas piloto en 2-3 instituciones
4. Iteración basada en feedback
5. Métricas clave: NPS, tasa de retención, engagement

**Pregunta 3:** ¿Cómo medirías el éxito de tu estrategia?

**Respuesta:** Utilizaría las siguientes métricas:
- Tasa de adopción (% de usuarios que completan onboarding)
- Engagement diario/semanal
- Net Promoter Score (NPS)
- Tasa de conversión de free a paid
- Customer Lifetime Value (CLV)
`;

const FRICTION_POINT_ANALYSES = [
  {
    analisis: 'Los estudiantes muestran dificultad para comprender los conceptos de validación de mercado. El tiempo promedio es 2.5x mayor que lo esperado.',
    sugerencias: [
      'Agregar ejemplos prácticos de validación exitosa',
      'Incluir un video explicativo de 5 minutos',
      'Crear un caso de estudio interactivo',
      'Ofrecer una sesión de Q&A síncrona'
    ]
  },
  {
    analisis: 'Alta tasa de abandono en el componente de análisis financiero. Los estudiantes reportan que es demasiado técnico.',
    sugerencias: [
      'Simplificar el lenguaje técnico',
      'Agregar un glosario de términos financieros',
      'Crear calculadoras interactivas',
      'Dividir el contenido en secciones más pequeñas'
    ]
  },
  {
    analisis: 'Scores bajos en el componente de pitch. Los estudiantes no tienen claridad sobre los criterios de evaluación.',
    sugerencias: [
      'Hacer más visible la rúbrica de evaluación',
      'Proporcionar ejemplos de pitches excelentes y mediocres',
      'Agregar una checklist de preparación',
      'Ofrecer retroalimentación formativa antes de la evaluación final'
    ]
  }
];

const QUALITATIVE_THEMES = [
  { tema: 'Dificultad con conceptos financieros', frecuencia: 12, sentimiento: 'negativo' },
  { tema: 'Excelente calidad de los casos de estudio', frecuencia: 15, sentimiento: 'positivo' },
  { tema: 'Falta de tiempo para completar actividades', frecuencia: 8, sentimiento: 'negativo' },
  { tema: 'Buena interacción en simulaciones', frecuencia: 18, sentimiento: 'positivo' },
  { tema: 'Necesidad de más ejemplos prácticos', frecuencia: 10, sentimiento: 'neutral' },
];

const MISCONCEPTIONS = [
  {
    concepto: 'Validación de producto',
    descripcion: 'Los estudiantes confunden validación de producto con validación de idea. Piensan que hacer encuestas es suficiente.',
    ejemplos: [
      '"Hice una encuesta a 50 personas y les gustó mi idea, por lo tanto está validada"',
      '"No necesito un MVP porque la gente me dijo que lo compraría"',
      '"La validación es un paso único al inicio del proceso"'
    ]
  },
  {
    concepto: 'Modelo de negocio',
    descripcion: 'Confunden modelo de negocio con plan de negocio. No entienden que el modelo es iterativo.',
    ejemplos: [
      '"Mi modelo de negocio es vender el producto a clientes"',
      '"Ya tengo mi modelo de negocio definido en un documento de 30 páginas"',
      '"El modelo de negocio no cambia una vez definido"'
    ]
  }
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  const envPathArg = process.argv.find((arg) => arg.startsWith('--env='));
  const envPath = envPathArg
    ? path.resolve(process.cwd(), envPathArg.split('=').slice(1).join('='))
    : DEFAULT_ENV_PATH;

  await loadEnv(envPath);

  // Load SurrealDB
  const { default: Surreal } = await import('surrealdb.js');

  const surrealUrl = process.env.SURREAL_URL ?? 'http://localhost:8000';
  const namespace = process.env.SURREAL_NAMESPACE ?? 'xpertia';
  const database = process.env.SURREAL_DATABASE ?? 'plataforma';
  const user = process.env.SURREAL_USER ?? 'root';
  const pass = process.env.SURREAL_PASS ?? 'root';

  const db = new Surreal();

  console.log(`[seed] Conectando a ${surrealUrl}/${namespace}/${database}`);

  try {
    await db.connect(surrealUrl);
    await db.signin({ user, pass });
    await db.use({ namespace, database });

    console.log('[seed] Conexión establecida');

    // ========================================================================
    // 1. LIMPIAR DATOS EXISTENTES (Idempotencia)
    // ========================================================================
    console.log('[seed] Limpiando datos existentes...');

    await db.query('DELETE analisis_cualitativo;');
    await db.query('DELETE punto_de_friccion;');
    await db.query('DELETE metricas_componente;');
    await db.query('DELETE feedback_generado;');
    await db.query('DELETE evaluacion_resultado;');
    await db.query('DELETE datos_estudiante;');
    await db.query('DELETE progreso_componente;');
    await db.query('DELETE progreso_nivel;');
    await db.query('DELETE progreso_proof_point;');
    await db.query('DELETE inscripcion_cohorte;');
    await db.query('DELETE estudiante;');

    await db.query('DELETE snapshot_contenido;');
    await db.query('DELETE snapshot_rubrica;');
    await db.query('DELETE snapshot_componente;');
    await db.query('DELETE snapshot_nivel;');
    await db.query('DELETE snapshot_proofpoint;');
    await db.query('DELETE snapshot_fase;');
    await db.query('DELETE snapshot_programa;');

    await db.query('DELETE cohorte;');
    await db.query('DELETE componente_contenido;');
    await db.query('DELETE rubrica_evaluacion;');
    await db.query('DELETE componente;');
    await db.query('DELETE nivel;');
    await db.query('DELETE proof_point;');
    await db.query('DELETE fase_documentation;');
    await db.query('DELETE fase;');
    await db.query('DELETE programa;');

    await db.query("DELETE user WHERE email LIKE '%@ejemplo.com';");

    console.log('[seed] Datos limpiados');

    // ========================================================================
    // 2. CREAR INSTRUCTOR
    // ========================================================================
    console.log('[seed] Creando instructor...');

    const instructorResult = await db.create('user', {
      nombre: 'Dr. Juan Pérez',
      email: 'juan.perez@ejemplo.com',
      password_hash: '$2a$10$samplehashforinstructor',
      rol: 'instructor',
      avatar: 'JP',
      activo: true,
    });

    const instructorId = Array.isArray(instructorResult) ? instructorResult[0].id : instructorResult.id;
    console.log(`[seed] Instructor creado: ${instructorId}`);

    // ========================================================================
    // 3. CREAR PROGRAMA COMPLETO
    // ========================================================================
    console.log('[seed] Creando programa...');

    const programaResult = await db.create('programa', {
      nombre: 'Emprendimiento e Innovación',
      descripcion: 'Programa completo sobre emprendimiento, validación de startups y modelos de negocio.',
      instructor: instructorId,
      estado: 'publicado',
      duracion_estimada_horas: 120,
      objetivos_aprendizaje: [
        'Validar ideas de negocio',
        'Diseñar modelos de negocio sostenibles',
        'Desarrollar habilidades de pitch',
        'Analizar mercados y competencia'
      ],
    });

    const programaId = Array.isArray(programaResult) ? programaResult[0].id : programaResult.id;
    console.log(`[seed] Programa creado: ${programaId}`);

    // ========================================================================
    // 4. CREAR FASES
    // ========================================================================
    console.log('[seed] Creando fases...');

    const fase1Result = await db.create('fase', {
      programa: programaId,
      nombre: 'Fundamentos del Emprendimiento',
      numero_fase: 1,
      orden: 1,
      descripcion: 'Introducción a los conceptos fundamentales del emprendimiento',
    });
    const fase1Id = Array.isArray(fase1Result) ? fase1Result[0].id : fase1Result.id;

    const fase2Result = await db.create('fase', {
      programa: programaId,
      nombre: 'Validación y Modelos de Negocio',
      numero_fase: 2,
      orden: 2,
      descripcion: 'Aprende a validar tu idea y diseñar modelos de negocio',
    });
    const fase2Id = Array.isArray(fase2Result) ? fase2Result[0].id : fase2Result.id;

    // ========================================================================
    // 5. CREAR PROOF POINTS
    // ========================================================================
    console.log('[seed] Creando proof points...');

    const pp1Result = await db.create('proof_point', {
      fase: fase1Id,
      nombre: 'Mentalidad Emprendedora',
      pregunta_central: '¿Qué caracteriza a un emprendedor exitoso?',
      orden_en_fase: 1,
      descripcion: 'Desarrolla la mentalidad y habilidades b��sicas del emprendedor',
    });
    const pp1Id = Array.isArray(pp1Result) ? pp1Result[0].id : pp1Result.id;

    const pp2Result = await db.create('proof_point', {
      fase: fase2Id,
      nombre: 'Validación de Producto-Mercado',
      pregunta_central: '¿Cómo sé que mi producto resuelve un problema real?',
      orden_en_fase: 1,
      descripcion: 'Aprende técnicas de validación de ideas de negocio',
    });
    const pp2Id = Array.isArray(pp2Result) ? pp2Result[0].id : pp2Result.id;

    // ========================================================================
    // 6. CREAR NIVELES Y COMPONENTES
    // ========================================================================
    console.log('[seed] Creando niveles y componentes...');

    // Nivel 1 para PP1
    const nivel1Result = await db.create('nivel', {
      proof_point: pp1Id,
      numero_nivel: 1,
      objetivo_especifico: 'Comprender los fundamentos del emprendimiento',
      criterio_completacion: { min_score: 70, required_components: 3 },
    });
    const nivel1Id = Array.isArray(nivel1Result) ? nivel1Result[0].id : nivel1Result.id;

    // Componentes para Nivel 1
    const componentes1 = [];

    for (let i = 0; i < 3; i++) {
      const compResult = await db.create('componente', {
        nivel: nivel1Id,
        tipo: i === 0 ? 'leccion' : (i === 1 ? 'cuaderno' : 'simulacion'),
        nombre: i === 0 ? 'Introducción al Emprendimiento' : (i === 1 ? 'Análisis de Casos' : 'Simulación de Pitch'),
        orden: i + 1,
        duracion_estimada_min: i === 0 ? 30 : (i === 1 ? 45 : 60),
        es_evaluable: i > 0,
      });
      const compId = Array.isArray(compResult) ? compResult[0].id : compResult.id;
      componentes1.push(compId);

      // Crear contenido
      await db.create('componente_contenido', {
        componente: compId,
        contenido: {
          titulo: i === 0 ? 'Introducción al Emprendimiento' : (i === 1 ? 'Análisis de Casos' : 'Simulación de Pitch'),
          descripcion: 'Contenido generado para el componente',
          bloques: []
        },
        version: 1,
      });

      // Crear rúbrica para evaluables
      if (i > 0) {
        await db.create('rubrica_evaluacion', {
          componente: compId,
          dimensiones: [
            { nombre: 'Comprensión', peso: 0.4, niveles: [] },
            { nombre: 'Aplicación', peso: 0.35, niveles: [] },
            { nombre: 'Análisis Crítico', peso: 0.25, niveles: [] }
          ],
        });
      }
    }

    // Nivel 1 para PP2 (PUNTO DE FRICCIÓN)
    const nivel2Result = await db.create('nivel', {
      proof_point: pp2Id,
      numero_nivel: 1,
      objetivo_especifico: 'Aplicar técnicas de validación',
      criterio_completacion: { min_score: 70, required_components: 3 },
    });
    const nivel2Id = Array.isArray(nivel2Result) ? nivel2Result[0].id : nivel2Result.id;

    // Componentes para Nivel 2 (incluye punto de fricción)
    const componentes2 = [];

    for (let i = 0; i < 3; i++) {
      const compResult = await db.create('componente', {
        nivel: nivel2Id,
        tipo: i === 0 ? 'leccion' : (i === 1 ? 'cuaderno' : 'herramienta'),
        nombre: i === 0 ? 'Técnicas de Validación' : (i === 1 ? 'Canvas de Validación' : 'Análisis Financiero'),
        orden: i + 1,
        duracion_estimada_min: i === 0 ? 40 : (i === 1 ? 90 : 60),
        es_evaluable: i > 0,
      });
      const compId = Array.isArray(compResult) ? compResult[0].id : compResult.id;
      componentes2.push(compId);

      await db.create('componente_contenido', {
        componente: compId,
        contenido: {
          titulo: i === 0 ? 'Técnicas de Validación' : (i === 1 ? 'Canvas de Validación' : 'Análisis Financiero'),
          descripcion: 'Contenido generado para el componente',
          bloques: []
        },
        version: 1,
      });

      if (i > 0) {
        await db.create('rubrica_evaluacion', {
          componente: compId,
          dimensiones: [
            { nombre: 'Comprensión', peso: 0.4, niveles: [] },
            { nombre: 'Aplicación', peso: 0.35, niveles: [] },
            { nombre: 'Análisis Crítico', peso: 0.25, niveles: [] }
          ],
        });
      }
    }

    // ========================================================================
    // 7. CREAR COHORTE Y SNAPSHOT
    // ========================================================================
    console.log('[seed] Creando cohorte...');

    const cohorteResult = await db.create('cohorte', {
      nombre: 'Cohorte Primavera 2025',
      programa: programaId,
      instructor: instructorId,
      fecha_inicio: new Date('2025-01-15'),
      fecha_fin: new Date('2025-04-30'),
      estado: 'activo',
      capacidad_maxima: 30,
    });
    const cohorteId = Array.isArray(cohorteResult) ? cohorteResult[0].id : cohorteResult.id;
    console.log(`[seed] Cohorte creada: ${cohorteId}`);

    console.log('[seed] Creando snapshot del programa...');

    // Snapshot del programa
    const snapshotProgramaResult = await db.create('snapshot_programa', {
      programa_original: programaId,
      version: '1.0',
      nombre: 'Emprendimiento e Innovación',
      descripcion: 'Programa completo sobre emprendimiento, validación de startups y modelos de negocio.',
      instructor: instructorId,
    });
    const snapshotProgramaId = Array.isArray(snapshotProgramaResult) ? snapshotProgramaResult[0].id : snapshotProgramaResult.id;

    // Update cohorte with snapshot
    await db.query(`UPDATE ${cohorteId} SET snapshot_programa = ${snapshotProgramaId};`);

    // Snapshot Fase 1
    const snapshotFase1Result = await db.create('snapshot_fase', {
      snapshot_programa: snapshotProgramaId,
      fase_original: fase1Id,
      nombre: 'Fundamentos del Emprendimiento',
      numero_fase: 1,
      orden: 1,
    });
    const snapshotFase1Id = Array.isArray(snapshotFase1Result) ? snapshotFase1Result[0].id : snapshotFase1Result.id;

    // Snapshot Fase 2
    const snapshotFase2Result = await db.create('snapshot_fase', {
      snapshot_programa: snapshotProgramaId,
      fase_original: fase2Id,
      nombre: 'Validación y Modelos de Negocio',
      numero_fase: 2,
      orden: 2,
    });
    const snapshotFase2Id = Array.isArray(snapshotFase2Result) ? snapshotFase2Result[0].id : snapshotFase2Result.id;

    // Snapshot PP1
    const snapshotPP1Result = await db.create('snapshot_proofpoint', {
      snapshot_fase: snapshotFase1Id,
      proofpoint_original: pp1Id,
      nombre: 'Mentalidad Emprendedora',
      pregunta_central: '¿Qué caracteriza a un emprendedor exitoso?',
      orden_en_fase: 1,
    });
    const snapshotPP1Id = Array.isArray(snapshotPP1Result) ? snapshotPP1Result[0].id : snapshotPP1Result.id;

    // Snapshot PP2
    const snapshotPP2Result = await db.create('snapshot_proofpoint', {
      snapshot_fase: snapshotFase2Id,
      proofpoint_original: pp2Id,
      nombre: 'Validación de Producto-Mercado',
      pregunta_central: '¿Cómo sé que mi producto resuelve un problema real?',
      orden_en_fase: 1,
    });
    const snapshotPP2Id = Array.isArray(snapshotPP2Result) ? snapshotPP2Result[0].id : snapshotPP2Result.id;

    // Snapshot Nivel 1
    const snapshotNivel1Result = await db.create('snapshot_nivel', {
      snapshot_proofpoint: snapshotPP1Id,
      nivel_original: nivel1Id,
      numero_nivel: 1,
      objetivo_especifico: 'Comprender los fundamentos del emprendimiento',
      criterio_completacion: { min_score: 70, required_components: 3 },
    });
    const snapshotNivel1Id = Array.isArray(snapshotNivel1Result) ? snapshotNivel1Result[0].id : snapshotNivel1Result.id;

    // Snapshot Nivel 2
    const snapshotNivel2Result = await db.create('snapshot_nivel', {
      snapshot_proofpoint: snapshotPP2Id,
      nivel_original: nivel2Id,
      numero_nivel: 1,
      objetivo_especifico: 'Aplicar técnicas de validación',
      criterio_completacion: { min_score: 70, required_components: 3 },
    });
    const snapshotNivel2Id = Array.isArray(snapshotNivel2Result) ? snapshotNivel2Result[0].id : snapshotNivel2Result.id;

    // Snapshot Componentes
    const snapshotComponentes = [];

    for (let i = 0; i < 3; i++) {
      const snapshotCompResult = await db.create('snapshot_componente', {
        snapshot_nivel: snapshotNivel1Id,
        componente_original: componentes1[i],
        tipo: i === 0 ? 'leccion' : (i === 1 ? 'cuaderno' : 'simulacion'),
        nombre: i === 0 ? 'Introducción al Emprendimiento' : (i === 1 ? 'Análisis de Casos' : 'Simulación de Pitch'),
        orden: i + 1,
      });
      const snapshotCompId = Array.isArray(snapshotCompResult) ? snapshotCompResult[0].id : snapshotCompResult.id;
      snapshotComponentes.push(snapshotCompId);
    }

    for (let i = 0; i < 3; i++) {
      const snapshotCompResult = await db.create('snapshot_componente', {
        snapshot_nivel: snapshotNivel2Id,
        componente_original: componentes2[i],
        tipo: i === 0 ? 'leccion' : (i === 1 ? 'cuaderno' : 'herramienta'),
        nombre: i === 0 ? 'Técnicas de Validación' : (i === 1 ? 'Canvas de Validación' : 'Análisis Financiero'),
        orden: i + 4,
      });
      const snapshotCompId = Array.isArray(snapshotCompResult) ? snapshotCompResult[0].id : snapshotCompResult.id;
      snapshotComponentes.push(snapshotCompId);
    }

    console.log(`[seed] Snapshot creado con ${snapshotComponentes.length} componentes`);

    // ========================================================================
    // 8. CREAR ESTUDIANTES Y SIMULAR PROGRESO
    // ========================================================================
    console.log('[seed] Creando estudiantes y simulando progreso...');

    const estudiantesCreados = [];

    for (const studentData of STUDENT_PROFILES) {
      // Crear user
      const userResult = await db.create('user', {
        nombre: studentData.nombre,
        email: studentData.email,
        password_hash: '$2a$10$samplehashforstudent',
        rol: 'estudiante',
        avatar: studentData.avatar,
        activo: true,
      });
      const userId = Array.isArray(userResult) ? userResult[0].id : userResult.id;

      // Crear estudiante
      const estudianteResult = await db.create('estudiante', {
        user: userId,
        metadata: {},
        pais: 'España',
        ciudad: 'Madrid',
        nivel_educativo: 'Universitario',
      });
      const estudianteId = Array.isArray(estudianteResult) ? estudianteResult[0].id : estudianteResult.id;

      // Crear inscripción
      const inscripcionEstado = studentData.profile === 'dropout' ? 'abandonado' : 'activo';
      await db.create('inscripcion_cohorte', {
        estudiante: estudianteId,
        cohorte: cohorteId,
        estado: inscripcionEstado,
        fecha_inscripcion: new Date('2025-01-15'),
        progreso_general: studentData.completionRate,
      });

      estudiantesCreados.push({
        id: estudianteId,
        data: studentData,
      });

      // Simular progreso por componente
      const numComponentsToComplete = studentData.dropoutAfterComponent
        ? studentData.dropoutAfterComponent
        : Math.ceil(snapshotComponentes.length * (studentData.completionRate / 100));

      for (let i = 0; i < numComponentsToComplete; i++) {
        const snapshotCompId = snapshotComponentes[i];
        const isLastComponent = i === numComponentsToComplete - 1;
        const estado = isLastComponent && studentData.profile === 'dropout' ? 'en_progreso' : 'completado';

        // Calcular score basado en el perfil
        let score = 0;
        if (estado === 'completado') {
          score = studentData.avgScore + randomFloat(-5, 5);
          score = Math.max(0, Math.min(100, score));
        }

        // Calcular tiempo - componente 4 (Canvas de Validación) es punto de fricción
        let tiempoInvertido = random(15, 45);
        if (i === 4 && studentData.profile !== 'excellent') {
          // Punto de fricción: tiempo excesivo
          tiempoInvertido = random(80, 120);
        }

        // Crear progreso
        const progresoResult = await db.create('progreso_componente', {
          progreso_nivel: null, // Simplificado para el seed
          estudiante: estudianteId,
          componente: snapshotCompId,
          estado: estado,
          intentos: random(1, 3),
          tiempo_invertido_minutos: tiempoInvertido,
          score: score,
          fecha_inicio: new Date('2025-01-20'),
          fecha_completacion: estado === 'completado' ? new Date('2025-01-22') : null,
          ultima_actividad: new Date(),
        });
        const progresoId = Array.isArray(progresoResult) ? progresoResult[0].id : progresoResult.id;

        // Crear datos de estudiante para cuadernos
        const componenteInfo = await db.query(`SELECT tipo FROM ${snapshotCompId};`);
        const tipo = componenteInfo[0]?.result?.[0]?.tipo;

        if (tipo === 'cuaderno' && estado === 'completado') {
          await db.create('datos_estudiante', {
            progreso_componente: progresoId,
            tipo: 'respuestas_cuaderno',
            datos: {
              respuestas: MOCK_NOTEBOOK_CONTENT,
            },
            version: 1,
          });
        }

        // Crear evaluación para componentes evaluables
        if (estado === 'completado' && i > 0) {
          await db.create('evaluacion_resultado', {
            progreso_componente: progresoId,
            score_general: score,
            scores_por_dimension: {
              'Comprensión': score + randomFloat(-3, 3),
              'Aplicación': score + randomFloat(-3, 3),
              'Análisis Crítico': score + randomFloat(-3, 3),
            },
            analisis_cualitativo: 'Análisis generado por IA del progreso del estudiante.',
            evaluado_por: 'ai',
            evaluado_at: new Date(),
          });
        }
      }
    }

    console.log(`[seed] ${estudiantesCreados.length} estudiantes creados con progreso simulado`);

    // ========================================================================
    // 9. CALCULAR MÉTRICAS AGREGADAS
    // ========================================================================
    console.log('[seed] Calculando métricas agregadas...');

    for (const snapshotCompId of snapshotComponentes) {
      // Obtener todos los progresos para este componente
      const progresosResult = await db.query(`
        SELECT
          count() as total,
          math::sum(tiempo_invertido_minutos) as tiempo_total,
          math::avg(score) as score_promedio
        FROM progreso_componente
        WHERE componente = ${snapshotCompId} AND estado = 'completado'
        GROUP ALL;
      `);

      const stats = progresosResult[0]?.result?.[0];

      if (stats && stats.total > 0) {
        const tasaCompletacion = (stats.total / estudiantesCreados.length);
        const tiempoPromedio = Math.floor(stats.tiempo_total / stats.total);

        await db.create('metricas_componente', {
          componente_snapshot: snapshotCompId,
          cohorte: cohorteId,
          tasa_completacion: tasaCompletacion * 100,
          tiempo_promedio_minutos: tiempoPromedio,
          tiempo_mediana_minutos: tiempoPromedio,
          score_promedio: stats.score_promedio || 0,
          score_mediana: stats.score_promedio || 0,
          estudiantes_count: stats.total,
          calculado_at: new Date(),
        });
      }
    }

    console.log('[seed] Métricas agregadas calculadas');

    // ========================================================================
    // 10. DETECTAR Y CREAR PUNTOS DE FRICCIÓN
    // ========================================================================
    console.log('[seed] Detectando puntos de fricción...');

    // Punto de fricción 1: Canvas de Validación (componente 4)
    const friccionComp = snapshotComponentes[4]; // Canvas de Validación

    if (friccionComp) {
      const estudiantesAfectados = Math.floor(estudiantesCreados.length * 0.65);

      await db.create('punto_de_friccion', {
        componente_snapshot: friccionComp,
        cohorte: cohorteId,
        tipo_problema: 'tiempo_excesivo',
        estudiantes_afectados: estudiantesAfectados,
        estudiantes_totales: estudiantesCreados.length,
        tiempo_promedio: 95,
        tiempo_esperado: 45,
        porcentaje_afectados: 65,
        severidad: 'alta',
        descripcion: FRICTION_POINT_ANALYSES[0].analisis,
        analisis_ia: FRICTION_POINT_ANALYSES[0].analisis,
        sugerencias: FRICTION_POINT_ANALYSES[0].sugerencias,
        estado: 'detectado',
      });

      // Punto de fricción 2: Análisis Financiero
      const friccionComp2 = snapshotComponentes[5];
      if (friccionComp2) {
        await db.create('punto_de_friccion', {
          componente_snapshot: friccionComp2,
          cohorte: cohorteId,
          tipo_problema: 'abandono_alto',
          estudiantes_afectados: 8,
          estudiantes_totales: estudiantesCreados.length,
          tasa_abandono: 40,
          porcentaje_afectados: 40,
          severidad: 'critica',
          descripcion: FRICTION_POINT_ANALYSES[1].analisis,
          analisis_ia: FRICTION_POINT_ANALYSES[1].analisis,
          sugerencias: FRICTION_POINT_ANALYSES[1].sugerencias,
          estado: 'detectado',
        });
      }

      // Punto de fricción 3: Simulación de Pitch
      const friccionComp3 = snapshotComponentes[2];
      if (friccionComp3) {
        await db.create('punto_de_friccion', {
          componente_snapshot: friccionComp3,
          cohorte: cohorteId,
          tipo_problema: 'scores_bajos',
          estudiantes_afectados: 10,
          estudiantes_totales: estudiantesCreados.length,
          porcentaje_afectados: 50,
          severidad: 'media',
          descripcion: FRICTION_POINT_ANALYSES[2].analisis,
          analisis_ia: FRICTION_POINT_ANALYSES[2].analisis,
          sugerencias: FRICTION_POINT_ANALYSES[2].sugerencias,
          estado: 'detectado',
        });
      }
    }

    console.log('[seed] Puntos de fricción creados');

    // ========================================================================
    // 11. CREAR ANÁLISIS CUALITATIVO
    // ========================================================================
    console.log('[seed] Creando análisis cualitativo...');

    for (const theme of QUALITATIVE_THEMES) {
      await db.create('analisis_cualitativo', {
        cohorte: cohorteId,
        tema: theme.tema,
        frecuencia: theme.frecuencia,
        sentimiento: theme.sentimiento,
      });
    }

    for (const misconception of MISCONCEPTIONS) {
      await db.create('analisis_cualitativo', {
        cohorte: cohorteId,
        tema: `Concepto erróneo: ${misconception.concepto}`,
        frecuencia: random(5, 15),
        sentimiento: 'negativo',
        concepto_erroneo: misconception.concepto,
        descripcion_error: misconception.descripcion,
        ejemplos_error: misconception.ejemplos,
      });
    }

    console.log('[seed] Análisis cualitativo creado');

    // ========================================================================
    // SUCCESS
    // ========================================================================
    console.log('\n✅ [seed] Seed completado exitosamente!');
    console.log(`
Resumen:
- Instructor: ${instructorId}
- Programa: ${programaId}
- Cohorte: ${cohorteId}
- Estudiantes: ${estudiantesCreados.length}
- Componentes: ${snapshotComponentes.length}
- Puntos de fricción: 3
- Temas cualitativos: ${QUALITATIVE_THEMES.length + MISCONCEPTIONS.length}

Puedes acceder a la plataforma con:
- Instructor: juan.perez@ejemplo.com
- Estudiantes: {nombre}@ejemplo.com (ej: ana.garcia@ejemplo.com)
- Password: (cualquier valor - no se valida en desarrollo)
    `);

  } catch (error) {
    console.error('[seed] Error:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run the seed
main().catch((error) => {
  console.error('[seed] Error fatal:', error);
  process.exit(1);
});
