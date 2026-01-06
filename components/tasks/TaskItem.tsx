'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreHorizontal, Pencil, Trash2, ArrowRight, Check, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { cn } from '@/lib/utils'
import type { Task } from '@/types'
import { PRIORITY_CONFIG } from '@/types'

interface TaskItemProps {
  task: Task
  onToggleComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onMoveToTomorrow: (id: string) => void
  isDragging?: boolean
}

export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onMoveToTomorrow,
  isDragging = false,
}: TaskItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityConfig = PRIORITY_CONFIG[task.priority]

  // カテゴリの色を取得（なければデフォルト色）
  const categoryColor = task.category?.color || '#334155'

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex items-center gap-3 p-4 border-b border-slate-100 last:border-b-0 transition-all bg-white',
          isDragging && 'opacity-50',
          task.is_completed && 'bg-slate-50'
        )}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none text-slate-300 hover:text-slate-400 transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Custom Checkbox */}
        <button
          onClick={() => onToggleComplete(task.id)}
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

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Routine Icon */}
            {task.routine_id && (
              <span className="inline-flex" title="ルーティンタスク">
                <Repeat className="h-4 w-4 text-blue-500 flex-shrink-0" />
              </span>
            )}
            
            {/* タスクタイトル - カテゴリ色を適用 */}
            <span
              className={cn(
                'font-medium transition-all',
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
              {priorityConfig.label}
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

          {/* Memo */}
          {task.memo && (
            <p
              className={cn(
                'mt-1 text-sm truncate',
                task.is_completed ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              {task.memo}
            </p>
          )}
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" />
              編集
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMoveToTomorrow(task.id)} className="cursor-pointer">
              <ArrowRight className="mr-2 h-4 w-4" />
              明日に移動
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>タスクを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{task.title}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(task.id)}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
