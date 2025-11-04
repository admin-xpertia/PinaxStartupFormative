"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface BreadcrumbItem {
  label: string
  href: string
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // Don't show breadcrumbs on home page
  if (pathname === "/") return null

  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs: BreadcrumbItem[] = [{ label: "Inicio", href: "/" }]

  // Build breadcrumbs from path segments
  let currentPath = ""
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Skip dynamic segments like [id]
    if (segment.startsWith("[")) return

    // Capitalize and format segment
    let label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    // Custom labels for known routes
    if (segment === "programas") label = "Programas"
    if (segment === "cohortes") label = "Cohortes"
    if (segment === "generation") label = "Generación"
    if (segment === "demo") label = "Demo"
    if (segment === "estudiantes") label = "Estudiantes"
    if (segment === "analytics") label = "Analytics"
    if (segment === "comunicaciones") label = "Comunicaciones"

    breadcrumbs.push({
      label,
      href: currentPath,
    })
  })

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1

        return (
          <div key={item.href} className="flex items-center gap-2">
            {index === 0 ? (
              <Link href={item.href} className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Home className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <ChevronRight className="h-4 w-4" />
                {isLast ? (
                  <span className="font-medium text-foreground">{item.label}</span>
                ) : (
                  <Link href={item.href} className="hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                )}
              </>
            )}
          </div>
        )
      })}
    </nav>
  )
}
