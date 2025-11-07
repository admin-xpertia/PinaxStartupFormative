# Solución: Error "Usuario no encontrado" después de Login

## 🔴 Problema

El login es exitoso pero inmediatamente después falla con:
```
[AuthService] Sesión iniciada exitosamente: instructor@xpertia.com
[AuthGuard] Error en autenticación: UnauthorizedException: Usuario no encontrado
```

### Síntoma Clave

La query retorna solo el ID como string:
```json
[
  "user:instructor"
]
```

En lugar del objeto completo:
```json
[
  {
    "id": "user:instructor",
    "email": "instructor@xpertia.com",
    "nombre": "Instructor Demo",
    "rol": "instructor",
    ...
  }
]
```

## 🔍 Causa Raíz

**El backend está conectado a una base de datos diferente** a donde se hizo el login.

- **Login**: Se autentica en `StartupFormative/Roadmap` (SurrealDB Cloud)
- **Backend**: Está conectado a `xpertia/plataforma` (local) o a otra base de datos

## ✅ Solución

### 1. Verifica el archivo `.env` del backend

Ruta: `apps/api/.env`

**Debe tener estas credenciales exactas:**

```env
# SurrealDB Cloud Connection
SURREAL_URL=wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud
SURREAL_NAMESPACE=StartupFormative
SURREAL_DATABASE=Roadmap
SURREAL_USER=admin
SURREAL_PASS=xpertia123

# API Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# CORS
CORS_ORIGIN=http://localhost:3001

# Logging
LOG_LEVEL=debug
```

### 2. Verifica el archivo `.env.example`

Si no existe el `.env`, cópialo desde `.env.example`:

```bash
cd apps/api
cp .env.example .env
```

Luego edita el `.env` con las credenciales correctas de arriba.

### 3. Reinicia el Backend

**IMPORTANTE**: Después de cambiar el `.env`, **debes reiniciar** el backend para que tome los cambios:

```bash
# Si está corriendo, detenerlo (Ctrl+C)
# Luego reiniciarlo:
cd apps/api
pnpm dev
```

### 4. Verifica los Logs al Iniciar

Cuando el backend inicie, deberías ver estos logs:

```
[SurrealDbService] Conectando a SurrealDB...
[SurrealDbService] 🔧 Configuration:
[SurrealDbService]    URL: wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud
[SurrealDbService]    Namespace: StartupFormative
[SurrealDbService]    Database: Roadmap
[SurrealDbService]    User: admin
[SurrealDbService] ✅ Conectado a SurrealDB: wss://... (StartupFormative/Roadmap)
```

**Si ves otros valores (como `xpertia/plataforma`), el `.env` no está bien configurado.**

### 5. Prueba el Login Nuevamente

1. Ve al frontend
2. Haz login con:
   - Email: `instructor@xpertia.com`
   - Password: `Instructor123!`

Los logs deberían ser:

```
[AuthService] Sesión iniciada exitosamente: instructor@xpertia.com
[AuthGuard] Token payload: {
  "NS": "StartupFormative",
  "DB": "Roadmap",
  "AC": "instructor_scope",
  "ID": "user:instructor"
}
[SurrealDbService] 📄 SELECT: user:instructor
[SurrealDbService] 📄 SELECT result: [
  {
    "id": "user:instructor",
    "email": "instructor@xpertia.com",
    "nombre": "Instructor Demo",
    "rol": "instructor",
    "activo": true
  }
]
✅ Autenticación exitosa
```

**Sin el error "Usuario no encontrado".**

## 🛠️ Verificación Rápida

### Script de Verificación

```bash
cd packages/database
pnpm tsx verify-setup.ts
```

Este script:
- ✅ Verifica que `instructor_scope` existe
- ✅ Verifica que el usuario instructor existe
- ✅ Prueba la autenticación
- ✅ Te muestra la configuración recomendada para el `.env`

### Verificación Manual en SurrealDB Cloud

1. Ve a https://cloud.surrealdb.com
2. Accede a `StartupFormative/Roadmap`
3. Ejecuta en el Query Editor:

```sql
-- Verificar que el usuario existe
SELECT * FROM user WHERE email = 'instructor@xpertia.com';
```

Deberías ver:
```json
[
  {
    "id": "user:instructor",
    "email": "instructor@xpertia.com",
    "nombre": "Instructor Demo",
    "rol": "instructor",
    "activo": true,
    ...
  }
]
```

Si no ves nada, necesitas crear el usuario:

```sql
CREATE user:instructor SET
  email = 'instructor@xpertia.com',
  nombre = 'Instructor Demo',
  password_hash = crypto::argon2::generate('Instructor123!'),
  rol = 'instructor',
  activo = true,
  preferencias = {},
  created_at = time::now(),
  updated_at = time::now();
```

## 🎯 Checklist Completo

- [ ] Archivo `apps/api/.env` existe
- [ ] `SURREAL_URL` apunta a SurrealDB Cloud (wss://...)
- [ ] `SURREAL_NAMESPACE` es `StartupFormative`
- [ ] `SURREAL_DATABASE` es `Roadmap`
- [ ] `SURREAL_USER` es `admin`
- [ ] `SURREAL_PASS` es `xpertia123`
- [ ] Backend reiniciado después de cambiar `.env`
- [ ] Logs de inicio muestran la configuración correcta
- [ ] Usuario `instructor@xpertia.com` existe en la base de datos
- [ ] Login funciona sin error "Usuario no encontrado"

## 📚 Archivos de Referencia

- **Configuración del Backend**: `apps/api/.env`
- **Schema de Base de Datos**: `packages/database/schema/schema-ddd.surql`
- **Seed de Usuarios**: `packages/database/seed-data.surql`
- **Guía de Migración**: `packages/database/MIGRATION_GUIDE.md`
- **Script de Verificación**: `packages/database/verify-setup.ts`

## 🆘 Si el Problema Persiste

Si después de seguir todos estos pasos el problema continúa:

1. **Verifica que no haya múltiples archivos `.env`**:
   ```bash
   find apps/api -name ".env*" -type f
   ```

2. **Verifica que las variables se estén cargando**:
   Agrega un `console.log` temporal en `apps/api/src/main.ts`:
   ```typescript
   console.log('SURREAL_URL:', process.env.SURREAL_URL);
   console.log('SURREAL_NAMESPACE:', process.env.SURREAL_NAMESPACE);
   console.log('SURREAL_DATABASE:', process.env.SURREAL_DATABASE);
   ```

3. **Verifica que no haya variables de entorno del sistema**:
   ```bash
   env | grep SURREAL
   ```
   Si hay alguna, están sobrescribiendo el `.env`.

4. **Verifica los logs completos del backend** al iniciar para confirmar la configuración.

## 💡 Resumen

El problema es simple: **el backend está conectado a una base de datos diferente**. La solución es asegurar que el archivo `apps/api/.env` tenga las credenciales correctas de SurrealDB Cloud y reiniciar el backend.
