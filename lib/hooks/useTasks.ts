'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, CreateTaskInput, UpdateTaskInput } from '@/types'

// 優先度の重み付け（高→中→低の順）
const priorityOrder: Record<string, number> = {
  high: 1,
  medium: 2,
  low: 3,
}

// タスクを優先度順にソートする関数
// 1. 未完了タスクが上、完了済みタスクが下
// 2. 同じ完了状態内では優先度順（高→ルーティン(高→中→低)→中→低）
// 3. 同じ優先度内では作成日時順（古い順）
export const sortTasksByPriority = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    // 1. 完了状態でソート（未完了が上）
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1
    }
    
    // 2. 優先度でソート（ルーティンタスクは高と中の間）
    const getPriorityValue = (task: Task): number => {
      const basePriority = priorityOrder[task.priority] ?? 999
      
      if (task.routine_id) {
        // ルーティンタスクは高と中の間に配置
        // 高(1) → ルーティン高(1.1) → ルーティン中(1.2) → ルーティン低(1.3) → 中(2) → 低(3)
        return 1 + basePriority * 0.1
      }
      
      return basePriority
    }
    
    const priorityA = getPriorityValue(a)
    const priorityB = getPriorityValue(b)
    const priorityDiff = priorityA - priorityB
    if (priorityDiff !== 0) return priorityDiff
    
    // 3. 作成日時でソート（古い順）
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
        .eq('task_date', date)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // 優先度順にソート（完了済みは下に）
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

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...input,
          user_id: user.id,
          sort_order: 0,
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
  }, [supabase])

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
    // 優先度順を維持
    const sortedByPriority = sortTasksByPriority(reorderedTasks)
    setTasks(sortedByPriority)
  }, [])

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

// 週間ビュー用のhook
export function useWeekTasks() {
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchWeekTasks = useCallback(async (dates: Date[]) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const dateStrings = dates.map(d => d.toISOString().split('T')[0])
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .in('task_date', dateStrings)
        .order('created_at', { ascending: true })

      if (error) throw error

      // 日付ごとにグループ化し、優先度順にソート
      const grouped: Record<string, Task[]> = {}
      for (const dateStr of dateStrings) {
        const tasksForDate = (data || []).filter(t => t.task_date === dateStr)
        grouped[dateStr] = sortTasksByPriority(tasksForDate)
      }
      setTasksByDate(grouped)
    } catch (err) {
      console.error('週間タスクの取得に失敗しました:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const updateTaskInWeek = useCallback((updatedTask: Task) => {
    setTasksByDate(prev => {
      const newState = { ...prev }
      for (const date of Object.keys(newState)) {
        newState[date] = sortTasksByPriority(
          newState[date].map(t => t.id === updatedTask.id ? updatedTask : t)
        )
      }
      return newState
    })
  }, [])

  const removeTaskFromWeek = useCallback((taskId: string) => {
    setTasksByDate(prev => {
      const newState = { ...prev }
      for (const date of Object.keys(newState)) {
        newState[date] = newState[date].filter(t => t.id !== taskId)
      }
      return newState
    })
  }, [])

  return {
    tasksByDate,
    loading,
    fetchWeekTasks,
    updateTaskInWeek,
    removeTaskFromWeek,
  }
}
