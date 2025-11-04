import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UIState {
  sidebarCollapsed: boolean
  theme: "light" | "dark"
  currentModal: string | null
  currentDrawer: string | null
  modalData: any
  drawerData: any

  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: "light" | "dark") => void
  openModal: (modalId: string, data?: any) => void
  closeModal: () => void
  openDrawer: (drawerId: string, data?: any) => void
  closeDrawer: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "light",
      currentModal: null,
      currentDrawer: null,
      modalData: null,
      drawerData: null,

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
      openModal: (modalId, data) => set({ currentModal: modalId, modalData: data }),
      closeModal: () => set({ currentModal: null, modalData: null }),
      openDrawer: (drawerId, data) => set({ currentDrawer: drawerId, drawerData: data }),
      closeDrawer: () => set({ currentDrawer: null, drawerData: null }),
    }),
    {
      name: "xpertia-ui-storage",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
)
