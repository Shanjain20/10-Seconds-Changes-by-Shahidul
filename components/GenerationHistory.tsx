import React from 'react';

interface GenerationHistoryProps {
  history: string[];
  onSelect: (imageUrl: string) => void;
  disabled: boolean;
}

const GenerationHistory: React.FC<GenerationHistoryProps> = ({ history, onSelect, disabled }) => {
  if (history.length === 0) {
    return null; // Don't render anything if there's no history
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Generation History</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mb-2">
        {history.map((imageUrl, index) => (
          <button
            key={`${index}-${imageUrl.slice(-10)}`}
            onClick={() => onSelect(imageUrl)}
            disabled={disabled}
            className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 border-transparent hover:border-indigo-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={`Select history item ${index + 1}`}
          >
            <img src={imageUrl} alt={`History item ${index + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenerationHistory;
