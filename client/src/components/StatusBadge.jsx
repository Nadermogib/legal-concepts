/**
 * @file StatusBadge.jsx
 * شارات الحالة وشارات تقارير البصمة (في الموعد، متأخر Nد، بصمة واحدة، الحالات اليومية)
 * مطابقة لقياسات DESIGN_NOTES.md (ارتفاع ~31px، حواف pill مستديرة)
 */

import { formatDuration } from '../lib/format.js'

export default function StatusBadge({
  status,
  variant, // 'on_time' | 'late' | 'single_punch' | null
  lateMinutes = 0,
  label = null,
  className = '',
}) {
  let text = label
  let styleClasses = 'bg-tab-track text-text-strong'

  // شارات التقرير اليومي المتخصصة (variant)
  if (variant === 'on_time') {
    text = text || 'في الموعد'
    styleClasses = 'bg-badge-ok-bg text-badge-ok-text'
  } else if (variant === 'late') {
    text = text || (lateMinutes > 0 ? `متأخر ${formatDuration(lateMinutes)}` : 'متأخر')
    styleClasses = 'bg-badge-late-bg text-badge-late-text'
  } else if (variant === 'single_punch') {
    text = text || 'بصمة واحدة'
    styleClasses = 'bg-badge-single-bg text-badge-single-text'
  } else {
    // شارات الحالات العامة
    switch (status) {
      case 'present':
        text = text || 'حاضر'
        styleClasses = 'bg-status-present-pill text-status-present'
        break
      case 'absent':
        text = text || 'غائب'
        styleClasses = 'bg-status-absent-pill text-status-absent'
        break
      case 'leave':
        text = text || 'إجازة'
        styleClasses = 'bg-status-leave-pill text-status-leave'
        break
      case 'trip':
        text = text || 'مهمة عمل'
        styleClasses = 'bg-status-trip-pill text-status-trip'
        break
      case 'excuse':
        text = text || 'مستأذن'
        styleClasses = 'bg-status-excuse-pill text-status-excuse'
        break
      case 'notYet':
        text = text || 'لم يحضر بعد'
        styleClasses = 'bg-status-notyet-pill text-status-notyet-card'
        break
      default:
        text = text || '—'
        styleClasses = 'bg-tab-track/50 text-text-muted'
    }
  }

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[84px] h-[31px] px-3 rounded-pill text-sm font-bold select-none text-center whitespace-nowrap ${styleClasses} ${className}`}
    >
      {text}
    </span>
  )
}
