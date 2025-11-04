"use client"

import { CohorteManagementView } from "@/components/cohort/cohort-management-view"

export default function CohorteDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <CohorteManagementView cohorteId={params.id} />
    </div>
  )
}
