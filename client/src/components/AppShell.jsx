/**
 * @file AppShell.jsx
 * هيكل التطبيق: القائمة الجانبية (قابلة للفتح والإغلاق) + ترويسة + محتوى الصفحة
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import PageHeader from './PageHeader.jsx'
import PwaInstallPrompt from './PwaInstallPrompt.jsx'
import { formatDate, todayRiyadhISO } from '../lib/format.js'

/** عنوان الترويسة لكل مسار (Q11: "تقرير البصمة" في العنوان و"تقارير البصمة" في القائمة) */
const TITLES = {
  '/': 'نظرة عامة',
  '/reports': 'تقرير البصمة',
  '/settings': 'الإعدادات',
}

export default function AppShell() {
  // حالة القائمة الجانبية مع استرجاع آخر وضع تم اختياره
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('lc_sidebar_open')
    if (saved !== null) {
      return saved === 'true'
    }
    return window.innerWidth >= 1024
  })

  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const isFetching = useIsFetching() > 0
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const refreshRef = useRef(null)

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem('lc_sidebar_open', String(next))
      } catch {
        // تجاهل أي قيود تخزين
      }
      return next
    })
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
    try {
      localStorage.setItem('lc_sidebar_open', 'false')
    } catch {
      // تجاهل
    }
  }, [])

  // دعم اختصار لوحة المفاتيح Ctrl+B / Cmd+B للتبديل السريع للقائمة
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B' || e.key === 'لا')) {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  // الصفحات تسجّل دالة تحديث خاصة بها (refresh=1)؛ وإلا نُبطل كل الاستعلامات
  const registerRefresh = useCallback((fn) => {
    refreshRef.current = fn
  }, [])

  const handleRefresh = async () => {
    try {
      setIsManualRefreshing(true)
      if (refreshRef.current) await refreshRef.current()
      else await queryClient.invalidateQueries()
    } finally {
      setIsManualRefreshing(false)
    }
  }

  const title = TITLES[pathname] ?? ''
  const today = formatDate(todayRiyadhISO())

  return (
    <div className="min-h-screen flex bg-white overflow-x-clip">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300">
        <div id="app-header" className="flex items-stretch border-b border-border-olive print:hidden">
          {/* زر فتح وإغلاق القائمة الجانبية (متاح للسطح المكتبي والجوال) */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'إغلاق القائمة الجانبية' : 'فتح القائمة الجانبية'}
            aria-controls="app-sidebar"
            aria-expanded={sidebarOpen}
            title={sidebarOpen ? 'إغلاق القائمة الجانبية (Ctrl+B)' : 'فتح القائمة الجانبية (Ctrl+B)'}
            className="shrink-0 w-14 bg-white hover:bg-neutral-50 flex items-center justify-center text-brand-gray hover:text-neutral-800 transition-colors cursor-pointer select-none group border-l border-neutral-100"
          >
            <Menu className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.75} />
          </button>

          <PageHeader
            className="flex-1 min-w-0 !border-b-0"
            title={title}
            date={today}
            isRefreshing={isFetching || isManualRefreshing}
            onRefresh={handleRefresh}
          />
        </div>

        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6">
          <Outlet context={{ registerRefresh }} />
        </main>
      </div>

      {/* تنبيه واقتراح تثبيت التطبيق على سطح المكتب أو الجوال (PWA) */}
      <PwaInstallPrompt />
    </div>
  )
}
