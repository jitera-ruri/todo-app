'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Check, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

export default function WeekPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(today.setDate(diff))
  })
  const [mounted, setMounted] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const getWeekDates = useCallback(() => {
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [currentWeekStart])

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const weekDates = getWeekDates()
    const startDate = formatDateKey(weekDates[0])
    const endDate = formatDateKey(weekDates[6])

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        category:categories(*)
      `)
      .gte('task_date', startDate)
      .lte('task_date', endDate)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }, [supabase, getWeekDates])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const { error } = await supabase
      .from('tasks')
      .update({ 
        is_completed: !task.is_completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
      ))
    }
  }

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() - 7)
    setCurrentWeekStart(newStart)
  }

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + 7)
    setCurrentWeekStart(newStart)
  }

  const goToCurrentWeek = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    setCurrentWeekStart(new Date(today.setDate(diff)))
  }

  const weekDates = getWeekDates()
  const today = new Date().toISOString().split('T')[0]

  const getTasksForDate = (date: Date) => {
    const dateKey = formatDateKey(date)
    return tasks.filter(task => task.task_date === dateKey)
  }

  const dayNames = ['月', '火', '水', '木', '金', '土', '日']

  const formatMonthYear = () => {
    const start = weekDates[0]
    const end = weekDates[6]
    if (start.getMonth() === end.getMonth()) {
      return `${start.getFullYear()}年${start.getMonth() + 1}月`
    }
    return `${start.getFullYear()}年${start.getMonth() + 1}月 - ${end.getMonth() + 1}月`
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{formatMonthYear()}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToCurrentWeek}
            className="text-sm"
          >
            今週
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousWeek}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, index) => {
          const dateKey = formatDateKey(date)
          const isToday = dateKey === today
          const dayTasks = getTasksForDate(date)
          const completedCount = dayTasks.filter(t => t.is_completed).length
          const totalCount = dayTasks.length

          return (
            <div
              key={dateKey}
              className={cn(
                'bg-white rounded-xl border overflow-hidden min-h-[200px] flex flex-col',
                isToday ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'
              )}
            >
              {/* Day Header */}
              <div
                className={cn(
                  'px-3 py-2 text-center border-b',
                  isToday ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200',
                  (index === 5 || index === 6) && 'text-red-500'
                )}
              >
                <div className="text-xs font-medium text-slate-500">
                  {dayNames[index]}
                </div>
                <div
                  className={cn(
                    'text-lg font-bold',
                    isToday ? 'text-blue-600' : 'text-slate-900'
                  )}
                >
                  {date.getDate()}
                </div>
                {totalCount > 0 && (
                  <div className="text-xs text-slate-400">
                    {completedCount}/{totalCount}
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="flex-1 p-2 space-y-1 overflow-y-auto">
                {loading ? (
                  <div className="text-xs text-slate-400 text-center py-4">
                    読込中...
                  </div>
                ) : dayTasks.length === 0 ? (
                  <div className="text-xs text-slate-300 text-center py-4">
                    タスクなし
                  </div>
                ) : (
                  dayTasks.map((task) => {
                    // カテゴリの色を取得
                    const categoryColor = task.category?.color || '#334155'
                    
                    return (
                      <button
                        key={task.id}
                        onClick={() => handleToggleComplete(task.id)}
                        className={cn(
                          'w-full text-left p-2 rounded-lg text-xs transition-all',
                          task.is_completed
                            ? 'bg-slate-100'
                            : 'bg-slate-50 hover:bg-slate-100'
                        )}
                      >
                        <div className="flex items-start gap-1.5">
                          <div
                            className={cn(
                              'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center mt-0.5',
                              task.is_completed
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-slate-300'
                            )}
                          >
                            {task.is_completed && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              {task.routine_id && (
                                <Repeat className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              )}
                              {/* タスクタイトル - カテゴリ色を適用 */}
                              <span
                                className={cn(
                                  'truncate font-medium',
                                  task.is_completed && 'line-through opacity-60'
                                )}
                                style={{
                                  color: task.is_completed ? '#94a3b8' : categoryColor
                                }}
                              >
                                {task.title}
                              </span>
                            </div>
                            {/* Category Badge */}
                            {task.category && (
                              <span
                                className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded"
                                style={{
                                  backgroundColor: `${task.category.color}20`,
                                  color: task.category.color,
                                }}
                              >
                                {task.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
