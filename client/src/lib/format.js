/**
 * @file format.js
 * دوال تنسيق التواريخ والأوقات والمدد والجموع بالعربية مع أرقام لاتينية
 */

const ARABIC_WEEKDAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
]

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

/**
 * تنسيق التاريخ الميلادي بالعربية بأرقام لاتينية
 * مثال: "الأحد، 18 أكتوبر 2026"
 * @param {string | Date | number | null | undefined} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return '—'

  let date
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split('-').map(Number)
    date = new Date(y, m - 1, d)
  } else {
    date = new Date(dateInput)
  }

  if (isNaN(date.getTime())) return '—'

  const weekday = ARABIC_WEEKDAYS[date.getDay()]
  const day = date.getDate()
  const month = ARABIC_MONTHS[date.getMonth()]
  const year = date.getFullYear()

  return `${weekday}، ${day} ${month} ${year}`
}

/**
 * تنسيق الوقت بصيغة 12 ساعة بالعربية مع ص / م
 * مثال: "06:05" -> "6:05 ص"، "14:30" -> "2:30 م"
 * @param {string | Date | null | undefined} timeInput
 * @returns {string}
 */
export function formatTime12(timeInput) {
  if (!timeInput) return '—'

  let hours
  let minutes

  if (typeof timeInput === 'string') {
    // دعم صيغة HH:mm أو HH:mm:ss أو ISO
    const match = timeInput.match(/(\d{1,2}):(\d{2})/)
    if (!match) return '—'
    hours = parseInt(match[1], 10)
    minutes = parseInt(match[2], 10)
  } else if (timeInput instanceof Date && !isNaN(timeInput.getTime())) {
    hours = timeInput.getHours()
    minutes = timeInput.getMinutes()
  } else {
    return '—'
  }

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return '—'
  }

  const period = hours >= 12 ? 'م' : 'ص'
  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  const displayMinutes = String(minutes).padStart(2, '0')

  return `${displayHours}:${displayMinutes} ${period}`
}

/**
 * تحويل نص H:MM أو HHH:MM إلى دقائق
 * مثال: "143:24" -> 8604، "1:12" -> 72، غير الصالح -> 0
 * @param {string | null | undefined} hmStr
 * @returns {number}
 */
export function parseHm(hmStr) {
  if (!hmStr || typeof hmStr !== 'string') return 0
  const trimmed = hmStr.trim()
  const match = trimmed.match(/^(\d+):(\d{1,2})$/)
  if (!match) return 0
  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  if (isNaN(hours) || isNaN(minutes) || minutes >= 60) return 0
  return hours * 60 + minutes
}

/**
 * تنسيق المدة بالدقائق إلى نص مقروء بالعربية
 * أمثلة: 51 -> "51د"، 60 -> "1س"، 72 -> "1س 12د"، 485 -> "8س 5د"
 * @param {number | null | undefined} totalMinutes
 * @returns {string}
 */
export function formatDuration(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes) || totalMinutes < 0) {
    return '—'
  }

  const mins = Math.floor(totalMinutes)
  if (mins === 0) return '0د'

  const hours = Math.floor(mins / 60)
  const remainderMinutes = mins % 60

  if (hours === 0) {
    return `${remainderMinutes}د`
  }

  if (remainderMinutes === 0) {
    return `${hours}س`
  }

  return `${hours}س ${remainderMinutes}د`
}

/**
 * تنسيق المدة بصيغة الساعات والدقائق H:MM أو HHH:MM
 * مثال: 8604 -> "143:24"، 0 -> "0:00"، null -> "—"
 * @param {number | null | undefined} totalMinutes
 * @returns {string}
 */
export function formatColonDuration(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes) || totalMinutes < 0) {
    return '—'
  }

  const mins = Math.floor(totalMinutes)
  const hours = Math.floor(mins / 60)
  const remainderMinutes = mins % 60

  return `${hours}:${String(remainderMinutes).padStart(2, '0')}`
}

/**
 * جمع أيام العمل
 * أمثلة: 1 -> "يوم عمل واحد"، 2 -> "يومان عمل"، 5 -> "5 أيام عمل"، 12 -> "12 يوم عمل"
 * @param {number} count
 * @returns {string}
 */
export function formatWorkingDays(count) {
  const n = Math.floor(Number(count) || 0)
  if (n <= 0) return '0 يوم عمل'
  if (n === 1) return 'يوم عمل واحد'
  if (n === 2) return 'يومان عمل'
  if (n >= 3 && n <= 10) return `${n} أيام عمل`
  return `${n} يوم عمل`
}

/**
 * جمع الموظفين
 * أمثلة: 1 -> "موظف واحد"، 2 -> "موظفان"، 4 -> "4 موظفين"، 12 -> "12 موظف"
 * @param {number} count
 * @returns {string}
 */
export function formatEmployeesCount(count) {
  const n = Math.floor(Number(count) || 0)
  if (n <= 0) return 'لا يوجد موظفون'
  if (n === 1) return 'موظف واحد'
  if (n === 2) return 'موظفان'
  if (n >= 3 && n <= 10) return `${n} موظفين`
  return `${n} موظف`
}

/**
 * تاريخ اليوم بتوقيت الرياض بصيغة yyyy-MM-dd (مستقل عن منطقة جهاز المستخدم)
 * // TODO(verify): الاعتماد على Intl مع المنطقة Asia/Riyadh
 * @param {Date} [now]
 * @returns {string}
 */
export function todayRiyadhISO(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/**
 * يوم وشهر بالعربية من تاريخ yyyy-MM-dd. مثال: "2026-10-12" -> "12 أكتوبر"
 * @param {string} iso
 * @returns {string}
 */
export function formatDayMonth(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—'
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${ARABIC_MONTHS[m - 1]}`
}

/**
 * تنسيق الشهر والسنة بالعربية
 * مثال: "2026-10" -> "أكتوبر 2026"
 * @param {string | null | undefined} monthStr
 * @returns {string}
 */
export function formatMonthName(monthStr) {
  if (!monthStr || typeof monthStr !== 'string') return '—'
  const match = monthStr.match(/^(\d{4})-(\d{1,2})$/)
  if (!match) return monthStr
  const year = match[1]
  const monthIdx = parseInt(match[2], 10) - 1
  if (monthIdx < 0 || monthIdx > 11) return monthStr
  return `${ARABIC_MONTHS[monthIdx]} ${year}`
}

/**
 * الحصول على اسم الشهر فقط
 * مثال: "2026-10" -> "أكتوبر"
 * @param {string | null | undefined} monthStr
 * @returns {string}
 */
export function getMonthOnlyName(monthStr) {
  if (!monthStr || typeof monthStr !== 'string') return '—'
  const match = monthStr.match(/^(\d{4})-(\d{1,2})$/)
  if (!match) return monthStr
  const monthIdx = parseInt(match[2], 10) - 1
  if (monthIdx < 0 || monthIdx > 11) return monthStr
  return ARABIC_MONTHS[monthIdx]
}
