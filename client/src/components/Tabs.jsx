/**
 * @file Tabs.jsx
 * مبدّل التبويبات المعتمد في التقارير (التقرير اليومي / التقرير الشهري)
 * حاوية بخلفية tab-track (#D9D9D9) وتبويب نشط أبيض بظل خفيف
 */

export default function Tabs({
  tabs = [], // [{ id, label }]
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center bg-tab-track p-1.5 rounded-card select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange && onChange(tab.id)}
            className={`min-w-[105px] h-[40px] px-4 rounded-md text-sm transition-all duration-150 flex items-center justify-center font-bold ${
              isActive
                ? 'bg-white text-text-strong shadow-sm'
                : 'text-text-inactive-tab hover:text-text-strong font-normal'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
