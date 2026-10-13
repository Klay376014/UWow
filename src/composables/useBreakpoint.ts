import { useMediaQuery } from '@vueuse/core'

export const useIsDesktop = () => useMediaQuery('(min-width: 768px)')
