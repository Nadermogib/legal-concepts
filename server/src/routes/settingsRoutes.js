/**
 * @file settingsRoutes.js
 * مسارات نقاط النهاية للدوائر والإعدادات (/api/departments و /api/settings)
 * وفق الأقسام 4.1، 4.2، 7.1 من المواصفات.
 */

import { Router } from 'express'
import { jisrApi } from '../jisr/api.js'
import {
  getEnabledDepartmentIds,
  updateEnabledDepartmentIds,
  buildDepartmentsList,
} from '../services/settingsService.js'

const router = Router()

/**
 * GET /api/departments
 * استخراج قائمة الدوائر النشطة من الموظفين النشطين مع العدادات وحالة التفعيل
 */
router.get('/departments', async (req, res, next) => {
  try {
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true'
    const { employees } = await jisrApi.getEmployees({ refresh })
    const enabledIds = await getEnabledDepartmentIds({ employees })
    const response = buildDepartmentsList(employees, enabledIds)
    return res.status(200).json(response)
  } catch (err) {
    return next(err)
  }
})

/**
 * GET /api/settings
 * قراءة الإعدادات الحالية للدوائر المفعّلة
 */
router.get('/settings', async (_req, res, next) => {
  try {
    const enabledDepartmentIds = await getEnabledDepartmentIds()
    return res.status(200).json({ enabledDepartmentIds })
  } catch (err) {
    return next(err)
  }
})

/**
 * PUT /api/settings
 * تحديث قائمة الدوائر المفعّلة مع التحقق الصارم
 */
router.put('/settings', async (req, res, next) => {
  try {
    const newIds = req.body?.enabledDepartmentIds

    // جلب الدوائر المتاحة في جسر للتحقق من وجود المعرفات
    const { employees } = await jisrApi.getEmployees()
    const availableIds = employees
      .map((e) => e?.department?.id)
      .filter(Boolean)
      .map(String)

    const result = await updateEnabledDepartmentIds(newIds, {
      availableDepartmentIds: availableIds,
    })

    return res.status(200).json(result)
  } catch (err) {
    if (err.status === 400 || err.code === 'INVALID_SETTINGS' || err.code === 'INVALID_DEPARTMENT_ID') {
      return res.status(400).json({
        error: {
          code: err.code || 'INVALID_INPUT',
          message: err.message,
        },
      })
    }
    return next(err)
  }
})

export default router
