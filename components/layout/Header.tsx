'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  CheckSquare, 
  Search, 
  Settings, 
  LogOut, 
  Calendar, 
  CalendarDays,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const [mounted, setMounted] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/', label: '今日', icon: Calendar },
    { href: '/week', label: '週間', icon: CalendarDays },
    { href: '/search', label: '検索', icon: Search },
  ]

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-slate-200/50">
      <div className="container mx-auto max-w-5xl">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <CheckSquare className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800 hidden sm:block">
              Daily TODO
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center bg-slate-100 rounded-full p-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                      isActive 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                </Link>
              )
            })}
          </nav>

          {/* Navigation - Mobile */}
          <nav className="flex md:hidden items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      'p-2.5 rounded-xl transition-all',
                      isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-slate-500 hover:bg-slate-100'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center hover:from-slate-200 hover:to-slate-300 transition-all">
                <User className="h-4 w-4 text-slate-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-slate-900">アカウント</p>
                <p className="text-xs text-slate-500 truncate">
                  {mounted ? user?.email : ''}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  設定
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
