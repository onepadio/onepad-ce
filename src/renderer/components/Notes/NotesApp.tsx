import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import BuiltinModalChrome from '../BuiltinApps/BuiltinModalChrome';
import NotebooksPage from './NotebooksPage';
import NotesListColumn from './NotesListColumn';
import NoteEditor from './NoteEditor';
import {
  createNote,
  createNotebook,
  loadNotesStore,
  saveNotesStore,
} from './notesStorage';
import type { NotesStore } from './types';
import './NotesApp.css';

type NotesView = 'notebooks' | 'notes';

function NotesApp() {
  const workspaceId = useSelector(
    (state: any) => state.workspace.selectedWorkspace?.id
  );
  const [store, setStore] = useState<NotesStore | null>(null);
  const [view, setView] = useState<NotesView>('notebooks');

  useEffect(() => {
    if (!workspaceId) {
      setStore(null);
      setView('notebooks');
      return;
    }
    setStore(loadNotesStore(workspaceId));
    setView('notebooks');
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !store) return;
    saveNotesStore(workspaceId, store);
  }, [workspaceId, store]);

  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!store) return counts;
    store.notes.forEach((n) => {
      counts[n.notebookId] = (counts[n.notebookId] || 0) + 1;
    });
    return counts;
  }, [store]);

  const selectedNotebook = useMemo(() => {
    if (!store?.selectedNotebookId) return null;
    return (
      store.notebooks.find((nb) => nb.id === store.selectedNotebookId) ?? null
    );
  }, [store]);

  const notesInNotebook = useMemo(() => {
    if (!store?.selectedNotebookId) return [];
    return store.notes
      .filter((n) => n.notebookId === store.selectedNotebookId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [store]);

  const selectedNote = useMemo(() => {
    if (!store?.selectedNoteId) return null;
    return store.notes.find((n) => n.id === store.selectedNoteId) ?? null;
  }, [store]);

  function updateStore(updater: (prev: NotesStore) => NotesStore) {
    setStore((prev) => (prev ? updater(prev) : prev));
  }

  function handleOpenNotebook(notebookId: string) {
    updateStore((prev) => {
      const notes = prev.notes
        .filter((n) => n.notebookId === notebookId)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      return {
        ...prev,
        selectedNotebookId: notebookId,
        selectedNoteId: notes[0]?.id ?? null,
      };
    });
    setView('notes');
  }

  function handleBackToNotebooks() {
    setView('notebooks');
  }

  function handleAddNotebook() {
    updateStore((prev) => {
      const notebook = createNotebook(`Notebook ${prev.notebooks.length + 1}`);
      const note = createNote(notebook.id);
      return {
        ...prev,
        notebooks: [...prev.notebooks, notebook],
        notes: [...prev.notes, note],
        selectedNotebookId: notebook.id,
        selectedNoteId: note.id,
      };
    });
    setView('notes');
  }

  function handleRenameNotebook(notebookId: string, name: string) {
    updateStore((prev) => ({
      ...prev,
      notebooks: prev.notebooks.map((nb) =>
        nb.id === notebookId ? { ...nb, name } : nb
      ),
    }));
  }

  function handleDeleteNotebook(notebookId: string) {
    updateStore((prev) => {
      if (prev.notebooks.length <= 1) return prev;
      const notebooks = prev.notebooks.filter((nb) => nb.id !== notebookId);
      const notes = prev.notes.filter((n) => n.notebookId !== notebookId);
      const selectedNotebookId =
        prev.selectedNotebookId === notebookId
          ? notebooks[0].id
          : prev.selectedNotebookId;
      const notesInSelected = notes
        .filter((n) => n.notebookId === selectedNotebookId)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      return {
        ...prev,
        notebooks,
        notes,
        selectedNotebookId,
        selectedNoteId: notesInSelected[0]?.id ?? null,
      };
    });
  }

  function handleSelectNote(noteId: string) {
    updateStore((prev) => ({ ...prev, selectedNoteId: noteId }));
  }

  function handleAddNote() {
    updateStore((prev) => {
      if (!prev.selectedNotebookId) return prev;
      const note = createNote(prev.selectedNotebookId);
      return {
        ...prev,
        notes: [...prev.notes, note],
        selectedNoteId: note.id,
      };
    });
  }

  function handleDeleteNote(noteId: string) {
    updateStore((prev) => {
      const notes = prev.notes.filter((n) => n.id !== noteId);
      const remaining = notes
        .filter((n) => n.notebookId === prev.selectedNotebookId)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      return {
        ...prev,
        notes,
        selectedNoteId:
          prev.selectedNoteId === noteId
            ? remaining[0]?.id ?? null
            : prev.selectedNoteId,
      };
    });
  }

  function handleTitleChange(title: string) {
    if (!selectedNote) return;
    updateStore((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === selectedNote.id
          ? { ...n, title, updatedAt: Date.now() }
          : n
      ),
    }));
  }

  function handleBodyChange(body: string) {
    if (!selectedNote) return;
    updateStore((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === selectedNote.id
          ? { ...n, body, updatedAt: Date.now() }
          : n
      ),
    }));
  }

  return (
    <BuiltinModalChrome appId="notes">
      {!store ? (
        <div className="notes-loading">Loading…</div>
      ) : view === 'notebooks' ? (
        <NotebooksPage
          notebooks={store.notebooks}
          noteCounts={noteCounts}
          onOpen={handleOpenNotebook}
          onAdd={handleAddNotebook}
          onRename={handleRenameNotebook}
          onDelete={handleDeleteNotebook}
        />
      ) : (
        <div className="notes-app notes-app-detail">
          <NotesListColumn
            notebookName={selectedNotebook?.name || 'Notebook'}
            notes={notesInNotebook}
            selectedNoteId={store.selectedNoteId}
            onBack={handleBackToNotebooks}
            onSelect={handleSelectNote}
            onAdd={handleAddNote}
            onDelete={handleDeleteNote}
          />
          <NoteEditor
            title={selectedNote?.title ?? ''}
            body={selectedNote?.body ?? ''}
            disabled={!selectedNote}
            onTitleChange={handleTitleChange}
            onBodyChange={handleBodyChange}
          />
        </div>
      )}
    </BuiltinModalChrome>
  );
}

export default NotesApp;
