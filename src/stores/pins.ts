import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { Pin } from '../types/user'

export const usePinStore = defineStore('pins', () => {
  const pins = useStorage<Pin[]>('uwow:pins', [])

  const pinnedIds = computed(() => pins.value.map((p) => p.userId))
  const positionOf = (userId: string) => pins.value.find((p) => p.userId === userId)?.position ?? null

  function pin(userId: string, position: number) {
    pins.value = [
      ...pins.value.filter((p) => p.userId !== userId && p.position !== position),
      { userId, position },
    ].sort((a, b) => a.position - b.position)
  }

  function unpin(userId: string) {
    pins.value = pins.value.filter((p) => p.userId !== userId)
  }

  return { pins, pinnedIds, positionOf, pin, unpin }
})
