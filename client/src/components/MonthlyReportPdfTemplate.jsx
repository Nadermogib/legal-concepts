/**
 * @file MonthlyReportPdfTemplate.jsx
 * قالب تقرير البصمة الشهري المخصص للطباعة وتصدير PDF بمقاس A4 القياسي
 * مصمم ليعكس الهوية البصرية لشركة "المفاهيم القانونية" بألوانها المعتمدة وشعارها الرسمي
 * ثابت الأبعاد بنسبة 100% ليمنع تشوه الأعمدة أو التفاف النصوص عند اختلاف نسبة تكبير المتصفح (Zoom)
 */

import logo from '../assets/images/logo-dark.png'
import {
  formatMonthName,
  formatDuration,
  formatColonDuration,
  formatDate,
  todayRiyadhISO,
  getMonthOnlyName,
} from '../lib/format.js'

export default function MonthlyReportPdfTemplate({
  selectedMonth = '',
  data = null,
  generatedDate = todayRiyadhISO(),
  className = '',
  id = 'monthly-pdf-report',
}) {
  const rows = data?.rows || []
  const topLate = data?.topLate || []
  const monthName = formatMonthName(selectedMonth)
  const monthOnly = getMonthOnlyName(selectedMonth)
  const formattedToday = formatDate(generatedDate)

  // حساب الإحصائيات التجميعية للشهر
  const totalEmployees = rows.length
  const totalLateDays = rows.reduce((acc, r) => acc + (Number(r.lateDays) || 0), 0)
  const totalLateMinutes = rows.reduce((acc, r) => acc + (Number(r.lateMinutes) || 0), 0)
  const totalAbsenceDays = rows.reduce((acc, r) => acc + (Number(r.absenceDays) || 0), 0)
  const totalLeaveDays = rows.reduce((acc, r) => acc + (Number(r.leaveDays) || 0), 0)
  const totalEarlyDeparture = rows.reduce((acc, r) => acc + (Number(r.earlyDepartureDays) || 0), 0)
  const totalWorkedMinutes = rows.reduce((acc, r) => acc + (Number(r.workedMinutes) || 0), 0)

  // أقصى أيام تأخير لحساب نسب الأشرطة
  const maxLateDays = Math.max(1, ...topLate.map((t) => Number(t.lateDays) || 0))

  return (
    <div
      id={id}
      dir="rtl"
      className={`bg-[#FFFFFF] text-neutral-800 font-sans p-6 mx-auto w-[820px] min-w-[820px] max-w-[820px] shrink-0 print:w-full print:min-w-0 print:max-w-none print:p-0 print:m-0 print:shadow-none shadow-sm border border-[#E5E7EB] print:border-none rounded-sm select-none ${className}`}
      style={{
        fontFamily: 'var(--font-aljazeera), Aljazeera, Arial, sans-serif',
      }}
    >
      {/* 1. الترويسة الرسمية للوثيقة */}
      <header className="border-b-2 border-brand-olive pb-3 mb-3 break-inside-avoid">
        <div className="flex items-center justify-between gap-4">
          {/* الجانب الأيمن: بيانات المنظمة وعنوان التقرير */}
          <div className="space-y-0.5 text-right">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-olive shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
                شركة المفاهيم القانونية
              </h1>
            </div>
            <p className="text-[11px] text-neutral-500 font-medium">
              نظام إدارة ومتابعة الحضور والبصمة — تقرير رسمي معتمد
            </p>
            <div className="pt-1">
              <h2 className="text-base sm:text-lg font-bold text-neutral-800 flex items-center gap-2">
                <span>تقرير البصمة الشهري:</span>
                <span className="text-[#8c8c5c] font-black underline decoration-brand-olive underline-offset-4">
                  {monthName}
                </span>
              </h2>
            </div>
          </div>

          {/* الجانب الأيسر: الشعار الرسمي وتاريخ الإصدار */}
          <div className="flex flex-col items-end shrink-0">
            <img
              src={logo}
              alt="شعار المفاهيم القانونية"
              className="w-36 sm:w-40 h-auto object-contain mb-1"
              draggable="false"
            />
            <div className="text-left dir-ltr text-[10px] text-neutral-500 font-medium">
              <span>تاريخ الإصدار: </span>
              <span className="font-bold text-neutral-700">{formattedToday}</span>
            </div>
          </div>
        </div>

        {/* شريط الإحصائيات السريعة في الترويسة */}
        <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-600 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-800">إجمالي الموظفين المشمولين:</span>
            <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6] font-bold text-neutral-900">
              {totalEmployees} موظف
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-800">إجمالي ساعات العمل المسجلة:</span>
            <span className="px-2 py-0.5 rounded-md bg-[#EBEBC8] font-bold text-neutral-900">
              {formatDuration(totalWorkedMinutes)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-800">توقيت الاعتماد:</span>
            <span className="text-neutral-500 font-medium">توقيت الرياض الرسمي</span>
          </div>
        </div>
      </header>

      {/* 2. بطاقات الملخص الإحصائي للشهر (ألوان صلبة 100% بدون شفافية) */}
      <section className="mb-3 break-inside-avoid" aria-label="ملخص إحصائيات الشهر">
        <div className="grid grid-cols-4 gap-2.5">
          {/* كرت التأخير */}
          <div className="p-2.5 px-3 rounded-lg border border-[#FDE68A] border-t-4 border-t-[#D97706] bg-[#FFFBEB] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-900">إجمالي أيام التأخير</span>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="text-xl font-black text-amber-700">{totalLateDays}</span>
              <span className="text-[10px] font-semibold text-amber-700">
                ({formatDuration(totalLateMinutes)})
              </span>
            </div>
          </div>

          {/* كرت الغياب */}
          <div className="p-2.5 px-3 rounded-lg border border-[#FECDD3] border-t-4 border-t-[#E11D48] bg-[#FFF1F2] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-rose-900">إجمالي أيام الغياب</span>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="text-xl font-black text-rose-700">{totalAbsenceDays}</span>
              <span className="text-[10px] font-semibold text-rose-700">يوم غياب</span>
            </div>
          </div>

          {/* كرت الإجازات */}
          <div className="p-2.5 px-3 rounded-lg border border-[#BAE6FD] border-t-4 border-t-[#0284C7] bg-[#F0F9FF] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-sky-900">إجمالي الإجازات</span>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="text-xl font-black text-sky-700">{totalLeaveDays}</span>
              <span className="text-[10px] font-semibold text-sky-700">يوم إجازة</span>
            </div>
          </div>

          {/* كرت الإنصراف المبكر */}
          <div className="p-2.5 px-3 rounded-lg border border-[#E9D5FF] border-t-4 border-t-[#9333EA] bg-[#FAF5FF] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-purple-900">إنصراف مبكر</span>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="text-xl font-black text-purple-700">{totalEarlyDeparture}</span>
              <span className="text-[10px] font-semibold text-purple-700">حالة</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. قسم أكثر الموظفين تأخراً لشهر (خلفية صلبة بدون شفافية) */}
      {topLate && topLate.length > 0 && (
        <section className="mb-3 p-2.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] break-inside-avoid" aria-label="أكثر الموظفين تأخراً">
          <h3 className="text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>أكثر الموظفين تأخراً لشهر {monthOnly}</span>
          </h3>
          <div className="space-y-1.5">
            {topLate.map((item, idx) => {
              const days = Number(item.lateDays) || 0
              const barWidth = Math.max(Math.round((days / maxLateDays) * 100), 8)
              return (
                <div key={item.employeeId || idx} className="flex items-center gap-3 text-xs">
                  <span className="w-5 text-neutral-400 font-bold text-center shrink-0">{idx + 1}</span>
                  <span className="w-44 font-bold text-neutral-800 truncate text-right shrink-0">
                    {item.name}
                  </span>
                  {/* شريط التقدم: مثبت تماماً على الجهة اليمنى ويبدأ بالامتلاء نحو اليسار */}
                  <div className="flex-1 h-2 rounded-full bg-[#E5E7EB] overflow-hidden relative" dir="rtl">
                    <div
                      className="h-full rounded-full bg-[#CCCC99] absolute right-0 top-0 bottom-0"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="w-16 font-bold text-neutral-700 text-left dir-ltr shrink-0 text-[11px]">
                    {days} {days === 1 ? 'يوم' : days === 2 ? 'يومان' : 'أيام'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 4. جدول تقرير البصمة الشهري التفصيلي بأعمدة ثابتة العرض تمنع الالتفاف */}
      <section className="mb-2" aria-label="جدول الحضور والانصراف الشهري">
        <h3 className="text-xs font-bold text-neutral-900 mb-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neutral-700 shrink-0" />
          <span>السجل التفصيلي لموظفي الدوائر المشمولة ({totalEmployees} موظف)</span>
        </h3>

        <div className="border border-[#E5E7EB] rounded-lg overflow-hidden shadow-2xs">
          <table className="w-full text-xs text-right border-collapse table-fixed">
            <thead>
              <tr className="bg-[#343a40] text-white font-bold text-[11px] border-b-2 border-brand-olive">
                <th className="py-2 px-1 text-center w-[34px] border-l border-white/10">#</th>
                <th className="py-2 px-3 text-right w-[160px] border-l border-white/10">الموظف</th>
                <th className="py-2 px-3 text-right w-[155px] border-l border-white/10">الدائرة</th>
                <th className="py-2 px-1 text-center w-[72px] border-l border-white/10">أيام التأخير</th>
                <th className="py-2 px-1 text-center w-[82px] border-l border-white/10">مدة التأخير</th>
                <th className="py-2 px-1 text-center w-[58px] border-l border-white/10">الغياب</th>
                <th className="py-2 px-1 text-center w-[58px] border-l border-white/10">الإجازات</th>
                <th className="py-2 px-1 text-center w-[75px] border-l border-white/10">إنصراف مبكر</th>
                <th className="py-2 px-2 text-center w-[62px]">ساعات العمل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-neutral-500 font-bold">
                    لا توجد سجلات متاحة لهذا الشهر
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const lateDays = Number(row.lateDays) || 0
                  const lateMinutes = Number(row.lateMinutes) || 0
                  const absenceDays = Number(row.absenceDays) || 0
                  const leaveDays = Number(row.leaveDays) || 0
                  const earlyDepartureDays = Number(row.earlyDepartureDays) || 0
                  const workedMinutes = Number(row.workedMinutes) || 0

                  return (
                    <tr
                      key={row.employeeId || idx}
                      className={`break-inside-avoid ${
                        idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-[#FFFFFF]'
                      }`}
                    >
                      <td className="py-1 px-1 text-center text-neutral-400 font-semibold border-l border-[#E5E7EB] text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-1 px-3 border-l border-[#E5E7EB]">
                        <div className="font-bold text-neutral-800 truncate whitespace-nowrap text-[11px]" title={row.name}>{row.name}</div>
                        {row.code && (
                          <div className="text-[9px] text-neutral-400 font-mono">#{row.code}</div>
                        )}
                      </td>
                      <td className="py-1 px-3 text-neutral-600 border-l border-[#E5E7EB]">
                        <div className="truncate whitespace-nowrap text-[11px]" title={row.departmentName}>{row.departmentName || '—'}</div>
                      </td>
                      <td className="py-1 px-1 text-center border-l border-[#E5E7EB]">
                        {lateDays > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[22px] h-[19px] px-1.5 rounded-full font-bold text-[10px] text-[#92400E] bg-[#FEF3C7] border border-[#FCD34D] whitespace-nowrap">
                            {lateDays}
                          </span>
                        ) : (
                          <span className="text-neutral-300 font-mono text-xs">—</span>
                        )}
                      </td>
                      <td className="py-1 px-1 text-center font-medium border-l border-[#E5E7EB] text-neutral-700 text-[11px]">
                        {lateMinutes > 0 ? (
                          <span className="whitespace-nowrap">{formatDuration(lateMinutes)}</span>
                        ) : (
                          <span className="text-neutral-300 font-mono text-xs">—</span>
                        )}
                      </td>
                      <td className="py-1 px-1 text-center border-l border-[#E5E7EB]">
                        {absenceDays > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[22px] h-[19px] px-1.5 rounded-full font-bold text-[10px] text-[#9F1239] bg-[#FFE4E6] border border-[#FECDD3] whitespace-nowrap">
                            {absenceDays}
                          </span>
                        ) : (
                          <span className="text-neutral-300 font-mono text-xs">—</span>
                        )}
                      </td>
                      <td className="py-1 px-1 text-center border-l border-[#E5E7EB]">
                        {leaveDays > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[22px] h-[19px] px-1.5 rounded-full font-bold text-[10px] text-[#0369A1] bg-[#E0F2FE] border border-[#BAE6FD] whitespace-nowrap">
                            {leaveDays}
                          </span>
                        ) : (
                          <span className="text-neutral-300 font-mono text-xs">—</span>
                        )}
                      </td>
                      <td className="py-1 px-1 text-center border-l border-[#E5E7EB]">
                        {earlyDepartureDays > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[22px] h-[19px] px-1.5 rounded-full font-bold text-[10px] text-[#6B21A8] bg-[#F3E8FF] border border-[#E9D5FF] whitespace-nowrap">
                            {earlyDepartureDays}
                          </span>
                        ) : (
                          <span className="text-neutral-300 font-mono text-xs">—</span>
                        )}
                      </td>
                      <td className="py-1 px-2 text-center font-bold text-neutral-800 text-[11px] dir-ltr">
                        <span className="whitespace-nowrap font-mono">{workedMinutes > 0 ? formatColonDuration(workedMinutes) : '0:00'}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. التذييل الرسمي المعتمد (بدون توقيعات حسب طلب المستخدم) */}
      <footer className="pt-2 mt-3 border-t border-neutral-200 text-xs break-inside-avoid text-neutral-500">
        <div className="flex items-center justify-between text-[10px] font-medium">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-olive inline-block" />
            <span>شركة المفاهيم القانونية للمحاماة والاستشارات — تقرير حضور رسمي معتمد إلكترونياً</span>
          </div>
          <div className="font-mono text-neutral-400">
            صفحة 1 من 1
          </div>
        </div>
      </footer>
    </div>
  )
}
