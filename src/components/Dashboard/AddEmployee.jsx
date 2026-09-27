import React, { useState } from 'react'
import { supabase } from '../../supabase/supabaseClient'

const AddEmployee = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setMessage('')
    setError('')
    setLoading(true)

    try {
      // Check Admin session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError('Please login as Admin first.')
        return
      }

      // Call Supabase Edge Function
      const { data, error: functionError } =
        await supabase.functions.invoke('create-employee', {
          body: {
            name,
            email,
          },
        })

      if (functionError) {
        throw new Error(functionError.message)
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      setMessage(
        'Invitation email sent successfully to the employee!'
      )

      // Clear form
      setName('')
      setEmail('')

    } catch (err) {
      console.error('Add employee error:', err)

      setError(
        err.message || 'Failed to send invitation email.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl rounded-2xl bg-white p-8 shadow">

      <h2 className="mb-2 text-2xl font-bold text-gray-800">
        Add New Employee
      </h2>

      <p className="mb-6 text-gray-500">
        Send an invitation to a new employee
      </p>

      {/* Success Message */}
      {message && (
        <div className="mb-5 rounded-lg bg-green-100 p-3 text-green-700">
          {message}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-5 rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Employee Name */}
        <div>
          <label className="mb-2 block font-semibold">
            Employee Name
          </label>

          <input
            type="text"
            placeholder="Enter employee name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
          />
        </div>

        {/* Employee Email */}
        <div>
          <label className="mb-2 block font-semibold">
            Employee Email
          </label>

          <input
            type="email"
            placeholder="Enter employee email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
          />

          <p className="mt-1 text-sm text-gray-500">
            An invitation email will be sent to this address.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 p-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading
            ? 'Sending Invitation...'
            : 'Send Invitation'}
        </button>

      </form>

    </div>
  )
}

export default AddEmployee