import React, { useState } from 'react';
import { Page, ScalesConfig } from '@presentx/shared';
import { usePresentationStore } from '@/store/presentationStore';

interface ScalesViewerProps {
    page: Page & { page_config: ScalesConfig };
}

const ScalesViewer: React.FC<ScalesViewerProps> = ({ page }) => {
    const { scale_min, scale_max, label_min, label_max, question } = page.page_config;
    const [selectedValue, setSelectedValue] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submitResponse = usePresentationStore((state) => state.submitResponse);

    const scaleOptions = Array.from({ length: scale_max - scale_min + 1 }, (_, i) => scale_min + i);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedValue === null) {
            setError('Please select a value on the scale.');
            return;
        }
        setIsSubmitting(true);
        setError(null);

        const responseData: { value: number } = { value: selectedValue };

        try {
            await submitResponse(page.page_id, responseData);
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit response');
            setIsSubmitting(false);
        }
    };

    return (
         <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow border border-neutral-200 dark:border-neutral-700 transition-colors duration-200">
            <h2 className="text-2xl font-semibold mb-2 text-neutral-900 dark:text-white">
                {page.page_title || 'Rating Scale'}
            </h2>
            <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-6">
                {question}
            </p>

            {submitted ? (
                 <div className="text-center py-6 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-md border border-green-200 dark:border-green-800">
                    <p className="font-semibold">Thank you for your rating!</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center justify-between space-x-4">
                        {label_min && <span className="text-sm text-neutral-600 dark:text-neutral-400 flex-shrink-0">{label_min}</span>}
                        <div className="flex-grow flex justify-center items-center space-x-2 sm:space-x-3">
                            {scaleOptions.map((value) => (
                                <label 
                                    key={value} 
                                    className={`cursor-pointer flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border transition-all duration-150 
                                        ${selectedValue === value 
                                            ? 'bg-primary text-white border-primary-dark shadow-md' 
                                            : 'bg-neutral-100 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:border-primary dark:hover:border-primary-light'}
                                        `}
                                    title={`Select ${value}`}
                                    >
                                    <input
                                        type="radio"
                                        name="scaleValue"
                                        value={value}
                                        checked={selectedValue === value}
                                        onChange={() => setSelectedValue(value)}
                                        className="sr-only" // Hide actual radio button
                                        disabled={isSubmitting}
                                    />
                                    <span className="text-lg font-medium">{value}</span>
                                </label>
                            ))}
                        </div>
                        {label_max && <span className="text-sm text-neutral-600 dark:text-neutral-400 flex-shrink-0">{label_max}</span>}
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSubmitting || selectedValue === null}
                         className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400 text-center mt-2">
                            Error: {error}
                        </p>
                    )}
                </form>
            )}
        </div>
    );
};

export default ScalesViewer; 