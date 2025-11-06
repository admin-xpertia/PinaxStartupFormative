# Phase 3.5 - Second Cleanup Plan

## 🎯 Objetivo

Eliminar archivos y directorios obsoletos antes de iniciar la Fase 4, manteniendo solo lo esencial y funcional para la nueva arquitectura DDD.

---

## 📋 Archivos Identificados para Eliminación

### 1. **Root Level Files** (5 archivos)

```
✗ history.txt                    # Historial obsoleto
✗ temp                           # Archivo temporal
✗ verify-schema.mjs              # Script de verificación obsoleto
✗ verify-schema.surql            # Script de verificación obsoleto
✗ apply-permissions.mjs          # Script obsoleto (se usa el de database/)
✗ CLEANUP_PLAN.md                # Plan de limpieza anterior (consolidar)
✗ CLEANUP_SUMMARY.md             # Resumen de limpieza anterior (consolidar)
```

### 2. **Database Package - Obsolete Schema Files** (15 archivos)

```
packages/database/schema/
✗ analytics.surql                # Backend analytics eliminado
✗ analytics.surql.bak2           # Backup obsoleto
✗ analytics.surql.bak3           # Backup obsoleto
✗ contenido.surql                # Backend contenido eliminado
✗ contenido.surql.bak2           # Backup obsoleto
✗ contenido.surql.bak3           # Backup obsoleto
✗ ejecucion.surql                # Backend eliminado
✗ ejecucion.surql.bak2           # Backup obsoleto
✗ ejecucion.surql.bak3           # Backup obsoleto
✗ ejercicios.surql               # Reemplazado por nueva arquitectura DDD
✗ generacion.surql               # Backend generacion eliminado
✗ generacion.surql.bak2          # Backup obsoleto
✗ generacion.surql.bak3          # Backup obsoleto
✗ portafolio.surql               # Backend portafolio eliminado
✗ portafolio.surql.bak2          # Backup obsoleto
✗ portafolio.surql.bak3          # Backup obsoleto
✗ versiones.surql                # Sistema de versiones obsoleto
✗ versiones.surql.bak2           # Backup obsoleto
✗ versiones.surql.bak3           # Backup obsoleto
✗ cohortes.surql                 # Backend cohortes eliminado
```

**Mantener:**
- ✅ auth.surql (auth funcional)
- ✅ init.surql (inicialización)
- ✅ exercise-schemas.json (esquemas de ejercicios)

### 3. **Database Package - Obsolete Scripts** (9 archivos)

```
packages/database/
✗ history.txt                    # Historial obsoleto
✗ queries-ejemplos.surql         # Queries de ejemplo obsoletas
✗ recreate-tables.mjs            # Script de recreación obsoleto
✗ recreate-tables.surql          # Script de recreación obsoleto
✗ update-permissions.mjs         # Script obsoleto
✗ update-permissions.surql       # Script obsoleto
✗ update-programa-schema.mjs     # Script obsoleto con nueva arquitectura
✗ update-programa-schema.surql   # Script obsoleto con nueva arquitectura
✗ clean.ts                       # Script de limpieza obsoleto
```

**Mantener:**
- ✅ apply-schema.ts (aplicar esquema)
- ✅ config.ts (configuración)
- ✅ init-db.sh (inicialización)
- ✅ init-schema.sh (inicialización)
- ✅ seed.ts (seeds)
- ✅ types.ts (tipos)

### 4. **Frontend - Obsolete Pages** (directorio completo)

```
apps/instructor-app/app/
✗ cohortes/                      # Backend cohortes eliminado - no funciona
  ✗ page.tsx
  ✗ [id]/page.tsx
  ✗ [id]/estudiantes/[estudianteId]/page.tsx
```

**Nota:** Las páginas de cohortes ya no tienen backend funcional (módulo eliminado en limpieza anterior).

### 5. **Frontend - Obsolete Components** (3 directorios)

```
apps/instructor-app/components/
✗ cohort/                        # Componentes de cohortes sin backend
  ✗ cohort-list-view.tsx
  ✗ cohort-management-view.tsx
  ✗ student-detail-view.tsx (si existe)

✗ analytics/                     # Componentes analytics sin backend
  ✗ (todos los archivos)

✗ generation/                    # Componentes generation sin backend
  ✗ (todos los archivos)
```

**Verificar antes de eliminar:**
- Si exercise-wizard-dialog.tsx usa componentes de generation/

---

## 📊 Resumen de Eliminaciones

### Por Categoría

```
Root Level:                5 archivos
Database Schema:          19 archivos (.surql + .bak)
Database Scripts:          9 archivos
Frontend Pages:            1 directorio (cohortes/)
Frontend Components:       3 directorios (cohort/, analytics/, generation/)

Total Estimado:           ~40 archivos + 4 directorios
```

### Por Razón de Eliminación

```
Sin backend funcional:    ~15 archivos (cohortes, analytics, generation)
Backups obsoletos:        ~12 archivos (.bak2, .bak3)
Scripts obsoletos:        ~10 archivos (recreate, update, verify)
Archivos temporales:       ~3 archivos (temp, history.txt)
```

---

## ✅ Archivos a Mantener (Verificación)

### Root
- ✅ README.md
- ✅ DDD_ARCHITECTURE.md
- ✅ IMPLEMENTATION_GUIDE.md
- ✅ REFACTORING_PROGRESS.md
- ✅ PHASE2_SUMMARY.md
- ✅ PHASE3_SUMMARY.md
- ✅ package.json, pnpm-*, tsconfig.json, etc.

### Database
- ✅ schema/auth.surql
- ✅ schema/init.surql
- ✅ schema/exercise-schemas.json
- ✅ migrations/ (todos)
- ✅ seeds/ (todos)
- ✅ apply-schema.ts, config.ts, init-*.sh, seed.ts, types.ts

### Frontend
- ✅ app/programas/ (programa design)
- ✅ app/biblioteca/ (templates)
- ✅ app/login/, app/signup/ (auth)
- ✅ app/guias/, app/soporte/ (docs)
- ✅ components/shared/ (componentes compartidos)
- ✅ components/ui/ (shadcn components)
- ✅ components/wizard/ (wizard components)
- ✅ components/*.tsx (root level components)

---

## 🚨 Verificaciones Previas

Antes de eliminar, verificar:

1. **¿Hay imports de componentes cohort/analytics/generation?**
   ```bash
   grep -r "from.*cohort" apps/instructor-app --include="*.tsx" --include="*.ts"
   grep -r "from.*analytics" apps/instructor-app --include="*.tsx" --include="*.ts"
   grep -r "from.*generation" apps/instructor-app --include="*.tsx" --include="*.ts"
   ```

2. **¿Hay referencias a esquemas eliminados?**
   ```bash
   grep -r "analytics\\.surql" packages/database
   grep -r "contenido\\.surql" packages/database
   ```

3. **¿Hay enlaces en la navegación?**
   ```bash
   grep -r "cohortes" apps/instructor-app/components/sidebar.tsx
   grep -r "analytics" apps/instructor-app/components/sidebar.tsx
   ```

---

## 📝 Orden de Ejecución

1. **Crear backup branch**
2. **Eliminar archivos de database/schema/** (backups y obsoletos)
3. **Eliminar scripts obsoletos de database/**
4. **Eliminar archivos obsoletos de root**
5. **Eliminar páginas obsoletas de frontend**
6. **Eliminar componentes obsoletos de frontend**
7. **Actualizar sidebar/navegación** (si tiene enlaces a páginas eliminadas)
8. **Verificar builds**
9. **Commit y push**

---

## 🎯 Resultado Esperado

### Estructura Limpia

```
/ (root)
├── README.md
├── DDD_ARCHITECTURE.md
├── IMPLEMENTATION_GUIDE.md
├── REFACTORING_PROGRESS.md
├── PHASE2_SUMMARY.md
├── PHASE3_SUMMARY.md
├── PHASE3.5_CLEANUP.md          ← Nuevo documento consolidado
├── packages/database/
│   ├── schema/
│   │   ├── auth.surql           ← Solo archivos esenciales
│   │   ├── init.surql
│   │   └── exercise-schemas.json
│   ├── migrations/              ← Mantener todos
│   ├── seeds/                   ← Mantener todos
│   └── [scripts esenciales]
└── apps/
    ├── api/
    │   ├── domain/              ← DDD layers
    │   ├── application/
    │   ├── infrastructure/
    │   └── modules/
    └── instructor-app/
        ├── app/
        │   ├── programas/       ← Solo páginas funcionales
        │   ├── biblioteca/
        │   └── [auth pages]
        └── components/
            ├── shared/          ← Solo componentes funcionales
            ├── ui/
            └── wizard/
```

### Métricas Objetivo

```
Archivos eliminados:    ~40 archivos
Directorios eliminados:  4 directorios
Líneas eliminadas:      ~5,000 líneas
Reducción de tamaño:    ~15%
Claridad:               100% mejora
```

---

## ⚠️ Precauciones

1. **NO eliminar:**
   - Ningún archivo .md de documentación de arquitectura
   - Migraciones de base de datos
   - Seeds de base de datos
   - Componentes UI de shadcn
   - Archivos de configuración (package.json, tsconfig, etc.)

2. **Verificar imports** antes de eliminar componentes

3. **Crear backup branch** antes de cualquier eliminación

4. **Probar build** después de eliminaciones

---

**Estado:** ✅ Plan Completo - Listo para Ejecutar
**Próximo Paso:** Crear backup y comenzar eliminaciones
