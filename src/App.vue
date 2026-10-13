<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserListStore } from './stores/userList'

const store = useUserListStore()

onMounted(() => store.reload())
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>User Management</h1>
      <span class="count">{{ store.rows.length }} / {{ store.total }}</span>
    </header>

    <main class="app-main">
      <p v-if="store.error" class="error">{{ store.error }}</p>
      <ul class="rows">
        <li v-for="u in store.rows" :key="u.id">
          {{ u.userName }} · {{ u.position }} · {{ u.location }} · {{ u.age }} · {{ u.dateStart }}
        </li>
      </ul>
      <button v-if="store.hasMore" :disabled="store.loading" @click="store.loadMore()">
        {{ store.loading ? 'Loading…' : 'Load more' }}
      </button>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}

.app-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.app-header h1 {
  margin: 0;
  font-size: 1.25rem;
}

.count {
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

.app-main {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.rows {
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
}

.rows li {
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
}

.error {
  color: var(--danger);
}
</style>
