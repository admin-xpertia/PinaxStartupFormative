# Xpertia Classroom

Plataforma educativa con generación asistida por IA. Incluye backend NestJS sobre SurrealDB con arquitectura DDD, panel de instructores en Next.js y experiencia de estudiante también en Next.js.

## Arquitectura del repositorio

- `apps/api`: API REST NestJS (`/api/v1`, Swagger en `/docs`). Bounded contexts: auth, program design, exercise catalog, exercise instances, exercise progress y cohortes.
- `apps/instructor-app`: Dashboard de instructores (Next.js 16, App Router).
- `apps/student-app`: Experiencia del estudiante (Next.js 16) con roadmap, ejercicios y feedback.
- `packages/database`: Esquema SurrealDB + seeds + scripts de migración.
- `packages/types`: Tipos TypeScript compartidos (programas, cohortes, ejercicios, etc.).

## Prerrequisitos

- Node.js 20+
- pnpm 9+
- SurrealDB 1.5+ (CLI y servicio en local)
- Clave de OpenAI (`OPENAI_API_KEY`) para generación de contenido y feedback (opcional pero recomendada).

## Puesta en marcha rápida

### 1) Base de datos (SurrealDB + seeds)

1. Arranca SurrealDB local:
   ```bash
   surreal start --log info --user root --pass root --bind 127.0.0.1:8000 file:./data/xpertia.db
   ```
2. Aplica schema nuevo + seeds (usuarios demo + 12 plantillas de ejercicios IA). **Destructivo** porque limpia la base:
   ```bash
   cd packages/database
   pnpm install   # solo la primera vez
   SURREAL_URL=ws://127.0.0.1:8000/rpc \
   SURREAL_NAMESPACE=xpertia \
   SURREAL_DATABASE=plataforma \
   SURREAL_USER=root \
   SURREAL_PASS=root \
   pnpm migrate:confirm
   ```
   - Usa `--skip-seed` si no quieres datos de ejemplo.

Credenciales demo creadas por el seed:
- Admin: `admin@xpertia.com` / `Admin123!`
- Instructor: `instructor@xpertia.com` / `Instructor123!`
- Estudiante: `estudiante@xpertia.com` / `Estudiante123!`

### 2) API (NestJS)

1. Configura `apps/api/.env` (valores sugeridos):
   ```env
   SURREAL_URL=ws://127.0.0.1:8000/rpc
   SURREAL_NAMESPACE=xpertia
   SURREAL_DATABASE=plataforma
   SURREAL_USER=root
   SURREAL_PASS=root

   PORT=3000
   API_PREFIX=api/v1
   CORS_ORIGIN=http://localhost:3001,http://localhost:3002

   OPENAI_API_KEY=tu_api_key   # opcional
   OPENAI_MODEL=gpt-4.1-mini   # o el que tengas disponible
   OPENAI_MAX_TOKENS=32000
   ```
2. Instala dependencias y arranca:
   ```bash
   cd apps/api
   pnpm install
   pnpm dev
   ```
   Swagger: `http://localhost:3000/docs`

### 3) Instructor App (Next.js)

1. Crear `.env.local` (puedes copiar de `.env.example`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
   ```
2. Instalar y correr:
   ```bash
   cd apps/instructor-app
   pnpm install
   pnpm dev --port 3001
   ```

### 4) Student App (Next.js)

1. Crear `apps/student-app/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
   NEXT_PUBLIC_DEFAULT_STUDENT_ID=estudiante:demo   # opcional para probar rápido
   ```
2. Instalar y correr:
   ```bash
   cd apps/student-app
   pnpm install
   pnpm dev --port 3002
   ```

## Flujos actuales

- **Diseño de programas**: crear/editar programas, fases y proof points; publicar/archivar, ordenación y metadata completa.
- **Catálogo de ejercicios IA**: 12 plantillas seed agrupadas por categorías (`leccion_interactiva`, `cuaderno_trabajo`, `simulacion_interaccion`, `mentor_asesor_ia`, etc.) disponibles en `/exercise-templates`.
- **Instancias de ejercicios**: asignación a proof points, reorder, publish/unpublish, regeneración de contenido con OpenAI, análisis de borradores y modos de interacción (mentor socrático, roleplay, simulación).
- **Cohortes y matriculación**: creación de cohortes a partir del snapshot del programa, inscripción de estudiantes, estructura congelada por cohorte.
- **Progreso de estudiantes**: endpoints `student/exercises/*` para iniciar, guardar, entregar y evaluar (auto-feedback IA incluido). Dashboard de estudiante muestra roadmap, siguiente ejercicio, progreso por fase y punto de control.
- **Analytics de instructores**: vista de cohorte/programa con progreso por fase, ejercicios publicados, estudiantes en riesgo y bandeja de entregas (`/programas/[id]/analytics` en el dashboard).
- **Autenticación**: JWT generado por SurrealDB (scope `usuario_scope`); endpoints públicos: `/auth/signup`, `/auth/signin`; resto protegido por `AuthGuard`.

## Scripts útiles

- Base de datos: `pnpm --dir packages/database migrate:confirm` (reset + schema + seed), `pnpm --dir packages/database migrate -- --skip-seed` (sin seed).
- API: `pnpm dev`, `pnpm test`, `pnpm build`, `pnpm db:deploy` (aplica schema con `apply-schema.ts` usando `.env`).
- Instructor app / Student app: `pnpm dev`, `pnpm build`.

## Notas

- El prefijo de API es `api/v1`; asegúrate de que los `.env` del frontend apunten al URL completo (incluyendo el prefijo).
- Las features de generación y feedback requieren `OPENAI_API_KEY`; sin clave, los endpoints de IA responderán con error controlado.
- El script de migración es destructivo; úsalo solo en entornos de desarrollo o con snapshots controlados.
