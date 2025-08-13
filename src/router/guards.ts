import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

// Auth guard for protected routes
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore()
  const uiStore = useUIStore()

  // Wait for auth initialization if not done yet
  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    // Store the intended route for redirect after login
    const redirectPath = to.fullPath !== '/login' ? to.fullPath : undefined

    uiStore.addNotification({
      type: 'warning',
      title: 'Acceso requerido',
      message: 'Debes iniciar sesión para acceder a esta página.',
    })

    next({
      path: '/login',
      query: redirectPath ? { redirect: redirectPath } : undefined,
    })
    return
  }

  // Check if route requires company context
  if (to.meta.requiresCompany && !authStore.hasCompany) {
    uiStore.addNotification({
      type: 'warning',
      title: 'Empresa requerida',
      message: 'Debes seleccionar una empresa para continuar.',
    })

    next('/select-company')
    return
  }

  // Check permissions if route has permission requirements
  if (to.meta.permissions && Array.isArray(to.meta.permissions)) {
    const hasPermission = to.meta.requireAllPermissions
      ? authStore.hasAllPermissions(to.meta.permissions)
      : authStore.hasAnyPermission(to.meta.permissions)

    if (!hasPermission) {
      uiStore.addNotification({
        type: 'error',
        title: 'Acceso denegado',
        message: 'No tienes permisos para acceder a esta página.',
      })

      next('/dashboard')
      return
    }
  }

  next()
}

// Guest guard for auth pages (login, register, etc.)
export const guestGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore()

  // Wait for auth initialization if not done yet
  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }

  // Redirect authenticated users away from auth pages
  if (authStore.isAuthenticated) {
    const redirectTo = (to.query.redirect as string) || '/dashboard'
    next(redirectTo)
    return
  }

  next()
}

// Company selection guard
export const companyGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore()

  // Must be authenticated first
  if (!authStore.isAuthenticated) {
    next('/login')
    return
  }

  // If user already has a company selected, redirect to dashboard
  if (authStore.hasCompany) {
    next('/dashboard')
    return
  }

  // If user has no available companies, show error
  const companies = authStore.availableCompanies as any[]
  if (companies.length === 0) {
    next('/no-companies')
    return
  }

  next()
}

// Admin guard for admin-only routes
export const adminGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore()
  const uiStore = useUIStore()

  // Must be authenticated first
  if (!authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check if user is admin
  if (!authStore.isAdmin) {
    uiStore.addNotification({
      type: 'error',
      title: 'Acceso denegado',
      message: 'Esta página requiere permisos de administrador.',
    })

    next('/dashboard')
    return
  }

  next()
}

// Global navigation guard that combines multiple checks
export const globalGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  // Auth guard for protected routes
  if (to.meta.requiresAuth) {
    await authGuard(to, from, next)
    return
  }

  // Guest guard for auth pages
  if (to.meta.guestOnly) {
    await guestGuard(to, from, next)
    return
  }

  // Company selection guard
  if (to.path === '/select-company') {
    await companyGuard(to, from, next)
    return
  }

  // Admin guard
  if (to.meta.requiresAdmin) {
    await adminGuard(to, from, next)
    return
  }

  next()
}

// Route meta type extensions
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    requiresCompany?: boolean
    requiresAdmin?: boolean
    permissions?: string[]
    requireAllPermissions?: boolean
    title?: string
    description?: string
  }
}
