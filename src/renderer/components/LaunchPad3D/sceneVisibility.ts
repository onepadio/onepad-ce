type Listener = (ids: Set<string>) => void;

let visibleIds = new Set<string>();
const listeners = new Set<Listener>();

export function setVisibleSceneWindowIds(ids: string[]) {
  const next = new Set(ids);
  let changed = next.size !== visibleIds.size;
  if (!changed) {
    for (const id of next) {
      if (!visibleIds.has(id)) {
        changed = true;
        break;
      }
    }
  }
  if (!changed) return;
  visibleIds = next;
  listeners.forEach((fn) => fn(visibleIds));
}

export function getVisibleSceneWindowIds(): Set<string> {
  return visibleIds;
}

export function subscribeVisibleSceneWindows(fn: Listener): () => void {
  listeners.add(fn);
  fn(visibleIds);
  return () => {
    listeners.delete(fn);
  };
}
