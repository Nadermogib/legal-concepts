/**
 * @file ReportsPage.jsx
 * صفحة تقارير البصمة: التقرير اليومي (1.9) والشهري (1.10)
 * مطابقة للمواصفات و DESIGN_NOTES.md (القسمان 4 و 5)
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Clock, CalendarOff, ChevronDown, Check, FileDown, Printer, X } from 'lucide-react'
import { useDailyReport, useMonthlyReport } from '../hooks/useReports.js'
import DataTable from '../components/DataTable.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Avatar from '../components/Avatar.jsx'
import Skeleton from '../components/Skeleton.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import StaleBanner from '../components/StaleBanner.jsx'
import MonthlyReportPdfTemplate from '../components/MonthlyReportPdfTemplate.jsx'
import {
  formatTime12,
  formatDuration,
  formatColonDuration,
  formatMonthName,
  getMonthOnlyName,
} from '../lib/format.js'
import { getAvailableMonths } from '../lib/dates.js'

const REPORT_TABS = [
  { id: 'daily', label: 'التقرير اليومي' },
  { id: 'monthly', label: 'التقرير الشهري' },
]

function SectionHeader() {
  return (
    <div className="space-y-1 mb-6">
      <h2 className="text-[22px] font-bold text-brand-olive leading-tight">
        تقرير البصمة
      </h2>
      <p className="text-sm sm:text-base text-text-strong">
        تقرير البصمة اليومية والشهرية
      </p>
    </div>
  )
}

function DailyReportSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="h-[66px] bg-tab-track/70 rounded-t-card animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton variant="card" height="116px" />
        <Skeleton variant="card" height="116px" />
        <Skeleton variant="card" height="116px" />
      </div>
      <Skeleton variant="rect" height="350px" />
    </div>
  )
}

function MonthlyReportSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="جارٍ تحميل التقرير الشهري">
      <div className="h-[66px] bg-tab-track/70 rounded-t-card animate-pulse" />
      <div className="p-6 bg-white border-2 border-brand-gray/30 rounded-card space-y-4">
        <div className="w-56 h-6 bg-tab-track/60 rounded animate-pulse" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-32 h-4 bg-tab-track/60 rounded animate-pulse" />
              <div className="flex-1 h-3 bg-tab-track/40 rounded-full animate-pulse" />
              <div className="w-16 h-4 bg-tab-track/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton variant="rect" height="320px" />
    </div>
  )
}

/**
 * منتقي الشهر بتصميم الـ pill الزيتوني المطابق لـ finger-reports-monthly.png
 */
function MonthDropdown({ selectedMonth, onChange, availableMonths }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // إغلاق القائمة عند النقر خارجها أو الضغط على Esc
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className="relative inline-block text-right">
      <button
        type="button"
        id="month-picker-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-brand-olive hover:bg-olive-soft text-text-strong font-bold text-sm sm:text-[15px] px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 cursor-pointer transition-colors shadow-sm select-none"
      >
        <span>{formatMonthName(selectedMonth)}</span>
        <ChevronDown
          className={`w-4 h-4 text-text-strong transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          strokeWidth={2.5}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-labelledby="month-picker-button"
          className="absolute top-full mt-1.5 right-0 bg-white rounded-card shadow-xl border border-brand-gray/30 py-1.5 z-40 min-w-[170px] max-h-64 overflow-y-auto"
        >
          {availableMonths.map((opt) => {
            const isSelected = opt.value === selectedMonth
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2 text-right text-sm sm:text-[15px] flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-brand-olive/20 font-bold text-text-strong'
                    : 'text-text-strong hover:bg-tab-track/40 font-medium'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-brand-olive shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('daily')
  const { registerRefresh } = useOutletContext() ?? {}

  // خيارات الشهور المتاحة (من أول شهر في السنة حتى الشهر الحالي)
  const availableMonths = useMemo(() => getAvailableMonths(), [])
  const [selectedMonth, setSelectedMonth] = useState(
    availableMonths[0]?.value || '2026-10',
  )
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [previewZoom, setPreviewZoom] = useState(100)
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrintPdf = () => {
    const originalTitle = document.title
    const monthName = formatMonthName(selectedMonth)
    document.title = `تقرير البصمة الشهري — ${monthName} — المفاهيم القانونية`
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setTimeout(() => {
        document.title = originalTitle
        setIsPrinting(false)
      }, 300)
    }, 50)
  }

  // استعلام التقرير اليومي
  const dailyQuery = useDailyReport()

  // استعلام التقرير الشهري
  const monthlyQuery = useMonthlyReport({ month: selectedMonth })

  // تسجيل دالة التحديث في الترويسة العليا حسب التبويب النشط
  useEffect(() => {
    if (activeTab === 'daily') {
      registerRefresh?.(dailyQuery.refresh)
    } else {
      registerRefresh?.(monthlyQuery.refresh)
    }
    return () => registerRefresh?.(null)
  }, [activeTab, dailyQuery.refresh, monthlyQuery.refresh, registerRefresh])

  // أعمدة جدول التقرير اليومي (1.9)
  const dailyColumns = useMemo(
    () => [
      {
        key: 'employee',
        header: 'الموظف',
        sortable: true,
        sortValue: (row) => `${row.departmentName || ''} ${row.name || ''}`,
        render: (row) => (
          <div className="flex items-center gap-3 py-1">
            <Avatar
              name={row.name}
              code={row.code}
              avatarUrl={row.avatarUrl}
              size="md"
            />
            <div className="flex flex-col text-right">
              <span className="text-[17px] font-bold text-text-strong leading-snug">
                {row.name}
              </span>
              <span className="text-[13px] text-text-muted leading-tight">
                {row.departmentName}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'الحالة',
        sortable: true,
        sortValue: (row) => {
          if (row.flags?.singlePunch) return 1
          if (row.flags?.late) return 2
          if (row.status === 'present') return 3
          return 4
        },
        render: (row) => {
          if (row.flags?.singlePunch) {
            return <StatusBadge variant="single_punch" />
          }
          if (row.flags?.late) {
            return <StatusBadge variant="late" lateMinutes={row.lateMinutes} />
          }
          if (row.status === 'present') {
            return <StatusBadge variant="on_time" />
          }
          return <StatusBadge status={row.status} />
        },
      },
      {
        key: 'checkIn',
        header: 'الحضور',
        sortable: true,
        render: (row) => formatTime12(row.checkIn),
      },
      {
        key: 'checkOut',
        header: 'الانصراف',
        sortable: true,
        render: (row) => formatTime12(row.checkOut),
      },
      {
        key: 'workedMinutes',
        header: 'المدة',
        sortable: true,
        align: 'left',
        sortValue: (row) =>
          row.status === 'present' && !row.flags?.singlePunch
            ? row.workedMinutes || 0
            : -1,
        render: (row) => {
          if (
            row.status !== 'present' ||
            row.flags?.singlePunch ||
            !row.workedMinutes
          ) {
            return '—'
          }
          return formatDuration(row.workedMinutes)
        },
      },
    ],
    [],
  )

  // أعمدة جدول التقرير الشهري (1.10 - 5.7)
  const monthlyColumns = useMemo(
    () => [
      {
        key: 'employee',
        header: 'الموظف',
        sortable: true,
        sortValue: (row) => `${row.departmentName || ''} ${row.name || ''}`,
        render: (row) => (
          <div className="flex items-center gap-3 py-1">
            <Avatar
              name={row.name}
              code={row.code}
              avatarUrl={row.avatarUrl}
              size="md"
            />
            <div className="flex flex-col text-right">
              <span className="text-[17px] font-bold text-text-strong leading-snug">
                {row.name}
              </span>
              <span className="text-[13px] text-text-muted leading-tight">
                {row.departmentName}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'lateDays',
        header: 'أيام التأخير',
        sortable: true,
        sortValue: (row) => row.lateDays || 0,
        render: (row) => (
          <span className="text-[17px] font-bold text-text-strong">
            {row.lateDays || 0}
          </span>
        ),
      },
      {
        key: 'lateMinutes',
        header: 'مدة التأخير',
        sortable: true,
        sortValue: (row) => row.lateMinutes || 0,
        render: (row) => (
          <span className="text-[17px] text-text-strong">
            {row.lateMinutes ? formatDuration(row.lateMinutes) : '0'}
          </span>
        ),
      },
      {
        key: 'absenceDays',
        header: 'الغياب',
        sortable: true,
        sortValue: (row) => row.absenceDays || 0,
        render: (row) => (
          <span className="text-[17px] text-text-strong">
            {row.absenceDays || 0}
          </span>
        ),
      },
      {
        key: 'leaveDays',
        header: 'الإجازات',
        sortable: true,
        sortValue: (row) => row.leaveDays || 0,
        render: (row) => (
          <span className="text-[17px] text-text-strong">
            {row.leaveDays || 0}
          </span>
        ),
      },
      {
        key: 'earlyDepartureDays',
        header: 'إنصراف مبكر',
        sortable: true,
        sortValue: (row) => row.earlyDepartureDays || 0,
        render: (row) => (
          <span className="text-[17px] text-text-strong">
            {row.earlyDepartureDays || 0}
          </span>
        ),
      },
      {
        key: 'workedMinutes',
        header: 'ساعات العمل',
        sortable: true,
        align: 'left',
        sortValue: (row) => row.workedMinutes || 0,
        render: (row) => (
          <span className="text-[17px] text-text-strong font-mono">
            {row.workedMinutes != null
              ? formatColonDuration(row.workedMinutes)
              : '—'}
          </span>
        ),
      },
    ],
    [],
  )

  // أعلى قيمة لأيام التأخير لحساب نسب الأشرطة
  const maxLateDays = useMemo(() => {
    const list = monthlyQuery.data?.topLate || []
    if (list.length === 0) return 1
    return Math.max(...list.map((item) => item.lateDays || 0), 1)
  }, [monthlyQuery.data?.topLate])

  return (
    <>
      <div className="space-y-6 print:hidden">
        <SectionHeader />

      {/* تبويب التقرير الشهري */}
      {activeTab === 'monthly' ? (
        monthlyQuery.isPending ? (
          <MonthlyReportSkeleton />
        ) : monthlyQuery.isError ? (
          <ErrorState
            title="تعذّر تحميل التقرير الشهري"
            message={
              monthlyQuery.error?.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.'
            }
            onRetry={() => monthlyQuery.refetch()}
          />
        ) : (
          <div className="space-y-6">
            <StaleBanner
              stale={monthlyQuery.data.stale}
              generatedAt={monthlyQuery.data.generatedAt}
              onRefresh={monthlyQuery.refresh}
              isRefreshing={monthlyQuery.isRefreshing}
            />

            <div className="border border-neutral-200/90 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] bg-white overflow-hidden">
              {/* شريط الأدوات (Toolbar) */}
              <div className="bg-gradient-to-r from-[#6e7683] via-[#78808d] to-[#68707c] text-white px-4 sm:px-6 py-3 min-h-[66px] flex flex-wrap items-center justify-between gap-4 shadow-xs">
                {/* الجهة اليمنى: تسمية الشهر ومنتقي الشهر وزر تصدير PDF */}
                <div className="flex flex-wrap items-center gap-3 select-none">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg sm:text-[20px] font-bold text-white drop-shadow-xs">
                      الشهر
                    </span>
                    <MonthDropdown
                      selectedMonth={selectedMonth}
                      onChange={setSelectedMonth}
                      availableMonths={availableMonths}
                    />
                  </div>

                  {/* زر تصدير PDF الفاخر */}
                  <button
                    type="button"
                    onClick={() => setShowPdfPreview(true)}
                    disabled={!monthlyQuery.data || monthlyQuery.isPending}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-brand-olive text-neutral-900 font-bold text-xs sm:text-sm shadow-xs hover:bg-[#b8b884] hover:shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none group mr-1"
                    title="معاينة وتصدير التقرير كملف PDF رسمي"
                  >
                    <FileDown className="w-4 h-4 text-neutral-800 transition-transform group-hover:-translate-y-0.5" strokeWidth={2} />
                    <span>تصدير PDF</span>
                  </button>
                </div>

                {/* مبدّل التبويبات على اليسار */}
                <div
                  role="tablist"
                  className="bg-black/20 backdrop-blur-xs p-1 rounded-card inline-flex items-center gap-1 select-none"
                >
                  {REPORT_TABS.map((t) => (
                    <button
                      key={t.id}
                      role="tab"
                      type="button"
                      aria-selected={activeTab === t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all cursor-pointer ${
                        activeTab === t.id
                          ? 'bg-white text-text-strong shadow-md scale-102'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* قسم "أكثر الموظفين تأخراً لشهر ..." */}
              <div className="p-6 sm:px-8 sm:py-7">
                <h3 className="text-lg sm:text-[20px] font-bold text-black mb-6 text-right">
                  أكثر الموظفين تأخراً لشهر {getMonthOnlyName(selectedMonth)}
                </h3>

                {!monthlyQuery.data?.topLate ||
                monthlyQuery.data.topLate.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-base font-bold bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                    لا يوجد متأخرون هذا الشهر
                  </div>
                ) : (
                  <div className="space-y-4 max-w-4xl">
                    {monthlyQuery.data.topLate.map((item) => {
                      const days = item.lateDays || 0
                      // نسبة طول الشريط لأكبر قيمة
                      const barWidthPercent = Math.max(
                        Math.round((days / maxLateDays) * 100),
                        6,
                      )
                      return (
                        <div
                          key={item.employeeId}
                          className="flex items-center gap-4 sm:gap-6 min-h-[44px] py-1 px-2.5 rounded-xl hover:bg-neutral-50/80 transition-colors"
                        >
                          {/* اسم الموظف على اليمين */}
                          <div className="w-[160px] sm:w-[220px] shrink-0 text-right truncate text-base sm:text-[18px] font-bold text-neutral-800">
                            {item.name}
                          </div>

                          {/* شريط التأخير الزيتوني في المنتصف مع مسار خلفي أنيق */}
                          <div className="flex-1 min-w-0 flex items-center">
                            <div className="w-full h-[13px] rounded-full bg-neutral-100 overflow-hidden p-0.5">
                              <div
                                className="h-full rounded-full bg-gradient-to-l from-brand-olive to-[#b5b580] shadow-xs transition-all duration-700 ease-out"
                                style={{ width: `${barWidthPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* عدد الأيام على اليسار بشارة مقروءة وأنيقة */}
                          <div className="w-[95px] sm:w-[110px] shrink-0 text-left">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-pill bg-neutral-100 text-neutral-800 text-sm font-bold shadow-xs">
                              {days === 1
                                ? 'يوم واحد'
                                : days === 2
                                ? 'يومان'
                                : days <= 10
                                ? `${days} أيام`
                                : `${days} يوماً`}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* جدول البصمة الشهري */}
              <DataTable
                columns={monthlyColumns}
                data={monthlyQuery.data?.rows || []}
                keyField="employeeId"
                defaultSortKey="lateDays"
                defaultSortDir="desc"
                className="border-0 border-t-2 border-brand-gray rounded-none shadow-none"
              />
            </div>
          </div>
        )
      ) : /* تبويب التقرير اليومي */
      dailyQuery.isPending ? (
        <DailyReportSkeleton />
      ) : dailyQuery.isError ? (
        <ErrorState
          title="تعذّر تحميل تقرير البصمة"
          message={
            dailyQuery.error?.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.'
          }
          onRetry={() => dailyQuery.refetch()}
        />
      ) : (
        <div className="space-y-6">
          <StaleBanner
            stale={dailyQuery.data.stale}
            generatedAt={dailyQuery.data.generatedAt}
            onRefresh={dailyQuery.refresh}
            isRefreshing={dailyQuery.isRefreshing}
          />

          <div className="border border-neutral-200/90 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] bg-white overflow-hidden">
            {/* شريط الأدوات (Toolbar) */}
            <div className="bg-gradient-to-r from-[#6e7683] via-[#78808d] to-[#68707c] text-white px-4 sm:px-6 py-3 min-h-[66px] flex flex-wrap items-center justify-between gap-4 shadow-xs">
              {/* الجهة اليمنى: نص ثابت يفيد باحتساب التأخير من جسر */}
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold select-none text-white/95">
                <Clock className="w-5 h-5 shrink-0" strokeWidth={2} />
                <span>التأخير محسوب حسب إعدادات جسر</span>
              </div>

              {/* مبدّل التبويبات على اليسار */}
              <div
                role="tablist"
                className="bg-black/20 backdrop-blur-xs p-1 rounded-card inline-flex items-center gap-1 select-none"
              >
                {REPORT_TABS.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    type="button"
                    aria-selected={activeTab === t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all cursor-pointer ${
                      activeTab === t.id
                        ? 'bg-white text-text-strong shadow-md scale-102'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {dailyQuery.data.isOffDay ? (
              <div className="p-8">
                <EmptyState
                  icon={CalendarOff}
                  title="اليوم عطلة"
                  description="لا توجد بيانات بصمة في أيام العطلة الأسبوعية."
                />
              </div>
            ) : (
              <>
                {/* العدادات الثلاثة بخلفيات فاخرة بتدرج لوني ناعم */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-neutral-200/80 border-b border-neutral-200 select-none">
                  {/* 1. حضروا اليوم */}
                  <div className="p-6 sm:p-7 flex flex-col justify-center min-h-[120px] bg-gradient-to-br from-emerald-50/50 via-white to-transparent hover:bg-emerald-50/70 transition-colors">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[34px] sm:text-[38px] font-bold text-status-present leading-tight">
                        {dailyQuery.data.summary?.attended ?? 0}
                      </span>
                      <span className="text-[17px] font-bold text-neutral-500">
                        من {dailyQuery.data.summary?.total ?? 0}
                      </span>
                    </div>
                    <span className="text-[17px] font-bold text-status-present mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-status-present inline-block shadow-xs" />
                      حضروا اليوم
                    </span>
                  </div>

                  {/* 2. متأخرون */}
                  <div className="p-6 sm:p-7 flex flex-col justify-center min-h-[120px] bg-gradient-to-br from-amber-50/50 via-white to-transparent hover:bg-amber-50/70 transition-colors">
                    <span className="text-[34px] sm:text-[38px] font-bold text-status-excuse leading-tight">
                      {dailyQuery.data.summary?.late ?? 0}
                    </span>
                    <span className="text-[17px] font-bold text-status-excuse mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-status-excuse inline-block shadow-xs" />
                      متأخرون
                    </span>
                  </div>

                  {/* 3. بصمة ناقصة (للمراجعة) */}
                  <div className="p-6 sm:p-7 flex flex-col justify-center min-h-[120px] bg-gradient-to-br from-rose-50/50 via-white to-transparent hover:bg-rose-50/70 transition-colors">
                    <span className="text-[34px] sm:text-[38px] font-bold text-status-absent leading-tight">
                      {dailyQuery.data.summary?.missingPunch ?? 0}
                    </span>
                    <span className="text-[17px] font-bold text-status-absent mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-status-absent inline-block shadow-xs" />
                      بصمة ناقصة (للمراجعة)
                    </span>
                  </div>
                </div>

                {/* جدول البصمة اليومي */}
                <DataTable
                  columns={dailyColumns}
                  data={dailyQuery.data.rows || []}
                  keyField="employeeId"
                  defaultSortKey="employee"
                  defaultSortDir="asc"
                  className="border-0 rounded-none shadow-none"
                />
              </>
            )}
          </div>
        </div>
      )}
      </div>

      {/* معاينة التقرير ومربع الحوار الخاص بالتصدير (PDF Preview Modal) */}
      {showPdfPreview && !isPrinting && (
        <div
          data-print-hidden="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-2 sm:p-5 flex justify-center items-start print:hidden"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-2 flex flex-col h-[94vh] max-h-[94vh] overflow-hidden border border-neutral-300 animate-in fade-in zoom-in-95 duration-200">
            {/* ترويسة نافذة المعاينة مع عناصر التحكم والتكبير/التصغير */}
            <div className="px-4 sm:px-6 py-3 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 bg-neutral-50 select-none shrink-0">
              <div className="flex items-center gap-2.5">
                <FileDown className="w-5 h-5 text-brand-olive" />
                <h3 className="text-sm sm:text-base font-bold text-neutral-800">
                  معاينة وتصدير تقرير البصمة الشهري (PDF)
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-200 text-neutral-700 font-semibold">
                  {formatMonthName(selectedMonth)}
                </span>
              </div>

              {/* عناصر التحكم بالتكبير والتصدير */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* أزرار التحكم بمقياس المعاينة Zoom */}
                <div className="hidden sm:flex items-center gap-1 bg-neutral-200/80 rounded-lg p-1 text-xs font-bold text-neutral-700">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.max(z - 10, 60))}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                    title="تصغير المعاينة"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-[11px] font-mono">{previewZoom}%</span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.min(z + 10, 140))}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                    title="تكبير المعاينة"
                  >
                    +
                  </button>
                  {previewZoom !== 100 && (
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(100)}
                      className="px-2 py-0.5 rounded text-[11px] hover:bg-white transition-colors text-neutral-600 cursor-pointer"
                      title="إعادة ضبط 100%"
                    >
                      100%
                    </button>
                  )}
                </div>

                {/* زر الطباعة / الحفظ كـ PDF */}
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-olive to-[#b5b580] text-neutral-900 font-bold text-xs sm:text-sm shadow-xs hover:shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة / حفظ كـ PDF</span>
                </button>

                {/* زر الإغلاق */}
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(false)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/80 rounded-lg transition-colors cursor-pointer"
                  title="إغلاق المعاينة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* جسم نافذة المعاينة: مساحة رمادية هادئة (A4 Desk Canvas) تستعرض الورقة بحجمها الطبيعي وبدون قص */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#4b5563]">
              <div className="min-w-fit mx-auto flex justify-center py-2">
                <div
                  style={{
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: 'top center',
                    transition: 'transform 150ms ease-out',
                  }}
                >
                  <MonthlyReportPdfTemplate
                    id="monthly-pdf-preview"
                    selectedMonth={selectedMonth}
                    data={monthlyQuery.data}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* حاوية الطباعة والتصدير الرسمية الوحيدة (مخفية على الشاشة وتظهر فقط عند الطباعة بتدفق طبيعي) */}
      <div id="print-container" className="hidden print:block w-full">
        <MonthlyReportPdfTemplate
          id="monthly-pdf-report"
          selectedMonth={selectedMonth}
          data={monthlyQuery.data}
        />
      </div>
    </>
  )
}
