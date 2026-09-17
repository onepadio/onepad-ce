import { ChevronLeft, Plus, Trash } from 'react-bootstrap-icons';

import type { NotesNote } from './types';

interface NotesListColumnProps {
  notebookName: string;
  notes: NotesNote[];
  selectedNoteId: string | null;
  onBack: () => void;
  onSelect: (noteId: string) => void;
  onAdd: () => void;
  onDelete: (noteId: string) => void;
}

function formatUpdated(ts: number) {
  try {
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function NotesListColumn({
  notebookName,
  notes,
  selectedNoteId,
  onBack,
  onSelect,
  onAdd,
  onDelete,
}: NotesListColumnProps) {
  return (
    <div className="notes-col notes-col-notes">
      <div className="notes-col-header notes-col-header-nav">
        <button
          type="button"
          className="notes-back-btn"
          onClick={onBack}
          title="All notebooks"
          aria-label="Back to notebooks"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="notes-col-title notes-col-title-grow" title={notebookName}>
          {notebookName}
        </span>
        <button
          type="button"
          className="notes-icon-btn"
          onClick={onAdd}
          title="New note"
          aria-label="New note"
        >
          <Plus size={16} />
        </button>
      </div>
      <ul className="notes-col-list">
        {notes.length === 0 && (
          <li className="notes-empty">No notes in this notebook</li>
        )}
        {notes.map((note) => {
          const selected = note.id === selectedNoteId;
          return (
            <li key={note.id}>
              <button
                type="button"
                className={`notes-list-item notes-list-item-stack${
                  selected ? ' is-selected' : ''
                }`}
                onClick={() => onSelect(note.id)}
              >
                <span className="notes-note-title">
                  {note.title || 'Untitled'}
                </span>
                <span className="notes-note-meta">
                  {formatUpdated(note.updatedAt)}
                  {note.body.trim()
                    ? ` · ${note.body.trim().slice(0, 40)}`
                    : ''}
                </span>
              </button>
              <button
                type="button"
                className="notes-row-action"
                title="Delete note"
                aria-label="Delete note"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
              >
                <Trash size={12} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default NotesListColumn;
