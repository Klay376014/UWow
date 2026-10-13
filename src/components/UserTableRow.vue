<script setup lang="ts">
import type { User } from '../types/user'
import AppIcon from './AppIcon.vue'

defineProps<{ user: User; index: number }>()
const emit = defineEmits<{ edit: []; remove: [] }>()
</script>

<template>
  <div class="table-row" role="row" :aria-rowindex="index + 2">
    <div role="cell" class="cell" :title="user.userName">{{ user.userName }}</div>
    <div role="cell" class="cell" :title="user.position">{{ user.position }}</div>
    <div role="cell" class="cell" :title="user.location">{{ user.location }}</div>
    <div role="cell" class="cell num">{{ user.age }}</div>
    <div role="cell" class="cell num">{{ user.dateStart }}</div>
    <div role="cell" class="cell actions">
      <button type="button" class="icon-btn" :aria-label="`Edit ${user.userName}`" title="Edit" @click="emit('edit')">
        <AppIcon name="edit" />
      </button>
      <button
        type="button"
        class="icon-btn danger"
        :aria-label="`Delete ${user.userName}`"
        title="Delete"
        @click="emit('remove')"
      >
        <AppIcon name="delete" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.table-row {
  display: grid;
  grid-template-columns: var(--table-columns);
  align-items: center;
  height: 100%;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
}

.table-row:hover {
  background: var(--surface);
}

.cell {
  padding-right: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.num {
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  gap: 4px;
  padding-right: 0;
}
</style>
