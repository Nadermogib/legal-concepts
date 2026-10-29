/**
 * @file RefreshButton.jsx
 * زر التحديث الموحد في الترويسة العليا لكافة الصفحات
 * خلفية brand-gray (#999999)، نص أبيض "تحديث"، أيقونة RefreshCw مع دوران أثناء التحميل
 */

import { RefreshCw } from 'lucide-react'

export default function RefreshButton({
  onClick,
  isLoading = false,
  disabled = false,
  className = '',
}) {
  const isBusy = Boolean(isLoading)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isBusy}
      className={`group inline-flex items-center justify-center gap-2.5 h-[50px] px-6 bg-gradient-to-r from-[#7b8390] to-[#68707c] hover:from-[#6d7582] hover:to-[#5a626d] text-white rounded-card font-bold text-lg hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 select-none shadow-sm cursor-pointer ${className}`}
      title="تحديث البيانات من جسر"
    >
      <RefreshCw
        className={`w-5 h-5 shrink-0 transition-transform duration-500 ${
          isBusy ? 'animate-spin' : 'group-hover:rotate-180'
        }`}
        strokeWidth={2}
      />
      <span>{isBusy ? 'جارٍ التحديث...' : 'تحديث'}</span>
    </button>
  )
}
