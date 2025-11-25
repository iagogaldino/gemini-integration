import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import Chat from './components/Chat';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';
import { api, FileInfo } from './services/api';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState('upload');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [files, setFiles] = useState<FileInfo[]>([]);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    loadFiles();
    // Muda automaticamente para a seção de arquivos após upload
    setActiveSection('files');
  };

  const loadFiles = async () => {
    try {
      const result = await api.listFiles();
      setFiles(result.data.files);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    }
  };

  React.useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  const renderContent = () => {
    switch (activeSection) {
      case 'upload':
        return <FileUpload onUploadSuccess={handleUploadSuccess} />;
      case 'files':
        return <FileList refreshTrigger={refreshTrigger} />;
      case 'chat':
        return <Chat files={files} />;
      case 'settings':
        return <Settings />;
      default:
        return <FileUpload onUploadSuccess={handleUploadSuccess} />;
    }
  };

  return (
    <div className="App">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="app-main">
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
