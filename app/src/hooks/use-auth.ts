import { useState, useEffect, useCallback } from "react"
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  googleProvider,
  onAuthStateChanged,
  type User,
} from "@/lib/firebase"

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState((prev) => ({ ...prev, user, loading: false }))
    })
    return unsubscribe
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const result = await signInWithEmailAndPassword(auth, email, password)
      setState((prev) => ({ ...prev, user: result.user, loading: false }))
      return result.user
    } catch (err: unknown) {
      const error = err as { message?: string }
      setState((prev) => ({ ...prev, loading: false, error: error.message || "Login failed" }))
      throw err
    }
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName })
      setState((prev) => ({ ...prev, user: result.user, loading: false }))
      return result.user
    } catch (err: unknown) {
      const error = err as { message?: string }
      setState((prev) => ({ ...prev, loading: false, error: error.message || "Registration failed" }))
      throw err
    }
  }, [])

  const googleSignIn = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const result = await signInWithPopup(auth, googleProvider)
      setState((prev) => ({ ...prev, user: result.user, loading: false }))
      return result.user
    } catch (err: unknown) {
      const error = err as { message?: string }
      setState((prev) => ({ ...prev, loading: false, error: error.message || "Google sign-in failed" }))
      throw err
    }
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      await sendPasswordResetEmail(auth, email)
      setState((prev) => ({ ...prev, loading: false }))
    } catch (err: unknown) {
      const error = err as { message?: string }
      setState((prev) => ({ ...prev, loading: false, error: error.message || "Password reset failed" }))
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await signOut(auth)
      setState({ user: null, loading: false, error: null })
    } catch (err: unknown) {
      const error = err as { message?: string }
      setState((prev) => ({ ...prev, error: error.message || "Logout failed" }))
      throw err
    }
  }, [])

  return {
    ...state,
    login,
    register,
    googleSignIn,
    forgotPassword,
    logout,
    isAuthenticated: !!state.user,
  }
}
