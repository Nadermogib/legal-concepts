/**
 * @file parseHm.js
 * تحويل مدة الوقت بصيغة H:MM أو HH:MM أو HHH:MM إلى دقائق كعدد صحيح.
 * يرجع 0 في حال كانت القيمة فارغة، غير صالحة، أو غير متوافقة مع التنسيق (وفق 3.3 و 11.2-1).
 */

/**
 * تحويل نص الوقت (H:MM) إلى دقائق
 * @param {string | null | undefined} str نص الوقت، مثلاً "1:08" أو "143:24"
 * @returns {number} عدد الدقائق، أو 0 للقيم غير الصالحة
 */
export function parseHm(str) {
  if (!str || typeof str !== 'string') {
    return 0
  }

  const trimmed = str.trim()
  if (!trimmed) {
    return 0
  }

  // صيغة الساعات والدقائق: رقم أو أكثر للساعات، ونقطتان، ورقمين للدقائق
  const match = /^(\d+):([0-5]\d)$/.exec(trimmed)
  if (!match) {
    return 0
  }

  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0
  }

  return hours * 60 + minutes
}
