'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

// カラーパレット定義
export const CATEGORY_COLORS = [
  { value: '#6B7280', label: 'グレー' },
  { value: '#EF4444', label: 'レッド' },
  { value: '#F97316', label: 'オレンジ' },
  { value: '#F59E0B', label: 'アンバー' },
  { value: '#EAB308', label: 'イエロー' },
  { value: '#84CC16', label: 'ライム' },
  { value: '#22C55E', label: 'グリーン' },
  { value: '#14B8A6', label: 'ティール' },
  { value: '#06B6D4', label: 'シアン' },
  { value: '#3B82F6', label: 'ブルー' },
  { value: '#6366F1', label: 'インディゴ' },
  { value: '#8B5CF6', label: 'バイオレット' },
  { value: '#A855F7', label: 'パープル' },
  { value: '#EC4899', label: 'ピンク' },
] as const

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const addCategory = async (name: string, color: string = '#6B7280') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const maxOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.sort_order)) + 1 
      : 0

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        color,
        user_id: user.id,
        sort_order: maxOrder,
        is_default: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding category:', error)
      return null
    }

    setCategories(prev => [...prev, data])
    return data
  }

  const updateCategory = async (id: string, name: string, color?: string) => {
    const updateData: { name: string; color?: string; updated_at: string } = {
      name,
      updated_at: new Date().toISOString(),
    }
    
    if (color) {
      updateData.color = color
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return null
    }

    setCategories(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return false
    }

    setCategories(prev => prev.filter(c => c.id !== id))
    return true
  }

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  }
}
