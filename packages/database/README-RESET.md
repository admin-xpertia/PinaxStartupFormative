# Reset y Migración de Base de Datos

## 🎯 Propósito

El script `reset-and-migrate.ts` resetea completamente la base de datos SurrealDB Cloud y aplica:
- Schema DDD completo
- Schema de Student Execution
- Usuarios de prueba (admin, instructor, estudiante)
- **10 tipos de ejercicios con schemas actualizados**

## ⚠️ ADVERTENCIA

**Este script es DESTRUCTIVO**: Eliminará TODOS los datos existentes.

## 📋 Pre-requisitos

1. **Variables de entorno configuradas** en `apps/api/.env`:
   ```bash
   SURREAL_URL=wss://your-instance.surreal.cloud
   SURREAL_NAMESPACE=StartupFormative
   SURREAL_DATABASE=Roadmap
   SURREAL_USER=root
   SURREAL_PASS=your-password
   ```

2. **Conexión a SurrealDB Cloud** verificada

## 🚀 Uso

### Desde la raíz del proyecto:

```bash
# Ejecución interactiva (pedirá confirmación)
pnpm tsx packages/database/reset-and-migrate.ts

# Con confirmación automática (para CI/CD)
pnpm tsx packages/database/reset-and-migrate.ts --confirm

# Sin cargar datos seed
pnpm tsx packages/database/reset-and-migrate.ts --skip-seed
```

### Desde el directorio packages/database:

```bash
cd packages/database

# Ejecución interactiva
pnpm tsx reset-and-migrate.ts

# Automática
pnpm tsx reset-and-migrate.ts --confirm
```

## 📊 Qué hace el script

### Paso 1: Eliminar tablas existentes
- Obtiene lista de todas las tablas
- Elimina cada tabla con `REMOVE TABLE`

### Paso 2: Limpiar índices y scopes
- Elimina todos los scopes existentes

### Paso 3: Aplicar schemas
- **schema-ddd.surql**: Tablas base (programa, fase, proof_point, exercise_template, etc.)
- **student-execution.surql**: Tablas de ejecución (cohorte, estudiante, progreso, etc.)

### Paso 4: Aplicar datos seed
1. **Usuarios de prueba** desde `seed-data.surql`:
   - Admin: `admin@xpertia.com` / `Admin123!`
   - Instructor: `instructor@xpertia.com` / `Instructor123!`
   - Estudiante: `estudiante@xpertia.com` / `Estudiante123!`

2. **Exercise Templates** desde `seeds/exercise-templates-10-tipos.surql`:
   - 📖 Lección Interactiva
   - 📝 Cuaderno de Trabajo
   - 💬 Simulación de Interacción
   - 🤖 Mentor y Asesor IA
   - 🔍 Herramienta de Análisis
   - 🎨 Herramienta de Creación
   - 📊 Sistema de Tracking
   - ✅ Herramienta de Revisión
   - 🌐 Simulador de Entorno
   - 🎯 Sistema de Progresión

### Paso 5-6: Verificación
- Cuenta usuarios creados
- Cuenta exercise templates (debe ser 10)
- Verifica que todas las 27 tablas existen

## ✅ Output Schemas Actualizados

Los 10 tipos de ejercicios ahora tienen `output_schemas` que **coinciden exactamente** con las interfaces TypeScript de los players en `student-app`:

| Tipo | Schema Generado | Player |
|------|----------------|--------|
| Lección Interactiva | `{ titulo, objetivos, secciones, conceptos_clave, quiz }` | `LeccionInteractivaPlayer.tsx` |
| Cuaderno de Trabajo | `{ titulo, objetivo, contexto, secciones, criterios_evaluacion }` | `CuadernoTrabajoPlayer.tsx` |
| Simulación | `{ titulo, personaje_ia, situacion_inicial, criterios_exito }` | `SimulacionInteraccionPlayer.tsx` |
| Mentor IA | `{ titulo, contexto_mentor, pasos, reflexion_final }` | `MentorIAPlayer.tsx` |
| Análisis | `{ titulo, tipoAnalisis, instrucciones, outputFormat }` | `HerramientaAnalisisPlayer.tsx` |
| Creación | `{ titulo, tipoCreacion, promptsIniciales, plantillas }` | `HerramientaCreacionPlayer.tsx` |
| Tracking | `{ titulo, metricas, dashboard, alertas }` | `SistemaTrackingPlayer.tsx` |
| Revisión | `{ titulo, criterios_revision, rubrica, recursos_mejora }` | `HerramientaRevisionPlayer.tsx` |
| Simulador | `{ titulo, tipo_entorno, estado_inicial, acciones_posibles }` | `SimuladorEntornoPlayer.tsx` |
| Progresión | `{ titulo, niveles, arbol_dependencias, criterios_evaluacion }` | `SistemaProgresionPlayer.tsx` |

## 🎯 Resultado esperado

```
================================================================================
✓ MIGRACIÓN COMPLETADA EXITOSAMENTE
================================================================================

📊 Resumen de la migración:
  ✓ 27 tablas creadas (base DDD + student execution + snapshots)
  ✓ 3 usuarios de prueba creados (admin, instructor, estudiante)
  ✓ 10 tipos de ejercicios cargados

✓ Todos los 10 tipos de ejercicios fueron cargados
```

## 🔧 Troubleshooting

### Error de conexión
```
Error: Failed to connect to SurrealDB
```
**Solución**: Verifica tus credenciales en `.env` y conexión a internet

### Error "Schema incompleto"
```
✗ Faltan X tablas: ...
```
**Solución**: Revisa los archivos `schema/*.surql` por errores de sintaxis

### Error en seed de ejercicios
```
Advertencia en exercise template X: ...
```
**Solución**: Revisa `seeds/exercise-templates-10-tipos.surql` por sintaxis SurrealQL

## 📝 Después de ejecutar

1. **Reinicia el backend API** para que cargue los nuevos templates:
   ```bash
   cd apps/api
   pnpm dev
   ```

2. **Reinicia el frontend** si estaba corriendo:
   ```bash
   cd apps/instructor-app
   pnpm dev
   ```

3. **Prueba el flujo completo**:
   - Login como instructor
   - Crea un programa nuevo
   - Agrega ejercicios
   - Genera contenido con IA
   - Verifica que el preview muestre el contenido correctamente

## 🔗 Archivos relacionados

- `schema/schema-ddd.surql` - Schema DDD base
- `schema/student-execution.surql` - Schema de ejecución
- `seed-data.surql` - Usuarios de prueba
- `seeds/exercise-templates-10-tipos.surql` - Templates de ejercicios
- `apps/student-app/components/players/` - Players para visualización
- `apps/instructor-app/components/exercise-preview-dialog.tsx` - Preview para instructores
