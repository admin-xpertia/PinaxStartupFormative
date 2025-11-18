# Solución al Problema de Login de Estudiantes

## Problema Encontrado

El login de estudiantes fallaba con el error:
```
{
  "message": "Credenciales incorrectas o usuario inactivo",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**Causa raíz**: El scope `user_scope` en SurrealDB NO estaba validando:
- El rol del usuario (`rol = 'estudiante'`)
- El estado activo del usuario (`activo = true`)

Esto causaba que la autenticación fallara incluso con credenciales correctas.

## Cambios Realizados

### 1. Schema actualizado
Archivo: `packages/database/schema/schema-ddd.surql` línea 184

**ANTES:**
```sql
DEFINE SCOPE user_scope SESSION 24h
  SIGNIN (
    SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password_hash, $password)
  )
```

**DESPUÉS:**
```sql
DEFINE SCOPE user_scope SESSION 24h
  SIGNIN (
    SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password_hash, $password) AND rol = 'estudiante' AND activo = true
  )
```

### 2. Migración creada
Archivo: `packages/database/migrations/fix-user-scope-validation.surql`

Esta migración actualiza el scope en la base de datos sin necesidad de borrar datos.

## Cómo Aplicar la Solución

### Opción 1: Aplicar solo la migración (SIN PERDER DATOS)

1. **Inicia SurrealDB** (si no está corriendo):
   ```bash
   surreal start --log info --user root --pass root --bind 127.0.0.1:8000 file:./data/xpertia.db
   ```

2. **En otra terminal**, aplica la migración:
   ```bash
   cd packages/database
   surreal sql --endpoint ws://127.0.0.1:8000/rpc \
     --namespace xpertia --database plataforma \
     --username root --password root \
     < migrations/fix-user-scope-validation.surql
   ```

3. **Verifica que se aplicó**:
   ```bash
   surreal sql --endpoint ws://127.0.0.1:8000/rpc \
     --namespace xpertia --database plataforma \
     --username root --password root
   ```

   Luego ejecuta en el prompt SQL:
   ```sql
   INFO FOR DB;
   ```

   Deberías ver el `user_scope` con la validación actualizada.

### Opción 2: Rehacer todo el schema (BORRA TODOS LOS DATOS)

Si prefieres empezar de cero:

```bash
cd packages/database
SURREAL_URL=ws://127.0.0.1:8000/rpc \
SURREAL_NAMESPACE=xpertia \
SURREAL_DATABASE=plataforma \
SURREAL_USER=root \
SURREAL_PASS=root \
pnpm migrate:confirm
```

## Verificar que funciona

1. **Limpia el localStorage** del navegador:
   - Abre DevTools (F12)
   - Consola: `localStorage.clear()`
   - Recarga la página

2. **Navega a la app**:
   - Ve a `http://localhost:3002`
   - Debes ser redirigido a `/login`

3. **Haz login con**:
   - Email: `estudiante@xpertia.com`
   - Password: `Estudiante123!`

4. **Resultado esperado**:
   - Login exitoso ✅
   - Redirección a `/dashboard` ✅
   - Token guardado en localStorage ✅
   - Peticiones API con header `Authorization` ✅

## Detalles Técnicos

### Comparación de Scopes

**instructor_scope** (ya estaba correcto):
```sql
SELECT * FROM user WHERE
  email = $email AND
  crypto::argon2::compare(password_hash, $password) AND
  rol = 'instructor' AND
  activo = true
```

**user_scope** (ahora corregido):
```sql
SELECT * FROM user WHERE
  email = $email AND
  crypto::argon2::compare(password_hash, $password) AND
  rol = 'estudiante' AND
  activo = true
```

### Flujo de Autenticación

1. Frontend envía credenciales a `/api/v1/auth/signin`
2. Backend intenta autenticar primero con `instructor_scope`
3. Si falla, intenta con `user_scope`
4. Si alguno funciona, devuelve el token JWT
5. Frontend guarda el token en `localStorage`
6. Todas las peticiones subsecuentes incluyen `Authorization: Bearer <token>`

## Archivos Modificados

- ✅ `packages/database/schema/schema-ddd.surql` - Schema corregido
- ✅ `packages/database/migrations/fix-user-scope-validation.surql` - Migración creada
- ✅ `apps/student-app/app/page.tsx` - Redirección mejorada
- ✅ `apps/student-app/lib/hooks/use-student-session.ts` - Prioriza autenticación
- ✅ `apps/student-app/app/dashboard/page.tsx` - Valida autenticación

## Próximos Pasos

1. **Aplica la migración** usando la Opción 1 o 2 de arriba
2. **Reinicia el backend** de la API si está corriendo:
   ```bash
   cd apps/api
   pnpm dev
   ```
3. **Prueba el login** siguiendo los pasos de "Verificar que funciona"

Si tienes problemas, verifica:
- ✅ SurrealDB está corriendo en puerto 8000
- ✅ Backend API está corriendo en puerto 3000
- ✅ Frontend está corriendo en puerto 3002
- ✅ La migración se aplicó correctamente
