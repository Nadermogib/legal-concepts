/**
 * @file useHealth.js
 * خطاف فحص صحة الخادم
 */

import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api/client.js'

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => getHealth(),
  })
}
