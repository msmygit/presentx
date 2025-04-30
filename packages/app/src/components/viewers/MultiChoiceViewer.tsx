import React, { useState } from 'react';
import { Page, MultiChoiceConfig } from '@presentx/shared';
import { usePresentationStore } from '@/store/presentationStore'; // Import store to call submit action

interface MultiChoiceViewerProps {
    page: Page & { page_config: MultiChoiceConfig }; // Ensure config is MultiChoice
    // onSubmitResponse: (response: any) => void; // Add later for interaction
}

const MultiChoiceViewer: React.FC<MultiChoiceViewerProps> = ({ page }) => {
    const { question, options } = page.page_config;
    const [selectedValue, setSelectedValue] = useState<string | null>(null);
    const [submittedValue, setSubmittedValue] = useState<string | null>(null);

    // Get actions and state from store
    const submitResponse = usePresentationStore(state => state.submitResponse);
    const isSubmitting = usePresentationStore(state => state.isSubmittingResponse);
    const currentError = usePresentationStore(state => state.error);
    const clearError = usePresentationStore(state => state._setError); // Use internal setter to clear error

    const handleSelect = (option: string) => {
        if (submittedValue) return; // Don't allow change after submission
        setSelectedValue(option);
        if (currentError) {
            clearError(null); // Clear error message on new selection
        }
    };

    const handleSubmit = async () => {
        if (!selectedValue || isSubmitting || submittedValue) return;

        const success = await submitResponse(page.page_id, selectedValue);
        if (success) {
            setSubmittedValue(selectedValue); // Lock selection on success
            // Optional: Show success feedback
        } else {
             // Error is handled globally in the store, displayed on PresentationPage
             // Optional: Re-enable button after a delay?
        }
    };

    // Determine button styling based on state
    const getButtonClass = (option: string) => {
        const baseClass = "w-full text-left p-3 border rounded transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50";
        if (submittedValue) {
            // After submission
            return `${baseClass} ${option === submittedValue ? 'bg-blue-200 border-blue-400' : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'}`;
        } else if (selectedValue === option) {
            // Selected but not submitted
            return `${baseClass} bg-blue-100 border-blue-300 ring-2 ring-blue-400`;
        } else {
            // Default / Not selected
            return `${baseClass} border-gray-300 hover:bg-gray-100 focus:ring-blue-400`;
        }
    };

    return (
        <div className="p-6 border rounded bg-white shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">{page.page_title || 'Multiple Choice'}</h2>
            <p className="text-lg mb-6 text-gray-700">{question}</p>
            <div className="space-y-3 mb-6">
                {options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleSelect(option)}
                        disabled={isSubmitting || !!submittedValue}
                        className={getButtonClass(option)}
                    >
                        {option}
                    </button>
                ))}
            </div>
            <button
                 onClick={handleSubmit}
                 disabled={!selectedValue || isSubmitting || !!submittedValue}
                 className={`w-full py-2 px-4 rounded text-white font-semibold transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50 ${submittedValue ? 'bg-gray-400 cursor-not-allowed' : isSubmitting ? 'bg-blue-400 cursor-wait' : selectedValue ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-gray-400 cursor-not-allowed'}`}
            >
                {submittedValue ? 'Submitted' : isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
        </div>
    );
};

export default MultiChoiceViewer; 