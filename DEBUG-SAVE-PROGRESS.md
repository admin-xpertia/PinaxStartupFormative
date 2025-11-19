# 🔍 DEBUG: Problema de Guardado de Progreso

## Estado Actual
- ✅ Schema de base de datos corregido (`TYPE option<object>`)
- ✅ `ExercisePlayer` corregido para no pasar `{}`
- ✅ `CuadernoTrabajoPlayer` guarda estructura correcta
- ❌ **Todos los ejercicios guardan `datosGuardados: {}`**

## Logging Agregado

### Frontend
**Archivo**: `apps/student-app/app/exercises/[exerciseId]/page.tsx`

**Logs en `handleSave` (línea 188-191)**:
```javascript
console.log('[DEBUG] handleSave - Raw data received:', data)
console.log('[DEBUG] handleSave - Normalized payload:', payload)
console.log('[DEBUG] handleSave - Payload.datos:', payload.datos)
```

**Logs en `normalizeSavePayload` (línea 128-142)**:
```javascript
console.log('[DEBUG] normalizeSavePayload - Input rawData:', rawData)
console.log('[DEBUG] normalizeSavePayload - Extracted datos:', datos)
console.log('[DEBUG] normalizeSavePayload - Rest:', rest)
console.log('[DEBUG] normalizeSavePayload - Will use:', datos ?? rest)
```

### Backend
**Archivo**: `apps/api/src/presentation/controllers/exercise-progress/exercise-progress.controller.ts`

**Logs en `saveProgress` (línea 182-183)**:
```typescript
this.logger.debug(`[DEBUG] saveProgress - Received DTO: ${JSON.stringify(saveDto)}`);
this.logger.debug(`[DEBUG] saveProgress - datos field: ${JSON.stringify(saveDto.datos)}`);
```

## 🧪 Pasos para Probar

### 1. Reiniciar Servicios
```bash
# Frontend
cd apps/student-app
npm run dev

# Backend
cd apps/api
npm run start:dev
```

### 2. Abrir Consola del Navegador
- Chrome DevTools (F12)
- Ir a la pestaña "Console"

### 3. Abrir Logs del Backend
```bash
# En una terminal separada, ver logs del backend
cd apps/api
npm run start:dev
```

### 4. Realizar Prueba

1. **Abrir un ejercicio** (ej: Cuaderno de Trabajo)
2. **Completar algunas respuestas** en los campos
3. **Presionar el botón "Guardar"**
4. **Revisar los logs en ambos lados**

## 📊 Qué Buscar en los Logs

### Frontend (Consola del Navegador)

**Esperado**:
```javascript
[DEBUG] handleSave - Raw data received:
{
  responses: { "0_0": "Mi respuesta 1", "0_1": "Mi respuesta 2" },
  completedSections: [0],
  currentSection: 1
}

[DEBUG] normalizeSavePayload - Input rawData: { responses: {...}, ... }
[DEBUG] normalizeSavePayload - Extracted datos: undefined
[DEBUG] normalizeSavePayload - Rest: { responses: {...}, completedSections: [...], currentSection: 1 }
[DEBUG] normalizeSavePayload - Will use: { responses: {...}, ... }

[DEBUG] handleSave - Normalized payload:
{
  estudianteId: "estudiante:demo",
  cohorteId: "cohorte:xxx",
  datos: { responses: {...}, completedSections: [...], currentSection: 1 }
}
```

**Problema si ves**:
```javascript
[DEBUG] handleSave - Raw data received: undefined
// o
[DEBUG] handleSave - Payload.datos: {}
```

### Backend (Terminal de API)

**Esperado**:
```
[DEBUG] saveProgress - Received DTO: {"estudianteId":"estudiante:demo","cohorteId":"cohorte:xxx","datos":{"responses":{"0_0":"Mi respuesta 1"},"completedSections":[0],"currentSection":1}}

[DEBUG] saveProgress - datos field: {"responses":{"0_0":"Mi respuesta 1"},"completedSections":[0],"currentSection":1}
```

**Problema si ves**:
```
[DEBUG] saveProgress - datos field: {}
// o
[DEBUG] saveProgress - datos field: undefined
```

## 🔎 Diagnóstico Según Logs

### Caso 1: Frontend recibe `undefined` en handleSave
**Problema**: `CuadernoTrabajoPlayer.handleSaveWithData()` no se está ejecutando o no pasa datos
**Solución**: Revisar que `onSave` esté bien conectado

### Caso 2: Frontend `normalizeSavePayload` recibe datos pero `datos` sale vacío
**Problema**: La lógica de extracción está fallando
**Solución**: El `rest` debería contener los datos, verificar `ensureRecord()`

### Caso 3: Backend recibe `datos: {}`
**Problema**: Se perdió en la transmisión HTTP o en el DTO
**Solución**: Verificar que el `SaveProgressDto` no esté filtrando el campo

### Caso 4: Backend recibe los datos pero no los guarda
**Problema**: La query UPDATE tiene un problema
**Solución**: Revisar línea 238 del controller

## 🔧 Posibles Problemas y Soluciones

### Problema A: `ensureRecord()` está convirtiendo a `{}`

**En**: `apps/student-app/app/exercises/[exerciseId]/page.tsx` línea 117-125

```typescript
const ensureRecord = (value: any): Record<string, any> => {
  if (value && typeof value === "object") {
    return value as Record<string, any>
  }
  if (value === undefined || value === null) {
    return {} // ⚠️ ESTO PUEDE SER EL PROBLEMA
  }
  return { value }
}
```

Si `rest` es `undefined`, retorna `{}`.

### Problema B: DTOs de NestJS filtrando campos

**Verificar**: `class-transformer` puede estar filtrando campos que no están decorados

**Solución temporal**: Cambiar `SaveProgressDto.datos` a usar `@Type(() => Object)`

### Problema C: SurrealDB rechazando el objeto

**Verificar en SurrealDB**:
```sql
SELECT datos_guardados FROM exercise_progress
WHERE id = 'exercise_progress:xxx'
```

Si ves `null` o `NONE`, el schema aún no está aplicado correctamente.

## 📝 Siguiente Paso

**Por favor ejecuta la prueba y comparte los logs** que veas en:
1. Consola del navegador (Frontend)
2. Terminal del backend (API)

Con esos logs podré identificar exactamente dónde se pierden los datos.

## 🎯 Archivos Modificados con Logging

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `apps/student-app/app/exercises/[exerciseId]/page.tsx` | 128-142, 188-191 | Logging en normalizeSavePayload y handleSave |
| `apps/api/src/presentation/controllers/exercise-progress/exercise-progress.controller.ts` | 182-183 | Logging en saveProgress endpoint |

---

**Fecha**: 2025-11-19
**Status**: Debugging en progreso
