import { supabase } from '@/services/supabase'

export const notificationService = {
  async getUserNotifications(userId: string, companyId: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_user_id', userId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching user notifications:', error)
      return []
    }
  },

  async getUnreadCount(userId: string, companyId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_user_id', userId)
        .eq('company_id', companyId)
        .is('read_at', null)

      if (error) throw error

      return count || 0
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  },

  async markAllAsRead(userId: string, companyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_user_id', userId)
        .eq('company_id', companyId)
        .is('read_at', null)

      if (error) throw error
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  },
}

// Helper function to map database notification types to UI types
export function mapNotificationTypeToUI(dbType: string): 'info' | 'success' | 'warning' | 'error' {
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

// Helper function to map priority to display styles
export function getNotificationPriorityStyles(priority: string) {
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
