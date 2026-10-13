<script setup lang="ts">
import type { User } from '../types/user'
import AppIcon from './AppIcon.vue'

defineProps<{ user: User }>()
const emit = defineEmits<{ edit: []; remove: [] }>()
</script>

<template>
  <article class="card">
    <div class="body">
      <h3 class="name">{{ user.userName }}</h3>
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
  display: flex;
  align-items: center;
  gap: 8px;
  height: calc(100% - 8px);
  margin: 4px 0;
  padding: 10px 6px 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
}

.body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.name,
.meta {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  font-size: 1rem;
  font-weight: 600;
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
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.actions .icon-btn {
  width: 40px;
  height: 40px;
}
</style>
