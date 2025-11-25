const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface FileInfo {
  id: string;
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  state: string;
  createTime: string;
  updateTime: string;
  uri: string;
  isActive?: boolean;
  status?: {
    active: boolean;
    deactivatedAt?: string;
    reactivatedAt?: string;
  };
}

export interface UploadResponse {
  success: boolean;
  data: {
    fileUri: string;
    fileName: string;
    mimeType: string;
    size?: number;
  };
  message: string;
}

export interface ListFilesResponse {
  success: boolean;
  count: number;
  total?: number;
  active?: number;
  inactive?: number;
  data: {
    files: FileInfo[];
    nextPageToken?: string;
  };
}

export interface ChatResponse {
  success: boolean;
  data: {
    response: string;
    fileUri?: string;
    fileUrisUsed?: string[];
  };
}

export const api = {
  // Upload de arquivo
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer upload');
    }

    return response.json();
  },

  // Listar arquivos
  listFiles: async (pageSize?: number, pageToken?: string, includeInactive?: boolean): Promise<ListFilesResponse> => {
    const params = new URLSearchParams();
    if (pageSize) params.append('pageSize', pageSize.toString());
    if (pageToken) params.append('pageToken', pageToken);
    if (includeInactive) params.append('includeInactive', 'true');

    const url = `${API_BASE_URL}/api/files${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao listar arquivos');
    }

    return response.json();
  },

  // Chat com arquivo
  chatWithFile: async (
    question: string,
    fileUri?: string,
    fileUris?: string[],
    conversationHistory?: Array<{ role: 'user' | 'model'; parts: string }>
  ): Promise<ChatResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/files/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        fileUri,
        fileUris,
        conversationHistory,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar informações');
    }

    return response.json();
  },

  // Obter informações de um arquivo
  getFileInfo: async (fileUri: string) => {
    const response = await fetch(`${API_BASE_URL}/api/files/info/${fileUri}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao obter informações do arquivo');
    }

    return response.json();
  },

  // Deletar arquivo
  deleteFile: async (fileUri: string) => {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileUri}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao deletar arquivo');
    }

    return response.json();
  },

  // Desativar arquivo
  deactivateFile: async (fileUri: string) => {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileUri}/deactivate`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao desativar arquivo');
    }

    return response.json();
  },

  // Reativar arquivo
  activateFile: async (fileUri: string) => {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileUri}/activate`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao reativar arquivo');
    }

    return response.json();
  },

  // Obter informações de uso e limites
  getUsage: async () => {
    const response = await fetch(`${API_BASE_URL}/api/config/usage`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao obter informações de uso');
    }

    return response.json();
  },
};

