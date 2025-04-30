import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Presentation, Page, PageType, AudienceSummary, MultiChoiceSummary, OpenEndedSummary, ScalesSummary, RankingSummary, WordCloudSummary } from '@presentx/shared';
import Header from '@/components/Header';
import { useTheme } from '@/store/themeStore';
import { ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react';

// Import Summary Display Components
import MultiChoiceSummaryDisplay from '@/components/summaries/MultiChoiceSummaryDisplay';
import OpenEndedSummaryDisplay from '@/components/summaries/OpenEndedSummaryDisplay';
import ScalesSummaryDisplay from '@/components/summaries/ScalesSummaryDisplay';
import RankingSummaryDisplay from '@/components/summaries/RankingSummaryDisplay';
import WordCloudSummaryDisplay from '@/components/summaries/WordCloudSummaryDisplay';
// import QnaSummaryDisplay from '@/components/summaries/QnaSummaryDisplay'; // If needed later

// --- Helper Components ---

// --- Type-Specific Config Input Components ---

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
import { 
    MultiChoiceConfig, PollConfig, OpenEndedConfig, ScalesConfig, RankingConfig, WordCloudConfig, QnAConfig, PageConfig // Import specific config types
} from '@presentx/shared';

const PageConfigForm = ({ type, onSubmit, initialConfig }: { 
    type: PageType | ''; // Use PageType union
    onSubmit: (config: PageConfig) => void; 
    initialConfig?: PageConfig; 
}) => {
    const [config, setConfig] = useState<Partial<PageConfig>>({}); // Use Partial for intermediate state

    // Initialize/reset state when type or initialConfig changes
    useEffect(() => {
        console.log("PageConfigForm useEffect triggered. Type:", type, "Initial Config:", initialConfig);
        let initial: Partial<PageConfig> = {};
        if (initialConfig && type && initialConfig) {
             // Only apply initialConfig if it matches the current type (basic check)
             // More robust checking might be needed depending on how initialConfig is passed
             // For simplicity, we assume initialConfig is valid for the given type if provided.
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
            <h4 className={commonTitleClass}>{type.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())} Config</h4>
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

// --- Page Config Formatting Helper ---
const FormattedPageConfig = ({ config, type }: { config: any, type: PageType }) => {
    const textMutedClass = "text-gray-600 dark:text-gray-400 text-xs";
    const textPrimaryClass = "text-gray-700 dark:text-gray-200";
    const listClass = "list-disc list-inside pl-2";

    if (type === 'multi-choice' && config && config.question && Array.isArray(config.options)) {
        return (
            <div className="text-left">
                <p className={`font-medium ${textPrimaryClass}`}>Q: {config.question}</p>
                <ul className={`${listClass} ${textMutedClass}`}>
                    {config.options.map((opt: string, i: number) => <li key={i}>{opt}</li>)}
                </ul>
            </div>
        );
    }
    
    if (type === 'poll' && config && config.question && Array.isArray(config.options)) {
         return (
            <div className="text-left">
                <p className={`font-medium ${textPrimaryClass}`}>Poll: {config.question}</p>
                <ul className={`${listClass} ${textMutedClass}`}>
                    {config.options.map((opt: string, i: number) => <li key={i}>{opt}</li>)}
                </ul>
            </div>
        );
    }
    
    if (type === 'open-ended' && config && config.question) {
         return (
            <div className="text-left">
                <p className={`font-medium ${textPrimaryClass}`}>Open-Ended: {config.question}</p>
                {config.max_length && <p className={textMutedClass}>(Max Length: {config.max_length})</p>}
            </div>
        );
    }
    
    if (type === 'scales' && config && config.question) {
         return (
            <div className="text-left">
                <p className={`font-medium ${textPrimaryClass}`}>Scale: {config.question}</p>
                 <p className={textMutedClass}>Range: {config.scale_min} ({config.label_min || 'Min'}) to {config.scale_max} ({config.label_max || 'Max'})</p>
            </div>
        );
    }
    
    if (type === 'ranking' && config && config.question && Array.isArray(config.items)) {
         return (
            <div className="text-left">
                <p className={`font-medium ${textPrimaryClass}`}>Rank: {config.question}</p>
                <ul className={`${listClass} ${textMutedClass}`}>
                    {config.items.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
            </div>
        );
    }
    
    if (type === 'word-cloud' && config && config.question) {
         return (
            <div className="text-left">
                <p className={`font-medium ${textPrimaryClass}`}>Word Cloud: {config.question}</p>
                 {config.max_length && <p className={textMutedClass}>(Max Word Length: {config.max_length})</p>}
            </div>
        );
    }
    
    if (type === 'q&a') {
         return (
             <div className="text-left">
                <p className={`font-medium ${textPrimaryClass}`}>Q&A Session</p>
                {/* Add details from config if any are added later */}
             </div>
         );
    }

    // Fallback for other types or malformed config
    return (
        <pre className="text-xs bg-gray-50 dark:bg-gray-800 dark:text-gray-300 p-1 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
            {JSON.stringify(config, null, 2)}
        </pre>
    );
};

// --- Fullscreen Presentation Component ---
interface FullscreenPresentationProps {
    presentationId: string; 
    activePages: Page[]; 
    onClose: () => void;
    initialPageIndex?: number;
    onNavigate: (pageId: string | null) => Promise<void>; 
}

const FullscreenPresentation: React.FC<FullscreenPresentationProps> = ({
    presentationId, // Keep presentationId if needed for other actions
    activePages,
    onClose,
    initialPageIndex = 0,
    onNavigate,
}) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
    // REMOVED summary fetching state
    // const [summaryData, setSummaryData] = useState<AudienceSummary | null>(null);
    // const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    // const [summaryError, setSummaryError] = useState<string | null>(null);
    const { isDarkMode } = useTheme();

    const currentPage = activePages[currentPageIndex];

    // Navigate function
    const navigateToPage = useCallback(async (newIndex: number) => {
        if (newIndex >= 0 && newIndex < activePages.length) {
            const newPage = activePages[newIndex];
            setCurrentPageIndex(newIndex);
            // REMOVED local summary fetch trigger
            // setSummaryData(null); // Clear old summary
            // fetchSummary(newPage.page_id);
            try {
                 // Call the onNavigate prop to update the audience view
                 await onNavigate(newPage.page_id);
                 console.log(`Fullscreen: Navigated to page ${newPage.page_id}, audience view updated.`);
             } catch (error) {
                 console.error("Fullscreen: Failed to update audience page:", error);
                 // Optionally show an error to the presenter
             }
        }
    }, [activePages, onNavigate]);

     // REMOVED fetchSummary function
    /*
    const fetchSummary = async (pageId: string) => {
        console.log(`Fetching summary for page: ${pageId}`);
        setIsSummaryLoading(true);
        setSummaryError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/presentations/${presentationId}/pages/${pageId}/summary`, {
                 headers: {
                     'Authorization': `Bearer ${token}`,
                 },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch summary (Status: ${response.status})`);
            }
            const data = await response.json();
             console.log("Received summary data:", data);
            setSummaryData(data.summary); // Assuming API returns { summary: ... }
        } catch (err) {
            console.error("Error fetching summary:", err);
            setSummaryError(err instanceof Error ? err.message : 'Unknown summary error');
            setSummaryData(null);
        } finally {
            setIsSummaryLoading(false);
        }
    };
    */

    // Effect to fetch summary when page changes or initially
    // REMOVED - Summary now comes directly from the currentPage prop passed via activePages
    /*
    useEffect(() => {
        if (currentPage) {
            // Initial fetch or fetch on page change
             console.log(`Current page changed to ${currentPage.page_id}, fetching summary...`);
             setSummaryData(null); // Clear previous summary before fetching new one
             fetchSummary(currentPage.page_id);
        }
    }, [currentPage?.page_id]); // Depend on page_id
    */

    // Keyboard navigation effect
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
                navigateToPage(currentPageIndex + 1);
            } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
                navigateToPage(currentPageIndex - 1);
            } else if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentPageIndex, navigateToPage, onClose, activePages.length]);

    if (!currentPage) {
        return (
            <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <p className={isDarkMode ? 'text-white' : 'text-black'}>No active page selected or available.</p>
                <button 
                    onClick={onClose} 
                    className={`absolute top-4 right-4 p-2 rounded-full ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
                    aria-label="Close Fullscreen"
                >
                    <X size={24} />
                </button>
            </div>
        );
    }
    
     // Helper to render the correct summary component
     const renderSummary = (page: Page) => {
         const summary = page.audience_summary;
         const totalResponses = page.audience_response_count;

         if (!summary || totalResponses === 0) {
             return <p className="text-center text-sm text-gray-500 dark:text-gray-400 italic mt-4">No responses yet.</p>;
         }

         // Add specific checks for summary content if needed (e.g., ranking needs item_average_ranks)
         if (page.page_type === 'ranking' && !(summary as RankingSummary).item_average_ranks) {
             return <p className="text-center text-sm text-gray-500 dark:text-gray-400 italic mt-4">Summary data not available yet.</p>;
         }
         if (page.page_type === 'word-cloud' && !(summary as WordCloudSummary).top_words) {
              return <p className="text-center text-sm text-gray-500 dark:text-gray-400 italic mt-4">Summary data not available yet.</p>;
         }

         switch (page.page_type) {
             case 'multi-choice':
             case 'poll':
                 return <MultiChoiceSummaryDisplay summary={summary as MultiChoiceSummary} totalResponses={totalResponses} />;
             case 'open-ended':
                 return <OpenEndedSummaryDisplay summary={summary as OpenEndedSummary} />;
             case 'scales':
                 return <ScalesSummaryDisplay summary={summary as ScalesSummary} config={page.page_config as ScalesConfig} totalResponses={totalResponses} />;
             case 'ranking':
                 return <RankingSummaryDisplay summary={summary as RankingSummary} config={page.page_config as RankingConfig} totalResponses={totalResponses} />;
             case 'word-cloud':
                 return <WordCloudSummaryDisplay summary={summary as WordCloudSummary} />;
            // case 'q&a':
            //     return <QnaSummaryDisplay summary={summary as QnASummary} />; 
             default:
                 return <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700">{JSON.stringify(summary, null, 2)}</pre>;
         }
     };

    return (
        <div className={`fixed inset-0 z-50 flex flex-col ${isDarkMode ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-black'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-neutral-700' : 'border-neutral-300'} flex-shrink-0">
                 <span className="text-sm font-medium">
                     Page {currentPageIndex + 1} of {activePages.length}
                 </span>
                 <h2 className="text-xl font-semibold truncate text-center">
                     {currentPage.page_title || `Page ${currentPageIndex + 1}`}
                 </h2>
                 <button 
                     onClick={onClose} 
                     className={`p-1.5 rounded-full ${isDarkMode ? 'text-gray-300 hover:bg-neutral-700' : 'text-gray-600 hover:bg-neutral-300'}`}
                     aria-label="Close Fullscreen"
                 >
                     <X size={20} />
                 </button>
             </div>

            {/* Content Area (split view) */}
             <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
                 {/* Left Side: Page Content/Question */}
                <div className="flex flex-col items-center justify-center p-6 md:p-10 overflow-y-auto border-r border-neutral-300 dark:border-neutral-700">
                     <h3 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                         {currentPage.page_type === 'q&a' 
                            ? 'Q&A Session' 
                            : (currentPage.page_config as any)?.question || '-'}
                     </h3>
                     {/* Optionally display options/items/scale info here if needed */}
                      {currentPage.page_type === 'multi-choice' && (currentPage.page_config as MultiChoiceConfig).options && (
                         <ul className="list-disc list-inside text-left space-y-1 mt-4 text-lg text-neutral-700 dark:text-neutral-300">
                            {(currentPage.page_config as MultiChoiceConfig).options.map(opt => <li key={opt}>{opt}</li>)}
                         </ul>
                     )}
                     {currentPage.page_type === 'ranking' && (currentPage.page_config as RankingConfig).items && (
                         <ul className="list-decimal list-inside text-left space-y-1 mt-4 text-lg text-neutral-700 dark:text-neutral-300">
                            {(currentPage.page_config as RankingConfig).items.map(item => <li key={item}>{item}</li>)}
                         </ul>
                     )}
                      {currentPage.page_type === 'scales' && (
                         <div className="flex justify-between w-full max-w-xs mt-4 text-lg text-neutral-700 dark:text-neutral-300">
                             <span>{(currentPage.page_config as ScalesConfig).label_min || (currentPage.page_config as ScalesConfig).scale_min}</span>
                             <span>{(currentPage.page_config as ScalesConfig).label_max || (currentPage.page_config as ScalesConfig).scale_max}</span>
                         </div>
                     )}
                 </div>

                 {/* Right Side: Audience Summary */}
                 <div className="flex flex-col p-6 md:p-10 overflow-y-auto bg-white dark:bg-neutral-800">
                     <h4 className="text-xl font-semibold mb-4 text-neutral-800 dark:text-neutral-100">Live Results</h4>
                      <div className="flex-grow flex items-center justify-center">
                          <div className="w-full max-w-md">
                             {renderSummary(currentPage)}
                          </div>
                      </div>
                      <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-4">
                          Total Responses: {currentPage.audience_response_count || 0}
                      </p>
                 </div>
            </div>

            {/* Footer Navigation */}
             <div className="flex items-center justify-between p-4 border-t ${isDarkMode ? 'border-neutral-700' : 'border-neutral-300'} flex-shrink-0">
                <button 
                    onClick={() => navigateToPage(currentPageIndex - 1)} 
                    disabled={currentPageIndex === 0}
                    className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:hover:bg-neutral-200 dark:disabled:hover:bg-neutral-700"
                >
                    <ArrowLeft size={16} className="mr-1" />
                    Prev
                </button>
                <span className="text-sm">Use Arrow keys or Space to navigate</span>
                <button 
                    onClick={() => navigateToPage(currentPageIndex + 1)} 
                    disabled={currentPageIndex === activePages.length - 1}
                     className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:hover:bg-neutral-200 dark:disabled:hover:bg-neutral-700"
                >
                    Next
                    <ArrowRight size={16} className="ml-1" />
                </button>
            </div>
        </div>
    );
};

// --- New Edit Page Modal Component ---
interface EditPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    page: Page | null;
    onSubmit: (pageId: string, data: { page_title?: string; page_config?: any }) => void;
    isLoading: boolean;
}

const EditPageModal: React.FC<EditPageModalProps> = ({ isOpen, onClose, page, onSubmit, isLoading }) => {
    const { isDarkMode } = useTheme(); // Get theme state
    const [title, setTitle] = useState('');
    const [pageConfig, setPageConfig] = useState<any>(null); // Holds config from PageConfigForm
    const [formType, setFormType] = useState<PageType | ''>('');
    
    // State for form submission from PageConfigForm
    const configFormRef = useRef<{ submit: () => void }>(null); // To trigger submit externally if needed

    // Effect to update modal state when page prop changes
    useEffect(() => {
        if (page) {
            setTitle(page.page_title || '');
            setPageConfig(page.page_config); // Set initial config for the form
            setFormType(page.page_type);
        } else {
            // Reset when modal closes or no page
            setTitle('');
            setPageConfig(null);
            setFormType('');
        }
    }, [page]);

    // Effect for Escape key listener
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
        
        // Cleanup listener on component unmount or when modal closes
        return () => {
           window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]); // Re-attach if onClose changes

    const handleInternalConfigSubmit = (config: any) => {
        console.log("EditPageModal: Received config from form:", config);
        setPageConfig(config); // Update state with the submitted config
        // Now, call the main onSubmit passed from the parent
        if (page) {
            onSubmit(page.page_id, { page_title: title, page_config: config });
        }
    };
    
    // This is the function called when the modal's "Save Changes" button is clicked
    const handleSaveChanges = () => {
        console.log("EditPageModal: Save Changes button clicked. Current config state:", pageConfig);
         if (page) {
            // We directly use the latest state which should have been updated
            // by handleInternalConfigSubmit IF the form was used and submitted.
            // If the form wasn't submitted (e.g., only title changed), pageConfig retains its value.
            onSubmit(page.page_id, { page_title: title, page_config: pageConfig });
        }
    };

    if (!isOpen || !page) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className={`bg-white ${isDarkMode ? 'dark:bg-gray-800' : ''} rounded-lg shadow-xl w-full max-w-lg`}>
                <div className={`flex justify-between items-center p-4 border-b ${isDarkMode ? 'dark:border-gray-700' : 'border-gray-200'}`}>
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'dark:text-white' : 'text-gray-900'}`}>Edit Page: {page.page_title || `Page ${page.page_order + 1}`}</h2>
                    <button onClick={onClose} className={`text-gray-400 hover:text-gray-600 ${isDarkMode ? 'dark:hover:text-gray-200' : ''}`}>
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="pageTitle" className={`block text-sm font-medium ${isDarkMode ? 'dark:text-gray-300' : 'text-gray-700'}`}>Page Title:</label>
                        <input
                            type="text"
                            id="pageTitle"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                                isDarkMode 
                                ? 'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500' 
                                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                            }`}
                            placeholder="Enter page title"
                        />
                    </div>
                    
                    {/* Conditionally render PageConfigForm */}
                    {formType && (
                        <PageConfigForm 
                            type={formType} 
                            onSubmit={handleInternalConfigSubmit} 
                            initialConfig={pageConfig} // Pass current config as initial
                        />
                    )}
                    
                </div>
                <div className={`flex justify-end items-center p-4 border-t ${isDarkMode ? 'dark:border-gray-700' : 'border-gray-200'} space-x-2`}>
                    <button 
                        onClick={onClose}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded ${
                            isDarkMode 
                            ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        } disabled:opacity-50`}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveChanges} // Use the correct handler
                        disabled={isLoading}
                        className={`px-4 py-2 rounded text-white ${
                            isLoading ? 'bg-blue-300 dark:bg-blue-800' : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                        } disabled:opacity-50`}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const PresentationManagePage: React.FC = () => {
    const { id: presentationId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingPage, setIsAddingPage] = useState(false); // State to show/hide add page form
    const [newPageType, setNewPageType] = useState<PageType | ''>( 'multi-choice'); // <-- Fix: Use PageType union, initialize correctly
    const [newPageTitle, setNewPageTitle] = useState('');
    const [isUpdatingState, setIsUpdatingState] = useState(false); // Add state for loading indicator
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<Page | null>(null);
    const [isFullscreenMode, setIsFullscreenMode] = useState(false);
    const [fullscreenPageIndex, setFullscreenPageIndex] = useState(0);
    const [activatingPageId, setActivatingPageId] = useState<string | null>(null); // Track which page is being activated

    useEffect(() => {
        document.body.className = isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50';
    }, [isDarkMode]);

    useEffect(() => {
        if (presentationId) {
            fetchPresentation();
        } else {
            setError('No Presentation ID provided.');
            setIsLoading(false);
        }
    }, [presentationId]);

    const fetchPresentation = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`http://localhost:8080/api/presentations/${presentationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    navigate('/login'); // Redirect if unauthorized
                    return;
                } else if (response.status === 404) {
                    throw new Error('Presentation not found.');
                }
                throw new Error('Failed to fetch presentation details');
            }

            const data: Presentation = await response.json();
            // Ensure pages are sorted on fetch
            if (data.pages) {
                data.pages.sort((a, b) => a.page_order - b.page_order);
            }
            setPresentation(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch presentation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPage = async (pageConfig: any) => {
        if (!presentationId || !presentation) return;

        setError(null);
        // Basic validation
        if (!newPageType) {
            setError('Please select a page type.');
            return;
        }

        const newPageData: Omit<Page, 'page_id' | 'audience_response_count' | 'audience_summary'> = {
            page_order: presentation.pages.length, // Add to the end
            page_type: newPageType as any, // Cast needed if PageType enum isn't used directly
            status: 'active', // Explicitly set default status
            page_title: newPageTitle || '',
            page_config: pageConfig,
        };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/presentations/${presentationId}/pages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(newPageData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to add page' }));
                throw new Error(errorData.message || 'Failed to add page');
            }

            const updatedPresentation: Presentation = await response.json();
             // Ensure pages are sorted after update
            if (updatedPresentation.pages) {
                updatedPresentation.pages.sort((a, b) => a.page_order - b.page_order);
            }
            setPresentation(updatedPresentation);
            // Reset form
            setIsAddingPage(false);
            setNewPageTitle('');
            setNewPageType('multi-choice');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add page');
        }
    };

    const handleStartPresentation = async () => {
        if (!presentation || isUpdatingState) return; // Prevent double clicks
        
        setError(null);
        setIsUpdatingState(true); // Set loading state
        try {
            // Start the presentation session
            const response = await fetch(`http://localhost:8080/api/presentations/${presentationId}/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                let errorMessage = 'Failed to start presentation'; // Default
                try {
                    const errorData = await response.json();
                    if (errorData && (errorData.message || errorData.error)) {
                        errorMessage = errorData.message || errorData.error;
                    }
                } catch (jsonError) {
                    console.error('Failed to parse error response JSON:', jsonError);
                }
                throw new Error(errorMessage); // Throw with specific or default message
            }

            const { sessionId } = await response.json();
            // Update local state optimistically *before* navigating
            // The start endpoint doesn't return the full presentation, so we patch it
            setPresentation(prev => prev ? { ...prev, state: 'active' } : null);
            // navigate(`/presenter/${presentationId}/live/${sessionId}`); // <-- REMOVE NAVIGATION
            
            // ---> Automatically open fullscreen presenter view <--- 
            const activePages = presentation.pages.filter(p => p.status === 'active');
            if (activePages.length > 0) {
                const firstActiveIndex = presentation.pages.findIndex(p => p.status === 'active');
                setFullscreenPageIndex(firstActiveIndex); // Start at first active page
                 setIsFullscreenMode(true);
             } else {
                 // If no active pages, maybe show a message? 
                 // For now, just update state to active.
                 console.warn("Presentation started, but no active pages found.");
             }
            // ------------------------------------------------------

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start presentation');
        } finally {
            setIsUpdatingState(false); // Clear loading state
        }
    };

    // --- New Handler for Ending Presentation ---
    const handleEndPresentation = async () => {
        if (!presentation || isUpdatingState) return; // Prevent double clicks

        setError(null);
        setIsUpdatingState(true);
        try {
            const response = await fetch(`http://localhost:8080/api/presentations/${presentationId}/state`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ state: 'completed' }),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to end presentation';
                try {
                    const errorData = await response.json();
                    if (errorData && (errorData.message || errorData.error)) {
                        errorMessage = errorData.message || errorData.error;
                    }
                } catch (jsonError) {
                    console.error('Failed to parse error response JSON:', jsonError);
                }
                throw new Error(errorMessage);
            }

            const updatedPresentation: Presentation = await response.json();
            setPresentation(updatedPresentation); // Update state with response from backend

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to end presentation');
        } finally {
            setIsUpdatingState(false);
        }
    };

    const handlePageChange = async (newIndex: number) => {
        // TODO: Implement handlePageChange logic properly
        // This function is currently not used, but the previous attempt had type errors
        // It likely needs to call the backend API PUT /api/presentations/:id/current-page
        // and then update the local presentation state upon success.

        /* PREVIOUS BROKEN CODE:
        if (!presentation || newIndex < 0 || newIndex >= presentation.pages.length) return;

        try {
            await fetch(`http://localhost:8080/api/presentations/${presentationId}/page`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pageIndex: newIndex }),
            });

            setPresentation(prevPresentation => ({
                ...prevPresentation,
                current_page_id: presentation.pages[newIndex].page_id,
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change page');
        }
        */
    };

    // Placeholder handlers for page actions
    const handleEditPage = (pageId: string) => {
        if (presentation) { // Only proceed if presentation data exists
            const pageToEdit = presentation.pages.find(p => p.page_id === pageId);
            if (pageToEdit) {
                setEditingPage(pageToEdit);
                setIsEditModalOpen(true);
                setError(null); // Clear previous errors
            } else {
                setError('Could not find page to edit.');
            }
        } else {
            setError('Presentation data not loaded.'); // Should not happen often
        }
    };

    const handleDeletePage = async (pageId: string) => {
        if (!presentation) {
            setError('Cannot delete page: Presentation data not loaded.');
            return;
        }
        
        // Confirmation dialog
        if (!window.confirm(`Are you sure you want to delete this page? (ID: ${pageId.substring(0,6)}...)`)) {
            return;
        }

        setIsUpdatingState(true); // Use existing state for loading indicator
        setError(null);
        try {
            const response = await fetch(`http://localhost:8080/api/presentations/${presentationId}/pages/${pageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                let errorMessage = 'Failed to delete page';
                try {
                    const errorData = await response.json();
                    if (errorData && (errorData.message || errorData.error)) {
                        errorMessage = errorData.message || errorData.error;
                    }
                } catch (jsonError) {
                    console.error('Failed to parse error response JSON:', jsonError);
                }
                throw new Error(errorMessage);
            }

            // On success, update local state
            const updatedPresentation: Presentation = await response.json();
            // Ensure pages are sorted after update from backend
            if (updatedPresentation.pages) {
                updatedPresentation.pages.sort((a, b) => a.page_order - b.page_order);
            }
            setPresentation(updatedPresentation);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete page');
        } finally {
            setIsUpdatingState(false);
        }
    };

    const handleActivatePage = useCallback(async (pageId: string | null) => {
        if (!presentationId) return;
        
        // Avoid unnecessary updates if the page is already the target
        if (presentation?.current_page_id === pageId) {
            console.log("Audience view already set to page:", pageId);
            return;
        }

        setIsUpdatingState(true);
        setActivatingPageId(pageId); // Set which page is being activated
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                navigate('/login');
                return;
            }
            
            const response = await fetch(`http://localhost:8080/api/presentations/${presentationId}/current-page`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ pageId: pageId }), // Use pageId to match the server schema
            });
            
            if (!response.ok) {
                let errorMessage = 'Failed to update active page';
                
                if (response.status === 401 || response.status === 403) {
                    errorMessage = 'Authentication failed. Please log in again.';
                    navigate('/login');
                } else if (response.status === 400) {
                    const errorData = await response.json().catch(() => ({}));
                    errorMessage = errorData.message || 'Invalid page ID or presentation state';
                } else if (response.status === 404) {
                    errorMessage = 'Presentation or page not found';
                }
                
                // Attempt to parse error body for more specific message
                if (errorMessage === 'Failed to update active page') { // Avoid overwriting specific messages
                    try {
                        const errorData = await response.json();
                        if (errorData && (errorData.message || errorData.error)) {
                            errorMessage = errorData.message || errorData.error;
                        }
                    } catch (jsonError) {
                        console.error('Failed to parse error response JSON:', jsonError);
                    }
                }
                
                throw new Error(errorMessage);
            }
            
            const updatedPresentation: Presentation = await response.json();
            setPresentation(updatedPresentation);
            
            // Show feedback message (optional)
            const message = pageId ? 'Audience view set successfully' : 'Audience view cleared';
            console.log(message);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update active page');
        } finally {
            setIsUpdatingState(false);
            setActivatingPageId(null); // Reset the activating page ID
        }
    // Add dependencies for useCallback
    }, [presentationId, navigate, presentation?.current_page_id]);

    // --- New Handler for Submitting Page Updates from Modal ---
    const handleUpdatePage = async (pageId: string, data: { page_title?: string; page_config?: any }) => {
        if (!presentationId || !presentation) return;

        setIsUpdatingState(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token not found. Please log in again.');
                setIsUpdatingState(false);
                navigate('/login');
                return;
            }
            
            const response = await fetch(`http://localhost:8080/api/presentations/${presentationId}/pages/${pageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to update page';
                if (response.status === 401 || response.status === 403) {
                    errorMessage = 'Authentication failed. Please log in again.';
                    navigate('/login');
                }
                try {
                    const errorData = await response.json();
                    if (errorMessage === 'Failed to update page' && errorData && (errorData.message || errorData.error)) {
                        errorMessage = errorData.message || errorData.error;
                    }
                } catch (jsonError) {
                    console.error('Failed to parse error response JSON:', jsonError);
                }
                throw new Error(errorMessage);
            }

            const updatedPresentationDataFromApi: Presentation = await response.json();

            if (updatedPresentationDataFromApi.pages) {
                updatedPresentationDataFromApi.pages.sort((a, b) => a.page_order - b.page_order);
            }
            
            setPresentation(updatedPresentationDataFromApi);

            setIsEditModalOpen(false);
            setEditingPage(null);

        } catch (error: any) {
            console.error('Failed to update page:', error);
            setError(error.message || 'An unexpected error occurred while updating the page.');
        } finally {
            setIsUpdatingState(false);
        }
    };

    // --- New Handler for Updating Page Status ---
    const handleUpdatePageStatus = async (pageId: string, newStatus: 'active' | 'skipped') => {
        if (!presentationId) return;
        
        // Optimistic update (optional but improves perceived performance)
        const originalPages = presentation?.pages;
        setPresentation(prev => {
            if (!prev) return null;
            return {
                ...prev,
                pages: prev.pages.map(p => p.page_id === pageId ? { ...p, status: newStatus } : p)
            };
        });

        setIsUpdatingState(true); // Use general updating state
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/presentations/${presentationId}/pages/${pageId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                // Revert optimistic update on failure
                setPresentation(prev => prev ? { ...prev, pages: originalPages || [] } : null);
                
                let errorMessage = 'Failed to update page status';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch { /* Ignore parsing error */ }
                throw new Error(errorMessage);
            }

            // Update state with the confirmed data from the backend
            const updatedPresentation: Presentation = await response.json();
             if (updatedPresentation.pages) {
                updatedPresentation.pages.sort((a, b) => a.page_order - b.page_order);
            }
            setPresentation(updatedPresentation);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update page status');
            // Revert optimistic update on error
            setPresentation(prev => prev ? { ...prev, pages: originalPages || [] } : null);
        } finally {
            setIsUpdatingState(false);
        }
    };

    // --- New Handler for Setting Status for All Pages ---
    const handleSetAllPagesStatus = async (newStatus: 'active' | 'skipped') => {
        if (!presentationId || !presentation?.pages || presentation.pages.length === 0) return;

        const originalPages = presentation.pages;
        // Optimistic update
        setPresentation(prev => prev ? { ...prev, pages: prev.pages.map(p => ({ ...p, status: newStatus })) } : null);
        
        setIsUpdatingState(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/presentations/${presentationId}/pages/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                setPresentation(prev => prev ? { ...prev, pages: originalPages } : null); // Revert
                let errorMessage = `Failed to set all pages to ${newStatus}`;
                try { const errorData = await response.json(); errorMessage = errorData.message || errorMessage; } catch {} 
                throw new Error(errorMessage);
            }

            const updatedPresentation: Presentation = await response.json();
            if (updatedPresentation.pages) {
                updatedPresentation.pages.sort((a, b) => a.page_order - b.page_order);
            }
            setPresentation(updatedPresentation);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update all page statuses');
            setPresentation(prev => prev ? { ...prev, pages: originalPages } : null); // Revert
        } finally {
            setIsUpdatingState(false);
        }
    };

    // --- Render Functions ---

    const renderLoading = () => (
        <div className="flex justify-center items-center h-64">
            <p className={`text-gray-500 ${isDarkMode ? 'dark:text-gray-400' : ''}`}>Loading presentation details...</p>
        </div>
    );

    const renderError = () => (
        <div className={`p-4 mb-4 text-sm rounded-lg ${isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'}`} role="alert">
            <span className="font-medium">Error!</span> {error}
        </div>
    );

    const renderNotFound = () => (
        <div className={`p-4 mb-4 text-sm rounded-lg ${isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`} role="alert">
            <span className="font-medium">Not Found!</span> No presentation found with this ID.
            <button onClick={() => navigate('/')} className="ml-4 underline">Go Home</button>
        </div>
    );

    if (isLoading) return <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}><Header /><div className="container mx-auto p-4">{renderLoading()}</div></div>;
    if (error) return <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}><Header /><div className="container mx-auto p-4">{renderError()}</div></div>;
    if (!presentation) return <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}><Header /><div className="container mx-auto p-4"><p>Something went wrong.</p></div></div>;

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <Header />
            
            <div className="container mx-auto p-4">
                {error && renderError()}

                {/* Presentation Details */}
                <div className={`mb-6 p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                             <h1 className="text-2xl font-bold">{presentation.title}</h1>
                             <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>State: <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${presentation.state === 'active' ? (isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800') : (isDarkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800')}`}>{presentation.state}</span></p>
                        </div>
                        <div className="flex space-x-2">
                           {/* Conditionally render Start/End buttons based on state */}
                           {presentation.state === 'draft' && (
                                <button 
                                    onClick={handleStartPresentation} 
                                    disabled={isLoading}
                                    className={`px-4 py-2 rounded text-white ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} disabled:opacity-50`}
                                >
                                    Start Presentation
                                </button>
                            )}
                            {presentation.state === 'active' && (
                                <button 
                                    onClick={handleEndPresentation} 
                                    disabled={isLoading}
                                    className={`px-4 py-2 rounded text-white ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-50`}
                                >
                                    End Presentation
                                </button>
                            )}
                            <button 
                                onClick={() => navigate('/presenter')}
                                className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                            >
                                Back to List
                            </button>
                        </div>
                    </div>
                     {/* Access Code - only show if active */}
                    {presentation.state === 'active' && presentation.access_code && (
                        <div className={`mt-4 p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Audience Access Code: <strong className={`text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{presentation.access_code}</strong></p>
                        </div>
                    )}
                </div>

                {/* Manage Pages Section */}
                <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                     <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pages</h2>
                         <div className="flex items-center space-x-2">
                             {/* Bulk Status Update Buttons */}
                              <button
                                onClick={() => handleSetAllPagesStatus('active')}
                                disabled={isUpdatingState || presentation.state !== 'active'} // Disable if not active
                                className={`px-3 py-1 text-xs rounded ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200'} ${isDarkMode ? 'text-blue-100' : 'text-blue-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={presentation.state !== 'active' ? "Presentation must be active to set status" : ""}
                            >
                                Set All Active
                            </button>
                            <button
                                onClick={() => handleSetAllPagesStatus('skipped')}
                                disabled={isUpdatingState || presentation.state !== 'active'} // Disable if not active
                                className={`px-3 py-1 text-xs rounded ${isDarkMode ? 'bg-yellow-700 hover:bg-yellow-600' : 'bg-yellow-100 hover:bg-yellow-200'} ${isDarkMode ? 'text-yellow-100' : 'text-yellow-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={presentation.state !== 'active' ? "Presentation must be active to set status" : ""}
                            >
                                Set All Skipped
                            </button>
                             {/* Present Button */}
                             <button
                                onClick={() => {
                                    const activePages = presentation.pages.filter(p => p.status === 'active');
                                    if (activePages.length > 0) {
                                         // Find the index of the current audience page among active pages
                                        const currentActiveIndex = activePages.findIndex(p => p.page_id === presentation?.current_page_id);
                                        setFullscreenPageIndex(Math.max(0, currentActiveIndex)); // Start at current page or first if none active
                                        setIsFullscreenMode(true);
                                    } else {
                                        alert("No active pages to present."); // Or show a more user-friendly message
                                    }
                                }}
                                disabled={presentation.pages.filter(p => p.status === 'active').length === 0 || presentation.state !== 'active'}
                                className={`px-4 py-2 rounded text-white flex items-center space-x-1 ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={presentation.state !== 'active' ? "Presentation must be active to present" : presentation.pages.filter(p => p.status === 'active').length === 0 ? "No active pages available" : "Present Active Pages"}
                             >
                                 <Maximize2 size={16} />
                                <span>Present Active Pages</span>
                             </button>
                         </div>
                     </div>

                    {/* Add Page Form Toggle */}
                    <div className="mb-4">
                        <button 
                            onClick={() => setIsAddingPage(!isAddingPage)}
                            disabled={presentation.state !== 'draft'}
                            className={`px-4 py-2 text-sm rounded ${
                                isDarkMode 
                                ? 'bg-green-700 hover:bg-green-600 text-white' 
                                : 'bg-green-100 hover:bg-green-200 text-green-800'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                             title={presentation.state !== 'draft' ? "Cannot add pages unless presentation is in draft state" : "Add New Page"}
                        >
                            {isAddingPage ? 'Cancel Add Page' : '+ Add New Page'}
                        </button>
                    </div>

                    {/* Add Page Form */}
                    {isAddingPage && (
                         <div className={`p-4 border rounded mb-4 ${isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                            <h3 className="text-lg font-medium mb-2">Add New Page</h3>
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Page Type:</label>
                                <select 
                                    value={newPageType} 
                                    onChange={(e) => setNewPageType(e.target.value as PageType | '')}
                                    className={`block w-full border rounded-md shadow-sm p-2 ${
                                        isDarkMode 
                                        ? 'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500' 
                                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                                    }`}
                                >
                                    <option value="">-- Select Type --</option>
                                    <option value="multi-choice">Multi-Choice</option>
                                    <option value="poll">Poll</option>
                                    <option value="open-ended">Open-Ended</option>
                                    <option value="scales">Scales</option>
                                    <option value="ranking">Ranking</option>
                                    <option value="word-cloud">Word Cloud</option>
                                    <option value="q&a">Q&A</option>
                                </select>
                            </div>
                             {newPageType && (
                                <PageConfigForm 
                                    type={newPageType} 
                                    onSubmit={handleAddPage} 
                                />
                            )}
                         </div>
                    )}

                    {/* Pages List/Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                <tr>
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Order</th>
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Title</th>
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Type</th>
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Config</th>
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Status</th>
                                    <th scope="col" className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
                                </tr>
                            </thead>
                             <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                                {presentation.pages.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className={`px-6 py-4 whitespace-nowrap text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            No pages added yet.
                                        </td>
                                    </tr>
                                )}
                                {presentation.pages.map((page, index) => (
                                    <tr key={page.page_id} className={page.page_id === presentation.current_page_id ? (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50') : ''}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">{index + 1}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{page.page_title || `Page ${index + 1}`}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">{page.page_type}</td>
                                        <td className="px-4 py-4 text-sm">
                                             <FormattedPageConfig config={page.page_config} type={page.page_type} />
                                        </td>
                                         <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                page.status === 'active' 
                                                ? (isDarkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800') 
                                                : (isDarkMode ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-100 text-yellow-800')
                                            }`}>
                                                {page.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center space-x-1">
                                            {/* Status Toggle Button */}
                                            <button
                                                 onClick={() => handleUpdatePageStatus(page.page_id, page.status === 'active' ? 'skipped' : 'active')}
                                                disabled={presentation.state !== 'active'} // Can only change status when active
                                                className={`px-2 py-1 text-xs rounded ${
                                                     page.status === 'active' 
                                                     ? (isDarkMode ? 'bg-yellow-700 hover:bg-yellow-600 text-yellow-100' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800') 
                                                     : (isDarkMode ? 'bg-green-700 hover:bg-green-600 text-green-100' : 'bg-green-100 hover:bg-green-200 text-green-800')
                                                 } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                title={presentation.state !== 'active' ? "Presentation must be active to change status" : (page.status === 'active' ? 'Set to Skipped' : 'Set to Active')}
                                            >
                                                 {page.status === 'active' ? 'Skip' : 'Activate'}
                                             </button>
                                             
                                             {/* Edit Button */}
                                            <button 
                                                onClick={() => handleEditPage(page.page_id)}
                                                disabled={presentation.state !== 'draft' && presentation.state !== 'active'} // Allow editing in draft or active
                                                className={`px-2 py-1 text-xs rounded ${
                                                    isDarkMode 
                                                    ? 'bg-blue-700 hover:bg-blue-600 text-blue-100' 
                                                    : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                title={(presentation.state !== 'draft' && presentation.state !== 'active') ? "Cannot edit unless presentation is draft or active" : "Edit Page"}
                                            >
                                                Edit
                                            </button>
                                            
                                            {/* Delete Button */}
                                            <button 
                                                onClick={() => handleDeletePage(page.page_id)} 
                                                disabled={presentation.state !== 'draft' && presentation.state !== 'active'} // Allow deleting in draft or active
                                                className={`px-2 py-1 text-xs rounded ${
                                                    isDarkMode 
                                                    ? 'bg-red-700 hover:bg-red-600 text-red-100' 
                                                    : 'bg-red-100 hover:bg-red-200 text-red-800'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                 title={(presentation.state !== 'draft' && presentation.state !== 'active') ? "Cannot delete unless presentation is draft or active" : "Delete Page"}
                                           >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Edit Page Modal */}
            <EditPageModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                page={editingPage}
                onSubmit={handleUpdatePage}
                isLoading={isUpdatingState}
            />
            
            {/* Fullscreen Presentation */}
            {isFullscreenMode && presentation && (
                <FullscreenPresentation
                    presentationId={presentation.presentation_id || presentation._id}
                    activePages={presentation.pages.filter(p => p.status === 'active')} // Pass only active pages
                    onClose={() => {
                        setIsFullscreenMode(false);
                         // Refetch presentation data after closing fullscreen in case audience page changed
                        fetchPresentation();
                    }}
                    initialPageIndex={fullscreenPageIndex}
                    onNavigate={handleActivatePage} // Pass the callback to update audience view
                />
            )}
        </div>
    );
};

export default PresentationManagePage; 