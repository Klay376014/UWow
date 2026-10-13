import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  details?: string[]
  confirmText?: string
  danger?: boolean
}

const state = reactive<{ open: boolean; options: ConfirmOptions | null }>({ open: false, options: null })
let resolver: ((ok: boolean) => void) | null = null

function settle(ok: boolean) {
  state.open = false
  resolver?.(ok)
  resolver = null
}

export function useConfirm() {
  return (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      resolver?.(false)
      resolver = resolve
      state.options = options
      state.open = true
    })
}

export const useConfirmState = () => ({ state, settle })
