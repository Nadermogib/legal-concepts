/**
 * @file StatCard.jsx
 * بطاقة إحصائيات الحالة اليومية والفترات
 * مطابقة لقياسات ومواصفات DESIGN_NOTES.md (ارتفاع ~155px، شريط جانبي 6px مقوّس، أيقونة 22px في مربع 40×40)
 */

import { UserCheck, UserX, Umbrella, Briefcase, LogOut, Clock } from 'lucide-react'
import { getStatusDef } from '../lib/status.js'

const DEFAULT_ICONS = {
  present: UserCheck,
  absent: UserX,
  leave: Umbrella,
  trip: Briefcase,
  excuse: LogOut,
  notYet: Clock,
}

export default function StatCard({
  status = 'present',
  count = 0,
  percentage = 0,
  label = null,
  icon = null,
  className = '',
  onClick = null,
}) {
  const statusDef = getStatusDef(status)
  const IconComponent = icon || DEFAULT_ICONS[status] || Clock

  // تجهيز نص النسبة
  const formattedPct =
    typeof percentage === 'number'
      ? `${Math.round(percentage)}%`
      : String(percentage).endsWith('%')
      ? percentage
      : `${percentage}%`

  const isClickable = Boolean(onClick)

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : 'region'}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={`${label || statusDef.label}: ${count} (${formattedPct})`}
      style={{ borderColor: statusDef.color }}
      className={`group relative bg-white rounded-card p-3 min-w-0 h-[142px] flex flex-col items-center justify-between select-none border-2 border-r-[6px] shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
        isClickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-olive' : ''
      } ${className}`}
    >
      {/* الشريط الجانبي على اليمين هو الحد الأيمن السميك للبطاقة بلون الحالة */}

      {/* 1. مربع الأيقونة (36×36px بخلفية باهتة tint) */}
      <div
        className={`w-9 h-9 rounded-card flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${statusDef.tintClass}`}
      >
        <IconComponent
          size={20}
          strokeWidth={1.5}
          style={{ color: statusDef.color }}
          aria-hidden="true"
        />
      </div>

      {/* 2. العدد الكبير بلون الحالة (~26px Bold) */}
      <div
        className="text-[26px] font-bold leading-tight"
        style={{ color: statusDef.color }}
      >
        {Number(count) || 0}
      </div>

      {/* 3. اسم الحالة رمادي (~15px Semibold) */}
      <div className="text-[15px] font-semibold text-text-strong leading-tight text-center truncate max-w-full px-1">
        {label || statusDef.label}
      </div>

      {/* 4. شارة النسبة المئوية (~11px Bold بخلفية status-*-pill) */}
      <span
        className={`inline-flex items-center justify-center min-w-[34px] h-[19px] px-2 rounded-pill text-[11px] font-bold leading-none ${statusDef.pillClass}`}
        style={{ color: statusDef.color }}
      >
        {formattedPct}
      </span>
    </div>
  )
}
