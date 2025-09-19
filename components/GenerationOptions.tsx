import React from 'react';

interface GenerationOptionsProps {
    disabled: boolean;
    resolution: string;
    onResolutionChange: (value: string) => void;
    aspectRatio: string;
    onAspectRatioChange: (value: string) => void;
    generationMode: string;
    onGenerationModeChange: (value: string) => void;
}

const OptionButton = ({ label, value, selectedValue, onChange, disabled }) => (
    <button
        type="button"
        onClick={() => onChange(value)}
        disabled={disabled}
        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            ${selectedValue === value 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`
        }
        aria-pressed={selectedValue === value}
    >
        {label}
    </button>
);

const GenerationOptions: React.FC<GenerationOptionsProps> = ({
    disabled,
    resolution,
    onResolutionChange,
    aspectRatio,
    onAspectRatioChange,
    generationMode,
    onGenerationModeChange
}) => {
    if (disabled) {
        return null;
    }
    
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
                <div className="flex flex-wrap gap-2">
                    <OptionButton label="Default" value="" selectedValue={resolution} onChange={onResolutionChange} disabled={disabled} />
                    <OptionButton label="2K" value="2K" selectedValue={resolution} onChange={onResolutionChange} disabled={disabled} />
                    <OptionButton label="4K" value="4K" selectedValue={resolution} onChange={onResolutionChange} disabled={disabled} />
                    <OptionButton label="8K" value="8K" selectedValue={resolution} onChange={onResolutionChange} disabled={disabled} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                <div className="flex flex-wrap gap-2">
                    <OptionButton label="1:1" value="1:1" selectedValue={aspectRatio} onChange={onAspectRatioChange} disabled={disabled} />
                    <OptionButton label="2:3" value="2:3" selectedValue={aspectRatio} onChange={onAspectRatioChange} disabled={disabled} />
                    <OptionButton label="16:9" value="16:9" selectedValue={aspectRatio} onChange={onAspectRatioChange} disabled={disabled} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mode</label>
                <div className="flex flex-wrap gap-2">
                    <OptionButton label="Default" value="Default" selectedValue={generationMode} onChange={onGenerationModeChange} disabled={disabled} />
                    <OptionButton label="Cinematic" value="Cinematic" selectedValue={generationMode} onChange={onGenerationModeChange} disabled={disabled} />
                    <OptionButton label="Realistic" value="Realistic" selectedValue={generationMode} onChange={onGenerationModeChange} disabled={disabled} />
                    <OptionButton label="Artistic" value="Artistic" selectedValue={generationMode} onChange={onGenerationModeChange} disabled={disabled} />
                </div>
            </div>
        </div>
    );
};

export default GenerationOptions;
