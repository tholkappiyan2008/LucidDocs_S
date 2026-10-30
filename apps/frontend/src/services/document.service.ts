import api from './api';

export interface DocumentListItem {
  id: string;
  file_name: string;
  mime_type: string;
  doc_type: string;
  sender: string;
  plain_summary: string;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DocumentListResponse {
  success: boolean;
  documents: DocumentListItem[];
  pagination: PaginationMeta;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  file_name: string;
  mime_type: string;
  doc_type: string;
  sender: string;
  plain_summary: string;
  analysis: {
    doc_type: string;
    sender: string;
    plain_summary: string;
    key_facts: Array<{ label: string; value: string; confidence: number }>;
    deadlines: Array<{ what: string; date: string }>;
    risks: Array<{ level: 'low' | 'medium' | 'high' | 'critical'; note: string }>;
    next_steps: string[];
    needs_human_check: string[];
  };
  created_at: string;
}

export interface DocumentAnalysisResponse {
  success: boolean;
  message?: string;
  document: DocumentRecord;
}

export interface UploadValidationResponse {
  success: boolean;
  message: string;
  file: {
    originalName: string;
    sizeBytes: number;
    mimeType: string;
    detectedType: string;
  };
  language: string;
}

export async function validateDocumentUpload(
  file: File,
  language: string = 'en'
): Promise<UploadValidationResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', language);

  const response = await api.post<UploadValidationResponse>(
    '/documents/validate-upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

export async function analyzeDocument(
  file: File,
  language: string = 'en'
): Promise<DocumentAnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', language);

  const response = await api.post<DocumentAnalysisResponse>(
    '/documents/analyze',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

export async function getDocuments(
  page: number = 1,
  limit: number = 10
): Promise<DocumentListResponse> {
  const response = await api.get<DocumentListResponse>('/documents', {
    params: { page, limit },
  });
  return response.data;
}

export async function getDocumentById(id: string): Promise<DocumentAnalysisResponse> {
  const response = await api.get<DocumentAnalysisResponse>(`/documents/${id}`);
  return response.data;
}

export async function deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/documents/${id}`);
  return response.data;
}

export async function translateDocument(
  id: string,
  language: string
): Promise<{ success: boolean; language: string; analysis: DocumentRecord['analysis'] }> {
  const response = await api.post<{
    success: boolean;
    language: string;
    analysis: DocumentRecord['analysis'];
  }>(`/documents/${id}/translate`, { language });
  return response.data;
}
