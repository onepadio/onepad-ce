interface NoteEditorProps {
  title: string;
  body: string;
  disabled?: boolean;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
}

function NoteEditor({
  title,
  body,
  disabled = false,
  onTitleChange,
  onBodyChange,
}: NoteEditorProps) {
  if (disabled) {
    return (
      <div className="notes-col notes-col-editor notes-editor-empty">
        <p>Select or create a note to start writing.</p>
      </div>
    );
  }

  return (
    <div className="notes-col notes-col-editor">
      <input
        className="notes-editor-title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Title"
        aria-label="Note title"
      />
      <textarea
        className="notes-app-editor"
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        placeholder="Start writing…"
        spellCheck
      />
    </div>
  );
}

export default NoteEditor;
