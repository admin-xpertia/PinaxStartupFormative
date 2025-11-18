import { apiClient } from "./client"
import type {
  CreateStudentRequest,
  StudentAccountResponse,
  StudentProfileResponse,
} from "@/types/api"

export const studentsApi = {
  create: (payload: CreateStudentRequest) =>
    apiClient.post<StudentAccountResponse>("/students", payload),

  getByUser: (userId: string) =>
    apiClient.get<StudentProfileResponse>(`/students/by-user/${userId}`),
}
