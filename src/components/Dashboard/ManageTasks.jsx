
import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabase/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const ManageTasks = () => {
  const { user } = useAuth()

  const [employees, setEmployees] = useState([])
  const [tasks, setTasks] = useState([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [deadline, setDeadline] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Fetch employees and tasks
  const fetchData = async () => {
    setError('')

    const { data: employeeData, error: employeeError } =
      await supabase
        .from('employees')
        .select('id, name, email')
        .order('name')

    if (employeeError) {
      setError(employeeError.message)
      return
    }

    setEmployees(employeeData || [])

    const { data: taskData, error: taskError } =
      await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

    if (taskError) {
      setError(taskError.message)
      return
    }

    setTasks(taskData || [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Assign task
  const handleSubmit = async (e) => {
    e.preventDefault()

    setMessage('')
    setError('')

    if (!title.trim() || !employeeId) {
      setError('Please enter task title and select an employee.')
      return
    }

    setLoading(true)

    const { error: insertError } = await supabase
      .from('tasks')
      .insert([
        {
          title: title.trim(),
          description: description.trim(),
          employee_id: employeeId,
          created_by: user.id,
          deadline: deadline || null,
          status: 'Pending',
        },
      ])

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setMessage('Task assigned successfully!')

    setTitle('')
    setDescription('')
    setEmployeeId('')
    setDeadline('')

    fetchData()
  }

  // Update task status
  const updateStatus = async (taskId, newStatus) => {
    setError('')
    setMessage('')

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage('Task status updated!')
    fetchData()
  }

  // Find employee name
  const getEmployeeName = (id) => {
    const employee = employees.find((emp) => emp.id === id)

    return employee
      ? employee.name
      : 'Employee'
  }

  return (
    <div className="space-y-8">

      {/* Add Task Form */}
      <div className="rounded-2xl bg-white p-6 shadow">

        <h3 className="mb-6 text-2xl font-bold text-gray-800">
          Assign New Task
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Task Title */}
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Task Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows="4"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Employee Dropdown */}
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Assign To Employee
            </label>

            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              required
            >
              <option value="">
                Select an employee
              </option>

              {employees
                .filter((emp) => emp.id !== user?.id)
                .map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name} ({employee.email})
                  </option>
                ))}
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Deadline
            </label>

            <input
              type="date"
              value={deadline}
              min={new Date().toLocaleDateString('en-CA')}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Messages */}
          {error && (
            <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-lg bg-green-100 p-3 text-sm text-green-700">
              {message}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Assigning Task...' : 'Assign Task'}
          </button>

        </form>
      </div>

      {/* Assigned Tasks */}
      <div className="rounded-2xl bg-white p-6 shadow">

        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-800">
            Assigned Tasks
          </h3>

          <button
            onClick={fetchData}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-gray-500">
            No tasks assigned yet.
          </p>
        ) : (
          <div className="space-y-4">

            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-gray-200 p-5"
              >

                <div className="flex flex-col justify-between gap-4 md:flex-row">

                  <div className="flex-1">

                    <h4 className="text-lg font-bold text-gray-800">
                      {task.title}
                    </h4>

                    <p className="mt-2 text-gray-600">
                      {task.description || 'No description'}
                    </p>

                    <p className="mt-3 text-sm text-gray-500">
                      Assigned to: {getEmployeeName(task.employee_id)}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Deadline: {task.deadline || 'Not set'}
                    </p>

                  </div>

                  <div className="min-w-40">

                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Task Status
                    </label>

                    <select
                      value={task.status}
                      onChange={(e) =>
                        updateStatus(task.id, e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="In Progress">
                        In Progress
                      </option>

                      <option value="Completed">
                        Completed
                      </option>
                    </select>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  )
}

export default ManageTasks