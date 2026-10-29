/**
 * @file client.js
 * عميل HTTP لنظام جسر (Jisr API) وفق الأقسام 3.1، 3.2، 3.6.1، 8.1.
 */

import { config } from '../config.js'
import { jisrSemaphore } from './semaphore.js'

export class JisrHttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'JisrHttpError'
    this.status = status
  }
}

export class JisrClient {
  /**
   * @param {Object} [options={}]
   * @param {string} [options.baseUrl]
   * @param {string} [options.apiKey]
   * @param {string} [options.secret]
   * @param {string} [options.slug]
   * @param {number} [options.timeoutMs=20000]
   * @param {number[]} [options.retryDelays=[1000, 2000, 4000]]
   * @param {any} [options.fetchFn=globalThis.fetch]
   * @param {import('./semaphore.js').Semaphore} [options.semaphore=jisrSemaphore]
   */
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || config.jisr.baseUrl || 'https://apis.jisr.net').replace(/\/+$/, '')
    this.apiKey = options.apiKey || config.jisr.apiKey || ''
    this.secret = options.secret || config.jisr.secret || ''
    this.slug = options.slug || config.jisr.slug || ''
    this.timeoutMs = options.timeoutMs ?? 20000
    this.retryDelays = options.retryDelays || [1000, 2000, 4000]
    this.fetchFn = options.fetchFn || globalThis.fetch
    this.semaphore = options.semaphore || jisrSemaphore

    /** @type {string | null} التوكن المحفوظ في الذاكرة فقط */
    this.token = null

    /** @type {Promise<string> | null} Promise مشترك لمنع المصادقة المتوازية */
    this.authPromise = null
  }

  /**
   * مصادقة مع جسر والحصول على التوكن
   * @returns {Promise<string>}
   */
  async authenticate() {
    if (this.token) {
      return this.token
    }

    if (this.authPromise) {
      return this.authPromise
    }

    this.authPromise = (async () => {
      const url = `${this.baseUrl}/openapi/v1/auth`
      const headers = {
        'api-key': this.apiKey,
        secret: this.secret,
        'api-version': '1',
        source: 'open_api',
      }
      if (this.slug) {
        headers.slug = this.slug
      }

      const start = Date.now()
      let status = 0
      try {
        const response = await this.fetchFn(url, {
          method: 'POST',
          headers,
          signal: AbortSignal.timeout(this.timeoutMs),
        })
        status = response.status
        const duration = Date.now() - start
        console.log(`[Jisr] POST /openapi/v1/auth ${status} (${duration}ms)`)

        if (!response.ok) {
          throw new JisrHttpError(status, `فشلت مصادقة جسر برمز: ${status}`)
        }

        const data = await response.json()
        const token = data?.data
        if (!token || typeof token !== 'string') {
          throw new Error('لم يعد رد مصادقة جسر توكن صالحاً')
        }

        this.token = token
        return token
      } catch (err) {
        if (!status) {
          const duration = Date.now() - start
          console.error(`[Jisr] POST /openapi/v1/auth FAILED (${duration}ms): ${err.message}`)
        }
        throw err
      } finally {
        this.authPromise = null
      }
    })()

    return this.authPromise
  }

  /**
   * تنفيذ طلب فردي مع التوكن والمهلة وتسجيل المدة
   * @private
   */
  async _executeRequest(path, query = {}) {
    const token = await this.authenticate()

    const url = new URL(`${this.baseUrl}${path}`)
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v))
      }
    }

    const headers = {
      'Access-Token': token,
      'api-version': '1',
    }
    if (this.slug) {
      headers.slug = this.slug
    }

    const start = Date.now()
    let status = 0
    try {
      const response = await this.fetchFn(url.toString(), {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(this.timeoutMs),
      })
      status = response.status
      const duration = Date.now() - start
      console.log(`[Jisr] GET ${path} ${status} (${duration}ms)`)

      const text = await response.text()
      let body = null
      try {
        body = JSON.parse(text)
      } catch {
        body = { rawText: text }
      }

      return {
        ok: response.ok,
        status,
        body,
      }
    } catch (err) {
      const duration = Date.now() - start
      console.error(`[Jisr] GET ${path} ERROR (${duration}ms): ${err.message}`)
      throw err
    }
  }

  /**
   * طلب GET لجسر مع دعم إعادة المصادقة وإعادة المحاولة التلقائية ومحدد التوازي
   * @param {string} path مسار الـ endpoint
   * @param {Record<string, any>} [query={}] المعاملات
   * @param {boolean} [isRetryAfterAuth=false] هل هذه محاولة ثانية بعد تجديد التوكن
   * @returns {Promise<any>}
   */
  async request(path, query = {}, isRetryAfterAuth = false) {
    return this.semaphore.run(async () => {
      let attempts = 0
      const maxRetries = this.retryDelays.length

      while (true) {
        try {
          const res = await this._executeRequest(path, query)

          // 1. فحص انتهاء الجلسة أو طلب إعادة المصادقة (وفق 3.2)
          const errorMsg = String(res.body?.message || res.body?.error || '')
          const requiresLogin =
            res.status === 401 ||
            errorMsg.includes('This call requires login') ||
            errorMsg.includes('Your account has been logged out')

          if (requiresLogin) {
            this.token = null // إبطال التوكن القديم

            if (!isRetryAfterAuth) {
              console.log(`[Jisr] انتهت صلاحية الجلسة عند طلب ${path}. جارٍ إعادة المصادقة مرة واحدة...`)
              return await this.request(path, query, true)
            } else {
              throw new JisrHttpError(401, `فشلت إعادة المصادقة مع جسر لطلب ${path} بعد المحاولة الثانية`)
            }
          }

          // 2. إعادة المحاولة عند 429 و 5xx فقط (وفق 3.6.1)
          const isRateLimitOr5xx = res.status === 429 || (res.status >= 500 && res.status < 600)
          if (isRateLimitOr5xx) {
            if (attempts < maxRetries) {
              const delay = this.retryDelays[attempts]
              attempts++
              console.warn(`[Jisr] استُقبل رمز ${res.status}. إعادة المحاولة (${attempts}/${maxRetries}) بعد ${delay}ms...`)
              await new Promise((r) => setTimeout(r, delay))
              continue
            }
            throw new JisrHttpError(res.status, `رد جسر برمز خطأ ${res.status} بعد استنفاد محاولات الإعادة`)
          }

          // 3. أخطاء العميل 4xx الأخرى (مثل 400، 403، 404): لا تعاد المحاولة
          if (!res.ok) {
            throw new JisrHttpError(res.status, `رد جسر برمز خطأ غير معالج: ${res.status}`)
          }

          return res.body
        } catch (err) {
          // أخطاء HTTP العادية (مثل 400 أو أخطاء المصادقة النهائية): لا تعاد المحاولة
          if (err instanceof JisrHttpError) {
            throw err
          }

          // أخطاء الشبكة والاتصال فقط: تعاد المحاولة
          if (attempts < maxRetries && !isRetryAfterAuth && err.name !== 'AbortError') {
            const delay = this.retryDelays[attempts]
            attempts++
            console.warn(`[Jisr] فشل طلب الشبكة (${err.message}). إعادة المحاولة (${attempts}/${maxRetries}) بعد ${delay}ms...`)
            await new Promise((r) => setTimeout(r, delay))
            continue
          }
          throw err
        }
      }
    })
  }

  /**
   * التصفح عبر الصفحات (Pagination)
   * @template T
   * @param {string} path المسار
   * @param {Record<string, any>} query المعاملات الأساسية
   * @param {(data: any) => T[]} extractFn دالة استخراج المصفوفة من الرد
   * @param {number} [pageSize=100] حجم الصفحة
   * @returns {Promise<T[]>}
   */
  async fetchAllPages(path, query, extractFn, pageSize = 100) {
    let page = 1
    const allItems = []

    while (true) {
      const pageQuery = {
        ...query,
        page,
        rpp: pageSize,
        limit: pageSize,
      }

      const res = await this.request(path, pageQuery)
      const items = extractFn(res) || []

      if (!Array.isArray(items) || items.length === 0) {
        break
      }

      allItems.push(...items)

      const pagination = res.pagination || res.data?.pagination
      if (pagination && pagination.next_page === null) {
        break
      }

      if (items.length < pageSize) {
        break
      }

      page++
    }

    return allItems
  }
}

export const jisrClient = new JisrClient()
