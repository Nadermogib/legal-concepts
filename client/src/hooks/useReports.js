/**
 * @file useReports.js
 * خطافات جلب بيانات تقارير البصمة اليومية والشهرية مع دعم التحديث والحفاظ على البيانات السابقة
 */

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getDailyReport, getMonthlyReport } from '../api/client.js'

export const REPORTS_KEYS = {
  daily: ['reports', 'daily'],
  monthly: (month) => ['reports', 'monthly', { month }],
}

/**
 * خطاف تقرير البصمة اليومي
 */
export function useDailyReport() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const query = useQuery({
    queryKey: REPORTS_KEYS.daily,
    queryFn: () => getDailyReport(),
  })

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const freshData = await getDailyReport({ refresh: true })
      queryClient.setQueryData(REPORTS_KEYS.daily, freshData)
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
 * خطاف تقرير البصمة الشهري
 * @param {{ month: string }} params
 */
export function useMonthlyReport({ month }) {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryKey = REPORTS_KEYS.monthly(month)

  const query = useQuery({
    queryKey,
    queryFn: () => getMonthlyReport({ month }),
    placeholderData: keepPreviousData,
    enabled: Boolean(month),
  })

  const refresh = useCallback(async () => {
    if (!month) return
    try {
      setIsRefreshing(true)
      const freshData = await getMonthlyReport({ month, refresh: true })
      queryClient.setQueryData(queryKey, freshData)
      return freshData
    } finally {
      setIsRefreshing(false)
    }
  }, [month, queryClient, queryKey])

  return {
    ...query,
    refresh,
    isRefreshing,
  }
}
