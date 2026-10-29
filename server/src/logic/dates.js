/**
 * @file dates.js
 * دوال نقية للتعامل مع التواريخ والأوقات بتوقيت الرياض (Asia/Riyadh = UTC+3)
 * وفق الأقسام 3.6، 5.1، 5.6، 11.2-9 من المواصفات.
 */

// توقيت الرياض: UTC+3 ثابت بدون توقيت صيفي
const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000

/**
 * تحويل تاريخ أو نص إلى كائن Date
 * بعد التحقق الفعلي مع خوادم جسر (المهمة 3.2 والقسم 12.2):
 * وقت البصمة punch_time في جسر يحمل الوقت الفعلي المباشر في السعودية (Riyadh local time).
 * @param {string | Date} input التاريخ أو الوقت، مثلاً "2026-10-18T07:27:00.000Z"
 * @returns {Date | null} كائن تاريخ صالح أو null
 */
export function toRiyadh(input) {
  if (!input) return null
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return null
  return d
}

/**
 * استخراج تاريخ اليوم الحالي بتوقيت الرياض بصيغة YYYY-MM-DD
 * @param {Date} [now=new Date()] مرجع زمني للاختبارات
 * @returns {string} تاريخ اليوم، مثلاً "2026-10-18"
 */
export function todayRiyadh(now = new Date()) {
  const riyadh = new Date(now.getTime() + RIYADH_OFFSET_MS)
  return riyadh.toISOString().slice(0, 10)
}

/**
 * استخراج الوقت الحالي بتوقيت الرياض بصيغة HH:mm 24 ساعة
 * @param {Date} [now=new Date()]
 * @returns {string} الوقت الحالي، مثلاً "13:38"
 */
export function currentRiyadhTime(now = new Date()) {
  const riyadh = new Date(now.getTime() + RIYADH_OFFSET_MS)
  return riyadh.toISOString().slice(11, 16)
}

/**
 * استخراج الوقت بصيغة HH:mm 24 ساعة بتوقيت الرياض
 * بعد التحقق الفعلي مع خوادم جسر (المهمة 3.2 والقسم 12.2):
 * punch_time مسجل بالفعل بتوقيت الرياض المحلي (مثلاً 07:27 صباحاً تأتي "2026-10-28T07:27:00.000Z")
 * @param {string | Date} input وقت البصمة بصيغة ISO أو نص HH:mm
 * @returns {string | null} الوقت "07:27" أو null إن كانت القيمة غير صالحة
 */
export function formatRiyadhTime(input) {
  if (!input) return null

  // إذا كان المدخل نصاً بصيغة HH:mm مباشرة، نتحقق منه
  if (typeof input === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(input.trim())) {
    return input.trim()
  }

  // استخراج الساعات والدقائق مباشرة من نص البصمة الصادر من جسر دون إضافة ساعات زائدة
  if (typeof input === 'string') {
    const timeMatch = /(?:T|\s)([01]\d|2[0-3]):([0-5]\d)/.exec(input)
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]}`
    }
  }

  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return null

  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * فحص ما إذا كان التاريخ يقع في عطلة نهاية الأسبوع (الجمعة أو السبت)
 * @param {string} dateStr تاريخ بصيغة YYYY-MM-DD
 * @returns {boolean}
 */
export function isRiyadhWeekend(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return false
  // في جافاسكريبت الشهر 0-indexed: 0 = Jan
  const date = new Date(Date.UTC(y, m - 1, d))
  const dayOfWeek = date.getUTCDay() // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  return dayOfWeek === 5 || dayOfWeek === 6
}

/**
 * حساب حدود الشهر (أول يوم وآخر يوم) لشهر محدد
 * @param {string} monthStr بصيغة YYYY-MM مثلاً "2026-10"
 * @returns {{ from: string, to: string, lastDay: number } | null}
 */
export function monthBounds(monthStr) {
  if (!monthStr || typeof monthStr !== 'string') return null
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthStr.trim())
  if (!match) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)

  // اليوم 0 من الشهر التالي يعطي آخر يوم من الشهر الحالي
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()

  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return { from, to, lastDay }
}

/**
 * التحقق من صحة نطاق التواريخ (من / إلى)
 * القواعد:
 * 1. الصيغة YYYY-MM-DD
 * 2. from <= to
 * 3. to لا يتجاوز اليوم الحالي بتوقيت الرياض
 * 4. أقصى فترة سنة واحدة (366 يوماً)
 *
 * @param {string} from تاريخ البداية
 * @param {string} to تاريخ النهاية
 * @param {string} [todayStr=todayRiyadh()] تاريخ اليوم للمقارنة
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDateRange(from, to, todayStr = todayRiyadh()) {
  const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

  if (!from || !dateRegex.test(from)) {
    return { valid: false, error: 'تاريخ البداية (from) غير صالح أو غير موجود (المطلوب YYYY-MM-DD)' }
  }
  if (!to || !dateRegex.test(to)) {
    return { valid: false, error: 'تاريخ النهاية (to) غير صالح أو غير موجود (المطلوب YYYY-MM-DD)' }
  }

  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)

  const fromDate = new Date(Date.UTC(fy, fm - 1, fd))
  const toDate = new Date(Date.UTC(ty, tm - 1, td))

  if (
    fromDate.getUTCFullYear() !== fy ||
    fromDate.getUTCMonth() !== fm - 1 ||
    fromDate.getUTCDate() !== fd ||
    toDate.getUTCFullYear() !== ty ||
    toDate.getUTCMonth() !== tm - 1 ||
    toDate.getUTCDate() !== td
  ) {
    return { valid: false, error: 'تاريخ غير صالح في التقويم' }
  }

  if (from > to) {
    return { valid: false, error: 'تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية' }
  }

  if (to > todayStr) {
    return { valid: false, error: 'تاريخ النهاية لا يمكن أن يكون في المستقبل' }
  }

  const diffMs = toDate.getTime() - fromDate.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
  if (diffDays > 366) {
    return { valid: false, error: 'الفترة المحددة تتجاوز الحد الأقصى المسموح (سنة واحدة)' }
  }

  return { valid: true }
}

/**
 * التحقق من صحة معامل الشهر للتقرير الشهري
 * @param {string} monthStr الشهر بصيغة YYYY-MM
 * @param {string} [currentMonth=todayRiyadh().slice(0, 7)] الشهر الحالي
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMonth(monthStr, currentMonth = todayRiyadh().slice(0, 7)) {
  if (!monthStr || !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthStr)) {
    return { valid: false, error: 'صيغة الشهر غير صالحة، المطلوب YYYY-MM (مثال: 2026-10)' }
  }

  if (monthStr > currentMonth) {
    return { valid: false, error: 'لا يمكن طلب تقرير لشهر مستقبلي' }
  }

  if (monthStr < '2020-01') {
    return { valid: false, error: 'تاريخ الشهر خارج النطاق المتاح' }
  }

  return { valid: true }
}
