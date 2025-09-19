import React, { useState } from 'react';
import { Template } from '../types';
import EditTemplateModal from './EditTemplateModal';
import StyleImageUploader from './StyleImageUploader';
import { generatePromptFromStyleImage } from '../services/geminiService';

interface TemplateSelectorProps {
  templates: Template[];
  onSelectTemplate: (template: Template) => void;
  isLoading: boolean;
  activeTemplateId?: string | null;
  onGenerate: () => void;
  isGenerating: boolean;
  onCustomPrompt: (prompt: string) => void;
  disabled: boolean;
  onCreateTemplate: (template: Template) => void;
  onUpdateTemplate: (template: Template) => void;
  onDeleteTemplate: (templateId: string) => void;
  styleImage: File | null;
  onStyleImageUpload: (file: File | null) => void;
}

const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-11.625a6.01 6.01 0 00-1.5-1.125m-1.5 12.75A6.01 6.01 0 016 6.75m6 11.25a6.01 6.01 0 00-1.5-11.625a6.01 6.01 0 001.5-1.125M12 18.75a.75.75 0 01.75.75v.008c0 .414-.336.75-.75.75h-.008a.75.75 0 01-.75-.75v-.008a.75.75 0 01.75-.75z" />
  </svg>
);

const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 4.811 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 19.5a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125m-2.637 2.637L10.5 17.5" />
    </svg>
);

const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10 3.75a2 2 0 100 4 2 2 0 000-4zM4.125 3.75a2 2 0 100 4 2 2 0 000-4zM15.875 3.75a2 2 0 100 4 2 2 0 000-4zM4.125 9.375a2 2 0 100 4 2 2 0 000-4zM10 9.375a2 2 0 100 4 2 2 0 000-4zM15.875 9.375a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);


const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, onSelectTemplate, isLoading, activeTemplateId, onGenerate, isGenerating, onCustomPrompt, disabled, onCreateTemplate, onUpdateTemplate, onDeleteTemplate, styleImage, onStyleImageUpload }) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
  };

  const handleDelete = (templateId: string, templateName: string) => {
    if (window.confirm(`Are you sure you want to delete the "${templateName}" style?`)) {
      onDeleteTemplate(templateId);
    }
  };

  const handleGeneratePromptFromStyle = async () => {
    if (!styleImage) return;
    setIsAnalyzing(true);
    try {
        const generatedPrompt = await generatePromptFromStyleImage(styleImage);
        setCustomPrompt(generatedPrompt);
    } catch (error) {
        console.error("Failed to generate prompt from image:", error);
    } finally {
        setIsAnalyzing(false);
    }
  };

  if (disabled) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 h-full flex flex-col items-center justify-center text-center">
        <h2 className="text-lg font-bold mb-4 text-indigo-300">Styling Options</h2>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-400 font-medium">Upload a selfie to get started</p>
        <p className="text-sm text-gray-500 mt-1">Once you upload an image, all styling options will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <EditTemplateModal 
        isOpen={!!editingTemplate}
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSave={(updatedTemplate) => {
          onUpdateTemplate(updatedTemplate);
          setEditingTemplate(null);
        }}
      />
       <EditTemplateModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(newTemplate) => {
          onCreateTemplate(newTemplate);
          setIsCreateModalOpen(false);
        }}
      />
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 h-full flex flex-col">
        <h2 className="text-lg font-bold mb-2 text-indigo-300">Styling Options</h2>
        <button 
          onClick={onGenerate}
          disabled={isLoading || isGenerating}
          className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <LightbulbIcon className="w-5 h-5" />
              <span>Suggest a Style</span>
            </>
          )}
        </button>

        <div className="space-y-4 mb-4">
          <StyleImageUploader
            styleImage={styleImage}
            onStyleImageUpload={onStyleImageUpload}
            disabled={isLoading || isGenerating}
            isAnalyzing={isAnalyzing}
          />
          {styleImage && (
            <div className="mt-2 space-y-2">
              <button
                onClick={() => onCustomPrompt('Take the person from the second image and place them into the first image. The person should replace any main subject in the first image, seamlessly matching the overall style, lighting, and composition of the first image.')}
                disabled={isLoading || isGenerating || isAnalyzing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-colors"
              >
                <WandIcon className="w-5 h-5" />
                <span>Generate with Style Image</span>
              </button>
              <button
                onClick={handleGeneratePromptFromStyle}
                disabled={isLoading || isGenerating || isAnalyzing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="w-5 h-5" />
                    <span>Generate Prompt from Style</span>
                  </>
                )}
              </button>
            </div>
          )}
          <div>
            <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-300 mb-1">
                Or create your own style with a prompt
            </label>
            <textarea
                id="custom-prompt"
                rows={4}
                className="block w-full rounded-md bg-gray-900 border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-100 placeholder-gray-500 disabled:opacity-50 transition-colors"
                placeholder="e.g., Turn the person into a pencil sketch on textured paper, with soft shading."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isLoading || isGenerating}
                aria-label="Custom image generation prompt"
            />
            <button
                onClick={() => onCustomPrompt(customPrompt)}
                disabled={isLoading || isGenerating || !customPrompt.trim()}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-600/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors"
            >
                <PencilIcon className="w-5 h-5" />
                <span>Apply Prompt</span>
            </button>
          </div>
        </div>
        
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-between items-center">
              <span className="bg-gray-800/50 pr-2 text-sm text-gray-400 rounded-full">Pre-made Styles</span>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                disabled={isLoading || isGenerating}
                className="p-1.5 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white disabled:opacity-50"
                title="Add New Style"
              >
                  <PlusIcon className="w-4 h-4" />
              </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4 flex-grow overflow-y-auto pr-2">
          {templates.map((template) => (
            <div key={template.id} className="relative group">
              <button
                onClick={() => onSelectTemplate(template)}
                disabled={isLoading || isGenerating}
                className={`w-full aspect-square rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-200 ${(isLoading || isGenerating) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${activeTemplateId === template.id ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/50 flex items-end p-2 opacity-100 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-xs font-semibold">{template.name}</span>
                </div>
                {activeTemplateId === template.id && isLoading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
              </button>
              <div className="absolute top-1 right-1 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                    onClick={() => handleEdit(template)}
                    disabled={isLoading || isGenerating}
                    className="p-1.5 rounded-full bg-gray-900/60 text-gray-300 hover:bg-gray-900/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Edit Style"
                >
                    <EditIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleDelete(template.id, template.name)}
                    disabled={isLoading || isGenerating}
                    className="p-1.5 rounded-full bg-gray-900/60 text-red-400 hover:bg-gray-900/80 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete Style"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TemplateSelector;