import { onMounted, watch } from 'vue'
import { useOptionsStore } from '../stores/options'
import { useUserListStore } from '../stores/userList'

export function useUserQuery() {
  const store = useUserListStore()
  const options = useOptionsStore()

  watch(() => ({ ...store.sort }), () => store.reload())

  onMounted(() => {
    store.reload()
    options.load()
  })
}
