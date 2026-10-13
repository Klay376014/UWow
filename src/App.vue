<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from './components/AppIcon.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import PinDialog, { type PinTarget } from './components/PinDialog.vue'
import PinnedPanel from './components/PinnedPanel.vue'
import ToastHost from './components/ToastHost.vue'
import UserFilterBar from './components/UserFilterBar.vue'
import UserFormDialog from './components/UserFormDialog.vue'
import UserVirtualList from './components/UserVirtualList.vue'
import { useUserActions } from './composables/useUserActions'
import { useUserQuery } from './composables/useUserQuery'
import { usePinStore } from './stores/pins'
import { useUserListStore } from './stores/userList'
import type { Pin, User } from './types/user'

const store = useUserListStore()
const pins = usePinStore()
const actions = useUserActions()

useUserQuery()

const formOpen = ref(false)
const editing = ref<User | null>(null)

function openForm(user: User | null) {
  editing.value = user
  formOpen.value = true
}

const pinOpen = ref(false)
const pinnedPanelOpen = ref(false)
const pinTarget = ref<PinTarget | null>(null)

function openPin(user: User, index: number) {
  pinTarget.value = { id: user.id, userName: user.userName, index }
  pinOpen.value = true
}

function movePin(pin: Pin) {
  pinTarget.value = { id: pin.userId, userName: pin.userName, index: null }
  pinOpen.value = true
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>User Management</h1>
      <span class="count">{{ store.rows.length }} / {{ store.total }}</span>
      <button type="button" class="btn pinned-btn" aria-haspopup="dialog" @click="pinnedPanelOpen = true">
        <AppIcon name="pin" />
        <span class="pinned-label">Pinned</span>
        <span class="visually-hidden">rows:</span>
        <span class="pinned-count">{{ pins.pins.length }}</span>
      </button>
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
        :pinned-ids="pins.pinnedIdSet"
        :scroll-target="store.scrollTarget"
        @load-more="store.loadMore()"
        @retry="store.retry()"
        @sort="store.toggleSort"
        @edit="openForm"
        @remove="actions.remove"
        @pin="openPin"
        @scrolled="store.scrollTarget = null"
      />
    </main>

    <UserFormDialog v-model:open="formOpen" :user="editing" />
    <PinDialog v-model:open="pinOpen" :target="pinTarget" />
    <PinnedPanel v-model:open="pinnedPanelOpen" @move="movePin" />
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

.pinned-btn {
  padding: 0 10px;
  color: var(--pin);
}

.pinned-count {
  min-width: 18px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

@media (max-width: 767px) {
  .app-header h1 {
    font-size: 1.0625rem;
  }

  .add span,
  .pinned-label {
    display: none;
  }

  .count {
    font-size: 0.8125rem;
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
