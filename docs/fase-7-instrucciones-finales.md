# Fase 7: Instrucciones Finales - Completar Eliminación de Mocks

## ✅ Completado (1/10 archivos)

- ✅ `app/page.tsx` - Dashboard principal actualizado con useSWR

## ⚠️ Pendiente (9/10 archivos)

Los siguientes archivos deben actualizarse siguiendo el **mismo patrón** usado en `app/page.tsx`.

---

## Patrón de Actualización

Para cada archivo, seguir estos pasos:

### 1. Añadir imports necesarios
```typescript
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
```

### 2. Eliminar import de mock
```typescript
// ELIMINAR estas líneas:
import { mockPrograms } from "@/lib/mock-data"
import { mockCohortes } from "@/lib/mock-cohort-data"
import { mockStudentDetail } from "@/lib/mock-student-detail"
```

### 3. Reemplazar datos con useSWR
```typescript
// ANTES:
const program = mockPrograms.find(p => p.id === params.id)

// DESPUÉS:
const { data: program, error, isLoading } = useSWR(
  `/api/v1/programas/${params.id}`,
  fetcher
)
```

### 4. Añadir loading/error states
```typescript
if (isLoading) return <LoadingState text="Cargando..." />
if (error) return <ErrorState message={error.message} />
if (!program) return <EmptyState ... />
```

---

## Archivos Pendientes con Detalles

### 2. `app/programas/[id]/page.tsx`

**Mock actual**: `mockPrograms`

**Reemplazo**:
```typescript
const { data: program, error, isLoading } = useSWR(
  `/api/v1/programas/${params.id}`,
  fetcher
)
```

**Estados**:
- Loading: Mostrar `<LoadingState text="Cargando programa..." />`
- Error: Mostrar `<ErrorState />` o `notFound()`
- Sin datos: Redirigir con `notFound()`

---

### 3. `app/programas/[id]/editar/page.tsx`

**Mock actual**: `mockPrograms`

**Reemplazo**:
```typescript
const { data: program, error, isLoading, mutate } = useSWR(
  `/api/v1/programas/${params.id}`,
  fetcher
)
```

**Mutación**: Añadir `mutate()` después de guardar cambios

---

### 4. `app/programas/[id]/preview/page.tsx`

**Mock actual**: `mockPrograms`

**Reemplazo**: Idéntico a #2

---

### 5. `components/cohort/cohort-creation-wizard.tsx`

**Mocks actuales**:
- `mockPrograms` (línea 30)
- `mockVersions` (líneas 64-100)

**Reemplazos**:

**Para programas**:
```typescript
// En Step1ProgramaVersion
const { data: programs } = useSWR('/api/v1/programas', fetcher)
```

**Para versiones**:
```typescript
const { data: versions } = useSWR(
  programaId ? `/api/v1/programas/${programaId}/versiones` : null,
  fetcher
)
```

**Eliminar**: Todo el objeto `mockVersions` (líneas 64-100)

---

### 6. `components/cohort/cohort-list-view.tsx`

**Mock actual**: `mockCohortes`

**Reemplazo**:
```typescript
const { data: cohortes, isLoading, error } = useSWR(
  '/api/v1/cohortes',
  fetcher
)
```

**Estados**:
```typescript
if (isLoading) return <LoadingState />
if (error) return <ErrorState message={error.message} />

const cohorteList = Array.isArray(cohortes) ? cohortes : []
```

---

### 7. `components/cohort/cohort-management-view.tsx`

**Mocks actuales**:
- `mockCohortes`
- `mockCohorteStudents`

**Reemplazos**:
```typescript
const { data: cohorte } = useSWR(`/api/v1/cohortes/${cohorteId}`, fetcher)
const { data: students } = useSWR(
  `/api/v1/cohortes/${cohorteId}/estudiantes`,
  fetcher
)
```

**Pasar a componentes hijos**:
```typescript
<StudentManagementTable students={students || []} cohorteId={cohorteId} />
<CommunicationHistory cohorteId={cohorteId} />
```

---

### 8. `components/cohort/communication-history.tsx`

**Mock actual**: `mockCommunications`

**Reemplazo**:
```typescript
const { data: communications, isLoading } = useSWR(
  `/api/v1/cohortes/${cohorteId}/comunicaciones`,
  fetcher
)
```

**Nota**: Este endpoint devuelve `[]` vacío en MVP, así que siempre mostrará estado vacío.

---

### 9. `components/cohort/student-management-table.tsx`

**Mock actual**: `mockStudentDetail` (importado pero no usado directamente)

**Acción**: Solo eliminar la línea de import:
```typescript
// ELIMINAR:
import { mockStudentDetail } from "@/lib/mock-student-detail"
```

Este componente ya recibe `students` como prop del padre (#7), así que no necesita más cambios.

---

### 10. `app/cohortes/[id]/estudiantes/[estudianteId]/page.tsx`

**Mock actual**: `mockStudentDetail`

**Reemplazo**:
```typescript
const { data: student, isLoading } = useSWR(
  `/api/v1/cohortes/${params.id}/estudiantes/${params.estudianteId}`,
  fetcher
)
```

**Estados**:
```typescript
if (isLoading) return <LoadingState />
if (!student) return notFound()

return <StudentDetailView student={student} />
```

---

## Checklist de Implementación

Para cada archivo:

1. **Abrir archivo** en editor
2. **Añadir imports** (useSWR, fetcher, LoadingState, etc.)
3. **Eliminar** línea de import de mock
4. **Reemplazar** datos mock con `useSWR(...)`
5. **Añadir** estados de loading/error antes del return principal
6. **Guardar** archivo
7. **Verificar** que no hay errores de TypeScript

---

## Comandos de Verificación

### Verificar que no quedan mocks en UI
```bash
cd apps/instructor-app
grep -r "from.*lib/mock" app/ components/ --exclude-dir=node_modules
```

**Resultado esperado**: Solo encontrar refs en archivos que NO son componentes de UI

### Verificar build
```bash
cd apps/instructor-app
npm run build
```

**Resultado esperado**: Build exitoso sin errores de TypeScript

---

## Archivos Mock - Acciones Finales

### ❌ Eliminar (ya no se usan)
```bash
rm apps/instructor-app/lib/mock-generated-content.ts
```

### ✅ Mantener (para seed.ts)
Estos archivos se mantienen pero **NO deben importarse en componentes de UI**:
- `lib/mock-data.ts`
- `lib/mock-cohort-data.ts`
- `lib/mock-student-detail.ts`

---

## Testing Rápido

Después de actualizar todos los archivos:

### 1. Limpiar DB y probar estados vacíos (10 min)
```bash
cd packages/database
npm run fresh

cd ../../apps/api
npm run dev &

cd ../instructor-app
npm run dev
```

**Verificar**:
- `/` → Dashboard muestra stats en 0 y EmptyState de programas
- `/programas` → Redirecciona a dashboard o muestra EmptyState
- `/cohortes` → Muestra EmptyState

### 2. Crear un programa y verificar (5 min)
- Clic en "Crear Nuevo Programa"
- Completar wizard
- Verificar que aparece en lista
- Entrar al detalle → debe cargar desde API

### 3. Probar error handling (2 min)
- Apagar el backend
- Refrescar frontend
- Verificar que muestra `<ErrorState>` con botón de reintentar

---

## Tiempo Estimado Total

- Actualizar 9 archivos restantes: **45-60 minutos**
- Verificar build: **5 minutos**
- Testing básico: **15-20 minutos**

**Total**: ~1.5 horas para completar Fase 7 frontend al 100%

---

## Siguientes Pasos (Post-Frontend)

Una vez completados los 9 archivos:

1. **Verificar build**: `npm run build` → debe pasar
2. **Eliminar mock-generated-content.ts**
3. **Ejecutar Golden Flow E2E** (ver `fase-7-e2e-testing.md`)
4. **Seed con datos reales** (ver `fase-7-e2e-testing.md` Tarea 4)
5. **Tests de seguridad** (ver `fase-7-e2e-testing.md` Tarea 5)

---

## Ayuda Rápida

### Error: "Cannot find module 'swr'"
```bash
cd apps/instructor-app
npm install swr
```

### Error: tipos de SWR
El fetcher ya está tipado en `lib/fetcher.ts`, usar `as any` temporalmente si hay problemas:
```typescript
const { data } = useSWR('/api/...', fetcher) as any
```

### Error: "Property does not exist"
Usar type assertion:
```typescript
const programs = (data as any[]) || []
```

---

**Última actualización**: Noviembre 2025
**Estado**: 1/10 archivos completados (Dashboard ✅)
**Siguiente acción**: Actualizar archivos 2-10 siguiendo el patrón
