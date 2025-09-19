import React, { useState, useEffect } from 'react';
import { Template } from '../types';
import { generateThumbnailForPrompt } from '../services/geminiService';

interface EditTemplateModalProps {
  template?: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Template) => void;
}

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({ template, isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  const isCreateMode = !template;

  useEffect(() => {
    if (isOpen) {
      setName(template?.name || '');
      setPrompt(template?.prompt || '');
      setThumbnail(template?.thumbnail || null);
    }
  }, [template, isOpen]);

  if (!isOpen) return null;

  const handleGenerateThumbnail = async () => {
    if (!prompt) {
      alert("Please enter a prompt before generating a thumbnail.");
      return;
    }
    setIsGeneratingThumbnail(true);
    try {
      const newThumbnail = await generateThumbnailForPrompt(prompt);
      setThumbnail(newThumbnail);
    } catch (error) {
      console.error("Failed to generate thumbnail:", error);
      alert("Sorry, thumbnail generation failed. Please try again.");
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !prompt.trim()) {
        alert("Style Name and Prompt cannot be empty.");
        return;
    }
    const finalId = template?.id || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/_$/, '');
    const finalThumbnail = thumbnail || `https://picsum.photos/seed/${finalId}/200`;
    
    onSave({ 
      id: finalId, 
      name: name.trim(), 
      prompt: prompt.trim(), 
      thumbnail: finalThumbnail 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">{isCreateMode ? 'Add New Style' : 'Edit Style'}</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="template-name" className="block text-sm font-medium text-gray-300 mb-1">
              Style Name
            </label>
            <input
              type="text"
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-md bg-gray-900 border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-100"
              placeholder="e.g., Neon Punk"
            />
          </div>
          <div>
            <label htmlFor="template-prompt" className="block text-sm font-medium text-gray-300 mb-1">
              Prompt
            </label>
            <textarea
              id="template-prompt"
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="block w-full rounded-md bg-gray-900 border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-100"
              placeholder="A figurine of a person in a futuristic city with neon lights..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Thumbnail
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-md bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-600">
                {thumbnail && <img src={thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />}
              </div>
              <button
                type="button"
                onClick={handleGenerateThumbnail}
                disabled={isGeneratingThumbnail}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors"
              >
                {isGeneratingThumbnail ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : 'Generate Thumbnail'}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTemplateModal;
