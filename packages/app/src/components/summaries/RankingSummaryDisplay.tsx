import React from 'react';
import { RankingSummary, RankingConfig } from '@presentx/shared';

interface RankingSummaryDisplayProps {
    summary: RankingSummary;
    config: RankingConfig;
    totalResponses: number;
}

const RankingSummaryDisplay: React.FC<RankingSummaryDisplayProps> = ({ summary, config, totalResponses }) => {
    const { item_average_ranks } = summary;
    const { items } = config;

    if (totalResponses === 0 || !item_average_ranks) {
        return <p className="text-sm text-neutral-500 dark:text-neutral-400">No responses yet or summary data unavailable.</p>;
    }

    // Sort items based on their average rank (lower is better)
    const sortedItems = items
        .map(item => ({
            name: item,
            avgRank: item_average_ranks[item] !== undefined ? item_average_ranks[item] : Infinity, // Handle missing rank
        }))
        .sort((a, b) => a.avgRank - b.avgRank);

    return (
        <div className="space-y-3">
             <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                Average Ranking (lower is better): based on {totalResponses} response(s).
            </p>
            <ol className="list-decimal list-inside space-y-1.5">
                {sortedItems.map((item, index) => (
                    <li key={item.name} className="text-sm text-neutral-800 dark:text-neutral-100 flex justify-between items-center bg-neutral-50 dark:bg-neutral-700/50 p-2 rounded border border-neutral-200 dark:border-neutral-600">
                       <span>{item.name}</span> 
                       <span className="font-mono text-xs bg-neutral-200 dark:bg-neutral-600 px-1.5 py-0.5 rounded">
                           Avg: {item.avgRank === Infinity ? 'N/A' : item.avgRank.toFixed(2)}
                       </span>
                    </li>
                ))}
            </ol>
            {/* TODO: Display most_common_rankings if needed */} 
        </div>
    );
};

export default RankingSummaryDisplay; 