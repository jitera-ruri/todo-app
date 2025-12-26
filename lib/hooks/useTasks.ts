'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, CreateTaskInput, UpdateTaskInput } from '@/types'

// 優先度の重み付け（高→中→低の順）
const priorityOrder: Record<string, number> = {
  high: 1,
  medium: 2,
  low: 3,
}

// タスクを優先度順にソートする関数
const sortTasksByPriority = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    const priorityA = priorityOrder[a.priority] ?? 999
    const priorityB = priorityOrder[b.priority] ?? 999
    const priorityDiff = priorityA - priorityB
    if (priorityDiff !== 0) return priorityDiff
    return a.sort_order - b.sort_order
  })
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTasks = useCallback(async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ユーザーが見つかりません')

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('sort_order', { ascending: true })

      if (error) throw error
      
      // 優先度順にソート
      const sortedTasks = sortTasksByPriority(data || [])
      setTasks(sortedTasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createTask = useCallback(async (input: CreateTaskInput) => {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ユーザーが見つかりません')

      // 同じ優先度のタスクの最大sort_orderを取得
      const samePriorityTasks = tasks.filter(t => t.priority === input.priority)
      const maxSortOrder = samePriorityTasks.length > 0
        ? Math.max(...samePriorityTasks.map(t => t.sort_order))
        : Math.max(...tasks.map(t => t.sort_order), -1)

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...input,
          user_id: user.id,
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single()

      if (error) throw error
      
      // 優先度順にソートして更新
      setTasks(prev => sortTasksByPriority([...prev, data]))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの作成に失敗しました')
      throw err
    }
  }, [supabase, tasks])

  const updateTask = useCallback(async (id: string, input: UpdateTaskInput) => {
    setError(null)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      // 優先度順にソートして更新
      setTasks(prev => sortTasksByPriority(prev.map(task => task.id === id ? data : task)))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの更新に失敗しました')
      throw err
    }
  }, [supabase])

  const deleteTask = useCallback(async (id: string) => {
    setError(null)
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTasks(prev => prev.filter(task => task.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスクの削除に失敗しました')
      throw err
    }
  }, [supabase])

  const toggleComplete = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    return updateTask(id, { is_completed: !task.is_completed })
  }, [tasks, updateTask])

  const reorderTasks = useCallback(async (reorderedTasks: Task[]) => {
    // 優先度順を維持しながらsort_orderを更新
    const sortedByPriority = sortTasksByPriority(reorderedTasks)
    setTasks(sortedByPriority)

    try {
      const updates = sortedByPriority.map((task, index) => ({
        id: task.id,
        sort_order: index,
      }))

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '並び替えに失敗しました')
    }
  }, [supabase])

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    reorderTasks,
  }
}
