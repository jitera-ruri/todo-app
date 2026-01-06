'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, Pencil, Trash2, X, Check, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { useCategories, CATEGORY_COLORS } from '@/lib/hooks/useCategories'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile, Category } from '@/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notificationTime, setNotificationTime] = useState('10:00')
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setNotificationTime(data.notification_time || '10:00')
        setNotificationEnabled(data.notification_enabled ?? true)
      }
    }

    fetchProfile()
  }, [supabase, router])

  const handleSaveSettings = async () => {
    if (!profile) return

    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_time: notificationTime,
        notification_enabled: notificationEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setSaving(false)

    if (error) {
      toast({
        title: 'エラー',
        description: '設定の保存に失敗しました。',
        variant: 'destructive',
      })
    } else {
      toast({
        title: '保存完了',
        description: '設定を保存しました。',
      })
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    const result = await addCategory(newCategoryName.trim(), newCategoryColor)
    if (result) {
      setNewCategoryName('')
      setNewCategoryColor('#3B82F6')
      toast({
        title: '追加完了',
        description: 'カテゴリを追加しました。',
      })
    } else {
      toast({
        title: 'エラー',
        description: 'カテゴリの追加に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  const handleStartEdit = (category: Category) => {
    setEditingCategory(category.id)
    setEditingName(category.name)
    setEditingColor(category.color)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return

    const result = await updateCategory(id, editingName.trim(), editingColor)
    if (result) {
      setEditingCategory(null)
      setEditingName('')
      setEditingColor('')
      toast({
        title: '更新完了',
        description: 'カテゴリを更新しました。',
      })
    } else {
      toast({
        title: 'エラー',
        description: 'カテゴリの更新に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setEditingName('')
    setEditingColor('')
  }

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find(c => c.id === id)
    if (category?.is_default) {
      toast({
        title: 'エラー',
        description: 'デフォルトカテゴリは削除できません。',
        variant: 'destructive',
      })
      return
    }

    const result = await deleteCategory(id)
    if (result) {
      toast({
        title: '削除完了',
        description: 'カテゴリを削除しました。',
      })
    } else {
      toast({
        title: 'エラー',
        description: 'カテゴリの削除に失敗しました。',
        variant: 'destructive',
      })
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900">通知設定</h2>
          <p className="text-sm text-slate-500">リマインダー通知の設定を変更できます</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notification-enabled">通知を有効にする</Label>
              <p className="text-sm text-slate-500">
                毎日のリマインダー通知を受け取る
              </p>
            </div>
            <Switch
              id="notification-enabled"
              checked={notificationEnabled}
              onCheckedChange={setNotificationEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-time">通知時刻</Label>
            <Input
              id="notification-time"
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              disabled={!notificationEnabled}
              className="w-32 bg-white border-slate-200"
            />
            <p className="text-sm text-slate-500">
              指定した時刻に未完了タスクの通知を受け取ります
            </p>
          </div>

          <Button 
            onClick={handleSaveSettings} 
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '設定を保存'}
          </Button>
        </div>
      </div>

      {/* Category Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900">カテゴリ管理</h2>
          <p className="text-sm text-slate-500">タスクのカテゴリを追加・編集・削除できます</p>
        </div>
        <div className="p-6 space-y-4">
          {/* Add Category */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="新しいカテゴリ名"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="bg-white border-slate-200"
              />
              <Button 
                onClick={handleAddCategory} 
                disabled={!newCategoryName.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                追加
              </Button>
            </div>
            {/* Color Palette for New Category */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 min-w-[24px]">色:</span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewCategoryColor(color.value)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      newCategoryColor === color.value 
                        ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' 
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                {editingCategory === category.id ? (
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 bg-white border-slate-200"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleSaveEdit(category.id)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 text-slate-500" />
                      </Button>
                    </div>
                    {/* Color Palette for Editing */}
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {CATEGORY_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setEditingColor(color.value)}
                          className={`w-5 h-5 rounded-full transition-all ${
                            editingColor === color.value 
                              ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' 
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span 
                        className="font-medium"
                        style={{ color: category.color }}
                      >
                        {category.name}
                      </span>
                      {category.is_default && (
                        <span className="text-xs text-slate-400">(デフォルト)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(category)}
                      >
                        <Pencil className="h-4 w-4 text-slate-500" />
                      </Button>
                      {!category.is_default && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Routine Settings Link */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900">ルーティン設定</h2>
          <p className="text-sm text-slate-500">繰り返しタスクの設定を管理できます</p>
        </div>
        <div className="p-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/settings/routines')}
            className="w-full justify-start"
          >
            <Repeat className="h-4 w-4 mr-2" />
            ルーティン設定を開く
          </Button>
        </div>
      </div>
    </div>
  )
}
