# Setup de Base de Datos - Estudiantes

## Resumen

Se han creado las tablas y configuraciones necesarias para el sistema de estudiantes en la plataforma Xpertia.

## Nuevas Tablas Creadas

### 1. Cohortes y Estudiantes
- **`cohorte`**: Ejecución específica de un programa con estudiantes
- **`estudiante`**: Perfil extendido de usuario con rol estudiante
- **`inscripcion_cohorte`**: Relación estudiante-cohorte con seguimiento de progreso

### 2. Progreso del Estudiante
- **`progreso_proof_point`**: Progreso en un proof point completo
- **`progreso_nivel`**: Progreso en un nivel específico
- **`progreso_componente`**: Progreso detallado en ejercicios individuales

### 3. Datos y Evaluación
- **`datos_estudiante`**: Almacena respuestas y trabajos del estudiante
- **`evaluacion_resultado`**: Resultados de evaluación (automática o manual)
- **`feedback_generado`**: Feedback personalizado generado por IA

### 4. Analytics y Métricas
- **`metricas_componente`**: Métricas agregadas por componente
- **`punto_de_friccion`**: Detección automática de puntos problemáticos
- **`analisis_cualitativo`**: Análisis de tendencias y patrones

### 5. Snapshots (Versionamiento)
- **`snapshot_programa`**: Snapshot inmutable del programa
- **`snapshot_fase`**: Snapshot de fases
- **`snapshot_proofpoint`**: Snapshot de proof points
- **`snapshot_nivel`**: Snapshot de niveles
- **`snapshot_componente`**: Snapshot de componentes
- **`snapshot_contenido`**: Snapshot de contenido
- **`snapshot_rubrica`**: Snapshot de rúbricas

## Usuarios de Prueba

### 1. Admin
- **Email**: `admin@xpertia.com`
- **Password**: `Admin123!`
- **Rol**: admin

### 2. Instructor
- **Email**: `instructor@xpertia.com`
- **Password**: `Instructor123!`
- **Rol**: instructor

### 3. **Estudiante (NUEVO)**
- **Email**: `estudiante@xpertia.com`
- **Password**: `Estudiante123!`
- **Rol**: estudiante
- **Perfil**: Incluye país, ciudad, nivel educativo, intereses y biografía

## Archivos Modificados/Creados

1. **`packages/database/schema/student-execution.surql`** (NUEVO)
   - Define todas las tablas para estudiantes, cohortes, progreso y analytics
   - Incluye permisos de acceso basados en roles
   - Total: 20+ tablas nuevas

2. **`packages/database/seed-data.surql`** (MODIFICADO)
   - Agregado usuario estudiante demo
   - Agregado perfil de estudiante demo

3. **`packages/database/apply-schema.ts`** (MODIFICADO)
   - Actualizado orden de ejecución para incluir nuevos schemas
   - Garantiza que schema-ddd.surql se ejecute antes que student-execution.surql

4. **`packages/database/reset-and-migrate.ts`** (MODIFICADO)
   - Aplica ambos schemas (DDD + Student Execution)
   - Verifica las 27 tablas (7 base + 20 nuevas)
   - Muestra credenciales de los 3 usuarios en el resumen

## Cómo Aplicar los Cambios

### Opción 1: Reset Completo (Destructivo)

```bash
# Desde el directorio packages/database
cd packages/database

# Ejecutar migración completa (elimina datos existentes)
pnpm tsx reset-and-migrate.ts --confirm

# O sin --confirm para confirmar manualmente
pnpm tsx reset-and-migrate.ts
```

Este script:
1. ✅ Elimina todas las tablas existentes
2. ✅ Aplica schema-ddd.surql
3. ✅ Aplica student-execution.surql
4. ✅ Carga usuarios demo (admin, instructor, estudiante)
5. ✅ Carga exercise templates (10 tipos)
6. ✅ Verifica que todo esté correcto

### Opción 2: Aplicar Solo Schemas Nuevos (No Destructivo)

```bash
# Desde el directorio packages/database
cd packages/database

# Aplicar schemas sin eliminar datos
pnpm tsx apply-schema.ts
```

### Opción 3: Seed de Datos Completo con Estudiantes

```bash
# Desde el directorio packages/database
cd packages/database

# Ejecutar seed completo (crea programa, cohorte, 20 estudiantes)
pnpm tsx seed.ts
```

Este seed crea:
- 1 instructor
- 1 programa completo con fases y proof points
- 1 cohorte activa
- 20 estudiantes con diferentes perfiles:
  - 3 excelentes (100% completación, score >90)
  - 5 buenos (90-100% completación, score 80-86)
  - 6 promedio (70-85% completación, score 70-76)
  - 4 con dificultades (45-60% completación, score 58-65)
  - 2 abandonos (25-30% completación)
- Progreso simulado para cada estudiante
- Métricas agregadas
- 3 puntos de fricción detectados
- Análisis cualitativo

## Autenticación y Login de Estudiantes

### Sistema de Autenticación

La autenticación se maneja a través de SurrealDB Scopes:

```surql
-- Ya definido en schema-ddd.surql
DEFINE SCOPE user_scope SESSION 24h
  SIGNIN (
    SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password_hash, $password)
  )
  SIGNUP (
    CREATE user SET
      email = $email,
      nombre = $nombre,
      password_hash = crypto::argon2::generate($password),
      rol = 'estudiante',
      activo = true
  );
```

### Ejemplo de Login desde el API

```typescript
// En tu servicio de autenticación
import Surreal from 'surrealdb.js';

const db = new Surreal();
await db.connect('http://localhost:8000/rpc');

// Login de estudiante
const token = await db.signin({
  NS: 'xpertia',
  DB: 'plataforma',
  SC: 'user_scope',
  email: 'estudiante@xpertia.com',
  password: 'Estudiante123!',
});

// Usar el token para autenticar
await db.authenticate(token);

// Ahora puedes hacer queries como ese usuario
const estudiante = await db.query('SELECT * FROM estudiante WHERE user = $auth.id;');
```

## Asignar Cursos a Estudiantes

### Crear una Inscripción

```typescript
// Inscribir estudiante en cohorte
await db.create('inscripcion_cohorte', {
  estudiante: 'estudiante:demo',
  cohorte: 'cohorte:primavera_2025',
  estado: 'activo',
  fecha_inscripcion: new Date(),
  progreso_general: 0,
});
```

### Query para Obtener Cohortes de un Estudiante

```surql
-- Cohortes activas de un estudiante
SELECT
  id,
  estado,
  progreso_general,
  cohorte.*,
  cohorte.programa.*
FROM inscripcion_cohorte
WHERE estudiante = estudiante:demo
  AND estado = 'activo';
```

### Query para Obtener Estudiantes de una Cohorte

```surql
-- Estudiantes inscritos en una cohorte
SELECT
  id,
  estado,
  progreso_general,
  estudiante.*,
  estudiante.user.*
FROM inscripcion_cohorte
WHERE cohorte = cohorte:primavera_2025
ORDER BY progreso_general DESC;
```

## Permisos de Acceso

Los permisos están configurados para que:

- **Estudiantes** pueden:
  - Ver su propio perfil y progreso
  - Ver cohortes en las que están inscritos
  - Crear/actualizar su propio progreso
  - Ver feedback recibido

- **Instructores** pueden:
  - Ver todos los estudiantes de sus cohortes
  - Ver progreso de todos los estudiantes
  - Crear/actualizar evaluaciones
  - Ver métricas y puntos de fricción

- **Admin** puede:
  - Acceso completo a todo

## Próximos Pasos

1. **Ejecutar migración**: Correr `pnpm tsx reset-and-migrate.ts` para aplicar cambios
2. **Probar autenticación**: Implementar login de estudiantes en el frontend
3. **Implementar inscripciones**: Crear flujo para inscribir estudiantes en cohortes
4. **Dashboard de estudiante**: Mostrar progreso y cohortes asignadas
5. **API endpoints**: Crear endpoints para gestión de estudiantes y cohortes

## Estructura de Datos Completa

Total de tablas en la base de datos: **27 tablas**

- 7 tablas base (DDD): programa, fase, proof_point, exercise_template, exercise_instance, exercise_content, user
- 20 tablas nuevas (Student Execution + Snapshots)

## Notas Importantes

- ⚠️ Las contraseñas están hasheadas con Argon2
- ⚠️ Los snapshots garantizan que cambios en el programa no afecten cohortes activas
- ⚠️ Los permisos evitan que estudiantes vean datos de otros estudiantes
- ⚠️ El sistema de puntos de fricción detecta automáticamente problemas en el contenido

## Testing

Para verificar que todo funcione:

```bash
# 1. Iniciar SurrealDB (si no está corriendo)
surreal start --log trace --user root --pass root memory

# 2. En otra terminal, ejecutar migración
cd packages/database
pnpm tsx reset-and-migrate.ts --confirm

# 3. Verificar que las 27 tablas existen
# El script mostrará un checklist completo

# 4. Opcionalmente, ejecutar seed con datos de prueba
pnpm tsx seed.ts
```

## Soporte

Si encuentras problemas:
1. Verifica que SurrealDB esté corriendo
2. Revisa los logs de migración
3. Verifica las variables de entorno en apps/api/.env
4. Consulta la documentación de SurrealDB para queries avanzadas
