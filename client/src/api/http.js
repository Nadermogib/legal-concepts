/**
 * @file http.js
 * عميل HTTP موحد مبني على axios مع مهلة 60 ثانية ومعالجة موحدة للأخطاء برسائل عربية
 */

import axios from 'axios'

/**
 * خطأ API مخصص يحمل الكود والرسالة العربية ورمز الحالة
 */
export class ApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status]
   */
  constructor(code, message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/**
 * تحويل أخطاء الشبكة والـ HTTP إلى كود ورسالة عربية مفهومة
 * @param {any} error
 * @returns {ApiError}
 */
export function normalizeHttpError(error) {
  // إذا كان الخطأ مجهزاً مسبقاً من الـ backend بصيغة { error: { code, message } }
  if (error?.response?.data?.error) {
    const { code, message } = error.response.data.error
    return new ApiError(
      code || 'API_ERROR',
      message || 'حدث خطأ أثناء معالجة الطلب.',
      error.response.status
    )
  }

  // انتهاء المهلة الزمنية
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return new ApiError(
      'TIMEOUT',
      'انتهت مهلة الطلب (60 ثانية). يرجى التحقق من جودة الاتصال وإعادة المحاولة.',
      408
    )
  }

  // انقطاع الاتصال بالشبكة أو تعذر الوصول للخادم
  if (!error?.response) {
    return new ApiError(
      'NETWORK_ERROR',
      'تعذّر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت وتوفر الخادم.',
      0
    )
  }

  const status = error.response.status

  switch (status) {
    case 400:
      return new ApiError('BAD_REQUEST', 'البيانات المرسلة غير صالحة. يرجى التحقق من المدخلات.', 400)
    case 401:
    case 403:
      return new ApiError('UNAUTHORIZED', 'غير مصرح بالوصول إلى هذه البيانات.', status)
    case 404:
      return new ApiError('NOT_FOUND', 'المسار أو المورد المطلوب غير موجود.', 404)
    case 429:
      return new ApiError('RATE_LIMITED', 'تم تجاوز عدد الطلبات المسموح به. يرجى الانتظار قليلاً ثم إعادة المحاولة.', 429)
    case 502:
      return new ApiError('JISR_GATEWAY_ERROR', 'تعذّر الاتصال بنظام جسر أو حدث خطأ في الاستجابة. يرجى المحاولة لاحقاً.', 502)
    case 503:
    case 504:
      return new ApiError('SERVICE_UNAVAILABLE', 'الخدمة غير متوفرة حالياً، قد يكون الخادم تحت الصيانة.', status)
    case 500:
    default:
      return new ApiError('SERVER_ERROR', 'حدث خطأ داخلي في الخادم أثناء معالجة الطلب.', status)
  }
}

// قراءة عنوان الـ API من متغيرات البيئة
const baseURL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : ''

/**
 * نسخة axios الموحدة للواجهة
 */
export const http = axios.create({
  baseURL,
  timeout: 60_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// استجابة الطلب: إرجاع data مباشرة والتقاط الأخطاء
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const normalized = normalizeHttpError(error)
    return Promise.reject(normalized)
  }
)

export default http
