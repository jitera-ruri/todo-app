'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { useTasks } from '@/lib/hooks/useTasks'
import { useRoutines } from '@/lib/hooks/useRoutines'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask, toggleComplete, reorderTasks } = useTasks()
  const { generateRoutineTasks } = useRoutines()
  const supabase = createClient()

  const dateString = format(selectedDate, 'yyyy-MM-dd')
  const isToday = dateString === format(new Date(), 'yyyy-MM-dd')

  // 過去の未完了タスクを今日に繰り越す（ルーティンタスクは除外）
  const carryOverTasks = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 過去の未完了タスクを取得（ルーティンタスクは除外）
      const { data: incompleteTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .lt('date', today)
        .is('routine_id', null)  // ルーティンタスクを除外

      if (error) throw error

      if (incompleteTasks && incompleteTasks.length > 0) {
        // 今日の日付に更新
        for (const task of incompleteTasks) {
          await supabase
            .from('tasks')
            .update({ date: today })
            .eq('id', task.id)
        }
      }
    } catch (err) {
      console.error('タスクの繰り越しに失敗しました:', err)
    }
  }, [supabase])

  // 初回ロード時に繰り越し処理とルーティンタスク生成を実行
  useEffect(() => {
    const initialize = async () => {
      await carryOverTasks()
      await generateRoutineTasks(dateString)
      fetchTasks(dateString)
    }
    initialize()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 日付変更時にタスクを再取得
  useEffect(() => {
    const loadTasks = async () => {
      await generateRoutineTasks(dateString)
      fetchTasks(dateString)
    }
    loadTasks()
  }, [dateString, fetchTasks, generateRoutineTasks])

  const handlePrevDay = () => {
    setSelectedDate(prev => subDays(prev, 1))
  }

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1))
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setIsCalendarOpen(false)
    }
  }

  const handleCreateTask = async (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sort_order'>) => {
    await createTask({ ...data, date: dateString })
    setIsFormOpen(false)
  }

  const handleUpdateTask = async (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sort_order'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, data)
      setEditingTask(null)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id)
  }

  const handleToggleComplete = async (id: string) => {
    await toggleComplete(id)
  }

  const handleReorderTasks = async (reorderedTasks: Task[]) => {
    await reorderTasks(reorderedTasks)
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* 日付ナビゲーション */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="icon" onClick={handlePrevDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="text-lg font-semibold">
                {format(selectedDate, 'M月d日(E)', { locale: ja })}
                <Calendar className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {!isToday && (
            <Button variant="outline" size="sm" onClick={handleToday}>
              今日
            </Button>
          )}
        </div>

        <Button variant="outline" size="icon" onClick={handleNextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* タスク一覧 */}
      <TaskList
        tasks={tasks}
        loading={loading}
        onToggleComplete={handleToggleComplete}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onReorder={handleReorderTasks}
      />

      {/* タスク追加ボタン */}
      <Button
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
        onClick={() => setIsFormOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* タスク作成フォーム */}
      <TaskForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateTask}
      />

      {/* タスク編集フォーム */}
      <TaskForm
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSubmit={handleUpdateTask}
        defaultValues={editingTask || undefined}
        isEditing
      />
    </div>
  )
}
