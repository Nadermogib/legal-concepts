/**
 * @file overviewRoutes.js
 * مسارات نقاط نهاية النظرة العامة (/api/overview/daily و /api/overview/period)
 * وفق الأقسام 5.4، 5.5، 6.1، 6.2، وعقد 7.1 من المواصفات.
 */

import { Router } from 'express'
import { jisrApi } from '../jisr/api.js'
import { getEnabledDepartmentIds } from '../services/settingsService.js'
import {
  todayRiyadh,
  validateDateRange,
} from '../logic/dates.js'
import { checkIsOffDay } from '../logic/status.js'
import {
  aggregateDailyOverview,
  aggregatePeriodOverview,
} from '../logic/aggregate.js'
import {
  toDailyOverviewResponse,
  toPeriodOverviewResponse,
} from '../logic/dto.js'

const router = Router()

/**
 * GET /api/overview/daily
 * النظرة العامة لليوم (الوضع اليومي)
 */
router.get('/overview/daily', async (req, res, next) => {
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true'
    const targetDate = req.query.date ? String(req.query.date).trim() : todayRiyadh()

    // التحقق من صحة تاريخ اليوم المطلوب (إن أُرسل)
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

    // 4. فحص ما إذا كان اليوم عطلة
    const isOffDay = checkIsOffDay(targetDate, summaryRecords)

    // 5. تجميع الإحصائيات اليومية
    const aggregated = aggregateDailyOverview({
      employees,
      summaryRecords,
      enabledDepartmentIds,
    })

    // 6. تحديد حالة حداثة البيانات (stale)
    const isStale = Boolean(employeesResult.stale || summaryResult.stale)
    const generatedAt = employeesResult.generatedAt || new Date().toISOString()

    // 7. تحويل الرد وفق عقد 7.1 بدقة
    const responseData = toDailyOverviewResponse({
      generatedAt,
      stale: isStale,
      date: targetDate,
      isOffDay,
      company: aggregated.company,
      departments: aggregated.departments,
    })

    return res.status(200).json(responseData)
  } catch (err) {
    return next(err)
  }
})

/**
 * GET /api/overview/period
 * النظرة العامة لفترة محددة (من تاريخ إلى تاريخ)
 */
router.get('/overview/period', async (req, res, next) => {
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true'
    const from = req.query.from ? String(req.query.from).trim() : ''
    const to = req.query.to ? String(req.query.to).trim() : ''

    // 1. التحقق الصارم من نطاق التواريخ
    const validation = validateDateRange(from, to)
    if (!validation.valid) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE_RANGE',
          message: validation.error,
        },
      })
    }

    // 2. جلب الموظفين النشطين
    const employeesResult = await jisrApi.getEmployees({ refresh })
    const employees = employeesResult.employees

    // 3. جلب الدوائر المفعّلة
    const enabledDepartmentIds = await getEnabledDepartmentIds({ employees })

    // 4. جلب ملخص الحضور للفترة المحددة بطلب واحد (وفق 5.5)
    const summaryResult = await jisrApi.getAttendanceSummary({
      from,
      to,
      refresh,
    })
    const summaryRecords = summaryResult.records

    // 5. تجميع إحصائيات الفترة
    const aggregated = aggregatePeriodOverview({
      employees,
      summaryRecords,
      enabledDepartmentIds,
    })

    // 6. تحديد حالة حداثة البيانات (stale)
    const isStale = Boolean(employeesResult.stale || summaryResult.stale)
    const generatedAt = employeesResult.generatedAt || new Date().toISOString()

    // 7. تحويل الرد وفق عقد 7.1 بدقة (بدون notYet وبدون isOffDay)
    const responseData = toPeriodOverviewResponse({
      generatedAt,
      stale: isStale,
      from,
      to,
      workingDays: aggregated.workingDays,
      totalRecords: aggregated.totalRecords,
      company: aggregated.company,
      departments: aggregated.departments,
    })

    return res.status(200).json(responseData)
  } catch (err) {
    return next(err)
  }
})

export default router
