import React, { useState, useEffect } from 'react';
import { Page, RankingConfig } from '@presentx/shared';
import { usePresentationStore } from '@/store/presentationStore';
// Using react-beautiful-dnd for drag and drop functionality
import { 
    DragDropContext, 
    Droppable, 
    Draggable, 
    DropResult, 
    DroppableProvided,
    DroppableStateSnapshot,
    DraggableProvided,
    DraggableStateSnapshot 
} from 'react-beautiful-dnd';

interface RankingViewerProps {
    page: Page & { page_config: RankingConfig };
}

const RankingViewer: React.FC<RankingViewerProps> = ({ page }) => {
    const { items, question } = page.page_config;
    // Initialize state with the original item order
    const [rankedItems, setRankedItems] = useState<string[]>(items);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submitResponse = usePresentationStore((state) => state.submitResponse);

    // Handle drag and drop end event
    const onDragEnd = (result: DropResult) => {
        // Dropped outside the list
        if (!result.destination) {
            return;
        }

        const newItems = Array.from(rankedItems);
        const [reorderedItem] = newItems.splice(result.source.index, 1);
        newItems.splice(result.destination.index, 0, reorderedItem);

        setRankedItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Response data is the array of items in their current ranked order
        const responseData: { ranking: string[] } = { ranking: rankedItems };

        try {
            await submitResponse(page.page_id, responseData);
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit response');
            setIsSubmitting(false);
        }
    };

    // Style for draggable items
    const getItemStyle = (isDragging: boolean, draggableStyle: any) => ({
        // Some basic styles to make the items look draggable
        userSelect: 'none',
        padding: '12px 16px',
        margin: '0 0 8px 0',
        borderRadius: '6px',
        background: isDragging ? '#e2e8f0' : '#f8fafc', // Tailwind bg-slate-200 / bg-slate-50
        color: '#1e293b', // Tailwind text-slate-800
        border: '1px solid #cbd5e1', // Tailwind border-slate-300
        // Dark mode styles
        ...{
          '@media (prefers-color-scheme: dark)': {
            background: isDragging ? '#475569' : '#334155', // Tailwind dark:bg-slate-600 / dark:bg-slate-700
            color: '#f1f5f9', // Tailwind dark:text-slate-100
            border: '1px solid #475569', // Tailwind dark:border-slate-600
          }
        },
        // Combine styles
        ...draggableStyle,
    });

    const getListStyle = (isDraggingOver: boolean) => ({
        background: isDraggingOver ? '#f1f5f9' : '#ffffff', // Tailwind bg-slate-100 / bg-white
        padding: 8,
        borderRadius: '8px',
        border: '1px dashed #94a3b8', // Tailwind border-slate-400
        // Dark mode styles
        ...{
          '@media (prefers-color-scheme: dark)': {
            background: isDraggingOver ? '#1e293b' : '#1a202c', // Tailwind dark:bg-slate-800 / dark:bg-gray-900 (adjust as needed)
            border: '1px dashed #64748b', // Tailwind dark:border-slate-500
          }
        },
    });

    return (
         <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow border border-neutral-200 dark:border-neutral-700 transition-colors duration-200">
            <h2 className="text-2xl font-semibold mb-2 text-neutral-900 dark:text-white">
                {page.page_title || 'Rank the Items'}
            </h2>
            <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-4">
                {question}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                Drag and drop the items below into your preferred order (top is highest rank).
            </p>

            {submitted ? (
                 <div className="text-center py-6 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-md border border-green-200 dark:border-green-800">
                    <p className="font-semibold">Thank you for submitting your ranking!</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="droppableRankingItems">
                            {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    style={getListStyle(snapshot.isDraggingOver)}
                                    className="dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600" // Add base dark mode styles here
                                >
                                    {rankedItems.map((item, index) => (
                                        <Draggable key={item} draggableId={item} index={index}>
                                            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                     style={{
                                                        ...getItemStyle(
                                                          snapshot.isDragging,
                                                          provided.draggableProps.style
                                                        ),
                                                        // Explicitly apply dark mode styles inline for now
                                                         ...(document.documentElement.classList.contains('dark') && {
                                                            background: snapshot.isDragging ? '#475569' : '#334155',
                                                            color: '#f1f5f9',
                                                            border: '1px solid #475569'
                                                        })
                                                    }}
                                                    className="flex items-center justify-between" // Added flex for rank number
                                                >
                                                    <span className="font-medium">{index + 1}.</span> {/* Rank Number */}
                                                    <span className="ml-4 flex-grow">{item}</span> {/* Item Text */}
                                                    <span className="text-neutral-400 dark:text-neutral-500">☰</span> {/* Drag Handle Icon */}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Ranking'}
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

export default RankingViewer; 