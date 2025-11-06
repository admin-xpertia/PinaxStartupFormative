# External API Consumer Migration Guide

**Effective Date:** 2025-11-06
**API Version:** v2.0
**Migration Deadline:** TBD

---

## Important Notice

The Xpertia Platform API has undergone a major architectural change. If you are consuming our API externally, **you must migrate your integration** to continue working with the platform.

### What Changed?

We've simplified our content hierarchy and introduced a flexible, template-based exercise system. This change makes the API more powerful and easier to use, but requires updates to your integration.

---

## Quick Migration Checklist

- [ ] Review endpoint changes below
- [ ] Update authentication (if applicable)
- [ ] Replace deprecated endpoint calls
- [ ] Update your data models
- [ ] Test against our staging environment
- [ ] Update to production

---

## Breaking Changes Summary

### Removed Endpoints (Return 404)

All endpoints related to the old component system have been removed:

```
❌ GET    /api/v1/componentes/:id/contenido
❌ PUT    /api/v1/componentes/:id/contenido
❌ GET    /api/v1/componentes/:componenteId/rubrica
❌ POST   /api/v1/componentes/:componenteId/rubrica
```

### New Endpoints

```
✅ GET    /api/v1/exercise-instances/:id
✅ GET    /api/v1/exercise-instances/:id/content
✅ GET    /api/v1/proof-points/:id/exercise-instances
✅ POST   /api/v1/exercise-instances
✅ PUT    /api/v1/exercise-instances/:id
✅ DELETE /api/v1/exercise-instances/:id
✅ GET    /api/v1/exercise-templates
✅ POST   /api/v1/exercise-generation/:instanceId
```

---

## Migration Guide by Use Case

### Use Case 1: Reading Exercise Content

**Before:**
```bash
GET /api/v1/componentes/comp123/contenido
```

**Response:**
```json
{
  "id": "comp123",
  "tipo": "leccion",
  "contenido": { ... }
}
```

**After:**
```bash
GET /api/v1/exercise-instances/inst456/content
```

**Response:**
```json
{
  "id": "exercise_content:abc",
  "exercise_instance": "exercise_instance:inst456",
  "contenido": { ... },
  "estado": "publicado",
  "version": 1
}
```

**Migration Steps:**
1. Replace `componenteId` with `exerciseInstanceId` in your code
2. Update endpoint URL
3. Adjust response parsing (structure changed slightly)

---

### Use Case 2: Listing Exercises for a Learning Unit

**Before:**
```bash
GET /api/v1/niveles/nivel123/componentes
```

**After:**
```bash
GET /api/v1/proof-points/pp456/exercise-instances
```

**Note:** We removed the "Nivel" (Level) concept. Exercises now belong directly to ProofPoints.

**Migration Steps:**
1. Replace `nivelId` references with `proofPointId`
2. Update endpoint URL
3. The response structure is similar but uses `exercise_instance` instead of `componente`

---

### Use Case 3: Creating New Content

**Before:**
```bash
POST /api/v1/componentes
Content-Type: application/json

{
  "nivel": "nivel:xyz",
  "tipo": "leccion",
  "nombre": "My Lesson",
  "duracion_estimada_minutos": 30
}
```

**After:**
```bash
POST /api/v1/exercise-instances
Content-Type: application/json

{
  "template": "exercise_template:leccion_interactiva",
  "proof_point": "proof_point:xyz",
  "nombre": "My Lesson",
  "duracion_estimada_minutos": 30,
  "configuracion_personalizada": {
    "nivel_dificultad": "basico"
  }
}
```

**Key Changes:**
- Replace `nivel` with `proof_point`
- Replace `tipo` with `template` (must reference an exercise template)
- Add `configuracion_personalizada` based on template schema
- Content is now AI-generated (see Use Case 4)

**Migration Steps:**
1. First, query available templates: `GET /api/v1/exercise-templates`
2. Choose appropriate template
3. Update your POST request structure
4. After creating instance, trigger content generation (see Use Case 4)

---

### Use Case 4: Updating/Generating Content

**Before:**
```bash
PUT /api/v1/componentes/comp123/contenido
Content-Type: application/json

{
  "contenido": {
    "markdown": "# Updated content...",
    "palabras_estimadas": 500
  }
}
```

**After:**

Content is now **AI-generated** rather than manually edited. To update content:

```bash
POST /api/v1/exercise-generation/inst456
Content-Type: application/json

{
  "configuracion": {
    "modelo": "claude-3-5-sonnet",
    "temperatura": 0.7
  },
  "prompt_adicional": "Focus on practical examples"
}
```

**This is asynchronous!** Check generation status:

```bash
GET /api/v1/exercise-generation/req789/status
```

**Response:**
```json
{
  "id": "generacion_request:req789",
  "estado": "completed",
  "exercise_content": "exercise_content:abc123",
  "created_at": "2025-11-06T10:00:00Z",
  "completed_at": "2025-11-06T10:01:30Z"
}
```

**Migration Steps:**
1. Remove PUT logic for manual content updates
2. Implement POST to generation endpoint
3. Implement polling or webhooks for generation status
4. Handle async completion

---

### Use Case 5: Working with Rubrics

**Before:**
```bash
GET /api/v1/componentes/comp123/rubrica
POST /api/v1/componentes/comp123/rubrica
```

**After:**

Rubrics are now **part of the exercise template configuration**, not separate entities.

To work with rubrics:
1. Query the exercise template: `GET /api/v1/exercise-templates/:id`
2. Check `configuracion_schema` for rubric configuration options
3. Set rubric parameters in `configuracion_personalizada` when creating instance

**Example:**
```json
{
  "template": "exercise_template:cuaderno_trabajo",
  "configuracion_personalizada": {
    "rubrica": {
      "dimensiones": [
        {
          "nombre": "Claridad",
          "peso": 40,
          "descriptores": [...]
        }
      ]
    }
  }
}
```

**Migration Steps:**
1. Remove separate rubric API calls
2. Integrate rubric configuration into exercise instance creation
3. Query template schema to understand available rubric options

---

## Authentication Changes

**No changes to authentication** - continue using your existing API keys or JWT tokens.

If you encounter authentication issues after migration, contact support.

---

## Data Model Changes

### Removed Concepts
- `nivel` (Level) - merged into ProofPoint
- `componente` (Component) - replaced by ExerciseInstance

### New Concepts
- `exercise_template` - Reusable exercise type definition
- `exercise_instance` - Applied template to a proof point
- `exercise_content` - AI-generated content for an instance

### ID Format Changes

**Before:**
```
componente:abc123
nivel:xyz789
```

**After:**
```
exercise_instance:abc123
exercise_template:leccion_interactiva
exercise_content:xyz789
proof_point:pp123  (no change)
```

Update your ID parsing logic accordingly.

---

## Testing Your Migration

### 1. Staging Environment

Test your integration against our staging environment:

```
https://api-staging.xpertia.com/v1/
```

Use your existing API credentials.

### 2. Verify Old Endpoints Return 404

```bash
curl -X GET https://api-staging.xpertia.com/v1/componentes/test/contenido
# Expected: 404 Not Found
```

### 3. Test New Endpoint Flow

```bash
# 1. List templates
curl -X GET https://api-staging.xpertia.com/v1/exercise-templates \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Create instance
curl -X POST https://api-staging.xpertia.com/v1/exercise-instances \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "exercise_template:leccion_interactiva",
    "proof_point": "proof_point:test",
    "nombre": "Test Exercise",
    "duracion_estimada_minutos": 30
  }'

# 3. Generate content
curl -X POST https://api-staging.xpertia.com/v1/exercise-generation/INSTANCE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"configuracion": {"temperatura": 0.7}}'

# 4. Check generation status
curl -X GET https://api-staging.xpertia.com/v1/exercise-generation/REQUEST_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Get content
curl -X GET https://api-staging.xpertia.com/v1/exercise-instances/INSTANCE_ID/content \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Migration Support

### Timeline

- **Now - Week 2:** Migration period - both old and new APIs available in staging
- **Week 3:** Old API endpoints return 410 Gone with migration instructions
- **Week 4+:** Old API endpoints completely removed

### Getting Help

**Have questions or need help migrating?**

- 📧 Email: api-support@xpertia.com
- 📚 Full API docs: https://docs.xpertia.com/api/v2
- 💬 Developer Slack: #api-migration
- 🐛 Report issues: https://github.com/xpertia/platform/issues

**Migration assistance available:**
- We can provide 1-on-1 migration support
- Sample code available for common use cases
- Dedicated Slack channel for questions

---

## Code Examples

### JavaScript/TypeScript

```typescript
// Old (deprecated)
async function getComponentContent(componentId: string) {
  const response = await fetch(
    `https://api.xpertia.com/v1/componentes/${componentId}/contenido`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.json();
}

// New
async function getExerciseContent(instanceId: string) {
  const response = await fetch(
    `https://api.xpertia.com/v1/exercise-instances/${instanceId}/content`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.json();
}
```

### Python

```python
# Old (deprecated)
import requests

def get_component_content(component_id: str, token: str):
    response = requests.get(
        f"https://api.xpertia.com/v1/componentes/{component_id}/contenido",
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

# New
def get_exercise_content(instance_id: str, token: str):
    response = requests.get(
        f"https://api.xpertia.com/v1/exercise-instances/{instance_id}/content",
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()
```

---

## FAQ

**Q: Why did you make this change?**
A: The old 5-level hierarchy was too rigid. The new template-based system is more flexible and powerful, allowing for more exercise types and better AI integration.

**Q: Will my existing data be migrated automatically?**
A: No. This is a breaking change. You need to update your integration code to use the new endpoints.

**Q: What happens if I don't migrate?**
A: Your integration will stop working when we remove the old endpoints. Please migrate as soon as possible.

**Q: Is there a grace period?**
A: Yes, we're providing 4+ weeks notice. See timeline above.

**Q: Can I get help migrating?**
A: Yes! Contact api-support@xpertia.com for assistance.

**Q: Are there any new features I should know about?**
A: Yes! The new system supports 10+ exercise types, AI content generation, and more flexible configuration. See full API docs for details.

---

**Thank you for your patience during this migration. We believe these changes will make your integration more powerful and easier to maintain!**

*Last updated: 2025-11-06*
