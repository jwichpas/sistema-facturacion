import { createRouter, createWebHistory } from 'vue-router'
import { globalGuard } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Redirect root to dashboard
    {
      path: '/',
      redirect: '/dashboard',
    },

    // Authentication routes
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: {
        guestOnly: true,
        title: 'Iniciar Sesión',
        description: 'Accede a tu cuenta del sistema ERP',
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: {
        guestOnly: true,
        title: 'Crear Cuenta',
        description: 'Crea una nueva cuenta en el sistema ERP',
      },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: {
        guestOnly: true,
        title: 'Recuperar Contraseña',
        description: 'Recupera el acceso a tu cuenta',
      },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: {
        guestOnly: true,
        title: 'Restablecer Contraseña',
        description: 'Establece una nueva contraseña para tu cuenta',
      },
    },

    // Company selection
    {
      path: '/select-company',
      name: 'select-company',
      component: () => import('@/views/auth/SelectCompanyView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Seleccionar Empresa',
        description: 'Selecciona la empresa con la que deseas trabajar',
      },
    },

    // No companies available
    {
      path: '/no-companies',
      name: 'no-companies',
      component: () => import('@/views/auth/NoCompaniesView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Sin Empresas',
        description: 'No tienes acceso a ninguna empresa',
      },
    },

    // Main application routes
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: {
        requiresAuth: true,
        requiresCompany: true,
        title: 'Panel de Control',
        description: 'Resumen general del sistema',
      },
    },

    // Products module
    {
      path: '/products',
      name: 'products',
      component: () => import('@/views/products/ProductsView.vue'),
      meta: {
        requiresAuth: true,
        requiresCompany: true,
        permissions: ['products.read'],
        title: 'Productos',
        description: 'Gestión de productos e inventario',
      },
    },

    // Sales module
    {
      path: '/sales',
      name: 'sales',
      component: () => import('@/views/sales/SalesView.vue'),
      meta: {
        requiresAuth: true,
        requiresCompany: true,
        permissions: ['sales.read'],
        title: 'Ventas',
        description: 'Gestión de ventas y facturación',
      },
    },

    // Purchases module
    {
      path: '/purchases',
      name: 'purchases',
      component: () => import('@/views/purchases/PurchasesView.vue'),
      meta: {
        requiresAuth: true,
        requiresCompany: true,
        permissions: ['purchases.read'],
        title: 'Compras',
        description: 'Gestión de compras y proveedores',
      },
    },

    // Customers module
    {
      path: '/customers',
      name: 'customers',
      component: () => import('@/views/parties/CustomersView.vue'),
      meta: {
        requiresAuth: true,
        requiresCompany: true,
        permissions: ['parties.read'],
        title: 'Clientes',
        description: 'Gestión de clientes',
      },
    },

    // Suppliers module
    {
      path: '/suppliers',
      name: 'suppliers',
      component: () => import('@/views/parties/SuppliersView.vue'),
      meta: {
        requiresAuth: true,
        requiresCompany: true,
        permissions: ['parties.read'],
        title: 'Proveedores',
        description: 'Gestión de proveedores',
      },
    },

    // Warehouses module
    {
      path: '/warehouses',
      name: 'warehouses',
      component: () => import('@/views/warehouses/WarehousesView.vue'),
      meta: {
        requiresAuth: true,
        requiresCompany: true,
        permissions: ['warehouses.read'],
        title: 'Almacenes',
        description: 'Gestión de almacenes y ubicaciones',
      },
    },

    // Reports module
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/reports/ReportsView.vue'),
      meta: {
        requiresAuth: true,
        requiresCompany: true,
        permissions: ['reports.read'],
        title: 'Reportes',
        description: 'Reportes y análisis del sistema',
      },
    },

    // Settings module
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/settings/SettingsView.vue'),
      meta: {
        requiresAuth: true,
        requiresCompany: true,
        permissions: ['settings.read'],
        title: 'Configuración',
        description: 'Configuración del sistema',
      },
    },

    // Admin routes
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/AdminView.vue'),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
        title: 'Administración',
        description: 'Panel de administración del sistema',
      },
    },

    // User profile
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/user/ProfileView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Mi Perfil',
        description: 'Configuración de perfil de usuario',
      },
    },

    // Error pages
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/views/errors/ForbiddenView.vue'),
      meta: {
        title: 'Acceso Denegado',
        description: 'No tienes permisos para acceder a esta página',
      },
    },
    {
      path: '/404',
      name: 'not-found',
      component: () => import('@/views/errors/NotFoundView.vue'),
      meta: {
        title: 'Página No Encontrada',
        description: 'La página que buscas no existe',
      },
    },
    {
      path: '/500',
      name: 'server-error',
      component: () => import('@/views/errors/ServerErrorView.vue'),
      meta: {
        title: 'Error del Servidor',
        description: 'Ha ocurrido un error interno del servidor',
      },
    },

    // Catch all route - must be last
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404',
    },
  ],
})

// Global navigation guard
router.beforeEach(globalGuard)

// Update document title based on route meta
router.afterEach((to) => {
  const title = to.meta.title
  if (title) {
    document.title = `${title} - Sistema ERP`
  } else {
    document.title = 'Sistema ERP'
  }
})

export default router
