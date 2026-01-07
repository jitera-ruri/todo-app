// Priority type
export type Priority = 'high' | 'medium' | 'low'

export const PRIORITY_CONFIG = {
  high: { label: '高', color: 'red' },
  medium: { label: '中', color: 'amber' },
  low: { label: '低', color: 'green' },
} as const

// Category type
export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

// Task type
export interface Task {
  id: string
  user_id: string
  category_id: string | null
  routine_id: string | null
  title: string
  memo: string | null
  priority: Priority
  is_completed: boolean
  task_date: string
  sort_order: number
  created_at: string
  updated_at: string
  category?: Category
}

// TaskFormData type (フォーム用)
export interface TaskFormData {
  title: string
  memo?: string
  priority: Priority
  category_id?: string
  task_date: string
}

// CreateTaskInput type (タスク作成用)
export interface CreateTaskInput {
  title: string
  memo?: string | null
  priority?: Priority
  category_id?: string | null
  task_date: string
  routine_id?: string | null
}

// UpdateTaskInput type (タスク更新用)
export interface UpdateTaskInput {
  title?: string
  memo?: string | null
  priority?: Priority
  category_id?: string | null
  task_date?: string
  is_completed?: boolean
  sort_order?: number
}

// Routine type (DBスキーマに合わせた定義)
export interface Routine {
  id: string
  user_id: string
  category_id: string | null
  title: string
  memo: string | null
  priority: Priority
  has_time: boolean
  time: string | null
  days_of_week: number[]
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category
}

// RoutineFormData type (useRoutines.tsの実装に合わせた定義)
export interface RoutineFormData {
  title: string
  memo?: string
  priority: Priority
  category_id?: string
  has_time: boolean
  time?: string
  days_of_week?: number[]
}

// Profile type
export interface Profile {
  id: string
  email: string
  notification_time: string | null
  created_at: string
  updated_at: string
}

// ========================================
// WishList 関連の型定義
// ========================================

// WishList type (やりたいことリスト/タブ)
export interface WishList {
  id: string
  user_id: string
  title: string
  is_default: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// WishItem type (ウィッシュリストのアイテム)
export interface WishItem {
  id: string
  wish_list_id: string
  user_id: string
  title: string
  reason: string | null
  is_completed: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// CreateWishListInput type (リスト作成用)
export interface CreateWishListInput {
  title: string
}

// UpdateWishListInput type (リスト更新用)
export interface UpdateWishListInput {
  title?: string
  sort_order?: number
}

// CreateWishItemInput type (アイテム作成用)
export interface CreateWishItemInput {
  wish_list_id: string
  title: string
  reason?: string | null
}

// UpdateWishItemInput type (アイテム更新用)
export interface UpdateWishItemInput {
  title?: string
  reason?: string | null
  is_completed?: boolean
  sort_order?: number
}
