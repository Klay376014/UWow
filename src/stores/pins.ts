import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { Pin } from '../types/user'
import { insertPin } from '../utils/mergePinned'

// Pinned rows are fetched in one request and their ids ride along in every page query; beyond this, pins should move to a backend table.
export const MAX_PINS = 100

export const usePinStore = defineStore('pins', () => {
  const pins = useStorage<Pin[]>('uwow:pins', [])

  const pinnedIds = computed(() => pins.value.map((p) => p.userId))
  const pinnedIdSet = computed(() => new Set(pinnedIds.value))
  const positionOf = (userId: string) => pins.value.find((p) => p.userId === userId)?.position ?? null

  function pin(userId: string, userName: string, position: number) {
    const others = pins.value.filter((p) => p.userId !== userId)
    if (others.length >= MAX_PINS) return false
    pins.value = insertPin(others, { userId, userName, position })
    return true
  }

  function unpin(userId: string) {
    pins.value = pins.value.filter((p) => p.userId !== userId)
  }

  function rename(userId: string, userName: string) {
    if (!pinnedIdSet.value.has(userId)) return
    pins.value = pins.value.map((p) => (p.userId === userId ? { ...p, userName } : p))
  }

  function retain(existingIds: Set<string>) {
    pins.value = pins.value.filter((p) => existingIds.has(p.userId))
  }

  return { pins, pinnedIds, pinnedIdSet, positionOf, pin, unpin, rename, retain }
})
