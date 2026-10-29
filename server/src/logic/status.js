/**
 * @file status.js
 * منطق تحديد الحالة اليومية للموظف وترتيب الأولوية وفق الأقسام 5.2، 5.3، 5.4 من المواصفات.
 * كل الحسابات دوال نقية بدون أي استدعاء لقاعدة البيانات أو الشبكة.
 */

import { parseHm } from './parseHm.js'
import { isRiyadhWeekend, formatRiyadhTime } from './dates.js'

/**
 * @typedef {'present' | 'absent' | 'leave' | 'trip' | 'excuse' | 'notYet'} EmployeeStatus
 */

/**
 * @typedef {Object} DailyStatusResult
 * @property {EmployeeStatus} status الحالة المحسومة وفق جدول الأولوية
 * @property {{ late: boolean, singlePunch: boolean }} flags علامات الحالة الإضافية
 * @property {number} lateMinutes عدد دقائق التأخير
 */

/**
 * تحديد الحالة اليومية للموظف وفق جدول الأولوية الصارم في القسم 5.4:
 * 1. leave_days > 0          => leave (إجازة)
 * 2. businiess_trip_days > 0  => trip (مهمة عمل)
 * 3. full_day_excuses > 0     => excuse (مستأذن)
 * 4. worked_days >= 1         => present (حاضر)
 * 5. absence > 0              => absent (غائب - من جسر فقط)
 * 6. غير ذلك                 => notYet (لم يحضر بعد)
 *
 * @param {Record<string, any> | null | undefined} record سجل الحضور اليومي للموظف من جسر
 * @returns {DailyStatusResult}
 */
export function resolveDailyStatus(record) {
  const r = record || {}

  const leaveDays = Number(r.leave_days) || 0
  const tripDays = Number(r.businiess_trip_days) || 0
  const excuseDays = Number(r.full_day_excuses) || 0
  const workedDays = Number(r.worked_days) || 0
  const absenceDays = Number(r.absence) || 0
  const lateDays = Number(r.late_arrival_days) || 0
  const noRecords = r.no_records !== null && r.no_records !== undefined ? Number(r.no_records) : 0

  // 1. إجازة
  if (leaveDays > 0) {
    return {
      status: 'leave',
      flags: { late: false, singlePunch: false },
      lateMinutes: 0,
    }
  }

  // 2. مهمة عمل
  if (tripDays > 0) {
    return {
      status: 'trip',
      flags: { late: false, singlePunch: false },
      lateMinutes: 0,
    }
  }

  // 3. مستأذن (ليوم كامل)
  if (excuseDays > 0) {
    return {
      status: 'excuse',
      flags: { late: false, singlePunch: false },
      lateMinutes: 0,
    }
  }

  // 4. حاضر (شاملاً من له بصمة واحدة worked_days >= 1)
  if (workedDays >= 1) {
    const isLate = lateDays > 0
    const isSinglePunch = noRecords === 1
    const lateMinutes = isLate ? parseHm(r.late_arrival) : 0

    return {
      status: 'present',
      flags: {
        late: isLate,
        singlePunch: isSinglePunch,
      },
      lateMinutes,
    }
  }

  // 5. غائب (معتمد من جسر فقط absence > 0)
  if (absenceDays > 0) {
    return {
      status: 'absent',
      flags: { late: false, singlePunch: false },
      lateMinutes: 0,
    }
  }

  // 6. غير ذلك = لم يحضر بعد (لم يبصم وليس في إجازة/مهمة/استئذان ولم يحسبه جسر غائباً)
  return {
    status: 'notYet',
    flags: { late: false, singlePunch: false },
    lateMinutes: 0,
  }
}

/**
 * تحديد نوع البصمة الواحدة بناءً على وقتها بتوقيت الرياض:
 * - قبل 12:00 م = بصمة حضور (checkIn)
 * - 12:00 م أو بعدها = بصمة انصراف (checkOut)
 *
 * @param {string | Date | null | undefined} punchTime وقت البصمة (ISO أو HH:mm)
 * @returns {'checkIn' | 'checkOut'}
 */
export function classifySinglePunch(punchTime) {
  const time = formatRiyadhTime(punchTime)
  if (!time) return 'checkIn' // افتراضي آمن

  const [hours] = time.split(':').map(Number)
  if (hours < 12) {
    return 'checkIn'
  }
  return 'checkOut'
}

/**
 * فحص ما إذا كان اليوم عطلة (عطلة نهاية أسبوع أو عطلة رسمية بالكامل لجميع الموظفين)
 * @param {string} dateStr تاريخ اليوم بصيغة YYYY-MM-DD
 * @param {Array<Record<string, any>>} [records=[]] سجلات الموظفين لليوم
 * @returns {boolean}
 */
export function checkIsOffDay(dateStr, records = []) {
  // 1. الجمعة والسبت عطلة أسبوعية دائماً
  if (isRiyadhWeekend(dateStr)) {
    return true
  }

  // 2. إذا كان لجميع الموظفين off_days > 0 فاليوم عطلة رسمية معتمدة من جسر
  if (records.length > 0) {
    const allOff = records.every((r) => Number(r && r.off_days) > 0)
    if (allOff) {
      return true
    }
  }

  return false
}
