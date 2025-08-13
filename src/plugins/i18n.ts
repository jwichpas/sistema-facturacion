import { createI18n } from 'vue-i18n'

// Inline messages to avoid JSON import issues during build
const messages = {
  es: {
    app: {
      name: 'Sistema ERP',
      description: 'Sistema de gestión empresarial con facturación electrónica',
    },
    nav: {
      dashboard: 'Panel de Control',
      products: 'Productos',
      inventory: 'Inventario',
      sales: 'Ventas',
      purchases: 'Compras',
      customers: 'Clientes',
      suppliers: 'Proveedores',
      parties: 'Terceros',
      warehouses: 'Almacenes',
      reports: 'Reportes',
      analytics: 'Análisis',
      settings: 'Configuración',
      profile: 'Mi Perfil',
    },
    auth: {
      login: 'Iniciar Sesión',
      logout: 'Cerrar Sesión',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      remember_me: 'Recordarme',
      forgot_password: '¿Olvidaste tu contraseña?',
      sign_in: 'Ingresar',
      sign_up: 'Registrarse',
      welcome_back: '¡Bienvenido de vuelta!',
      please_sign_in: 'Por favor inicia sesión en tu cuenta',
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      loading: 'Cargando...',
      no_data: 'No hay datos disponibles',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No',
      close: 'Cerrar',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      finish: 'Finalizar',
      notifications: 'Notificaciones',
      markAllAsRead: 'Marcar todo como leído',
      noNotifications: 'No hay notificaciones',
      selectCompany: 'Seleccionar Empresa',
    },
    notifications: {
      title: 'Notificaciones',
      markAllAsRead: 'Marcar todo como leído',
      empty: 'No hay notificaciones',
      viewAll: 'Ver todas las notificaciones',
      refresh: 'Actualizar',
    },
  },
  en: {
    app: {
      name: 'ERP System',
      description: 'Business management system with electronic invoicing',
    },
    nav: {
      dashboard: 'Dashboard',
      products: 'Products',
      inventory: 'Inventory',
      sales: 'Sales',
      purchases: 'Purchases',
      customers: 'Customers',
      suppliers: 'Suppliers',
      parties: 'Parties',
      warehouses: 'Warehouses',
      reports: 'Reports',
      analytics: 'Analytics',
      settings: 'Settings',
      profile: 'Profile',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      remember_me: 'Remember me',
      forgot_password: 'Forgot your password?',
      sign_in: 'Sign In',
      sign_up: 'Sign Up',
      welcome_back: 'Welcome back!',
      please_sign_in: 'Please sign in to your account',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      loading: 'Loading...',
      no_data: 'No data available',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      finish: 'Finish',
      notifications: 'Notifications',
      markAllAsRead: 'Mark all as read',
      noNotifications: 'No notifications',
      selectCompany: 'Select Company',
    },
    notifications: {
      title: 'Notifications',
      markAllAsRead: 'Mark all as read',
      empty: 'No notifications',
      viewAll: 'View all notifications',
      refresh: 'Refresh',
    },
  },
}

// Get the user's preferred language from localStorage or browser
const getDefaultLocale = (): string => {
  const stored = localStorage.getItem('locale')
  if (stored && ['es', 'en'].includes(stored)) {
    return stored
  }

  // Fallback to browser language
  const browserLang = navigator.language.split('-')[0]
  return ['es', 'en'].includes(browserLang) ? browserLang : 'es'
}

export const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'es',
  messages,
})

export default i18n
