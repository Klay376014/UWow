<script setup lang="ts">
import { useIsDesktop } from '../composables/useBreakpoint'
import { useOptionsStore } from '../stores/options'
import type { UserFilters } from '../types/user'
import { AGE_MAX, AGE_MIN } from '../validation/user'
import MultiSelect from './MultiSelect.vue'

const model = defineModel<UserFilters>({ required: true })
const options = useOptionsStore()
const isDesktop = useIsDesktop()

function set<K extends keyof UserFilters>(key: K, value: UserFilters[K]) {
  model.value = { ...model.value, [key]: value }
}

const inputValue = (event: Event) => (event.target as HTMLInputElement).value

const toAge = (value: string) => (value === '' ? null : Math.trunc(Number(value)))
</script>

<template>
  <label class="field">
    <span class="label">User Name</span>
    <input type="search" placeholder="Contains…" :value="model.userName" @input="set('userName', inputValue($event))" />
  </label>
  <div class="field">
    <span class="label" aria-hidden="true">Position</span>
    <MultiSelect
      label="Position"
      :inline="!isDesktop"
      :options="options.positions"
      :model-value="model.position"
      @update:model-value="set('position', $event)"
    />
  </div>
  <label class="field">
    <span class="label">Location</span>
    <input type="search" placeholder="Contains…" :value="model.location" @input="set('location', inputValue($event))" />
  </label>
  <fieldset class="field range">
    <legend class="label">Age</legend>
    <input
      type="number"
      inputmode="numeric"
      :min="AGE_MIN"
      :max="AGE_MAX"
      placeholder="Min"
      aria-label="Minimum age"
      :value="model.ageMin ?? ''"
      @input="set('ageMin', toAge(inputValue($event)))"
    />
    <span aria-hidden="true">–</span>
    <input
      type="number"
      inputmode="numeric"
      :min="AGE_MIN"
      :max="AGE_MAX"
      placeholder="Max"
      aria-label="Maximum age"
      :value="model.ageMax ?? ''"
      @input="set('ageMax', toAge(inputValue($event)))"
    />
  </fieldset>
  <fieldset class="field range">
    <legend class="label">Date Start</legend>
    <input
      type="date"
      aria-label="Start date from"
      :max="model.dateTo || undefined"
      :value="model.dateFrom"
      @input="set('dateFrom', inputValue($event))"
    />
    <span aria-hidden="true">–</span>
    <input
      type="date"
      aria-label="Start date to"
      :min="model.dateFrom || undefined"
      :value="model.dateTo"
      @input="set('dateTo', inputValue($event))"
    />
  </fieldset>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.label {
  padding: 0;
  font-size: 0.8125rem;
  color: var(--muted);
}

.range {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: 6px;
}

.range .label {
  grid-column: 1 / -1;
  margin-bottom: 4px;
}

input {
  width: 100%;
  min-width: 0;
  height: 34px;
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
</style>
