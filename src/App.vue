<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from './components/AppIcon.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import ToastHost from './components/ToastHost.vue'
import UserFilterBar from './components/UserFilterBar.vue'
import UserFormDialog from './components/UserFormDialog.vue'
import UserVirtualList from './components/UserVirtualList.vue'
import { useUserActions } from './composables/useUserActions'
import { useUserQuery } from './composables/useUserQuery'
import { useUserListStore } from './stores/userList'
import type { User } from './types/user'

const store = useUserListStore()
const actions = useUserActions()

useUserQuery()

const formOpen = ref(false)
const editing = ref<User | null>(null)

function openForm(user: User | null) {
  editing.value = user
  formOpen.value = true
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>User Management</h1>
      <span class="count">{{ store.rows.length }} / {{ store.total }}</span>
      <button type="button" class="btn btn-primary add" @click="openForm(null)">
        <AppIcon name="plus" />
        <span>Add user</span>
      </button>
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
        @edit="openForm"
        @remove="actions.remove"
      />
    </main>

    <UserFormDialog v-model:open="formOpen" :user="editing" />
    <ConfirmDialog />
    <ToastHost />
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
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
}

.app-header h1 {
  margin: 0;
  font-size: 1.25rem;
}

.count {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

.add {
  padding: 0 12px;
}

@media (max-width: 767px) {
  .app-header h1 {
    font-size: 1.0625rem;
  }

  .add span {
    display: none;
  }

  .add {
    width: 36px;
    padding: 0;
  }
}

.app-main {
  flex: 1;
  min-height: 0;
}
</style>
