import { v4 as uuidv4 } from 'uuid';

import type { NotesNote, NotesNotebook, NotesStore } from './types';

const STORAGE_PREFIX = 'onepad.builtin.notes.v1.';
/** Pre-notebooks single-textarea storage */
const LEGACY_STORAGE_PREFIX = 'onepad.builtin.notes.';

function now() {
  return Date.now();
}

export function createNotebook(name = 'Notebook'): NotesNotebook {
  return {
    id: uuidv4(),
    name,
    createdAt: now(),
  };
}

export function createNote(notebookId: string, title = 'Untitled'): NotesNote {
  return {
    id: uuidv4(),
    notebookId,
    title,
    body: '',
    updatedAt: now(),
  };
}

export function createEmptyStore(): NotesStore {
  const notebook = createNotebook('Personal');
  const note = createNote(notebook.id, 'Welcome');
  note.body = '';
  return {
    version: 1,
    notebooks: [notebook],
    notes: [note],
    selectedNotebookId: notebook.id,
    selectedNoteId: note.id,
  };
}

function storageKey(workspaceId: string) {
  return `${STORAGE_PREFIX}${workspaceId}`;
}

function legacyKey(workspaceId: string) {
  return `${LEGACY_STORAGE_PREFIX}${workspaceId}`;
}

function migrateLegacy(workspaceId: string): NotesStore | null {
  try {
    const raw = localStorage.getItem(legacyKey(workspaceId));
    if (raw == null || raw === '') return null;
    const notebook = createNotebook('Personal');
    const note = createNote(notebook.id, 'Untitled');
    note.body = raw;
    const firstLine = raw.split('\n').find((l) => l.trim()) || '';
    if (firstLine.trim()) {
      note.title =
        firstLine.trim().slice(0, 48) +
        (firstLine.trim().length > 48 ? '…' : '');
    }
    const store: NotesStore = {
      version: 1,
      notebooks: [notebook],
      notes: [note],
      selectedNotebookId: notebook.id,
      selectedNoteId: note.id,
    };
    localStorage.setItem(storageKey(workspaceId), JSON.stringify(store));
    localStorage.removeItem(legacyKey(workspaceId));
    return store;
  } catch {
    return null;
  }
}

export function loadNotesStore(workspaceId: string): NotesStore {
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    if (raw) {
      const parsed = JSON.parse(raw) as NotesStore;
      if (
        parsed?.version === 1 &&
        Array.isArray(parsed.notebooks) &&
        Array.isArray(parsed.notes)
      ) {
        return ensureSelection(parsed);
      }
    }
  } catch {
    // fall through
  }
  const migrated = migrateLegacy(workspaceId);
  if (migrated) return migrated;
  return createEmptyStore();
}

export function saveNotesStore(workspaceId: string, store: NotesStore) {
  try {
    localStorage.setItem(storageKey(workspaceId), JSON.stringify(store));
  } catch {
    // ignore quota / private mode
  }
}

function ensureSelection(store: NotesStore): NotesStore {
  let next = store;
  if (
    !next.selectedNotebookId ||
    !next.notebooks.some((n) => n.id === next.selectedNotebookId)
  ) {
    next = {
      ...next,
      selectedNotebookId: next.notebooks[0]?.id ?? null,
    };
  }
  const notesInNotebook = next.notes.filter(
    (n) => n.notebookId === next.selectedNotebookId
  );
  if (
    !next.selectedNoteId ||
    !notesInNotebook.some((n) => n.id === next.selectedNoteId)
  ) {
    next = {
      ...next,
      selectedNoteId: notesInNotebook[0]?.id ?? null,
    };
  }
  return next;
}

export function titleFromBody(body: string, fallback = 'Untitled'): string {
  const line = body.split('\n').find((l) => l.trim());
  if (!line) return fallback;
  const t = line.trim();
  return t.length > 48 ? `${t.slice(0, 48)}…` : t;
}
