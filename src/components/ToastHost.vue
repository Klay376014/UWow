<script setup lang="ts">
import { useToastStore } from '../stores/toast'

const store = useToastStore()
</script>

<template>
  <div class="toast-host" role="status" aria-live="polite">
    <div v-for="toast in store.toasts" :key="toast.id" class="toast" :class="toast.type">
      <span>{{ toast.text }}</span>
      <button type="button" class="dismiss" aria-label="Dismiss" @click="store.dismiss(toast.id)">✕</button>
    </div>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  bottom: calc(16px + env(safe-area-inset-bottom));
  left: 50%;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(420px, calc(100vw - 32px));
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px 10px 14px;
  border-left: 4px solid var(--accent);
  border-radius: 6px;
  color: var(--text);
  background: var(--bg);
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.18);
  pointer-events: auto;
}

.toast.success {
  border-left-color: var(--success);
}

.toast.error {
  border-left-color: var(--danger);
}

.dismiss {
  flex: none;
  padding: 2px 6px;
  border: 0;
  color: var(--muted);
  background: none;
  cursor: pointer;
}
</style>
