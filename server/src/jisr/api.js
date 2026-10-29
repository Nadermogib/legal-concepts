/**
 * @file api.js
 * واجهة العمليات عالية المستوى للتواصل مع جسر، مع دمج التخزين المؤقت (Cache)
 * وتطهير البيانات الحساسة وفق الأقسام 3.3، 3.4، 3.6، 4.3، 9.4.
 */

import { jisrClient } from './client.js'
import { jisrCache, CACHE_TTL } from './cache.js'
import { todayRiyadh } from '../logic/dates.js'

/**
 * تنظيف وتجريد بيانات الموظف من الحقول الحساسة فور استلامها (وفق 3.4 و 4.3)
 * @param {Record<string, any>} emp
 * @returns {Record<string, any>}
 */
export function sanitizeRawEmployee(emp) {
  if (!emp || typeof emp !== 'object') return null

  return {
    id: String(emp.id || ''),
    code: String(emp.code || ''),
    full_name_ar: emp.full_name_ar || null,
    full_name_en: emp.full_name_en || null,
    avatar: emp.avatar || null,
    is_active: Boolean(emp.is_active),
    department: {
      id: String(emp.department?.id || ''),
      name_ar: emp.department?.name_ar || emp.department?.name || '',
      name_en: emp.department?.name_en || '',
    },
  }
}

export class JisrApi {
  /**
   * @param {Object} [options={}]
   * @param {import('./client.js').JisrClient} [options.client=jisrClient]
   * @param {import('./cache.js').MemoryCache} [options.cache=jisrCache]
   */
  constructor(options = {}) {
    this.client = options.client || jisrClient
    this.cache = options.cache || jisrCache
  }

  /**
   * جلب قائمة الموظفين النشطين مع التخزين المؤقت (15 دقيقة) وتطهير الحقول
   * @param {Object} [options={}]
   * @param {boolean} [options.refresh=false]
   * @returns {Promise<{ employees: Array<any>, stale: boolean, generatedAt: string }>}
   */
  async getEmployees({ refresh = false } = {}) {
    const cacheKey = 'employees'

    if (!refresh) {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        return {
          employees: cached.data,
          stale: false,
          generatedAt: cached.cachedAt.toISOString(),
        }
      }
    }

    try {
      const rawEmployees = await this.client.fetchAllPages(
        '/openapi/v1/employees',
        { status: 'active' },
        (res) => res?.data?.employees || res?.data || []
      )

      // فلترة النشطين وتجريد الحقول الحساسة فوراً (وفق 3.4)
      const sanitized = rawEmployees
        .filter((e) => e && e.is_active === true)
        .map(sanitizeRawEmployee)
        .filter(Boolean)

      this.cache.set(cacheKey, sanitized, CACHE_TTL.EMPLOYEES)

      return {
        employees: sanitized,
        stale: false,
        generatedAt: new Date().toISOString(),
      }
    } catch (err) {
      // محاولة استرجاع البيانات القديمة عند تعطل جسر (وفق 9.4)
      const stale = this.cache.getStale(cacheKey)
      if (stale) {
        console.warn('[Jisr] فشل جلب الموظفين، استرجاع النسخة المخزنة مسبقاً (stale: true)')
        return {
          employees: stale.data,
          stale: true,
          generatedAt: stale.cachedAt.toISOString(),
        }
      }
      throw err
    }
  }

  /**
   * جلب ملخص الحضور اليومي أو لفترة مع التخزين المؤقت الذكي
   * @param {Object} params
   * @param {string} params.from بصيغة YYYY-MM-DD
   * @param {string} params.to بصيغة YYYY-MM-DD
   * @param {boolean} [params.refresh=false]
   * @returns {Promise<{ records: Array<any>, stale: boolean, generatedAt: string }>}
   */
  async getAttendanceSummary({ from, to, refresh = false }) {
    const cacheKey = `summary:${from}:${to}`

    if (!refresh) {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        return {
          records: cached.data,
          stale: false,
          generatedAt: cached.cachedAt.toISOString(),
        }
      }
    }

    // تحديد مدة الـ TTL حسب نوع الفترة (وفق 9.4)
    const today = todayRiyadh()
    let ttl = CACHE_TTL.DAILY_SUMMARY // الافتراضي 60 ثانية لليوم الحالي
    if (to < today) {
      ttl = CACHE_TTL.PERIOD_SUMMARY // 30 دقيقة للفترات الماضية بالكامل
    }

    try {
      // تحويل التاريخ لصيغة جسر المطلوبة: yyyy/MM/dd (وفق 3.3)
      const jisrFrom = from.replace(/-/g, '/')
      const jisrTo = to.replace(/-/g, '/')

      const records = await this.client.fetchAllPages(
        '/openapi/v1/attendance/summary',
        { from: jisrFrom, to: jisrTo, status: 'active' },
        (res) => res?.data?.records || []
      )

      this.cache.set(cacheKey, records, ttl)

      return {
        records,
        stale: false,
        generatedAt: new Date().toISOString(),
      }
    } catch (err) {
      const stale = this.cache.getStale(cacheKey)
      if (stale) {
        console.warn(`[Jisr] فشل جلب ملخص الحضور، استرجاع النسخة المخزنة مسبقاً (stale: true)`)
        return {
          records: stale.data,
          stale: true,
          generatedAt: stale.cachedAt.toISOString(),
        }
      }
      throw err
    }
  }

  /**
   * جلب سجلات البصمات لليوم المحدد مع التخزين المؤقت (60 ثانية)
   * @param {Object} params
   * @param {string} params.date بصيغة YYYY-MM-DD
   * @param {boolean} [params.refresh=false]
   * @returns {Promise<{ punches: Array<any>, stale: boolean, generatedAt: string }>}
   */
  async getAttendanceLogs({ date, refresh = false }) {
    const cacheKey = `logs:${date}`

    if (!refresh) {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        return {
          punches: cached.data,
          stale: false,
          generatedAt: cached.cachedAt.toISOString(),
        }
      }
    }

    try {
      // جسر يتوقع from و to بصيغة YYYY-MM-DD HH:mm:ss لليوم كاملاً (وفق 3.6 و 6.4)
      const punches = await this.client.fetchAllPages(
        '/openapi/v1/attendance_logs',
        {
          status: 'success',
          from: `${date} 00:00:00`,
          to: `${date} 23:59:59`,
        },
        (res) => res?.data?.punches || res?.punches || []
      )

      this.cache.set(cacheKey, punches, CACHE_TTL.DAILY_LOGS)

      return {
        punches,
        stale: false,
        generatedAt: new Date().toISOString(),
      }
    } catch (err) {
      const stale = this.cache.getStale(cacheKey)
      if (stale) {
        console.warn(`[Jisr] فشل جلب البصمات، استرجاع النسخة المخزنة مسبقاً (stale: true)`)
        return {
          punches: stale.data,
          stale: true,
          generatedAt: stale.cachedAt.toISOString(),
        }
      }
      throw err
    }
  }
}

export const jisrApi = new JisrApi()
