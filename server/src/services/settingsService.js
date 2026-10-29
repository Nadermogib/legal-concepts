/**
 * @file settingsService.js
 * خدمة إدارة الإعدادات والدوائر وفق الأقسام 4.1، 4.2، 7.1، 10 من المواصفات.
 * تدعم:
 * - البذر الأولي عند أول تشغيل من المتغيرات أو الأسماء العربية
 * - التحقق الصارم من صحة المدخلات ورفض القائمة الفارغة أو المعرفات غير الموجودة
 * - استخراج قائمة الدوائر مع العدادات وحالة التفعيل وكود العرض
 */

import mongoose from 'mongoose'
import { Settings } from '../models/Settings.js'
import { config } from '../config.js'
import { cleanName, getDisplayCode, normalizeArabic } from '../logic/names.js'

// ذاكرة احتياطية عند عدم توفر اتصال بقاعدة البيانات (مثل الاختبارات السريعة)
let memoryFallbackIds = null

// الكلمات المفتاحية لمطابقة الدوائر الافتراضية بالاسم العربي (وفق القسم 4.1)
const DEFAULT_DEPT_KEYWORDS = [
  'الاعمال القانونيه الاولي',
  'الاعمال القانونيه الثانيه',
  'الاعمال القانونيه الثالثه',
  'البحوث والتدريب',
]

/**
 * تحديد معرفات الدوائر المفعّلة افتراضياً للبذر الأولي
 * @param {Array<any>} [employees=[]] قائمة الموظفين للبحث بالاسم العربي إن لزم
 * @returns {string[]}
 */
export function resolveInitialDepartmentIds(employees = []) {
  if (config.defaultEnabledDepartmentIds && config.defaultEnabledDepartmentIds.length > 0) {
    return config.defaultEnabledDepartmentIds.map(String)
  }

  // في حال غياب المتغير، نبحث بالاسم العربي في الموظفين النشطين
  const matchedIds = new Set()
  for (const emp of employees) {
    const dept = emp?.department
    if (!dept || !dept.id) continue
    const norm = normalizeArabic(dept.name_ar || dept.name || '')
    for (const keyword of DEFAULT_DEPT_KEYWORDS) {
      if (norm.includes(keyword)) {
        matchedIds.add(String(dept.id))
      }
    }
  }

  if (matchedIds.size > 0) {
    return Array.from(matchedIds)
  }

  // الافتراضي النهائي المؤكد في المواصفات لشركة المفاهيم القانونية
  return ['98210', '98211', '98212', '175765']
}

/**
 * جلب معرفات الدوائر المفعّلة حالياً (مع البذر الأولي إن لم توجد)
 * @param {Object} [options={}]
 * @param {Array<any>} [options.employees=[]]
 * @param {any} [options.model=Settings]
 * @returns {Promise<string[]>}
 */
export async function getEnabledDepartmentIds({ employees = [], model = Settings } = {}) {
  // إذا لم تكن قاعدة البيانات متصلة، نستخدم الذاكرة أو الافتراضي فوراً بدون انتظار
  if (model === Settings && mongoose.connection.readyState !== 1) {
    if (memoryFallbackIds) return memoryFallbackIds
    memoryFallbackIds = resolveInitialDepartmentIds(employees)
    return memoryFallbackIds
  }

  try {
    let settingsDoc = await model.findOne({ key: 'app' })

    if (!settingsDoc) {
      const initialIds = resolveInitialDepartmentIds(employees)
      settingsDoc = await model.create({
        key: 'app',
        enabledDepartmentIds: initialIds,
      })
      console.log(`[Settings] تم البذر الأولي للإعدادات بالدوائر: ${initialIds.join(', ')}`)
    }

    return (settingsDoc.enabledDepartmentIds || []).map(String)
  } catch (err) {
    console.warn(`[Settings] تعذر القراءة من قاعدة البيانات (${err.message})، استخدام الإعدادات الافتراضية`)
    return resolveInitialDepartmentIds(employees)
  }
}

/**
 * تحديث قائمة الدوائر المفعّلة مع التحقق الصارم
 * @param {any} newIds قائمة المعرفات الجديدة
 * @param {Object} [options={}]
 * @param {string[] | null} [options.availableDepartmentIds=null] قائمة المعرفات الصالحة في جسر
 * @param {any} [options.model=Settings]
 * @returns {Promise<{ enabledDepartmentIds: string[] }>}
 */
export async function updateEnabledDepartmentIds(
  newIds,
  { availableDepartmentIds = null, model = Settings } = {}
) {
  // 1. التحقق من أن المدخل مصفوفة
  if (!Array.isArray(newIds)) {
    const error = new Error('يجب إرسال enabledDepartmentIds كمصفوفة من المعرفات')
    error.status = 400
    error.code = 'INVALID_SETTINGS'
    throw error
  }

  // 2. تنظيف المعرفات واستبعاد التكرار والفراغات
  const cleanedIds = Array.from(
    new Set(newIds.map((id) => (id !== null && id !== undefined ? String(id).trim() : '')).filter(Boolean))
  )

  // 3. التحقق من وجود دائرة واحدة على الأقل (وفق القسم 4.49 و 10)
  if (cleanedIds.length === 0) {
    const error = new Error('فعّل دائرة واحدة على الأقل')
    error.status = 400
    error.code = 'INVALID_SETTINGS'
    throw error
  }

  // 4. التحقق من أن جميع المعرفات موجودة في دوائر جسر النشطة (وفق 11.3)
  if (availableDepartmentIds && Array.isArray(availableDepartmentIds)) {
    const availableSet = new Set(availableDepartmentIds.map(String))
    for (const id of cleanedIds) {
      if (!availableSet.has(id)) {
        const error = new Error(`معرف الدائرة غير صالح أو غير موجود: ${id}`)
        error.status = 400
        error.code = 'INVALID_DEPARTMENT_ID'
        throw error
      }
    }
  }

  // إذا لم تكن قاعدة البيانات متصلة، نحفظ في الذاكرة البديلة
  if (model === Settings && mongoose.connection.readyState !== 1) {
    memoryFallbackIds = cleanedIds
    return { enabledDepartmentIds: cleanedIds }
  }

  // 5. حفظ الإعدادات في قاعدة البيانات (Upsert)
  await model.findOneAndUpdate(
    { key: 'app' },
    { $set: { enabledDepartmentIds: cleanedIds } },
    { upsert: true, new: true }
  )

  return { enabledDepartmentIds: cleanedIds }
}

/**
 * استخراج قائمة الدوائر مع العدادات وحالة التفعيل (وفق 4.2 و عقد 7.1)
 * الدائرة الجديدة التي تُضاف في جسر تظهر تلقائياً (غير مفعّلة)
 *
 * @param {Array<any>} employees قائمة الموظفين النشطين من جسر
 * @param {string[]} enabledDepartmentIds معرفات الدوائر المفعّلة
 * @returns {{ departments: Array<any> }}
 */
export function buildDepartmentsList(employees = [], enabledDepartmentIds = []) {
  const enabledSet = new Set((enabledDepartmentIds || []).map(String))
  const deptMap = new Map()

  for (const emp of employees) {
    if (!emp || !emp.is_active) continue
    const dept = emp.department
    if (!dept || !dept.id) continue

    const deptId = String(dept.id)
    if (!deptMap.has(deptId)) {
      deptMap.set(deptId, {
        id: deptId,
        name: cleanName(dept.name_ar || dept.name || 'دائرة'),
        displayCode: getDisplayCode(dept.name_en),
        employeeCount: 0,
        enabled: enabledSet.has(deptId),
      })
    }

    const item = deptMap.get(deptId)
    item.employeeCount++
  }

  const list = Array.from(deptMap.values())

  // ترتيب الدوائر: التي لها displayCode أولاً (مثل LBD-1, LBD-2, LBD-3) ثم البقية أبجدياً
  list.sort((a, b) => {
    if (a.displayCode && !b.displayCode) return -1
    if (!a.displayCode && b.displayCode) return 1
    if (a.displayCode && b.displayCode) {
      return a.displayCode.localeCompare(b.displayCode)
    }
    return a.name.localeCompare(b.name, 'ar')
  })

  return { departments: list }
}
