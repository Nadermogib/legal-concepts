/**
 * @file OverviewPage.jsx
 * صفحة النظرة العامة: مبدّل يومي/فترة محددة. الوضع اليومي مكتمل (1.7)، والفترة المحددة في المهمة 1.8
 */

import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useDailyOverview, usePeriodOverview } from '../hooks/useOverview.js'
import StatCard from '../components/StatCard.jsx'
import DonutChart from '../components/DonutChart.jsx'
import DepartmentCard from '../components/DepartmentCard.jsx'
import DateField from '../components/DateField.jsx'
import Skeleton from '../components/Skeleton.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import StaleBanner from '../components/StaleBanner.jsx'
import { DAILY_STATUS_KEYS, PERIOD_STATUS_KEYS } from '../lib/status.js'
import { QUICK_RANGES, quickRange, matchQuickRange, validateRange } from '../lib/dates.js'
import { formatDayMonth, formatWorkingDays, todayRiyadhISO } from '../lib/format.js'
import { CalendarOff } from 'lucide-react'

const MODES = [
  { id: 'daily', label: 'يومي' },
  { id: 'period', label: 'فترة محددة' },
]

function ModeSwitcher({ mode, onChange }) {
  return (
    <div role="tablist" className="flex gap-2 select-none">
      {MODES.map((m) => {
        const active = m.id === mode
        return (
          <button
            key={m.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(m.id)}
            className={`w-[140px] h-[48px] rounded-pill text-base sm:text-lg transition-all duration-200 cursor-pointer ${
              active
                ? 'bg-gradient-to-r from-[#7a828e] to-[#606773] text-white font-bold shadow-md scale-102'
                : 'text-neutral-600 border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 font-medium'
            }`}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

function SectionTitle({ title, subtitle, size = 'text-[22px]' }) {
  return (
    <div className="space-y-1">
      <h2 className={`${size} font-bold text-brand-olive leading-tight`}>{title}</h2>
      {subtitle && <p className="text-sm sm:text-base text-text-strong">{subtitle}</p>}
    </div>
  )
}

function DailySkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="space-y-2">
        <Skeleton width="280px" height="28px" />
        <Skeleton width="220px" height="16px" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
      <Skeleton variant="rect" height="230px" />
      <Skeleton width="260px" height="28px" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        <Skeleton variant="card" height="330px" />
        <Skeleton variant="card" height="330px" />
      </div>
    </div>
  )
}

function DailyView({ query }) {
  const navigate = useNavigate()
  const { data, isPending, isError, error, refetch, refresh, isRefreshing } = query

  if (isPending) return <DailySkeleton />

  if (isError) {
    return (
      <ErrorState
        title="تعذّر تحميل البيانات"
        message={error?.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.'}
        onRetry={() => refetch()}
      />
    )
  }

  const { company, departments = [], isOffDay, stale, generatedAt } = data

  return (
    <div className="space-y-8">
      <StaleBanner
        stale={stale}
        generatedAt={generatedAt}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
      />

      <SectionTitle
        title="إحصائيات الشركة — اليوم"
        subtitle={`إجمالي الموظفين في الدوائر المشمولة: ${company.total} موظف`}
      />

      {isOffDay ? (
        <EmptyState
          icon={CalendarOff}
          title="اليوم عطلة"
          description="لا توجد بيانات حضور في أيام العطلة الأسبوعية."
        />
      ) : departments.length === 0 && company.total === 0 ? (
        <EmptyState
          title="لا توجد دوائر مفعّلة"
          description="فعّل دائرة واحدة على الأقل من صفحة الإعدادات لعرض الإحصائيات."
          actionLabel="الذهاب إلى الإعدادات"
          onAction={() => navigate('/settings')}
        />
      ) : (
        <>
          <section aria-label="بطاقات الحالة" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {DAILY_STATUS_KEYS.map((key) => (
              <StatCard
                key={key}
                status={key}
                count={company.counts[key]}
                percentage={company.percentages[key]}
              />
            ))}
          </section>

          <section aria-label="توزيع الحضور الكلي" className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12 bg-white border border-neutral-200/90 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8">
            <div className="lg:w-[300px] shrink-0">
              <SectionTitle
                size="text-2xl"
                title="توزيع الحضور الكلي"
                subtitle={`اليوم — ${company.total} موظف`}
              />
            </div>
            <DonutChart
              total={company.total}
              counts={company.counts}
              percentages={company.percentages}
              attendancePercent={company.attendancePercent}
              keys={DAILY_STATUS_KEYS}
              className="flex-1 min-w-0"
            />
          </section>

          <section aria-label="توزيع الحضور حسب الدوائر" className="space-y-6">
            <h2 className="text-2xl font-bold text-brand-olive pb-3 border-b border-brand-olive/40">توزيع الحضور حسب الدوائر</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {departments.map((d) => (
                <DepartmentCard key={d.id} department={d} keys={DAILY_STATUS_KEYS} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function PeriodView({ registerRefresh }) {
  const navigate = useNavigate()
  const today = todayRiyadhISO()
  const [range, setRange] = useState(() => quickRange('last7', today))
  // الفترة المطبّقة على الاستعلام: لا تتغير إلا إذا كانت الفترة المُدخلة صالحة
  const [applied, setApplied] = useState(range)
  const [activeQuick, setActiveQuick] = useState('last7')
  const validationError = validateRange(range.from, range.to, today)

  const query = usePeriodOverview(applied)
  const { data, isPending, isError, error, refetch, refresh, isRefreshing, isPlaceholderData } = query

  useEffect(() => {
    registerRefresh?.(refresh)
    return () => registerRefresh?.(null)
  }, [refresh, registerRefresh])

  const changeRange = (next, quickId = null) => {
    setRange(next)
    setActiveQuick(quickId)
    if (!validateRange(next.from, next.to, today)) setApplied(next)
  }

  // التعديل اليدوي يُلغي الزر النشط، ويُعاد تفعيله إن طابقت الفترة زراً
  const handleManual = (patch) => {
    const next = { ...range, ...patch }
    changeRange(next, matchQuickRange(next.from, next.to, today))
  }

  const controls = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
        <DateField label="من تاريخ" value={range.from} max={today} onChange={(v) => handleManual({ from: v })} />
        <DateField label="إلى تاريخ" value={range.to} max={today} onChange={(v) => handleManual({ to: v })} />
      </div>

      <div className="flex flex-wrap gap-3" role="group" aria-label="فترات سريعة">
        {QUICK_RANGES.map((q) => {
          const active = activeQuick === q.id
          return (
            <button
              key={q.id}
              type="button"
              aria-pressed={active}
              onClick={() => changeRange(quickRange(q.id, today), q.id)}
              className={`h-12 px-5 rounded-pill border-2 text-[17px] transition-colors cursor-pointer ${
                active
                  ? 'bg-olive-soft border-brand-olive text-text-strong font-bold'
                  : 'bg-white border-brand-gray text-text-strong hover:bg-tab-track/40'
              }`}
            >
              {q.label}
            </button>
          )
        })}
      </div>

      {validationError && (
        <p role="alert" className="text-status-absent text-base font-bold">
          {validationError}
        </p>
      )}
    </div>
  )

  let body
  if (isPending) {
    body = (
      <div className="space-y-8" aria-busy="true" aria-label="جارٍ التحميل">
        <Skeleton width="300px" height="28px" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
        <Skeleton variant="rect" height="230px" />
      </div>
    )
  } else if (isError) {
    body = (
      <ErrorState
        title="تعذّر تحميل البيانات"
        message={error?.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.'}
        onRetry={() => refetch()}
      />
    )
  } else {
    const { company, departments = [], stale, generatedAt, workingDays, totalRecords } = data
    const noDepartments = departments.length === 0 && company.total === 0
    body = (
      <div className={`space-y-8 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
        <StaleBanner stale={stale} generatedAt={generatedAt} onRefresh={refresh} isRefreshing={isRefreshing} />

        <SectionTitle
          title="إحصائيات الشركة — الفترة المحددة"
          subtitle={`من ${formatDayMonth(data.from)} إلى ${formatDayMonth(data.to)} — ${formatWorkingDays(workingDays)} — ${totalRecords} سجل حضور (موظف × يوم)`}
        />

        {noDepartments ? (
          <EmptyState
            title="لا توجد دوائر مفعّلة"
            description="فعّل دائرة واحدة على الأقل من صفحة الإعدادات لعرض الإحصائيات."
            actionLabel="الذهاب إلى الإعدادات"
            onAction={() => navigate('/settings')}
          />
        ) : (
          <>
            <section aria-label="بطاقات الحالة" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
              {PERIOD_STATUS_KEYS.map((key) => (
                <StatCard key={key} status={key} count={company.counts[key]} percentage={company.percentages[key]} />
              ))}
            </section>

            <section aria-label="توزيع الحضور الكلي" className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12 bg-white border border-neutral-200/90 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8">
              <div className="lg:w-[300px] shrink-0">
                <SectionTitle size="text-2xl" title="توزيع الحضور الكلي" subtitle={formatWorkingDays(workingDays)} />
              </div>
              <DonutChart
                total={company.total}
                counts={company.counts}
                percentages={company.percentages}
                attendancePercent={company.attendancePercent}
                keys={PERIOD_STATUS_KEYS}
                className="flex-1 min-w-0"
              />
            </section>

            <section aria-label="توزيع الحضور حسب الدوائر" className="space-y-6">
              <h2 className="text-2xl font-bold text-brand-olive pb-3 border-b border-brand-olive/40">توزيع الحضور حسب الدوائر</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {departments.map((d) => (
                  <DepartmentCard key={d.id} department={d} keys={PERIOD_STATUS_KEYS} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {controls}
      {body}
    </div>
  )
}

export default function OverviewPage() {
  const [mode, setMode] = useState('daily')
  const daily = useDailyOverview()
  const { registerRefresh } = useOutletContext() ?? {}

  // زر التحديث في الترويسة يجلب بـ refresh=1؛ في وضع الفترة يسجّله PeriodView نفسه
  useEffect(() => {
    if (mode !== 'daily') return undefined
    registerRefresh?.(daily.refresh)
    return () => registerRefresh?.(null)
  }, [mode, daily.refresh, registerRefresh])

  return (
    <div className="space-y-6">
      <ModeSwitcher mode={mode} onChange={setMode} />
      {mode === 'daily' ? (
        <DailyView query={daily} />
      ) : (
        <PeriodView registerRefresh={registerRefresh} />
      )}
    </div>
  )
}
