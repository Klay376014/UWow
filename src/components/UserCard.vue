<script setup lang="ts">
import type { User } from '../types/user'

defineProps<{ user: User }>()
</script>

<template>
  <article class="card">
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
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  height: calc(100% - 8px);
  margin: 4px 0;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
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
</style>
