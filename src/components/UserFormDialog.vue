<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { COLUMNS } from '../columns'
import { describeChanges, useUserActions } from '../composables/useUserActions'
import { useOptionsStore } from '../stores/options'
import type { User, UserInput } from '../types/user'
import { AGE_MAX, AGE_MIN, normalizeUserInput, TEXT_MAX, validateUserInput } from '../validation/user'

const props = defineProps<{ user: User | null }>()
const open = defineModel<boolean>('open', { required: true })

type FormState = Omit<UserInput, 'age'> & { age: number | null }

const options = useOptionsStore()
const actions = useUserActions()

const dialog = ref<HTMLDialogElement | null>(null)
const form = reactive<FormState>({ userName: '', position: '', location: '', age: null, dateStart: '' })
const base = ref<User | null>(null)
const submitted = ref(false)
const saving = ref(false)
const formError = ref('')
const conflict = ref<string[]>([])

const isEdit = computed(() => base.value !== null)
const errors = computed(() => (submitted.value ? validateUserInput(form, options.positions) : {}))

function reset() {
  base.value = props.user
  Object.assign(form, props.user ?? { userName: '', position: '', location: '', age: null, dateStart: '' })
  submitted.value = false
  formError.value = ''
  conflict.value = []
}

watch(open, (value) => {
  if (value) {
    reset()
    dialog.value?.showModal()
  } else if (dialog.value?.open) {
    dialog.value.close()
  }
})

function onAgeInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  form.age = value === '' ? null : Number(value)
}

async function focusFirstError() {
  await nextTick()
  dialog.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}

async function onSubmit() {
  submitted.value = true
  if (Object.keys(errors.value).length) return focusFirstError()

  const input = normalizeUserInput(form as UserInput)
  saving.value = true
  formError.value = ''
  try {
    if (!base.value) {
      await actions.create(input)
      open.value = false
      return
    }
    const result = await actions.update(base.value, input)
    if (result.status === 'conflict') {
      const previous = base.value
      conflict.value = describeChanges(previous, result.latest)
      for (const { key } of COLUMNS) {
        if (form[key] === previous[key]) Object.assign(form, { [key]: result.latest[key] })
      }
      base.value = result.latest
    } else if (result.status !== 'cancelled') {
      open.value = false
    }
  } catch (e) {
    formError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

const fieldAttrs = (key: keyof UserInput) => ({
  'aria-invalid': errors.value[key] ? ('true' as const) : undefined,
  'aria-describedby': errors.value[key] ? `err-${key}` : undefined,
})
</script>

<template>
  <dialog ref="dialog" class="modal form-dialog" aria-labelledby="user-form-title" @close="open = false">
    <form novalidate @submit.prevent="onSubmit">
      <h2 id="user-form-title" class="modal-title">{{ isEdit ? 'Edit user' : 'Add user' }}</h2>

      <div v-if="conflict.length" class="alert" role="alert">
        <strong>Another user changed this record.</strong>
        <ul v-if="conflict.length">
          <li v-for="line in conflict" :key="line">{{ line }}</li>
        </ul>
        Fields you didn't edit now show the latest values. Your edits are kept; save again to apply them.
      </div>
      <p v-if="formError" class="alert" role="alert">{{ formError }}</p>

      <div class="fields">
        <label class="field">
          <span class="label">User Name</span>
          <input v-model="form.userName" type="text" :maxlength="TEXT_MAX" autocomplete="off" v-bind="fieldAttrs('userName')" />
          <span v-if="errors.userName" :id="'err-userName'" class="error">{{ errors.userName }}</span>
        </label>

        <label class="field">
          <span class="label">Position</span>
          <select v-model="form.position" v-bind="fieldAttrs('position')">
            <option value="" disabled>Select a position</option>
            <option v-for="p in options.positions" :key="p" :value="p">{{ p }}</option>
          </select>
          <span v-if="errors.position" :id="'err-position'" class="error">{{ errors.position }}</span>
        </label>

        <label class="field">
          <span class="label">Location</span>
          <input v-model="form.location" type="text" :maxlength="TEXT_MAX" autocomplete="off" v-bind="fieldAttrs('location')" />
          <span v-if="errors.location" :id="'err-location'" class="error">{{ errors.location }}</span>
        </label>

        <div class="row">
          <label class="field">
            <span class="label">Age</span>
            <input
              type="number"
              inputmode="numeric"
              step="1"
              :min="AGE_MIN"
              :max="AGE_MAX"
              :value="form.age ?? ''"
              v-bind="fieldAttrs('age')"
              @input="onAgeInput"
            />
            <span v-if="errors.age" :id="'err-age'" class="error">{{ errors.age }}</span>
          </label>

          <label class="field">
            <span class="label">Date Start</span>
            <input v-model="form.dateStart" type="date" v-bind="fieldAttrs('dateStart')" />
            <span v-if="errors.dateStart" :id="'err-dateStart'" class="error">{{ errors.dateStart }}</span>
          </label>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn" :disabled="saving" @click="open = false">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving…' : isEdit ? 'Save' : 'Add' }}
        </button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.form-dialog {
  width: min(480px, calc(100vw - 32px));
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.label {
  font-size: 0.8125rem;
  color: var(--muted);
}

input,
select {
  width: 100%;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  background: var(--bg);
}

input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

[aria-invalid='true'] {
  border-color: var(--danger);
}

.error {
  font-size: 0.8125rem;
  color: var(--danger);
}

.alert {
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: 6px;
  color: var(--text);
  background: color-mix(in srgb, var(--danger) 12%, transparent);
}

.alert ul {
  margin: 6px 0;
  padding-left: 20px;
}

@media (max-width: 767px) {
  .form-dialog {
    width: 100%;
    max-width: none;
    height: 100dvh;
    max-height: none;
    margin: 0;
    border-radius: 0;
  }

  .form-dialog form {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .form-dialog .modal-actions {
    margin-top: auto;
    padding-top: 16px;
  }
}
</style>
