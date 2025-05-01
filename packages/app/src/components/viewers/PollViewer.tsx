import React, { useState } from 'react';
import { PollConfig } from '@presentx/shared';
import { usePresentationStore } from '@/store/presentationStore';

// Define props similar to MultiChoiceViewer
interface PollViewerProps {
  pageId: string;
  config: PollConfig;
  onSubmit: () => void; // Callback after successful submission
}

// Create or update PollViewer component
export const PollViewer: React.FC<PollViewerProps> = ({ pageId, config, onSubmit }) => {
  const { submitResponse, isSubmittingResponse } = usePresentationStore();
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [submittedValue, setSubmittedValue] = useState<string | null>(null); // Track submission

  const handleSelect = (option: string) => {
    if (submittedValue) return; // No changes after submit
    setSelectedValue(option);
  };

  const handleSubmit = async () => {
    if (!selectedValue || submittedValue) return;
    // Polls likely submit the same way as multi-choice (sending the chosen option)
    const success = await submitResponse(pageId, { choice: selectedValue });
    if (success) {
      setSubmittedValue(selectedValue);
      onSubmit();
    }
  };

  // Styling helpers copied/adapted from MultiChoiceViewer
  const getOptionButtonClass = (option: string): string => {
    const baseClasses = "block w-full text-left px-4 py-3 rounded border transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800";
    const normalClasses = "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600";
    const selectedClasses = "bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400 text-blue-800 dark:text-blue-100";
    const submittedClasses = "bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400 cursor-not-allowed";
    const submittedSelectedClasses = "bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-400 ring-2 ring-green-500 dark:ring-green-400 text-green-800 dark:text-green-100 cursor-not-allowed";

    if (submittedValue) {
      return `${baseClasses} ${option === submittedValue ? submittedSelectedClasses : submittedClasses}`;
    }
    if (option === selectedValue) {
      return `${baseClasses} ${selectedClasses}`;
    }
    return `${baseClasses} ${normalClasses}`;
  };

  const getSubmitButtonClass = (): string => {
      const base = "w-full py-2 px-4 rounded text-white font-semibold transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-offset-2 dark:focus:ring-offset-gray-800";
      if (submittedValue) return `${base} bg-green-600 cursor-not-allowed`; // Submitted state
      if (isSubmittingResponse) return `${base} bg-blue-400 dark:bg-blue-700 cursor-wait`; // Submitting state
      if (selectedValue) return `${base} bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:ring-blue-500`; // Ready state
      return `${base} bg-gray-400 dark:bg-gray-600 cursor-not-allowed`; // Disabled state
  };

  return (
    // Container theming
    <div className="p-6 md:p-8 rounded-lg bg-gray-50 dark:bg-gray-800 shadow-md flex flex-col h-full text-gray-900 dark:text-gray-100">
      {/* Question Theming */}
      <h2 className="text-xl md:text-2xl font-semibold mb-4">{config.question}</h2>
      
      {/* Options Container */}
      <div className="space-y-3 mb-6 flex-grow">
        {config.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option)}
            disabled={isSubmittingResponse || !!submittedValue} 
            className={getOptionButtonClass(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Submit Button Theming */}
      <button
        onClick={handleSubmit}
        disabled={!selectedValue || isSubmittingResponse || !!submittedValue}
        className={getSubmitButtonClass()}
      >
        {submittedValue ? 'Submitted' : isSubmittingResponse ? 'Submitting...' : 'Submit Poll'}
      </button>
    </div>
  );
};

// If the file didn't exist, it will be created.
// If it existed, it will be overwritten with this themed version.
export default PollViewer; // Exporting default assuming that's consistent with other viewers 