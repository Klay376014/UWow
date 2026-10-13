import { ApiError, createUser, deleteUser, fetchUser, updateUser } from '../api/users'
import { COLUMNS } from '../columns'
import { useToastStore } from '../stores/toast'
import { useUserListStore } from '../stores/userList'
import type { User, UserInput } from '../types/user'
import { useConfirm } from './useConfirm'

export type UpdateResult =
  | { status: 'saved' | 'unchanged' | 'cancelled' | 'gone' }
  | { status: 'conflict'; latest: User }

export function describeChanges(from: UserInput, to: UserInput) {
  return COLUMNS.filter((c) => from[c.key] !== to[c.key]).map((c) => `${c.label}: ${from[c.key]} → ${to[c.key]}`)
}

const isStatus = (e: unknown, status: number) => e instanceof ApiError && e.status === status

export function useUserActions() {
  const list = useUserListStore()
  const toast = useToastStore()
  const confirm = useConfirm()

  async function refreshAfterConflict(id: string) {
    try {
      const latest = await fetchUser(id)
      list.replaceRow(latest)
      return latest
    } catch (e) {
      if (!isStatus(e, 404)) throw e
      list.removeRow(id)
      return null
    }
  }

  async function create(input: UserInput) {
    const user = await createUser(input)
    toast.show(`Added ${user.userName}`, 'success')
    list.reload()
    return user
  }

  async function update(user: User, input: UserInput): Promise<UpdateResult> {
    const changes = describeChanges(user, input)
    if (changes.length === 0) return { status: 'unchanged' }

    const ok = await confirm({
      title: `Save changes to ${user.userName}?`,
      details: changes,
      confirmText: 'Save',
    })
    if (!ok) return { status: 'cancelled' }

    try {
      const saved = await updateUser(user.id, input, user.version)
      list.replaceRow(saved)
      toast.show(`Saved ${saved.userName}`, 'success')
      return { status: 'saved' }
    } catch (e) {
      if (!isStatus(e, 409) && !isStatus(e, 404)) throw e
      const latest = await refreshAfterConflict(user.id)
      if (latest) return { status: 'conflict', latest }
      toast.show(`${user.userName} was deleted by another user`, 'error')
      return { status: 'gone' }
    }
  }

  async function remove(user: User) {
    const ok = await confirm({
      title: `Delete ${user.userName}?`,
      message: 'This cannot be undone.',
      confirmText: 'Delete',
      danger: true,
    })
    if (!ok) return

    try {
      await deleteUser(user.id, user.version)
      list.removeRow(user.id)
      toast.show(`Deleted ${user.userName}`, 'success')
    } catch (e) {
      if (isStatus(e, 404)) {
        list.removeRow(user.id)
        toast.show(`${user.userName} was already deleted`, 'info')
      } else if (isStatus(e, 409)) {
        await refreshAfterConflict(user.id)
        toast.show(`${user.userName} was changed by another user. Review it before deleting.`, 'error')
      } else {
        toast.show((e as Error).message, 'error')
      }
    }
  }

  return { create, update, remove }
}
