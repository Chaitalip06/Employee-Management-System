
import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabase/supabaseClient'

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  async function fetchEmployees() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('employees')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setEmployees(data || [])
    }

    setLoading(false)
  }

  const filteredEmployees = employees.filter((employee) =>
    `${employee.name || ''} ${employee.email || ''} ${employee.role || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Employee Management
          </h1>
          <p className="mt-2 text-gray-500">
            View and manage all registered employees.
          </p>
        </div>

        <button
          onClick={fetchEmployees}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Employees</p>
          <h2 className="mt-2 text-3xl font-bold text-indigo-600">
            {employees.length}
          </h2>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Search Results</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {filteredEmployees.length}
          </h2>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center">
                    Loading employees...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-10 text-center text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {employee.name || 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {employee.email}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {employee.role || 'Employee'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {employee.created_at
                        ? new Date(employee.created_at).toLocaleDateString()
                        : 'N/A'}
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