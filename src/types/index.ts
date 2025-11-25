export interface UploadFileResponse {
  fileUri: string;
  fileName: string;
  mimeType: string;
  size?: number;
}

export interface ChatRequest {
  question: string;
  fileUri?: string;
  fileUris?: string[];
  conversationHistory?: Array<{
    role: 'user' | 'model';
    parts: string;
  }>;
}

export interface ChatResponse {
  response: string;
  fileUri?: string;
  fileUrisUsed?: string[];
}

