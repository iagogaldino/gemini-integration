import React, { useState } from 'react';
import { api, UploadResponse } from '../services/api';
import './FileUpload.css';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Selecione um arquivo primeiro' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const result: UploadResponse = await api.uploadFile(file);
      setMessage({ type: 'success', text: `Arquivo "${result.data.fileName}" enviado com sucesso!` });
      setFile(null);
      onUploadSuccess();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao fazer upload' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <h2>📁 Upload de Arquivo</h2>
      <div className="upload-container">
        <input
          type="file"
          id="file-input"
          onChange={handleFileChange}
          accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
          disabled={uploading}
        />
        <label htmlFor="file-input" className="file-label">
          {file ? file.name : 'Selecione um arquivo'}
        </label>
        <button onClick={handleUpload} disabled={!file || uploading} className="upload-btn">
          {uploading ? 'Enviando...' : 'Enviar Arquivo'}
        </button>
      </div>
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

