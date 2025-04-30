import React from 'react';
import { ScalesSummary, ScalesConfig } from '@presentx/shared';

interface ScalesSummaryDisplayProps {
    summary: ScalesSummary;
    config: ScalesConfig;
    totalResponses: number;
}

const ScalesSummaryDisplay: React.FC<ScalesSummaryDisplayProps> = ({ summary, config, totalResponses }) => {
    const { counts, average } = summary;
    const { scale_min, scale_max, label_min, label_max } = config;

    if (totalResponses === 0) {
        return <p className="text-sm text-neutral-500 dark:text-neutral-400">No responses yet.</p>;
    }

    const scaleOptions = Array.from({ length: scale_max - scale_min + 1 }, (_, i) => scale_min + i);

    return (
        <div className="space-y-4">
            {average !== undefined && (
                 <p className="text-center text-lg font-semibold text-neutral-700 dark:text-neutral-200">
                     Average Rating: {average.toFixed(2)}
                 </p>
            )}
            <div className="flex items-end justify-center space-x-1 sm:space-x-2 h-24">
                {scaleOptions.map((value) => {
                    const count = counts[String(value)] || 0;
                    const percentageHeight = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
                    const barHeight = Math.max(percentageHeight, 1); // Ensure min height for visibility

                    return (
                        <div key={value} className="flex flex-col items-center flex-1 h-full justify-end" title={`Value: ${value}, Count: ${count}`}>
                            <div 
                                className="w-4/5 bg-primary transition-all duration-300 ease-out rounded-t"
                                style={{ height: `${barHeight}%` }}
                            ></div>
                             <span className="text-xs mt-1 text-neutral-600 dark:text-neutral-400">{value}</span>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 px-2">
                 <span>{label_min || scale_min}</span>
                 <span>{label_max || scale_max}</span>
             </div>
        </div>
    );
};

export default ScalesSummaryDisplay; 