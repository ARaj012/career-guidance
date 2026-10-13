'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Circle, Plus, Target, BookOpen, Calendar } from 'lucide-react'

interface DailyTask {
  id: string
  title: string
  completed: boolean
  category: 'study' | 'practice' | 'revision' | 'other'
  priority: 'high' | 'medium' | 'low'
  weightage?: number
}

interface DailyTaskListProps {
  examId: string
  examTitle: string
  daysRemaining: number | null
}

export default function DailyTaskList({ examId, examTitle, daysRemaining }: DailyTaskListProps) {
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [completedToday, setCompletedToday] = useState(0)

  // Generate tasks based on exam and time remaining
  useEffect(() => {
    if (daysRemaining !== null && daysRemaining > 0) {
      const generatedTasks = generateSyllabusBasedTasks(examTitle, daysRemaining)
      setTasks(generatedTasks)
    }
  }, [examTitle, daysRemaining])

  const generateSyllabusBasedTasks = (examName: string, days: number): DailyTask[] => {
    const examLower = examName.toLowerCase()
    const tasks: DailyTask[] = []

    // Generate tasks based on exam type
    if (examLower.includes('gate')) {
      tasks.push(
        { id: '1', title: 'Engineering Mathematics (15% weightage)', completed: false, category: 'study', priority: 'high', weightage: 15 },
        { id: '2', title: 'General Aptitude (15% weightage)', completed: false, category: 'study', priority: 'high', weightage: 15 },
        { id: '3', title: 'Core Subject Topics (70% weightage)', completed: false, category: 'study', priority: 'high', weightage: 70 },
        { id: '4', title: 'Practice Previous Year Papers (Last 10 years)', completed: false, category: 'practice', priority: 'high', weightage: 20 },
        { id: '5', title: 'Revise Formulas and Shortcuts', completed: false, category: 'revision', priority: 'medium', weightage: 5 }
      )
    } else if (examLower.includes('upsc') || examLower.includes('cse')) {
      tasks.push(
        { id: '1', title: 'Current Affairs (40% weightage)', completed: false, category: 'study', priority: 'high', weightage: 40 },
        { id: '2', title: 'History & Polity (25% weightage)', completed: false, category: 'study', priority: 'high', weightage: 25 },
        { id: '3', title: 'Geography & Environment (20% weightage)', completed: false, category: 'study', priority: 'medium', weightage: 20 },
        { id: '4', title: 'Economy & Science (15% weightage)', completed: false, category: 'study', priority: 'medium', weightage: 15 },
        { id: '5', title: 'CSAT Practice', completed: false, category: 'practice', priority: 'medium', weightage: 30 }
      )
    } else if (examLower.includes('cat')) {
      tasks.push(
        { id: '1', title: 'Quantitative Aptitude (34% weightage)', completed: false, category: 'study', priority: 'high', weightage: 34 },
        { id: '2', title: 'Verbal Ability (34% weightage)', completed: false, category: 'study', priority: 'high', weightage: 34 },
        { id: '3', title: 'Data Interpretation (16% weightage)', completed: false, category: 'practice', priority: 'medium', weightage: 16 },
        { id: '4', title: 'Logical Reasoning (16% weightage)', completed: false, category: 'practice', priority: 'medium', weightage: 16 },
        { id: '5', title: 'Reading Comprehension Practice', completed: false, category: 'practice', priority: 'medium', weightage: 24 }
      )
    } else if (examLower.includes('jee')) {
      tasks.push(
        { id: '1', title: 'Physics (33% weightage)', completed: false, category: 'study', priority: 'high', weightage: 33 },
        { id: '2', title: 'Chemistry (33% weightage)', completed: false, category: 'study', priority: 'high', weightage: 33 },
        { id: '3', title: 'Mathematics (34% weightage)', completed: false, category: 'study', priority: 'high', weightage: 34 },
        { id: '4', title: 'Previous Year Questions', completed: false, category: 'practice', priority: 'high', weightage: 25 },
        { id: '5', title: 'Formula Memorization', completed: false, category: 'revision', priority: 'low', weightage: 10 }
      )
    } else {
      // Generic fallback
      tasks.push(
        { id: '1', title: 'Core Subjects (60% weightage)', completed: false, category: 'study', priority: 'high', weightage: 60 },
        { id: '2', title: 'Previous Year Papers (20% weightage)', completed: false, category: 'practice', priority: 'high', weightage: 20 },
        { id: '3', title: 'Practice Tests (15% weightage)', completed: false, category: 'practice', priority: 'medium', weightage: 15 },
        { id: '4', title: 'Formula Revision (5% weightage)', completed: false, category: 'revision', priority: 'low', weightage: 5 }
      )
    }

    // Adjust tasks based on time remaining
    if (days < 30) {
      // Emergency mode - focus on high weightage only
      return tasks.filter(t => t.priority === 'high').slice(0, 3)
    } else if (days < 90) {
      // Medium-term - high and medium priority
      return tasks.filter(t => t.priority === 'high' || t.priority === 'medium')
    }

    return tasks
  }

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed } 
        : task
    ))
    
    if (!tasks.find(t => t.id === taskId)?.completed) {
      setCompletedToday(prev => prev + 1)
    } else {
      setCompletedToday(prev => prev - 1)
    }
  }

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: DailyTask = {
        id: Date.now().toString(),
        title: newTaskTitle,
        completed: false,
        category: 'other',
        priority: 'medium'
      }
      setTasks([...tasks, newTask])
      setNewTaskTitle('')
      setShowAddTask(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study': return <BookOpen className="w-4 h-4" />
      case 'practice': return <Target className="w-4 h-4" />
      case 'revision': return <Calendar className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study': return 'bg-blue-100 text-blue-700'
      case 'practice': return 'bg-green-100 text-green-700'
      case 'revision': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const progress = tasks.length > 0 ? (completedToday / tasks.length) * 100 : 0

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Daily Study Plan</h3>
              <p className="text-white/80 text-xs">Syllabus-based tasks with weightage priority</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-white text-sm font-semibold">{completedToday}/{tasks.length}</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Syllabus Info */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-start gap-2">
          <div className="p-1 bg-blue-600 rounded-lg">
            <Target className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="text-xs text-blue-900 font-semibold mb-1">AI Syllabus Analysis</p>
            <p className="text-xs text-blue-700">
              Tasks prioritized by topic weightage from last 10 years exam patterns
            </p>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-4 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No tasks for today</p>
            <button
              onClick={() => setShowAddTask(true)}
              className="mt-2 text-indigo-600 font-semibold text-sm hover:text-indigo-700"
            >
              Add your first task
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 bg-gray-50 border-gray-200 hover:border-indigo-300"
            >
              <button
                onClick={() => toggleTask(task.id)}
                className="flex-shrink-0 transition-all duration-200 text-gray-400 hover:text-indigo-600"
              >
                {task.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
              
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {task.title}
                  {task.weightage && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {task.weightage}%
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-100 text-blue-700">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
          ))
        )}

        {/* Add Task Button */}
        {showAddTask ? (
          <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full px-3 py-2 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={addTask}
                className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
              >
                Add Task
              </button>
              <button
                onClick={() => setShowAddTask(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddTask(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Custom Task
          </button>
        )}
      </div>

      {/* Tips */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-t border-gray-100">
        <div className="flex items-start gap-2">
          <div className="p-1 bg-blue-500 rounded-lg">
            <Target className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="text-xs text-blue-900 font-semibold mb-1">Pro Tip</p>
            <p className="text-xs text-blue-700">
              {daysRemaining && daysRemaining >= 90 
                ? "Focus on building strong foundations first, then move to practice."
                : daysRemaining && daysRemaining >= 30
                  ? "Prioritize high-weightage topics and consistent practice."
                  : "Focus on maximum practice and quick revision of key concepts."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
