import React from 'react';
import { OpenEndedSummary } from '@presentx/shared';

interface OpenEndedSummaryDisplayProps {
    summary: OpenEndedSummary;
}

const OpenEndedSummaryDisplay: React.FC<OpenEndedSummaryDisplayProps> = ({ summary }) => {
    const { response_count, sample_responses } = summary;

    if (response_count === 0) {
        return <p className="text-sm text-neutral-500 dark:text-neutral-400">No responses yet.</p>;
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Total Responses: <span className="font-medium">{response_count}</span>
            </p>
            {sample_responses && sample_responses.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">Recent Samples:</h4>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                        {sample_responses.map((response, index) => (
                            <li key={index} className="text-xs italic text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-700/50 p-1.5 rounded border border-neutral-200 dark:border-neutral-600">
                                "{response}"
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default OpenEndedSummaryDisplay; 