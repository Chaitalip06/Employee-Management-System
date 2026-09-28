
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabase/supabaseClient'

const LeaveManagement = () => {
  const { user } = useAuth()

  const [leaveType, setLeaveType] = useState('Casual Leave')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load employee's leave requests
  const loadLeaves = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Load leaves error:', error)
      setError(error.message)
    } else {
      setLeaves(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadLeaves()
  }, [user?.id])

  // Calculate number of leave days
  const calculateDays = (start, end) => {
    if (!start || !end || end < start) return 0

    const startDay = new Date(`${start}T00:00:00`)
    const endDay = new Date(`${end}T00:00:00`)

    return Math.round(
      (endDay - startDay) / (1000 * 60 * 60 * 24)
    ) + 1
  }

  // Submit leave request
  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!user?.id) {
      setError('Please login again to apply for leave.')
      return
    }

    if (!startDate || !endDate || !reason.trim()) {
      setError('Please fill all the fields.')
      return
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date.')
      return
    }

    setSubmitting(true)

    const { error } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: user.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        status: 'Pending'
      })

    if (error) {
      console.error('Apply leave error:', error)
      setError(error.message)
    } else {
      setSuccess('Leave request submitted successfully!')

      setLeaveType('Casual Leave')
      setStartDate('')
      setEndDate('')
      setReason('')

      await loadLeaves()
    }

    setSubmitting(false)
  }

  const getStatusStyle = (status) => {
    if (status === 'Approved') {
      return 'bg-green-100 text-green-700'
    }

    if (status === 'Rejected') {
      return 'bg-red-100 text-red-700'
    }

    return 'bg-orange-100 text-orange-700'
  }

  const pendingCount = leaves.filter(
    leave => leave.status === 'Pending'
  ).length

  const approvedCount = leaves.filter(
    leave => leave.status === 'Approved'
  ).length

  const rejectedCount = leaves.filter(
    leave => leave.status === 'Rejected'
  ).length

  return (
    <div className="space-y-6">

      {/* Summary Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending Requests</p>
          <h3 className="text-3xl font-bold text-orange-600 mt-2">
            {pendingCount}
          </h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Approved Requests</p>
          <h3 className="text-3xl font-bold text-green-600 mt-2">
            {approvedCount}
          </h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Rejected Requests</p>
          <h3 className="text-3xl font-bold text-red-600 mt-2">
            {rejectedCount}
          </h3>
        </div>

      </div>

      {/* Apply Leave Form */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            Apply for Leave 🌴
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Fill in the details to submit your leave request.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Leave Type
            </label>

            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Casual Leave</option>
              <option>Sick Leave</option>
              <option>Earned Leave</option>
              <option>Personal Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                min={new Date().toLocaleDateString('en-CA')}
                onChange={(e) => {
                  setStartDate(e.target.value)

                  if (endDate && e.target.value > endDate) {
                    setEndDate('')
                  }
                }}
                required
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                min={startDate || new Date().toLocaleDateString('en-CA')}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>

          {startDate && endDate && endDate >= startDate && (
            <p className="text-sm text-blue-600">
              Total leave days: {calculateDays(startDate, endDate)}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for Leave
            </label>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter your reason for leave..."
              rows="4"
              maxLength={500}
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />

            <p className="text-xs text-slate-400 mt-1">
              Maximum 500 characters
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm break-words">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-xl font-medium transition disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Leave Request'}
          </button>

        </form>
      </div>

      {/* Leave History */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              My Leave Requests
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Check the status of your leave applications.
            </p>
          </div>

          <button
            onClick={loadLeaves}
            disabled={loading}
            className="border border-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="p-6">

          {loading ? (
            <p className="text-center text-slate-500 py-8">
              Loading leave requests...
            </p>
          ) : leaves.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No leave requests yet. Apply for your first leave above.
            </p>
          ) : (
            <div className="space-y-4">

              {leaves.map((leave) => (
                <div
                  key={leave.id}
                  className="border border-slate-200 rounded-xl p-5"
                >

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

                    <div>
                      <h3 className="font-bold text-slate-800">
                        {leave.leave_type}
                      </h3>

                      <p className="text-sm text-slate-500 mt-2">
                        {leave.start_date} to {leave.end_date}
                      </p>

                      <p className="text-sm text-blue-600 mt-1">
                        {calculateDays(leave.start_date, leave.end_date)} day(s)
                      </p>
                    </div>

                    <span className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(leave.status)}`}>
                      {leave.status}
                    </span>

                  </div>

                  <div className="mt-4 bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">
                      Reason
                    </p>

                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {leave.reason}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 mt-3">
                    Applied on: {new Date(leave.created_at).toLocaleDateString('en-IN')}
                  </p>

                </div>
              ))}

            </div>
          )}

        </div>
      </div>

    </div>
  )
}

export default LeaveManagement