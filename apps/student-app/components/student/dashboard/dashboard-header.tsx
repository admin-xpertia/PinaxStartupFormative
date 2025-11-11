import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface DashboardHeaderProps {
  studentInitials?: string
}

export function DashboardHeader({ studentInitials = "ES" }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold uppercase text-white">
            X
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Xpertia
            </p>
            <p className="text-sm font-semibold text-foreground">Espacio del estudiante</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <button className="font-semibold text-foreground transition" type="button">
            Programas
          </button>
          <button className="transition hover:text-foreground" type="button">
            Roadmap
          </button>
          <button className="transition hover:text-foreground" type="button">
            Biblioteca
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/progress">Mi progreso</Link>
          </Button>
          <Avatar>
            <AvatarFallback>{studentInitials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
