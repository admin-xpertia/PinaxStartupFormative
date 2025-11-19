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
type InstructorSubmissionListItem = {
  progressId: string
  estudianteNombre: string
  ejercicioNombre: string
  entregadoEl: string
  status: SubmissionStatus
  aiScore?: number | null
}

function normalizeExercise(ex: any): ExerciseShape {
  return {
    id: ex.id,
    nombre: ex.nombre ?? "Ejercicio",
    estadoContenido: ex.estadoContenido ?? ex.estado_contenido,
    esObligatorio: ex.esObligatorio ?? ex.es_obligatorio,
  }
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

  try {
    const cohorts = (await fetchApi<any[]>(`/cohortes`, req)) ?? []
    const cohortsForProgram = cohorts.filter((cohort) => {
      const cohortProgramId =
        typeof cohort.programa === "string" ? cohort.programa : cohort.programa?.id
      return cohortProgramId === programId
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
      const instructorSubmissions =
        (await fetchApi<InstructorSubmissionListItem[]>(
          `/instructor/cohortes/${encodeURIComponent(cohortId)}/submissions?limit=50`,
          req,
        )) ?? []

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
    }

    const structure = cohortDetails?.structure
    const proofPointsNeedingExercises = new Map<
      string,
      { id: string; nombre: string; faseNombre?: string }
    >()
    let publishedExercisesCount = 0

    if (structure?.phases?.length) {
      response.phases = structure.phases.map((phase: any) => ({
        id: phase.id ?? phase.slug ?? phase.nombre,
        nombre: phase.nombre ?? "Fase",
        progreso: 0,
      }))

      structure.phases.forEach((phase: any) => {
        const proofPoints = phase.proofPoints ?? phase.proof_points ?? []
        proofPoints.forEach((pp: any) => {
          if (!pp?.id) return
          const baseProofPoint = {
            id: pp.id,
            nombre: pp.nombre ?? "Proof Point",
            faseNombre: phase.nombre,
          }
          const exercises = pp.exercises ?? pp.ejercicios ?? []
          if (exercises.length === 0) {
            proofPointsNeedingExercises.set(pp.id, baseProofPoint)
            response.proofPoints.push({ ...baseProofPoint, ejercicios: [] })
            return
          }
          response.proofPoints.push({
            ...baseProofPoint,
            ejercicios: exercises.map(normalizeExercise),
          })
          publishedExercisesCount += exercises.filter((ex: any) => {
            const status = (ex.estadoContenido ?? ex.estado_contenido ?? "").toLowerCase()
            return status === "publicado"
          }).length
        })
      })
    }

    if (response.phases.length === 0) {
      const fases = (await fetchApi<any[]>(`/programs/${encodeURIComponent(programId)}/fases`, req)) ?? []
      response.phases = fases.map((fase) => ({
        id: fase.id,
        nombre: fase.nombre,
        progreso: 0,
      }))

      // If we couldn't use the snapshot, collect proof points to later count exercises
      for (const fase of fases) {
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

    response.publishedExercisesCount = publishedExercisesCount
    response.hasPublishedExercises = publishedExercisesCount > 0
  } catch (error) {
    console.error("[cohorts/analytics] Failed to assemble analytics", error)
  }

  return NextResponse.json(response, { status: 200 })
}
