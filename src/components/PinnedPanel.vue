<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePinStore } from '../stores/pins'
import { useToastStore } from '../stores/toast'
import { useUserListStore } from '../stores/userList'
import type { Pin } from '../types/user'

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ move: [pin: Pin] }>()

const pins = usePinStore()
const list = useUserListStore()
const toast = useToastStore()
const dialog = ref<HTMLDialogElement | null>(null)

watch(open, (value) => {
  if (value) dialog.value?.showModal()
  else if (dialog.value?.open) dialog.value.close()
})

function unpin(pin: Pin) {
  list.unpinRow(pin.userId)
  toast.show(`Unpinned ${pin.userName}`, 'info')
}

function move(pin: Pin) {
  open.value = false
  emit('move', pin)
}
</script>

<template>
  <dialog ref="dialog" class="modal pinned-panel" aria-labelledby="pinned-title" @close="open = false">
    <h2 id="pinned-title" class="modal-title">Pinned rows</h2>
    <p class="note">Rows that don't match the current filters stay pinned but are hidden from the list.</p>

    <ol v-if="pins.pins.length" class="pins">
      <li v-for="pin in pins.pins" :key="pin.userId" class="pin">
        <span class="position">#{{ pin.position + 1 }}</span>
        <span class="name" :title="pin.userName">{{ pin.userName }}</span>
        <button type="button" class="btn small" @click="move(pin)">Move</button>
        <button type="button" class="btn small" @click="unpin(pin)">Unpin</button>
      </li>
    </ol>
    <p v-else class="empty">No pinned rows yet. Use the pin button on a row to pin it.</p>

    <div class="modal-actions">
      <button type="button" class="btn" @click="open = false">Close</button>
    </div>
  </dialog>
</template>

<style scoped>
.pinned-panel {
  width: min(480px, calc(100vw - 32px));
}

.note,
.empty {
  margin: 0 0 12px;
  font-size: 0.8125rem;
  color: var(--muted);
}

.pins {
  max-height: 50dvh;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.pin {
  display: grid;
  grid-template-columns: 52px 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
}

.pin + .pin {
  border-top: 1px solid var(--border);
}

.position {
  color: var(--pin);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.small {
  height: 30px;
  padding: 0 10px;
}
</style>
