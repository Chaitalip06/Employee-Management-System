import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Register from './Register'

const Login = () => {
  const { login } = useAuth()

  const [showRegister, setShowRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // All hooks are above this condition ✅
  if (showRegister) {
    return (
      <Register
        onBackToLogin={() => setShowRegister(false)}
      />
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    const result = await login(email, password)

    if (!result.success) {
      setError(result.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <h1 className="mb-2 text-center text-3xl font-bold">
          Employee Login
        </h1>

        <p className="mb-6 text-center text-gray-500">
          Login to your account
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-4 w-full rounded-lg border p-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mb-6 w-full rounded-lg border p-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 p-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-5 text-center">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className="font-bold text-blue-600 hover:underline"
          >
            Register
          </button>
        </p>

      </div>
    </div>
  )
}

export default Login