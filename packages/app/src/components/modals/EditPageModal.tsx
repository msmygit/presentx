import React, { useState, useEffect } from 'react';
import { Page, PageConfig, PageType } from '@presentx/shared';
import PageConfigForm from '@/components/forms/PageConfigForm';

interface EditPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: Page | null;
  onSubmit: (pageId: string, data: { page_title?: string; page_config?: PageConfig }) => void;
  isLoading: boolean;
}

const EditPageModal: React.FC<EditPageModalProps> = ({ isOpen, onClose, page, onSubmit, isLoading }) => {
  const [pageTitle, setPageTitle] = useState('');
  const [pageConfig, setPageConfig] = useState<PageConfig | undefined>(undefined);
  const [pageType, setPageType] = useState<PageType | ''>( '');

  useEffect(() => {
    if (page) {
      setPageTitle(page.page_title || '');
      setPageConfig(page.page_config);
      setPageType(page.page_type);
      console.log("EditPageModal: Initializing with page:", page);
    } else {
      // Reset when page becomes null (modal closes or no page selected)
      setPageTitle('');
      setPageConfig(undefined);
      setPageType('');
    }
  }, [page]); // Depend on the page object

  const handleConfigSubmit = (newConfig: PageConfig) => {
    if (!page) return;
    console.log("EditPageModal: handleConfigSubmit", { pageTitle, newConfig });
    // Call the onSubmit passed from the parent, providing pageId, title, and new config
    onSubmit(page.page_id, { page_title: pageTitle.trim(), page_config: newConfig });
  };

  // Handler for simple title change - separate from config form submission
  const handleTitleSave = () => {
      if (!page) return;
      console.log("EditPageModal: handleTitleSave", { pageTitle });
      // Submit only the title if config hasn't changed or isn't being edited
      onSubmit(page.page_id, { page_title: pageTitle.trim() });
  };

  if (!isOpen || !page) {
    return null; // Don't render anything if not open or no page
  }

  // Basic Modal Structure (using Tailwind for styling)
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full m-4">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Page (Type: {pageType})
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
            {/* Page Title Input - Always Editable? */}
            <div>
                 <label htmlFor="pageTitleEdit" className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Page Title (Optional):</label>
                 <div className="flex space-x-2">
                    <input
                        type="text"
                        id="pageTitleEdit"
                        value={pageTitle}
                        onChange={(e) => setPageTitle(e.target.value)}
                        placeholder={`e.g., Question ${page.page_order + 1}`}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                     {/* Maybe add a separate save button just for the title? */}
                    {/* <button onClick={handleTitleSave} disabled={isLoading} className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-50">Save Title</button> */}
                 </div>
            </div>
            
             {/* Conditionally render PageConfigForm if pageType and initialConfig exist */}
             {pageType && pageConfig !== undefined ? (
                <PageConfigForm 
                    type={pageType} 
                    onSubmit={handleConfigSubmit} // This function now calls the prop onSubmit
                    initialConfig={pageConfig} // Pass the current page's config as initial
                />
             ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading configuration...</p>
             )}
        </div>

        {/* Modal Footer (optional, actions might be within PageConfigForm) */}
        <div className="flex items-center justify-end p-4 border-t dark:border-gray-600 rounded-b space-x-2">
           {/* The Save button is inside PageConfigForm, but we need a close button */}
           {/* Add a general save button if title is the only thing changed? */}
           <button 
              onClick={handleTitleSave} // Use this to save title if config form isn't used/saved
              disabled={isLoading} 
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50"
            >
              {isLoading ? 'Saving Title...' : 'Save Title Only'}
            </button>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPageModal; 