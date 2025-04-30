import React, { useState } from 'react';
import { Page, OpenEndedConfig } from '@presentx/shared';
import { usePresentationStore } from '@/store/presentationStore';

interface OpenEndedViewerProps {
    page: Page & { page_config: OpenEndedConfig };
}

const OpenEndedViewer: React.FC<OpenEndedViewerProps> = ({ page }) => {
    const [responseText, setResponseText] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submitResponse = usePresentationStore((state) => state.submitResponse);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const responseData: { text: string } = { text: responseText.trim() };

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
                {page.page_title || 'Open Ended Question'}
            </h2>
            <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-6">
                {page.page_config.question}
            </p>
            
            {submitted ? (
                 <div className="text-center py-6 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-md border border-green-200 dark:border-green-800">
                    <p className="font-semibold">Thank you for your response!</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={5}
                        maxLength={page.page_config.max_length}
                        className="appearance-none block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm placeholder-neutral-400 dark:placeholder-neutral-500 dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-colors duration-200"
                        placeholder="Type your answer here..."
                        required
                        disabled={isSubmitting}
                    />
                    {page.page_config.max_length && (
                        <p className="text-xs text-right text-neutral-500 dark:text-neutral-400">
                            {responseText.length}/{page.page_config.max_length} characters
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting || !responseText.trim()}
                         className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Response'}
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

export default OpenEndedViewer; 