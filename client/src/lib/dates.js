/**
 * @file dates.js
 * دوال تواريخ نقية (بدون مكتبات) للأزرار السريعة والتحقق، كلها على نصوص yyyy-MM-dd
 * اليوم يُمرَّر دائماً من الخارج (بتوقيت الرياض) لتبقى الدوال قابلة للاختبار.
 */

import { ARABIC_MONTHS, todayRiyadhISO } from './format.js'

export const QUICK_RANGES = [
  { id: 'last7', label: 'آخر 7 أيام' },
  { id: 'thisMonth', label: 'هذا الشهر' },
  { id: 'lastMonth', label: 'الشهر الماضي' },
  { id: 'yearToDate', label: 'منذ بداية السنة' },
]

export const MAX_RANGE_DAYS = 366

const pad = (n) => String(n).padStart(2, '0')

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

function toISO(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`
}

/** إضافة أيام (سالبة أو موجبة) إلى تاريخ ISO */
export function addDays(iso, days) {
  const { y, m, d } = parseISO(iso)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return toISO(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

export function startOfMonth(iso) {
  const { y, m } = parseISO(iso)
  return toISO(y, m, 1)
}

export function endOfMonth(iso) {
  const { y, m } = parseISO(iso)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return toISO(y, m, last)
}

/** فرق الأيام بين تاريخين (to - from) */
export function diffDays(fromIso, toIso) {
  const a = parseISO(fromIso)
  const b = parseISO(toIso)
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000)
}

/**
 * حساب فترة الزر السريع (5.6)
 * @param {string} id
 * @param {string} today yyyy-MM-dd بتوقيت الرياض
 * @returns {{ from: string, to: string }}
 */
export function quickRange(id, today) {
  switch (id) {
    case 'last7':
      return { from: addDays(today, -6), to: today }
    case 'thisMonth':
      return { from: startOfMonth(today), to: today }
    case 'lastMonth': {
      const lastDayPrev = addDays(startOfMonth(today), -1)
      return { from: startOfMonth(lastDayPrev), to: lastDayPrev }
    }
    case 'yearToDate': {
      const { y } = parseISO(today)
      return { from: toISO(y, 1, 1), to: today }
    }
    default:
      throw new Error(`زر سريع غير معروف: ${id}`)
  }
}

/** معرّف الزر السريع المطابق للفترة الحالية، أو null عند التعديل اليدوي */
export function matchQuickRange(from, to, today) {
  const found = QUICK_RANGES.find((q) => {
    const r = quickRange(q.id, today)
    return r.from === from && r.to === to
  })
  return found ? found.id : null
}

/**
 * التحقق من الفترة
 * @returns {string | null} رسالة خطأ عربية أو null إن كانت صالحة
 */
export function validateRange(from, to, today) {
  if (!from || !to) return 'اختر تاريخ البداية والنهاية'
  if (from > to) return 'تاريخ البداية يجب أن يسبق تاريخ النهاية'
  if (to > today) return 'تاريخ النهاية لا يمكن أن يكون في المستقبل'
  if (diffDays(from, to) + 1 > MAX_RANGE_DAYS) return 'الفترة القصوى سنة واحدة'
  return null
}

/** yyyy-MM-dd -> yyyy/MM/dd */
export function toDisplayDate(iso) {
  return iso ? iso.replaceAll('-', '/') : ''
}

/**
 * توليد خيارات الشهور من أول شهر في السنة الحالية حتى الشهر الحالي (6.5)
 * @param {string} [todayIso] بصيغة yyyy-MM-dd
 * @returns {Array<{ value: string, label: string, monthName: string, year: number }>}
 */
export function getAvailableMonths(todayIso = todayRiyadhISO()) {
  const [yearStr, monthStr] = (todayIso || '').split('-')
  const year = parseInt(yearStr, 10) || new Date().getFullYear()
  const currentMonthNum = parseInt(monthStr, 10) || 12

  const list = []
  for (let m = currentMonthNum; m >= 1; m--) {
    const padM = String(m).padStart(2, '0')
    const val = `${year}-${padM}`
    const monthName = ARABIC_MONTHS[m - 1] || ''
    list.push({
      value: val,
      label: `${monthName} ${year}`,
      monthName,
      year,
    })
  }
  return list
}
