/**
 * @file DepartmentCard.jsx
 * بطاقة إحصائيات الدائرة المعتمدة في شاشة النظرة العامة
 * مطابقة لقياسات ومواصفات DESIGN_NOTES.md (عرض ~505px، ترويسة مع شارة عدد الموظفين، فاصل زيتوني 1px، ودونات مع وسيلة الإيضاح)
 */

import DonutChart from './DonutChart.jsx'
import { formatEmployeesCount } from '../lib/format.js'

export default function DepartmentCard({
  department = {},
  keys = null,
  className = '',
}) {
  const {
    name = 'دائرة بدون اسم',
    total = 0,
    employeeCount = total,
    counts = {},
    percentages = {},
    attendancePercent = 0,
  } = department

  const badgeText = formatEmployeesCount(employeeCount || total || 0)

  return (
    <article
      aria-label={`إحصائيات ${name}`}
      className={`bg-white rounded-card p-5 sm:p-6 border border-neutral-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-olive/60 transition-all duration-300 flex flex-col justify-between min-h-[330px] ${className}`}
    >
      {/* ترويسة البطاقة: اسم الدائرة وشارة عدد الموظفين */}
      <div className="flex items-center justify-between pb-3.5 border-b border-brand-olive/40 gap-3">
        <h3 className="text-[19px] font-bold text-text-strong truncate" title={name}>
          {name}
        </h3>
        <span
          className="inline-flex items-center justify-center px-3.5 py-1 rounded-pill bg-gradient-to-r from-brand-olive to-[#b5b583] text-white text-[11px] font-bold shrink-0 select-none shadow-xs"
        >
          {badgeText}
        </span>
      </div>

      {/* جسم البطاقة: رسم الدونات مع وسيلة الإيضاح */}
      <div className="pt-4 flex items-center justify-center grow">
        <DonutChart
          total={total}
          counts={counts}
          percentages={percentages}
          attendancePercent={attendancePercent}
          keys={keys}
          size={150}
          holeSize={78}
          className="justify-between w-full"
        />
      </div>
    </article>
  )
}
