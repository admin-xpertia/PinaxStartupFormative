// API Services - Student App
// Exportación centralizada de todos los servicios API

export { apiClient, APIError } from "./client"
export { enrollmentsApi } from "./enrollments.api"
export { exercisesApi } from "./exercises.api"
export { progressApi } from "./progress.api"
export { authApi } from "./auth.api"
export type { LoginCredentials, RegisterData, AuthResponse, User } from "./auth.api"
