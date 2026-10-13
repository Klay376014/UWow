import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchPositions } from '../api/users'

export const useOptionsStore = defineStore('options', () => {
  const positions = ref<string[]>([])

  async function load() {
    positions.value = await fetchPositions()
  }

  return { positions, load }
})
