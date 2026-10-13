<script setup lang="ts">
import type { User } from '../types/user'
import AppIcon from './AppIcon.vue'

defineProps<{ user: User; index: number; pinned: boolean }>()
const emit = defineEmits<{ edit: []; remove: []; pin: [] }>()
</script>

<template>
  <article class="card" :class="{ pinned }">
    <div class="body">
      <h3 class="name">
        <span v-if="pinned" class="pin-mark"><AppIcon name="pin" /> #{{ index + 1 }}</span>
        <span v-if="pinned" class="visually-hidden">Pinned at position {{ index + 1 }}.</span>
        <span class="ellipsis">{{ user.userName }}</span>
      </h3>
      <p class="meta">{{ user.position }} · {{ user.location }}</p>
      <dl class="facts">
        <div>
          <dt>Age</dt>
          <dd>{{ user.age }}</dd>
        </div>
        <div>
          <dt>Date Start</dt>
          <dd>{{ user.dateStart }}</dd>
        </div>
      </dl>
    </div>
    <div class="actions">
      <button
        type="button"
        class="icon-btn"
        :class="{ active: pinned }"
        :aria-label="pinned ? `Move or unpin ${user.userName}` : `Pin ${user.userName}`"
        @click="emit('pin')"
      >
        <AppIcon name="pin" />
      </button>
      <button type="button" class="icon-btn" :aria-label="`Edit ${user.userName}`" @click="emit('edit')">
        <AppIcon name="edit" />
      </button>
      <button type="button" class="icon-btn danger" :aria-label="`Delete ${user.userName}`" @click="emit('remove')">
        <AppIcon name="delete" />
      </button>
    </div>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  height: calc(100% - 8px);
  margin: 4px 0;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.name,
.meta {
  padding-right: 118px;
}

.meta,
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  margin: 0;
}

.name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.card.pinned {
  border-color: color-mix(in srgb, var(--pin) 60%, var(--border));
  background: color-mix(in srgb, var(--pin) 8%, var(--bg));
}

.pin-mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 2px;
  color: var(--pin);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

.pin-mark svg {
  width: 14px;
  height: 14px;
}

.icon-btn.active {
  color: var(--pin);
}

.meta {
  color: var(--muted);
}

.facts {
  display: flex;
  gap: 20px;
  margin: 4px 0 0;
}

.facts div {
  display: flex;
  gap: 6px;
}

.facts dt {
  color: var(--muted);
}

.facts dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.actions {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 2px;
}

.actions .icon-btn {
  width: 38px;
  height: 38px;
}
</style>
