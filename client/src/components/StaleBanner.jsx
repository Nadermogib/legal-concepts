/**
 * @file StaleBanner.jsx
 * شريط تنبيه يظهر عندما تكون البيانات المعروضة قديمة (stale: true)
 */

import { TriangleAlert, RotateCw } from 'lucide-react'
import { formatTime12 } from '../lib/format.js'

export default function StaleBanner({
  stale = false,
  generatedAt = null,
  onRefresh,
  isRefreshing = false,
  className = '',
}) {
  if (!stale) return null

  const timeText = generatedAt ? formatTime12(generatedAt) : null

  return (
    <div
      className={`bg-badge-late-bg border-r-4 border-status-excuse text-text-strong px-4 py-3 rounded-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${className}`}
      role="status"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-status-excuse/20 text-status-excuse flex items-center justify-center shrink-0">
          <TriangleAlert className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="text-sm">
          <span className="font-bold block sm:inline">
            البيانات المعروضة قديمة بسبب تعذر الاتصال بنظام جسر.
          </span>
          {timeText && (
            <span className="text-text-muted sm:mr-2 block sm:inline">
              (آخر تحديث ناجح: {timeText})
            </span>
          )}
        </div>
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-status-excuse text-white text-xs font-bold rounded-md hover:bg-opacity-90 disabled:opacity-50 transition-all self-end sm:self-auto shrink-0"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'جارٍ التحديث...' : 'تحديث الآن'}</span>
        </button>
      )}
    </div>
  )
}
