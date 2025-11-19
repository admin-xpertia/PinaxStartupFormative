import { NextRequest, NextResponse } from "next/server"

const configuredUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"
const API_BASE_URL = configuredUrl.endsWith("/api/v1") ? configuredUrl : `${configuredUrl}/api/v1`

type RouteParams = { id?: string }
type RouteContext = { params: RouteParams | Promise<RouteParams> }
type PhaseShape = { id: string; nombre: string; progreso: number; promedioScore?: number }
type ExerciseShape = {
  id: string
  nombre: string
  estadoContenido?: string
  esObligatorio?: boolean
}
type ProofPointShape = {
  id: string
  nombre: string
  faseNombre?: string
  ejercicios: ExerciseShape[]
}
type SubmissionStatus =
  | "submitted_for_review"
  | "pending_review"
  | "requires_iteration"
  | "approved"
  | "graded"
  | "in_progress"
  | "not_started"
type InstructorSubmissionListItem = {
  progressId: string
  estudianteNombre: string
  ejercicioNombre: string
  entregadoEl: string
  status: SubmissionStatus
  aiScore?: number | null
}

type CohortProgressRecord = {
  progressId: string
  estudianteId: string
  estudianteNombre?: string
  exerciseInstanceId: string
  status: SubmissionStatus
  porcentajeCompletitud?: number | null
  aiScore?: number | null
  instructorScore?: number | null
  finalScore?: number | null
  submittedAt?: string | null
  gradedAt?: string | null
  updatedAt?: string | null
}

type CohortProgressOverviewResponse = {
  cohorteId: string
  submissions: CohortProgressRecord[]
}

type PhaseExerciseMeta = {
  phaseId: string
  phaseNombre: string
  proofPointId?: string
  proofPointNombre?: string
  exerciseNombre?: string
  exerciseInstanceId?: string
}

function normalizeId(id: string | undefined | null): string {
  if (!id) return ""
  const stringValue = String(id)
    .replace(/^type::thing\((.*)\)$/i, "$1")
    .replace(/^['"`](.*)['"`]$/, "$1")
  const colonIndex = stringValue.indexOf(":")
  const sliced = colonIndex >= 0 ? stringValue.slice(colonIndex + 1) : stringValue
  // CORRECCIÓN: Agregamos ⟨ y ⟩ al regex para soportar Mathematical Angle Brackets Unicode
  return sliced.replace(/[<>⟨⟩]/g, "").trim()
}

function resolveExerciseId(source: any): string {
  if (!source) return ""
  if (typeof source === "string") return source
  if (typeof source === "object") {
    if (typeof source.id === "string") return source.id
    if (typeof source.exerciseId === "string") return source.exerciseId
    if (typeof source.exercise_instance === "string") return source.exercise_instance
    if (typeof source["@id"] === "string") return source["@id"]
  }
  return ""
}

function normalizeExercise(ex: any): ExerciseShape {
  return {
    id: resolveExerciseId(ex),
    nombre: ex.nombre ?? "Ejercicio",
    estadoContenido: ex.estadoContenido ?? ex.estado_contenido,
    esObligatorio: ex.esObligatorio ?? ex.es_obligatorio,
  }
}

function clampPercentage(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function parseTimestamp(value?: string | null): number {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function resolvePhaseId(phase: any, fallbackIndex: number): string {
  if (phase?.id) return String(phase.id)
  if (phase?.slug) return String(phase.slug)
  if (phase?.nombre) return String(phase.nombre)
  return `phase-${fallbackIndex}`
}

function buildPhaseExerciseMaps(
  proofPoints: ProofPointShape[],
  proofPointPhaseLookup: Map<string, { phaseId: string; phaseNombre: string }>
): {
  phaseExercisesMap: Map<string, Set<string>>
  phaseExerciseLookup: Map<string, PhaseExerciseMeta>
} {
  const phaseExercisesMap = new Map<string, Set<string>>()
  const phaseExerciseLookup = new Map<string, PhaseExerciseMeta>()

  proofPoints.forEach((pp) => {
    if (!pp?.id) return
    const phaseInfo = proofPointPhaseLookup.get(pp.id)
    if (!phaseInfo) return
    const exercises = Array.isArray(pp.ejercicios) ? pp.ejercicios : []
    exercises.forEach((exercise) => {
      const exerciseId = resolveExerciseId(exercise)
      const normalizedExerciseId = normalizeId(exerciseId)
      if (!normalizedExerciseId) return
      if (!phaseExercisesMap.has(phaseInfo.phaseId)) {
        phaseExercisesMap.set(phaseInfo.phaseId, new Set<string>())
      }
      phaseExercisesMap.get(phaseInfo.phaseId)!.add(normalizedExerciseId)
      phaseExerciseLookup.set(normalizedExerciseId, {
        phaseId: phaseInfo.phaseId,
        phaseNombre: phaseInfo.phaseNombre,
        proofPointId: pp.id,
        proofPointNombre: pp.nombre,
        exerciseNombre: exercise.nombre ?? "Ejercicio",
        exerciseInstanceId: exerciseId,
      })
    })
  })

  return { phaseExercisesMap, phaseExerciseLookup }
}

async function fetchApi<T>(path: string, req: NextRequest): Promise<T | null> {
  const headers = new Headers({
    "Content-Type": "application/json",
  })

  const authHeader = req.headers.get("authorization")
  if (authHeader) {
    headers.set("Authorization", authHeader)
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { headers })
  if (!res.ok) {
    return null
  }

  return res.json()
}

function buildEmptyResponse() {
  return {
    phases: [] as PhaseShape[],
    atRiskStudents: [] as any[],
    submissions: [] as any[],
    hasPublishedExercises: false,
    publishedExercisesCount: 0,
    totalStudents: 0,
    proofPoints: [] as ProofPointShape[],
  }
}

function extractProgramId(req: NextRequest, context?: { params?: RouteParams }): string {
  const rawFromParams = context?.params?.id
  const rawFromPath = req.nextUrl.pathname
    .split("/api/cohorts/")[1]
    ?.split("/analytics")[0]
  const candidate = rawFromParams ?? rawFromPath ?? ""
  try {
    return decodeURIComponent(candidate)
  } catch {
    return candidate
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  const params = await context.params
  const programId = extractProgramId(req, { params })

  const response = buildEmptyResponse()
  let cohortProgressRecords: CohortProgressRecord[] = []
  const proofPointPhaseLookup = new Map<string, { phaseId: string; phaseNombre: string }>()
  let phaseExercisesMap = new Map<string, Set<string>>()
  let phaseExerciseLookup = new Map<string, PhaseExerciseMeta>()

  try {
    const cohorts = (await fetchApi<any[]>(`/cohortes`, req)) ?? []

    // FIX: Debug logging para identificar problemas de matching de cohorts
    console.log('[Analytics Debug] Program lookup:', {
      requestedProgramId: programId,
      requestedProgramIdNormalized: normalizeId(programId),
      totalCohorts: cohorts.length,
      cohortDetails: cohorts.map(c => ({
        id: c.id,
        programaRaw: c.programa,
        programaExtracted: typeof c.programa === 'string' ? c.programa : c.programa?.id,
        programaNormalized: normalizeId(
          typeof c.programa === 'string' ? c.programa : c.programa?.id
        )
      }))
    })

    // FIX: Normalizar IDs antes de comparar para evitar problemas con <> y ⟨⟩
    const cohortsForProgram = cohorts.filter((cohort) => {
      const cohortProgramId =
        typeof cohort.programa === "string" ? cohort.programa : cohort.programa?.id

      // Normalizar ambos IDs para comparación robusta
      const normalizedCohortProgram = normalizeId(cohortProgramId)
      const normalizedRequestProgram = normalizeId(programId)

      const matches = normalizedCohortProgram === normalizedRequestProgram

      if (!matches) {
        console.log('[Analytics Debug] Cohort filtered out:', {
          cohortId: cohort.id,
          cohortProgram: cohortProgramId,
          cohortProgramNormalized: normalizedCohortProgram,
          requestProgramNormalized: normalizedRequestProgram
        })
      }

      return matches
    })

    console.log('[Analytics Debug] Matched cohorts:', {
      count: cohortsForProgram.length,
      cohortIds: cohortsForProgram.map(c => c.id)
    })

    response.totalStudents = cohortsForProgram.reduce(
      (acc, cohort) => acc + (cohort.totalEstudiantes ?? 0),
      0,
    )

    const cohortId = cohortsForProgram[0]?.id
    const cohortDetails =
      !cohortsForProgram[0]?.structure && cohortId
        ? await fetchApi<any>(`/cohortes/${encodeURIComponent(cohortId)}`, req)
        : cohortsForProgram[0]

    if (cohortId) {
      console.log('[Analytics Debug] Fetching submissions for cohort:', {
        cohortId,
        endpoint: `/instructor/cohortes/${encodeURIComponent(cohortId)}/submissions?limit=50`
      })

      const instructorSubmissions =
        (await fetchApi<InstructorSubmissionListItem[]>(
          `/instructor/cohortes/${encodeURIComponent(cohortId)}/submissions?limit=50`,
          req,
        )) ?? []

      console.log('[Analytics Debug] Submissions fetched:', {
        count: instructorSubmissions.length,
        submissions: instructorSubmissions.map(s => ({
          progressId: s.progressId,
          estudiante: s.estudianteNombre,
          ejercicio: s.ejercicioNombre,
          status: s.status,
          aiScore: s.aiScore
        }))
      })

      response.submissions = instructorSubmissions.map((submission) => ({
        progressId: submission.progressId,
        estudiante: submission.estudianteNombre ?? "Estudiante",
        ejercicio: submission.ejercicioNombre ?? "Ejercicio",
        entregadoEl: submission.entregadoEl ?? new Date().toISOString(),
        status: submission.status ?? "pending_review",
        aiScore:
          typeof submission.aiScore === "number"
            ? Math.round(submission.aiScore)
            : null,
      }))

      const overview =
        (await fetchApi<CohortProgressOverviewResponse>(
          `/instructor/cohortes/${encodeURIComponent(cohortId)}/progress-overview`,
          req,
        )) ?? null

      cohortProgressRecords = (overview?.submissions ?? []).map((submission) => ({
        ...submission,
        exerciseInstanceId: normalizeId(
          submission.exerciseInstanceId ?? (submission as any).exercise_instance
        ),
      }))
    }

    const structure = cohortDetails?.structure
    const proofPointsNeedingExercises = new Map<
      string,
      { id: string; nombre: string; faseNombre?: string }
    >()
    let publishedExercisesCount = 0

    if (structure?.phases?.length) {
      response.phases = structure.phases.map((phase: any, index: number) => {
        const phaseId = resolvePhaseId(phase, index)
        const phaseNombre = phase.nombre ?? `Fase ${index + 1}`
        const proofPoints = phase.proofPoints ?? phase.proof_points ?? []
        proofPoints.forEach((pp: any) => {
          if (!pp?.id) return
          const proofPointId = pp.id
          proofPointPhaseLookup.set(proofPointId, { phaseId, phaseNombre })
          const baseProofPoint = {
            id: proofPointId,
            nombre: pp.nombre ?? "Proof Point",
            faseNombre: phaseNombre,
          }
          const exercises = pp.exercises ?? pp.ejercicios ?? []
          if (exercises.length === 0) {
            proofPointsNeedingExercises.set(proofPointId, baseProofPoint)
            response.proofPoints.push({ ...baseProofPoint, ejercicios: [] })
            return
          }
          const normalizedExercises = exercises.map(normalizeExercise)
          response.proofPoints.push({
            ...baseProofPoint,
            ejercicios: normalizedExercises,
          })
          publishedExercisesCount += normalizedExercises.filter((ex: any) => {
            const status = (ex.estadoContenido ?? ex.estado_contenido ?? "").toLowerCase()
            return status === "publicado"
          }).length
        })
        return {
          id: phaseId,
          nombre: phaseNombre,
          progreso: 0,
        }
      })
    }

    if (response.phases.length === 0) {
      const fases = (await fetchApi<any[]>(`/programs/${encodeURIComponent(programId)}/fases`, req)) ?? []
      response.phases = fases.map((fase, index) => ({
        id: resolvePhaseId(fase, index),
        nombre: fase.nombre,
        progreso: 0,
      }))

      // If we couldn't use the snapshot, collect proof points to later count exercises
      for (const [index, fase] of fases.entries()) {
        const phaseId = resolvePhaseId(fase, index)
        const proofPoints =
          (await fetchApi<any[]>(
            `/fases/${encodeURIComponent(fase.id)}/proof-points`,
            req,
          )) ?? []
        proofPoints.forEach((pp) => {
          if (!pp?.id) return
          const baseProofPoint = {
            id: pp.id,
            nombre: pp.nombre ?? "Proof Point",
            faseNombre: fase.nombre,
          }
          proofPointPhaseLookup.set(pp.id, { phaseId, phaseNombre: fase.nombre })
          proofPointsNeedingExercises.set(pp.id, baseProofPoint)
          response.proofPoints.push({ ...baseProofPoint, ejercicios: [] })
        })
      }
    }

    // Fetch exercises for proof points that don't include exercises in the snapshot
    if (proofPointsNeedingExercises.size > 0) {
      const exerciseLists = await Promise.all(
        Array.from(proofPointsNeedingExercises.entries()).map(async ([ppId, baseProofPoint]) => {
          const exercises =
            (await fetchApi<any[]>(
              `/proof-points/${encodeURIComponent(ppId)}/exercises`,
              req,
            )) ?? []
          return { baseProofPoint, exercises }
        }),
      )

      for (const { baseProofPoint, exercises } of exerciseLists) {
        response.proofPoints = response.proofPoints.map((pp) =>
          pp.id === baseProofPoint.id
            ? {
                ...pp,
                ejercicios: exercises.map(normalizeExercise),
              }
            : pp,
        )

        publishedExercisesCount += exercises.filter((ex: any) => {
          const status = (ex.estadoContenido ?? ex.estado_contenido ?? "").toLowerCase()
          return status === "publicado"
        }).length
      }
    }

    // Refresh exercises from the student endpoint to capture published ones
    const proofPointIds = Array.from(
      new Set(response.proofPoints.map((pp) => pp.id).filter(Boolean)),
    )

    if (proofPointIds.length > 0) {
      const publishedExercisesByProofPoint = await Promise.all(
        proofPointIds.map(async (ppId) => {
          const exercises =
            (await fetchApi<any[]>(
              `/student/proof-points/${encodeURIComponent(ppId)}/exercises`,
              req,
            )) ?? null
          return { ppId, exercises }
        }),
      )

      const publishedLookup = new Map(
        publishedExercisesByProofPoint.map(({ ppId, exercises }) => [ppId, exercises]),
      )

      publishedExercisesCount = 0
      response.proofPoints = response.proofPoints.map((pp) => {
        const published = publishedLookup.get(pp.id)
        const exercisesSource =
          published === null || published === undefined ? pp.ejercicios ?? [] : published
        const normalized = exercisesSource.map(normalizeExercise)

        publishedExercisesCount += normalized.filter(
          (ex) => (ex.estadoContenido ?? "").toLowerCase() === "publicado",
        ).length

        return { ...pp, ejercicios: normalized }
      })
    }

    const maps = buildPhaseExerciseMaps(response.proofPoints, proofPointPhaseLookup)
    phaseExercisesMap = maps.phaseExercisesMap
    phaseExerciseLookup = maps.phaseExerciseLookup

    const discoveredExercises = phaseExerciseLookup.size
    response.publishedExercisesCount =
      discoveredExercises > 0 ? discoveredExercises : publishedExercisesCount
    const uniqueStudentCount = cohortProgressRecords.length
      ? Array.from(
          new Set(
            cohortProgressRecords
              .map((record) => record.estudianteId)
              .filter((value): value is string => Boolean(value)),
          ),
        ).length
      : 0
    const effectiveStudentCount =
      response.totalStudents > 0 ? response.totalStudents : Math.max(uniqueStudentCount, 1)

    if (response.phases.length > 0) {
      response.phases = response.phases.map((phase) => {
        const exerciseIds = Array.from(phaseExercisesMap.get(phase.id) ?? [])
        if (exerciseIds.length === 0) {
          return { ...phase, progreso: 0, promedioScore: undefined }
        }

        const exerciseIdSet = new Set(exerciseIds)
        const relatedProgress = cohortProgressRecords.filter((record) => {
          const normalizedRecordId = normalizeId(record.exerciseInstanceId)
          return normalizedRecordId && exerciseIdSet.has(normalizedRecordId)
        })

        if (relatedProgress.length === 0) {
          return { ...phase, progreso: 0, promedioScore: undefined }
        }

        const progressSum = relatedProgress.reduce(
          (sum, record) => sum + clampPercentage(record.porcentajeCompletitud ?? 0),
          0,
        )
        const denominator = exerciseIds.length * effectiveStudentCount
        const progreso =
          denominator > 0 ? Math.min(100, Math.round(progressSum / denominator)) : 0

        const gradedScores = relatedProgress
          .filter((record) => record.status === "graded" || record.status === "approved")
          .map((record) => {
            if (typeof record.finalScore === "number") return record.finalScore
            if (typeof record.instructorScore === "number") return record.instructorScore
            if (typeof record.aiScore === "number") return record.aiScore
            return null
          })
          .filter((value): value is number => value !== null)

        const promedioScore =
          gradedScores.length > 0
            ? Math.round(
                gradedScores.reduce((acc, value) => acc + value, 0) / gradedScores.length,
              )
            : undefined

        return { ...phase, progreso, promedioScore }
      })
    }

    if (cohortProgressRecords.length > 0) {
      const exercisesInProgram =
        phaseExerciseLookup.size ||
        response.proofPoints.reduce(
          (acc, proofPoint) => acc + (proofPoint.ejercicios?.length ?? 0),
          0,
        )

      const recordsByStudent = new Map<string, CohortProgressRecord[]>()
      cohortProgressRecords.forEach((record) => {
        if (!record.estudianteId) return
        if (!recordsByStudent.has(record.estudianteId)) {
          recordsByStudent.set(record.estudianteId, [])
        }
        recordsByStudent.get(record.estudianteId)!.push(record)
      })

      const now = Date.now()
      const riskEntries = Array.from(recordsByStudent.entries()).map(([studentId, records]) => {
        const studentName =
          records.find((record) => record.estudianteNombre)?.estudianteNombre ?? "Estudiante"
        const progressSum = records.reduce(
          (sum, record) => sum + clampPercentage(record.porcentajeCompletitud ?? 0),
          0,
        )
        const denominator =
          exercisesInProgram > 0 ? exercisesInProgram : Math.max(records.length, 1)
        const progreso =
          denominator > 0 ? Math.min(100, Math.round(progressSum / denominator)) : 0
        const lastActivity = records.reduce((latest, record) => {
          const candidate =
            parseTimestamp(record.updatedAt) ||
            parseTimestamp(record.gradedAt) ||
            parseTimestamp(record.submittedAt)
          return Math.max(latest, candidate)
        }, 0)
        const diasInactivo = lastActivity
          ? Math.max(0, Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24)))
          : 99
        const attentionRecord = records
          .filter((record) =>
            ["pending_review", "submitted_for_review", "requires_iteration", "in_progress"].includes(
              record.status,
            ),
          )
          .sort((a, b) => {
            const bDate =
              parseTimestamp(b.updatedAt) ||
              parseTimestamp(b.submittedAt) ||
              parseTimestamp(b.gradedAt)
            const aDate =
              parseTimestamp(a.updatedAt) ||
              parseTimestamp(a.submittedAt) ||
              parseTimestamp(a.gradedAt)
            return bDate - aDate
          })[0]
        const exerciseMeta = attentionRecord
          ? phaseExerciseLookup.get(normalizeId(attentionRecord.exerciseInstanceId))
          : null

        return {
          id: studentId,
          nombre: studentName,
          progreso: Math.max(0, Math.min(100, progreso)),
          diasInactivo,
          ejercicioActual: exerciseMeta?.exerciseNombre,
        }
      })

      riskEntries.sort((a, b) => {
        if (a.progreso === b.progreso) {
          return b.diasInactivo - a.diasInactivo
        }
        return a.progreso - b.progreso
      })

      response.atRiskStudents = riskEntries.slice(0, 12)
    } else {
      response.atRiskStudents = []
    }
  } catch (error) {
    console.error("[cohorts/analytics] Failed to assemble analytics", error)
  }

  return NextResponse.json(response, { status: 200 })
}
