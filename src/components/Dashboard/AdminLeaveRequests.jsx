
import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabase/supabaseClient'

const AdminLeaveRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  const fetchRequests = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setError(error.message)
    } else {
      setRequests(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const updateStatus = async (id, status) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${status.toLowerCase()} this leave request?`
    )

    if (!confirmed) return

    setUpdatingId(id)
    setError('')

    const { error } = await supabase
      .from('leave_requests')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error(error)
      setError(error.message)
    } else {
      await fetchRequests()
    }

    setUpdatingId(null)
  }

  const pendingCount = requests.filter(
    (request) => request.status === 'Pending'
  ).length

  const approvedCount = requests.filter(
    (request) => request.status === 'Approved'
  ).length

  const rejectedCount = requests.filter(
    (request) => request.status === 'Rejected'
  ).length

  const getStatusStyle = (status) => {
    if (status === 'Approved') {
      return 'bg-green-100 text-green-700'
    }

    if (status === 'Rejected') {
      return 'bg-red-100 text-red-700'
    }

    return 'bg-orange-100 text-orange-700'
  }

  return (
    <div className="space-y-6">

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending Requests</p>
          <h3 className="mt-2 text-3xl font-bold text-orange-600">
            {pendingCount}
          </h3>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Approved Requests</p>
          <h3 className="mt-2 text-3xl font-bold text-green-600">
            {approvedCount}
          </h3>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Rejected Requests</p>
          <h3 className="mt-2 text-3xl font-bold text-red-600">
            {rejectedCount}
          </h3>
        </div>

      </div>

      {/* Requests */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Employee Leave Requests
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Review and manage employee leave applications.
            </p>
          </div>

          <button
            onClick={fetchRequests}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading leave requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-10 text-center">
            <div className="text-5xl">📝</div>
            <h4 className="mt-4 font-semibold text-gray-800">
              No Leave Requests
            </h4>
            <p className="mt-2 text-sm text-gray-500">
              Employee leave applications will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-gray-200 p-5 transition hover:shadow-md"
              >

                <div className="flex flex-col justify-between gap-4 md:flex-row">

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-lg font-bold text-gray-800">
                        {request.leave_type || 'Leave'}
                      </h4>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          request.status
                        )}`}
                      >
                        {request.status || 'Pending'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-gray-600">

                      <p>
                        <span className="font-semibold text-gray-700">
                          Employee ID:
                        </span>{' '}
                        {request.employee_id || 'Not available'}
                      </p>

                      <p>
                        <span className="font-semibold text-gray-700">
                          From:
                        </span>{' '}
                        {request.start_date || 'N/A'}
                      </p>

                      <p>
                        <span className="font-semibold text-gray-700">
                          To:
                        </span>{' '}
                        {request.end_date || 'N/A'}
                      </p>

                      <p>
                        <span className="font-semibold text-gray-700">
                          Reason:
                        </span>{' '}
                        {request.reason || 'No reason provided'}
                      </p>

                      {request.created_at && (
                        <p className="text-xs text-gray-400">
                          Applied on:{' '}
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      )}

                    </div>
                  </div>

                  {request.status === 'Pending' && (
                    <div className="flex shrink-0 flex-wrap items-start gap-2">

                      <button
                        onClick={() =>
                          updateStatus(request.id, 'Approved')
                        }
                        disabled={updatingId === request.id}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {updatingId === request.id
                          ? 'Updating...'
                          : '✓ Approve'}
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(request.id, 'Rejected')
                        }
                        disabled={updatingId === request.id}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        ✕ Reject
                      </button>

                    </div>
                  )}

                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  )
}

export default AdminLeaveRequests