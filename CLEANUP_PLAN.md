# Plan de Limpieza - Código Legacy

## 📋 Objetivo
Eliminar todo el código legacy, documentación obsoleta y archivos no utilizados antes de continuar con la Fase 3 de la refactorización DDD.

---

## 🗑️ Archivos a Eliminar

### 1. **Directorio Legacy Completo: `apps/api/src/domains/`**
**Razón**: Reemplazado completamente por la nueva arquitectura DDD

Contenido a eliminar:
```
domains/
├── analytics/          (7 archivos) - Movido a nueva arquitectura
├── cohortes/           (8 archivos) - Movido a nueva arquitectura
├── contenido/          (12 archivos) - Movido a nueva arquitectura
├── ejercicios/         (9 archivos) - Reemplazado por exercise-catalog/instance
├── generacion/         (11 archivos) - Movido a nueva arquitectura
├── programas/          (10 archivos) - Reemplazado por program-design
└── usuarios/           (3 archivos) - Se mantiene temporalmente
```

**Total: ~60 archivos TypeScript legacy**

**Acción**:
- ❌ Eliminar todo excepto `usuarios/` (auth aún necesario temporalmente)
- ✅ La nueva arquitectura tiene equivalentes en domain/, application/, infrastructure/

---

### 2. **Documentación Legacy en `/docs/`**
**Razón**: Documentación de fases anteriores ya completadas

```
❌ FASE-4-API-EDICION-CONTENIDO.md
❌ FASE-4-CHECKLIST.md
❌ FASE-4-FRONTEND-INTEGRATION.md
❌ FASE-7-RESUMEN-EJECUTIVO.md
❌ FASE6_ANALYTICS_README.md
❌ README-FASE-7.md
❌ fase-7-e2e-testing.md
❌ fase-7-implementation-summary.md
❌ fase-7-instrucciones-finales.md
❌ fase-7-mock-removal-checklist.md
❌ fase-7-progreso.md
```

**Total: 11 archivos MD obsoletos**

---

### 3. **Documentación Legacy en Raíz**
**Razón**: Documentación de migraciones anteriores ya no relevante

```
❌ LEGACY_CLEANUP.md            - Ya limpiado
❌ DEPRECATION_ANNOUNCEMENT.md  - Obsoleto
❌ API_MIGRATION_GUIDE.md       - De migración anterior
❌ EXTERNAL_API_MIGRATION.md    - De migración anterior
❌ DATABASE_TEST_READY.md       - Estado antiguo
❌ SCHEMA_SUMMARY.md            - Reemplazado por nueva arquitectura
❌ DEVELOPER_ONBOARDING.md      - Desactualizado
❌ IMPLEMENTATION_SUMMARY.md    - De fase anterior
❌ PROJECT_STATUS.md            - Obsoleto (tenemos PHASE2_SUMMARY)
❌ FRONTEND_AUTH_SUMMARY.md     - Información antigua
❌ AUTHENTICATION_SUMMARY.md    - Información antigua
```

**Total: 11 archivos MD obsoletos**

**Mantener**:
```
✅ README.md                    - Principal del proyecto
✅ DDD_ARCHITECTURE.md          - Arquitectura actual
✅ IMPLEMENTATION_GUIDE.md      - Guía actual
✅ REFACTORING_PROGRESS.md      - Estado actual
✅ PHASE2_SUMMARY.md            - Resumen de Fase 2
```

---

### 4. **Componentes Frontend Obsoletos**
**Razón**: Componentes de fases anteriores no usados en nuevo flujo

```
❌ components/fase2/            - Componentes de fase 2 antigua
❌ components/fase3/            - Componentes de fase 3 antigua
❌ components/fase4/            - Componentes de fase 4 antigua
```

**Mantener temporalmente**:
```
✅ components/wizard/           - Se usará en nueva UI
✅ components/ui/               - Componentes base (shadcn)
✅ components/shared/           - Compartidos
✅ components/analytics/        - Analytics necesario
✅ components/cohort/           - Cohort necesario
✅ components/generation/       - Generación necesaria
```

---

### 5. **Archivos de Migración Antiguos**
```
❌ packages/database/migrations/000-*.surql  - Migraciones antiguas
✅ packages/database/migrations/001-*.surql  - Mantener si tiene datos útiles
✅ packages/database/migrations/002-*.surql  - Nueva migración DDD
```

---

## 📊 Resumen de Limpieza

### Archivos a Eliminar
```
Legacy Backend (domains/):      ~50 archivos  (excepto usuarios/)
Legacy Docs (docs/):            11 archivos
Legacy Docs (root):             11 archivos
Legacy Frontend:                ~30 archivos  (fase2/, fase3/, fase4/)
─────────────────────────────────────────────
TOTAL:                          ~102 archivos
```

### Espacio Liberado Estimado
```
Archivos TypeScript:    ~15,000 líneas
Archivos MD:            ~5,000 líneas
Componentes React:      ~3,000 líneas
─────────────────────────────────────────────
TOTAL:                  ~23,000 líneas de código legacy
```

---

## ✅ Archivos Críticos a Mantener

### Backend
```
✅ apps/api/src/core/           - Auth, database, guards (necesarios)
✅ apps/api/src/domain/         - Nueva arquitectura DDD
✅ apps/api/src/application/    - Nueva arquitectura DDD
✅ apps/api/src/infrastructure/ - Nueva arquitectura DDD
✅ apps/api/src/domains/usuarios/ - Auth temporal (hasta migración)
```

### Frontend
```
✅ components/ui/               - Componentes base
✅ components/wizard/           - Wizard de ejercicios
✅ components/shared/           - Compartidos
✅ app/                         - Next.js routes
✅ hooks/                       - Custom hooks
✅ stores/                      - Zustand stores
```

### Database
```
✅ packages/database/schema/    - Esquemas actuales
✅ packages/database/migrations/002-*.surql - Nueva migración
```

### Documentación
```
✅ README.md
✅ DDD_ARCHITECTURE.md
✅ IMPLEMENTATION_GUIDE.md
✅ REFACTORING_PROGRESS.md
✅ PHASE2_SUMMARY.md
```

---

## 🎯 Estrategia de Eliminación

### Fase 1: Backup
```bash
# Crear branch de backup
git checkout -b backup/before-cleanup
git push -u origin backup/before-cleanup

# Volver a branch principal
git checkout claude/mira-process-setup-011CUsDauoSnFw5mKz2Qh3Ps
```

### Fase 2: Eliminar Legacy Backend
```bash
# Eliminar dominios legacy (excepto usuarios)
rm -rf apps/api/src/domains/analytics
rm -rf apps/api/src/domains/cohortes
rm -rf apps/api/src/domains/contenido
rm -rf apps/api/src/domains/ejercicios
rm -rf apps/api/src/domains/generacion
rm -rf apps/api/src/domains/programas
```

### Fase 3: Eliminar Docs Legacy
```bash
# Eliminar docs obsoletos
rm -rf docs/

# Eliminar MD legacy en raíz
rm -f LEGACY_CLEANUP.md
rm -f DEPRECATION_ANNOUNCEMENT.md
rm -f API_MIGRATION_GUIDE.md
rm -f EXTERNAL_API_MIGRATION.md
rm -f DATABASE_TEST_READY.md
rm -f SCHEMA_SUMMARY.md
rm -f DEVELOPER_ONBOARDING.md
rm -f IMPLEMENTATION_SUMMARY.md
rm -f PROJECT_STATUS.md
rm -f FRONTEND_AUTH_SUMMARY.md
rm -f AUTHENTICATION_SUMMARY.md
```

### Fase 4: Eliminar Componentes Legacy
```bash
# Eliminar componentes de fases antiguas
rm -rf apps/instructor-app/components/fase2
rm -rf apps/instructor-app/components/fase3
rm -rf apps/instructor-app/components/fase4
```

### Fase 5: Commit
```bash
git add -A
git commit -m "chore: Remove legacy code and obsolete documentation"
git push
```

---

## 📝 Notas Importantes

1. **No eliminar `usuarios/`**: El auth aún se usa, migrar en Fase 3
2. **Mantener `core/`**: Database connection, guards necesarios
3. **Backup creado**: Branch `backup/before-cleanup` por seguridad
4. **Reversible**: Si algo falla, `git revert` o checkout backup

---

## ✨ Beneficios Post-Limpieza

1. **Código más limpio** - Solo arquitectura DDD
2. **Menos confusión** - Un solo patrón arquitectural
3. **Build más rápido** - Menos archivos a compilar
4. **Buscar más fácil** - No hay código duplicado
5. **Onboarding más claro** - Solo documentación actual

---

**Fecha**: 2025-11-06
**Estado**: Pendiente de ejecución
**Aprobación necesaria**: Sí ✋
