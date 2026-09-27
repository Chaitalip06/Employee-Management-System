import React, { createContext, useContext, useState } from 'react'

const TaskContext = createContext()

export const TaskProvider = ({ children }) => {

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Complete Project Report',
      description: 'Complete and submit the project report.',
      priority: 'High',
      status: 'In Progress',
      dueDate: 'Today'
    },
    {
      id: 2,
      title: 'Team Meeting',
      description: 'Attend the weekly team meeting.',
      priority: 'Medium',
      status: 'Completed',
      dueDate: 'Today'
    },
    {
      id: 3,
      title: 'Update Documentation',
      description: 'Update the project documentation.',
      priority: 'Low',
      status: 'Pending',
      dueDate: 'Tomorrow'
    },
    {
      id: 4,
      title: 'Client Presentation',
      description: 'Prepare slides for the client presentation.',
      priority: 'High',
      status: 'Pending',
      dueDate: '12 Sep'
    }
  ])

  // COMPLETE TASK
  const completeTask = (taskId) => {

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: 'Completed'
            }
          : task
      )
    )
  }

  // ADD TASK
  const addTask = (newTask) => {

    const task = {
      id: Date.now(),
      ...newTask
    }

    setTasks(prevTasks => [
      ...prevTasks,
      task
    ])
  }

  // DELETE TASK
  const deleteTask = (taskId) => {

    setTasks(prevTasks =>
      prevTasks.filter(task => task.id !== taskId)
    )
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        completeTask,
        addTask,
        deleteTask
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export const useTasks = () => {
  return useContext(TaskContext)
}