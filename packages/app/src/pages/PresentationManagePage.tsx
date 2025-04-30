import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Presentation, Page, PageType } from '@presentx/shared';
import Header from '@/components/Header';
import { useTheme } from '@/store/themeStore';

// --- Helper Components ---

// Page Configuration Form (Placeholder for now)
const PageConfigForm = ({ type, onSubmit, initialConfig }: { 
    type: string; 
    onSubmit: (config: any) => void; 
    initialConfig?: any; // Add optional initialConfig prop
}) => {
    // Simple example for multi-choice
    if (type === 'multi-choice') {
        const [question, setQuestion] = useState('');
        const [options, setOptions] = useState<string[]>(['', '']);

        // Effect to initialize state from initialConfig
        useEffect(() => {
            if (initialConfig && typeof initialConfig === 'object') {
                setQuestion(initialConfig.question || '');
                setOptions(Array.isArray(initialConfig.options) ? initialConfig.options : ['', '']);
            } else {
                // Reset if no initial config or invalid type
                setQuestion('');
                setOptions(['', '']);
            }
            // Run when initialConfig changes (e.g., modal opens with new page data)
        }, [initialConfig]);

        const handleOptionChange = (index: number, value: string) => {
            const newOptions = [...options];
            newOptions[index] = value;
            setOptions(newOptions);
        };

        const addOption = () => setOptions([...options, '']);

        const handleSubmit = (e: React.FormEvent) => {
            console.log('PageConfigForm: internal handleSubmit triggered');
            e.preventDefault();
            onSubmit({ question, options: options.filter(o => o.trim() !== '') });
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-3 p-4 border bg-gray-50 rounded">
                <h4 className="font-medium">Multi-Choice Config</h4>
                <div>
                    <label className="block text-sm">Question:</label>
                    <input type="text" value={question} onChange={e => setQuestion(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm">Options:</label>
                    {options.map((opt, i) => (
                        <input key={i} type="text" value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Option ${i + 1}`} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm mb-1" />
                    ))}
                    <button type="button" onClick={addOption} className="text-sm text-blue-600 hover:underline">+ Add Option</button>
                </div>
                <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Save Page Config</button>
            </form>
        );
    }
    
    // Add forms for other types (open-text, poll, etc.) here
    return <p className="text-sm text-gray-500 p-4 border bg-gray-50 rounded">Configuration form for '{type}' not implemented yet.</p>; 
};

// --- Page Config Formatting Helper ---
const FormattedPageConfig = ({ config, type }: { config: any, type: PageType }) => {
    if (type === 'multi-choice' && config && config.question && Array.isArray(config.options)) {
        return (
            <div className="text-left">
                <p className="font-medium text-gray-700">Q: {config.question}</p>
                <ul className="list-disc list-inside text-gray-600 text-xs pl-2">
                    {config.options.map((opt: string, i: number) => <li key={i}>{opt}</li>)}
                </ul>
            </div>
        );
    }
    // TODO: Add formatting for other types (poll, open-text, etc.)
    
    // Fallback for other types or malformed config
    return (
        <pre className="text-xs bg-gray-50 p-1 rounded border border-gray-200 overflow-x-auto">
            {JSON.stringify(config, null, 2)}
        </pre>
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
    const [title, setTitle] = useState('');
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        if (page) {
            setTitle(page.page_title || '');
            setConfig(page.page_config);
        } else {
            setTitle('');
            setConfig(null);
        }
    }, [page, isOpen]);

    const handleConfigSubmit = useCallback((submittedConfig: any) => {
        if (page) {
            const dataToSend = { page_title: title.trim(), page_config: submittedConfig };
            onSubmit(page.page_id, dataToSend);
        }
    }, [page, title, onSubmit]);

    if (!isOpen || !page) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Edit Page (Order: {page.page_order + 1})</h2>
                <div className="space-y-4">
                    {/* Page Title Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Page Title (Optional):</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                            placeholder="e.g., Icebreaker Question"
                        />
                    </div>

                    {/* Page Config Form */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Page Configuration ({page.page_type}):</label>
                         <PageConfigForm 
                             type={page.page_type} 
                             onSubmit={handleConfigSubmit} 
                             initialConfig={config}
                         />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-6">
                        <button 
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
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
  const [newPageType, setNewPageType] = useState<string>('multi-choice'); // Default new page type
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isUpdatingState, setIsUpdatingState] = useState(false); // Add state for loading indicator
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);

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
      navigate(`/presenter/${presentationId}/live/${sessionId}`);
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

  // Placeholder handlers for page actions - to be implemented later
  const handleEditPage = (pageId: string) => {
      if (presentation && presentation.state === 'draft') {
          const pageToEdit = presentation.pages.find(p => p.page_id === pageId);
          if (pageToEdit) {
              setEditingPage(pageToEdit);
              setIsEditModalOpen(true);
              setError(null); // Clear previous errors
          } else {
              setError('Could not find page to edit.');
          }
      } else {
          setError('Cannot edit page: Presentation is not in draft state.')
      }
  };

  const handleDeletePage = async (pageId: string) => {
      if (!presentation || presentation.state !== 'draft') {
          setError('Cannot delete pages unless presentation is in draft state.');
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

  const handleActivatePage = async (pageId: string | null) => {
      console.log('Activate page:', pageId);
      if (!presentationId) return;
      // TODO: Implement PUT /current-page API call and update state
      setError('Activate functionality not yet implemented.');
      
      /* Implementation draft:
      setIsUpdatingState(true); 
      setError(null);
      try {
          const response = await fetch(`http://localhost:8080/api/presentations/${presentationId}/current-page`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({ pageId }), // Send null to deactivate all?
          });
           if (!response.ok) { throw new Error('Failed to set active page'); }
          const updatedPresentation: Presentation = await response.json();
          setPresentation(updatedPresentation);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to set active page');
      } finally {
          setIsUpdatingState(false);
      }
      */
  };

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

  // --- Render Functions ---

  const renderLoading = () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
  );

  const renderError = () => (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button
            onClick={() => navigate('/presenter')}
            className="mt-2 text-sm underline"
          >
            Back to Presentations
          </button>
        </div>
      </div>
  );

  const renderNotFound = () => (
       <div className="min-h-screen bg-gray-100 p-6">
        <div className="text-center">
          <p className="text-gray-600">Presentation not found</p>
          <button
            onClick={() => navigate('/presenter')}
            className="mt-2 text-sm underline"
          >
            Back to Presentations
          </button>
        </div>
      </div>
  );

  if (isLoading) {
    return renderLoading();
  }

  if (error) {
    return renderError();
  }

  if (!presentation) {
    return renderNotFound();
  }

  // --- Main Page Layout ---
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */} 
          <button onClick={() => navigate('/presenter')} className="mb-4 text-sm text-blue-600 hover:underline">
            &larr; Back to Presentations
          </button>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                   <h1 className="text-2xl font-bold text-gray-900">{presentation.title}</h1>
                   {presentation.description && (
                     <p className="mt-1 text-sm text-gray-600">{presentation.description}</p>
                   )}
                </div>
                {/* Updated Button Logic */}
                <button
                   onClick={() => {
                      if (presentation.state === 'draft') {
                          handleStartPresentation();
                      } else if (presentation.state === 'active') {
                          handleEndPresentation(); 
                      }
                   }}
                   className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${ 
                      presentation.state === 'draft' ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' : 
                      presentation.state === 'active' ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' : 
                      'bg-gray-400 text-gray-800 cursor-not-allowed' // Completed state style
                   }`}
                   disabled={presentation.state === 'completed' || isUpdatingState} // Disable if completed or updating
                >
                  {isUpdatingState ? 'Updating...' : 
                   presentation.state === 'draft' ? 'Start Presentation' : 
                   presentation.state === 'active' ? 'End Presentation' : 
                   'Presentation Completed'}
                </button>
              </div>
               <p className="mt-2 text-xs text-gray-500">ID: {presentation.presentation_id || presentation._id} | Access Code: {presentation.access_code} | State: <span className="font-medium">{presentation.state}</span></p>
            </div>

            {/* Pages List Section */}
            <div className="p-6 flex flex-col items-center">
              <div className="flex justify-between items-center mb-4 w-full">
                   <h2 className="text-xl font-semibold">Pages</h2>
                   <button 
                      onClick={() => setIsAddingPage(true)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      disabled={presentation.state !== 'draft'} // Only allow adding in draft state
                      title={presentation.state !== 'draft' ? 'Cannot add pages to an active or completed presentation' : 'Add New Page'}
                   >
                      + Add Page
                  </button>
              </div>
              
              {/* Add New Page Form (Conditional) */}
              {isAddingPage && (
                  <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <h3 className="text-lg font-medium mb-3">Add New Page</h3>
                      <div className="space-y-3">
                           <div>
                               <label className="block text-sm font-medium text-gray-700">Page Title (Optional):</label>
                              <input 
                                  type="text" 
                                  value={newPageTitle}
                                  onChange={(e) => setNewPageTitle(e.target.value)}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
                                  placeholder="e.g., Icebreaker Question"
                              />
                          </div>
                          <div>
                               <label className="block text-sm font-medium text-gray-700">Page Type:</label>
                              <select 
                                  value={newPageType} 
                                  onChange={(e) => setNewPageType(e.target.value)}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                              >
                                  <option value="multi-choice">Multiple Choice</option>
                                  <option value="open-text">Open Text</option>
                                  <option value="poll">Poll</option>
                                  <option value="word-cloud">Word Cloud</option>
                                  <option value="q&a">Q&A</option>
                                  <option value="rating">Rating</option>
                              </select>
                          </div>
                          {/* Render specific config form based on type */} 
                          <PageConfigForm type={newPageType} onSubmit={handleAddPage} initialConfig={null} />
                      </div>
                      <button 
                          onClick={() => setIsAddingPage(false)} 
                          className="mt-3 text-sm text-gray-600 hover:underline"
                      >
                          Cancel
                      </button>
                  </div>
              )}

              {/* Existing Pages Table */} 
              <div className="overflow-x-auto">
                  {presentation.pages.length === 0 && !isAddingPage ? (
                      <p className="text-center text-gray-500 py-4">This presentation has no pages yet. Click "+ Add Page" to create one.</p>
                  ) : presentation.pages.length > 0 ? (
                      <table className="divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Order</th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">Title</th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Type</th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">Config Preview</th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {presentation.pages.map((page) => {
                                  const isActive = presentation.current_page_id === page.page_id;
                                  return (
                                      <tr key={page.page_id} className={`${isActive ? 'bg-blue-50' : ''}`}>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{page.page_order + 1}</td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{page.page_title || `(No Title)`}</td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                              <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{page.page_type}</span>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-500">
                                               {/* Use the helper component for formatted config */}
                                               <FormattedPageConfig config={page.page_config} type={page.page_type} />
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                                              {/* Activate Button - Enable only if presentation is active */}
                                              <button
                                                  onClick={() => handleActivatePage(page.page_id)} 
                                                  className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                                                  disabled={presentation.state !== 'active' || isUpdatingState}
                                                  title={presentation.state !== 'active' ? 'Presentation must be active to change pages' : (isUpdatingState ? 'Processing...' : (isActive ? 'Page is Active' : 'Activate Page'))}
                                              >
                                                  {isActive ? 'Active' : 'Activate'}
                                              </button>
                                              {/* Edit/Delete Buttons - Enable only if presentation is draft */}
                                              <button 
                                                  onClick={() => handleEditPage(page.page_id)}
                                                  className="text-xs text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                  disabled={presentation.state !== 'draft' || isUpdatingState}
                                                  title={presentation.state !== 'draft' ? 'Cannot edit page: Presentation is not in draft state' : 'Edit Page'}
                                              >
                                                  Edit
                                              </button>
                                              <button 
                                                  onClick={() => handleDeletePage(page.page_id)}
                                                  className="text-xs text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                  disabled={presentation.state !== 'draft' || isUpdatingState}
                                                  title={presentation.state !== 'draft' ? 'Cannot delete page: Presentation is not in draft state' : 'Delete Page'}
                                              >
                                                  Delete
                                              </button>
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  ) : null} 
               </div>
            </div>
          </div>
        </div>
        
        {/* Render Edit Page Modal */}
        <EditPageModal 
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            page={editingPage}
            onSubmit={handleUpdatePage}
            isLoading={isUpdatingState}
        />
      </main>
    </div>
  );
};

export default PresentationManagePage; 