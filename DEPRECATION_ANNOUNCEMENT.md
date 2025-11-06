# 🚨 Deprecation Announcement: Component System → Exercise System

**Date:** 2025-11-06
**Announcement Type:** Breaking Changes
**Severity:** High
**Target Audience:** All developers, API consumers, stakeholders

---

## Summary

The Xpertia Platform has completed a major architectural refactoring, migrating from a rigid 5-level hierarchy to a flexible 3-level hierarchy with template-based exercises. This change significantly improves the platform's flexibility and AI integration capabilities.

**All legacy component-related code has been deprecated and will be removed.**

---

## What's Changing

### Old Architecture (DEPRECATED)
```
Programa → Fase → ProofPoint → Nivel → Componente
                                         ├─ leccion
                                         ├─ cuaderno
                                         ├─ simulacion
                                         └─ herramienta
```

### New Architecture (CURRENT)
```
Programa → Fase → ProofPoint → ExerciseInstance
                                └─ Based on flexible templates
                                   (10+ types, easily extensible)
```

---

## Impact Assessment

### Backend (API)

#### ✅ Completed
- ❌ Removed `ComponentesService` and `ComponentesController`
- ❌ Removed `UpdateContenidoDto`
- ❌ Deleted all `/api/v1/componentes/*` endpoints
- ✅ Added new exercise-based endpoints
- ✅ Implemented AI content generation
- ✅ Updated `ProgramasModule`

#### 📊 Impact: HIGH
All backend migration is complete. Old endpoints return 404.

---

### Frontend (Instructor App)

#### ✅ Completed
- ❌ Removed `/componentes/[componenteId]/*` pages
- ❌ Deprecated `use-contenido.ts` hook
- ✅ Updated wizard components (removed nivel references)
- ✅ Marked fase3 editors as deprecated

#### ⏳ In Progress
- [ ] Update `visual-roadmap-builder.tsx` (remove numero_niveles)
- [ ] Remove legacy API calls from mock data files

#### 📊 Impact: MEDIUM
Main frontend cleanup complete. Minor cleanup tasks remain.

---

### Database Schema

#### ✅ Completed
- ❌ Removed 8 legacy tables (nivel, componente, progreso_*, etc.)
- ❌ Removed 7 snapshot tables
- ✅ Added exercise system tables
- ✅ Created migration files
- ✅ Updated init-schema.sh

#### 📊 Impact: HIGH
All schema changes complete. Migrations ready for production.

---

## Timeline

### Phase 1: Backend Migration ✅ COMPLETE
**Duration:** Week 1-2 (Completed 2025-11-06)
**Status:** ✅ Done

- [x] Create migration files
- [x] Remove legacy services and controllers
- [x] Update modules
- [x] Implement new exercise endpoints
- [x] Remove deprecated DTOs

---

### Phase 2: Database Migration ✅ COMPLETE
**Duration:** Week 1-2 (Completed 2025-11-06)
**Status:** ✅ Done

- [x] Remove table definitions from schema files
- [x] Delete snapshots.surql
- [x] Mark deprecated types
- [x] Update init script

---

### Phase 3: Frontend Migration 🔄 IN PROGRESS
**Duration:** Week 3-4 (Current)
**Status:** ~95% Complete

- [x] Remove legacy pages
- [x] Deprecate legacy hooks
- [x] Update wizard
- [ ] Final cleanup (visual roadmap, mock data)

---

### Phase 4: Documentation & Communication ✅ COMPLETE
**Duration:** Week 3-4 (Completed 2025-11-06)
**Status:** ✅ Done

- [x] Create API migration guide
- [x] Update developer onboarding
- [x] Create external API consumer guide
- [x] Publish deprecation announcement (this document)

---

### Phase 5: Final Cleanup & Removal 📅 PLANNED
**Duration:** Week 5-6
**Status:** ⏳ Pending

- [ ] Remove deprecated TypeScript types
- [ ] Remove fase3 editor components
- [ ] Remove use-contenido.ts hook
- [ ] Clean up remaining references
- [ ] Run production migrations

---

## Action Required

### For Internal Developers

**Immediate Actions:**
1. ✅ Read [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)
2. ✅ Review [API_MIGRATION_GUIDE.md](./API_MIGRATION_GUIDE.md)
3. ⚠️ **Do NOT use deprecated code** (see list below)
4. ✅ Use new exercise system for all new features

**Deprecated Code - DO NOT USE:**
```typescript
// ❌ DO NOT USE
import { ComponentesService } from './componentes.service';
import { useContenido } from '@/lib/hooks/use-contenido';

// ✅ USE INSTEAD
import { ExerciseInstancesService } from '@/domains/ejercicios';
// Use new exercise hooks (to be created)
```

**Deprecated Files - DO NOT EDIT:**
- `apps/api/src/domains/programas/componentes.*` (deleted)
- `apps/instructor-app/lib/hooks/use-contenido.ts` (deprecated)
- `apps/instructor-app/components/fase3/*` (deprecated)

---

### For External API Consumers

**Critical Action Required:**
Your integration **will stop working** if you don't migrate.

**Steps:**
1. ✅ Read [EXTERNAL_API_MIGRATION.md](./EXTERNAL_API_MIGRATION.md)
2. ⚠️ Test your integration against staging
3. ⚠️ Update to new endpoints
4. ⚠️ Deploy before deadline

**Deadline:** Week 4 (TBD - to be announced)

**Support:** Contact api-support@xpertia.com

---

## Benefits of This Change

### For Developers
- ✅ Simpler architecture (3 levels vs 5)
- ✅ More flexible exercise types (10+ vs 4)
- ✅ Better AI integration
- ✅ Easier to extend
- ✅ Less boilerplate code

### For Users
- ✅ More diverse learning experiences
- ✅ AI-generated content
- ✅ Faster content creation
- ✅ Better personalization

### For the Platform
- ✅ Reduced technical debt
- ✅ Easier maintenance
- ✅ Faster feature development
- ✅ More scalable architecture

---

## Migration Support

### Documentation
- 📖 [API Migration Guide](./API_MIGRATION_GUIDE.md) - Complete endpoint reference
- 📖 [Developer Onboarding](./DEVELOPER_ONBOARDING.md) - New developer guide
- 📖 [External API Migration](./EXTERNAL_API_MIGRATION.md) - For API consumers
- 📖 [Legacy Cleanup Guide](./LEGACY_CLEANUP.md) - Detailed cleanup steps

### Getting Help

**Internal Developers:**
- 💬 Slack: #platform-migration
- 📧 Email: dev-team@xpertia.com
- 🐛 Issues: GitHub Issues

**External API Consumers:**
- 📧 Email: api-support@xpertia.com
- 📚 Docs: https://docs.xpertia.com/api/v2
- 💬 Slack: #api-migration (request access)

---

## FAQ

**Q: Why was this change necessary?**
A: The old 5-level hierarchy was too rigid and limited the types of learning experiences we could create. The new template-based system is more flexible and integrates better with AI.

**Q: Will my existing data be lost?**
A: No data loss. However, the structure has changed. See migration guides for details.

**Q: Can I still use the old endpoints?**
A: No. They have been removed and return 404.

**Q: What if I don't migrate in time?**
A: Your integration will break. Please prioritize this migration.

**Q: Are there any new features?**
A: Yes! AI content generation, 10+ exercise types, and more flexible configuration.

**Q: Who approved this change?**
A: This was a team decision based on technical debt and platform scalability needs.

---

## Metrics

### Code Removal
- **Files Deleted:** 3 (componentes.service.ts, componentes.controller.ts, update-contenido.dto.ts)
- **Pages Removed:** 3 (editar-cuaderno, editar-leccion, editar-simulacion)
- **Database Tables Removed:** 15 (8 legacy + 7 snapshot)
- **Endpoints Removed:** 4
- **Lines of Code Removed:** ~2,000+

### Code Added
- **Files Added:** 7+ (new exercise domain)
- **Database Tables Added:** 4 (exercise system)
- **Endpoints Added:** 8+
- **Lines of Code Added:** ~3,000+

### Net Impact
- ✅ More features with less complexity
- ✅ 33% reduction in hierarchy levels (5 → 3)
- ✅ 150% increase in exercise types (4 → 10)

---

## Rollback Plan

**Can this change be rolled back?**

⚠️ **Limited rollback capability** due to:
- Database migrations are destructive
- Old code has been deleted
- Requires database restore from backup

**If critical issues arise:**
1. Restore database from backup (before migrations)
2. Revert git commits (2+ commits)
3. Redeploy old version

**Mitigation:** Thorough testing in staging before production deployment.

---

## Sign-Off

This deprecation has been:
- ✅ Reviewed by: Development Team
- ✅ Approved by: Technical Lead
- ✅ Tested in: Development & Staging
- ⏳ Pending: Production deployment

---

## Communication Schedule

- **2025-11-06:** Initial announcement (this document)
- **Week 1-2:** Internal migration & testing
- **Week 3:** External API consumer notification
- **Week 4:** Final migration deadline
- **Week 5+:** Legacy code removal

---

## Questions or Concerns?

Contact the development team:
- 📧 dev-team@xpertia.com
- 💬 Slack: #platform-migration

**Thank you for your cooperation during this important platform upgrade!**

---

**Status:** 🟢 Migration On Track
**Last Updated:** 2025-11-06
