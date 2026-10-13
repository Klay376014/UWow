import { defineStore } from 'pinia'
import { computed, reactive, ref, shallowRef } from 'vue'
import { fetchUsers, PAGE_SIZE } from '../api/users'
import { createEmptyFilters, type SortState, type User, type UserFilters } from '../types/user'

export const useUserListStore = defineStore('userList', () => {
  const filters = reactive<UserFilters>(createEmptyFilters())
  const sort = reactive<SortState>({ key: null, dir: 'asc' })

  const rows = shallowRef<User[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = computed(() => rows.value.length < total.value)

  let controller: AbortController | null = null

  async function loadMore() {
    if (loading.value) return
    loading.value = true
    error.value = null
    const current = new AbortController()
    controller = current
    try {
      const page = await fetchUsers(
        { filters, sort },
        { offset: rows.value.length, limit: PAGE_SIZE, signal: current.signal },
      )
      if (current !== controller) return
      rows.value = [...rows.value, ...page.items]
      total.value = page.total
    } catch (e) {
      if (current === controller) error.value = (e as Error).message
    } finally {
      if (current === controller) loading.value = false
    }
  }

  function reload() {
    controller?.abort()
    loading.value = false
    rows.value = []
    total.value = 0
    return loadMore()
  }

  return { filters, sort, rows, total, loading, error, hasMore, loadMore, reload }
})
