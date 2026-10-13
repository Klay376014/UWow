<script setup lang="ts">
import { ref, watch } from 'vue'
import { useConfirmState } from '../composables/useConfirm'

const { state, settle } = useConfirmState()
const dialog = ref<HTMLDialogElement | null>(null)

watch(
  () => state.open,
  (open) => {
    if (open && !dialog.value?.open) dialog.value?.showModal()
    if (!open && dialog.value?.open) dialog.value.close()
  },
)
</script>

<template>
  <dialog
    ref="dialog"
    class="modal confirm"
    role="alertdialog"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-body"
    @close="state.open && settle(false)"
  >
    <template v-if="state.options">
      <h2 id="confirm-title" class="modal-title">{{ state.options.title }}</h2>
      <div id="confirm-body">
        <p v-if="state.options.message" class="message">{{ state.options.message }}</p>
        <ul v-if="state.options.details?.length" class="details">
          <li v-for="line in state.options.details" :key="line">{{ line }}</li>
        </ul>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" autofocus @click="settle(false)">Cancel</button>
        <button
          type="button"
          class="btn"
          :class="state.options.danger ? 'btn-danger' : 'btn-primary'"
          @click="settle(true)"
        >
          {{ state.options.confirmText ?? 'Confirm' }}
        </button>
      </div>
    </template>
  </dialog>
</template>

<style scoped>
.confirm {
  width: min(420px, calc(100vw - 32px));
}

.message {
  margin: 0 0 8px;
  color: var(--muted);
}

.details {
  margin: 0 0 8px;
  padding: 10px 12px 10px 28px;
  border-radius: 6px;
  background: var(--surface);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
</style>
