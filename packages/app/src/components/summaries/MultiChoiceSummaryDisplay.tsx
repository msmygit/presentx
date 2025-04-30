import React from 'react';
import { MultiChoiceSummary } from '@presentx/shared';

interface MultiChoiceSummaryDisplayProps {
    summary: MultiChoiceSummary;
    totalResponses: number;
}

const MultiChoiceSummaryDisplay: React.FC<MultiChoiceSummaryDisplayProps> = ({ summary, totalResponses }) => {
    if (totalResponses === 0) {
        return <p className="text-sm text-neutral-500 dark:text-neutral-400">No responses yet.</p>;
    }

    const sortedOptions = Object.entries(summary)
        .sort(([, countA], [, countB]) => countB - countA); // Sort descending by count

    return (
        <div className="space-y-2">
            {sortedOptions.map(([option, count]) => {
                const percentage = totalResponses > 0 ? ((count / totalResponses) * 100).toFixed(1) : 0;
                return (
                    <div key={option} className="flex items-center justify-between text-sm">
                        <span className="flex-1 truncate mr-2 text-neutral-700 dark:text-neutral-200">{option}</span>
                        <div className="w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5 relative overflow-hidden">
                            <div 
                                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                        <span className="ml-2 w-16 text-right font-medium text-neutral-600 dark:text-neutral-300">
                            {count} ({percentage}%)
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default MultiChoiceSummaryDisplay; 