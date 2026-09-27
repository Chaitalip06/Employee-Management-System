
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTasks } from '../../context/TaskContext'
import { supabase } from '../../supabase/supabaseClient'

const EmployeeDashboard = () => {
  const { user, logout } = useAuth()
  const { tasks, completeTask } = useTasks()

  const [activeMenu, setActiveMenu] = useState('Dashboard')

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

  // ================= TASK COUNTS =================

  const totalTasks = tasks.length

  const completedTasks = tasks.filter(
    task => task.status === 'Completed'
  ).length

  const pendingTasks = tasks.filter(
    task => task.status === 'Pending'
  ).length

  // ================= ATTENDANCE HELPERS =================

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
      String(now.getSeconds()).padStart(2, '0')
    ].join(':')
  }

  const formatTime = (time) => {
    if (!time) return '--'

    const [hours, minutes] = time.split(':')
    const date = new Date()

    date.setHours(Number(hours), Number(minutes), 0, 0)

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateWorkingHours = () => {
    if (!checkInTime || checkInTime === '--') {
      return '--'
    }

    if (!checkOutTime || checkOutTime === '--') {
      return checkedIn ? 'In Progress' : '--'
    }

    const parseTime = (time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const start = parseTime(checkInTime)
    const end = parseTime(checkOutTime)

    let difference = end - start

    // Handle overnight shifts
    if (difference < 0) {
      difference += 24 * 60
    }

    const hours = Math.floor(difference / 60)
    const minutes = difference % 60

    return `${hours}h ${minutes}m`
  }

  // ================= LOAD ATTENDANCE =================

  const loadAttendance = async () => {
    if (!user?.id) {
      setAttendanceLoading(false)
      return
    }

    setAttendanceLoading(true)
    setAttendanceError('')

    const { data, error } = await supabase
      .from('attendance')
      .select('id, check_in, check_out, status')
      .eq('employee_id', user.id)
      .eq('attendance_date', getTodayDate())
      .maybeSingle()

    if (error) {
      console.error('Attendance loading error:', error)
      setAttendanceError(error.message)
      setAttendanceLoading(false)
      return
    }

    if (data) {
      setAttendanceId(data.id)
      setCheckInTime(data.check_in || '--')
      setCheckOutTime(data.check_out || '--')

      setCheckedIn(
        Boolean(data.check_in) && !data.check_out
      )
    } else {
      setAttendanceId(null)
      setCheckInTime('--')
      setCheckOutTime('--')
      setCheckedIn(false)
    }

    setAttendanceLoading(false)
  }

  useEffect(() => {
    loadAttendance()
  }, [user?.id])

  // ================= CHECK IN =================

  const handleCheckIn = async () => {
    if (!user?.id) {
      alert('Please login first!')
      return
    }

    if (attendanceId) {
      alert('You already have an attendance record for today.')
      return
    }

    setAttendanceBusy(true)
    setAttendanceError('')

    const currentTime = getCurrentTime()

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        employee_id: user.id,
        attendance_date: getTodayDate(),
        check_in: currentTime,
        status: 'Present'
      })
      .select('id, check_in, check_out, status')
      .single()

    if (error) {
      console.error('Check In error:', error)
      setAttendanceError(error.message)
      alert(`Check In failed: ${error.message}`)
    } else {
      setAttendanceId(data.id)
      setCheckInTime(data.check_in)
      setCheckOutTime(data.check_out || '--')
      setCheckedIn(true)

      alert('Check In successful! Attendance saved.')
    }

    setAttendanceBusy(false)
  }

  // ================= CHECK OUT =================

  const handleCheckOut = async () => {
    if (!attendanceId || !checkedIn) {
      alert('Please Check In first!')
      return
    }

    setAttendanceBusy(true)
    setAttendanceError('')

    const currentTime = getCurrentTime()

    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out: currentTime
      })
      .eq('id', attendanceId)
      .select('id, check_in, check_out, status')
      .single()

    if (error) {
      console.error('Check Out error:', error)
      setAttendanceError(error.message)
      alert(`Check Out failed: ${error.message}`)
    } else {
      setAttendanceId(data.id)
      setCheckInTime(data.check_in || '--')
      setCheckOutTime(data.check_out || '--')
      setCheckedIn(false)

      alert('Check Out successful! Attendance updated.')
    }

    setAttendanceBusy(false)
  }

  // ================= ATTENDANCE BUTTONS =================

  const attendanceButtons = (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleCheckIn}
        disabled={
          checkedIn ||
          attendanceBusy ||
          attendanceLoading ||
          Boolean(attendanceId)
        }
        className="px-5 py-2.5 bg-green-600
                   disabled:bg-slate-300 text-white
                   rounded-lg font-medium hover:bg-green-700
                   disabled:cursor-not-allowed transition"
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
        className="px-5 py-2.5 bg-red-500
                   disabled:bg-slate-300 text-white
                   rounded-lg font-medium hover:bg-red-600
                   disabled:cursor-not-allowed transition"
      >
        {attendanceBusy ? 'Saving...' : 'Check Out'}
      </button>
    </div>
  )

  const attendanceMessages = (
    <>
      {attendanceLoading && (
        <p className="text-sm text-blue-600 mt-3">
          Loading attendance...
        </p>
      )}

      {attendanceError && (
        <p className="text-sm text-red-600 mt-3 break-words">
          {attendanceError}
        </p>
      )}
    </>
  )

  // ================= ATTENDANCE SUMMARY =================

  const attendanceSummary = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-sm text-slate-500">
          Check In
        </p>
        <p className="text-xl font-bold text-slate-800 mt-1">
          {checkInTime === '--' ? '--' : formatTime(checkInTime)}
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-sm text-slate-500">
          Check Out
        </p>
        <p className="text-xl font-bold text-slate-800 mt-1">
          {checkOutTime === '--' ? '--' : formatTime(checkOutTime)}
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-sm text-slate-500">
          Working Hours
        </p>
        <p className="text-xl font-bold text-blue-600 mt-1">
          {calculateWorkingHours()}
        </p>
      </div>
    </div>
  )

  // ================= CONTENT =================

  const renderContent = () => {
    // ================= DASHBOARD =================

    if (activeMenu === 'Dashboard') {
      return (
        <>
          {/* Welcome Banner */}

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600
                          rounded-2xl p-6 md:p-8 text-white mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row
                            md:items-center justify-between">
              <div>
                <p className="text-blue-100 mb-2">
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>

                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Good Morning, {user?.name}! 👋
                </h1>

                <p className="text-blue-100">
                  Here's what's happening with your work today.
                </p>
              </div>

              <div className="text-6xl mt-5 md:mt-0">
                ☀️
              </div>
            </div>
          </div>

          {/* Stat Cards */}

          <div className="grid grid-cols-1 sm:grid-cols-2
                          lg:grid-cols-4 gap-5 mb-8">

            <div className="bg-white rounded-2xl p-5 shadow-sm
                            border border-slate-200 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-100
                                flex items-center justify-center text-2xl">
                  📋
                </div>
                <span className="text-xs bg-blue-50 text-blue-600
                                 px-2 py-1 rounded-full">
                  {totalTasks} tasks
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-4">
                Total Tasks
              </p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">
                {totalTasks}
              </h3>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm
                            border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-green-100
                              flex items-center justify-center text-2xl">
                ✅
              </div>
              <p className="text-slate-500 text-sm mt-4">
                Completed
              </p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">
                {completedTasks}
              </h3>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm
                            border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-orange-100
                              flex items-center justify-center text-2xl">
                ⏳
              </div>
              <p className="text-slate-500 text-sm mt-4">
                Pending
              </p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">
                {pendingTasks}
              </h3>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm
                            border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-100
                              flex items-center justify-center text-2xl">
                🕒
              </div>
              <p className="text-slate-500 text-sm mt-4">
                Attendance
              </p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">
                {attendanceId ? 'Present' : '--'}
              </h3>
            </div>
          </div>

          {/* Tasks and Recent Activity */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 bg-white rounded-2xl
                            border border-slate-200 shadow-sm">

              <div className="p-6 border-b border-slate-200
                              flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    My Tasks
                  </h2>
                  <p className="text-sm text-slate-500">
                    Your latest assigned tasks
                  </p>
                </div>

                <button
                  onClick={() => setActiveMenu('My Tasks')}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {tasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No tasks available.
                  </div>
                ) : (
                  tasks.slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      className="p-5 flex items-center justify-between
                                 gap-4 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100
                                        flex items-center justify-center">
                          📌
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {task.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Due: {task.deadline || task.dueDate || task.date || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs px-3 py-1 rounded-full
                          font-medium ${
                            task.status === 'Completed'
                              ? 'bg-green-100 text-green-700'
                              : task.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                          {task.status}
                        </span>

                        <p className={`text-xs mt-2 ${
                          task.priority === 'High'
                            ? 'text-red-500'
                            : task.priority === 'Medium'
                            ? 'text-orange-500'
                            : 'text-green-500'
                        }`}>
                          {task.priority || 'Normal'} Priority
                        </p>

                        {task.status !== 'Completed' && (
                          <button
                            onClick={() => completeTask(task.id)}
                            className="mt-2 text-xs bg-blue-600
                                       text-white px-3 py-1.5 rounded-lg
                                       hover:bg-blue-700"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}

            <div className="bg-white rounded-2xl
                            border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">
                  Recent Activity
                </h2>
                <p className="text-sm text-slate-500">
                  Your latest activities
                </p>
              </div>

              <div className="p-6">
                <div className="flex gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-green-100
                                  flex items-center justify-center">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">
                      Dashboard loaded successfully
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Just now
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-blue-100
                                  flex items-center justify-center">
                    📋
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">
                      {totalTasks} tasks assigned
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Today
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100
                                  flex items-center justify-center">
                    🕒
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">
                      {attendanceId
                        ? `Checked in at ${formatTime(checkInTime)}`
                        : 'Attendance available'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Today
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Attendance */}

          <div className="mt-6 bg-white rounded-2xl
                          border border-slate-200 shadow-sm p-6">

            <div className="flex flex-col sm:flex-row
                            sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Today's Attendance
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Track your working hours
                </p>
              </div>

              {attendanceButtons}
            </div>

            {attendanceMessages}
            {attendanceSummary}
          </div>
        </>
      )
    }

    // ================= MY TASKS =================

    if (activeMenu === 'My Tasks') {
      return (
        <div className="bg-white rounded-2xl border
                        border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">
              My Tasks 📋
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Manage all your assigned tasks
            </p>
          </div>

          <div className="p-6 space-y-4">
            {tasks.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No tasks available.
              </p>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className="border border-slate-200 rounded-xl
                             p-5 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row
                                  md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {task.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {task.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        Due: {task.deadline || task.dueDate || task.date || 'Not specified'}
                      </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        task.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : task.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {task.status}
                      </span>

                      <span className="text-xs text-slate-500 mt-2">
                        {task.priority || 'Normal'} Priority
                      </span>

                      {task.status !== 'Completed' && (
                        <button
                          onClick={() => completeTask(task.id)}
                          className="mt-3 bg-blue-600 text-white
                                     px-4 py-2 rounded-lg text-sm
                                     hover:bg-blue-700"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )
    }

    // ================= ATTENDANCE =================

    if (activeMenu === 'Attendance') {
      return (
        <div className="bg-white rounded-2xl
                        border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800">
            Attendance 🕒
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Manage your daily attendance
          </p>

          <div className="mt-6 flex flex-col sm:flex-row
                          sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Today's date
              </p>
              <p className="font-semibold text-slate-800">
                {new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            {attendanceButtons}
          </div>

          {attendanceMessages}
          {attendanceSummary}

          <div className="mt-6 bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              {attendanceLoading
                ? 'Please wait while attendance is loading.'
                : checkedIn
                ? 'You are currently checked in. Please check out when your work is finished.'
                : attendanceId
                ? 'Your attendance for today is complete.'
                : 'You have not checked in today.'}
            </p>
          </div>
        </div>
      )
    }

    // ================= LEAVE =================

    if (activeMenu === 'Leave') {
      return (
        <div className="bg-white rounded-2xl
                        border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800">
            Leave Management 🌴
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Manage your leave requests
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3
                          gap-5 mt-8">
            <div className="bg-blue-50 p-5 rounded-xl">
              <p className="text-sm text-slate-500">Total Leave</p>
              <h3 className="text-3xl font-bold mt-2">20</h3>
            </div>

            <div className="bg-green-50 p-5 rounded-xl">
              <p className="text-sm text-slate-500">Used</p>
              <h3 className="text-3xl font-bold mt-2">5</h3>
            </div>

            <div className="bg-orange-50 p-5 rounded-xl">
              <p className="text-sm text-slate-500">Remaining</p>
              <h3 className="text-3xl font-bold mt-2">15</h3>
            </div>
          </div>

          <button
            onClick={() => alert('Leave request form will open here.')}
            className="mt-8 bg-blue-600 text-white
                       px-5 py-3 rounded-lg hover:bg-blue-700"
          >
            + Apply for Leave
          </button>
        </div>
      )
    }

    // ================= PROFILE =================

    if (activeMenu === 'Profile') {
      return (
        <div className="bg-white rounded-2xl
                        border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800">
            My Profile 👤
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Your account information
          </p>

          <div className="mt-8 flex flex-col sm:flex-row
                          items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-blue-600
                            text-white flex items-center justify-center
                            text-3xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-800">
                {user?.name}
              </h3>

              <p className="text-slate-500 mt-1">
                {user?.email}
              </p>

              <span className="inline-block mt-3 bg-blue-100
                               text-blue-700 px-3 py-1
                               rounded-full text-sm">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  // ================= MAIN LAYOUT =================

  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* SIDEBAR */}

      <aside className="w-64 bg-slate-900 text-white fixed
                        left-0 top-0 h-screen hidden md:flex
                        flex-col z-20">

        <div className="h-20 flex items-center px-6
                        border-b border-slate-700">
          <div className="w-10 h-10 bg-blue-600 rounded-xl
                          flex items-center justify-center text-xl">
            EM
          </div>

          <div className="ml-3">
            <h1 className="font-bold text-lg">EmployeeMS</h1>
            <p className="text-xs text-slate-400">
              Employee Portal
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6">
          <p className="text-xs uppercase text-slate-500
                        font-semibold px-3 mb-3">
            Menu
          </p>

          {menuItems.map(item => (
            <button
              key={item.name}
              onClick={() => setActiveMenu(item.name)}
              className={`w-full flex items-center gap-3
                          px-4 py-3 mb-2 rounded-xl text-left
                          transition ${
                activeMenu === item.name
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3
                       px-4 py-3 rounded-xl text-red-400
                       hover:bg-red-500/10 transition"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="flex-1 md:ml-64">

        {/* TOP NAVBAR */}

        <header className="bg-white border-b border-slate-200
                           h-20 flex items-center
                           justify-between px-6 md:px-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {activeMenu}
            </h2>

            <p className="text-sm text-slate-500">
              Welcome back, {user?.name} 👋
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="relative w-10 h-10 rounded-full
                         bg-slate-100 hover:bg-slate-200"
              aria-label="Notifications"
            >
              🔔
              <span className="absolute top-1 right-1
                               w-2.5 h-2.5 bg-red-500
                               rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600
                              text-white flex items-center
                              justify-center font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500">
                  Employee
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <div className="p-6 md:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default EmployeeDashboard