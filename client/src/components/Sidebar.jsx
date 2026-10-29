/**
 * @file Sidebar.jsx
 * القائمة الجانبية (282px) على اليمين: الشعار وثلاثة عناصر تنقل بحالة نشطة
 * تدعم الفتح والإغلاق بسلاسة على كافة الشاشات (السطح المكتبي والجوال)
 */

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Fingerprint, Settings, ChevronRight } from 'lucide-react'
import logo from '../assets/images/logo.png'

export const NAV_ITEMS = [
  { to: '/', label: 'نظرة عامة', icon: LayoutDashboard, end: true },
  { to: '/reports', label: 'تقارير البصمة', icon: Fingerprint },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
]

export default function Sidebar({ open = true, onClose }) {
  const handleNavClick = () => {
    // إغلاق القائمة تلقائياً بعد النقر فقط على الشاشات الصغيرة (الجوال)
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* خلفية معتمة للشاشات الصغيرة */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden print:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="app-sidebar"
        aria-label="القائمة الجانبية"
        className={`fixed inset-y-0 right-0 z-50 bg-gradient-to-b from-[#8c8c8c] via-[#949494] to-[#888888] shadow-2xl transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-auto lg:shadow-none overflow-hidden print:hidden ${
          open
            ? 'w-[282px] max-w-[85vw] translate-x-0 opacity-100 visible'
            : 'w-0 max-w-0 translate-x-full lg:translate-x-0 opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* حاوية داخلية ذات عرض ثابت 282px لمنع تشوه المحتوى أثناء حركة الفتح والإغلاق */}
        <div className="w-[282px] h-full flex flex-col relative overflow-y-auto">
          {/* زر إغلاق القائمة */}
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة الجانبية"
            title="إغلاق القائمة الجانبية"
            className="absolute top-3.5 left-3.5 text-white/80 hover:text-white p-1.5 cursor-pointer hover:bg-white/15 rounded-lg transition-all duration-200 group"
          >
            <ChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={2} />
          </button>

          {/* الشعار */}
          <div className="pt-9 px-0 flex justify-center">
            <img
              src={logo}
              alt="شعار المفاهيم القانونية"
              className="w-[226px] max-w-[80%] h-auto object-contain select-none drop-shadow-sm"
              draggable="false"
            />
          </div>

          {/* روابط التنقل الرئيسية */}
          <nav className="mt-10 flex flex-col gap-[18px]" aria-label="التنقل الرئيسي">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `group relative h-[51px] flex items-center gap-[14px] pr-[16px] pl-4 text-[17px] transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-sidebar-active-bg/95 text-brand-olive font-bold shadow-inner'
                      : 'text-white/90 hover:text-white hover:bg-white/10 hover:pr-[20px]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute right-0 inset-y-1 w-[5px] rounded-l-full bg-brand-olive shadow-sm" />
                    )}
                    <Icon
                      className={`w-[22px] h-[22px] shrink-0 transition-transform duration-200 ${
                        isActive ? 'scale-110' : 'group-hover:scale-105'
                      }`}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}

