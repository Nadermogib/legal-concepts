/**
 * @file config.js
 * قراءة متغيرات البيئة والتحقق من إلزاميتها عند بدء الخادم (وفق 9.3)
 * لا تطبع أي أسرار أو قيم في السجلات في حال الخطأ، بل تسمّي المتغيرات الناقصة فقط.
 */

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JISR_API_KEY',
  'JISR_SECRET',
]

/**
 * التحقق من وجود المتغيرات الإلزامية
 * @param {Record<string, string | undefined>} [env=process.env]
 * @returns {string[]} قائمة بأسماء المتغيرات المفقودة
 */
export function getMissingEnvVars(env = process.env) {
  return REQUIRED_ENV_VARS.filter((key) => {
    // دعم JISR_API_SECRET كاسم بديل لـ JISR_SECRET
    if (key === 'JISR_SECRET') {
      const secret = env.JISR_SECRET || env.JISR_API_SECRET
      return !secret || typeof secret !== 'string' || !secret.trim()
    }
    const val = env[key]
    return !val || typeof val !== 'string' || !val.trim()
  })
}

/**
 * التحقق الصارم وإيقاف العملية برسالة واضحة في حال غياب متغير إلزامي
 * @param {Record<string, string | undefined>} [env=process.env]
 */
export function validateConfig(env = process.env) {
  const missing = getMissingEnvVars(env)
  if (missing.length > 0) {
    console.error(
      `خطأ: المتغير البيئي الإلزامي التالي مفقود: ${missing.join(', ')}`
    )
    process.exit(1)
  }
}

/**
 * كائن الإعدادات المجمّع
 */
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  tz: process.env.TZ || 'Asia/Riyadh',
  mongodbUri: process.env.MONGODB_URI || '',
  jisr: {
    slug: process.env.JISR_SLUG || 'legalconcepts',
    apiKey: process.env.JISR_API_KEY || '',
    secret: process.env.JISR_SECRET || process.env.JISR_API_SECRET || '',
    baseUrl: (() => {
      let url = (process.env.JISR_BASE_URL || process.env.JISR_API_BASE_URL || 'https://apis.jisr.net/api').replace(/\/+$/, '')
      if (!url.endsWith('/api')) {
        url = `${url}/api`
      }
      return url
    })(),
  },
  workday: {
    start: process.env.WORKDAY_START || '06:00',
    end: process.env.WORKDAY_END || '16:00',
    attendanceWindowEnd: process.env.ATTENDANCE_WINDOW_END || '12:00',
    punchWindowStart: process.env.PUNCH_WINDOW_START || '06:00',
    punchWindowEnd: process.env.PUNCH_WINDOW_END || '17:00',
  },
  defaultEnabledDepartmentIds: process.env.DEFAULT_ENABLED_DEPARTMENT_IDS
    ? process.env.DEFAULT_ENABLED_DEPARTMENT_IDS.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['98210', '98211', '98212', '175765'],
  auth: {
    user: process.env.DASHBOARD_USER || '',
    pass: process.env.DASHBOARD_PASS || '',
    isEnabled: Boolean(process.env.DASHBOARD_USER && process.env.DASHBOARD_PASS),
  },
}
