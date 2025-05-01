import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Presentation, Page, PageType, AudienceSummary, MultiChoiceSummary, OpenEndedSummary, ScalesSummary, RankingSummary, WordCloudSummary, MultiChoiceConfig, PollConfig, OpenEndedConfig, ScalesConfig, RankingConfig, WordCloudConfig, QnAConfig } from '@presentx/shared';
import Header from '@/components/Header';
import { useTheme } from '@/store/themeStore';
import { usePresentationStore } from '@/store/presentationStore';
import { ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react';
import EditPageModal from '@/components/modals/EditPageModal'; // <-- Uncommented import

// Import Summary Display Components
import MultiChoiceSummaryDisplay from '@/components/summaries/MultiChoiceSummaryDisplay';
import OpenEndedSummaryDisplay from '@/components/summaries/OpenEndedSummaryDisplay';
import ScalesSummaryDisplay from '@/components/summaries/ScalesSummaryDisplay';
import RankingSummaryDisplay from '@/components/summaries/RankingSummaryDisplay';
import WordCloudSummaryDisplay from '@/components/summaries/WordCloudSummaryDisplay';
import PageConfigForm from '@/components/forms/PageConfigForm'; // <-- Import extracted component
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
    onClose: () => void;
}

const FullscreenPresentation: React.FC<FullscreenPresentationProps> = ({
    onClose,
}) => {
    const isDarkMode = useTheme(state => state.isDarkMode);
    const theme = isDarkMode ? 'dark' : 'light';
    
    // Get state directly from Zustand store
    const presentationId = usePresentationStore(state => state.presentationId);
    const presentation = usePresentationStore(state => state.presentation);
    const currentPageId = usePresentationStore(state => state.currentPageId); // <-- Get ID instead
    const currentSummary = usePresentationStore(state => state.currentSummary);
    const audienceCount = usePresentationStore(state => state.audienceCount);
    const setCurrentAudiencePageAction = usePresentationStore(state => state.setCurrentAudiencePage); // <-- Get action from store
    
    // ---> Derive currentPage locally <--- 
    const currentPage = React.useMemo(() => {
        return presentation?.pages?.find(p => p.page_id === currentPageId) || null;
    }, [presentation, currentPageId]);
    
    // Derive active pages from the full presentation object in store
    const activePages = presentation?.pages?.filter(p => p.status === 'active') || [];
    // ---> Update currentPageIndex derivation to use locally derived currentPage <---
    const currentPageIndex = React.useMemo(() => {
        return activePages.findIndex(p => p.page_id === currentPage?.page_id);
    }, [activePages, currentPage]);

    // Navigation Logic (using derived activePages and index)
    const handlePrev = () => {
        if (currentPageIndex > 0) {
            const prevPageId = activePages[currentPageIndex - 1].page_id;
            setCurrentAudiencePageAction(prevPageId); // <-- Use store action
        }
    };

    const handleNext = () => {
        if (currentPageIndex < activePages.length - 1) {
            const nextPageId = activePages[currentPageIndex + 1].page_id;
             setCurrentAudiencePageAction(nextPageId); // <-- Use store action
        }
    };

     useEffect(() => {
         const handleKeyDown = (event: KeyboardEvent) => {
             if (event.key === 'ArrowRight') {
                 handleNext();
             } else if (event.key === 'ArrowLeft') {
                 handlePrev();
             } else if (event.key === 'Escape') {
                 onClose();
             }
         };
         window.addEventListener('keydown', handleKeyDown);
         return () => {
             window.removeEventListener('keydown', handleKeyDown);
         };
         // Add dependencies for navigation logic
     }, [currentPageIndex, activePages, onClose]); // Dependencies might need adjustment

    // Render summary using the LIVE currentSummary from the store
     const renderSummary = (page: Page | null, summary: AudienceSummary | null) => {
         if (!page) return <p className="text-center text-gray-500 dark:text-gray-400">Loading page...</p>;
        
         const summaryData = summary; 
         const totalResponses = page.audience_response_count; // Get totalResponses from page
         const pageConfig = page.page_config; // Get config from page

         if (!summaryData) {
             // Show loading or no responses message
             if (page.audience_response_count === 0) {
                 return <p className="text-center text-sm text-gray-500 dark:text-gray-400 italic mt-4">No responses yet.</p>;
             } else {
                 return <p className="text-center text-sm text-gray-500 dark:text-gray-400 italic mt-4">Calculating summary...</p>;
             }
         }

        // Render components passing required props
        switch (page.page_type) {
            case 'multi-choice':
            case 'poll':
                 // Pass summary and totalResponses
                 return <MultiChoiceSummaryDisplay summary={summaryData as MultiChoiceSummary} totalResponses={totalResponses} />;
             case 'open-ended':
                 // Seems to only need summary (based on previous error)
                 return <OpenEndedSummaryDisplay summary={summaryData as OpenEndedSummary} />;
             case 'scales':
                 // Pass summary, config, and totalResponses
                 return <ScalesSummaryDisplay summary={summaryData as ScalesSummary} config={pageConfig as ScalesConfig} totalResponses={totalResponses} />;
             case 'ranking':
                 // Pass summary, config, and totalResponses
                 return <RankingSummaryDisplay summary={summaryData as RankingSummary} config={pageConfig as RankingConfig} totalResponses={totalResponses} />;
             case 'word-cloud':
                  // Seems to only need summary (based on previous errors)
                 return <WordCloudSummaryDisplay summary={summaryData as WordCloudSummary} />;
            default:
                return <p className="text-center text-gray-500 dark:text-gray-400">No summary available for this page type.</p>;
        }
     };

    return (
        <div className={`fixed inset-0 z-50 flex flex-col ${isDarkMode ? 'dark' : ''} bg-gray-100 dark:bg-black`}>
             <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-md">
                <span className="text-lg font-semibold">{presentation?.title || 'Presentation'} - Page {currentPageIndex + 1} of {activePages.length}</span>
                <div className="flex items-center space-x-4">
                     <span className="text-sm text-gray-600 dark:text-gray-400">Audience: {audienceCount}</span>
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                        <X size={24} />
                     </button>
                 </div>
            </div>

            <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                {/* Left Side (Content) */}
                 <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white overflow-y-auto">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center break-words">{
                        (currentPage?.page_config && 'question' in currentPage.page_config) 
                            ? currentPage.page_config.question 
                            : currentPage?.page_title || 'Loading...'
                    }</h2>
                    {/* Add rendering for options/items if needed for context */}
                    {currentPage?.page_type === 'multi-choice' || currentPage?.page_type === 'poll' ? (
                        <ul className="list-disc list-inside space-y-1 text-lg">
                            {(currentPage.page_config as MultiChoiceConfig).options?.map(opt => <li key={opt}>{opt}</li>)}
                        </ul>
                    ) : null}
                    {/* Add other page type content previews here */} 
                </div>

                {/* Right Side (Live Results) */}
                 <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
                    <h3 className="text-2xl font-semibold mb-4 text-center">Live Results</h3>
                    <div className="text-right mb-2 text-sm text-gray-500 dark:text-gray-400">
                        {/* Use count from page data as it's updated atomically by server */}
                        Total Responses: {currentPage?.audience_response_count ?? 0} 
                    </div>
                    <div className="flex-grow border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 flex flex-col justify-center">
                         {/* Call renderSummary with currentPage and the LIVE currentSummary from store */} 
                         {renderSummary(currentPage, currentSummary)} 
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
             <div className="flex justify-between p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                 <button onClick={handlePrev} disabled={currentPageIndex <= 0} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                     <ArrowLeft size={18} className="mr-1" /> Prev
                 </button>
                 <span className="text-gray-700 dark:text-gray-300">Page {currentPageIndex + 1} / {activePages.length}</span>
                 <button onClick={handleNext} disabled={currentPageIndex >= activePages.length - 1} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                     Next <ArrowRight size={18} className="ml-1" />
                 </button>
             </div>
        </div>
    );
}; // End of FullscreenPresentation

// --- Main Page Component ---

const PresentationManagePage: React.FC = () => {
  const { id: presentationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const storeInitialize = usePresentationStore(state => state.initializeFromJoinData); // Get store action
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
      storeInitialize(data); // <-- Initialize Zustand store with fetched data
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
        if (!presentation || presentation.state !== 'draft') {
            // ... error handling ...
             return;
        }
         try {
             setIsLoading(true);
             setError(null);
             const token = localStorage.getItem('token');
             if (!token) {
                 navigate('/login');
                 setIsLoading(false);
                 return;
             }
             const response = await fetch(`http://localhost:8080/api/presentations/${presentation._id}/state`, {
                 method: 'PUT',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}`,
                 },
                 body: JSON.stringify({ state: 'active' }),
             });
             if (!response.ok) {
                 throw new Error('Failed to start presentation');
             }
             const updatedPresentation: Presentation = await response.json();
             setPresentation(updatedPresentation);
             storeInitialize(updatedPresentation); // <-- Initialize store BEFORE opening fullscreen
             
             // Don't navigate, just open the fullscreen modal
             setIsFullscreenMode(true); 
             
         } catch (err: any) {
            setError(err.message || 'Failed to start presentation');
         } finally {
             setIsLoading(false);
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
                                        // const currentActiveIndex = activePages.findIndex(p => p.page_id === presentation?.current_page_id);
                                        // setFullscreenPageIndex(Math.max(0, currentActiveIndex)); // <-- REMOVE state update
                                        setIsFullscreenMode(true); // Just open the modal, store handles current page
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
        
            {/* Edit Page Modal - UNCOMMENTED */}
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
                    onClose={() => setIsFullscreenMode(false)}
                />
            )}
    </div>
  );
};

export default PresentationManagePage; 