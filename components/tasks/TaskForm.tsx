'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Task, TaskFormData, Category, Priority } from '@/types'
import { PRIORITY_CONFIG } from '@/types'
import { cn } from '@/lib/utils'

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TaskFormData) => Promise<void>
  categories: Category[]
  initialData?: Task | null
  defaultDate: string
}

export function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  categories,
  initialData,
  defaultDate,
}: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [categoryId, setCategoryId] = useState<string>('none')
  const [taskDate, setTaskDate] = useState(defaultDate)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setMemo(initialData.memo || '')
      setPriority(initialData.priority)
      setCategoryId(initialData.category_id || 'none')
      setTaskDate(initialData.task_date)
    } else {
      setTitle('')
      setMemo('')
      setPriority('medium')
      setCategoryId('none')
      setTaskDate(defaultDate)
    }
  }, [initialData, defaultDate, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    await onSubmit({
      title: title.trim(),
      memo: memo.trim() || undefined,
      priority,
      category_id: categoryId === 'none' ? undefined : categoryId,
      task_date: taskDate,
    })
    setIsSubmitting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="px-6 pt-6 pb-4 bg-slate-50 border-b border-slate-200">
          <DialogTitle className="text-xl text-slate-900">
            {initialData ? 'タスクを編集' : '新しいタスク'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700">
              タスク名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: レポートを提出する"
              required
              className="h-12 rounded-xl bg-white border-slate-200"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-slate-700">優先度</Label>
            <div className="flex gap-2">
              {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG.high][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPriority(key)}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all border-2',
                    priority === key
                      ? key === 'high'
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : key === 'medium'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700">カテゴリ</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder="選択..." />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="none">なし</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-700">日付</Label>
              <Input
                id="date"
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                className="h-12 rounded-xl bg-white border-slate-200"
              />
            </div>
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label htmlFor="memo" className="text-slate-700">メモ</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="詳細やメモを入力（任意）"
              rows={3}
              className="rounded-xl resize-none bg-white border-slate-200"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              キャンセル
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !title.trim()}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
            >
              {initialData ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
