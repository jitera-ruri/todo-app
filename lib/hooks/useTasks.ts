'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, CreateTaskInput, UpdateTaskInput } from '@/types'

// 優先度の重み付け（高→中→低の順）
const priorityOrder: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

// タスクをソートする関数
const sortTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    // 1. 完了状態でソート（未完了が先）
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1
    }
    // 2. 優先度でソート
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    // 3. sort_orderでソート
    return a.sort_order - b.sort_order
  })
}

export function useTasks(date: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('task_date', date)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
    } else {
      setTasks(sortTasks(data || []))
    }
    setLoading(false)
  }, [date, supabase])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = useCallback(async (input: CreateTaskInput): Promise<Task | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const maxSortOrder = tasks.length > 0 
      ? Math.max(...tasks.map(t => t.sort_order)) + 1 
      : 0

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: input.title,
        memo: input.memo || null,
        priority: input.priority || 'medium',
        category_id: input.category_id || null,
        task_date: input.task_date,
        routine_id: input.routine_id || null,
        sort_order: maxSortOrder,
        is_completed: false,
      })
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return null
    }

    setTasks(prev => sortTasks([...prev, data]))
    return data
  }, [supabase, tasks])

  const updateTask = useCallback(async (id: string, input: UpdateTaskInput): Promise<Task | null> => {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return null
    }

    setTasks(prev => sortTasks(prev.map(t => t.id === id ? data : t)))
    return data
  }, [supabase])

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      return false
    }

    setTasks(prev => prev.filter(t => t.id !== id))
    return true
  }, [supabase])

  const toggleComplete = useCallback(async (id: string): Promise<boolean> => {
    const task = tasks.find(t => t.id === id)
    if (!task) return false

    const { data, error } = await supabase
      .from('tasks')
      .update({
        is_completed: !task.is_completed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (error) {
      console.error('Error toggling task:', error)
      return false
    }

    setTasks(prev => sortTasks(prev.map(t => t.id === id ? data : t)))
    return true
  }, [supabase, tasks])

  const reorderTasks = useCallback(async (reorderedTasks: Task[]): Promise<boolean> => {
    // ローカル状態を即座に更新
    setTasks(reorderedTasks)

    // DBを更新
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      sort_order: index,
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('tasks')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)

      if (error) {
        console.error('Error reordering tasks:', error)
        // エラー時は再取得
        fetchTasks()
        return false
      }
    }

    return true
  }, [supabase, fetchTasks])

  const moveToDate = useCallback(async (id: string, newDate: string): Promise<boolean> => {
    const { error } = await supabase
      .from('tasks')
      .update({
        task_date: newDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error moving task:', error)
      return false
    }

    setTasks(prev => prev.filter(t => t.id !== id))
    return true
  }, [supabase])

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    reorderTasks,
    moveToDate,
    refetch: fetchTasks,
  }
}
