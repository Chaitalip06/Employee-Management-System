import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const Register = ({ onBackToLogin }) => {
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const result = await register(name, email, password)

    setLoading(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    setSuccess(result.message)
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
            EM
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mt-4">
            Create Account
          </h1>

          <p className="text-slate-500 mt-2">
            Register for EmployeeMS
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-5 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 mb-5 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
            className="w-full px-4 py-3 mb-4 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full px-4 py-3 mb-4 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
            className="w-full px-4 py-3 mb-4 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
            className="w-full px-4 py-3 mb-6 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

        </form>

        <div className="text-center mt-6">
          <span className="text-sm text-slate-500">
            Already have an account?
          </span>

          <button
            type="button"
            onClick={onBackToLogin}
            className="ml-1 text-sm text-blue-600 font-semibold hover:underline"
          >
            Login
          </button>
        </div>

      </div>
    </div>
  )
}

export default Register