import React from 'react'
import { useAuth } from './context/AuthContext'

import Login from './components/Auth/Login'
import EmployeeDashboard from './components/Dashboard/EmployeeDashboard'
import AdminDashboard from './components/Dashboard/AdminDashboard'

const App = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold">
          Loading...
        </h1>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <Login />
  }

  // Admin
  if (user.role === 'Admin') {
    return <AdminDashboard />
  }

  // Employee
  return <EmployeeDashboard />
}

export default App