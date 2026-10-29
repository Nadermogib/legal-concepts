/**
 * @file useSettings.js
 * خطافات جلب وتحديث الإعدادات وقائمة الدوائر
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDepartments, getSettings, updateSettings } from '../api/client.js'

export const SETTINGS_KEYS = {
  departments: ['departments'],
  settings: ['settings'],
}

/**
 * خطاف جلب قائمة الدوائر
 */
export function useDepartments() {
  return useQuery({
    queryKey: SETTINGS_KEYS.departments,
    queryFn: () => getDepartments(),
  })
}

/**
 * خطاف جلب إعدادات الدوائر المفعّلة
 */
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEYS.settings,
    queryFn: () => getSettings(),
  })
}

/**
 * خطاف تحديث إعدادات الدوائر المفعّلة
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body) => updateSettings(body),
    onSuccess: (updated) => {
      queryClient.setQueryData(SETTINGS_KEYS.settings, updated)
      // إبطال قائمة الدوائر والنظرة العامة لإعادة المزامنة
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.departments })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })
}
