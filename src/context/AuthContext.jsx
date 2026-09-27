import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase/supabaseClient'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Get employee profile from database
  const loadProfile = async (authUser) => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error) {
      console.error('Profile error:', error)
      setUser(null)
      return null
    }

    setUser(data)
    return data
  }

  // Check if user is already logged in
  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (session?.user) {
        await loadProfile(session.user)
      } else {
        setUser(null)
      }

      setLoading(false)
    }

    loadSession()

    // Listen for login/logout changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        return
      }

      setTimeout(() => {
        loadProfile(session.user)
      }, 0)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // LOGIN
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return {
        success: false,
        message: error.message
      }
    }

    const profile = await loadProfile(data.user)

    if (!profile) {
      return {
        success: false,
        message: 'Employee profile not found.'
      }
    }

    return {
      success: true,
      user: profile
    }
  }

  // REGISTER
  const register = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    })

    if (error) {
      return {
        success: false,
        message: error.message
      }
    }

    // If email confirmation is disabled
    if (data.session && data.user) {
      await loadProfile(data.user)

      return {
        success: true,
        message: 'Registration successful!'
      }
    }

    // If email confirmation is enabled
    return {
      success: true,
      message:
        'Registration successful! Please check your email to confirm your account.'
    }
  }

  // LOGOUT
  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}