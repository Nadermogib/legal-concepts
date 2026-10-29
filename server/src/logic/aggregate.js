/**
 * @file aggregate.js
 * تجميع وحساب إحصائيات الحضور اليومية وفترات التاريخ (للمفاهيم القانونية ولكل دائرة)
 * وفق الأقسام 5.4، 5.5، 7.1، 10، 11.2-5، 11.2-6 من المواصفات.
 * دوال نقية بدون أي استدعاء خارجي.
 */

import { resolveDailyStatus } from './status.js'
import { cleanName, getDisplayCode } from './names.js'

/**
 * حساب النسب المئوية الصحيحة (أعداد صحيحة مقربة)
 * مع ضمان عدم القسمة على صفر عند فراغ البيانات (وفق القسم 10)
 *
 * @param {Record<string, number>} counts
 * @param {number} total
 * @returns {Record<string, number>}
 */
export function calculatePercentages(counts, total) {
  const result = {}
  if (!total || total <= 0) {
    for (const key of Object.keys(counts)) {
      result[key] = 0
    }
    return result
  }

  for (const [key, count] of Object.entries(counts)) {
    result[key] = Math.round((count / total) * 100)
  }
  return result
}

/**
 * تجميع إحصائيات النظرة العامة اليومية (Overview Daily)
 *
 * @param {Object} params
 * @param {Array<any>} params.employees قائمة الموظفين النشطين
 * @param {Array<any>} params.summaryRecords سجلات ملخص الحضور لليوم من جسر
 * @param {Array<string>} params.enabledDepartmentIds معرفات الدوائر المفعّلة
 * @returns {{ company: any, departments: Array<any> }}
 */
export function aggregateDailyOverview({ employees = [], summaryRecords = [], enabledDepartmentIds = [] }) {
  const enabledSet = new Set(enabledDepartmentIds.map(String))

  // خريطة سجلات جسر حسب id الموظف (UUID)
  const summaryByEmpId = new Map()
  for (const rec of summaryRecords) {
    if (rec && rec.id) {
      summaryByEmpId.set(String(rec.id), rec)
    }
  }

  // فلترة الموظفين النشطين المنتمين لدوائر مفعّلة
  const targetEmployees = employees.filter((emp) => {
    if (!emp || !emp.is_active) return false
    const deptId = emp.department && emp.department.id ? String(emp.department.id) : null
    return deptId && enabledSet.has(deptId)
  })

  // عدادات الشركة
  const companyCounts = {
    present: 0,
    absent: 0,
    leave: 0,
    trip: 0,
    excuse: 0,
    notYet: 0,
  }

  // تجميع الموظفين حسب الدائرة
  const deptMap = new Map()

  for (const emp of targetEmployees) {
    const deptId = String(emp.department.id)
    if (!deptMap.has(deptId)) {
      deptMap.set(deptId, {
        id: deptId,
        name: cleanName(emp.department.name_ar) || cleanName(emp.department.name) || 'دائرة',
        displayCode: getDisplayCode(emp.department.name_en),
        employees: [],
        counts: { present: 0, absent: 0, leave: 0, trip: 0, excuse: 0, notYet: 0 },
      })
    }

    const deptObj = deptMap.get(deptId)
    deptObj.employees.push(emp)

    // قراءة سجل الموظف لليوم وتحديد حالته
    const record = summaryByEmpId.get(String(emp.id)) || null
    const { status } = resolveDailyStatus(record)

    companyCounts[status] = (companyCounts[status] || 0) + 1
    deptObj.counts[status] = (deptObj.counts[status] || 0) + 1
  }

  const companyTotal = targetEmployees.length
  const companyPercentages = calculatePercentages(companyCounts, companyTotal)
  const companyAttendancePercent = companyTotal > 0
    ? Math.round((companyCounts.present / companyTotal) * 100)
    : 0

  // تجهيز إحصائيات الدوائر
  const departments = []
  for (const dept of deptMap.values()) {
    const deptTotal = dept.employees.length
    if (deptTotal === 0) continue // إخفاء الدوائر التي لا موظفين بها (وفق القسم 10)

    const percentages = calculatePercentages(dept.counts, deptTotal)
    const attendancePercent = deptTotal > 0
      ? Math.round((dept.counts.present / deptTotal) * 100)
      : 0

    departments.push({
      id: dept.id,
      name: dept.name,
      displayCode: dept.displayCode,
      employeeCount: deptTotal,
      total: deptTotal,
      counts: dept.counts,
      percentages,
      attendancePercent,
    })
  }

  return {
    company: {
      total: companyTotal,
      counts: companyCounts,
      percentages: companyPercentages,
      attendancePercent: companyAttendancePercent,
    },
    departments,
  }
}

/**
 * تجميع إحصائيات النظرة العامة للفترة المحددة (Overview Period)
 * لا تظهر فيها فئة notYet، والـ total هو مجموع سجلات الحضور (موظف × يوم)
 *
 * @param {Object} params
 * @param {Array<any>} params.employees قائمة الموظفين
 * @param {Array<any>} params.summaryRecords سجلات الفترة من جسر
 * @param {Array<string>} params.enabledDepartmentIds معرفات الدوائر المفعّلة
 * @returns {{ company: any, departments: Array<any>, workingDays: number, totalRecords: number }}
 */
export function aggregatePeriodOverview({ employees = [], summaryRecords = [], enabledDepartmentIds = [] }) {
  const enabledSet = new Set(enabledDepartmentIds.map(String))

  // خريطة موظفين مؤهلين
  const validEmployeeMap = new Map()
  for (const emp of employees) {
    if (!emp || !emp.is_active) continue
    const deptId = emp.department && emp.department.id ? String(emp.department.id) : null
    if (deptId && enabledSet.has(deptId)) {
      validEmployeeMap.set(String(emp.id), emp)
    }
  }

  const companyCounts = {
    present: 0,
    absent: 0,
    leave: 0,
    trip: 0,
    excuse: 0,
  }

  const deptMap = new Map()
  let maxEmployeeWorkingDays = 0

  for (const rec of summaryRecords) {
    if (!rec || !rec.id) continue
    const emp = validEmployeeMap.get(String(rec.id))
    if (!emp) continue // استبعاد موظفي الدوائر غير المفعّلة

    const deptId = String(emp.department.id)
    if (!deptMap.has(deptId)) {
      deptMap.set(deptId, {
        id: deptId,
        name: cleanName(emp.department.name_ar) || cleanName(emp.department.name) || 'دائرة',
        displayCode: getDisplayCode(emp.department.name_en),
        employeeIds: new Set(),
        counts: { present: 0, absent: 0, leave: 0, trip: 0, excuse: 0 },
      })
    }

    const deptObj = deptMap.get(deptId)
    deptObj.employeeIds.add(String(emp.id))

    // قراءة الأيام الخمسة للفترة وفق القسم 5.5
    const present = Number(rec.worked_days) || 0
    const absent = Number(rec.absence) || 0
    const leave = Number(rec.leave_days) || 0
    const trip = Number(rec.businiess_trip_days) || 0
    const excuse = Number(rec.full_day_excuses) || 0

    companyCounts.present += present
    companyCounts.absent += absent
    companyCounts.leave += leave
    companyCounts.trip += trip
    companyCounts.excuse += excuse

    deptObj.counts.present += present
    deptObj.counts.absent += absent
    deptObj.counts.leave += leave
    deptObj.counts.trip += trip
    deptObj.counts.excuse += excuse

    const empSum = present + absent + leave + trip + excuse
    if (empSum > maxEmployeeWorkingDays) {
      maxEmployeeWorkingDays = empSum
    }
  }

  const companyTotalRecords =
    companyCounts.present +
    companyCounts.absent +
    companyCounts.leave +
    companyCounts.trip +
    companyCounts.excuse

  const companyPercentages = calculatePercentages(companyCounts, companyTotalRecords)
  const companyAttendancePercent = companyTotalRecords > 0
    ? Math.round((companyCounts.present / companyTotalRecords) * 100)
    : 0

  const departments = []
  for (const dept of deptMap.values()) {
    const deptTotalRecords =
      dept.counts.present +
      dept.counts.absent +
      dept.counts.leave +
      dept.counts.trip +
      dept.counts.excuse

    const percentages = calculatePercentages(dept.counts, deptTotalRecords)
    const attendancePercent = deptTotalRecords > 0
      ? Math.round((dept.counts.present / deptTotalRecords) * 100)
      : 0

    departments.push({
      id: dept.id,
      name: dept.name,
      displayCode: dept.displayCode,
      employeeCount: dept.employeeIds.size,
      total: deptTotalRecords,
      counts: dept.counts,
      percentages,
      attendancePercent,
    })
  }

  return {
    company: {
      total: companyTotalRecords,
      counts: companyCounts,
      percentages: companyPercentages,
      attendancePercent: companyAttendancePercent,
    },
    departments,
    workingDays: maxEmployeeWorkingDays,
    totalRecords: companyTotalRecords,
  }
}
