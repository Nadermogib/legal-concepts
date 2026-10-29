/**
 * @file client.js
 * طبقة الـ API الموحدة لكافة نقاط النهاية.
 * تتصل مباشرة بالخادم (Backend) عبر HTTP مع دعم معالجة الأخطاء والتحديث الفوري.
 */

import { http } from './http.js'
import { ENDPOINTS } from './endpoints.js'

/**
 * فحص صحة الخادم
 * GET /api/health
 */
export async function getHealth() {
  return http.get(ENDPOINTS.HEALTH)
}

/**
 * جلب قائمة الدوائر
 * GET /api/departments
 */
export async function getDepartments() {
  return http.get(ENDPOINTS.DEPARTMENTS)
}

/**
 * جلب إعدادات الدوائر المفعّلة
 * GET /api/settings
 */
export async function getSettings() {
  return http.get(ENDPOINTS.SETTINGS)
}

/**
 * تحديث إعدادات الدوائر المفعّلة
 * PUT /api/settings
 * @param {{ enabledDepartmentIds: string[] }} body
 */
export async function updateSettings(body) {
  if (!body || !Array.isArray(body.enabledDepartmentIds) || body.enabledDepartmentIds.length === 0) {
    const error = new Error('يجب تفعيل دائرة واحدة على الأقل.')
    error.code = 'INVALID_SETTINGS'
    error.status = 400
    throw error
  }
  return http.put(ENDPOINTS.SETTINGS, body)
}

/**
 * جلب النظرة العامة اليومية
 * GET /api/overview/daily
 * @param {{ refresh?: boolean }} [options]
 */
export async function getDailyOverview({ refresh = false } = {}) {
  return http.get(ENDPOINTS.OVERVIEW_DAILY, {
    params: refresh ? { refresh: 1 } : undefined,
  })
}

/**
 * جلب النظرة العامة لفترة محددة
 * GET /api/overview/period
 * @param {{ from: string, to: string, refresh?: boolean }} params
 */
export async function getPeriodOverview({ from, to, refresh = false }) {
  return http.get(ENDPOINTS.OVERVIEW_PERIOD, {
    params: {
      from,
      to,
      ...(refresh ? { refresh: 1 } : {}),
    },
  })
}

/**
 * جلب تقرير البصمة اليومي
 * GET /api/reports/daily
 * @param {{ refresh?: boolean }} [options]
 */
export async function getDailyReport({ refresh = false } = {}) {
  return http.get(ENDPOINTS.REPORTS_DAILY, {
    params: refresh ? { refresh: 1 } : undefined,
  })
}

/**
 * جلب تقرير البصمة الشهري
 * GET /api/reports/monthly
 * @param {{ month: string, refresh?: boolean }} params
 */
export async function getMonthlyReport({ month, refresh = false }) {
  return http.get(ENDPOINTS.REPORTS_MONTHLY, {
    params: {
      month,
      ...(refresh ? { refresh: 1 } : {}),
    },
  })
}
