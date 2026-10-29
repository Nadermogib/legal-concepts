/**
 * @file reports.js
 * منطق بناء تقرير البصمة اليومي والتقرير الشهري وفق الأقسام 5.3، 5.7، 6.3، 6.4، 7.1.
 * دوال نقية تماماً بدون أي استدعاء خارجي.
 */

import { parseHm } from './parseHm.js'
import { formatRiyadhTime, todayRiyadh, currentRiyadhTime } from './dates.js'
import { resolveEmployeeName, cleanName } from './names.js'
import { resolveDailyStatus } from './status.js'

/**
 * بناء تقرير البصمة اليومي
 *
 * @param {Object} params
 * @param {Array<any>} params.employees قائمة الموظفين
 * @param {Array<any>} params.summaryRecords ملخص الحضور لليوم من جسر
 * @param {Array<any>} params.punches سجلات البصمات لليوم من attendance_logs
 * @param {Array<string>} params.enabledDepartmentIds معرفات الدوائر المفعّلة
 * @param {string} [params.punchWindowStart='06:00'] بداية نافذة البصمة
 * @param {string} [params.punchWindowEnd='17:00'] نهاية نافذة البصمة
 * @param {string} [params.workdayEnd='16:00'] نهاية الدوام الرسمي
 * @param {string} [params.targetDate] تاريخ التقرير المستهدف
 * @param {string} [params.currentDate=todayRiyadh()] تاريخ اليوم بتوقيت الرياض
 * @param {string} [params.currentTime=currentRiyadhTime()] الوقت الحالي بتوقيت الرياض
 * @returns {{ summary: any, rows: Array<any> }}
 */
export function buildDailyReport({
  employees = [],
  summaryRecords = [],
  punches = [],
  enabledDepartmentIds = [],
  punchWindowStart = '06:00',
  punchWindowEnd = '17:00',
  workdayEnd = '16:00',
  targetDate,
  currentDate = todayRiyadh(),
  currentTime = currentRiyadhTime(),
}) {
  const enabledSet = new Set(enabledDepartmentIds.map(String))

  // تحديد هل انتهى دوام اليوم:
  // 1. إذا كان التاريخ يوماً سابقاً: انتهى الدوام حتماً
  // 2. إذا كان اليوم الحالي (أو لم يُحدد تاريخ): ينتهي الدوام فقط عند بلوغ وقت نهاية الدوام الرسمي
  const effectiveTargetDate = targetDate || currentDate
  const isPastDate = effectiveTargetDate < currentDate
  const isToday = effectiveTargetDate === currentDate
  const isWorkdayOver = isPastDate || (isToday && currentTime >= workdayEnd)

  // خريطة ملخص جسر لليوم حسب id الموظف
  const summaryByEmpId = new Map()
  for (const rec of summaryRecords) {
    if (rec && rec.id) {
      summaryByEmpId.set(String(rec.id), rec)
    }
  }

  // تجميع وتصنيف بصمات اليوم حسب كود الموظف
  // كل بصمة تُحول لتوقيت الرياض HH:mm، مع استبعاد ما هو خارج نافذة البصمة (وفق 5.1 و 6.4)
  const punchesByCode = new Map()
  for (const p of punches) {
    if (!p || !p.employee_code || !p.punch_time) continue
    const code = String(p.employee_code).trim()
    const timeStr = formatRiyadhTime(p.punch_time)
    if (!timeStr) continue

    // فحص نافذة البصمة المقبولة (06:00 إلى 17:00 بتوقيت الرياض)
    if (timeStr < punchWindowStart || timeStr > punchWindowEnd) {
      // تحذير بدون أي بيانات شخصية (وفق القسم 6.4)
      console.warn(`[Punches] تم تجاهل بصمة خارج الفترة المعتمدة (${punchWindowStart} - ${punchWindowEnd}): ${timeStr}`)
      continue
    }

    if (!punchesByCode.has(code)) {
      punchesByCode.set(code, [])
    }
    punchesByCode.get(code).push(timeStr)
  }

  // فلترة الموظفين المستهدفين في الدوائر المفعّلة
  const targetEmployees = employees.filter((emp) => {
    if (!emp || !emp.is_active) return false
    const deptId = emp.department && emp.department.id ? String(emp.department.id) : null
    return deptId && enabledSet.has(deptId)
  })

  let attendedCount = 0
  let lateCount = 0
  let missingPunchCount = 0

  const rows = []

  for (const emp of targetEmployees) {
    const summaryRec = summaryByEmpId.get(String(emp.id)) || {}
    const { status, flags, lateMinutes } = resolveDailyStatus(summaryRec)

    // استخراج أوقات الحضور والانصراف من البصمات
    const empPunches = punchesByCode.get(String(emp.code).trim()) || []
    empPunches.sort() // ترتيب زمني

    let checkIn = null
    let checkOut = null
    let workedMinutes = null
    let effectiveSinglePunch = false

    if (status === 'present') {
      // البحث عن أول بصمة قبل 12:00 م (حضور)
      const morningPunches = empPunches.filter((t) => {
        const [h] = t.split(':').map(Number)
        return h < 12
      })
      if (morningPunches.length > 0) {
        checkIn = morningPunches[0]
      }

      // البحث عن آخر بصمة في 12:00 م أو بعدها (انصراف)
      const afternoonPunches = empPunches.filter((t) => {
        const [h] = t.split(':').map(Number)
        return h >= 12
      })
      if (afternoonPunches.length > 0) {
        checkOut = afternoonPunches[afternoonPunches.length - 1]
      }

      // تحديد هل هي بصمة واحدة فعلاً:
      // - إذا وُجدت بصمتا الحضور والانصراف: ليست بصمة واحدة قطعاً
      // - إذا وُجدت بصمة حضور صباحية فقط دون انصراف:
      //   أثناء ساعات العمل (قبل نهاية الدوام 16:00) الموظف على رأس العمل، فلا تُعد بصمة ناقصة إلا بعد انتهاء الدوام
      // - إذا وُجدت بصمة انصراف مسائية فقط دون حضور صباحي: بصمة واحدة (غياب بصمة الحضور)
      // - إذا لم تتوفر بصمات في السجلات لكن وُجدت علامة بصمة واحدة من جسر: تؤجل أيضاً لما بعد نهاية الدوام
      const hasBothPunches = Boolean(checkIn && checkOut)
      const hasOnlyCheckIn = Boolean(checkIn && !checkOut)
      const hasOnlyCheckOut = Boolean(!checkIn && checkOut)

      if (hasBothPunches) {
        effectiveSinglePunch = false
      } else if (hasOnlyCheckIn) {
        effectiveSinglePunch = isWorkdayOver
      } else if (hasOnlyCheckOut) {
        effectiveSinglePunch = true
      } else if (flags.singlePunch) {
        effectiveSinglePunch = isWorkdayOver
      } else {
        effectiveSinglePunch = false
      }

      if (effectiveSinglePunch) {
        // عند بصمة واحدة مكتملة بعد نهاية الدوام: المدة تكون null (عقد 7.1)
        workedMinutes = null
        if (empPunches.length === 1) {
          const single = empPunches[0]
          const [h] = single.split(':').map(Number)
          if (h < 12) {
            checkIn = single
            checkOut = null
          } else {
            checkIn = null
            checkOut = single
          }
        }
      } else {
        workedMinutes = parseHm(summaryRec.total_working_hours) || null
      }
    }

    const effectiveFlags = {
      ...flags,
      singlePunch: effectiveSinglePunch,
    }

    if (status === 'present') {
      attendedCount++
    }
    if (effectiveFlags.late) {
      lateCount++
    }
    if (effectiveFlags.singlePunch) {
      missingPunchCount++
    }

    rows.push({
      employeeId: String(emp.id),
      code: String(emp.code || ''),
      name: resolveEmployeeName(emp),
      avatarUrl: emp.avatar || null,
      departmentId: String(emp.department?.id || ''),
      departmentName: cleanName(emp.department?.name_ar || emp.department?.name || 'دائرة'),
      status,
      flags: effectiveFlags,
      lateMinutes,
      checkIn,
      checkOut,
      workedMinutes,
    })
  }

  // ترتيب الجدول: الدائرة ثم الاسم (وفق القسم 6.3)
  rows.sort((a, b) => {
    const deptCompare = a.departmentName.localeCompare(b.departmentName, 'ar')
    if (deptCompare !== 0) return deptCompare
    return a.name.localeCompare(b.name, 'ar')
  })

  return {
    summary: {
      attended: attendedCount,
      total: targetEmployees.length,
      late: lateCount,
      missingPunch: missingPunchCount,
    },
    rows,
  }
}

/**
 * بناء تقرير البصمة الشهري
 *
 * @param {Object} params
 * @param {Array<any>} params.employees قائمة الموظفين
 * @param {Array<any>} params.summaryRecords ملخص الحضور للشهر من جسر
 * @param {Array<string>} params.enabledDepartmentIds معرفات الدوائر المفعّلة
 * @returns {{ topLate: Array<any>, rows: Array<any> }}
 */
export function buildMonthlyReport({ employees = [], summaryRecords = [], enabledDepartmentIds = [] }) {
  const enabledSet = new Set(enabledDepartmentIds.map(String))

  const validEmployeeMap = new Map()
  for (const emp of employees) {
    if (!emp || !emp.is_active) continue
    const deptId = emp.department && emp.department.id ? String(emp.department.id) : null
    if (deptId && enabledSet.has(deptId)) {
      validEmployeeMap.set(String(emp.id), emp)
    }
  }

  const summaryByEmpId = new Map()
  for (const rec of summaryRecords) {
    if (rec && rec.id) {
      summaryByEmpId.set(String(rec.id), rec)
    }
  }

  const rows = []

  for (const emp of validEmployeeMap.values()) {
    const rec = summaryByEmpId.get(String(emp.id)) || {}

    const lateDays = Number(rec.late_arrival_days) || 0
    const lateMinutes = parseHm(rec.late_arrival)
    const absenceDays = Number(rec.absence) || 0
    const leaveDays = Number(rec.leave_days) || 0
    const earlyDepartureDays = Number(rec.early_departure_days) || 0
    const workedMinutes = parseHm(rec.total_working_hours)

    rows.push({
      employeeId: String(emp.id),
      code: String(emp.code || ''),
      name: resolveEmployeeName(emp),
      avatarUrl: emp.avatar || null,
      departmentName: cleanName(emp.department?.name_ar || emp.department?.name || 'دائرة'),
      lateDays,
      lateMinutes,
      absenceDays,
      leaveDays,
      earlyDepartureDays,
      workedMinutes,
    })
  }

  // الترتيب الافتراضي: أيام التأخير تنازلياً، ثم دقائق التأخير تنازلياً
  rows.sort((a, b) => {
    if (b.lateDays !== a.lateDays) return b.lateDays - a.lateDays
    return b.lateMinutes - a.lateMinutes
  })

  // قائمة أكثر الموظفين تأخراً (أعلى 4 موظفين ممن لديهم تأخير lateDays > 0)
  const topLate = rows
    .filter((r) => r.lateDays > 0)
    .slice(0, 4)
    .map((r) => ({
      employeeId: r.employeeId,
      name: r.name,
      lateDays: r.lateDays,
    }))

  return {
    topLate,
    rows,
  }
}
