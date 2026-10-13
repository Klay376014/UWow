import { defineStore } from 'pinia'
import { computed, reactive, ref, shallowRef } from 'vue'
import { fetchUsers, PAGE_SIZE } from '../api/users'
import { createEmptyFilters, type SortableKey, type SortState, type User, type UserFilters } from '../types/user'
import { mergePinned, pinsInWindow, type PinnedItem } from '../utils/mergePinned'
import { usePinStore } from './pins'

export const useUserListStore = defineStore('userList', () => {
  const pinStore = usePinStore()

  const filters = reactive<UserFilters>(createEmptyFilters())
  const sort = reactive<SortState>({ key: null, dir: 'asc' })

  const regular = shallowRef<User[]>([])
  const pinned = shallowRef<PinnedItem<User>[]>([])
  const regularTotal = ref(0)
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const scrollTarget = ref<number | null>(null)

  const complete = computed(() => loaded.value && regular.value.length >= regularTotal.value)
  const hasMore = computed(() => loaded.value && !complete.value)
  const rows = computed(() => (loaded.value ? mergePinned(regular.value, pinned.value, complete.value) : []))
  const total = computed(() => regularTotal.value + pinned.value.length)

  const activeFilterCount = computed(
    () => Object.values(filters).filter((v) => (Array.isArray(v) ? v.length > 0 : v !== '' && v != null)).length,
  )

  let controller: AbortController | null = null

  async function run(task: (signal: AbortSignal, isStale: () => boolean) => Promise<void>) {
    const current = new AbortController()
    controller?.abort()
    controller = current
    loading.value = true
    error.value = null
    try {
      await task(current.signal, () => current !== controller)
    } catch (e) {
      if (current === controller) error.value = (e as Error).message
    } finally {
      if (current === controller) loading.value = false
    }
  }

  function fetchNextPage(signal: AbortSignal) {
    const start = rows.value.length
    return fetchUsers(
      { filters, sort },
      {
        offset: regular.value.length,
        limit: PAGE_SIZE - pinsInWindow(pinned.value, start, PAGE_SIZE),
        excludeIds: pinStore.pinnedIds,
        signal,
      },
    )
  }

  async function fetchPinned(signal: AbortSignal): Promise<PinnedItem<User>[]> {
    const ids = pinStore.pinnedIds
    if (ids.length === 0) return []
    const { items } = await fetchUsers({ filters, sort }, { ids, offset: 0, limit: ids.length, signal })
    if (activeFilterCount.value === 0) pinStore.retain(new Set(items.map((u) => u.id)))
    return items
      .map((item) => ({ item, position: pinStore.positionOf(item.id) ?? 0 }))
      .sort((a, b) => a.position - b.position)
  }

  function loadMore() {
    if (loading.value || !hasMore.value) return
    return run(async (signal, isStale) => {
      const page = await fetchNextPage(signal)
      if (isStale()) return
      regular.value = [...regular.value, ...page.items]
      regularTotal.value = page.total
    })
  }

  function reload() {
    loaded.value = false
    regular.value = []
    pinned.value = []
    regularTotal.value = 0
    return run(async (signal, isStale) => {
      const nextPinned = await fetchPinned(signal)
      if (isStale()) return
      pinned.value = nextPinned
      const page = await fetchNextPage(signal)
      if (isStale()) return
      regular.value = page.items
      regularTotal.value = page.total
      loaded.value = true
    })
  }

  function retry() {
    return loaded.value ? loadMore() : reload()
  }

  function toggleSort(key: SortableKey) {
    if (sort.key !== key) {
      sort.key = key
      sort.dir = 'asc'
    } else if (sort.dir === 'asc') {
      sort.dir = 'desc'
    } else {
      sort.key = null
      sort.dir = 'asc'
    }
  }

  function applyFilters(next: UserFilters) {
    Object.assign(filters, next)
    return reload()
  }

  function replaceRow(user: User) {
    regular.value = regular.value.map((r) => (r.id === user.id ? user : r))
    pinned.value = pinned.value.map((p) => (p.item.id === user.id ? { ...p, item: user } : p))
    pinStore.rename(user.id, user.userName)
  }

  function removeRow(id: string) {
    if (pinStore.pinnedIdSet.has(id)) {
      pinned.value = pinned.value.filter((p) => p.item.id !== id)
      pinStore.unpin(id)
      return
    }
    const next = regular.value.filter((r) => r.id !== id)
    if (next.length === regular.value.length) return
    regular.value = next
    regularTotal.value -= 1
  }

  function pinRow(user: Pick<User, 'id' | 'userName'>, position: number) {
    if (!pinStore.pin(user.id, user.userName, position)) return false
    scrollTarget.value = position
    reload()
    return true
  }

  function unpinRow(userId: string) {
    pinStore.unpin(userId)
    reload()
  }

  return {
    filters,
    sort,
    rows,
    total,
    loading,
    error,
    hasMore,
    scrollTarget,
    activeFilterCount,
    loadMore,
    reload,
    retry,
    toggleSort,
    applyFilters,
    replaceRow,
    removeRow,
    pinRow,
    unpinRow,
  }
})
