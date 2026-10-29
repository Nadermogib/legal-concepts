/**
 * @file ErrorState.jsx
 * واجهة عرض الخطأ مع أيقونة تنبيه ورسالة وزر إعادة المحاولة
 */

import { TriangleAlert, RotateCw } from 'lucide-react'

export default function ErrorState({
  title = 'تعذّر تحميل البيانات',
  message = 'حدث خطأ أثناء الاتصال بالخادم، يرجى إعادة المحاولة.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`border border-status-absent/30 bg-status-absent-tint/40 rounded-card p-8 text-center space-y-4 max-w-lg mx-auto my-6 ${className}`}
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-status-absent/15 text-status-absent flex items-center justify-center mx-auto">
        <TriangleAlert className="w-6 h-6" strokeWidth={1.75} />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-text-strong">{title}</h3>
        <p className="text-sm text-text-muted">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2 bg-brand-gray text-white rounded-field font-bold text-sm hover:bg-opacity-90 transition-all shadow-sm active:scale-95"
        >
          <RotateCw className="w-4 h-4" />
          <span>إعادة المحاولة</span>
        </button>
      )}
    </div>
  )
}
