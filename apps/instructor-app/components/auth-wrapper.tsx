'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Rutas públicas que no requieren autenticación
 */
const PUBLIC_ROUTES = ['/login', '/signup'];

/**
 * AuthWrapper - Protege rutas que requieren autenticación
 *
 * Este componente verifica si el usuario está autenticado
 * y redirige a login si no lo está (excepto en rutas públicas)
 */
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si aún está cargando, no hacer nada
    if (loading) return;

    // Verificar si la ruta actual es pública
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

    // Si no está autenticado y no es ruta pública, redirigir a login
    if (!user && !isPublicRoute) {
      router.push('/login');
    }

    // Si está autenticado y está en una ruta pública, redirigir al dashboard
    if (user && isPublicRoute) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
