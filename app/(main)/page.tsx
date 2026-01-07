'use client'

import { useState, useEffect } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskInput } from '@/components/tasks/TaskInput'
import { TaskEditDialog } from '@/components/tasks/TaskEditDialog'
import { useTasks } from '@/lib/hooks/useTasks'
import { useRoutines } from '@/lib/hooks/useRoutines'
import { Task, UpdateTaskInput } from '@/types'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const supabase = createClient()
  
  const { tasks, loading, refetch, createTask, updateTask, deleteTask, toggleComplete, reorderTasks, carryOverIncompleteTasks } = useTasks(selectedDate)
  const { generateRoutineTasks } = useRoutines()

  // 日付変更時にルーティンタスクを生成
  useEffect(() => {
    const checkAndGenerateRoutines = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 未完了タスクを今日に繰り越し（今日の日付を見ている場合のみ）
      const today = format(new Date(), 'yyyy-MM-dd')
      if (selectedDate === today) {
        const carriedOver = await carryOverIncompleteTasks()
        if (carriedOver > 0) {
          console.log(`${carriedOver}件のタスクを繰り越しました`)
        }
      }

      // 今日の日付でルーティンタスクを生成
      await generateRoutineTasks(selectedDate)
      refetch()
    }
    
    checkAndGenerateRoutines()
  }, [selectedDate, generateRoutineTasks, carryOverIncompleteTasks, supabase, refetch])

  const goToPreviousDay = () => {
    setSelectedDate(prev => format(subDays(new Date(prev), 1), 'yyyy-MM-dd'))
  }

  const goToNextDay = () => {
    setSelectedDate(prev => format(addDays(new Date(prev), 1), 'yyyy-MM-dd'))
  }

  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const handleCreateTask = async (title: string) => {
    await createTask({
      title,
      task_date: selectedDate,
    })
  }

  const handleToggleComplete = async (id: string) => {
    await toggleComplete(id)
  }

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleUpdateTask = async (id: string, input: UpdateTaskInput) => {
    await updateTask(id, input)
    setEditingTask(null)
  }

  const handleReorderTasks = async (reorderedTasks: Task[]) => {
    await reorderTasks(reorderedTasks)
  }

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd')
  const displayDate = new Date(selectedDate)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousDay}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center min-w-[140px]">
                <div className="text-lg font-semibold">
                  {format(displayDate, 'M月d日', { locale: ja })}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    ({format(displayDate, 'E', { locale: ja })})
                  </span>
                </div>
                {isToday && (
                  <div className="text-xs text-blue-600 font-medium">今日</div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextDay}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/search">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Search className="h-4 w-4" />
                </Button>
              </Link>
              {!isToday && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  今日
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* タスク入力 */}
        <div className="mb-6">
          <TaskInput onSubmit={handleCreateTask} />
        </div>

        {/* タスクリスト */}
        <TaskList
          tasks={tasks}
          loading={loading}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTask}
          onEdit={handleEditTask}
          onReorder={handleReorderTasks}
        />
      </main>

      {/* 編集ダイアログ */}
      {editingTask && (
        <TaskEditDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onSave={handleUpdateTask}
        />
      )}
    </div>
  )
}
