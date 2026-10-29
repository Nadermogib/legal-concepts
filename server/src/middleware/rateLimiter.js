/**
 * @file rateLimiter.js
 * تحديد معدل الطلبات (Rate Limiting) على مسارات /api
 * 120 طلباً/دقيقة لكل عنوان IP وفق القسم 8.3 من المواصفات.
 */

import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // نافذة دقيقة واحدة
  limit: 120, // أقصى حد 120 طلباً
  standardHeaders: true, // إرجاع ترويسات RateLimit-* القياسية
  legacyHeaders: false, // تعطيل ترويسات X-RateLimit القديمة
  skip: (req) => {
    // استثناء نقطة فحص الصحة دائماً
    if (req.path === '/api/health' || req.path === '/health') return true
    // تخطي في بيئة الاختبار ما لم يُطلب فحصها عبر ترويسة مخصصة
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) return true
    return false
  },
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة بعد قليل',
      },
    })
  },
})
