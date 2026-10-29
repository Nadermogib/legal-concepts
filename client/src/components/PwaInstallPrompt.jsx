/**
 * @file PwaInstallPrompt.jsx
 * نافذة ذكية تقترح على الموظف أو المدير تثبيت التطبيق على سطح المكتب أو الجوال
 * تدعم حدث beforeinstallprompt للمتصفحات (Chrome / Edge / Android) مع تعليمات لـ iOS
 */

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // التحقق مما إذا كان التطبيق مثبتاً ويعمل بالفعل كـ Standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) {
      return
    }

    // التحقق من تأجيل المستخدم للتثبيت خلال آخر 5 أيام
    const dismissedAt = localStorage.getItem('lc_pwa_prompt_dismissed')
    if (dismissedAt) {
      const daysPassed = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (daysPassed < 5) return
    }

    // التعرف على نظام iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(isIosDevice)

    // التقاط حدث التثبيت التلقائي في Chrome / Edge / Android
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    // الاستماع لحدث اكتمال التثبيت
    const handleAppInstalled = () => {
      setInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    // على أجهزة iOS، إذا فتح الصفحة من المتصفح، نظهر له الاقتراح بعد 3 ثوانٍ
    let iosTimer = null
    if (isIosDevice && !isStandalone) {
      iosTimer = setTimeout(() => {
        setIsVisible(true)
      }, 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      if (iosTimer) clearTimeout(iosTimer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsVisible(false)
      }
    } catch (err) {
      console.warn('Install prompt error:', err)
    } finally {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    try {
      localStorage.setItem('lc_pwa_prompt_dismissed', String(Date.now()))
    } catch {
      // تجاهل
    }
  }

  if (!isVisible || installed) return null

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-title"
      className="fixed bottom-5 left-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] sm:w-96 bg-[#202428] text-white rounded-2xl shadow-2xl border border-white/10 p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 print:hidden"
    >
      <div className="flex items-start gap-3">
        {/* أيقونة التطبيق الصغيرة */}
        <div className="w-12 h-12 rounded-xl bg-[#2A2E33] border border-amber-500/30 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
          <img
            src="/pwa-192x192.png"
            alt="المفاهيم القانونية"
            className="w-10 h-10 object-contain rounded-lg"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 id="pwa-title" className="text-sm font-bold text-white tracking-wide">
              تثبيت تطبيق المفاهيم القانونية
            </h2>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="إغلاق التنبيه"
              className="text-white/50 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-1 text-xs text-white/70 leading-relaxed">
            {isIos && !deferredPrompt ? (
              <span>
                للتثبيت على الآيفون: اضغط زر المشاركة{' '}
                <span className="inline-block px-1 bg-white/15 rounded text-[10px]">⎋</span>{' '}
                ثم اختر <strong className="text-amber-300">«إضافة إلى الصفحة الرئيسية»</strong>.
              </span>
            ) : (
              <span>
                ثبّت التطبيق على جهازك للوصول السريع ومتابعة سجلات الحضور بضغطة زر واحدة.
              </span>
            )}
          </p>

          <div className="mt-3.5 flex items-center gap-2">
            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md transition-all duration-200 cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تثبيت الآن</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className={`text-xs py-2 px-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
                !deferredPrompt ? 'w-full bg-white/10 text-white' : ''
              }`}
            >
              {!deferredPrompt ? 'فهمت ذلك' : 'لاحقاً'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
