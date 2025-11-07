import { redirect } from "next/navigation"

export default function StudentPage() {
  // Redirect to courses page
  redirect("/student/courses")
}
