
import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabase/supabaseClient'

export default function AttendanceManagement() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAttendance()
  }, [])

  async function fetchAttendance() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        attendance_date,
        check_in,
        check_out,
        status,
        employees (
          name,
          email
        )
      `)
      .order('attendance_date', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setRecords(data || [])
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Attendance Management
          </h1>
          <p className="mt-2 text-gray-500">
            View employee attendance records.
          </p>
        </div>

        <button
          onClick={fetchAttendance}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Total Attendance Records</p>
        <h2 className="mt-2 text-3xl font-bold text-indigo-600">
          {records.length}
        </h2>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center">
                    Loading attendance...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">
                        {record.employees?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.employees?.email || ''}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {record.attendance_date}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {record.check_in || '--'}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {record.check_out || '--'}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {record.status || 'Present'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}