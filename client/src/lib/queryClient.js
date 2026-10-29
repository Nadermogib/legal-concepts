/**
 * @file queryClient.js
 * تهيئة QueryClient بالافتراضيات المعتمدة في المواصفات
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // دقيقة واحدة
      refetchOnWindowFocus: false, // لا إعادة جلب عند العودة للنافذة
      retry: 1, // محاولة إعادة واحدة فقط عند الفشل
    },
  },
})

export default queryClient
