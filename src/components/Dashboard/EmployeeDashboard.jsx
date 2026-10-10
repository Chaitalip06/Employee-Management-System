
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTasks } from '../../context/TaskContext'
import { supabase } from '../../supabase/supabaseClient'
import LeaveManagement from './LeaveManagement'

const EmployeeDashboard = () => {
  const { user, logout } = useAuth()
  const { tasks = [], completeTask } = useTasks()

  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [taskSearch, setTaskSearch] = useState('')
  const [taskFilter, setTaskFilter] = useState('All')

  // Attendance state
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState('--')
  const [checkOutTime, setCheckOutTime] = useState('--')
  const [attendanceId, setAttendanceId] = useState(null)
  const [attendanceLoading, setAttendanceLoading] = useState(true)
  const [attendanceBusy, setAttendanceBusy] = useState(false)
  const [attendanceError, setAttendanceError] = useState('')

  const menuItems = [
    { name: 'Dashboard', icon: '🏠' },
    { name: 'My Tasks', icon: '📋' },
    { name: 'Attendance', icon: '🕒' },
    { name: 'Leave', icon: '🌴' },
    { name: 'Profile', icon: '👤' },
  ]

  // Task statistics
  const totalTasks = tasks.length

  const completedTasks = tasks.filter(
    task => task.status === 'Completed'
  ).length

  // Open Tasks includes Pending and In Progress
  const pendingTasks = tasks.filter(
    task => task.status !== 'Completed'
  ).length

  const completionRate = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0

  // Task search and filtering
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = `${task.title || ''} ${
      task.description || ''
    }`.toLowerCase().includes(taskSearch.toLowerCase())

    const matchesFilter =
      taskFilter === 'All' ||
      (taskFilter === 'Open' && task.status !== 'Completed') ||
      task.status === taskFilter

    return matchesSearch && matchesFilter
  })

  // Attendance helpers
  const getTodayDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const getCurrentTime = () => {
    const now = new Date()

    return [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join(':')
  }

  const formatTime = time => {
    if (!time || time === '--') return '--'

    const parts = time.split(':')
    const date = new Date()

    date.setHours(
      Number(parts[0]),
      Number(parts[1]),
      Number(parts[2] || 0),
      0
    )

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateWorkingHours = () => {
    if (!checkInTime || checkInTime === '--') return '--'

    const parseTime = time => {
      const [hours, minutes, seconds = 0] = time.split(':').map(Number)
      return hours * 3600 + minutes * 60 + seconds
    }

    const start = parseTime(checkInTime)

    // Show elapsed working time while checked in
    const end =
      checkOutTime && checkOutTime !== '--'
        ? parseTime(checkOutTime)
        : checkedIn
          ? (() => {
              const now = new Date()
              return (
                now.getHours() * 3600 +
                now.getMinutes() * 60 +
                now.getSeconds()
              )
            })()
          : null

    if (end === null) return '--'

    let difference = end - start

    if (difference < 0) difference += 24 * 3600

    const hours = Math.floor(difference / 3600)
    const minutes = Math.floor((difference % 3600) / 60)

    return `${hours}h ${minutes}m`
  }

  const [workingHours, setWorkingHours] = useState('--')

  useEffect(() => {
    const updateWorkingHours = () => {
      setWorkingHours(calculateWorkingHours())
    }

    updateWorkingHours()

    const timer = setInterval(updateWorkingHours, 60000)

    return () => clearInterval(timer)
  }, [checkInTime, checkOutTime, checkedIn])

  // Load today's attendance from Supabase
  const loadAttendance = async () => {
    if (!user?.id) {
      setAttendanceLoading(false)
      return
    }

    setAttendanceLoading(true)
    setAttendanceError('')

    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('id, check_in, check_out, status')
        .eq('employee_id', user.id)
        .eq('attendance_date', getTodayDate())
        .maybeSingle()

      if (error) throw error

      if (data) {
        setAttendanceId(data.id)
        setCheckInTime(data.check_in || '--')
        setCheckOutTime(data.check_out || '--')
        setCheckedIn(Boolean(data.check_in) && !data.check_out)
      } else {
        setAttendanceId(null)
        setCheckInTime('--')
        setCheckOutTime('--')
        setCheckedIn(false)
      }
    } catch (error) {
      console.error('Attendance loading error:', error)
      setAttendanceError(error.message || 'Unable to load attendance.')
    } finally {
      setAttendanceLoading(false)
    }
  }

  useEffect(() => {
    loadAttendance()
  }, [user?.id])

  // Check in
  const handleCheckIn = async () => {
    if (!user?.id) {
      alert('Please log in first.')
      return
    }

    if (attendanceId) {
      alert('You already have an attendance record for today.')
      return
    }

    setAttendanceBusy(true)
    setAttendanceError('')

    try {
      const currentTime = getCurrentTime()

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          employee_id: user.id,
          attendance_date: getTodayDate(),
          check_in: currentTime,
          status: 'Present',
        })
        .select('id, check_in, check_out, status')
        .single()

      if (error) throw error

      setAttendanceId(data.id)
      setCheckInTime(data.check_in || currentTime)
      setCheckOutTime(data.check_out || '--')
      setCheckedIn(true)

      alert('Check In successful! Attendance saved.')
    } catch (error) {
      console.error('Check In error:', error)
      setAttendanceError(error.message || 'Check In failed.')
      alert(`Check In failed: ${error.message}`)
    } finally {
      setAttendanceBusy(false)
    }
  }

  // Check out
  const handleCheckOut = async () => {
    if (!attendanceId || !checkedIn) {
      alert('Please Check In first.')
      return
    }

    setAttendanceBusy(true)
    setAttendanceError('')

    try {
      const currentTime = getCurrentTime()

      const { data, error } = await supabase
        .from('attendance')
        .update({ check_out: currentTime })
        .eq('id', attendanceId)
        .eq('employee_id', user.id)
        .select('id, check_in, check_out, status')
        .single()

      if (error) throw error

      setAttendanceId(data.id)
      setCheckInTime(data.check_in || '--')
      setCheckOutTime(data.check_out || currentTime)
      setCheckedIn(false)

      alert('Check Out successful! Attendance updated.')
    } catch (error) {
      console.error('Check Out error:', error)
      setAttendanceError(error.message || 'Check Out failed.')
      alert(`Check Out failed: ${error.message}`)
    } finally {
      setAttendanceBusy(false)
    }
  }

  const openMenu = name => {
    setActiveMenu(name)
    setMobileMenuOpen(false)
  }

  const statusClass = status => {
    if (status === 'Completed') {
      return 'bg-green-100 text-green-700'
    }

    if (status === 'In Progress') {
      return 'bg-blue-100 text-blue-700'
    }

    return 'bg-orange-100 text-orange-700'
  }

  const priorityClass = priority => {
    if (priority === 'High') return 'text-red-600'
    if (priority === 'Medium') return 'text-orange-600'
    return 'text-green-600'
  }

  const getDueDate = task =>
    task.deadline || task.dueDate || task.date || 'Not specified'

  // Attendance controls
  const attendanceButtons = (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleCheckIn}
        disabled={
          checkedIn ||
          Boolean(attendanceId) ||
          attendanceBusy ||
          attendanceLoading
        }
        className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white
                   transition hover:bg-green-700 disabled:cursor-not-allowed
                   disabled:bg-slate-300"
      >
        {attendanceBusy ? 'Saving...' : '✓ Check In'}
      </button>

      <button
        onClick={handleCheckOut}
        disabled={
          !checkedIn ||
          attendanceBusy ||
          attendanceLoading
        }
        className="rounded-xl bg-red-500 px-5 py-3 font-semibold text-white
                   transition hover:bg-red-600 disabled:cursor-not-allowed
                   disabled:bg-slate-300"
      >
        {attendanceBusy ? 'Saving...' : 'Check Out'}
      </button>
    </div>
  )

  const attendanceMessages = (
    <>
      {attendanceLoading && (
        <p className="mt-3 text-sm text-blue-600">
          Loading attendance...
        </p>
      )}

      {attendanceError && (
        <div
          role="alert"
          className="mt-4 break-words rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {attendanceError}
          <button
            onClick={loadAttendance}
            className="ml-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}
    </>
  )

  const attendanceSummary = (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl bg-slate-50 p-5">
        <p className="text-sm text-slate-500">Check In</p>
        <p className="mt-2 text-2xl font-bold text-slate-800">
          {formatTime(checkInTime)}
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 p-5">
        <p className="text-sm text-slate-500">Check Out</p>
        <p className="mt-2 text-2xl font-bold text-slate-800">
          {formatTime(checkOutTime)}
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 p-5">
        <p className="text-sm text-slate-500">Working Hours</p>
        <p className="mt-2 text-2xl font-bold text-blue-600">
          {workingHours}
        </p>
      </div>
    </div>
  )

  // Reusable task card
  const renderTask = task => (
    <article
      key={task.id}
      className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row
                 sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center
                        rounded-xl bg-slate-100 text-xl">
          📌
        </div>

        <div className="min-w-0">
          <h3 className="break-words font-semibold text-slate-800">
            {task.title || 'Untitled Task'}
          </h3>

          {task.description && (
            <p className="mt-1 break-words text-sm text-slate-500">
              {task.description}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-500">
            Due: {getDueDate(task)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(task.status)}`}
        >
          {task.status || 'Pending'}
        </span>

        <span className={`text-xs font-medium ${priorityClass(task.priority)}`}>
          {task.priority || 'Normal'} Priority
        </span>

        {task.status !== 'Completed' && (
          <button
            onClick={() => completeTask(task.id)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold
                       text-white transition hover:bg-blue-700"
          >
            Mark Completed
          </button>
        )}
      </div>
    </article>
  )

  // Page content
  const renderContent = () => {
    if (activeMenu === 'Dashboard') {
      return (
        <>
          {/* Welcome banner */}
          <section className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600
                              to-indigo-600 p-6 text-white shadow-lg md:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="mb-2 text-sm text-blue-100">
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>

                <h1 className="text-2xl font-bold md:text-3xl">
                  Welcome back, {user?.name || 'Employee'}! 👋
                </h1>

                <p className="mt-2 text-blue-100">
                  Here's what's happening with your work today.
                </p>
              </div>

              <div className="hidden text-6xl sm:block" aria-hidden="true">
                ☀️
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total Tasks',
                value: totalTasks,
                icon: '📋',
                color: 'bg-blue-100',
                detail: 'Assigned to you',
              },
              {
                label: 'Completed',
                value: completedTasks,
                icon: '✅',
                color: 'bg-green-100',
                detail: `${completionRate}% completion rate`,
              },
              {
                label: 'Open Tasks',
                value: pendingTasks,
                icon: '⏳',
                color: 'bg-orange-100',
                detail: 'Still to be completed',
              },
              {
                label: 'Attendance',
                value: attendanceLoading
                  ? '...'
                  : attendanceId
                    ? checkedIn
                      ? 'Checked In'
                      : 'Present'
                    : 'Not Marked',
                icon: '🕒',
                color: 'bg-purple-100',
                detail: "Today's attendance",
              },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm
                           transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center
                                   rounded-xl text-2xl ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>

                <p className="mt-5 text-sm text-slate-500">{stat.label}</p>

                <h3 className="mt-1 break-words text-2xl font-bold text-slate-800 sm:text-3xl">
                  {stat.value}
                </h3>

                <p className="mt-2 text-xs text-slate-500">{stat.detail}</p>
              </div>
            ))}
          </section>

          {/* Progress */}
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-800">Task Progress</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your overall completion
                </p>
              </div>
              <span className="text-xl font-bold text-blue-600">
                {completionRate}%
              </span>
            </div>

            <div
              className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Task completion"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600
                           transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </section>

          {/* Tasks and activity */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200
                            bg-white shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between gap-4 border-b
                              border-slate-200 p-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">My Tasks</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your latest assigned tasks
                  </p>
                </div>

                <button
                  onClick={() => openMenu('My Tasks')}
                  className="shrink-0 text-sm font-semibold text-blue-600 hover:underline"
                >
                  View All →
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {tasks.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl">📋</div>
                    <p className="mt-3 font-medium text-slate-700">No tasks yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Your assigned tasks will appear here.
                    </p>
                  </div>
                ) : (
                  tasks.slice(0, 5).map(renderTask)
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800">Work Summary</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your current overview
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center
                                   rounded-full bg-blue-100">📋</span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {totalTasks} total tasks assigned
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {pendingTasks} open · {completedTasks} completed
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center
                                   rounded-full bg-green-100">✓</span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {completionRate}% task completion
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Based on your current task list
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center
                                   rounded-full bg-purple-100">🕒</span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {attendanceLoading
                        ? 'Loading attendance...'
                        : checkedIn
                          ? 'You are checked in'
                          : attendanceId
                            ? 'Attendance recorded'
                            : 'Attendance not marked'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {attendanceId
                        ? `Check in: ${formatTime(checkInTime)}`
                        : 'Remember to mark attendance'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openMenu('Attendance')}
                  className="w-full rounded-xl border border-blue-200 px-4 py-3
                             text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  Go to Attendance →
                </button>
              </div>
            </div>
          </section>

          {/* Attendance panel */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Today's Attendance
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Track your working hours
                </p>
              </div>
              {attendanceButtons}
            </div>

            {attendanceMessages}
            {attendanceSummary}
          </section>
        </>
      )
    }

    if (activeMenu === 'My Tasks') {
      return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800">My Tasks 📋</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search and manage your assigned tasks
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="search"
                value={taskSearch}
                onChange={event => setTaskSearch(event.target.value)}
                placeholder="Search tasks..."
                aria-label="Search tasks"
                className="w-full rounded-xl border border-slate-200 px-4 py-3
                           outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={taskFilter}
                onChange={event => setTaskFilter(event.target.value)}
                aria-label="Filter tasks"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3
                           outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">All tasks</option>
                <option value="Open">Open tasks</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl">🔎</div>
                <p className="mt-3 font-semibold text-slate-700">
                  No matching tasks
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try a different search or filter.
                </p>
                <button
                  onClick={() => {
                    setTaskSearch('')
                    setTaskFilter('All')
                  }}
                  className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredTasks.map(renderTask)
            )}
          </div>
        </section>
      )
    }

    if (activeMenu === 'Attendance') {
      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Attendance 🕒</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your daily attendance
          </p>

          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-500">Today's date</p>
              <p className="mt-1 font-semibold text-slate-800">
                {new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {checkedIn
                  ? 'You are currently checked in.'
                  : attendanceId
                    ? 'Your attendance is recorded for today.'
                    : 'You have not checked in today.'}
              </p>
            </div>
            {attendanceButtons}
          </div>

          {attendanceMessages}
          {attendanceSummary}
        </section>
      )
    }

    if (activeMenu === 'Leave') {
      return <LeaveManagement />
    }

    if (activeMenu === 'Profile') {
      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">My Profile 👤</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your account information
          </p>

          <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row">
            <div className="flex h-24 w-24 items-center justify-center rounded-full
                            bg-blue-600 text-3xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'E'}
            </div>

            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-bold text-slate-800">
                {user?.name || 'Employee'}
              </h3>
              <p className="mt-1 break-all text-slate-500">
                {user?.email || 'No email available'}
              </p>
              <span className="mt-3 inline-block rounded-full bg-blue-100
                               px-3 py-1 text-sm text-blue-700">
                {user?.role || 'Employee'}
              </span>
            </div>
          </div>
        </section>
      )
    }

    return null
  }

  // Sidebar
  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-20 shrink-0 items-center border-b border-slate-700 px-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl
                        bg-blue-600 text-lg font-bold">
          EM
        </div>

        <div className="ml-3">
          <h1 className="text-lg font-bold">EmployeeMS </h1>
          <p className="text-xs text-slate-400">Employee Portal</p>
        </div>

        <button
          onClick={() => setMobileMenuOpen(false)}
          className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-slate-800 md:hidden"
          aria-label="Close menu"
        >
          
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Menu
        </p>

        {menuItems.map(item => (
          <button
            key={item.name}
            onClick={() => openMenu(item.name)}
            className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3
                        text-left transition ${
              activeMenu === item.name
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-700 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3
                     text-red-400 transition hover:bg-red-500/10"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )

  // Main layout
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-30 hidden md:block">
        {sidebar}
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 h-full w-full bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation overlay"
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between
                           border-b border-slate-200 bg-white/95 px-4 backdrop-blur
                           sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-700
                         transition hover:bg-slate-100 md:hidden"
              aria-label="Open navigation menu"
            >
              ☰
            </button>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-800 sm:text-xl">
                {activeMenu}
              </h2>
              <p className="truncate text-xs text-slate-500 sm:text-sm">
                Welcome back, {user?.name || 'Employee'} 👋
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div
              className="hidden h-10 w-10 items-center justify-center rounded-full
                         bg-blue-100 text-lg sm:flex"
              title="Employee portal"
            >
              🔔
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full
                            bg-blue-600 font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'E'}
            </div>

            <div className="hidden sm:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
                {user?.name || 'Employee'}
              </p>
              <p className="text-xs text-slate-500">
                {user?.role || 'Employee'}
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>

        <footer className="px-6 pb-6 text-center text-xs text-slate-400">
          EmployeeMS · Employee Portal
        </footer>
      </main>
    </div>
  )
}

export default EmployeeDashboard