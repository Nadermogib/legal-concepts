/**
 * @file useOverview.js
 * خطافات جلب بيانات النظرة العامة اليومية والفترة المحددة مع دعم التحديث المباشر
 */

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getDailyOverview, getPeriodOverview } from '../api/client.js'

export const OVERVIEW_KEYS = {
  daily: ['overview', 'daily'],
  period: (from, to) => ['overview', 'period', { from, to }],
}

/**
 * خطاف النظرة العامة اليومية
 */
export function useDailyOverview() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const query = useQuery({
    queryKey: OVERVIEW_KEYS.daily,
    queryFn: () => getDailyOverview(),
  })

  // زر التحديث: يتجاوز الكاش ويجلب بيانات حديثة بـ refresh=1 ويحدّث الكاش
  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const freshData = await getDailyOverview({ refresh: true })
      queryClient.setQueryData(OVERVIEW_KEYS.daily, freshData)
      return freshData
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient])

  return {
    ...query,
    refresh,
    isRefreshing,
  }
}

/**
 * خطاف النظرة العامة لفترة محددة
 * @param {{ from: string, to: string }} params
 */
export function usePeriodOverview({ from, to }) {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryKey = OVERVIEW_KEYS.period(from, to)

  const query = useQuery({
    queryKey,
    queryFn: () => getPeriodOverview({ from, to }),
    placeholderData: keepPreviousData, // الحفاظ على البيانات السابقة أثناء التحميل لمنع وميض الصفحة
    enabled: Boolean(from && to),
  })

  const refresh = useCallback(async () => {
    if (!from || !to) return
    try {
      setIsRefreshing(true)
      const freshData = await getPeriodOverview({ from, to, refresh: true })
      queryClient.setQueryData(queryKey, freshData)
      return freshData
    } finally {
      setIsRefreshing(false)
    }
  }, [from, to, queryClient, queryKey])

  return {
    ...query,
    refresh,
    isRefreshing,
  }
}
