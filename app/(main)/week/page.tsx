'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, addDays, startOfWeek, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { TaskForm } from '@/components/tasks/TaskForm'
import { createClient } from '@/lib/supabase/client'
import { useCategories } from '@/lib/hooks/useCategories'
import { useRoutines } from '@/lib/hooks/useRoutines'
import { cn } from '@/lib/utils'
import type { Task, TaskFormData } from '@/types'

// 優先度の重み付け（高→中→低の順）
const priorityOrder: Record<string, number> = {
  high: 1,
  medium: 2,
  low: 3,
}

// タスクを優先度順にソートする関数
const sortTasksByPriority = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1
    }
    const priorityA = priorityOrder[a.priority] ?? 999
    const priorityB = priorityOrder[b.priority] ?? 999
    const priorityDiff = priorityA - priorityB
    if (priorityDiff !== 0) return priorityDiff
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

const priorityLabels = {
  high: '高',
  medium: '中',
  low: '低',
}

export default function WeekPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({})
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  const { categories } = useCategories()
  const { generateRoutineTasks } = useRoutines()
  const supabase = createClient()

  // 週の日付を計算
  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

  // タスクを取得
  const fetchWeekTasks = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const startDate = format(weekDates[0], 'yyyy-MM-dd')
      const endDate = format(weekDates[6], 'yyyy-MM-dd')

      // 各日付のルーティンタスクを生成
      for (const date of weekDates) {
        const dateStr = format(date, 'yyyy-MM-dd')
        await generateRoutineTasks(dateStr)
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .gte('task_date', startDate)
        .lte('task_date', endDate)
        .order('created_at', { ascending: true })

      if (error) throw error

      const grouped: Record<string, Task[]> = {}
      for (const date of weekDates) {
        const dateStr = format(date, 'yyyy-MM-dd')
        const tasksForDate = (data || []).filter(t => t.task_date === dateStr)
        grouped[dateStr] = sortTasksByPriority(tasksForDate)
      }
      setTasksByDate(grouped)
    } catch (err) {
      console.error('週間タスクの取得に失敗しました:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, weekDates, generateRoutineTasks])

  useEffect(() => {
    fetchWeekTasks()
  }, [fetchWeekTasks])

  const handlePrevWeek = () => {
    setCurrentDate(prev => addDays(prev, -7))
  }

  const handleNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7))
  }

  const handleThisWeek = () => {
    setCurrentDate(new Date())
  }

  const handleToggleComplete = async (task: Task) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        is_completed: !task.is_completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id)
      .select('*, category:categories(*)')
      .single()

    if (!error && data) {
      setTasksByDate(prev => {
        const dateStr = data.task_date
        const newTasks = prev[dateStr]?.map(t => t.id === data.id ? data : t) || []
        return {
          ...prev,
          [dateStr]: sortTasksByPriority(newTasks)
        }
      })
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleUpdateTask = async (formData: TaskFormData) => {
    if (!editingTask) return

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...formData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingTask.id)
      .select('*, category:categories(*)')
      .single()

    if (!error && data) {
      setTasksByDate(prev => {
        const newState = { ...prev }
        for (const dateStr of Object.keys(newState)) {
          newState[dateStr] = newState[dateStr].filter(t => t.id !== editingTask.id)
        }
        const newDateStr = data.task_date
        if (newState[newDateStr]) {
          newState[newDateStr] = sortTasksByPriority([...newState[newDateStr], data])
        }
        return newState
      })
    }
    setEditingTask(null)
    setIsFormOpen(false)
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingTask(null)
    }
  }

  const weekStart = format(weekDates[0], 'M/d', { locale: ja })
  const weekEnd = format(weekDates[6], 'M/d', { locale: ja })

  return (
    <div className="container mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="icon" onClick={handlePrevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">
            {weekStart} - {weekEnd}
          </h1>
          <Button variant="outline" size="sm" onClick={handleThisWeek}>
            今週
          </Button>
        </div>

        <Button variant="outline" size="icon" onClick={handleNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 週間カレンダー */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDates.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const tasks = tasksByDate[dateStr] || []
            const isTodayDate = isToday(date)

            return (
              <Card 
                key={dateStr}
                className={cn(
                  'min-h-[200px]',
                  isTodayDate && 'ring-2 ring-primary'
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className={cn(
                    'text-sm font-medium',
                    isTodayDate && 'text-primary'
                  )}>
                    {format(date, 'M/d(E)', { locale: ja })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-xs text-gray-400">タスクなし</p>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-start gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                          task.is_completed && 'opacity-50'
                        )}
                        onClick={() => handleEditTask(task)}
                      >
                        <Checkbox
                          checked={task.is_completed}
                          onCheckedChange={() => handleToggleComplete(task)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm truncate',
                            task.is_completed && 'line-through text-gray-500'
                          )}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {/* 優先度を色付きドットで表示 */}
                            <span 
                              className={cn(
                                'inline-block w-2 h-2 rounded-full',
                                priorityColors[task.priority]
                              )}
                              title={`優先度: ${priorityLabels[task.priority]}`}
                            />
                            <span className="text-xs text-gray-500">
                              {priorityLabels[task.priority]}
                            </span>
                            {task.category && (
                              <span className="text-xs text-gray-400 ml-1">
                                | {task.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* タスク編集フォーム */}
      <TaskForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleUpdateTask}
        categories={categories}
        initialData={editingTask}
        defaultDate={editingTask?.task_date || format(new Date(), 'yyyy-MM-dd')}
      />
    </div>
  )
}
