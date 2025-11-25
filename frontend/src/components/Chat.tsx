import React, { useState, useEffect, useRef } from 'react';
import { api, ChatResponse, FileInfo } from '../services/api';
import './Chat.css';

interface Message {
  role: 'user' | 'model';
  content: string;
  fileUrisUsed?: string[];
}

interface ChatProps {
  files: FileInfo[];
}

const Chat: React.FC<ChatProps> = ({ files }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Prepara histórico de conversa
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        parts: msg.content,
      }));

      // Se um arquivo específico foi selecionado, usa ele, senão busca em todos
      const fileUri = selectedFile || undefined;

      const result: ChatResponse = await api.chatWithFile(
        input,
        fileUri,
        undefined,
        conversationHistory
      );

      const modelMessage: Message = {
        role: 'model',
        content: result.data.response,
        fileUrisUsed: result.data.fileUrisUsed,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'model',
        content: `Erro: ${error.message || 'Erro ao buscar informações'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat">
      <h2>💬 Chat com Arquivos</h2>
      
      <div className="chat-controls">
        <select
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          className="file-selector"
        >
          <option value="">🔍 Buscar em todos os arquivos (automático)</option>
          {files.map((file) => (
            <option key={file.id} value={file.id}>
              📄 {file.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>💡 Faça uma pergunta sobre os arquivos enviados!</p>
            <p className="hint">
              {selectedFile
                ? `Perguntando sobre: ${files.find((f) => f.id === selectedFile)?.displayName}`
                : 'A IA buscará automaticamente em todos os arquivos para encontrar a resposta.'}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? '👤 Você' : '🤖 IA'}
                </span>
                {message.fileUrisUsed && message.fileUrisUsed.length > 0 && (
                  <span className="files-used">
                    📄 {message.fileUrisUsed.length} arquivo(s) usado(s)
                  </span>
                )}
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
        {loading && (
          <div className="message model loading">
            <div className="message-content">
              <span className="typing-indicator">⏳ Buscando informações...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua pergunta aqui... (Enter para enviar, Shift+Enter para nova linha)"
          className="chat-input"
          rows={3}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="send-btn"
        >
          {loading ? '⏳' : '📤 Enviar'}
        </button>
      </div>
    </div>
  );
};

export default Chat;

