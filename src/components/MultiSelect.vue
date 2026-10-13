<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { computed, ref, useId } from 'vue'

const props = defineProps<{ options: string[]; label: string; placeholder?: string; inline?: boolean }>()
const model = defineModel<string[]>({ required: true })

const id = useId()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

const summary = computed(() => {
  if (model.value.length === 0) return props.placeholder ?? 'All'
  if (model.value.length === 1) return model.value[0]
  return `${model.value.length} selected`
})

onClickOutside(root, () => (open.value = false))

function onEscape(event: KeyboardEvent) {
  if (!open.value) return
  event.preventDefault()
  event.stopPropagation()
  open.value = false
  trigger.value?.focus()
}

function toggle(option: string, checked: boolean) {
  model.value = checked
    ? props.options.filter((o) => o === option || model.value.includes(o))
    : model.value.filter((o) => o !== option)
}
</script>

<template>
  <div v-if="inline" class="chips" role="group" :aria-label="label">
    <label v-for="option in options" :key="option" class="chip">
      <input
        type="checkbox"
        :checked="model.includes(option)"
        @change="toggle(option, ($event.target as HTMLInputElement).checked)"
      />
      <span>{{ option }}</span>
    </label>
    <p v-if="options.length === 0" class="empty">Loading…</p>
  </div>

  <div v-else ref="root" class="multi-select" @keydown.esc="onEscape">
    <button
      ref="trigger"
      type="button"
      class="trigger"
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-controls="id"
      :aria-label="`${label}: ${summary}`"
      @click="open = !open"
    >
      <span class="summary" :class="{ placeholder: model.length === 0 }">{{ summary }}</span>
      <span class="caret" aria-hidden="true">▾</span>
    </button>

    <div v-if="open" :id="id" class="panel" role="group" :aria-label="label">
      <div class="panel-actions">
        <button type="button" @click="model = [...options]">Select all</button>
        <button type="button" :disabled="model.length === 0" @click="model = []">Clear</button>
      </div>
      <label v-for="option in options" :key="option" class="option">
        <input
          type="checkbox"
          :checked="model.includes(option)"
          @change="toggle(option, ($event.target as HTMLInputElement).checked)"
        />
        <span>{{ option }}</span>
      </label>
      <p v-if="options.length === 0" class="empty">Loading…</p>
    </div>
  </div>
</template>

<style scoped>
.multi-select {
  position: relative;
  min-width: 0;
}

.trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  background: var(--bg);
  text-align: left;
  cursor: pointer;
}

.trigger:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.summary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.placeholder,
.caret {
  color: var(--muted);
}

.panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 20;
  min-width: 100%;
  max-height: 280px;
  overflow-y: auto;
  padding: 4px 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.15);
}

.panel-actions {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px 6px;
  border-bottom: 1px solid var(--border);
}

.panel-actions button {
  padding: 2px 4px;
  border: 0;
  color: var(--accent);
  background: none;
  cursor: pointer;
}

.panel-actions button:disabled {
  color: var(--muted);
  cursor: default;
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  white-space: nowrap;
  cursor: pointer;
}

.option:hover {
  background: var(--surface);
}

.option input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--accent);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--bg);
  cursor: pointer;
  user-select: none;
}

.chip input {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.chip:has(input:checked) {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  font-weight: 600;
}

.chip:has(input:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.empty {
  margin: 0;
  padding: 6px 12px;
  color: var(--muted);
}
</style>
