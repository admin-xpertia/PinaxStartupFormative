# Fase 6: API de Analytics y Seed de Datos - README

## Resumen

La Fase 6 ha sido implementada exitosamente. Este documento describe lo que se ha creado y cómo usarlo.

## ¿Qué se implementó?

### 1. Esquema de Base de Datos (✅ Completado)

**Archivo:** `packages/database/schema/analytics.surql`

Se actualizó el esquema para incluir:
- `metricas_componente`: Métricas agregadas por componente y cohorte
- `punto_de_friccion`: Detección de puntos de fricción (con campos para IA)
- `analisis_cualitativo`: Temas, sentimientos y misconceptions

**Cambios clave:**
- Se cambió `componente` por `componente_snapshot` para trabajar con snapshots
- Se agregaron campos `analisis_ia` y `sugerencias` a puntos de fricción
- Se creó la tabla `analisis_cualitativo` para análisis de temas y misconceptions

### 2. Script de Seed (✅ Completado)

**Archivo:** `packages/database/seed.ts`

Este script genera un escenario completo y realista:

**Datos generados:**
- 1 instructor (Dr. Juan Pérez)
- 1 programa completo (Emprendimiento e Innovación)
- 2 fases, 2 proof points, 2 niveles, 6 componentes
- 1 cohorte con snapshot completo del programa
- 20 estudiantes con perfiles variados:
  - 3 estudiantes excelentes (100% completación, ~92% score)
  - 5 estudiantes buenos (90-100% completación, ~83% score)
  - 6 estudiantes promedio (70-85% completación, ~73% score)
  - 4 estudiantes con dificultades (45-60% completación, ~61% score)
  - 2 estudiantes que abandonan (25-30% completación)

**Puntos de fricción simulados:**
- Componente 4 (Canvas de Validación): tiempo excesivo, severidad alta
- Componente 5 (Análisis Financiero): abandono alto, severidad crítica
- Componente 2 (Simulación de Pitch): scores bajos, severidad media

**Análisis cualitativo:**
- 5 temas principales con frecuencias y sentimientos
- 2 misconceptions con ejemplos reales

**Scripts npm agregados:**
```json
"seed": "node --loader ts-node/esm seed.ts",
"seed:dev": "SURREAL_URL=http://localhost:8000 node --loader ts-node/esm seed.ts"
```

### 3. Dominio Analytics en la API (✅ Completado)

**Archivos:**
- `apps/api/src/domains/analytics/analytics.service.ts`
- `apps/api/src/domains/analytics/analytics.controller.ts`
- `apps/api/src/domains/analytics/analytics.module.ts`

**Endpoints creados:**

#### Friction Points
```
GET /api/v1/cohortes/:cohorteId/analytics/friction-points
```
Devuelve todos los puntos de fricción detectados en una cohorte.

#### Qualitative Analysis
```
GET /api/v1/cohortes/:cohorteId/analytics/qualitative
```
Devuelve análisis cualitativo (temas y misconceptions).

#### Heatmap Data
```
GET /api/v1/cohortes/:cohorteId/analytics/heatmap
```
Devuelve datos para renderizar el heatmap de progreso (componentes + estudiantes + progreso).

#### Cohort Metrics
```
GET /api/v1/cohortes/:cohorteId/analytics/metrics
```
Devuelve métricas agregadas de la cohorte.

#### Student Progress Detail
```
GET /api/v1/cohortes/:cohorteId/estudiantes/:estudianteId/progress-detail
```
Devuelve detalle completo del progreso de un estudiante.

**Seguridad:**
- Todos los endpoints requieren autenticación (`AuthGuard`)
- Verificación de propiedad de cohorte (solo el instructor propietario puede acceder)

### 4. Hooks de React (✅ Completado)

**Archivo:** `apps/instructor-app/lib/hooks/use-analytics.ts`

Hooks creados:
- `useFrictionPoints(cohorteId)`: Para `friction-points-panel.tsx`
- `useQualitativeAnalysis(cohorteId)`: Para `qualitative-analysis.tsx`
- `useHeatmapData(cohorteId)`: Para `progress-heatmap.tsx`
- `useCohorteMetrics(cohorteId)`: Para métricas generales
- `useStudentProgressDetail(cohorteId, estudianteId)`: Para `student-detail-view.tsx`

## Cómo usar

### 1. Aplicar el esquema

```bash
cd packages/database
npm run init:dev
```

### 2. Ejecutar el seed

```bash
cd packages/database
npm install  # Instalar dependencias (ts-node, @types/node)
npm run seed:dev
```

El script tardará un minuto y mostrará un resumen al final con los IDs creados.

### 3. Integrar en componentes del frontend

Los componentes de analytics ya existen, solo necesitan ser actualizados para usar los nuevos hooks.

#### Ejemplo: friction-points-panel.tsx

```tsx
// Antes
import { mockFrictionPoints } from '@/lib/mock-data';

export function FrictionPointsPanel() {
  const frictionPoints = mockFrictionPoints;
  // ...
}

// Después
import { useFrictionPoints } from '@/lib/hooks/use-analytics';

export function FrictionPointsPanel({ cohorteId }: { cohorteId: string }) {
  const { frictionPoints, isLoading, error } = useFrictionPoints(cohorteId);

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // ... resto del componente
}
```

#### Ejemplo: progress-heatmap.tsx

```tsx
import { useHeatmapData } from '@/lib/hooks/use-analytics';

export function ProgressHeatmap({ cohorteId }: { cohorteId: string }) {
  const { componentes, estudiantes, isLoading } = useHeatmapData(cohorteId);

  if (isLoading) return <div>Cargando...</div>;

  // ... renderizar heatmap con datos reales
}
```

#### Ejemplo: qualitative-analysis.tsx

```tsx
import { useQualitativeAnalysis } from '@/lib/hooks/use-analytics';

export function QualitativeAnalysis({ cohorteId }: { cohorteId: string }) {
  const { themes, isLoading } = useQualitativeAnalysis(cohorteId);

  // Separar temas regulares de misconceptions
  const regularThemes = themes.filter(t => !t.concepto_erroneo);
  const misconceptions = themes.filter(t => t.concepto_erroneo);

  // ... renderizar
}
```

#### Ejemplo: student-detail-view.tsx

```tsx
import { useStudentProgressDetail } from '@/lib/hooks/use-analytics';

export function StudentDetailView({
  cohorteId,
  estudianteId
}: {
  cohorteId: string;
  estudianteId: string;
}) {
  const { estudiante, progreso, isLoading } = useStudentProgressDetail(
    cohorteId,
    estudianteId
  );

  if (isLoading) return <div>Cargando...</div>;

  // ... renderizar detalle del estudiante
}
```

## Pasos restantes (Tarea 4: Integración Frontend)

Para completar la integración del frontend, necesitas:

1. **Actualizar `friction-points-panel.tsx`:**
   - Reemplazar mock data con `useFrictionPoints`
   - Verificar que los nombres de campos coincidan con el API

2. **Actualizar `qualitative-analysis.tsx`:**
   - Reemplazar mock data con `useQualitativeAnalysis`
   - Separar temas regulares de misconceptions usando `concepto_erroneo`

3. **Actualizar `progress-heatmap.tsx`:**
   - Reemplazar mock data con `useHeatmapData`
   - Usar `componentes` y `estudiantes` del hook

4. **Actualizar `student-detail-view.tsx`:**
   - Reemplazar mock data con `useStudentProgressDetail`
   - Mostrar `datos_estudiante` (respuestas de cuadernos)
   - Mostrar `evaluacion_resultado` (scores y feedback)

5. **Actualizar las páginas/rutas:**
   - Asegurarte de que las páginas pasen el `cohorteId` correcto a los componentes
   - Para student detail, pasar tanto `cohorteId` como `estudianteId`

## Verificación

### 1. Verificar que el seed funcionó

```bash
# En packages/database
npm run query
```

Luego ejecuta:
```sql
SELECT count() FROM user;
SELECT count() FROM estudiante;
SELECT count() FROM cohorte;
SELECT count() FROM punto_de_friccion;
SELECT count() FROM analisis_cualitativo;
```

Deberías ver:
- ~21 users (1 instructor + 20 estudiantes)
- 20 estudiantes
- 1 cohorte
- 3 puntos de fricción
- 7 análisis cualitativos

### 2. Probar los endpoints

```bash
# Primero, autentic

arte como instructor
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan.perez@ejemplo.com","password":"cualquiera"}'

# Guarda el token y úsalo en los siguientes requests
TOKEN="<tu-token>"

# Obtener puntos de fricción
curl http://localhost:3000/api/v1/cohortes/<cohorte-id>/analytics/friction-points \
  -H "Authorization: Bearer $TOKEN"

# Obtener análisis cualitativo
curl http://localhost:3000/api/v1/cohortes/<cohorte-id>/analytics/qualitative \
  -H "Authorization: Bearer $TOKEN"

# Obtener heatmap
curl http://localhost:3000/api/v1/cohortes/<cohorte-id>/analytics/heatmap \
  -H "Authorization: Bearer $TOKEN"
```

## Datos de acceso

Después de ejecutar el seed:

**Instructor:**
- Email: `juan.perez@ejemplo.com`
- Password: cualquiera (no se valida en desarrollo)

**Estudiantes:**
- Formato email: `{nombre}.{apellido}@ejemplo.com`
- Ejemplos:
  - `ana.garcia@ejemplo.com` (Excelente)
  - `lucia.vega@ejemplo.com` (Abandona)
  - `francisco.ramos@ejemplo.com` (Con dificultades)

## Arquitectura de datos

```
Cohorte
└── snapshot_programa
    └── snapshot_fase (2)
        └── snapshot_proofpoint (2)
            └── snapshot_nivel (2)
                └── snapshot_componente (6)

Estudiantes (20)
└── inscripcion_cohorte
    └── progreso_componente (varía según perfil)
        ├── datos_estudiante (para cuadernos)
        └── evaluacion_resultado (para evaluables)

Analytics Agregados
├── metricas_componente (por cada componente con progreso)
├── punto_de_friccion (3 detectados)
└── analisis_cualitativo (7 temas)
```

## Troubleshooting

### Error: "Cohorte no encontrada"
- Verifica que estás usando el ID correcto (formato `cohorte:xxxx`)
- Asegúrate de estar autenticado como el instructor correcto

### Error: "Cannot connect to SurrealDB"
- Verifica que SurrealDB esté corriendo: `surreal start --log trace memory`
- Verifica las variables de entorno en `.env`

### El seed falla
- Asegúrate de haber aplicado el esquema primero (`npm run init:dev`)
- Verifica que tienes las dependencias instaladas (`npm install`)
- Revisa los logs para ver en qué paso falla

### Los componentes del frontend no muestran datos
- Verifica que los endpoints estén respondiendo (usa curl o Postman)
- Revisa la consola del navegador para errores
- Verifica que estás pasando el `cohorteId` correcto a los hooks

## Próximos pasos

Después de completar la Fase 6, la **Plataforma de Autoría** estará 100% funcional:
- ✅ Creación de programas
- ✅ Generación de contenido con IA
- ✅ Gestión de cohortes con snapshots
- ✅ Analíticas realistas con datos simulados

La siguiente gran etapa sería construir la **Aplicación del Estudiante** que consumiría estos snapshots y generaría el progreso real.
