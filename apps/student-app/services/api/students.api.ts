import { apiClient } from "./client"
import type { StudentProfileResponse, StudentAccountResponse, CreateStudentRequest } from "@shared-types/api"

export const studentsApi = {
  getByUserId: (userId: string) =>
    apiClient.get<StudentProfileResponse>(`/students/by-user/${userId}`),

  create: (payload: CreateStudentRequest) =>
    apiClient.post<StudentAccountResponse>("/students", payload),
}
