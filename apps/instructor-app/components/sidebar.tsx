"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Library,
  BarChart3,
  HelpCircle,
  MessageSquare,
  ChevronLeft,
} from "lucide-react"
import { useUIStore } from "@/stores/ui-store"

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Mis Programas", icon: BookOpen, href: "/programas", badge: "4" },
  { label: "Cohortes Activas", icon: Users, href: "/cohortes", badge: "2" },
  { label: "Biblioteca", icon: Library, href: "/biblioteca" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
]

const helpItems: NavItem[] = [
  { label: "Guías", icon: HelpCircle, href: "/guias" },
  { label: "Soporte", icon: MessageSquare, href: "/soporte" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-card transition-all duration-300",
        sidebarCollapsed ? "w-[70px]" : "w-[280px]",
      )}
    >
      <div className="flex h-full flex-col gap-6 p-4">
        {/* Collapse Toggle */}
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                    sidebarCollapsed && "justify-center px-2",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Divider */}
        {!sidebarCollapsed && <div className="border-t" />}

        {/* Help Section */}
        <nav className="flex flex-col gap-1">
          {helpItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn("w-full justify-start gap-3 h-10", sidebarCollapsed && "justify-center px-2")}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
