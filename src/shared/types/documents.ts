export type DocumentFileRef = {
  key: string;
  fileName: string;
  contentType: string;
  size: number;
  kind: 'document';
  assetUrl?: string | null;
};

export type CreateDocumentInput = {
  name: string;
  description?: string | null;
  file: DocumentFileRef;
};
