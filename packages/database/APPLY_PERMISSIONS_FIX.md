# Fix para Permisos de la Tabla User

## Problema

El backend no puede leer registros de usuarios porque está autenticado con credenciales root, y los permisos de la tabla `user` solo permiten SELECT cuando `$auth.rol = 'admin'`.

Las credenciales root no establecen el contexto `$auth` de la misma manera que la autenticación por scope, por lo que la condición `$auth.rol = 'admin'` falla.

## Solución

Cambiar los permisos de SELECT en la tabla `user` a FULL, permitiendo que el backend (usando credenciales root) pueda leer usuarios para validar tokens.

## Cómo Aplicar

### Opción 1: Dashboard de SurrealDB Cloud (Recomendado)

1. Accede a https://cloud.surrealdb.com
2. Abre tu base de datos: **StartupFormative / Roadmap**
3. Ve a la sección **Query** o **Editor**
4. Ejecuta el siguiente comando:

```surql
-- Aplicar nuevos permisos
ALTER TABLE user
  PERMISSIONS
    FOR select FULL
    FOR create WHERE $auth.rol = 'admin'
    FOR update WHERE id = $auth.id OR $auth.rol = 'admin'
    FOR delete WHERE $auth.rol = 'admin';
```

5. Verifica que se aplicó correctamente:

```surql
INFO FOR TABLE user;
```

### Opción 2: Usar la Migración

Ejecuta el archivo de migración completo:

```bash
cat packages/database/migrations/fix-user-permissions.surql
```

Copia el contenido y ejecútalo en el dashboard.

## Verificación

Después de aplicar el fix, verifica que el backend puede leer usuarios:

1. Reinicia el backend:
```bash
cd apps/api
pnpm start:dev
```

2. Prueba el login:
```bash
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@xpertia.com",
    "password": "Instructor123!"
  }'
```

3. El login debería funcionar correctamente y el backend debería poder leer el usuario.

## Notas de Seguridad

⚠️ **Importante**: Con `SELECT FULL`, cualquier conexión autenticada puede leer todos los usuarios.

En el futuro, considera:
- Implementar autenticación por scope para el backend (como admin@xpertia.com)
- Usar un token de servicio específico con permisos limitados
- Implementar field-level permissions para ocultar campos sensibles

Por ahora, esto es aceptable ya que:
- El backend necesita acceso para validar tokens
- Solo conexiones autenticadas pueden acceder
- CREATE/UPDATE/DELETE siguen restringidos a admin
