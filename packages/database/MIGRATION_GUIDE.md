# Guía de Migración: Agregar instructor_scope

## Problema

El sistema de autenticación está intentando usar `instructor_scope` pero solo existe `user_scope` en la base de datos. Esto causa el error "Usuario no encontrado" después de un login exitoso.

## Solución

Aplicar la migración `add-instructor-scope.surql` para crear el scope faltante.

## Pasos para Aplicar la Migración

### Opción 1: Dashboard Web de SurrealDB Cloud (Recomendado)

1. **Accede al dashboard**:
   - URL: https://cloud.surrealdb.com
   - Inicia sesión

2. **Navega a tu base de datos**:
   - Namespace: `StartupFormative`
   - Database: `Roadmap`

3. **Abre el Query Editor**

4. **Copia y pega este SQL**:

```sql
-- Crear el instructor_scope
DEFINE SCOPE instructor_scope SESSION 24h
  SIGNIN (
    SELECT * FROM user
    WHERE email = $email
    AND crypto::argon2::compare(password_hash, $password)
    AND rol = 'instructor'
    AND activo = true
  )
  SIGNUP (
    CREATE user SET
      email = $email,
      nombre = $nombre,
      password_hash = crypto::argon2::generate($password),
      rol = 'instructor',
      activo = true
  );

-- Verificar
INFO FOR DB;
```

5. **Ejecuta** la query

6. **Verifica** que en la salida de `INFO FOR DB` aparece `instructor_scope`

### Opción 2: Usando surreal CLI

```bash
surreal sql \
  --endpoint "wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud" \
  --namespace "StartupFormative" \
  --database "Roadmap" \
  --username "admin" \
  --password "xpertia123" \
  < packages/database/migrations/add-instructor-scope.surql
```

## Verificación Post-Migración

### 1. Verifica que el scope existe

En el Query Editor de SurrealDB Cloud:

```sql
INFO FOR DB;
```

Busca `instructor_scope` en los scopes listados.

### 2. Prueba el login

Desde tu aplicación frontend, intenta hacer login con:
- **Email**: `instructor@xpertia.com`
- **Password**: `Instructor123!`

Debería funcionar correctamente ahora.

### 3. Verifica en logs

Los logs del backend deberían mostrar:
```
[AuthService] Sesión iniciada exitosamente: instructor@xpertia.com
[AuthGuard] Usuario consultado: { id: 'user:instructor', ... }
```

Sin el error "Usuario no encontrado".

## Troubleshooting

### Error: "Scope already exists"
✅ La migración ya fue aplicada, no necesitas hacer nada más.

### Error: "Authentication failed" al hacer login
Verifica que el usuario instructor existe:

```sql
SELECT * FROM user WHERE email = 'instructor@xpertia.com';
```

Si no existe, créalo:

```sql
CREATE user:instructor SET
  email = 'instructor@xpertia.com',
  nombre = 'Instructor Demo',
  password_hash = crypto::argon2::generate('Instructor123!'),
  rol = 'instructor',
  activo = true;
```

### El login es exitoso pero luego falla con "Usuario no encontrado"

Esto significa que el backend está conectado a una base de datos diferente. Verifica:

1. **Variables de entorno** en `apps/api/.env`:
   ```env
   SURREAL_URL=wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud
   SURREAL_NAMESPACE=StartupFormative
   SURREAL_DATABASE=Roadmap
   SURREAL_USER=admin
   SURREAL_PASS=xpertia123
   ```

2. **Reinicia el backend** después de cambiar las variables.

## Archivos Modificados

### Schema Base
- `packages/database/schema/schema-ddd.surql` - Agregado instructor_scope

### Migración
- `packages/database/migrations/add-instructor-scope.surql` - Script de migración

### Documentación
- `packages/database/MIGRATION_GUIDE.md` - Esta guía

## Próximos Pasos

Después de aplicar la migración exitosamente:

1. ✅ Verifica que el login funciona
2. ✅ Prueba crear un programa (requiere estar autenticado como instructor)
3. ✅ Verifica que el AuthGuard no arroja errores
4. ✅ Continúa con el flujo normal de desarrollo

## Contacto

Si tienes problemas aplicando esta migración, verifica:
- Que estás conectado a la base de datos correcta
- Que tienes permisos de admin
- Que el usuario instructor existe en la base de datos
