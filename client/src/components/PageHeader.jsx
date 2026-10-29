/**
 * @file PageHeader.jsx
 * ترويسة الصفحة الموحدة لكافة الصفحات: العنوان والتاريخ وزر التحديث والخط الفاصل السفلي الزيتوني
 * مطابقة للقسم 1.4 من DESIGN_NOTES.md
 */

import RefreshButton from './RefreshButton.jsx'
import { formatDate } from '../lib/format.js'

export default function PageHeader({
  title = '',
  date = new Date(),
  onRefresh,
  isRefreshing = false,
  actions = null,
  className = '',
}) {
  const formattedDate = typeof date === 'string' ? date : formatDate(date)

  return (
    <header
      className={`min-h-[104px] py-4 px-6 sm:px-8 border-b border-border-olive flex items-center justify-between gap-4 bg-white select-none ${className}`}
    >
      {/* جهة اليمين: عنوان الصفحة وتاريخ اليوم */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-[28px] font-bold text-brand-gray leading-tight">
          {title}
        </h1>
        {formattedDate && (
          <p className="text-base sm:text-lg font-normal text-brand-gray">
            {formattedDate}
          </p>
        )}
      </div>

      {/* جهة اليسار: زر التحديث وإجراءات إضافية */}
      <div className="flex items-center gap-3 shrink-0">
        {actions}
        {onRefresh && (
          <RefreshButton
            onClick={onRefresh}
            isLoading={isRefreshing}
          />
        )}
      </div>
    </header>
  )
}
