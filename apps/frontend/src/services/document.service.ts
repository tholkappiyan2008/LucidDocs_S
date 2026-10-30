import api from './api';

export interface DocumentAnalysisResponse {
  success: boolean;
  message?: string;
  document: {
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
  };
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
