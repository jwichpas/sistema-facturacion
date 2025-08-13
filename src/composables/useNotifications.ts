import { ref, computed, onMounted, onUnmounted } from 'vue'
import { notificationService } from '@/services/notifications'
import { useAuthStore } from '@/stores/auth'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function useNotifications() {
  const authStore = useAuthStore()
  const notifications = ref<Record<string, unknown>[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const refreshInterval = ref<NodeJS.Timeout | null>(null)

  // Computed
  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.read_at)
  )  // Helper functions
  const mapNotificationTypeToUI = (dbType: string): 'info' | 'success' | 'warning' | 'error' => {
    switch (dbType) {
      case 'alert':
      case 'approval_needed':
      case 'system_maintenance':
        return 'warning'
      case 'error':
      case 'rejection':
        return 'error'
      case 'success':
      case 'approval':
      case 'completion':
        return 'success'
      default:
        return 'info'
    }
  }

  const getNotificationPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          bgClass: 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400',
          iconClass: 'text-red-600 dark:text-red-400',
        }
      case 'high':
        return {
          bgClass: 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400',
          iconClass: 'text-orange-600 dark:text-orange-400',
        }
      case 'medium':
        return {
          bgClass: 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400',
          iconClass: 'text-yellow-600 dark:text-yellow-400',
        }
      case 'low':
      default:
        return {
          bgClass: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400',
          iconClass: 'text-blue-600 dark:text-blue-400',
        }
    }
  }

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es
      })
    } catch {
      return 'Hace un momento'
    }
  }

  // Methods
  const loadNotifications = async () => {
    if (!authStore.user?.id || !authStore.currentCompany?.id) return

    loading.value = true
    try {
      const data = await notificationService.getUserNotifications(
        authStore.user.id,
        authStore.currentCompany.id,
        20
      )
      notifications.value = data

      // Update unread count
      await updateUnreadCount()
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      loading.value = false
    }
  }

  const updateUnreadCount = async () => {
    if (!authStore.user?.id || !authStore.currentCompany?.id) return

    try {
      const count = await notificationService.getUnreadCount(
        authStore.user.id,
        authStore.currentCompany.id
      )
      unreadCount.value = count
    } catch (error) {
      console.error('Error updating unread count:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)

      // Update local state
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.read_at = new Date().toISOString()
      }

      await updateUnreadCount()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!authStore.user?.id || !authStore.currentCompany?.id) return

    try {
      await notificationService.markAllAsRead(
        authStore.user.id,
        authStore.currentCompany.id
      )

      // Update local state
      const now = new Date().toISOString()
      notifications.value.forEach(notification => {
        if (!notification.read_at) {
          notification.read_at = now
        }
      })

      unreadCount.value = 0
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId)

      // Update local state
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }

      await updateUnreadCount()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const startRefreshInterval = () => {
    // Refresh notifications every 30 seconds
    refreshInterval.value = setInterval(() => {
      updateUnreadCount()
    }, 30000)
  }

  const stopRefreshInterval = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }

  // Lifecycle
  onMounted(() => {
    loadNotifications()
    startRefreshInterval()
  })

  onUnmounted(() => {
    stopRefreshInterval()
  })

  return {
    // State
    notifications,
    unreadCount,
    unreadNotifications,
    loading,

    // Methods
    loadNotifications,
    updateUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // Helpers
    mapNotificationTypeToUI,
    getNotificationPriorityStyles,
    formatRelativeTime,
  }
}
