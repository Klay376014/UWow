<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { MAX_PINS, usePinStore } from '../stores/pins'
import { useToastStore } from '../stores/toast'
import { useUserListStore } from '../stores/userList'

export interface PinTarget {
  id: string
  userName: string
  index: number | null
}

const props = defineProps<{ target: PinTarget | null }>()
const open = defineModel<boolean>('open', { required: true })

const pins = usePinStore()
const list = useUserListStore()
const toast = useToastStore()

const dialog = ref<HTMLDialogElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const position = ref<number | null>(null)
const submitted = ref(false)

const current = computed(() => (props.target ? pins.positionOf(props.target.id) : null))
const isPinned = computed(() => current.value !== null)
const maxPosition = computed(() => Math.max(list.total, (current.value ?? 0) + 1, 1))

const error = computed(() => {
  if (!submitted.value) return ''
  const value = position.value
  if (value === null || !Number.isInteger(value) || value < 1 || value > maxPosition.value)
    return `Enter a whole number between 1 and ${maxPosition.value}`
  return ''
})

const occupant = computed(() => {
  const value = position.value
  if (!props.target || value === null) return null
  return pins.pins.find((p) => p.position === value - 1 && p.userId !== props.target!.id) ?? null
})

watch(open, (value) => {
  if (value) {
    const start = current.value ?? props.target?.index ?? 0
    position.value = start + 1
    submitted.value = false
    dialog.value?.showModal()
    input.value?.select()
  } else if (dialog.value?.open) {
    dialog.value.close()
  }
})

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  position.value = value === '' ? null : Number(value)
}

function onSubmit() {
  submitted.value = true
  if (error.value || !props.target || position.value === null) return
  if (!list.pinRow(props.target, position.value - 1)) {
    toast.show(`You can pin up to ${MAX_PINS} rows`, 'error')
    return
  }
  toast.show(`Pinned ${props.target.userName} at #${position.value}`, 'success')
  open.value = false
}

function onUnpin() {
  if (!props.target) return
  list.unpinRow(props.target.id)
  toast.show(`Unpinned ${props.target.userName}`, 'info')
  open.value = false
}
</script>

<template>
  <dialog ref="dialog" class="modal pin-dialog" aria-labelledby="pin-title" @close="open = false">
    <form v-if="target" novalidate @submit.prevent="onSubmit">
      <h2 id="pin-title" class="modal-title">{{ isPinned ? 'Move pin' : 'Pin row' }}</h2>
      <p class="lead">
        <strong>{{ target.userName }}</strong>
        <template v-if="isPinned"> is pinned at #{{ current! + 1 }}.</template>
        <template v-else> will stay at this position whatever the sorting.</template>
      </p>

      <label class="field">
        <span class="label">Position (1 – {{ maxPosition }})</span>
        <input
          ref="input"
          type="number"
          inputmode="numeric"
          min="1"
          :max="maxPosition"
          step="1"
          :value="position ?? ''"
          :aria-invalid="error ? 'true' : undefined"
          aria-describedby="pin-hint"
          @input="onInput"
        />
      </label>
      <p id="pin-hint" class="hint" :class="{ error }">
        <template v-if="error">{{ error }}</template>
        <template v-else-if="occupant">
          #{{ position }} is held by {{ occupant.userName }}; it and any pins right after it move down one place.
        </template>
      </p>

      <div class="modal-actions">
        <button v-if="isPinned" type="button" class="btn unpin" @click="onUnpin">Unpin</button>
        <button type="button" class="btn" @click="open = false">Cancel</button>
        <button type="submit" class="btn btn-primary">{{ isPinned ? 'Move' : 'Pin' }}</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.pin-dialog {
  width: min(400px, calc(100vw - 32px));
}

.lead {
  margin: 0 0 14px;
  overflow-wrap: anywhere;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 0.8125rem;
  color: var(--muted);
}

input {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  background: var(--bg);
}

input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

input[aria-invalid='true'] {
  border-color: var(--danger);
}

.hint {
  min-height: 1.5em;
  margin: 6px 0 0;
  font-size: 0.8125rem;
  color: var(--muted);
}

.hint.error {
  color: var(--danger);
}

.unpin {
  margin-right: auto;
  color: var(--danger);
}
</style>
