'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Check, Repeat, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useCategories } from '@/lib/hooks/useCategories'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'
import { PRIORITY_CONFIG } from '@/types'

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { categories } = useCategories()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const searchTasks = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('tasks')
      .select(`
        *,
        category:categories(*)
      `)
      .order('task_date', { ascending: false })

    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,memo.ilike.%${searchQuery}%`)
    }

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory)
    }

    if (selectedPriority !== 'all') {
      query = query.eq('priority', selectedPriority)
    }

    if (selectedStatus === 'completed') {
      query = query.eq('is_completed', true)
    } else if (selectedStatus === 'incomplete') {
      query = query.eq('is_completed', false)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error('Error searching tasks:', error)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }, [supabase, searchQuery, selectedCategory, selectedPriority, selectedStatus])

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchTasks()
    }, 300)

    return () => clearTimeout(debounce)
  }, [searchTasks])

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

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedPriority('all')
    setSelectedStatus('all')
  }

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedPriority !== 'all' || selectedStatus !== 'all'

  // フィルター用に選択中のカテゴリを取得
  const filterCategory = categories.find(c => c.id === selectedCategory)

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="タスクを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-white border-slate-200"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="カテゴリ">
                  {selectedCategory === 'all' ? (
                    '全カテゴリ'
                  ) : filterCategory ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: filterCategory.color }}
                      />
                      <span style={{ color: filterCategory.color }}>
                        {filterCategory.name}
                      </span>
                    </span>
                  ) : (
                    '全カテゴリ'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">全カテゴリ</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span style={{ color: category.color }}>
                        {category.name}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="優先度" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">全優先度</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">全ステータス</SelectItem>
                <SelectItem value="incomplete">未完了</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-10 rounded-xl"
              >
                <X className="h-4 w-4 mr-1" />
                クリア
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <span className="text-sm text-slate-600">
            {loading ? '検索中...' : `${tasks.length}件のタスク`}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {tasks.length === 0 && !loading ? (
            <div className="p-8 text-center text-slate-400">
              タスクが見つかりませんでした
            </div>
          ) : (
            tasks.map((task) => {
              // カテゴリの色を取得
              const categoryColor = task.category?.color || '#334155'
              
              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 p-4 transition-all',
                    task.is_completed && 'bg-slate-50'
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(task.id)}
                    className={cn(
                      'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0',
                      task.is_completed
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-500 border-transparent'
                        : 'border-slate-300 hover:border-blue-400'
                    )}
                  >
                    {task.is_completed && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.routine_id && (
                        <Repeat className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                      {/* タスクタイトル - カテゴリ色を適用 */}
                      <span
                        className={cn(
                          'font-medium',
                          task.is_completed && 'line-through opacity-60'
                        )}
                        style={{
                          color: task.is_completed ? '#94a3b8' : categoryColor
                        }}
                      >
                        {task.title}
                      </span>

                      {/* Priority Badge */}
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-semibold rounded-md',
                          task.priority === 'high' && 'bg-red-100 text-red-700',
                          task.priority === 'medium' && 'bg-amber-100 text-amber-700',
                          task.priority === 'low' && 'bg-green-100 text-green-700',
                        )}
                      >
                        {PRIORITY_CONFIG[task.priority].label}
                      </span>

                      {/* Category Badge */}
                      {task.category && (
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-md"
                          style={{
                            backgroundColor: `${task.category.color}20`,
                            color: task.category.color
                          }}
                        >
                          {task.category.name}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="mt-1 text-xs text-slate-400">
                      {task.task_date}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
