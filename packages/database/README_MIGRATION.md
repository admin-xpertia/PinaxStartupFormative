# Database Reset & Migration Guide

Este directorio contiene scripts para resetear y migrar la base de datos a la nueva arquitectura DDD.

## 🔥 ADVERTENCIA

**Estos scripts son DESTRUCTIVOS**. Eliminarán TODOS los datos y tablas existentes.

## Scripts Disponibles

### 1. Script Bash (Recomendado para desarrollo)

```bash
# Con confirmación interactiva
./reset-db.sh

# Sin confirmación (para scripts CI/CD)
./reset-db.sh --confirm

# Ver ayuda
./reset-db.sh --help
```

### 2. Script TypeScript (Más control)

```bash
# Con confirmación interactiva
pnpm tsx reset-and-migrate.ts

# Sin confirmación
pnpm tsx reset-and-migrate.ts --confirm
```

### 3. NPM Scripts (Desde package.json)

```bash
# Desde el directorio database/
pnpm reset              # Con confirmación
pnpm reset:confirm      # Sin confirmación
pnpm migrate            # TypeScript directo con confirmación
pnpm migrate:confirm    # TypeScript directo sin confirmación
```

## Variables de Entorno

Puedes personalizar la conexión con estas variables:

```bash
export SURREAL_URL="http://127.0.0.1:8000/rpc"
export SURREAL_USER="root"
export SURREAL_PASS="root"
export SURREAL_NS="xpertia"
export SURREAL_DB="plataforma"

./reset-db.sh --confirm
```

## ¿Qué hace el script?

### Paso 1: Eliminación
- ✅ Elimina TODAS las tablas existentes
- ✅ Elimina TODOS los índices
- ✅ Elimina TODOS los scopes
- ✅ Limpia completamente la base de datos

### Paso 2: Creación
- ✅ Aplica el nuevo schema DDD desde `schema/schema-ddd.surql`
- ✅ Crea las tablas del dominio:
  - `programa` (Program Design)
  - `fase` (Program Design)
  - `proof_point` (Program Design)
  - `exercise_template` (Exercise Catalog)
  - `exercise_instance` (Exercise Instance)
  - `exercise_content` (Exercise Instance)
  - `user` (Authentication)
- ✅ Configura índices para optimización
- ✅ Define permisos y scopes

### Paso 3: Seed Data
- ✅ Crea usuario admin por defecto
- ✅ Crea usuario instructor demo
- ✅ Inserta datos básicos necesarios

### Paso 4: Verificación
- ✅ Verifica que todas las tablas fueron creadas
- ✅ Verifica que los usuarios existen
- ✅ Muestra resumen de la migración

## Credenciales por Defecto

Después de ejecutar el script, tendrás estos usuarios:

**Administrador:**
- Email: `admin@xpertia.com`
- Password: `Admin123!`

**Instructor Demo:**
- Email: `instructor@xpertia.com`
- Password: `Instructor123!`

⚠️ **IMPORTANTE**: Cambiar estas contraseñas en producción.

## Schema DDD

El nuevo schema está en `schema/schema-ddd.surql` e incluye:

### Bounded Contexts

1. **Program Design** - Diseño de programas educativos
   - programa
   - fase
   - proof_point

2. **Exercise Catalog** - Catálogo de templates de ejercicios
   - exercise_template

3. **Exercise Instance** - Instancias de ejercicios
   - exercise_instance
   - exercise_content

### Características

- ✅ Schema completo con tipos estrictos (SCHEMAFULL)
- ✅ Validaciones en campos (ASSERT)
- ✅ Valores por defecto apropiados
- ✅ Índices optimizados para queries comunes
- ✅ Permisos granulares por rol
- ✅ Scope de autenticación configurado

## Ejemplos de Uso

### Desarrollo Local

```bash
# Resetear y aplicar nuevo schema
cd packages/database
./reset-db.sh
```

### Ambiente de Testing

```bash
export SURREAL_DB="plataforma_test"
./reset-db.sh --confirm
```

### CI/CD

```bash
# Sin confirmación interactiva
./reset-db.sh --confirm
```

## Troubleshooting

### Error: No se puede conectar a SurrealDB

**Solución**: Asegúrate de que SurrealDB está corriendo:

```bash
surreal start --log trace --user root --pass root memory
```

### Error: Archivo schema-ddd.surql no encontrado

**Solución**: Verifica que estás en el directorio correcto:

```bash
cd packages/database
ls schema/schema-ddd.surql
```

### Error: Permisos denegados

**Solución**: Haz el script ejecutable:

```bash
chmod +x reset-db.sh
```

## Flujo de Trabajo Recomendado

1. **Backup** (si tienes datos importantes):
   ```bash
   pnpm export > backup-$(date +%Y%m%d).surql
   ```

2. **Reset**:
   ```bash
   ./reset-db.sh --confirm
   ```

3. **Verificar**:
   ```bash
   pnpm query
   # En la consola SQL:
   INFO FOR DB;
   SELECT * FROM user;
   ```

4. **Seed adicional** (opcional):
   ```bash
   pnpm seed
   ```

## Archivos Relacionados

- `schema/schema-ddd.surql` - Schema completo DDD
- `reset-and-migrate.ts` - Script TypeScript de migración
- `reset-db.sh` - Script Bash wrapper
- `seed.ts` - Script de seed data adicional (opcional)

## Seguridad

- ⚠️ **NUNCA** ejecutar en producción sin backup
- ⚠️ Cambiar contraseñas por defecto inmediatamente
- ⚠️ Revisar permisos antes de exponer a internet
- ⚠️ Usar variables de entorno para credenciales sensibles

## Soporte

Si encuentras problemas:

1. Verifica que SurrealDB está corriendo
2. Verifica las variables de entorno
3. Revisa los logs del script
4. Consulta la documentación de SurrealDB: https://surrealdb.com/docs
