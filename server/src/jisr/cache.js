/**
 * @file cache.js
 * نظام التخزين المؤقت في الذاكرة (In-Memory Cache) وفق القسم 9.4 من المواصفات.
 * يدعم TTL، واسترجاع البيانات القديمة (stale) عند تعذر الاتصال بنظام جسر،
 * وتجاوز التخزين عند طلب refresh=true.
 */

export class MemoryCache {
  constructor() {
    /** @type {Map<string, { data: any, cachedAt: Date, expiresAt: number }>} */
    this.store = new Map()
  }

  /**
   * حفظ عنصر في الذاكرة مع مدة صلاحية (TTL)
   * @param {string} key
   * @param {any} data
   * @param {number} ttlMs مدة الصلاحية بالمللي ثانية
   */
  set(key, data, ttlMs) {
    const now = Date.now()
    this.store.set(key, {
      data,
      cachedAt: new Date(now),
      expiresAt: now + ttlMs,
    })
  }

  /**
   * جلب عنصر من الذاكرة إذا كان صالحاً (غير منتهي الصلاحية)
   * @param {string} key
   * @returns {{ data: any, cachedAt: Date } | null}
   */
  get(key) {
    const item = this.store.get(key)
    if (!item) return null

    if (Date.now() > item.expiresAt) {
      return null // منتهي الصلاحية
    }

    return {
      data: item.data,
      cachedAt: item.cachedAt,
    }
  }

  /**
   * جلب البيانات القديمة (Stale) حتى لو انتهت صلاحيتها لاستخدامها كبديل عند تعطل جسر
   * @param {string} key
   * @returns {{ data: any, cachedAt: Date } | null}
   */
  getStale(key) {
    const item = this.store.get(key)
    if (!item) return null
    return {
      data: item.data,
      cachedAt: item.cachedAt,
    }
  }

  /**
   * حذف مفتاح محدد (مثلاً عند refresh=1)
   * @param {string} key
   */
  delete(key) {
    this.store.delete(key)
  }

  /**
   * مسح كامل الذاكرة المؤقتة
   */
  clear() {
    this.store.clear()
  }

  /**
   * عدد العناصر المخزنة حالياً
   */
  get size() {
    return this.store.size
  }
}

// كائن مفرد (Singleton) عام للـ backend
export const jisrCache = new MemoryCache()

// الثوابت الزمنية للتخزين المؤقت (بالمللي ثانية) وفق 9.4
export const CACHE_TTL = {
  EMPLOYEES: 15 * 60 * 1000,      // الموظفون: 15 دقيقة
  DAILY_SUMMARY: 60 * 1000,       // ملخص اليوم الحالي: 60 ثانية
  PERIOD_SUMMARY: 30 * 60 * 1000, // ملخص الفترات الماضية: 30 دقيقة
  DAILY_LOGS: 60 * 1000,          // البصمات اليومية: 60 ثانية
}
