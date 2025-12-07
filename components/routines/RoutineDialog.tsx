'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
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
import { useToast } from '@/components/ui/use-toast'
import { useRoutines } from '@/lib/hooks/useRoutines'
import type { Routine, Category, RoutineFormData } from '@/types'

interface RoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routine: Routine | null
  categories: Category[]
}

export function RoutineDialog({ open, onOpenChange, routine, categories }: RoutineDialogProps) {
  const [formData, setFormData] = useState<RoutineFormData>({
    title: '',
    memo: '',
    category_id: undefined,
    has_time: false,
    time: '09:00',
  })
  const [saving, setSaving] = useState(false)

  const { addRoutine, updateRoutine } = useRoutines()
  const { toast } = useToast()

  useEffect(() => {
    if (routine) {
      setFormData({
        title: routine.title,
        memo: routine.memo || '',
        category_id: routine.category_id || undefined,
        has_time: routine.has_time,
        time: routine.time ? routine.time.slice(0, 5) : '09:00',
      })
    } else {
      setFormData({
        title: '',
        memo: '',
        category_id: undefined,
        has_time: false,
        time: '09:00',
      })
    }
  }, [routine, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: 'エラー',
        description: 'タイトルを入力してください。',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    const result = routine
      ? await updateRoutine(routine.id, formData)
      : await addRoutine(formData)

    if (result) {
      toast({
        title: routine ? '更新完了' : '追加完了',
        description: routine ? 'ルーティンを更新しました。' : 'ルーティンを追加しました。',
      })
      onOpenChange(false)
    } else {
      toast({
        title: 'エラー',
        description: 'ルーティンの保存に失敗しました。',
        variant: 'destructive',
      })
    }

    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {routine ? 'ルーティンを編集' : 'ルーティンを追加'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700">
              タイトル <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例: 朝の運動"
              className="bg-white border-slate-200"
              autoFocus
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-slate-700">カテゴリ</Label>
            <Select
              value={formData.category_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? undefined : value })}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Setting */}
          <div className="space-y-2">
            <Label className="text-slate-700">時刻設定</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!formData.has_time}
                  onChange={() => setFormData({ ...formData, has_time: false })}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-sm text-slate-700">終日</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.has_time}
                  onChange={() => setFormData({ ...formData, has_time: true })}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-sm text-slate-700">時刻指定</span>
              </label>
            </div>
            {formData.has_time && (
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-32 bg-white border-slate-200"
              />
            )}
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label htmlFor="memo" className="text-slate-700">メモ</Label>
            <Textarea
              id="memo"
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              placeholder="詳細な説明を入力..."
              className="bg-white border-slate-200 min-h-[100px] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white"
            >
              {saving ? '保存中...' : routine ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
