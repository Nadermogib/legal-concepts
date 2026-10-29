/**
 * @file DataTable.jsx
 * جدول البيانات المشترك لتقارير البصمة اليومية والشهرية
 * مطابقة لقياسات DESIGN_NOTES.md:
 * - حاوية مستجيبة بـ overflow-x-auto
 * - ترويسة بارتفاع ~59px، نصوص Bold ~18px #4D4D4D
 * - صفوف بـ pitch ~64px، فواصل 1px #999999
 * - فرز تصاعدي وتنازلي بالنقر على ترويسة العمود المدعوم مع أيقونات ArrowUp / ArrowDown
 */

import { useState, useMemo } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import EmptyState from './EmptyState.jsx'

/**
 * مقارنة قيمتين للفرز التلقائي
 */
function defaultComparator(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  const strA = String(a).trim()
  const strB = String(b).trim()
  return strA.localeCompare(strB, 'ar', { numeric: true, sensitivity: 'base' })
}

export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  defaultSortKey = null,
  defaultSortDir = 'asc',
  emptyTitle = 'لا توجد بيانات متاحة',
  emptyDescription = 'لم يتم العثور على أي سجلات مطابقة في الوقت الحالي.',
  className = '',
  onRowClick = null,
}) {
  const [sortConfig, setSortConfig] = useState({
    key: defaultSortKey,
    direction: defaultSortDir,
  })

  // التعامل مع النقر على ترويسة العمود
  const handleSort = (column) => {
    if (!column.sortable) return

    setSortConfig((prev) => {
      if (prev.key === column.key) {
        return {
          key: column.key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      return {
        key: column.key,
        direction: column.defaultSortDir || 'desc',
      }
    })
  }

  // فرز البيانات
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data

    const activeCol = columns.find((c) => c.key === sortConfig.key)
    if (!activeCol) return data

    const sorted = [...data].sort((rowA, rowB) => {
      const valA = activeCol.sortValue ? activeCol.sortValue(rowA) : rowA[sortConfig.key]
      const valB = activeCol.sortValue ? activeCol.sortValue(rowB) : rowB[sortConfig.key]

      const comparison = defaultComparator(valA, valB)
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [data, columns, sortConfig])

  return (
    <div
      className={`w-full overflow-x-auto border border-neutral-200/90 rounded-card bg-white shadow-xs ${className}`}
    >
      <table className="w-full text-right border-collapse min-w-[680px]">
        {/* ترويسة الجدول (~54px) */}
        <thead>
          <tr className="h-[54px] border-b border-neutral-200/80 bg-neutral-50/70 select-none">
            {columns.map((column) => {
              const isSorted = sortConfig.key === column.key
              const alignClass =
                column.align === 'center'
                  ? 'text-center'
                  : column.align === 'left'
                  ? 'text-left'
                  : 'text-right'

              return (
                <th
                  key={column.key}
                  scope="col"
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                  className={`px-4 text-[16px] sm:text-[17px] font-bold text-neutral-600 ${alignClass} ${
                    column.sortable ? 'cursor-pointer hover:bg-neutral-100/70 hover:text-neutral-900 transition-colors' : ''
                  }`}
                  aria-sort={
                    isSorted
                      ? sortConfig.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      column.align === 'center'
                        ? 'justify-center'
                        : column.align === 'left'
                        ? 'justify-start'
                        : 'justify-start'
                    }`}
                  >
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="inline-flex shrink-0 w-4 h-4 items-center justify-center text-text-strong">
                        {isSorted ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp size={15} strokeWidth={2} />
                          ) : (
                            <ArrowDown size={15} strokeWidth={2} />
                          )
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-border-grid/40 opacity-0 group-hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>

        {/* جسم الجدول (صفوف pitch ~64px) */}
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((row, index) => {
              const rowKey = row[keyField] || index
              const isClickable = Boolean(onRowClick)

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`h-[64px] border-b border-neutral-100 last:border-b-0 transition-colors duration-150 ${
                    isClickable
                      ? 'cursor-pointer hover:bg-brand-olive/10'
                      : 'hover:bg-neutral-50/70'
                  }`}
                >
                  {columns.map((column) => {
                    const alignClass =
                      column.align === 'center'
                        ? 'text-center'
                        : column.align === 'left'
                        ? 'text-left'
                        : 'text-right'

                    const cellContent = column.render
                      ? column.render(row)
                      : row[column.key] != null && row[column.key] !== ''
                      ? row[column.key]
                      : '—'

                    return (
                      <td
                        key={column.key}
                        className={`px-4 text-[17px] text-text-strong align-middle ${alignClass}`}
                      >
                        {cellContent}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center">
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  className="py-6"
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
