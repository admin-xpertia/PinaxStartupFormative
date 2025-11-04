import type React from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, description, actions }: PageHeaderProps) {
  const secondaryText = subtitle ?? description

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {secondaryText && <p className="text-muted-foreground mt-2">{secondaryText}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
