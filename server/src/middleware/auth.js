/**
 * @file auth.js
 * طبقة المصادقة الأساسية الاختيارية (Basic Auth)
 * وفق الأقسام 2، 8.2، 9.3 من المواصفات.
 * تتفعّل فقط عند وجود DASHBOARD_USER و DASHBOARD_PASS في متغيرات البيئة.
 * تستثني دائماً مسار فحص الصحة (/api/health).
 */

export function basicAuth(req, res, next) {
  // استثناء نقطة فحص الصحة دائماً
  if (req.path === '/api/health' || req.path === '/health') {
    return next()
  }

  const expectedUser = process.env.DASHBOARD_USER
  const expectedPass = process.env.DASHBOARD_PASS

  // إذا لم يتم تحديد اسم المستخدم وكلمة المرور، تمر المصادقة بدون طلب تسجيل الدخول
  if (!expectedUser || !expectedPass) {
    return next()
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Legal Concepts Attendance"')
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'مطلوب تسجيل الدخول للوصول إلى هذا المورد',
      },
    })
  }

  try {
    const base64Credentials = authHeader.slice(6).trim()
    const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8')
    const colonIndex = decoded.indexOf(':')
    if (colonIndex === -1) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Legal Concepts Attendance"')
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'بيانات الاعتماد غير صالحة',
        },
      })
    }

    const user = decoded.slice(0, colonIndex)
    const pass = decoded.slice(colonIndex + 1)

    // التحقق من صحة اسم المستخدم وكلمة المرور
    if (user !== expectedUser || pass !== expectedPass) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Legal Concepts Attendance"')
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        },
      })
    }

    return next()
  } catch (_e) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Legal Concepts Attendance"')
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'تعذر التحقق من بيانات الاعتماد',
      },
    })
  }
}
