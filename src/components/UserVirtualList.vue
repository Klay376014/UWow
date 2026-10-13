<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import { computed, ref, watch, watchEffect } from 'vue'
import { useIsDesktop } from '../composables/useBreakpoint'
import { COLUMNS } from '../columns'
import type { SortableKey, SortState, User } from '../types/user'
import UserCard from './UserCard.vue'
import UserTableRow from './UserTableRow.vue'

const props = defineProps<{
  rows: User[]
  total: number
  loading: boolean
  hasMore: boolean
  error: string | null
  sort: SortState
}>()

const emit = defineEmits<{
  loadMore: []
  retry: []
  sort: [key: SortableKey]
  edit: [user: User]
  remove: [user: User]
}>()

const PREFETCH_ROWS = 100
const HEADER_HEIGHT = 40

const isDesktop = useIsDesktop()
const scrollEl = ref<HTMLElement | null>(null)

// Fixed row heights (text truncates with ellipsis) skip per-row DOM measurement, which keeps scrolling cheap with thousands of loaded rows.
const rowHeight = computed(() => (isDesktop.value ? 44 : 112))
const showFooter = computed(() => props.hasMore || props.loading || !!props.error)

const virtualizer = useVirtualizer(
  computed(() => ({
    count: props.rows.length + (showFooter.value ? 1 : 0),
    getScrollElement: () => scrollEl.value,
    estimateSize: () => rowHeight.value,
    getItemKey: (index: number) => props.rows[index]?.id ?? 'footer',
    paddingStart: isDesktop.value ? HEADER_HEIGHT : 8,
    paddingEnd: 8,
    overscan: 10,
  })),
)

const virtualItems = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

watch(isDesktop, () => virtualizer.value.measure())

const ariaSort = (key: SortableKey) =>
  props.sort.key !== key ? 'none' : props.sort.dir === 'asc' ? 'ascending' : 'descending'

const sortIcon = (key: SortableKey) => (props.sort.key !== key ? '↕' : props.sort.dir === 'asc' ? '↑' : '↓')

watch(
  () => props.rows.length === 0,
  (empty) => empty && virtualizer.value.scrollToOffset(0),
)

watchEffect(() => {
  const last = virtualItems.value.at(-1)
  if (!last || !props.hasMore || props.loading || props.error) return
  if (last.index >= props.rows.length - PREFETCH_ROWS) emit('loadMore')
})
</script>

<template>
  <div
    ref="scrollEl"
    class="scroller"
    :class="isDesktop ? 'is-desktop' : 'is-mobile'"
    :role="isDesktop ? 'table' : 'list'"
    :aria-rowcount="isDesktop ? total + 1 : undefined"
    aria-label="Users"
  >
    <div class="spacer" :style="{ height: `${totalSize}px` }">
      <div v-if="isDesktop" class="table-header" role="row" aria-rowindex="1">
        <div v-for="col in COLUMNS" :key="col.key" role="columnheader" :aria-sort="ariaSort(col.key)">
          <button
            type="button"
            class="sort-button"
            :class="{ active: sort.key === col.key }"
            @click="emit('sort', col.key)"
          >
            {{ col.label }}
            <span class="sort-icon" aria-hidden="true">{{ sortIcon(col.key) }}</span>
          </button>
        </div>
        <div role="columnheader"><span class="visually-hidden">Actions</span></div>
      </div>

      <div
        v-for="item in virtualItems"
        :key="item.key as string"
        class="virtual-item"
        :role="isDesktop ? undefined : 'listitem'"
        :style="{ height: `${item.size}px`, transform: `translateY(${item.start}px)` }"
      >
        <template v-if="item.index < rows.length">
          <UserTableRow
            v-if="isDesktop"
            :user="rows[item.index]"
            :index="item.index"
            @edit="emit('edit', rows[item.index])"
            @remove="emit('remove', rows[item.index])"
          />
          <UserCard
            v-else
            :user="rows[item.index]"
            @edit="emit('edit', rows[item.index])"
            @remove="emit('remove', rows[item.index])"
          />
        </template>
        <div v-else class="footer">
          <template v-if="error">
            <span class="error">{{ error }}</span>
            <button type="button" @click="emit('retry')">Retry</button>
          </template>
          <span v-else>Loading…</span>
        </div>
      </div>
    </div>

    <p v-if="!loading && !error && rows.length === 0" class="empty">No matching users</p>
  </div>
</template>

<style scoped>
.scroller {
  --table-columns: minmax(160px, 2fr) minmax(150px, 1.6fr) minmax(110px, 1.2fr) 72px 112px 80px;
  position: relative;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  contain: strict;
}

.spacer {
  position: relative;
  width: 100%;
}

.table-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: grid;
  grid-template-columns: var(--table-columns);
  align-items: center;
  height: 40px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  font-weight: 600;
}

.sort-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  margin-left: -6px;
  border: 0;
  border-radius: 4px;
  color: inherit;
  background: none;
  font-weight: 600;
  cursor: pointer;
}

.sort-button:hover {
  background: var(--border);
}

.sort-button:focus-visible {
  outline: 2px solid var(--accent);
}

.sort-icon {
  color: var(--muted);
}

.sort-button.active .sort-icon {
  color: var(--accent);
}

.virtual-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.is-mobile .virtual-item {
  padding: 0 12px;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  color: var(--muted);
}

.error {
  color: var(--danger);
}

.empty {
  position: absolute;
  inset: 80px 0 auto;
  text-align: center;
  color: var(--muted);
}
</style>
