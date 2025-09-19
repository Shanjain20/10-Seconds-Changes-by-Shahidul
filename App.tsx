
import React, { useState, useRef } from 'react';
import Header from './components/Header';
import Editor from './components/Editor';

export interface EditorHandle {
  reset: () => void;
}

const App: React.FC = () => {
  const [showReset, setShowReset] = useState<boolean>(false);
  const editorRef = useRef<EditorHandle>(null);

  const handleReset = () => {
    editorRef.current?.reset();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header onReset={handleReset} showReset={showReset} />
      <main className="flex-grow flex p-4 sm:p-6 md:p-8">
        <Editor ref={editorRef} onImageStateChange={setShowReset} />
      </main>
    </div>
  );
};

export default App;
