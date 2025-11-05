# Fase 7: Prueba de Integración End-to-End (E2E) y Cierre de Mocks

## Objetivo
Realizar una validación funcional completa de la plataforma de autoría (`instructor-app`) para asegurar que todos los flujos de usuario (desde la creación del programa hasta el análisis de la cohorte) estén correctamente conectados a la API (`api`) y que no quede ninguna dependencia de datos `mock`.

---

## Tarea 1: Auditoría y Eliminación de Datos "Mock"

### Archivos con Dependencias de Mock Data Identificados

#### 1. **Dashboard Principal** - `app/page.tsx`
- **Mock usado**: `programs`, `quickStats` de `@/lib/mock-data`
- **Reemplazo necesario**: Implementar `useSWR` para cargar desde `GET /api/v1/programas` y `GET /api/v1/dashboard/stats`
- **Estado vacío**: Mostrar EmptyState cuando no hay programas

#### 2. **Detalle de Programa** - `app/programas/[id]/page.tsx`
- **Mock usado**: `mockPrograms` de `@/lib/mock-data`
- **Reemplazo necesario**: Usar `useSWR` para `GET /api/v1/programas/:id`
- **Validación**: Verificar que el `ProgramOwnershipGuard` protege el acceso

#### 3. **Editor de Programa** - `app/programas/[id]/editar/page.tsx`
- **Mock usado**: `mockPrograms` de `@/lib/mock-data`
- **Reemplazo necesario**: Usar `useSWR` + `PUT /api/v1/programas/:id`

#### 4. **Preview de Programa** - `app/programas/[id]/preview/page.tsx`
- **Mock usado**: `mockPrograms` de `@/lib/mock-data`
- **Reemplazo necesario**: Usar `useSWR` para cargar datos reales

#### 5. **Wizard de Creación de Cohorte** - `components/cohort/cohort-creation-wizard.tsx`
- **Mock usado**: `mockPrograms` de `@/lib/mock-data`
- **Reemplazo necesario**: Cargar programas desde `GET /api/v1/programas`
- **Mock de versiones**: Crear endpoint `GET /api/v1/programas/:id/versiones`

#### 6. **Lista de Cohortes** - `components/cohort/cohort-list-view.tsx`
- **Mock usado**: `mockCohortes` de `@/lib/mock-cohort-data`
- **Reemplazo necesario**: Usar `GET /api/v1/cohortes`

#### 7. **Gestión de Cohorte** - `components/cohort/cohort-management-view.tsx`
- **Mock usado**: `mockCohortes`, `mockCohorteStudents` de `@/lib/mock-cohort-data`
- **Reemplazo necesario**: `GET /api/v1/cohortes/:id` y `GET /api/v1/cohortes/:id/estudiantes`

#### 8. **Tabla de Estudiantes** - `components/cohort/student-management-table.tsx`
- **Mock usado**: `mockStudentDetail` de `@/lib/mock-student-detail`
- **Reemplazo necesario**: Usar datos reales de la API

#### 9. **Historial de Comunicación** - `components/cohort/communication-history.tsx`
- **Mock usado**: `mockCommunications` de `@/lib/mock-cohort-data`
- **Reemplazo necesario**: `GET /api/v1/cohortes/:id/comunicaciones`

#### 10. **Detalle de Estudiante** - `app/cohortes/[id]/estudiantes/[estudianteId]/page.tsx`
- **Mock usado**: `mockStudentDetail` de `@/lib/mock-student-detail`
- **Reemplazo necesario**: `GET /api/v1/cohortes/:cohorteId/estudiantes/:estudianteId`

#### 11. **Demo de Generación** - `app/generation/demo/page.tsx`
- **Mock usado**: `mockLeccionGenerada` de `@/lib/mock-generated-content`
- **Acción**: **ELIMINAR** este archivo o desactivar la ruta
- **Razón**: Es solo una demo, no parte del flujo real

### Archivos Mock a Mantener (Solo para Seeds)
- `lib/mock-data.ts` - Puede usarse como referencia en `packages/database/seed.ts`
- `lib/mock-cohort-data.ts` - Puede usarse para generar datos de prueba
- `lib/mock-student-detail.ts` - Para seeds
- `lib/mock-generated-content.ts` - Para seeds

### Verificación
✓ La aplicación debe compilar sin errores
✓ Las páginas deben mostrar `LoadingState` mientras cargan
✓ Las páginas deben mostrar `EmptyState` cuando no hay datos
✓ No debe haber importaciones de `@/lib/mock-*` en componentes de UI

---

## Tarea 2: Prueba de la Base de Datos "Desde Cero"

### Script de Limpieza de Base de Datos

Crear script: `packages/database/clean.ts`

```typescript
import Surreal from 'surrealdb.js';

async function cleanDatabase() {
  const db = new Surreal();

  await db.connect('http://localhost:8000/rpc', {
    namespace: 'xpertia',
    database: 'xpertia_dev'
  });

  console.log('Limpiando base de datos...');

  // Eliminar todos los datos pero mantener el esquema
  await db.query('DELETE user;');
  await db.query('DELETE programa;');
  await db.query('DELETE fase;');
  await db.query('DELETE proofpoint;');
  await db.query('DELETE nivel;');
  await db.query('DELETE componente;');
  await db.query('DELETE contenido;');
  await db.query('DELETE cohorte;');
  await db.query('DELETE estudiante;');
  await db.query('DELETE progreso;');
  await db.query('DELETE evento_aprendizaje;');

  console.log('Base de datos limpiada exitosamente');
  await db.close();
}

cleanDatabase().catch(console.error);
```

### Comandos NPM
```json
{
  "scripts": {
    "db:clean": "tsx packages/database/clean.ts",
    "db:fresh": "npm run db:clean && npm run db:migrate"
  }
}
```

### Prueba del Estado Vacío
1. Ejecutar `npm run db:clean`
2. Iniciar backend: `cd apps/api && npm run dev`
3. Iniciar frontend: `cd apps/instructor-app && npm run dev`
4. Verificar:
   - `/login` → Debe redirigir a login
   - `/programas` → Debe mostrar EmptyState "No hay programas"
   - `/cohortes` → Debe mostrar EmptyState "No hay cohortes"

---

## Tarea 3: Ejecución del "Flujo Dorado" (Prueba E2E Manual)

### Test Script - Golden Flow

#### 1. Fase 1: Autenticación (5 min)
- [ ] Ir a `/login`
- [ ] Crear cuenta nueva: `instructor@test.com` / `password123`
- [ ] Verificar login exitoso
- [ ] Verificar que el header muestra el nombre del instructor
- [ ] Verificar redirección a `/programas`

**Resultado Esperado**: Usuario autenticado, sesión activa

---

#### 2. Fase 2: Creación de Arquitectura (15 min)

##### 2.1 Crear Programa
- [ ] Clic en "Crear Nuevo Programa"
- [ ] Completar `program-wizard.tsx`:
  - **Paso 1**: Nombre: "Lean Startup E2E Test", Descripción
  - **Paso 2**: Audiencia y nivel
  - **Paso 3**: Añadir 2 Fases: "Validación" y "Construcción"
  - **Paso 4**: Review y crear
- [ ] Verificar redirección a `/programas/[id]/arquitectura`
- [ ] Copiar el `programa:id` de la URL

**Resultado Esperado**: Programa creado en DB, visible en arquitectura

##### 2.2 Visual Roadmap Builder
- [ ] Arrastrar "Fase 1 - Validación" a una nueva posición
- [ ] **Refrescar página** (F5)
- [ ] Verificar que la fase permanece en la nueva posición

**Resultado Esperado**: `PATCH /api/v1/arquitectura/ordenar` persistió el cambio

##### 2.3 Crear ProofPoints y Prerequisites
- [ ] Añadir ProofPoint "Customer Problem Fit" en Fase 1
- [ ] Añadir ProofPoint "Solution Design" en Fase 1
- [ ] Crear conexión de prerequisito: "Customer Problem Fit" → "Solution Design"
- [ ] **Refrescar página**
- [ ] Verificar que el conector permanece

**Resultado Esperado**: `PUT /api/v1/proofpoints/:id/prerequisitos` funcionó

---

#### 3. Fase 3: Generación de Contenido (20 min)

##### 3.1 Documentación de Fase
- [ ] Ir a `/programas/[id]/fases/fase-1/documentacion`
- [ ] Completar `fase-documentation-editor.tsx`:
  - Conceptos Clave: "Problem-Solution Fit, Customer Jobs-to-be-Done"
  - Errores Comunes: "Saltar validación, Solución buscando problema"
  - Objetivo Pedagógico: "Validar hipótesis de problema"
- [ ] Presionar "Guardar"
- [ ] Verificar confirmación de guardado

**Resultado Esperado**: `PUT /api/v1/fases/:id/documentacion` guardó los datos

##### 3.2 Crear Componente Lección
- [ ] En `nivel-configurator.tsx`, crear un nivel "Fundamentos"
- [ ] Añadir componente tipo "Lección": "Introducción al Problem Fit"
- [ ] Copiar el `componente:id`

##### 3.3 Generar Contenido con IA
- [ ] Abrir el `content-generation-wizard.tsx` para la lección
- [ ] Seleccionar:
  - Tipo: Lección
  - Estilo: Socrático
  - Longitud: Mediana
  - Incluir: Ejemplos, Ejercicios
- [ ] Clic en "Generar"
- [ ] **CRÍTICO**: Esperar sin timeout (spinner girando)
- [ ] Verificar que se muestra `content-preview-analysis.tsx`
- [ ] Verificar que hay:
  - Contenido generado (texto markdown)
  - Scores de calidad (Claridad, Engagement, etc.)
  - Análisis de OpenAI

**Resultado Esperado**: `POST /api/v1/generacion/generar-sincrono` devolvió contenido en <30s

---

#### 4. Fase 4: Edición y Rúbricas (15 min)

##### 4.1 Editor de Contenido
- [ ] Clic en "Aceptar y Editar" en la preview
- [ ] Verificar redirección a `lesson-editor.tsx`
- [ ] Verificar que el contenido de IA está cargado en el editor
- [ ] Modificar una frase: Cambiar "importante" por "crítico"
- [ ] Presionar "Guardar"
- [ ] **Refrescar página**
- [ ] Verificar que el cambio persiste ("crítico" visible)

**Resultado Esperado**: `PUT /api/v1/componentes/:id/contenido` guardó la edición + versionamiento

##### 4.2 Rúbricas
- [ ] En el editor, clic en botón "Rúbricas"
- [ ] Abrir modal de rúbricas
- [ ] Crear nueva rúbrica:
  - Criterio: "Comprensión del Problem Fit"
  - Niveles: Insuficiente (0-2), Básico (3-5), Avanzado (6-8), Experto (9-10)
  - Descripción de cada nivel
- [ ] Guardar rúbrica
- [ ] Cerrar modal
- [ ] Reabrir modal
- [ ] Verificar que la rúbrica persiste

**Resultado Esperado**: `POST /api/v1/componentes/:id/rubricas` funcionó

---

#### 5. Fase 5: Creación de Cohorte (15 min)

##### 5.1 Wizard de Cohorte
- [ ] Ir a `/cohortes`
- [ ] Clic en "Crear Nueva Cohorte"
- [ ] `cohort-creation-wizard.tsx`:
  - **Paso 1 - Programa**: Seleccionar "Lean Startup E2E Test", versión "1.0"
  - **Paso 2 - Configuración**:
    - Nombre: "Cohorte E2E Test"
    - Fecha Inicio: Hoy
    - Fecha Fin: +8 semanas
    - Modo: Secuencial
  - **Paso 3 - Estudiantes**: Invitar 3:
    - `student1@test.com` - "Juan Pérez"
    - `student2@test.com` - "María García"
    - `student3@test.com` - "Carlos López"
- [ ] Clic en "Crear Cohorte e Invitar"
- [ ] Copiar el `cohorte:id` de la URL

**Resultado Esperado**: Nueva cohorte visible en lista

##### 5.2 Gestión de Estudiantes
- [ ] Entrar a la cohorte creada
- [ ] Ir a tab "Estudiantes"
- [ ] Verificar en `student-management-table.tsx`:
  - 3 estudiantes con estado "invitado"
  - Emails correctos
  - Botones de acción (Enviar recordatorio, Ver perfil)

**Resultado Esperado**: `POST /api/v1/cohortes/:id/invitar` creó los registros

---

## Tarea 4: Verificación de Analytics (10 min)

### 4.1 Modificar Seed para IDs Reales
Copiar los IDs obtenidos en Tarea 3:
- `programa:xxxxx`
- `cohorte:xxxxx`

Editar `packages/database/seed.ts`:
```typescript
// Aceptar IDs como argumentos CLI
const programaId = process.env.PROGRAMA_ID || 'programa:xxxxx';
const cohorteId = process.env.COHORTE_ID || 'cohorte:xxxxx';
```

### 4.2 Ejecutar Seed
```bash
PROGRAMA_ID="programa:abc" COHORTE_ID="cohorte:xyz" npm run db:seed
```

El seed debe:
- Simular progreso de 20 estudiantes adicionales
- Generar eventos de aprendizaje
- Crear puntos de fricción intencionales

### 4.3 Verificación de Analytics
- [ ] Ir a `/cohortes/[id]/analytics`
- [ ] Verificar `progress-heatmap.tsx`:
  - Muestra 23 estudiantes (3 invitados + 20 simulados)
  - Heatmap con colores según progreso
- [ ] Verificar `friction-points-panel.tsx`:
  - Muestra componentes con alta tasa de fallos
  - Badges de "Alta fricción"
- [ ] Verificar `qualitative-analysis.tsx`:
  - Muestra temas emergentes de los logs
- [ ] Clic en un estudiante simulado
- [ ] Verificar `student-detail-view.tsx`:
  - Timeline de progreso
  - Eventos de aprendizaje
  - Scores de evaluaciones

**Resultado Esperado**: Todos los endpoints de analytics funcionan con datos reales

---

## Tarea 5: Pruebas de Resiliencia y Seguridad (15 min)

### 5.1 Error Handling - API Key Inválida

#### Setup
```bash
# En apps/api/.env
OPENAI_API_KEY="sk-invalid-key-for-testing"
```

#### Test
- [ ] Reiniciar backend
- [ ] Ir al `content-generation-wizard.tsx`
- [ ] Intentar generar contenido
- [ ] Verificar:
  - ✓ El spinner eventualmente se detiene
  - ✓ Se muestra mensaje de error claro: "Error 500: No se pudo generar contenido"
  - ✓ La aplicación NO crashea
  - ✓ Se puede cerrar el wizard y reintentar

**Resultado Esperado**: Manejo graceful de errores de OpenAI

#### Cleanup
```bash
# Restaurar API key válida
OPENAI_API_KEY="sk-real-key"
```

---

### 5.2 Security - Program Ownership Guard

#### Setup
- [ ] Registrar **Instructor A**: `instructorA@test.com` / `password123`
- [ ] Instructor A crea "Programa A"
- [ ] Copiar URL: `/programas/programa:aaa/arquitectura`
- [ ] Logout
- [ ] Registrar **Instructor B**: `instructorB@test.com` / `password123`

#### Test 1: No ver programas de otros
- [ ] Como Instructor B, ir a `/programas`
- [ ] Verificar: "Programa A" NO aparece en la lista

**Resultado Esperado**: `GET /api/v1/programas` solo devuelve programas del instructor autenticado

#### Test 2: No acceder a URLs directas
- [ ] Como Instructor B (aún loggeado)
- [ ] Intentar acceder a: `/programas/programa:aaa/arquitectura`
- [ ] Verificar:
  - ✓ Respuesta HTTP: `403 Forbidden`
  - ✓ Frontend muestra página "Acceso Denegado"
  - ✓ No se filtra información del programa

**Resultado Esperado**: `ProgramOwnershipGuard` bloqueó el acceso

#### Test 3: No modificar programas de otros
- [ ] Como Instructor B, hacer request manual:
```bash
curl -X PATCH http://localhost:3000/api/v1/programas/programa:aaa \
  -H "Authorization: Bearer <token-instructor-b>" \
  -d '{"nombre":"Hackeo"}'
```
- [ ] Verificar: `403 Forbidden`

**Resultado Esperado**: Guard también protege mutaciones

---

## Checklist Final de Fase 7

### Código
- [ ] Todas las importaciones de `@/lib/mock-*` eliminadas de UI
- [ ] Todos los componentes usan `useSWR` o `fetch` directo
- [ ] Página `/generation/demo` eliminada o desactivada
- [ ] Estados de Loading y Empty implementados

### Base de Datos
- [ ] Script `db:clean` creado y funcional
- [ ] Puede probar desde base de datos vacía
- [ ] Seed actualizado para aceptar IDs reales

### Documentación
- [ ] Golden Flow documentado en este archivo
- [ ] Screenshots de cada paso (opcional)
- [ ] Video de demo E2E (recomendado)

### Testing
- [ ] Flujo Dorado completado 100% sin errores
- [ ] Analytics funciona con datos reales
- [ ] Error handling verificado
- [ ] Security testing completado (ProgramOwnershipGuard)

### Preparación para Fase 8
- [ ] Plataforma de autoría (`instructor-app`) funcionalmente completa
- [ ] API de autoría (`apps/api`) estable y documentada
- [ ] Lista para construir la capa de ejecución (estudiante)

---

## Métricas de Éxito

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Archivos con mocks | 0 | TBD |
| Endpoints API funcionando | 100% | TBD |
| Tiempo Golden Flow | < 90 min | TBD |
| Errores durante E2E | 0 | TBD |
| Tests de seguridad pasados | 3/3 | TBD |

---

## Próximos Pasos (Post-Fase 7)

Una vez completada esta fase:

1. **Fase 8: Capa de Ejecución** - Construir `student-app`
2. **Fase 9: Integration Testing Automatizado** - Playwright/Cypress
3. **Fase 10: Performance & Scaling** - Load testing, optimización
4. **Fase 11: Deployment** - CI/CD, staging, producción
