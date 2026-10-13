<script setup lang="ts">
import type { User } from '../types/user'
import AppIcon from './AppIcon.vue'

defineProps<{ user: User; index: number; pinned: boolean }>()
const emit = defineEmits<{ edit: []; remove: []; pin: [] }>()
</script>

<template>
  <div class="table-row" :class="{ pinned }" role="row" :aria-rowindex="index + 2">
    <div role="cell" class="cell name" :title="user.userName">
      <span v-if="pinned" class="pin-mark" :title="`Pinned at #${index + 1}`"><AppIcon name="pin" /></span>
      <span v-if="pinned" class="visually-hidden">Pinned at position {{ index + 1 }}.</span>
      <span class="ellipsis">{{ user.userName }}</span>
    </div>
    <div role="cell" class="cell" :title="user.position">{{ user.position }}</div>
    <div role="cell" class="cell" :title="user.location">{{ user.location }}</div>
    <div role="cell" class="cell num">{{ user.age }}</div>
    <div role="cell" class="cell num">{{ user.dateStart }}</div>
    <div role="cell" class="cell actions">
      <button
        type="button"
        class="icon-btn"
        :class="{ active: pinned }"
        :aria-label="pinned ? `Move or unpin ${user.userName}` : `Pin ${user.userName}`"
        :title="pinned ? 'Move or unpin' : 'Pin'"
        @click="emit('pin')"
      >
        <AppIcon name="pin" />
      </button>
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

.table-row.pinned {
  background: color-mix(in srgb, var(--pin) 10%, transparent);
}

.name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
}

.pin-mark {
  display: inline-flex;
  flex: none;
  color: var(--pin);
}

.pin-mark svg {
  width: 14px;
  height: 14px;
}

.icon-btn.active {
  color: var(--pin);
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
