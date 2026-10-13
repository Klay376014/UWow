import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  text: string
  type: ToastType
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function show(text: string, type: ToastType = 'info', duration = 4000) {
    const id = nextId++
    toasts.value = [...toasts.value.slice(-2), { id, text, type }]
    setTimeout(() => dismiss(id), duration)
  }

  return { toasts, show, dismiss }
})
