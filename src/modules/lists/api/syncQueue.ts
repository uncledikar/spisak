import { supabase } from '../../../shared/lib/supabase'
import { requireUserId } from '../../../shared/api/auth'
import { listToRow } from './mappers'
import type { ListRecord } from '../types/models'
import { peekList } from './listCache'

export type SyncOp =
  | { kind: 'upsert_list'; list: ListRecord }
  | { kind: 'delete_list'; id: string }

const QUEUE_KEY = 'lists.syncQueue'
const chain = new Map<string, Promise<void>>()

function readQueue(): SyncOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SyncOp[]
  } catch {
    return []
  }
}

function writeQueue(ops: SyncOp[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ops))
}

function opId(op: SyncOp): string {
  return op.kind === 'upsert_list' ? op.list.id : op.id
}

export function enqueueSync(op: SyncOp): void {
  const queue = readQueue()
  const id = opId(op)
  const filtered = queue.filter((item) => opId(item) !== id)
  // Prefer latest cached snapshot for upserts.
  if (op.kind === 'upsert_list') {
    const latest = peekList(op.list.id) ?? op.list
    filtered.push({ kind: 'upsert_list', list: latest })
  } else {
    filtered.push(op)
  }
  writeQueue(filtered)
  void flushSyncQueue()
}

/** True while a hard-delete is queued — remote GETs must not resurrect the row. */
export function hasPendingDelete(id: string): boolean {
  return readQueue().some((op) => op.kind === 'delete_list' && op.id === id)
}

function enqueuePersist(key: string, task: () => Promise<void>): Promise<void> {
  const previous = chain.get(key) ?? Promise.resolve()
  const next = previous.then(task, task).finally(() => {
    if (chain.get(key) === next) chain.delete(key)
  })
  chain.set(key, next)
  return next
}

async function applyOp(op: SyncOp): Promise<void> {
  const userId = await requireUserId()
  switch (op.kind) {
    case 'upsert_list': {
      const latest = peekList(op.list.id) ?? op.list
      const { error } = await supabase
        .from('lists')
        .upsert(listToRow(latest, userId), { onConflict: 'id' })
      if (error) throw error
      return
    }
    case 'delete_list': {
      const { error } = await supabase.from('lists').delete().eq('id', op.id)
      if (error) throw error
      return
    }
  }
}

export async function flushSyncQueue(): Promise<void> {
  if (!navigator.onLine) return
  await enqueuePersist('queue', async () => {
    let queue = readQueue()
    while (queue.length > 0) {
      if (!navigator.onLine) return
      const [op, ...rest] = queue
      try {
        await applyOp(op)
        queue = rest
        writeQueue(queue)
      } catch (error) {
        console.error('lists sync op failed', op, error)
        return
      }
    }
  })
}

export function clearSyncQueue(): void {
  localStorage.removeItem(QUEUE_KEY)
}

export function startSyncListeners(): void {
  window.addEventListener('online', () => {
    void flushSyncQueue()
  })
}
