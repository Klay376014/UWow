<script setup lang="ts">
import UserFilterBar from './components/UserFilterBar.vue'
import UserVirtualList from './components/UserVirtualList.vue'
import { useUserQuery } from './composables/useUserQuery'
import { useUserListStore } from './stores/userList'

const store = useUserListStore()

useUserQuery()
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>User Management</h1>
      <span class="count">{{ store.rows.length }} / {{ store.total }}</span>
    </header>

    <UserFilterBar />

    <main class="app-main">
      <UserVirtualList
        :rows="store.rows"
        :total="store.total"
        :loading="store.loading"
        :has-more="store.hasMore"
        :error="store.error"
        :sort="store.sort"
        @load-more="store.loadMore()"
        @retry="store.loadMore()"
        @sort="store.toggleSort"
      />
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
  min-height: 0;
}
</style>
