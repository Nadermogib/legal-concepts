/**
 * @file DateField.jsx
 * حقل تاريخ مخصص بصيغة yyyy/MM/dd فوق <input type="date"> مخفي (showPicker)، بدون مكتبة
 * مطابق للقسم 3 في DESIGN_NOTES.md: عرض ~211px، ارتفاع ~49px، خلفية #999 ونص أبيض وأيقونة تقويم
 */

import { useId, useRef } from 'react'
import { Calendar } from 'lucide-react'
import { toDisplayDate } from '../lib/dates.js'

export default function DateField({ label, value, onChange, max, min, className = '' }) {
  const inputRef = useRef(null)
  const id = useId()

  const openPicker = () => {
    const el = inputRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker()
        return
      } catch {
        /* يتجاهل ويكمل إلى focus */
      }
    }
    el.focus()
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={`${id}-btn`} className="text-[15px] font-bold text-black">
        {label}
      </label>
      <div className="relative w-[211px] max-w-full">
        <button
          id={`${id}-btn`}
          type="button"
          onClick={openPicker}
          className="w-full h-[49px] rounded-field bg-brand-gray text-white text-lg flex items-center justify-center gap-3 shadow-md hover:bg-brand-gray/90 active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          <Calendar className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          <span dir="ltr">{toDisplayDate(value) || 'yyyy/MM/dd'}</span>
        </button>
        <input
          ref={inputRef}
          type="date"
          value={value || ''}
          min={min}
          max={max}
          onChange={(e) => e.target.value && onChange?.(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      </div>
    </div>
  )
}
