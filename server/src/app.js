import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import { basicAuth } from './middleware/auth.js'
import { apiLimiter } from './middleware/rateLimiter.js'
import settingsRouter from './routes/settingsRoutes.js'
import overviewRouter from './routes/overviewRoutes.js'
import reportsRouter from './routes/reportsRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientDistPath = path.resolve(__dirname, '../../client/dist')

const app = express()

// أمان الترويسات (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // مسموح في التطوير ومعالجة SPA
  })
)

// منع الفهرسة لمحركات البحث (X-Robots-Tag)
app.use((_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  next()
})

// إعداد CORS
app.use(cors())

// معالجة JSON
app.use(express.json())

// فحص المصادقة الأساسية الاختياري (يستثني /api/health تلقائياً)
app.use(basicAuth)

/**
 * نقطة فحص الصحة
 * GET /api/health
 * ترجع { ok: true } بدون استدعاء جسر أو قاعدة البيانات
 */
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true })
})

// تطبيق تحديد معدل الطلبات على مسارات الـ API (120 طلب/دقيقة)
app.use('/api', apiLimiter)

// مسارات الإعدادات والدوائر
app.use('/api', settingsRouter)

// مسارات النظرة العامة
app.use('/api', overviewRouter)

// مسارات التقارير
app.use('/api', reportsRouter)

// استجابة 404 لمسارات /api غير المعرفة
app.all('/api/*', (_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'نقطة نهاية الـ API غير موجودة',
    },
  })
})

// خدمة ملفات الواجهة المبنية (client/dist) و SPA Fallback لجميع المسارات غير /api
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath))

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

// معالج الأخطاء الموحد وفق العقد في 7.1 بدون تسريب تفاصيل داخلية
app.use((err, _req, res, _next) => {
  const status = Number(err.status) || 500
  let code = err.code
  let message = err.message

  if (status === 400) {
    code = code || 'BAD_REQUEST'
    message = message || 'مدخلات الطلب غير صالحة'
  } else if (status === 401) {
    code = code || 'UNAUTHORIZED'
    message = message || 'مطلوب تسجيل الدخول للوصول إلى هذا المورد'
  } else if (status === 429) {
    code = code || 'TOO_MANY_REQUESTS'
    message = message || 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة بعد قليل'
  } else if (status === 502 || err.name === 'JisrHttpError' || code === 'JISR_UNAVAILABLE') {
    code = 'JISR_UNAVAILABLE'
    message = 'تعذر الاتصال بنظام جسر، يرجى المحاولة لاحقاً'
  } else {
    code = 'INTERNAL_SERVER_ERROR'
    message = 'حدث خطأ غير متوقع في الخادم'
  }

  // تسجيل آمن للخطأ دون أسرار
  console.error(`[Error] ${status} ${code}: ${err.message || message}`)

  res.status(status).json({
    error: {
      code,
      message,
    },
  })
})

export default app
