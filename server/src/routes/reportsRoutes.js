/**
 * @file reportsRoutes.js
 * مسارات نقاط نهاية تقارير البصمة اليومية والشهرية (/api/reports/daily و /api/reports/monthly)
 * وفق الأقسام 5.3، 5.7، 6.3، 6.4، وعقد 7.1 من المواصفات.
 */

import { Router } from 'express'
import { config } from '../config.js'
import { jisrApi } from '../jisr/api.js'
import { getEnabledDepartmentIds } from '../services/settingsService.js'
import { todayRiyadh, currentRiyadhTime, validateDateRange, validateMonth, monthBounds } from '../logic/dates.js'
import { checkIsOffDay } from '../logic/status.js'
import { buildDailyReport, buildMonthlyReport } from '../logic/reports.js'
import { toDailyReportResponse, toMonthlyReportResponse } from '../logic/dto.js'

const router = Router()

/**
 * GET /api/reports/daily
 * تقرير البصمة اليومي لجميع موظفي الدوائر المفعّلة
 */
router.get('/reports/daily', async (req, res, next) => {
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true'
    const targetDate = req.query.date ? String(req.query.date).trim() : todayRiyadh()

    // التحقق من صحة تاريخ اليوم
    if (req.query.date) {
      const validation = validateDateRange(targetDate, targetDate)
      if (!validation.valid) {
        return res.status(400).json({
          error: {
            code: 'INVALID_DATE',
            message: validation.error,
          },
        })
      }
    }

    // 1. جلب الموظفين النشطين
    const employeesResult = await jisrApi.getEmployees({ refresh })
    const employees = employeesResult.employees

    // 2. جلب الدوائر المفعّلة
    const enabledDepartmentIds = await getEnabledDepartmentIds({ employees })

    // 3. جلب ملخص الحضور لليوم من جسر
    const summaryResult = await jisrApi.getAttendanceSummary({
      from: targetDate,
      to: targetDate,
      refresh,
    })
    const summaryRecords = summaryResult.records

    // 4. جلب بصمات اليوم من attendance_logs (وفق 3.6 و 6.4)
    const logsResult = await jisrApi.getAttendanceLogs({
      date: targetDate,
      refresh,
    })
    const punches = logsResult.punches

    // 5. فحص ما إذا كان اليوم عطلة
    const isOffDay = checkIsOffDay(targetDate, summaryRecords)

    // 6. بناء التقرير اليومي ودمج البصمات والحالات
    const reportData = buildDailyReport({
      employees,
      summaryRecords,
      punches,
      enabledDepartmentIds,
      punchWindowStart: config.workday.punchWindowStart || '06:00',
      punchWindowEnd: config.workday.punchWindowEnd || '17:00',
      workdayEnd: config.workday.end || '16:00',
      targetDate,
      currentDate: todayRiyadh(),
      currentTime: currentRiyadhTime(),
    })

    // 7. تحديد حالة الحداثة (stale)
    const isStale = Boolean(employeesResult.stale || summaryResult.stale || logsResult.stale)
    const generatedAt = employeesResult.generatedAt || new Date().toISOString()

    // 8. تحويل وتجهيز الرد وفق عقد 7.1
    const responseData = toDailyReportResponse({
      generatedAt,
      stale: isStale,
      date: targetDate,
      isOffDay,
      summary: reportData.summary,
      rows: reportData.rows,
    })

    return res.status(200).json(responseData)
  } catch (err) {
    return next(err)
  }
})

/**
 * GET /api/reports/monthly
 * تقرير البصمة الشهري لجميع موظفي الدوائر المفعّلة وفق الأقسام 5.7 و 6.5 وعقد 7.1
 */
router.get('/reports/monthly', async (req, res, next) => {
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true'
    const today = todayRiyadh()
    const currentMonth = today.slice(0, 7)
    const targetMonth = req.query.month ? String(req.query.month).trim() : currentMonth

    // التحقق من صحة الشهر
    const validation = validateMonth(targetMonth, currentMonth)
    if (!validation.valid) {
      return res.status(400).json({
        error: {
          code: 'INVALID_MONTH',
          message: validation.error,
        },
      })
    }

    // تحديد نطاق الشهر (من أول الشهر إلى آخره، أو إلى اليوم إن كان الشهر الحالي - وفق 5.7)
    const bounds = monthBounds(targetMonth)
    const from = bounds.from
    const to = targetMonth === currentMonth ? today : bounds.to

    // 1. جلب الموظفين النشطين
    const employeesResult = await jisrApi.getEmployees({ refresh })
    const employees = employeesResult.employees

    // 2. جلب الدوائر المفعّلة
    const enabledDepartmentIds = await getEnabledDepartmentIds({ employees })

    // 3. جلب ملخص الحضور للشهر من جسر
    const summaryResult = await jisrApi.getAttendanceSummary({
      from,
      to,
      refresh,
    })
    const summaryRecords = summaryResult.records

    // 4. بناء التقرير الشهري
    const reportData = buildMonthlyReport({
      employees,
      summaryRecords,
      enabledDepartmentIds,
    })

    // 5. تحديد حالة الحداثة (stale) وتاريخ التوليد
    const isStale = Boolean(employeesResult.stale || summaryResult.stale)
    const generatedAt = employeesResult.generatedAt || new Date().toISOString()

    // 6. تحويل وتجهيز الرد وفق عقد 7.1
    const responseData = toMonthlyReportResponse({
      generatedAt,
      stale: isStale,
      month: targetMonth,
      topLate: reportData.topLate,
      rows: reportData.rows,
    })

    return res.status(200).json(responseData)
  } catch (err) {
    return next(err)
  }
})

export default router
