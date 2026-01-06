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
import type { Routine, Category, Priority } from '@/types'
import { PRIORITY_CONFIG } from '@/types'
import { cn } from '@/lib/utils'

interface RoutineFormData {
  title: string
  memo?: string
  priority: Priority
  category_id?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  day_of_week?: number
  day_of_month?: number
}

interface RoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RoutineFormData) => Promise<void>
  categories: Category[]
  initialData?: Routine | null
}

export function RoutineDialog({
  open,
  onOpenChange,
  onSubmit,
  categories,
  initialData,
}: RoutineDialogProps) {
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [categoryId, setCategoryId] = useState<string>('none')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [dayOfWeek, setDayOfWeek] = useState<number>(1)
  const [dayOfMonth, setDayOfMonth] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 選択中のカテゴリを取得
  const selectedCategory = categories.find(c => c.id === categoryId)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setMemo(initialData.memo || '')
      setPriority(initialData.priority)
      setCategoryId(initialData.category_id || 'none')
      setFrequency(initialData.frequency)
      setDayOfWeek(initialData.day_of_week ?? 1)
      setDayOfMonth(initialData.day_of_month ?? 1)
    } else {
      setTitle('')
      setMemo('')
      setPriority('medium')
      setCategoryId('none')
      setFrequency('daily')
      setDayOfWeek(1)
      setDayOfMonth(1)
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    await onSubmit({
      title: title.trim(),
      memo: memo.trim() || undefined,
      priority,
      category_id: categoryId === 'none' ? undefined : categoryId,
      frequency,
      day_of_week: frequency === 'weekly' ? dayOfWeek : undefined,
      day_of_month: frequency === 'monthly' ? dayOfMonth : undefined,
    })
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const weekDays = [
    { value: 1, label: '月曜日' },
    { value: 2, label: '火曜日' },
    { value: 3, label: '水曜日' },
    { value: 4, label: '木曜日' },
    { value: 5, label: '金曜日' },
    { value: 6, label: '土曜日' },
    { value: 0, label: '日曜日' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="px-6 pt-6 pb-4 bg-slate-50 border-b border-slate-200">
          <DialogTitle className="text-xl text-slate-900">
            {initialData ? 'ルーティンを編集' : '新しいルーティン'}
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
              placeholder="例: 朝のストレッチ"
              required
              className="h-12 rounded-xl bg-white border-slate-200"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-slate-700">繰り返し</Label>
            <div className="flex gap-2">
              {[
                { value: 'daily', label: '毎日' },
                { value: 'weekly', label: '毎週' },
                { value: 'monthly', label: '毎月' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFrequency(option.value as typeof frequency)}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all border-2',
                    frequency === option.value
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Day of Week (for weekly) */}
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label className="text-slate-700">曜日</Label>
              <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {weekDays.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {frequency === 'monthly' && (
            <div className="space-y-2">
              <Label className="text-slate-700">日付</Label>
              <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(parseInt(v))}>
                <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-60">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}日
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-slate-700">カテゴリ</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="選択...">
                  {categoryId === 'none' ? (
                    'なし'
                  ) : selectedCategory ? (
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: selectedCategory.color }}
                      />
                      <span style={{ color: selectedCategory.color }}>
                        {selectedCategory.name}
                      </span>
                    </span>
                  ) : (
                    '選択...'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="none">なし</SelectItem>
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
