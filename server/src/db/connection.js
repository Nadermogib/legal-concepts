/**
 * @file connection.js
 * إدارة الاتصال بقاعدة بيانات MongoDB Atlas عبر Mongoose
 * وفق الأقسام 4.1 و 8.1 (بدون طباعة بيانات الاتصال أو كلمات المرور في السجلات).
 */

import mongoose from 'mongoose'
import { config } from '../config.js'

/**
 * الاتصال بقاعدة البيانات
 * @param {string} [uri=config.mongodbUri]
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDb(uri = config.mongodbUri) {
  if (mongoose.connection.readyState === 1) {
    return mongoose
  }

  if (!uri) {
    throw new Error('رابط قاعدة البيانات MONGODB_URI غير متوفر')
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    })
    console.log('[MongoDB] تم الاتصال بقاعدة البيانات بنجاح.')
    return conn
  } catch (err) {
    // عدم طباعة رابط الاتصال لحماية كلمات المرور
    console.error(`[MongoDB] فشل الاتصال بقاعدة البيانات: ${err.message}`)
    throw err
  }
}

/**
 * إغلاق الاتصال بقاعدة البيانات
 * @returns {Promise<void>}
 */
export async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    console.log('[MongoDB] تم إغلاق الاتصال بقاعدة البيانات.')
  }
}
