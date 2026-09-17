export type NotesNotebook = {
  id: string;
  name: string;
  createdAt: number;
};

export type NotesNote = {
  id: string;
  notebookId: string;
  title: string;
  body: string;
  updatedAt: number;
};

export type NotesStore = {
  version: 1;
  notebooks: NotesNotebook[];
  notes: NotesNote[];
  selectedNotebookId: string | null;
  selectedNoteId: string | null;
};
