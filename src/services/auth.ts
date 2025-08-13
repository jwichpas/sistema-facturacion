import { supabase } from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { Company } from '@/types'

// Auth-related interfaces
export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface SignUpCredentials extends LoginCredentials {
  full_name?: string
  confirmPassword?: string
}

export interface ResetPasswordCredentials {
  email: string
  redirectTo?: string
}

export interface UpdatePasswordCredentials {
  password: string
  confirmPassword?: string
}

export interface AuthResponse<T = any> {
  data: T | null
  error: AuthError | null
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  phone?: string
  created_at: string
  updated_at: string
}

// Custom error types
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthService {
  private sessionCheckInterval: NodeJS.Timeout | null = null
  private readonly SESSION_CHECK_INTERVAL = 60000 // 1 minute

  /**
   * Sign in with email and password
   */
  async signIn(
    credentials: LoginCredentials,
  ): Promise<AuthResponse<{ user: User; session: Session }>> {
    try {
      // Validate credentials
      this.validateEmail(credentials.email)
      this.validatePassword(credentials.password)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      })

      if (error) {
        throw new AuthenticationError(this.getErrorMessage(error), error.name, error.status)
      }

      // Start session monitoring if remember is true
      if (credentials.remember) {
        this.startSessionMonitoring()
      }

      return { data, error: null }
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof ValidationError) {
        throw error
      }
      throw new AuthenticationError('An unexpected error occurred during sign in')
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    credentials: SignUpCredentials,
  ): Promise<AuthResponse<{ user: User | null; session: Session | null }>> {
    try {
      // Validate credentials
      this.validateEmail(credentials.email)
      this.validatePassword(credentials.password)

      if (credentials.confirmPassword && credentials.password !== credentials.confirmPassword) {
        throw new ValidationError('Passwords do not match', 'confirmPassword')
      }

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name?.trim() || '',
          },
        },
      })

      if (error) {
        throw new AuthenticationError(this.getErrorMessage(error), error.name, error.status)
      }

      return { data, error: null }
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof ValidationError) {
        throw error
      }
      throw new AuthenticationError('An unexpected error occurred during sign up')
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      this.stopSessionMonitoring()

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw new AuthenticationError(this.getErrorMessage(error), error.name, error.status)
      }

      // Clear any cached data
      this.clearLocalData()
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      }
      throw new AuthenticationError('An unexpected error occurred during sign out')
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ data: { session: Session | null }; error: AuthError | null }> {
    try {
      return await supabase.auth.getSession()
    } catch (error) {
      console.error('Error getting session:', error)
      return { data: { session: null }, error: error as AuthError }
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<{ data: { user: User | null }; error: AuthError | null }> {
    try {
      return await supabase.auth.getUser()
    } catch (error) {
      console.error('Error getting user:', error)
      return { data: { user: null }, error: error as AuthError }
    }
  }

  /**
   * Reset password
   */
  async resetPassword(credentials: ResetPasswordCredentials): Promise<void> {
    try {
      this.validateEmail(credentials.email)

      const { error } = await supabase.auth.resetPasswordForEmail(
        credentials.email.trim().toLowerCase(),
        {
          redirectTo: credentials.redirectTo || `${window.location.origin}/reset-password`,
        },
      )

      if (error) {
        throw new AuthenticationError(this.getErrorMessage(error), error.name, error.status)
      }
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof ValidationError) {
        throw error
      }
      throw new AuthenticationError('An unexpected error occurred during password reset')
    }
  }

  /**
   * Update password
   */
  async updatePassword(credentials: UpdatePasswordCredentials): Promise<void> {
    try {
      this.validatePassword(credentials.password)

      if (credentials.confirmPassword && credentials.password !== credentials.confirmPassword) {
        throw new ValidationError('Passwords do not match', 'confirmPassword')
      }

      const { error } = await supabase.auth.updateUser({
        password: credentials.password,
      })

      if (error) {
        throw new AuthenticationError(this.getErrorMessage(error), error.name, error.status)
      }
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof ValidationError) {
        throw error
      }
      throw new AuthenticationError('An unexpected error occurred during password update')
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      if (updates.email) {
        this.validateEmail(updates.email)
        updates.email = updates.email.trim().toLowerCase()
      }

      const { error } = await supabase.auth.updateUser({
        email: updates.email,
        data: {
          full_name: updates.full_name?.trim(),
          avatar_url: updates.avatar_url,
          phone: updates.phone?.trim(),
        },
      })

      if (error) {
        throw new AuthenticationError(this.getErrorMessage(error), error.name, error.status)
      }
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof ValidationError) {
        throw error
      }
      throw new AuthenticationError('An unexpected error occurred during profile update')
    }
  }

  /**
   * Get user companies
   */
  async getUserCompanies(userId: string): Promise<Company[]> {
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select(
          `
          companies (
            id,
            ruc,
            legal_name,
            trade_name,
            email,
            phone,
            address,
            ubigeo_code,
            currency_code,
            valuation_method,
            created_at,
            updated_at
          )
        `,
        )
        .eq('user_id', userId)

      if (error) {
        throw new Error(error.message)
      }

      return (data || []).map((item: any) => item.companies).filter(Boolean) as Company[]
    } catch (error) {
      console.error('Error fetching user companies:', error)
      return []
    }
  }

  /**
   * Check if user has access to company
   */
  async hasCompanyAccess(userId: string, companyId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single()

      return !error && !!data
    } catch {
      return false
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      // Handle session expiry
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') {
          this.clearLocalData()
        }
      }

      callback(event, session)
    })
  }

  /**
   * Refresh session manually
   */
  async refreshSession(): Promise<{ data: { session: Session | null }; error: AuthError | null }> {
    try {
      return await supabase.auth.refreshSession()
    } catch (error) {
      console.error('Error refreshing session:', error)
      return { data: { session: null }, error: error as AuthError }
    }
  }

  /**
   * Check if session is valid
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await this.getSession()

      if (!session) return false

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000)
      return session.expires_at ? session.expires_at > now : true
    } catch {
      return false
    }
  }

  // Private methods
  private validateEmail(email: string): void {
    if (!email || !email.trim()) {
      throw new ValidationError('Email is required', 'email')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      throw new ValidationError('Please enter a valid email address', 'email')
    }
  }

  private validatePassword(password: string): void {
    if (!password) {
      throw new ValidationError('Password is required', 'password')
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long', 'password')
    }
  }

  private getErrorMessage(error: AuthError): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link before signing in.'
      case 'User already registered':
        return 'An account with this email already exists. Please sign in instead.'
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.'
      case 'Unable to validate email address: invalid format':
        return 'Please enter a valid email address.'
      case 'Signup is disabled':
        return 'Account registration is currently disabled. Please contact support.'
      default:
        return error.message || 'An unexpected error occurred. Please try again.'
    }
  }

  private startSessionMonitoring(): void {
    if (this.sessionCheckInterval) return

    this.sessionCheckInterval = setInterval(async () => {
      const isValid = await this.isSessionValid()
      if (!isValid) {
        await this.signOut()
      }
    }, this.SESSION_CHECK_INTERVAL)
  }

  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
      this.sessionCheckInterval = null
    }
  }

  private clearLocalData(): void {
    try {
      // Clear any auth-related data from localStorage
      const keysToRemove = ['current_company', 'user_preferences', 'sidebar_collapsed']

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
      })
    } catch {
      // Silently fail if localStorage is not available
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
