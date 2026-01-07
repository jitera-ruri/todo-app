'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { TaskItem } from '@/components/tasks/TaskItem'
import { TaskForm } from '@/components/tasks/TaskForm'
import { useTasks } from '@/lib/hooks/useTasks'
import { useCategories } from '@/lib/hooks/useCategories'
import { useRoutines } from '@/lib/hooks/useRoutines'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskFormData } from '@/types'

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  const { tasks, loading, refetch, createTask, updateTask, deleteTask, toggleComplete, reorderTasks, carryOverIncompleteTasks } = useTasks(selectedDate)
  const { categories } = useCategories()
  const { generateRoutineTasks } = useRoutines()
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ルーティンタスクの自動生成と未完了タスクの繰り越し
  useEffect(() => {
    const checkAndGenerateRoutines = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 未完了タスクを今日に繰り越し（今日の日付を見ている場合のみ）
      const today = new Date().toISOString().split('T')[0]
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const weekday = weekdays[date.getDay()]
    return `${month}月${day}日(${weekday})`
  }

  const goToPreviousDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const goToNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id)
      const newIndex = tasks.findIndex((task) => task.id === over.id)
      const newTasks = arrayMove(tasks, oldIndex, newIndex)
      await reorderTasks(newTasks)
    }
  }

  const handleCreateTask = async (data: TaskFormData) => {
    await createTask({
      title: data.title,
      memo: data.memo,
      priority: data.priority,
      category_id: data.category_id,
      task_date: data.task_date,
    })
    setIsFormOpen(false)
  }

  const handleUpdateTask = async (data: TaskFormData) => {
    if (!editingTask) return
    await updateTask(editingTask.id, {
      title: data.title,
      memo: data.memo,
      priority: data.priority,
      category_id: data.category_id,
      task_date: data.task_date,
    })
    setEditingTask(null)
  }

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id)
  }

  const handleToggleComplete = async (id: string) => {
    await toggleComplete(id)
  }

  const handleMoveToTomorrow = async (id: string) => {
    const tomorrow = new Date(selectedDate)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    await updateTask(id, { task_date: tomorrowStr })
    refetch()
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousDay}
          className="rounded-xl"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="text-center">
          <h1 
            className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={goToToday}
          >
            {formatDate(selectedDate)}
          </h1>
          {!isToday && (
            <button 
              onClick={goToToday}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              今日に戻る
            </button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          className="rounded-xl"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            読み込み中...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            タスクがありません
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onEdit={setEditingTask}
                  onDelete={handleDeleteTask}
                  onMoveToTomorrow={handleMoveToTomorrow}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Task Button */}
      <Button
        onClick={() => setIsFormOpen(true)}
        className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25"
      >
        <Plus className="h-5 w-5 mr-2" />
        タスクを追加
      </Button>

      {/* Task Form Dialog */}
      <TaskForm
        open={isFormOpen || !!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false)
            setEditingTask(null)
          }
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        categories={categories}
        initialData={editingTask}
        defaultDate={selectedDate}
      />
    </div>
  )
}
