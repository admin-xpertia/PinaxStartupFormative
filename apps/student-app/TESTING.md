# Testing del Flujo de Autenticación

## Cambios realizados

### 1. Página principal (`/`)
- Ahora verifica si hay autenticación antes de redirigir
- Si NO hay autenticación → redirige a `/login`
- Si hay autenticación → redirige a `/dashboard`

### 2. Hook `useStudentSession`
- Prioriza la autenticación sobre las variables de entorno
- Solo usa variables de entorno como fallback si:
  - NO hay autenticación
  - NO estamos en proceso de carga
  - Las variables NO contienen "REEMPLAZAR"

### 3. Dashboard
- Ahora verifica explícitamente `isAuthenticated` antes de permitir acceso
- Redirige a `/login` si no hay autenticación válida

## Cómo probar el flujo completo

### Paso 1: Limpiar el estado actual

Abre las DevTools del navegador (F12) y ejecuta en la consola:

```javascript
// Limpiar todo el localStorage
localStorage.clear()
// Recargar la página
window.location.reload()
```

O simplemente:
1. Abre DevTools (F12)
2. Ve a Application → Storage → Clear site data
3. Marca todas las opciones
4. Click en "Clear site data"
5. Recarga la página

### Paso 2: Verificar redirección al login

1. La app debe redirigirte automáticamente a `http://localhost:3002/login`
2. Si no lo hace, verifica la consola del navegador para errores

### Paso 3: Hacer login

Usa las credenciales de prueba:
- Email: `estudiante@xpertia.com`
- Password: `Estudiante123!`

### Paso 4: Verificar el token

Después del login exitoso:
1. Abre DevTools → Application → Local Storage → `http://localhost:3002`
2. Debes ver:
   - `auth_token`: Un JWT válido
   - `auth_user`: Objeto con datos del usuario
   - `student_enrollment`: Datos del enrollment (si existe)

### Paso 5: Verificar dashboard

Después del login, debes ser redirigido a `/dashboard` y ver tu información de estudiante.

## Solución de problemas

### Si el login falla:

1. **Verificar que el backend esté corriendo**:
   ```bash
   cd apps/api
   pnpm dev
   ```

2. **Verificar la conexión a SurrealDB**:
   ```bash
   surreal start --log info --user root --pass root --bind 127.0.0.1:8000 file:./data/xpertia.db
   ```

3. **Verificar que exista el usuario de prueba**:
   - Abre http://localhost:8000 (SurrealDB Studio)
   - Ejecuta: `SELECT * FROM usuario WHERE email = 'estudiante@xpertia.com';`

### Si ves error 401 "Token no proporcionado":

1. Verifica en DevTools → Network que la petición incluya el header `Authorization: Bearer <token>`
2. Si el token no está presente, verifica que `localStorage.getItem('auth_token')` devuelva un valor
3. Si el localStorage está vacío, el login no se completó correctamente

### Si sigues viendo las variables de entorno en uso:

Verifica que el `.env.local` tenga los placeholders (para forzar que NO se usen):

```env
NEXT_PUBLIC_DEFAULT_STUDENT_ID=estudiante:REEMPLAZAR_CON_ID_REAL
NEXT_PUBLIC_DEFAULT_COHORTE_ID=cohorte:REEMPLAZAR_CON_ID_REAL
```

O simplemente elimina/comenta estas líneas para deshabilitarlas completamente.

## Desarrollo sin autenticación (opcional)

Si quieres desarrollar SIN hacer login cada vez, puedes configurar IDs válidos en `.env.local`:

1. Obtén IDs reales de la BD:
   ```bash
   surreal sql --endpoint ws://127.0.0.1:8000/rpc \
     --namespace xpertia --database plataforma \
     --username root --password root \
     --command "SELECT id, email FROM estudiante LIMIT 1;"
   ```

2. Actualiza `.env.local` con los IDs reales (sin "REEMPLAZAR")
3. Limpia el localStorage
4. La app permitirá acceso sin login usando esos IDs
