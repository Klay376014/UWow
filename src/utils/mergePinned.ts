export interface PinnedItem<T> {
  item: T
  position: number
}

export function mergePinned<T>(regular: T[], pinned: PinnedItem<T>[], complete: boolean): T[] {
  const out: T[] = []
  let r = 0
  let p = 0
  while (true) {
    if (p < pinned.length && pinned[p].position <= out.length) out.push(pinned[p++].item)
    else if (r < regular.length) out.push(regular[r++])
    else break
  }
  if (complete) while (p < pinned.length) out.push(pinned[p++].item)
  return out
}

export function pinsInWindow<T>(pinned: PinnedItem<T>[], start: number, size: number) {
  return pinned.filter((p) => p.position >= start && p.position < start + size).length
}

export function insertPin<P extends { position: number }>(pins: P[], pin: P): P[] {
  let next = pin.position
  const shifted = [...pins]
    .sort((a, b) => a.position - b.position)
    .map((p) => {
      if (p.position !== next) return p
      next += 1
      return { ...p, position: next }
    })
  return [...shifted, pin].sort((a, b) => a.position - b.position)
}
