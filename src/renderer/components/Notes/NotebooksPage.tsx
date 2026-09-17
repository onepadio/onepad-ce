import { Journal, Plus, Trash } from 'react-bootstrap-icons';

import type { NotesNotebook } from './types';

interface NotebooksPageProps {
  notebooks: NotesNotebook[];
  noteCounts: Record<string, number>;
  onOpen: (notebookId: string) => void;
  onAdd: () => void;
  onRename: (notebookId: string, name: string) => void;
  onDelete: (notebookId: string) => void;
}

function NotebooksPage({
  notebooks,
  noteCounts,
  onOpen,
  onAdd,
  onRename,
  onDelete,
}: NotebooksPageProps) {
  return (
    <div className="notes-page notes-page-notebooks">
      <div className="notes-page-header">
        <h2 className="notes-page-heading">Notebooks</h2>
        <button
          type="button"
          className="notes-icon-btn"
          onClick={onAdd}
          title="New notebook"
          aria-label="New notebook"
        >
          <Plus size={16} />
        </button>
      </div>
      <ul className="notes-page-list">
        {notebooks.map((nb) => {
          const count = noteCounts[nb.id] ?? 0;
          return (
            <li key={nb.id} className="notes-page-row">
              <button
                type="button"
                className="notes-notebook-card"
                onClick={() => onOpen(nb.id)}
              >
                <span className="notes-notebook-card-icon">
                  <Journal size={18} />
                </span>
                <span className="notes-notebook-card-body">
                  <input
                    className="notes-notebook-card-name"
                    value={nb.name}
                    onChange={(e) => onRename(nb.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Notebook name"
                  />
                  <span className="notes-notebook-card-meta">
                    {count} {count === 1 ? 'note' : 'notes'}
                  </span>
                </span>
              </button>
              {notebooks.length > 1 && (
                <button
                  type="button"
                  className="notes-row-action"
                  title="Delete notebook"
                  aria-label="Delete notebook"
                  onClick={() => onDelete(nb.id)}
                >
                  <Trash size={12} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default NotebooksPage;
