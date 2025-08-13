import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './plugins/i18n'
import { initializeStores } from './stores'

const app = createApp(App)

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('Global error:', error, info)
  // TODO: Send to error reporting service in production
}

// Install plugins
app.use(createPinia())
app.use(router)
app.use(i18n)

// Initialize stores after mounting
app.mount('#app')

// Initialize stores
initializeStores()
