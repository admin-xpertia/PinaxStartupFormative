import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Xpertia - Mi Aprendizaje",
  description: "Plataforma de aprendizaje transformacional potenciada por IA",
}

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
