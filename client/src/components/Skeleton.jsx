/**
 * @file Skeleton.jsx
 * مكوّن هيكل التحميل النابض لمختلف عناصر الواجهة (نصوص، دوائر، بطاقات، جداول)
 */

export default function Skeleton({
  variant = 'text', // 'text' | 'circle' | 'rect' | 'card' | 'badge'
  width,
  height,
  className = '',
}) {
  const baseClasses = 'animate-pulse bg-tab-track/60'

  if (variant === 'circle') {
    return (
      <div
        className={`${baseClasses} rounded-full shrink-0 ${className}`}
        style={{ width: width || '48px', height: height || '48px' }}
      />
    )
  }

  if (variant === 'badge') {
    return (
      <div
        className={`${baseClasses} rounded-pill ${className}`}
        style={{ width: width || '88px', height: height || '31px' }}
      />
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={`${baseClasses} rounded-card p-4 space-y-3 ${className}`}
        style={{ width: width || '100%', height: height || '155px' }}
      />
    )
  }

  if (variant === 'rect') {
    return (
      <div
        className={`${baseClasses} rounded-md ${className}`}
        style={{ width: width || '100%', height: height || '40px' }}
      />
    )
  }

  // default 'text'
  return (
    <div
      className={`${baseClasses} rounded-sm ${className}`}
      style={{ width: width || '100%', height: height || '16px' }}
    />
  )
}
