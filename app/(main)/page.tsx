'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { useTasks } from '@/lib/hooks/useTasks'
import { useCategories } from '@/lib/hooks/useCategories'
import { useRoutines } from '@/lib/hooks/useRoutines'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskFormData } from '@/types'

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask, toggleComplete, reorderTasks } = useTasks()
  const { categories } = useCategories()
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
        .lt('task_date', today)
        .is('routine_id', null)  // ルーティンタスクを除外

      if (error) throw error

      if (incompleteTasks && incompleteTasks.length > 0) {
        // 今日の日付に更新
        for (const task of incompleteTasks) {
          await supabase
            .from('tasks')
            .update({ task_date: today, updated_at: new Date().toISOString() })
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

  const handleCreateTask = async (formData: TaskFormData) => {
    await createTask({
      title: formData.title,
      memo: formData.memo,
      category_id: formData.category_id,
      priority: formData.priority,
      task_date: dateString,
    })
    setIsFormOpen(false)
  }

  const handleUpdateTask = async (formData: TaskFormData) => {
    if (!editingTask) return
    await updateTask(editingTask.id, {
      title: formData.title,
      memo: formData.memo,
      category_id: formData.category_id,
      priority: formData.priority,
    })
    setEditingTask(null)
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

  const handleMoveToTomorrow = async (id: string) => {
    const tomorrow = format(addDays(new Date(dateString), 1), 'yyyy-MM-dd')
    await updateTask(id, { task_date: tomorrow })
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
          <h1 className="text-lg font-semibold">
            {format(selectedDate, 'M月d日(E)', { locale: ja })}
          </h1>
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
        onMoveToTomorrow={handleMoveToTomorrow}
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
        categories={categories}
        defaultDate={dateString}
      />

      {/* タスク編集フォーム */}
      <TaskForm
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSubmit={handleUpdateTask}
        categories={categories}
        initialData={editingTask}
        defaultDate={dateString}
      />
    </div>
  )
}
