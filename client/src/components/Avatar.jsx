/**
 * @file Avatar.jsx
 * صورة الموظف الرمزية مع استخلاص الحروف الأولى واشتقاق لون ثابت عند عدم توفر الصورة
 */

import { useState } from 'react'

const AVATAR_BG_CLASSES = [
  'bg-brand-olive text-white',
  'bg-brand-gray text-white',
  'bg-status-present text-white',
  'bg-status-leave text-white',
  'bg-status-trip text-white',
  'bg-status-excuse text-white',
  'bg-status-notyet-card text-white',
]

/**
 * اشتقاق لون ثابت بناءً على كود أو اسم الموظف
 * @param {string} key
 * @returns {string}
 */
function getDeterministicClass(key = '') {
  let hash = 0
  const str = String(key)
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_BG_CLASSES.length
  return AVATAR_BG_CLASSES[index]
}

/**
 * استخراج الحروف الأولى (حرفان) من الاسم العربي
 * @param {string} name
 * @returns {string}
 */
function getInitials(name = '') {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2)
  }
  return `${parts[0][0]}${parts[1][0]}`
}

export default function Avatar({
  name = '',
  code = '',
  avatarUrl = null,
  size = 'md', // 'sm' (36px) | 'md' (48px) | 'lg' (64px)
  className = '',
}) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  }[size] || 'w-12 h-12 text-sm'

  const showImage = Boolean(avatarUrl && !imageError)
  const initials = getInitials(name)
  const bgClass = getDeterministicClass(code || name)

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden select-none font-bold ${sizeClasses} ${className}`}
      title={name}
      aria-label={name}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
        />
      ) : (
        <span className={`w-full h-full flex items-center justify-center ${bgClass}`}>
          {initials}
        </span>
      )}
    </div>
  )
}
