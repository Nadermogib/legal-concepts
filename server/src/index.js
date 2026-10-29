/**
 * @file index.js
 * نقطة الدخول الرئيسية لتشغيل خادم Express
 */

import { config, validateConfig } from './config.js'
import app from './app.js'
import { connectDb, disconnectDb } from './db/connection.js'

// التحقق من المتغيرات الإلزامية قبل بدء الخادم (وفق 9.3)
validateConfig()

// الاتصال بقاعدة بيانات MongoDB Atlas
try {
  await connectDb()
} catch (err) {
  console.error('[Server] تنبيه: استمر الخادم رغم تعذر الاتصال بـ MongoDB:', err.message)
}

const server = app.listen(config.port, () => {
  console.log(`[Server] يعمل الخادم على المنفذ ${config.port} في وضع ${config.nodeEnv}`)
})

// إيقاف هادئ للخادم عند استقبال إشارات الإنهاء
async function shutdown(signal) {
  console.log(`\n[Server] استُقبلت إشارة ${signal}. جارٍ إغلاق الخادم...`)
  await disconnectDb()
  server.close(() => {
    console.log('[Server] تم إغلاق الخادم بنجاح.')
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
