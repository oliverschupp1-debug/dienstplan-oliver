type Listener = () => void;

const listeners = new Set<Listener>();

export function onAssignmentsChanged(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function assignmentsChanged() {
  for (const fn of listeners) fn();
}
