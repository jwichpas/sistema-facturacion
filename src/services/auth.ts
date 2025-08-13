import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials extends LoginCredentials {
  full_name?: string
}

export class AuthService {
  /**
   * Sign in with email and password
   */
  async signIn(credentials: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  /**
   * Sign up with email and password
   */
  async signUp(credentials: SignUpCredentials) {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.full_name,
        },
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ data: { session: Session | null } }> {
    return await supabase.auth.getSession()
  }

  /**
   * Get current user
   */
  async getUser(): Promise<{ data: { user: User | null } }> {
    return await supabase.auth.getUser()
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  /**
   * Update password
   */
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    const { error } = await supabase.auth.updateUser({
      data: updates,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
