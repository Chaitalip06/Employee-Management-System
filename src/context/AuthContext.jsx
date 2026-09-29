
import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'

import { supabase } from '../supabase/supabaseClient'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // LOAD EMPLOYEE PROFILE
  const loadProfile = async (authUser) => {
    if (!authUser) {
      setUser(null)
      return null
    }

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

  // CHECK EXISTING LOGIN SESSION
  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          return
        }

        if (session?.user) {
          await loadProfile(session.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Session loading error:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSession()

    // LISTEN FOR LOGIN AND LOGOUT
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          setUser(null)
          return
        }

        // Load employee profile after auth changes
        setTimeout(() => {
          if (isMounted) {
            loadProfile(session.user)
          }
        }, 0)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // LOGIN
  const login = async (email, password) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
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
          name: name.trim()
        }
      }
    })

    if (error) {
      return {
        success: false,
        message: error.message
      }
    }

    if (data.session && data.user) {
      await loadProfile(data.user)

      return {
        success: true,
        message: 'Registration successful!'
      }
    }

    return {
      success: true,
      message:
        'Registration successful! Please check your email to confirm your account.'
    }
  }

  // UPDATE EMPLOYEE NAME
  const updateEmployeeName = async (newName) => {
    if (!user) {
      return {
        success: false,
        message: 'User not logged in.'
      }
    }

    const trimmedName = newName.trim()

    if (!trimmedName) {
      return {
        success: false,
        message: 'Name cannot be empty.'
      }
    }

    // Update name in employees table
    const { data, error } = await supabase
      .from('employees')
      .update({
        name: trimmedName
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Employee name update error:', error)

      return {
        success: false,
        message: error.message
      }
    }

    // Update name in Supabase Auth metadata
    const { error: authError } =
      await supabase.auth.updateUser({
        data: {
          name: trimmedName
        }
      })

    if (authError) {
      console.error('Auth metadata update error:', authError)
    }

    // Update React user state immediately
    setUser(data)

    return {
      success: true,
      message: 'Name updated successfully!',
      user: data
    }
  }

  // LOGOUT
  const logout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        message: error.message
      }
    }

    setUser(null)

    return {
      success: true
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateEmployeeName
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// CUSTOM AUTH HOOK
export const useAuth = () => {
  return useContext(AuthContext)
}