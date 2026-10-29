/**
 * @file status.js
 * ثوابت وتعريفات حالات الدوام اليومية والفترات وألوانها المعتمدة
 */

export const STATUS_DEFINITIONS = {
  present: {
    id: 'present',
    label: 'حاضر',
    color: '#1E8C5A',
    donutColor: '#1E8C5A',
    textClass: 'text-status-present',
    tintClass: 'bg-status-present-tint',
    pillClass: 'bg-status-present-pill',
    borderClass: 'border-status-present',
  },
  absent: {
    id: 'absent',
    label: 'غائب',
    color: '#C0392B',
    donutColor: '#C0392B',
    textClass: 'text-status-absent',
    tintClass: 'bg-status-absent-tint',
    pillClass: 'bg-status-absent-pill',
    borderClass: 'border-status-absent',
  },
  leave: {
    id: 'leave',
    label: 'إجازة',
    color: '#2471A3',
    donutColor: '#2471A3',
    textClass: 'text-status-leave',
    tintClass: 'bg-status-leave-tint',
    pillClass: 'bg-status-leave-pill',
    borderClass: 'border-status-leave',
  },
  trip: {
    id: 'trip',
    label: 'مهمة عمل',
    color: '#7D3C98',
    donutColor: '#7D3C98',
    textClass: 'text-status-trip',
    tintClass: 'bg-status-trip-tint',
    pillClass: 'bg-status-trip-pill',
    borderClass: 'border-status-trip',
  },
  excuse: {
    id: 'excuse',
    label: 'مستأذن',
    color: '#D68910',
    donutColor: '#D68910',
    textClass: 'text-status-excuse',
    tintClass: 'bg-status-excuse-tint',
    pillClass: 'bg-status-excuse-pill',
    borderClass: 'border-status-excuse',
  },
  notYet: {
    id: 'notYet',
    label: 'لم يحضر بعد',
    color: '#1B2A4A', // لون البطاقة كحلي
    donutColor: '#4D4D4D', // لون الدونات ونقطة وسيلة الإيضاح رمادي داكن
    textClass: 'text-status-notyet-card',
    tintClass: 'bg-status-notyet-tint',
    pillClass: 'bg-status-notyet-pill',
    borderClass: 'border-status-notyet-card',
  },
}

export const DAILY_STATUS_KEYS = ['present', 'absent', 'leave', 'trip', 'excuse', 'notYet']
export const PERIOD_STATUS_KEYS = ['present', 'absent', 'leave', 'trip', 'excuse']

/**
 * الحصول على تعريف الحالة أو كائن افتراضي
 * @param {string} statusId
 */
export function getStatusDef(statusId) {
  return STATUS_DEFINITIONS[statusId] || {
    id: statusId,
    label: statusId,
    color: '#999999',
    donutColor: '#999999',
    textClass: 'text-text-muted',
    tintClass: 'bg-tab-track/50',
    pillClass: 'bg-tab-track',
    borderClass: 'border-border-grid',
  }
}
