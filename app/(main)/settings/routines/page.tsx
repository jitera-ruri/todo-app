'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { RoutineDialog } from '@/components/routines/RoutineDialog'
import { useCategories } from '@/lib/hooks/useCategories'
import { useRoutines } from '@/lib/hooks/useRoutines'
import { cn } from '@/lib/utils'
import type { Routine, Priority } from '@/types'
import { PRIORITY_CONFIG } from '@/types'

interface RoutineFormData {
  title: string
  memo?: string
  priority: Priority
  category_id?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  day_of_week?: number
  day_of_month?: number
}

export default function RoutinesSettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null)
  const [mounted, setMounted] = useState(false)

  const { categories } = useCategories()
  const { routines, loading, addRoutine, updateRoutine, deleteRoutine } = useRoutines()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAddRoutine = async (data: RoutineFormData) => {
    const result = await addRoutine(data)
    if (result) {
      toast({
        title: '追加完了',
        description: 'ルーティンを追加しました。',
      })
    } else {
      toast({
        title: 'エラー',
        description: 'ルーティンの追加に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  const handleEditRoutine = async (data: RoutineFormData) => {
    if (!editingRoutine) return

    const result = await updateRoutine(editingRoutine.id, data)
    if (result) {
      setEditingRoutine(null)
      toast({
        title: '更新完了',
        description: 'ルーティンを更新しました。',
      })
    } else {
      toast({
        title: 'エラー',
        description: 'ルーティンの更新に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteRoutine = async () => {
    if (!routineToDelete) return

    const result = await deleteRoutine(routineToDelete.id)
    if (result) {
      setRoutineToDelete(null)
      setDeleteDialogOpen(false)
      toast({
        title: '削除完了',
        description: 'ルーティンを削除しました。',
      })
    } else {
      toast({
        title: 'エラー',
        description: 'ルーティンの削除に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  const getFrequencyLabel = (routine: Routine) => {
    switch (routine.frequency) {
      case 'daily':
        return '毎日'
      case 'weekly':
        const days = ['日', '月', '火', '水', '木', '金', '土']
        return `毎週${days[routine.day_of_week ?? 0]}曜日`
      case 'monthly':
        return `毎月${routine.day_of_month}日`
      default:
        return ''
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">ルーティン一覧</h2>
            <p className="text-sm text-slate-500">繰り返しタスクを管理できます</p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            追加
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400">読み込み中...</div>
          ) : routines.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              ルーティンがありません
            </div>
          ) : (
            routines.map((routine) => (
              <div
                key={routine.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Repeat className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 truncate">
                        {routine.title}
                      </span>
                      {/* Priority Badge */}
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-semibold rounded-md',
                          routine.priority === 'high' && 'bg-red-100 text-red-700',
                          routine.priority === 'medium' && 'bg-amber-100 text-amber-700',
                          routine.priority === 'low' && 'bg-green-100 text-green-700',
                        )}
                      >
                        {PRIORITY_CONFIG[routine.priority].label}
                      </span>
                      {/* Category Badge - カテゴリ色を動的に適用 */}
                      {routine.category && (
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-md"
                          style={{
                            backgroundColor: `${routine.category.color}20`,
                            color: routine.category.color
                          }}
                        >
                          {routine.category.name}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {getFrequencyLabel(routine)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingRoutine(routine)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setRoutineToDelete(routine)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Routine Dialog */}
      <RoutineDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingRoutine(null)
        }}
        onSubmit={editingRoutine ? handleEditRoutine : handleAddRoutine}
        categories={categories}
        initialData={editingRoutine}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>ルーティンを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{routineToDelete?.title}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoutine}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
