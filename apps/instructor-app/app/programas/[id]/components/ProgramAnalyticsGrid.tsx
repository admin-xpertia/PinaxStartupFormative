"use client"

import { SubmissionQueue, type SubmissionItem } from "./SubmissionQueue"
import { CohortProgressChart, type PhaseProgress } from "./CohortProgressChart"
import { StudentRiskList, type StudentRiskItem } from "./StudentRiskList"
import { ProofPointList } from "./ProofPointList"
import type { CohortAnalyticsResponse } from "../types"

type ProofPointAnalytics = CohortAnalyticsResponse["proofPoints"]

interface ProgramAnalyticsGridProps {
  programId: string
  submissions: SubmissionItem[]
  phases: PhaseProgress[]
  atRiskStudents: StudentRiskItem[]
  proofPoints: ProofPointAnalytics
}

export function ProgramAnalyticsGrid({
  programId,
  submissions,
  phases,
  atRiskStudents,
  proofPoints,
}: ProgramAnalyticsGridProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <SubmissionQueue submissions={submissions} programId={programId} />
        <CohortProgressChart phases={phases} />
      </div>
      <div className="space-y-6">
        <StudentRiskList students={atRiskStudents} />
        <ProofPointList proofPoints={proofPoints} />
      </div>
    </div>
  )
}
