export interface Notebook {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  sourcesCount: number;
  artifactsCount: number;
  tags: string[];
  isFavorite: boolean;
  collectionId?: string;
}

export interface Source {
  id: string;
  notebookId: string;
  title: string;
  type: 'pdf' | 'google_doc' | 'web' | 'text' | 'youtube' | 'chat';
  addedAt: string;
  url?: string;
  size?: string;
}

export interface Artifact {
  id: string;
  notebookId: string;
  title: string;
  type: 'briefing' | 'study_guide' | 'flashcards' | 'slide_deck' | 'infographic' | 'quiz' | 'note';
  generatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  notebookCount: number;
}
