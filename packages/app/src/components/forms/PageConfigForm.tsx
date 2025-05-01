import React, { useState, useEffect } from 'react';
import { PageConfig, PageType, MultiChoiceConfig, PollConfig, OpenEndedConfig, ScalesConfig, RankingConfig, WordCloudConfig, QnAConfig } from '@presentx/shared';

// --- Type-Specific Config Input Components ---
// These should also ideally be in separate files, but keep them here for simplicity for now.

interface ConfigInputProps<T> {
    config: T;
    onChange: (newConfig: Partial<T>) => void;
}

const commonInputClass = "mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
const commonLabelClass = "block text-sm text-gray-700 dark:text-gray-300";

const MultiChoiceConfigInputs: React.FC<ConfigInputProps<MultiChoiceConfig>> = ({ config, onChange }) => {
    const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(config.options || [])];
        newOptions[index] = value;
    onChange({ options: newOptions });
    };

    const addOption = () => onChange({ options: [...(config.options || []), ''] });
    const removeOption = (index: number) => onChange({ options: (config.options || []).filter((_, i) => i !== index) });

    return (
        <>
            <div>
                <label className={commonLabelClass}>Question:</label>
                <input
                    type="text"
                    value={config.question || ''}
                    onChange={e => onChange({ question: e.target.value })}
                    required
                    className={commonInputClass}
                />
            </div>
            <div>
                <label className={commonLabelClass}>Options:</label>
                {(config.options || []).map((opt, i) => (
                    <div key={i} className="flex items-center mb-1 space-x-2">
                         <input
                            key={i}
                            type="text"
                            value={opt}
                            onChange={e => handleOptionChange(i, e.target.value)}
                            placeholder={`Option ${i + 1}`}
                            className={`${commonInputClass} flex-grow`}
                        />
                         { (config.options || []).length > 1 && ( // Show remove button only if more than 1 option
                            <button type="button" onClick={() => removeOption(i)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 text-xs">Remove</button>
                         )}
                    </div>
                ))}
                <button type="button" onClick={addOption} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1">+ Add Option</button>
            </div>
            <div className="flex items-center">
                 <input 
                    type="checkbox" 
                    id="allow_multiple" 
                    checked={config.allow_multiple || false} 
                    onChange={e => onChange({ allow_multiple: e.target.checked })} 
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" 
                 />
                 <label htmlFor="allow_multiple" className={`${commonLabelClass} ml-2`}>Allow multiple selections</label>
             </div>
        </>
    );
};

const PollConfigInputs: React.FC<ConfigInputProps<PollConfig>> = ({ config, onChange }) => {
     const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...(config.options || [])];
        newOptions[index] = value;
        onChange({ options: newOptions });
    };

    const addOption = () => onChange({ options: [...(config.options || []), ''] });
     const removeOption = (index: number) => onChange({ options: (config.options || []).filter((_, i) => i !== index) });

        return (
        <>
                <div>
                <label className={commonLabelClass}>Question:</label>
                <input
                    type="text"
                    value={config.question || ''}
                    onChange={e => onChange({ question: e.target.value })}
                    required
                    className={commonInputClass}
                />
                </div>
                <div>
                <label className={commonLabelClass}>Options:</label>
                {(config.options || []).map((opt, i) => (
                     <div key={i} className="flex items-center mb-1 space-x-2">
                        <input
                            key={i}
                            type="text"
                            value={opt}
                            onChange={e => handleOptionChange(i, e.target.value)}
                            placeholder={`Option ${i + 1}`}
                            className={`${commonInputClass} flex-grow`}
                        />
                         { (config.options || []).length > 1 && (
                            <button type="button" onClick={() => removeOption(i)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 text-xs">Remove</button>
                         )}
                    </div>
                    ))}
                <button type="button" onClick={addOption} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1">+ Add Option</button>
                </div>
        </>
    );
};


const OpenEndedConfigInputs: React.FC<ConfigInputProps<OpenEndedConfig>> = ({ config, onChange }) => {
    return (
        <>
            <div>
                <label className={commonLabelClass}>Question/Prompt:</label>
                <input
                    type="text"
                    value={config.question || ''}
                    onChange={e => onChange({ question: e.target.value })}
                    required
                    className={commonInputClass}
                />
            </div>
            <div>
                <label className={commonLabelClass}>Max Answer Length (Optional):</label>
                <input
                    type="number"
                    value={config.max_length ?? ''}
                    onChange={e => onChange({ max_length: e.target.value ? parseInt(e.target.value) : undefined })}
                    min="1"
                    className={commonInputClass}
                />
            </div>
        </>
    );
};

const ScalesConfigInputs: React.FC<ConfigInputProps<ScalesConfig>> = ({ config, onChange }) => {
    return (
        <>
            <div>
                <label className={commonLabelClass}>Statement/Question:</label>
                <input
                    type="text"
                    value={config.question || ''}
                    onChange={e => onChange({ question: e.target.value })}
                    required
                    className={commonInputClass}
                />
            </div>
            <div className="flex space-x-4">
                <div className="flex-1">
                    <label className={commonLabelClass}>Min Scale Value:</label>
                    <input
                        type="number"
                        value={config.scale_min ?? 1}
                        onChange={e => onChange({ scale_min: parseInt(e.target.value) || 0 })}
                        required
                        className={commonInputClass}
                    />
                </div>
                <div className="flex-1">
                    <label className={commonLabelClass}>Max Scale Value:</label>
                    <input
                        type="number"
                        value={config.scale_max ?? 5}
                        onChange={e => onChange({ scale_max: parseInt(e.target.value) || 0 })}
                        required
                        min={(config.scale_min ?? 0) + 1}
                        className={commonInputClass}
                    />
                </div>
            </div>
            <div className="flex space-x-4">
                <div className="flex-1">
                    <label className={commonLabelClass}>Min Label (Optional):</label>
                    <input
                        type="text"
                        value={config.label_min || ''}
                        onChange={e => onChange({ label_min: e.target.value })}
                        placeholder="e.g., Strongly Disagree"
                        className={commonInputClass}
                    />
                </div>
                <div className="flex-1">
                    <label className={commonLabelClass}>Max Label (Optional):</label>
                    <input
                        type="text"
                        value={config.label_max || ''}
                        onChange={e => onChange({ label_max: e.target.value })}
                        placeholder="e.g., Strongly Agree"
                        className={commonInputClass}
                    />
                </div>
            </div>
        </>
    );
};


const RankingConfigInputs: React.FC<ConfigInputProps<RankingConfig>> = ({ config, onChange }) => {
    const handleItemChange = (index: number, value: string) => {
        const newItems = [...(config.items || [])];
        newItems[index] = value;
        onChange({ items: newItems });
    };

    const addItem = () => onChange({ items: [...(config.items || []), ''] });
    const removeItem = (index: number) => onChange({ items: (config.items || []).filter((_, i) => i !== index) });

    return (
        <>
            <div>
                <label className={commonLabelClass}>Question/Instruction:</label>
                <input
                    type="text"
                    value={config.question || ''}
                    onChange={e => onChange({ question: e.target.value })}
                    required
                    placeholder="e.g., Rank these features by importance"
                    className={commonInputClass}
                />
            </div>
            <div>
                <label className={commonLabelClass}>Items to Rank:</label>
                {(config.items || []).map((item, i) => (
                    <div key={i} className="flex items-center mb-1 space-x-2">
                        <input
                            type="text"
                            value={item}
                            onChange={e => handleItemChange(i, e.target.value)}
                            placeholder={`Item ${i + 1}`}
                            className={`${commonInputClass} flex-grow`}
                        />
                        {(config.items || []).length > 2 && (
                            <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 text-xs">Remove</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addItem} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1">+ Add Item</button>
            </div>
        </>
    );
};

const WordCloudConfigInputs: React.FC<ConfigInputProps<WordCloudConfig>> = ({ config, onChange }) => {
     return (
        <>
            <div>
                <label className={commonLabelClass}>Question/Prompt:</label>
                <input
                    type="text"
                    value={config.question || ''}
                    onChange={e => onChange({ question: e.target.value })}
                    required
                    className={commonInputClass}
                />
            </div>
            <div>
                <label className={commonLabelClass}>Max Word Length (Optional):</label>
                <input
                    type="number"
                    value={config.max_length ?? ''}
                    onChange={e => onChange({ max_length: e.target.value ? parseInt(e.target.value) : undefined })}
                    min="1"
                    className={commonInputClass}
                />
            </div>
        </>
    );
};

// --- Refactored Page Configuration Form ---

interface PageConfigFormProps {
    type: PageType | ''; // Use PageType union
    onSubmit: (config: PageConfig) => void;
    initialConfig?: PageConfig;
}

const PageConfigForm: React.FC<PageConfigFormProps> = ({ type, onSubmit, initialConfig }) => {
    const [config, setConfig] = useState<Partial<PageConfig>>({}); // Use Partial for intermediate state

    // Initialize/reset state when type or initialConfig changes
    useEffect(() => {
        console.log("PageConfigForm useEffect triggered. Type:", type, "Initial Config:", initialConfig);
        let initial: Partial<PageConfig> = {};
        if (initialConfig && type && initialConfig) {
             initial = { ...initialConfig };
             console.log("Applying initial config:", initial);
        } else {
             console.log("Resetting config for type:", type);
             // Set defaults based on type when creating new or type changes
             switch(type) {
                 case 'multi-choice': initial = { question: '', options: ['', ''], allow_multiple: false }; break;
                 case 'poll': initial = { question: '', options: ['', ''] }; break;
                 case 'open-ended': initial = { question: '', max_length: undefined }; break;
                 case 'scales': initial = { question: '', scale_min: 1, scale_max: 5, label_min: '', label_max: '' }; break;
                 case 'ranking': initial = { question: '', items: ['', ''] }; break;
                 case 'word-cloud': initial = { question: '', max_length: undefined }; break;
                 case 'q&a': initial = { allow_anonymous_questions: true, allow_upvotes: true }; break; // Example defaults
                 default: initial = {};
             }
             console.log("Default config set:", initial);
        }
        setConfig(initial);
    }, [type, initialConfig]); // Rerun effect if type or initialConfig changes

    // Handler to update parts of the config state
    const handleConfigChange = (newConfigPart: Partial<PageConfig>) => {
        setConfig(prevConfig => ({ ...prevConfig, ...newConfigPart }));
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('PageConfigForm: handleSubmit. Current config state:', config);

        // --- Data Validation & Cleanup ---
        let finalConfig: PageConfig;

        switch(type) {
            case 'multi-choice': { // Use block scope for clarity
                const currentConfig = config as Partial<MultiChoiceConfig>; // Assert partial type
                const cleanedOptions = (currentConfig.options || []).filter((o: string) => o.trim() !== '');
                if (!currentConfig.question?.trim()) { alert("Question is required."); return; }
                if (cleanedOptions.length < 1) { alert("Multi-choice requires at least one valid option."); return; }

                finalConfig = {
                    question: currentConfig.question.trim(),
                    options: cleanedOptions,
                    allow_multiple: currentConfig.allow_multiple || false,
                } as MultiChoiceConfig; // Final assertion
                break;
             }
             case 'poll': {
                const currentConfig = config as Partial<PollConfig>;
                const cleanedOptions = (currentConfig.options || []).filter((o: string) => o.trim() !== '');
                if (!currentConfig.question?.trim()) { alert("Question is required."); return; }
                if (cleanedOptions.length < 1) { alert("Poll requires at least one valid option."); return; }

                finalConfig = {
                    question: currentConfig.question.trim(),
                    options: cleanedOptions
                } as PollConfig;
                break;
             }
            case 'open-ended': {
                 const currentConfig = config as Partial<OpenEndedConfig>;
                 if (!currentConfig.question?.trim()) { alert("Question/Prompt is required."); return; }

                 finalConfig = {
                    question: currentConfig.question.trim(),
                    max_length: currentConfig.max_length // Keep as undefined if not set
                } as OpenEndedConfig;
                break;
             }
             case 'scales': {
                 const currentConfig = config as Partial<ScalesConfig>;
                 const scale_min = currentConfig.scale_min ?? 1;
                 const scale_max = currentConfig.scale_max ?? 5;
                 if (!currentConfig.question?.trim()) { alert("Question/Statement is required."); return; }
                 if (scale_max <= scale_min) { alert("Max scale value must be greater than min scale value."); return; }

                 finalConfig = {
                    question: currentConfig.question.trim(),
                    scale_min: scale_min,
                    scale_max: scale_max,
                    label_min: currentConfig.label_min?.trim() || undefined,
                    label_max: currentConfig.label_max?.trim() || undefined
                } as ScalesConfig;
                break;
            }
            case 'ranking': {
                const currentConfig = config as Partial<RankingConfig>;
                const cleanedItems = (currentConfig.items || []).filter((i: string) => i.trim() !== '');
                if (!currentConfig.question?.trim()) { alert("Question/Instruction is required."); return; }
                if (cleanedItems.length < 2) { alert("Ranking requires at least two valid items."); return; }

                finalConfig = {
                    question: currentConfig.question.trim(),
                    items: cleanedItems
                } as RankingConfig;
                break;
             }
             case 'word-cloud': {
                 const currentConfig = config as Partial<WordCloudConfig>;
                 if (!currentConfig.question?.trim()) { alert("Question/Prompt is required."); return; }

                 finalConfig = {
                    question: currentConfig.question.trim(),
                    max_length: currentConfig.max_length // Keep as undefined if not set
                } as WordCloudConfig;
                break;
            }
            case 'q&a': {
                 const currentConfig = config as Partial<QnAConfig>;
                 // No specific required fields for Q&A currently
                 finalConfig = {
                    allow_anonymous_questions: currentConfig.allow_anonymous_questions ?? true,
                    allow_upvotes: currentConfig.allow_upvotes ?? true
                 } as QnAConfig;
                 break;
            }
            default:
                console.error("PageConfigForm: Unknown type on submit:", type);
                alert("Cannot save config: Unknown page type.");
                return; // Don't submit if type is unknown
        }

        console.log('PageConfigForm: Submitting final config:', finalConfig);
        onSubmit(finalConfig); // Pass the validated & typed config up
    };

    // --- Render Logic ---
    const commonButtonClass = "px-3 py-1 text-white rounded";
    const commonContainerClass = "space-y-3 p-4 border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded";
    const commonTitleClass = "font-medium text-gray-900 dark:text-white";

    const renderInputs = () => {
        switch(type) {
            case 'multi-choice': return <MultiChoiceConfigInputs config={config as MultiChoiceConfig} onChange={handleConfigChange} />;
            case 'poll':         return <PollConfigInputs config={config as PollConfig} onChange={handleConfigChange} />;
            case 'open-ended':   return <OpenEndedConfigInputs config={config as OpenEndedConfig} onChange={handleConfigChange} />;
            case 'scales':       return <ScalesConfigInputs config={config as ScalesConfig} onChange={handleConfigChange} />;
            case 'ranking':      return <RankingConfigInputs config={config as RankingConfig} onChange={handleConfigChange} />;
            case 'word-cloud':   return <WordCloudConfigInputs config={config as WordCloudConfig} onChange={handleConfigChange} />;
            case 'q&a':          return <p className="text-sm text-gray-500 dark:text-gray-400">No specific configuration needed for Q&A page type currently.</p>; // Simple case
            default:             return <p className="text-sm text-red-500">Please select a page type.</p>;
        }
    };

    // Don't render the form if no type is selected
    if (!type) {
        return null;
    }

    // Render the form container and conditionally the inputs
    return (
        <form onSubmit={handleSubmit} className={commonContainerClass}>
            <h4 className={commonTitleClass}>{type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Config</h4>
            {renderInputs()}
            {/* Render Save button only if it's not Q&A (which might not need saving) or other types without inputs */}
            {type !== 'q&a' && (
                 <button type="submit" className={`${commonButtonClass} bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700`}>
                     Save Page Config
                 </button>
            )}
        </form>
    );
};

export default PageConfigForm; 