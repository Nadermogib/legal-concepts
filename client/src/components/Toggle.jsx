/**
 * @file Toggle.jsx
 * مفتاح التبديل (switch) المعتمد في صفحة الإعدادات.
 * الزيتوني (#CCCC99) = مفعّل، والرمادي (#999999) = معطّل (وفق القسم 447 من المواصفات).
 */

export default function Toggle({
  checked = false,
  onChange,
  disabled = false,
  ariaLabel = 'تبديل التفعيل',
  className = '',
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange && !disabled && onChange(!checked)}
      className={`relative inline-flex items-center w-12 h-7 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-olive focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-brand-olive' : 'bg-brand-gray'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
          checked ? '-translate-x-6' : '-translate-x-1'
        }`}
      />
    </button>
  )
}
