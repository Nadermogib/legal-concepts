import { useState, useEffect, useId, useRef } from 'react'
import { getStatusDef, DAILY_STATUS_KEYS, PERIOD_STATUS_KEYS } from '../lib/status.js'

/**
 * تحويل الزاوية إلى إحداثيات قطبية
 * يبدأ من 0 درجة عند الساعة 12 (الأعلى) ويتجه في اتجاه عقارب الساعة
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} angleInDegrees
 */
function polarToCartesian(cx, cy, r, angleInDegrees) {
  const radians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  }
}

/**
 * توليد مسار SVG لقطاع دائري مجوف (Donut Slice)
 * @param {number} cx
 * @param {number} cy
 * @param {number} rOuter
 * @param {number} rInner
 * @param {number} startAngle
 * @param {number} endAngle
 */
function describeDonutSlice(cx, cy, rOuter, rInner, startAngle, endAngle) {
  // تجنب الحالات التي تتجاوز فيها الزاوية 360 درجة
  const delta = Math.min(359.9999, Math.max(0, endAngle - startAngle))
  const actualEndAngle = startAngle + delta

  const p1 = polarToCartesian(cx, cy, rOuter, startAngle)
  const p2 = polarToCartesian(cx, cy, rOuter, actualEndAngle)
  const p3 = polarToCartesian(cx, cy, rInner, actualEndAngle)
  const p4 = polarToCartesian(cx, cy, rInner, startAngle)

  const largeArcFlag = delta > 180 ? 1 : 0

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ')
}

export default function DonutChart({
  total = 0,
  counts = {},
  percentages = {},
  attendancePercent = 0,
  centerLabel = 'نسبة الحضور',
  keys = null,
  showLegend = true,
  legendLayout = 'vertical',
  size = 162,
  holeSize = 84,
  className = '',
  animate = true,
  animationDuration = 1000,
}) {
  const rawId = useId()
  const maskId = `donut-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`

  // تحديد مفاتيح الفئات: إذا وُجد notYet نعتمد الحالات الست، وإلا حالات الفترة الخمس
  const resolvedKeys = keys || (counts.notYet !== undefined ? DAILY_STATUS_KEYS : PERIOD_STATUS_KEYS)

  const safeTotal = Math.max(0, Number(total) || 0)
  const safeAttendancePercent = Math.min(100, Math.max(0, Math.round(Number(attendancePercent) || 0)))

  // حالة ظهور العنصر في نافذة العرض وأنيميشن الامتلاء والعداد
  const [isInView, setIsInView] = useState(!animate)
  const [animated, setAnimated] = useState(!animate)
  const [displayPercent, setDisplayPercent] = useState(animate ? 0 : safeAttendancePercent)
  const containerRef = useRef(null)
  const prevPercentRef = useRef(0)

  // مراقبة ظهور الدونات عند التمرير في نافذة العرض (Scroll into View)
  useEffect(() => {
    if (!animate) {
      setIsInView(true)
      return
    }

    const element = containerRef.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsInView(true)
        } else {
          // إعادة ضبط الحالة عند خروج العنصر بالكامل ليعيد تشغيل الأنيميشن عند النزول إليه مجدداً
          setIsInView(false)
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -20px 0px',
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [animate])

  // تشغيل أنيميشن الامتلاء والعدّاد عند الدخول في نطاق الرؤية
  useEffect(() => {
    if (!animate) {
      setAnimated(true)
      setDisplayPercent(safeAttendancePercent)
      return
    }

    // إذا لم يظهر العنصر في نطاق الرؤية بعد، يظل في حالته الصفرية المبدئية
    if (!isInView) {
      setAnimated(false)
      setDisplayPercent(0)
      prevPercentRef.current = 0
      return
    }

    // بمجرد دخوله نافذة العرض، يتم تفعيل أنيميشن الامتلاء والعدّاد
    setAnimated(false)
    const timerId = setTimeout(() => {
      setAnimated(true)
    }, 40)

    let startTimestamp = null
    let rafId = null
    const startVal = 0
    const endVal = safeAttendancePercent

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const elapsed = timestamp - startTimestamp
      const progress = Math.min(1, elapsed / animationDuration)
      // منحنى تخميد انسيابي Ease-Out Cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (endVal - startVal) * ease)
      setDisplayPercent(current)

      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        prevPercentRef.current = endVal
      }
    }

    rafId = requestAnimationFrame(step)

    return () => {
      clearTimeout(timerId)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isInView, safeAttendancePercent, safeTotal, animate, animationDuration])

  // حساب القطاعات والزوايا
  const rOuter = size / 2
  const rInner = holeSize / 2
  const center = rOuter
  const midRadius = (rOuter + rInner) / 2
  const thickness = rOuter - rInner
  const circumference = 2 * Math.PI * midRadius

  // استخراج الفئات التي قيمتها > 0
  const activeSlices = []
  let cumulativeCount = 0

  resolvedKeys.forEach((key) => {
    const count = Math.max(0, Number(counts[key]) || 0)
    if (count > 0 && safeTotal > 0) {
      const startAngle = (cumulativeCount / safeTotal) * 360
      const sliceAngle = (count / safeTotal) * 360
      const endAngle = startAngle + sliceAngle

      const def = getStatusDef(key)
      activeSlices.push({
        key,
        count,
        pct: percentages[key] !== undefined ? Math.round(percentages[key]) : Math.round((count / safeTotal) * 100),
        color: def.donutColor || def.color,
        startAngle,
        endAngle,
        sliceAngle,
      })

      cumulativeCount += count
    }
  })

  const hasMultipleSlices = activeSlices.length > 1
  const isSingleFullSlice = activeSlices.length === 1 && Math.abs(activeSlices[0].count - safeTotal) < 0.0001
  const isEmpty = safeTotal === 0 || activeSlices.length === 0

  return (
    <div ref={containerRef} className={`flex flex-col md:flex-row items-center gap-8 ${className}`}>
      {/* رسم الـ SVG للدونات مع قناع أنيميشن الامتلاء */}
      <div
        className="relative shrink-0 select-none flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block drop-shadow-xs"
          aria-hidden="true"
        >
          {/* قناع الامتلاء (Donut Fill Mask) - يبدأ من الساعة 12 ويمتد في اتجاه عقارب الساعة */}
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <rect x="0" y="0" width={size} height={size} fill="black" />
              <circle
                cx={center}
                cy={center}
                r={midRadius}
                fill="none"
                stroke="white"
                strokeWidth={thickness + 4}
                strokeDasharray={circumference}
                strokeDashoffset={animated ? 0 : circumference}
                strokeLinecap="butt"
                transform={`rotate(-90 ${center} ${center})`}
                style={{
                  transition: `stroke-dashoffset ${animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                }}
              />
            </mask>
          </defs>

          {/* المسار الخلفي الهادئ (Track) الذي تمتلئ القطاعات فوقه */}
          {!isEmpty && (
            <circle
              cx={center}
              cy={center}
              r={midRadius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={thickness}
            />
          )}

          {/* الحالة 1: إجمالي صفر (حلقة رمادية فارغة) */}
          {isEmpty && (
            <circle
              cx={center}
              cy={center}
              r={midRadius}
              fill="none"
              stroke="#D9D9D9"
              strokeWidth={thickness}
            />
          )}

          {/* القطاعات الملوّنة مشمولة داخل قناع أنيميشن الامتلاء */}
          {!isEmpty && (
            <g mask={`url(#${maskId})`}>
              {/* الحالة 2: فئة واحدة 100% (حلقة ملونة كاملة) */}
              {isSingleFullSlice && (
                <circle
                  cx={center}
                  cy={center}
                  r={midRadius}
                  fill="none"
                  stroke={activeSlices[0].color}
                  strokeWidth={thickness}
                />
              )}

              {/* الحالة 3: قطاعات متعددة (أقواس مع فواصل بيضاء 3px) */}
              {!isSingleFullSlice &&
                activeSlices.map((slice) => {
                  const pathD = describeDonutSlice(center, center, rOuter, rInner, slice.startAngle, slice.endAngle)
                  return (
                    <path
                      key={slice.key}
                      d={pathD}
                      fill={slice.color}
                      stroke="#ffffff"
                      strokeWidth={hasMultipleSlices ? 3 : 0}
                      strokeLinejoin="round"
                      className="transition-opacity duration-200 hover:opacity-90"
                    />
                  )
                })}
            </g>
          )}
        </svg>

        {/* مركز الدونات: النسبة المئوية وتسمية "نسبة الحضور" مع عدّاد تدريجي انسيابي */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[29px] font-bold text-text-donut-center leading-none tracking-tight">
            {displayPercent}%
          </span>
          <span className="text-[10px] font-bold text-neutral-600 mt-1">
            {centerLabel}
          </span>
        </div>
      </div>

      {/* وسيلة الإيضاح (Legend) */}
      {showLegend && (
        <div
          className={`flex-1 w-full divide-y divide-neutral-200/60 select-none ${
            legendLayout === 'horizontal' ? 'grid grid-cols-2 gap-x-4 divide-y-0' : ''
          }`}
        >
          {resolvedKeys.map((key) => {
            const def = getStatusDef(key)
            const count = counts[key] !== undefined ? counts[key] : 0
            const pct = percentages[key] !== undefined
              ? percentages[key]
              : safeTotal > 0
              ? Math.round((count / safeTotal) * 100)
              : 0

            return (
              <div
                key={key}
                className="flex items-center justify-between py-2 px-2.5 -mx-2.5 rounded-lg hover:bg-neutral-50/80 transition-colors h-[42px] text-[16px] sm:text-[17px] text-text-strong group"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-[11px] h-[11px] rounded-full shrink-0 shadow-xs ring-2 ring-white transition-transform duration-200 group-hover:scale-125"
                    style={{ backgroundColor: def.donutColor || def.color }}
                  />
                  <span className="font-normal group-hover:text-black transition-colors">{def.label}</span>
                </div>
                <div className="font-bold dir-ltr text-left">
                  <span>{count}</span>
                  <span className="mr-1 text-text-muted text-sm font-normal">({pct}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
