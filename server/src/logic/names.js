/**
 * @file names.js
 * دوال نقية لتنظيف الأسماء واستخراج الأكواد وفق الأقسام 4.2، 4.4، 11.2-7، 11.2-8.
 */

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF]/
const DISPLAY_CODE_REGEX = /^[A-Z]{2,}-\d+$/

/**
 * تنظيف النص من المسافات الزائدة
 * @param {any} val
 * @returns {string}
 */
export function cleanName(val) {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

/**
 * اختيار اسم الموظف المعروض حسب القواعد المحددة في 4.4:
 * 1. full_name_ar إذا كان يحتوي على أحرف عربية.
 * 2. وإلا full_name_en إن وُجد.
 * 3. وإلا كود الموظف كبديل.
 *
 * @param {{ full_name_ar?: string | null, full_name_en?: string | null, code?: string | number | null }} emp
 * @returns {string}
 */
export function resolveEmployeeName(emp) {
  if (!emp || typeof emp !== 'object') return ''

  const ar = cleanName(emp.full_name_ar)
  if (ar && ARABIC_CHAR_REGEX.test(ar)) {
    return ar
  }

  const en = cleanName(emp.full_name_en)
  if (en) {
    return en
  }

  // إذا كان الحقل العربي يحتوي على أحرف إنجليزية وليس عربية ولم يتوفر full_name_en
  if (ar) {
    return ar
  }

  const code = cleanName(emp.code)
  if (code) {
    return code
  }

  return 'موظف'
}

/**
 * استخراج كود العرض للدائرة (مثل LBD-1) من الحقل الإنجليزي
 * إذا كان يطابق النمط /^[A-Z]{2,}-\d+$/ يُعاد كما هو، وإلا null.
 *
 * @param {string | null | undefined} nameEn
 * @returns {string | null}
 */
export function getDisplayCode(nameEn) {
  const cleaned = cleanName(nameEn)
  if (DISPLAY_CODE_REGEX.test(cleaned)) {
    return cleaned
  }
  return null
}

/**
 * تطبيع النصوص العربية للبحث والمطابقة البسيطة (توحيد الهمزات والتاء المربوطة)
 * @param {string | null | undefined} str
 * @returns {string}
 */
export function normalizeArabic(str) {
  const cleaned = cleanName(str)
  return cleaned
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
}
