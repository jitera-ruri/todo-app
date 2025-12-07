export type Priority = 'high' | 'medium' | 'low'

export interface Profile {
  id: string
  email: string
  notification_time: string
  notification_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  sort_order: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  category_id: string | null
  title: string
  memo: string | null
  priority: Priority
  is_completed: boolean
  task_date: string
  sort_order: number
  routine_id: string | null
  created_at: string
  updated_at: string
  category?: Category
}

export interface TaskFormData {
  title: string
  memo?: string
  priority: Priority
  category_id?: string
  task_date: string
}

export interface Routine {
  id: string
  user_id: string
  category_id: string | null
  title: string
  memo: string | null
  has_time: boolean
  time: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface RoutineFormData {
  title: string
  memo?: string
  category_id?: string  // undefined を許可（空文字列ではなく）
  has_time: boolean
  time?: string
}


export const PRIORITY_CONFIG = {
  high: {
    label: '高',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    borderColor: 'border-red-500',
  },
  medium: {
    label: '中',
    color: 'bg-amber-500',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500',
  },
  low: {
    label: '低',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    borderColor: 'border-green-500',
  },
} as const

export const DEFAULT_CATEGORIES = [
  '仕事',
  'プライベート',
  '買い物',
  '健康・運動',
  '勉強',
  'その他',
] as const
