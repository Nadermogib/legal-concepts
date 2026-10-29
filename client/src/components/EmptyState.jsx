/**
 * @file EmptyState.jsx
 * واجهة الحالة الفارغة (مثل عدم وجود متأخرين، أو عدم تفعيل أي دوائر)
 */

import { Inbox } from 'lucide-react'

export default function EmptyState({
  title = 'لا توجد بيانات متاحة',
  description = 'لا توجد سجلات لعرضها في الوقت الحالي.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`border border-border-grid/30 bg-white rounded-card p-10 text-center space-y-4 max-w-md mx-auto my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-tab-track/50 text-text-muted flex items-center justify-center mx-auto">
        <Icon className="w-7 h-7" strokeWidth={1.5} />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-text-strong">{title}</h3>
        <p className="text-sm text-text-muted leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2 bg-brand-olive text-white rounded-field font-bold text-sm hover:bg-opacity-90 transition-all shadow-sm active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
