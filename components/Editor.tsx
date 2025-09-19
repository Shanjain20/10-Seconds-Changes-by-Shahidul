import React, { useState, useMemo, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Template } from '../types';
import { TEMPLATES } from '../constants';
import { editImageWithTemplate, generateTemplateIdea } from '../services/geminiService';
import TemplateSelector from './TemplateSelector';
import LoadingSpinner from './LoadingSpinner';
import { IconButton } from './IconButton';
import ImageUploader from './ImageUploader';
import { EditorHandle } from '../App';
import GenerationOptions from './GenerationOptions';
import GenerationHistory from './GenerationHistory';

interface EditorProps {
  onImageStateChange: (hasImage: boolean) => void;
}

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const RegenerateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l3.181-3.183a8.25 8.25 0 00-11.664 0l3.181 3.183" />
  </svg>
);

const cropImage = (imageFile: File, targetAspectRatioString: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const [widthRatio, heightRatio] = targetAspectRatioString.split(':').map(Number);
        const targetRatio = widthRatio / heightRatio;

        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        
        reader.onload = (event) => {
            if (typeof event.target?.result !== 'string') {
                return reject(new Error('FileReader did not return a valid string for the image source.'));
            }
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }

                let sx, sy, sWidth, sHeight;
                const imgRatio = img.width / img.height;

                if (imgRatio > targetRatio) {
                    sHeight = img.height;
                    sWidth = sHeight * targetRatio;
                    sx = (img.width - sWidth) / 2;
                    sy = 0;
                } else {
                    sWidth = img.width;
                    sHeight = sWidth / targetRatio;
                    sy = (img.height - sHeight) / 2;
                    sx = 0;
                }

                canvas.width = sWidth;
                canvas.height = sHeight;

                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const croppedFile = new File([blob], imageFile.name, {
                                type: imageFile.type,
                                lastModified: Date.now(),
                            });
                            resolve(croppedFile);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    imageFile.type,
                    0.95
                );
            };
            img.onerror = () => reject(new Error('The image file could not be loaded for cropping. It might be corrupted or in an unsupported format.'));
        };
        reader.onerror = () => reject(new Error(`FileReader failed to read the image file: ${reader.error?.message}`));
    });
};

const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
        case '2:3':
            return 'aspect-[2/3]';
        case '16:9':
            return 'aspect-[16/9]';
        case '1:1':
        default:
            return 'aspect-square';
    }
};

const Editor = forwardRef<EditorHandle, EditorProps>(({ onImageStateChange }, ref) => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImageFile, setProcessedImageFile] = useState<File | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const [imageVariants, setImageVariants] = useState<string[] | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [activeStyleName, setActiveStyleName] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  
  const [resolution, setResolution] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [generationMode, setGenerationMode] = useState<string>('Default');
  const [styleImage, setStyleImage] = useState<File | null>(null);
  
  const [generationHistory, setGenerationHistory] = useState<string[]>([]);
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  useEffect(() => {
    onImageStateChange(!!originalImage);
  }, [originalImage, onImageStateChange]);

  // Load history from localStorage when a new image is uploaded
  useEffect(() => {
    if (originalImage) {
      const key = `gen_history_${originalImage.name}_${originalImage.size}`;
      setHistoryKey(key);
      try {
        const storedHistory = localStorage.getItem(key);
        if (storedHistory) {
          setGenerationHistory(JSON.parse(storedHistory));
        } else {
          setGenerationHistory([]);
        }
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
        setGenerationHistory([]);
      }
    } else {
      setHistoryKey(null);
      setGenerationHistory([]);
    }
  }, [originalImage]);

  useEffect(() => {
    if (!originalImage) {
        return;
    }
    let isCancelled = false;

    const processImage = async () => {
        try {
            const croppedFile = await cropImage(originalImage, aspectRatio);
            if (!isCancelled) {
                const newUrl = URL.createObjectURL(croppedFile);
                setProcessedImageFile(croppedFile);
                setProcessedImageUrl(currentUrl => {
                    if (currentUrl) URL.revokeObjectURL(currentUrl);
                    return newUrl;
                });
            }
        } catch (err) {
            console.error("Failed to crop image:", err);
            if (!isCancelled) {
                setProcessedImageFile(originalImage);
                setProcessedImageUrl(currentUrl => {
                    if (currentUrl) URL.revokeObjectURL(currentUrl);
                    return URL.createObjectURL(originalImage);
                });
            }
        }
    };
    processImage();
    return () => { isCancelled = true; };
  }, [originalImage, aspectRatio]);

  useEffect(() => {
      return () => {
          if (processedImageUrl) {
              URL.revokeObjectURL(processedImageUrl);
          }
      };
  }, [processedImageUrl]);
  
  const handleImageUpload = (file: File) => {
    handleReset();
    setOriginalImage(file);
  };
  
  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImageFile(null);
    if(processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
    }
    setProcessedImageUrl(null);
    setImageVariants(null);
    setSelectedImage(null);
    setError(null);
    setActiveTemplate(null);
    setActiveStyleName(null);
    setLastPrompt(null);
    setIsLoading(false);
    setIsGenerating(false);
    setResolution('');
    setAspectRatio('1:1');
    setGenerationMode('Default');
    setStyleImage(null);
    if (historyKey) {
        localStorage.removeItem(historyKey);
    }
    setGenerationHistory([]);
    setHistoryKey(null);
  };

  useImperativeHandle(ref, () => ({
    reset: handleReset,
  }));

  const constructFinalPrompt = (basePrompt: string): string => {
    let finalPrompt = basePrompt;
    const additions: string[] = [];

    if (generationMode && generationMode !== 'Default') {
        additions.push(`a ${generationMode.toLowerCase()} style`);
    }
    if (resolution) {
        additions.push(`in ${resolution} resolution`);
    }
    
    if (additions.length > 0) {
        finalPrompt += `, ${additions.join(', ')}`;
    }
    return finalPrompt.trim();
  };

  const runGeneration = useCallback(async (prompt: string, styleName: string) => {
    if (isLoading || isGenerating || !processedImageFile) return;

    const finalPrompt = constructFinalPrompt(prompt);
    setLastPrompt(prompt);
    setActiveStyleName(styleName);
    setIsLoading(true);
    setError(null);
    setImageVariants(null);
    setSelectedImage(null);

    try {
      const results = await editImageWithTemplate(processedImageFile, finalPrompt, styleImage);
      setImageVariants(results);
      setSelectedImage(results[0]);
      
      // Update and save history
      if (historyKey) {
          setGenerationHistory(currentHistory => {
              const newHistory = [results[0], ...currentHistory].slice(0, 10);
              localStorage.setItem(historyKey, JSON.stringify(newHistory));
              return newHistory;
          });
      }

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [processedImageFile, isLoading, isGenerating, resolution, aspectRatio, generationMode, styleImage, historyKey]);

  const handleSelectTemplate = useCallback((template: Template) => {
    setActiveTemplate(template);
    runGeneration(template.prompt, template.name);
  }, [runGeneration]);

  const handleCustomPrompt = useCallback((prompt: string) => {
    if (isLoading || isGenerating || !prompt.trim()) return;
    setActiveTemplate(null);
    runGeneration(prompt, "Custom Style");
  }, [runGeneration]);

  const handleRegenerate = useCallback(() => {
    if (!lastPrompt || !activeStyleName) return;
    runGeneration(lastPrompt, activeStyleName);
  }, [lastPrompt, activeStyleName, runGeneration]);
  
  const handleDownload = () => {
    if (!selectedImage) return;
    const link = document.createElement('a');
    link.href = selectedImage;
    link.download = `stylized-${activeTemplate?.id || 'custom'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateTemplate = useCallback(async () => {
    if (isGenerating || isLoading) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const newTemplate = await generateTemplateIdea();
      setTemplates(prevTemplates => [newTemplate, ...prevTemplates]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate a new idea.');
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, isLoading]);

  const handleCreateTemplate = useCallback((newTemplate: Template) => {
    setTemplates(prev => [newTemplate, ...prev]);
  }, []);

  const handleUpdateTemplate = useCallback((updatedTemplate: Template) => {
    setTemplates(prevTemplates => 
      prevTemplates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
    );
  }, []);

  const handleDeleteTemplate = useCallback((templateId: string) => {
    setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
    if (activeTemplate?.id === templateId) {
        setImageVariants(null);
        setSelectedImage(null);
        setError(null);
        setActiveTemplate(null);
        setActiveStyleName(null);
        setLastPrompt(null);
    }
  }, [activeTemplate]);

  const handleRevertToHistory = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    // To make the UI consistent, we'll treat the single historical image as its own variant set.
    setImageVariants([imageUrl]);
    setError(null);
    setActiveStyleName('From History');
  }, []);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full max-w-7xl mx-auto">
      <div className="lg:col-span-3 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Left Panel: Uploader or Original Image */}
          <div className={`w-full ${getAspectRatioClass(aspectRatio)} bg-gray-800 rounded-lg overflow-hidden relative flex items-center justify-center border border-gray-700`}>
            {!processedImageUrl ? (
              <ImageUploader onImageUpload={handleImageUpload} />
            ) : (
              <>
                <img src={processedImageUrl} alt="Original" className="object-cover h-full w-full" />
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded">ORIGINAL</div>
              </>
            )}
          </div>
          {/* Right Panel: Placeholder or Edited Image */}
          <div className={`w-full ${getAspectRatioClass(aspectRatio)} bg-gray-800 rounded-lg overflow-hidden relative flex items-center justify-center border border-gray-700`}>
            {isLoading ? (
              <>
                {processedImageUrl && (
                  <img
                    src={processedImageUrl}
                    alt="Generating new version"
                    className="object-cover h-full w-full blur-md brightness-50 scale-105"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingSpinner message="Generating variants..." />
                </div>
              </>
            ) : error ? (
              <div className="p-4 text-center text-red-400">{error}</div>
            ) : selectedImage ? (
              <>
                <img src={selectedImage} alt="Edited" className="object-cover h-full w-full" />
                {activeStyleName && <div className="absolute top-2 left-2 bg-indigo-600/80 text-white text-xs font-bold px-2 py-1 rounded">{activeStyleName.toUpperCase()}</div>}
                <div className="absolute top-2 right-2 flex gap-2">
                  <IconButton onClick={handleRegenerate} title="Regenerate">
                    <RegenerateIcon className="w-6 h-6" />
                  </IconButton>
                  <IconButton onClick={handleDownload} title="Download Image">
                    <DownloadIcon className="w-6 h-6" />
                  </IconButton>
                </div>
                {imageVariants && imageVariants.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-4">
                    <div className="flex justify-center items-center gap-2 p-2 bg-black/50 backdrop-blur-sm rounded-lg">
                      {imageVariants.map((variant, index) => (
                        <button key={index} onClick={() => setSelectedImage(variant)} className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${selectedImage === variant ? 'border-indigo-500' : 'border-transparent hover:border-gray-500'}`}>
                          <img src={variant} alt={`Variant ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500 p-4 text-center">
                {!originalImage ? (
                  <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      <p className="mt-2 font-semibold">Your edited image will appear here.</p>
                      <p className="mt-1 text-sm">Upload a photo on the left to get started.</p>
                  </div>
                ) : (
                  <p>Select a template or write a prompt to see the magic happen!</p>
                )}
              </div>
            )}
          </div>
        </div>
        <GenerationOptions
          disabled={!originalImage || isLoading || isGenerating}
          resolution={resolution}
          onResolutionChange={setResolution}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          generationMode={generationMode}
          onGenerationModeChange={setGenerationMode}
        />
        <GenerationHistory
          history={generationHistory}
          onSelect={handleRevertToHistory}
          disabled={isLoading || isGenerating}
        />
      </div>
      <div className="lg:col-span-2">
        <TemplateSelector
          disabled={!originalImage}
          templates={templates}
          onSelectTemplate={handleSelectTemplate}
          isLoading={isLoading}
          activeTemplateId={activeTemplate?.id}
          onGenerate={handleGenerateTemplate}
          isGenerating={isGenerating}
          onCustomPrompt={handleCustomPrompt}
          onCreateTemplate={handleCreateTemplate}
          onUpdateTemplate={handleUpdateTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          styleImage={styleImage}
          onStyleImageUpload={setStyleImage}
        />
      </div>
    </div>
  );
});

export default Editor;