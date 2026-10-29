/**
 * @file SettingsPage.jsx
 * صفحة الإعدادات (1.11)
 * مطابقة للمواصفات و DESIGN_NOTES.md (القسم 6) وتصميم setup.png:
 * - اختيار الدوائر المشمولة بمفاتيح التبديل (Toggle الزيتوني = مفعّل، الرمادي = معطّل)
 * - حفظ يدوي بزر "حفظ الإعدادات"
 * - تعطيل الحفظ وإظهار تنبيه عند إلغاء تحديد كافة الدوائر ("فعّل دائرة واحدة على الأقل")
 * - رسائل نجاح / فشل الحفظ
 * - تطبيق فوري ومزامنة في وضع الـ Mock للدوائر والدونات
 */

import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Check, AlertCircle, Save, Loader2 } from 'lucide-react'
import { useDepartments, useSettings, useUpdateSettings } from '../hooks/useSettings.js'
import Toggle from '../components/Toggle.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'

function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 border-b border-border-grid/30"
          >
            <div className="space-y-2">
              <div className="w-48 h-4 bg-tab-track/70 rounded animate-pulse" />
              <div className="w-16 h-3 bg-tab-track/50 rounded animate-pulse" />
            </div>
            <div className="w-12 h-7 bg-tab-track/60 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
      <div className="w-32 h-10 bg-tab-track/70 rounded-card animate-pulse" />
    </div>
  )
}

export default function SettingsPage() {
  const { registerRefresh } = useOutletContext() ?? {}

  // جلب قائمة الدوائر النشطة
  const {
    data: deptsData,
    isPending: isDeptsPending,
    isError: isDeptsError,
    error: deptsError,
    refetch: refetchDepts,
  } = useDepartments()

  // جلب معرفات الدوائر المفعّلة المحفوظة
  const {
    data: settingsData,
    isPending: isSettingsPending,
    isError: isSettingsError,
    error: settingsError,
    refetch: refetchSettings,
  } = useSettings()

  // خطاف تحديث الإعدادات
  const updateMutation = useUpdateSettings()

  // الحالة المحلية لمعرفات الدوائر المحددة (قبل الحفظ)
  const [selectedIds, setSelectedIds] = useState(null)
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', message: string }

  // ربط زر التحديث بالترويسة
  useEffect(() => {
    registerRefresh?.(async () => {
      await Promise.all([refetchDepts(), refetchSettings()])
    })
    return () => registerRefresh?.(null)
  }, [refetchDepts, refetchSettings, registerRefresh])

  // مزامنة الحالة المحلية عند أول تحميل أو عند تغير البيانات من الخادم
  useEffect(() => {
    if (settingsData?.enabledDepartmentIds && selectedIds === null) {
      setSelectedIds(settingsData.enabledDepartmentIds)
    } else if (!settingsData && deptsData?.departments && selectedIds === null) {
      // افتراض الدوائر المفعّلة من قائمة الدوائر إن وُجدت
      const initial = deptsData.departments.filter((d) => d.enabled).map((d) => d.id)
      setSelectedIds(initial)
    }
  }, [settingsData, deptsData, selectedIds])

  const departments = useMemo(() => deptsData?.departments || [], [deptsData])

  // التبديل بين التفعيل والتعطيل محلياً
  const handleToggle = (deptId, nextChecked) => {
    setFeedback(null)
    setSelectedIds((prev) => {
      const current = prev || []
      if (nextChecked) {
        return current.includes(deptId) ? current : [...current, deptId]
      }
      return current.filter((id) => id !== deptId)
    })
  }

  // التحقق من وجود تغييرات غير محفوظة
  const hasChanges = useMemo(() => {
    if (!selectedIds || !settingsData?.enabledDepartmentIds) return false
    const savedSet = new Set(settingsData.enabledDepartmentIds)
    const currentSet = new Set(selectedIds)
    if (savedSet.size !== currentSet.size) return true
    for (const id of currentSet) {
      if (!savedSet.has(id)) return true
    }
    return false
  }, [selectedIds, settingsData])

  // التحقق من صلاحية الحفظ (دائرة واحدة على الأقل)
  const isValid = selectedIds && selectedIds.length > 0

  // حفظ الإعدادات
  const handleSave = async (e) => {
    e.preventDefault()
    if (!isValid) return

    setFeedback(null)
    try {
      await updateMutation.mutateAsync({
        enabledDepartmentIds: selectedIds,
      })
      setFeedback({
        type: 'success',
        message: 'تم حفظ الإعدادات بنجاح.',
      })
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.message || 'تعذّر حفظ الإعدادات. حاول مرة أخرى.',
      })
    }
  }

  const isLoading = isDeptsPending || isSettingsPending
  const isError = isDeptsError || isSettingsError
  const activeError = deptsError || settingsError

  return (
    <div className="space-y-6">
      {/* عنوان الصفحة ووصفها المطابق للمواصفات والقسم 6 من DESIGN_NOTES.md */}
      <div className="space-y-1 mb-8">
        <h2 className="text-[22px] font-bold text-brand-olive leading-tight">
          الإعدادات
        </h2>
        <p className="text-sm sm:text-base text-text-muted leading-relaxed">
          اختر الدوائر التي تريد متابعتها. أي دائرة جديدة تُضاف في جسر ستظهر هنا تلقائياً.
        </p>
      </div>

      {isLoading ? (
        <SettingsSkeleton />
      ) : isError ? (
        <ErrorState
          title="تعذّر تحميل الإعدادات"
          message={activeError?.message || 'حدث خطأ أثناء جلب قائمة الدوائر.'}
          onRetry={() => {
            refetchDepts()
            refetchSettings()
          }}
        />
      ) : departments.length === 0 ? (
        <EmptyState
          title="لا توجد دوائر متاحة"
          description="لم يتم العثور على أي دوائر نشطة حالياً في النظام."
        />
      ) : (
        <form onSubmit={handleSave} className="space-y-8 max-w-3xl">
          {/* رسائل التنبيه والنجاح */}
          {feedback && (
            <div
              role="alert"
              className={`p-4 rounded-card flex items-center gap-3 text-sm sm:text-base font-bold transition-all ${
                feedback.type === 'success'
                  ? 'bg-status-present/10 text-status-present border border-status-present/30'
                  : 'bg-status-absent/10 text-status-absent border border-status-absent/30'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-5 h-5 shrink-0" strokeWidth={2.5} />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={2.5} />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* تنبيه تعطيل الحفظ عند خلو القائمة */}
          {!isValid && (
            <div
              role="alert"
              className="p-3.5 rounded-card bg-status-excuse/10 text-status-excuse border border-status-excuse/30 flex items-center gap-2.5 text-sm font-bold select-none"
            >
              <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={2} />
              <span>فعّل دائرة واحدة على الأقل لتتمكن من حفظ الإعدادات.</span>
            </div>
          )}

          {/* قائمة الدوائر بمفاتيح التبديل (مطابقة لتخطيط setup.png) */}
          <div className="bg-white rounded-card divide-y divide-border-grid/50 border border-border-grid/40 shadow-sm overflow-hidden">
            {departments.map((dept) => {
              const isChecked = Boolean(selectedIds?.includes(dept.id))
              return (
                <div
                  key={dept.id}
                  className="px-5 sm:px-8 py-4 flex items-center justify-between gap-6 hover:bg-tab-track/10 transition-colors"
                >
                  {/* اسم الدائرة والكود على اليمين */}
                  <div className="flex flex-col text-right min-w-0 pr-1">
                    <span className="text-[16px] sm:text-[17px] font-bold text-text-strong leading-snug">
                      {dept.name}
                    </span>
                    <span className="text-[13px] sm:text-[14px] text-text-muted mt-0.5 font-medium">
                      {dept.displayCode || '—'}
                    </span>
                  </div>

                  {/* مفتاح التبديل على اليسار */}
                  <Toggle
                    checked={isChecked}
                    onChange={(nextChecked) => handleToggle(dept.id, nextChecked)}
                    ariaLabel={`تبديل تفعيل دائرة ${dept.name}`}
                  />
                </div>
              )
            })}
          </div>

          {/* منطقة الزر والإجراءات */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="submit"
              id="save-settings-button"
              disabled={!isValid || updateMutation.isPending}
              className={`px-8 py-2.5 rounded-card text-base font-bold text-white transition-all duration-200 inline-flex items-center gap-2 shadow-sm cursor-pointer select-none ${
                !isValid
                  ? 'bg-brand-gray/60 opacity-60 cursor-not-allowed'
                  : updateMutation.isPending
                  ? 'bg-brand-olive opacity-80 cursor-wait'
                  : 'bg-brand-olive hover:bg-olive-soft hover:text-text-strong active:scale-[0.98]'
              }`}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>جارٍ الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0" />
                  <span>حفظ الإعدادات</span>
                </>
              )}
            </button>

            {hasChanges && isValid && (
              <span className="text-xs sm:text-sm font-medium text-text-muted animate-pulse">
                توجد تعديلات غير محفوظة
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
