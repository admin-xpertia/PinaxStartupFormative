import { create } from "zustand"
import { toast } from "@/hooks/use-toast"

export interface Notification {
  id: string
  type: "alerta" | "actividad" | "mensaje" | "sistema"
  titulo: string
  descripcion: string
  timestamp: Date
  leida: boolean
  link?: string
  icono?: string
  color?: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number

  // Actions
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "leida">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  removeNotification: (id: string) => void
  showToast: (type: "success" | "error" | "info" | "warning", message: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: "1",
      type: "alerta",
      titulo: "Punto de fricción detectado",
      descripcion: '5 estudiantes abandonaron "Simulación de Pitch"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      leida: false,
      link: "/cohortes/1/analytics",
      color: "amber",
    },
    {
      id: "2",
      type: "actividad",
      titulo: "Estudiante completó proof point",
      descripcion: 'Ana Martínez completó "Validación de Problema"',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      leida: false,
      link: "/cohortes/1/estudiantes/1",
      color: "emerald",
    },
    {
      id: "3",
      type: "mensaje",
      titulo: "Nuevo mensaje",
      descripcion: "Carlos Ruiz te envió un mensaje",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      leida: true,
      link: "/cohortes/1/comunicaciones",
      color: "blue",
    },
  ],
  unreadCount: 2,

  addNotification: (notification) =>
    set((state) => {
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        leida: false,
      }
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }
    }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, leida: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, leida: true })),
      unreadCount: 0,
    })),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

  removeNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.leida ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }
    }),

  showToast: (type, message) => {
    const variantMap = {
      success: "default",
      error: "destructive",
      info: "default",
      warning: "default",
    } as const

    const titleMap = {
      success: "Éxito",
      error: "Error",
      info: "Información",
      warning: "Advertencia",
    }

    toast({
      title: titleMap[type],
      description: message,
      variant: variantMap[type],
    })
  },
}))
