import { NextResponse } from "next/server"

// Provee el shape esperado por la UI de /programas/[id]/analytics.
// Se devuelve vacío para evitar 404 hasta que el backend real esté disponible.
export async function GET() {
  return NextResponse.json(
    {
      phases: [],
      atRiskStudents: [],
      submissions: [],
      hasPublishedExercises: false,
      publishedExercisesCount: 0,
      totalStudents: 0,
    },
    { status: 200 },
  )
}
