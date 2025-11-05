# Fase 7: Checklist de Eliminación de Mocks

## Estado Actual de Mock Data

### Archivos Mock Identificados
- `apps/instructor-app/lib/mock-data.ts` - Programas y stats del dashboard
- `apps/instructor-app/lib/mock-cohort-data.ts` - Cohortes y estudiantes
- `apps/instructor-app/lib/mock-student-detail.ts` - Detalles de estudiante
- `apps/instructor-app/lib/mock-generated-content.ts` - Contenido generado por IA

### Componentes que Usan Mocks (11 archivos)

---

## 1. Dashboard Principal

**Archivo**: `apps/instructor-app/app/page.tsx`

### Mock Actual
```typescript
import { programs, quickStats } from "@/lib/mock-data"
```

### Reemplazo Necesario
```typescript
import useSWR from 'swr'

export default function DashboardPage() {
  const { data: programs, isLoading: loadingPrograms } = useSWR('/api/v1/programas')
  const { data: stats, isLoading: loadingStats } = useSWR('/api/v1/dashboard/stats')

  if (loadingPrograms || loadingStats) {
    return <LoadingState />
  }

  if (!programs || programs.length === 0) {
    return <EmptyState
      title="No hay programas"
      description="Comienza creando tu primer programa"
      action={<Button onClick={() => setShowWizard(true)}>Crear Programa</Button>}
    />
  }

  // ... resto del código
}
```

### Endpoints API Necesarios
- ✅ `GET /api/v1/programas` - Ya existe
- ⚠️ `GET /api/v1/dashboard/stats` - **PENDIENTE DE CREAR**

### Componentes a Crear
- [ ] `components/shared/loading-state.tsx`
- [ ] `components/shared/empty-state.tsx`

**Estado**: 🟡 PENDIENTE

---

## 2. Detalle de Programa

**Archivo**: `apps/instructor-app/app/programas/[id]/page.tsx`

### Mock Actual
```typescript
import { mockPrograms } from "@/lib/mock-data"

const program = mockPrograms.find((p) => p.id === params.id) || mockPrograms[0]
```

### Reemplazo Necesario
```typescript
import useSWR from 'swr'
import { notFound } from 'next/navigation'

export default function ProgramDetailPage({ params }: { params: { id: string } }) {
  const { data: program, error, isLoading } = useSWR(`/api/v1/programas/${params.id}`)

  if (isLoading) return <LoadingState />
  if (error || !program) return notFound()

  // ... resto del código sin cambios
}
```

### Endpoints API
- ✅ `GET /api/v1/programas/:id` - Ya existe

**Estado**: 🟡 PENDIENTE

---

## 3. Editor de Programa

**Archivo**: `apps/instructor-app/app/programas/[id]/editar/page.tsx`

### Mock Actual
```typescript
import { mockPrograms } from "@/lib/mock-data"
```

### Reemplazo Necesario
Similar a #2, pero con formulario de edición:
```typescript
const { data: program, mutate } = useSWR(`/api/v1/programas/${params.id}`)

const handleUpdate = async (data) => {
  await fetch(`/api/v1/programas/${params.id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  mutate() // Revalidar cache
}
```

### Endpoints API
- ✅ `GET /api/v1/programas/:id` - Ya existe
- ✅ `PUT /api/v1/programas/:id` - Ya existe

**Estado**: 🟡 PENDIENTE

---

## 4. Preview de Programa

**Archivo**: `apps/instructor-app/app/programas/[id]/preview/page.tsx`

### Mock Actual
```typescript
import { mockPrograms } from "@/lib/mock-data"
```

### Reemplazo Necesario
Idéntico a #2 (solo lectura)

**Estado**: 🟡 PENDIENTE

---

## 5. Wizard de Creación de Cohorte

**Archivo**: `components/cohort/cohort-creation-wizard.tsx`

### Mock Actual
```typescript
import { mockPrograms } from "@/lib/mock-data"

// Línea 131
const selectedProgram = mockPrograms.find((p) => p.id === programaId)

// Mock de versiones (líneas 64-100)
const mockVersions: Record<string, ProgramVersion[]> = { ... }
```

### Reemplazo Necesario
```typescript
function Step1ProgramaVersion({ programaId, ... }) {
  const { data: programs } = useSWR('/api/v1/programas')
  const { data: versions } = useSWR(
    programaId ? `/api/v1/programas/${programaId}/versiones` : null
  )

  // ...
}
```

### Endpoints API Necesarios
- ✅ `GET /api/v1/programas` - Ya existe
- ⚠️ `GET /api/v1/programas/:id/versiones` - **PENDIENTE DE CREAR**

**Estado**: 🔴 BLOQUEADO (necesita endpoint de versiones)

---

## 6. Lista de Cohortes

**Archivo**: `components/cohort/cohort-list-view.tsx`

### Mock Actual
```typescript
import { mockCohortes } from "@/lib/mock-cohort-data"
```

### Reemplazo Necesario
```typescript
export function CohorteListView() {
  const { data: cohortes, isLoading } = useSWR('/api/v1/cohortes')

  if (isLoading) return <LoadingState />

  const filteredCohortes = (cohortes || []).filter((cohorte) => {
    // ... lógica de filtrado sin cambios
  })

  // ...
}
```

### Endpoints API
- ✅ `GET /api/v1/cohortes` - Ya existe (Fase 5)

**Estado**: 🟡 PENDIENTE

---

## 7. Gestión de Cohorte

**Archivo**: `components/cohort/cohort-management-view.tsx`

### Mock Actual
```typescript
import { mockCohortes, mockCohorteStudents } from "@/lib/mock-cohort-data"

const cohorte = mockCohortes.find((c) => c.id === cohorteId)
```

### Reemplazo Necesario
```typescript
export function CohorteManagementView({ cohorteId }: CohorteManagementViewProps) {
  const { data: cohorte } = useSWR(`/api/v1/cohortes/${cohorteId}`)
  const { data: students } = useSWR(`/api/v1/cohortes/${cohorteId}/estudiantes`)

  if (!cohorte) return <div>Cohorte no encontrada</div>

  // ...

  <StudentManagementTable students={students || []} cohorteId={cohorteId} />
}
```

### Endpoints API
- ✅ `GET /api/v1/cohortes/:id` - Ya existe
- ✅ `GET /api/v1/cohortes/:id/estudiantes` - Ya existe

**Estado**: 🟡 PENDIENTE

---

## 8. Tabla de Estudiantes

**Archivo**: `components/cohort/student-management-table.tsx`

### Mock Actual
```typescript
import { mockStudentDetail } from "@/lib/mock-student-detail"
```

### Reemplazo Necesario
Este componente recibe `students` como prop desde el padre (#7), así que solo necesita:
```typescript
// Eliminar la línea de import
// El resto del código permanece sin cambios
```

**Estado**: 🟢 FÁCIL (depende de #7)

---

## 9. Historial de Comunicación

**Archivo**: `components/cohort/communication-history.tsx`

### Mock Actual
```typescript
import { mockCommunications } from "@/lib/mock-cohort-data"
```

### Reemplazo Necesario
```typescript
export function CommunicationHistory({ cohorteId }: { cohorteId: string }) {
  const { data: communications, isLoading } = useSWR(
    `/api/v1/cohortes/${cohorteId}/comunicaciones`
  )

  if (isLoading) return <LoadingState />

  // ...
}
```

### Endpoints API Necesarios
- ⚠️ `GET /api/v1/cohortes/:id/comunicaciones` - **PENDIENTE DE CREAR**

**Estado**: 🔴 BLOQUEADO

---

## 10. Detalle de Estudiante

**Archivo**: `app/cohortes/[id]/estudiantes/[estudianteId]/page.tsx`

### Mock Actual
```typescript
import { mockStudentDetail } from "@/lib/mock-student-detail"
```

### Reemplazo Necesario
```typescript
export default function StudentDetailPage({
  params
}: {
  params: { id: string; estudianteId: string }
}) {
  const { data: student, isLoading } = useSWR(
    `/api/v1/cohortes/${params.id}/estudiantes/${params.estudianteId}`
  )

  if (isLoading) return <LoadingState />
  if (!student) return notFound()

  return <StudentDetailView student={student} />
}
```

### Endpoints API
- ✅ `GET /api/v1/cohortes/:id/estudiantes/:estudianteId` - Ya existe

**Estado**: 🟡 PENDIENTE

---

## 11. Demo de Generación

**Archivo**: `app/generation/demo/page.tsx`

### Acción
❌ **ELIMINAR ARCHIVO COMPLETO**

Este es solo una página de demostración que no forma parte del flujo real.

**Estado**: 🟢 ELIMINAR

---

## Resumen de Estado

| Estado | Cantidad | Archivos |
|--------|----------|----------|
| 🟢 FÁCIL | 2 | #8, #11 |
| 🟡 PENDIENTE | 6 | #1, #2, #3, #4, #6, #7, #10 |
| 🔴 BLOQUEADO | 3 | #5, #9 |

### Endpoints Faltantes (Prioridad Alta)

1. **`GET /api/v1/dashboard/stats`** - Para dashboard (#1)
   ```typescript
   interface DashboardStats {
     totalPrograms: number
     totalStudents: number
     activeCohortes: number
     avgCompletionRate: number
   }
   ```

2. **`GET /api/v1/programas/:id/versiones`** - Para wizard de cohorte (#5)
   ```typescript
   interface ProgramVersion {
     version: string
     estado: 'actual' | 'anterior' | 'beta'
     fecha: string
     cambios: string[]
     cohortes_usando: number
     recomendada?: boolean
     advertencia?: string
   }
   ```

3. **`GET /api/v1/cohortes/:id/comunicaciones`** - Para historial (#9)
   ```typescript
   interface Communication {
     id: string
     tipo: 'email' | 'notificacion' | 'anuncio'
     asunto: string
     contenido: string
     fecha_envio: string
     destinatarios: number
     leidos: number
   }
   ```

---

## Plan de Implementación

### Fase 1: Componentes Básicos (1 hora)
- [ ] Crear `components/shared/loading-state.tsx`
- [ ] Crear `components/shared/empty-state.tsx`
- [ ] Crear `lib/fetcher.ts` (para useSWR)

### Fase 2: Endpoints Faltantes (2 horas)
- [ ] Implementar `GET /api/v1/dashboard/stats`
- [ ] Implementar `GET /api/v1/programas/:id/versiones`
- [ ] Implementar `GET /api/v1/cohortes/:id/comunicaciones`

### Fase 3: Actualizar Componentes (3 horas)
- [ ] #11 - Eliminar demo page
- [ ] #1 - Dashboard principal
- [ ] #2, #3, #4 - Páginas de programa
- [ ] #6, #7, #8 - Gestión de cohortes
- [ ] #5 - Wizard de cohorte
- [ ] #9, #10 - Comunicaciones y detalles

### Fase 4: Testing (1 hora)
- [ ] Verificar que todas las páginas compilan
- [ ] Probar con base de datos vacía
- [ ] Probar con datos reales
- [ ] Verificar estados de loading
- [ ] Verificar estados vacíos

---

## Componentes Compartidos a Crear

### 1. LoadingState Component
```typescript
// components/shared/loading-state.tsx
export function LoadingState({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
```

### 2. EmptyState Component
```typescript
// components/shared/empty-state.tsx
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        {icon || <Inbox className="h-12 w-12 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{description}</p>
      {action}
    </div>
  )
}
```

### 3. Fetcher for SWR
```typescript
// lib/fetcher.ts
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      // Añadir token de auth si existe
      ...(typeof window !== 'undefined' && localStorage.getItem('token')
        ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
        : {}),
    },
  })

  if (!res.ok) {
    const error = new Error('Error al cargar datos')
    error.info = await res.json()
    error.status = res.status
    throw error
  }

  return res.json()
}
```

---

## Comandos Útiles para Testing

```bash
# Limpiar base de datos
cd packages/database && npm run clean:dev

# Iniciar backend con watch
cd apps/api && npm run dev

# Iniciar frontend con watch
cd apps/instructor-app && npm run dev

# Verificar que no quedan mocks
grep -r "from.*mock-" apps/instructor-app/app apps/instructor-app/components
```

---

## Criterios de Completitud

✅ **Fase 7 completada cuando**:
- [ ] 0 importaciones de `@/lib/mock-*` en UI
- [ ] Todos los componentes compilan sin errores
- [ ] Todas las páginas funcionan con DB vacía (muestran EmptyState)
- [ ] Todas las páginas funcionan con datos reales
- [ ] Estados de loading implementados
- [ ] Demo page eliminada
- [ ] Golden Flow E2E pasa al 100%
