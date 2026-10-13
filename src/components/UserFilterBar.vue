<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { COLUMNS } from '../columns'
import { useIsDesktop } from '../composables/useBreakpoint'
import { useUserListStore } from '../stores/userList'
import { createEmptyFilters, type SortableKey, type UserFilters } from '../types/user'
import UserFilterFields from './UserFilterFields.vue'

const store = useUserListStore()
const isDesktop = useIsDesktop()

const draft = ref<UserFilters>({ ...store.filters })
const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(store.filters))

const sheet = ref<HTMLDialogElement | null>(null)

function openSheet() {
  draft.value = { ...store.filters }
  sheet.value?.showModal()
}

function search() {
  store.applyFilters(draft.value)
  sheet.value?.close()
}

function clear() {
  draft.value = createEmptyFilters()
  search()
}

watch(isDesktop, () => sheet.value?.close())

function setSortKey(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  store.sort.key = value ? (value as SortableKey) : null
  store.sort.dir = 'asc'
}

function flipSortDir() {
  store.sort.dir = store.sort.dir === 'asc' ? 'desc' : 'asc'
}
</script>

<template>
  <section class="filter-bar" aria-label="Filters">
    <form v-if="isDesktop" class="desktop-form" @submit.prevent="search">
      <UserFilterFields v-model="draft" />
      <div class="actions">
        <button type="submit" class="primary" :class="{ pending: dirty }">Search</button>
        <button v-if="store.activeFilterCount || dirty" type="button" class="link" @click="clear">Clear</button>
      </div>
    </form>

    <div v-else class="mobile-controls">
      <button type="button" class="toggle" aria-haspopup="dialog" @click="openSheet">
        Filters<span v-if="store.activeFilterCount" class="badge">{{ store.activeFilterCount }}</span>
      </button>
      <select class="sort-select" aria-label="Sort by" :value="store.sort.key ?? ''" @change="setSortKey">
        <option value="">No sorting</option>
        <option v-for="col in COLUMNS" :key="col.key" :value="col.key">{{ col.label }}</option>
      </select>
      <button
        type="button"
        class="dir"
        :disabled="!store.sort.key"
        :aria-label="store.sort.dir === 'asc' ? 'Ascending' : 'Descending'"
        @click="flipSortDir"
      >
        {{ store.sort.dir === 'asc' ? '↑' : '↓' }}
      </button>
    </div>

    <dialog v-if="!isDesktop" ref="sheet" class="sheet" aria-labelledby="filter-sheet-title">
      <form class="sheet-form" @submit.prevent="search">
        <header class="sheet-header">
          <h2 id="filter-sheet-title">Filters</h2>
          <button type="button" class="close" aria-label="Close" @click="sheet?.close()">✕</button>
        </header>
        <div class="sheet-body">
          <UserFilterFields v-model="draft" />
        </div>
        <footer class="sheet-footer">
          <button type="button" @click="clear">Clear</button>
          <button type="submit" class="primary">Search</button>
        </footer>
      </form>
    </dialog>
  </section>
</template>

<style scoped>
.filter-bar {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
}

.desktop-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 200px)) minmax(160px, 180px) minmax(260px, 300px) auto;
  align-items: end;
  gap: 16px;
}

.actions {
  display: flex;
  gap: 8px;
}

.mobile-controls {
  display: flex;
  gap: 8px;
}

.sort-select {
  flex: 1;
  min-width: 0;
}

button,
select {
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  background: var(--bg);
  cursor: pointer;
}

button:focus-visible,
select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.primary {
  border-color: var(--accent);
  color: #fff;
  background: var(--accent);
  font-weight: 600;
}

.primary.pending {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent);
}

.link {
  border-color: transparent;
  color: var(--accent);
  background: none;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.badge {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 9px;
  color: #fff;
  background: var(--accent);
  font-size: 0.75rem;
  line-height: 18px;
  text-align: center;
}

.dir {
  width: 40px;
  padding: 0;
}

.sheet {
  width: 100%;
  max-width: none;
  max-height: 85dvh;
  margin: auto 0 0;
  padding: 0;
  border: 0;
  border-radius: 12px 12px 0 0;
  color: var(--text);
  background: var(--bg);
}

.sheet::backdrop {
  background: rgb(0 0 0 / 0.4);
}

.sheet[open] {
  animation: slide-up 0.2s ease-out;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
}

.sheet-form {
  display: flex;
  flex-direction: column;
  max-height: 85dvh;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.sheet-header h2 {
  margin: 0;
  font-size: 1rem;
}

.close {
  width: 34px;
  padding: 0;
  border-color: transparent;
}

.sheet-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
}

.sheet-footer {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 8px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border);
}

.sheet-footer button {
  height: 40px;
}
</style>
