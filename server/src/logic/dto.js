/**
 * @file dto.js
 * طبقة تحويل النماذج وتطهير البيانات (Data Transfer Objects)
 * تضمن الالتزام التام بعقد الردود في القسم 7.1 وتجريد أي بيانات حساسة أو غير مصرح بها
 * (مثل الرواتب، الآيبان، الهوية، الجوال، الإيميل) وفق الأقسام 4.3، 8.1، 11.2-11.
 */

import { resolveEmployeeName, cleanName, getDisplayCode } from './names.js'

/**
 * تحويل موظف خام إلى DTO نظيف ومطهّر
 * @param {Record<string, any>} emp كائن الموظف من جسر
 * @returns {{ id: string, code: string, name: string, avatarUrl: string | null, departmentId: string, departmentName: string }}
 */
export function toEmployeeDto(emp) {
  if (!emp) return null

  return {
    id: String(emp.id || ''),
    code: String(emp.code || ''),
    name: resolveEmployeeName(emp),
    avatarUrl: emp.avatar || null,
    departmentId: String(emp.department?.id || ''),
    departmentName: cleanName(emp.department?.name_ar || emp.department?.name || 'دائرة'),
  }
}

/**
 * تحويل دائرة إلى DTO نظيف
 * @param {Record<string, any>} dept
 * @param {boolean} isEnabled حالة تفعيل الدائرة
 * @param {number} employeeCount عدد الموظفين النشطين في الدائرة
 * @returns {{ id: string, name: string, displayCode: string | null, employeeCount: number, enabled: boolean }}
 */
export function toDepartmentDto(dept, isEnabled = false, employeeCount = 0) {
  if (!dept) return null

  return {
    id: String(dept.id || ''),
    name: cleanName(dept.name_ar || dept.name || 'دائرة'),
    displayCode: getDisplayCode(dept.name_en),
    employeeCount: Number(employeeCount) || 0,
    enabled: Boolean(isEnabled),
  }
}

/**
 * تجهيز رد النظرة العامة اليومية وفق عقد 7.1
 */
export function toDailyOverviewResponse({
  generatedAt = new Date().toISOString(),
  stale = false,
  date,
  isOffDay = false,
  company,
  departments,
}) {
  return {
    generatedAt,
    stale: Boolean(stale),
    date,
    isOffDay: Boolean(isOffDay),
    company: {
      total: company?.total || 0,
      counts: {
        present: company?.counts?.present || 0,
        absent: company?.counts?.absent || 0,
        leave: company?.counts?.leave || 0,
        trip: company?.counts?.trip || 0,
        excuse: company?.counts?.excuse || 0,
        notYet: company?.counts?.notYet || 0,
      },
      percentages: {
        present: company?.percentages?.present || 0,
        absent: company?.percentages?.absent || 0,
        leave: company?.percentages?.leave || 0,
        trip: company?.percentages?.trip || 0,
        excuse: company?.percentages?.excuse || 0,
        notYet: company?.percentages?.notYet || 0,
      },
      attendancePercent: company?.attendancePercent || 0,
    },
    departments: (departments || []).map((d) => ({
      id: String(d.id),
      name: String(d.name),
      displayCode: d.displayCode || null,
      employeeCount: d.employeeCount || 0,
      total: d.total || 0,
      counts: {
        present: d.counts?.present || 0,
        absent: d.counts?.absent || 0,
        leave: d.counts?.leave || 0,
        trip: d.counts?.trip || 0,
        excuse: d.counts?.excuse || 0,
        notYet: d.counts?.notYet || 0,
      },
      percentages: {
        present: d.percentages?.present || 0,
        absent: d.percentages?.absent || 0,
        leave: d.percentages?.leave || 0,
        trip: d.percentages?.trip || 0,
        excuse: d.percentages?.excuse || 0,
        notYet: d.percentages?.notYet || 0,
      },
      attendancePercent: d.attendancePercent || 0,
    })),
  }
}

/**
 * تجهيز رد النظرة العامة للفترة وفق عقد 7.1
 */
export function toPeriodOverviewResponse({
  generatedAt = new Date().toISOString(),
  stale = false,
  from,
  to,
  workingDays = 0,
  totalRecords = 0,
  company,
  departments,
}) {
  return {
    generatedAt,
    stale: Boolean(stale),
    from,
    to,
    workingDays: Number(workingDays) || 0,
    totalRecords: Number(totalRecords) || 0,
    company: {
      total: company?.total || 0,
      counts: {
        present: company?.counts?.present || 0,
        absent: company?.counts?.absent || 0,
        leave: company?.counts?.leave || 0,
        trip: company?.counts?.trip || 0,
        excuse: company?.counts?.excuse || 0,
      },
      percentages: {
        present: company?.percentages?.present || 0,
        absent: company?.percentages?.absent || 0,
        leave: company?.percentages?.leave || 0,
        trip: company?.percentages?.trip || 0,
        excuse: company?.percentages?.excuse || 0,
      },
      attendancePercent: company?.attendancePercent || 0,
    },
    departments: (departments || []).map((d) => ({
      id: String(d.id),
      name: String(d.name),
      displayCode: d.displayCode || null,
      employeeCount: d.employeeCount || 0,
      total: d.total || 0,
      counts: {
        present: d.counts?.present || 0,
        absent: d.counts?.absent || 0,
        leave: d.counts?.leave || 0,
        trip: d.counts?.trip || 0,
        excuse: d.counts?.excuse || 0,
      },
      percentages: {
        present: d.percentages?.present || 0,
        absent: d.percentages?.absent || 0,
        leave: d.percentages?.leave || 0,
        trip: d.percentages?.trip || 0,
        excuse: d.percentages?.excuse || 0,
      },
      attendancePercent: d.attendancePercent || 0,
    })),
  }
}

/**
 * تجهيز رد تقرير البصمة اليومي وفق عقد 7.1
 */
export function toDailyReportResponse({
  generatedAt = new Date().toISOString(),
  stale = false,
  date,
  isOffDay = false,
  summary,
  rows,
}) {
  return {
    generatedAt,
    stale: Boolean(stale),
    date,
    isOffDay: Boolean(isOffDay),
    summary: {
      attended: summary?.attended || 0,
      total: summary?.total || 0,
      late: summary?.late || 0,
      missingPunch: summary?.missingPunch || 0,
    },
    rows: (rows || []).map((r) => ({
      employeeId: String(r.employeeId),
      code: String(r.code),
      name: String(r.name),
      avatarUrl: r.avatarUrl || null,
      departmentId: String(r.departmentId),
      departmentName: String(r.departmentName),
      status: r.status,
      flags: {
        late: Boolean(r.flags?.late),
        singlePunch: Boolean(r.flags?.singlePunch),
      },
      lateMinutes: Number(r.lateMinutes) || 0,
      checkIn: r.checkIn || null,
      checkOut: r.checkOut || null,
      workedMinutes: r.workedMinutes !== null && r.workedMinutes !== undefined ? Number(r.workedMinutes) : null,
    })),
  }
}

/**
 * تجهيز رد تقرير البصمة الشهري وفق عقد 7.1
 */
export function toMonthlyReportResponse({
  generatedAt = new Date().toISOString(),
  stale = false,
  month,
  topLate,
  rows,
}) {
  return {
    generatedAt,
    stale: Boolean(stale),
    month,
    topLate: (topLate || []).map((item) => ({
      employeeId: String(item.employeeId),
      name: String(item.name),
      lateDays: Number(item.lateDays) || 0,
    })),
    rows: (rows || []).map((r) => ({
      employeeId: String(r.employeeId),
      code: String(r.code),
      name: String(r.name),
      avatarUrl: r.avatarUrl || null,
      departmentName: String(r.departmentName),
      lateDays: Number(r.lateDays) || 0,
      lateMinutes: Number(r.lateMinutes) || 0,
      absenceDays: Number(r.absenceDays) || 0,
      leaveDays: Number(r.leaveDays) || 0,
      earlyDepartureDays: Number(r.earlyDepartureDays) || 0,
      workedMinutes: Number(r.workedMinutes) || 0,
    })),
  }
}
