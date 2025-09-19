import React, { useCallback, useState, useMemo } from 'react';

interface StyleImageUploaderProps {
  styleImage: File | null;
  onStyleImageUpload: (file: File | null) => void;
  disabled: boolean;
  isAnalyzing?: boolean;
}

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 4.811 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);


const StyleImageUploader: React.FC<StyleImageUploaderProps> = ({ styleImage, onStyleImageUpload, disabled, isAnalyzing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const styleImageUrl = useMemo(() => styleImage ? URL.createObjectURL(styleImage) : null, [styleImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onStyleImageUpload(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onStyleImageUpload(e.dataTransfer.files[0]);
    }
  }, [onStyleImageUpload]);
  
  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
        setIsDragging(true);
    } else if (e.type === "dragleave") {
        setIsDragging(false);
    }
  };

  if (styleImageUrl) {
      return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
                Style Reference Image
            </label>
            <div className="relative group w-full h-24 rounded-lg overflow-hidden border border-gray-600">
                <img src={styleImageUrl} alt="Style Reference" className="w-full h-full object-cover" />
                {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-2 text-center">
                        <svg className="animate-spin h-6 w-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="mt-2 text-sm font-medium">Analyzing Style...</span>
                    </div>
                )}
                {!isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button 
                          onClick={() => onStyleImageUpload(null)}
                          disabled={disabled}
                          className="p-2 rounded-full bg-red-600/80 text-white hover:bg-red-500 disabled:bg-red-600/40"
                          title="Remove style image"
                      >
                          <TrashIcon className="w-5 h-5" />
                      </button>
                  </div>
                )}
            </div>
        </div>
      )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
          Use an image for style inspiration? (Optional)
      </label>
      <div 
        className={`relative flex items-center justify-center w-full rounded-lg border-2 ${isDragging ? 'border-indigo-400' : 'border-dashed border-gray-600'} p-4 text-center hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-300 ${disabled ? 'opacity-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragEvents}
        onDragEnter={handleDragEvents}
        onDragLeave={handleDragEvents}
      >
        <div className="flex items-center gap-3">
            <UploadIcon className="h-8 w-8 text-gray-500" />
            <div>
                <span className="block text-sm font-semibold text-gray-300">
                    Upload a style image
                </span>
                <p className="block text-xs text-gray-400">
                    Drag and drop, or click
                </p>
            </div>
        </div>
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          aria-label="Upload a style reference image"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default StyleImageUploader;