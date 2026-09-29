
import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const AdminSettings = () => {
  const { user, updateEmployeeName } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // LOAD PROFILE FROM AUTH CONTEXT
  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true)
      setError('')

      if (user) {
        setName(
          user.name ||
          user.full_name ||
          ''
        )

        const { data, error } = await supabase.auth.getUser()

        if (error) {
          setError(error.message)
        } else {
          setEmail(data.user?.email || '')
        }
      } else {
        setName('')
        setEmail('')
      }

      setLoadingProfile(false)
    }

    loadProfile()
  }, [user])

  // UPDATE PROFILE NAME
  const handleProfileUpdate = async (e) => {
    e.preventDefault()

    setMessage('')
    setError('')

    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }

    setSavingProfile(true)

    try {
      const result = await updateEmployeeName(name)

      if (result.success) {
        setMessage('Profile name updated successfully!')
        setName(result.user?.name || name.trim())
      } else {
        setError(result.message || 'Failed to update name.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    }

    setSavingProfile(false)
  }

  // CHANGE PASSWORD
  const handlePasswordChange = async (e) => {
    e.preventDefault()

    setMessage('')
    setError('')

    if (newPassword.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.')
      return
    }

    setChangingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Password changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
    }

    setChangingPassword(false)
  }

  return (
    <div className="space-y-6">

      {/* PAGE HEADING */}
      <div>
        <h3 className="text-2xl font-bold text-gray-800">
          Admin Settings
        </h3>

        <p className="mt-2 text-gray-500">
          Manage your profile and account security.
        </p>
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          ✓ {message}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ADMIN PROFILE */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
            👤
          </div>

          <div>
            <h4 className="text-xl font-bold text-gray-800">
              Admin Profile
            </h4>

            <p className="mt-1 text-sm text-gray-500">
              View and update your profile information.
            </p>
          </div>
        </div>

        {loadingProfile ? (
          <p className="py-6 text-gray-500">
            Loading profile...
          </p>
        ) : (
          <form
            onSubmit={handleProfileUpdate}
            className="max-w-xl space-y-5"
          >

            {/* NAME */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500 outline-none"
              />

              <p className="mt-2 text-xs text-gray-500">
                Your registered email cannot be edited here.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingProfile || loadingProfile}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>

          </form>
        )}
      </div>

      {/* CHANGE PASSWORD */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl">
            🔐
          </div>

          <div>
            <h4 className="text-xl font-bold text-gray-800">
              Change Password
            </h4>

            <p className="mt-1 text-sm text-gray-500">
              Create a new password for your account.
            </p>
          </div>
        </div>

        <form
          onSubmit={handlePasswordChange}
          className="max-w-xl space-y-5"
        >

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              minLength={6}
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />

            <p className="mt-2 text-xs text-gray-500">
              Use at least 6 characters.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Re-enter new password"
              minLength={6}
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changingPassword
              ? 'Updating Password...'
              : 'Update Password'}
          </button>

        </form>
      </div>

      {/* SECURITY INFORMATION */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h4 className="font-semibold text-blue-800">
          🔒 Account Security
        </h4>

        <p className="mt-2 text-sm leading-6 text-blue-700">
          Your password is managed securely by Supabase
          Authentication. Never share your password or
          Supabase secret keys with anyone.
        </p>
      </div>

    </div>
  )
}

export default AdminSettings