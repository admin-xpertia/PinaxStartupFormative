import { StudentDetailView } from "@/components/fase4/student-detail-view"
import { mockStudentDetail } from "@/lib/mock-student-detail"

export default function StudentDetailPage({
  params,
}: {
  params: { id: string; estudianteId: string }
}) {
  return (
    <div className="h-screen">
      <StudentDetailView student={mockStudentDetail} cohorteId={params.id} />
    </div>
  )
}
