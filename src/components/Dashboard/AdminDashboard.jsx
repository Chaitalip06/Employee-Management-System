
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTasks } from '../../context/TaskContext'
import { supabase } from '../../supabase/supabaseClient'

import AddEmployee from './AddEmployee'
import EmployeeManagement from './EmployeeManagement'
import ManageTasks from './ManageTasks'
import AttendanceManagement from './AttendanceManagement'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const { tasks } = useTasks()

  const [employeeCount, setEmployeeCount] = useState(0)
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [activePage, setActivePage] = useState('Dashboard')

  // Fetch employee count from Supabase
  useEffect(() => {
    const fetchEmployeeCount = async () => {
      setLoadingEmployees(true)

      const { count, error } = await supabase
        .from('employees')
        .select('*', {
          count: 'exact',
          head: true,
        })

      if (error) {
        console.error('Employee count error:', error.message)
      } else {
        setEmployeeCount(count || 0)
      }

      setLoadingEmployees(false)
    }

    fetchEmployeeCount()
  }, [])

  // Task statistics
  const completedTasks = tasks.filter(
    (task) => task.status === 'Completed'
  ).length

  const pendingTasks = tasks.filter(
    (task) => task.status === 'Pending'
  ).length

  const inProgressTasks = tasks.filter(
    (task) => task.status === 'In Progress'
  ).length

  // Sidebar menu
  const menuItems = [
    { name: 'Dashboard', icon: '🏠' },
    { name: 'Employees', icon: '👥' },
    { name: 'Add Employee', icon: '➕' },
    { name: 'Manage Tasks', icon: '📋' },
    { name: 'Attendance', icon: '📅' },
    { name: 'Leave Requests', icon: '📝' },
    { name: 'Settings', icon: '⚙️' },
  ]

  // Statistics card
  const StatCard = ({ title, value, color, icon }) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h3 className={`mt-3 text-3xl font-bold ${color}`}>
            {value}
          </h3>
        </div>

        <div className="rounded-xl bg-gray-100 p-4 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-gray-900 p-6 text-white">

        {/* Logo */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold">
            EMS Admin
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Employee Management
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition ${
                activePage === item.name
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Admin Profile */}
        <div className="mt-8 border-t border-gray-700 pt-5">
          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold">
                {user?.name || 'Admin'}
              </p>

              <p className="text-sm text-gray-400">
                Administrator
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold transition hover:bg-red-700"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 p-6 md:p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              {activePage}
            </h2>

            <p className="mt-2 text-gray-500">
              Welcome back, {user?.name || 'Admin'}!
              Manage your employees and tasks here.
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white px-5 py-3 shadow-sm">
            <p className="font-semibold text-gray-700">
              {user?.email}
            </p>

            <p className="mt-1 text-sm text-blue-600">
              Administrator
            </p>
          </div>
        </div>

        {/* Dashboard Page */}
        {activePage === 'Dashboard' && (
          <div className="space-y-8">

            {/* Statistics */}
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Total Employees"
                value={loadingEmployees ? '...' : employeeCount}
                color="text-blue-600"
                icon="👥"
              />

              <StatCard
                title="Total Tasks"
                value={tasks.length}
                color="text-purple-600"
                icon="📋"
              />

              <StatCard
                title="Completed Tasks"
                value={completedTasks}
                color="text-green-600"
                icon="✅"
              />

              <StatCard
                title="Pending Tasks"
                value={pendingTasks}
                color="text-orange-600"
                icon="⏳"
              />
            </div>

            {/* In Progress */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Tasks In Progress
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Tasks currently being worked on
                  </p>
                </div>

                <div className="text-3xl font-bold text-indigo-600">
                  {inProgressTasks}
                </div>
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Recent Tasks
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Latest tasks from your team
                  </p>
                </div>

                <button
                  onClick={() => setActivePage('Manage Tasks')}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700"
                >
                  + Manage Tasks
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-8 text-center">

                  <p className="text-4xl">📋</p>

                  <p className="mt-3 font-semibold text-gray-700">
                    No tasks available
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Assign your first task to an employee.
                  </p>

                  <button
                    onClick={() => setActivePage('Manage Tasks')}
                    className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
                  >
                    Assign First Task
                  </button>
                </div>
              ) : (
                <div className="space-y-4">

                  {tasks.slice(0, 5).map((task, index) => (
                    <div
                      key={task.id || index}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center"
                    >

                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {task.title || `Task ${index + 1}`}
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
                          {task.description || 'No description'}
                        </p>

                        {task.deadline && (
                          <p className="mt-2 text-xs text-gray-500">
                            Deadline: {task.deadline}
                          </p>
                        )}
                      </div>

                      <span
                        className={`w-fit rounded-full px-4 py-1.5 text-sm font-semibold ${
                          task.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {task.status || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Employees Page */}
        {activePage === 'Employees' && (
          <EmployeeManagement />
        )}

        {/* Add Employee Page */}
        {activePage === 'Add Employee' && (
          <AddEmployee />
        )}

        {/* Manage Tasks Page */}
        {activePage === 'Manage Tasks' && (
          <ManageTasks />
        )}

        {/* Attendance Page */}
        {activePage === 'Attendance' && (
          <AttendanceManagement />
        )}

        {/* Leave Requests Page */}
        {activePage === 'Leave Requests' && (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🚧</div>

            <h3 className="mt-5 text-2xl font-bold text-gray-800">
              Leave Requests
            </h3>

            <p className="mt-3 text-gray-500">
              This section will be available soon.
            </p>
          </div>
        )}

        {/* Settings Page */}
        {activePage === 'Settings' && (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">⚙️</div>

            <h3 className="mt-5 text-2xl font-bold text-gray-800">
              Settings
            </h3>

            <p className="mt-3 text-gray-500">
              This section will be available soon.
            </p>
          </div>
        )}

      </main>
    </div>
  )
}

export default AdminDashboard