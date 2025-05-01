import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
// Removed socket library imports, now handled by store
import { Page, AudienceSummary, NewQuestionEvent, MultiChoiceConfig, PollConfig, OpenEndedConfig, ScalesConfig, RankingConfig, WordCloudConfig, Presentation } from '@presentx/shared';
import { usePresentationStore } from '@/store/presentationStore'; // Import the Zustand store
import { getSocket, connectSocket } from '@/lib/socket'; // <-- Import socket functions
// Use named import for MultiChoiceViewer
import { MultiChoiceViewer } from '@/components/viewers/MultiChoiceViewer'; 
// Import the new viewers
import OpenEndedViewer from '@/components/viewers/OpenEndedViewer';
import ScalesViewer from '@/components/viewers/ScalesViewer';
import RankingViewer from '@/components/viewers/RankingViewer';
import WordCloudViewer from '@/components/viewers/WordCloudViewer';
import { PollViewer } from '@/components/viewers/PollViewer'; // Import PollViewer (assuming default export)
// import QnaViewer from '@/components/viewers/QnaViewer'; // Assuming Q&A might be added later

// --- Generic Page View (Placeholder/Fallback) ---
const GenericPageView = ({ page }: { page: Page }) => {
    return (
        <div className="p-4 border rounded bg-white shadow">
            <h2 className="text-xl font-semibold mb-2">{page.page_title || page.page_type}</h2>
            <p className="text-sm text-gray-600 mb-2">(Type: {page.page_type})</p>
            <pre className="text-sm bg-gray-100 p-2 rounded">Config: {JSON.stringify(page.page_config, null, 2)}</pre>
            {/* Default display or message for unhandled types */}
        </div>
    );
};

// Updated PresentationContent to display dynamic data
const PresentationContent = React.memo(({ id, title, description, currentPage, currentSummary, audienceCount, questions }: {
    id: string;
    title: string;
    description?: string;
    currentPage: Page | null;
    currentSummary: AudienceSummary | null;
    audienceCount: number;
    questions: NewQuestionEvent[];
}) => {

    const renderPageView = () => {
        if (!currentPage) {
            return <p className="text-center text-gray-500">Waiting for presentation content...</p>;
        }

        // Define onSubmit handler for viewers that need it (like MultiChoiceViewer)
        const handleViewerSubmit = () => {
            console.log(`Viewer submitted for page ${currentPage.page_id}`);
        };

        switch (currentPage.page_type) {
            case 'multi-choice':
                // MultiChoiceViewer expects separate props
                return <MultiChoiceViewer 
                           pageId={currentPage.page_id} 
                           config={currentPage.page_config as MultiChoiceConfig} 
                           onSubmit={handleViewerSubmit} 
                       />;
            case 'poll':
                return <PollViewer 
                           pageId={currentPage.page_id} 
                           config={currentPage.page_config as PollConfig} 
                           onSubmit={handleViewerSubmit} 
                       />;
            case 'open-ended':
                 // Revert to passing the whole page object
                 return <OpenEndedViewer page={currentPage as Page & { page_config: OpenEndedConfig }} />;
            case 'scales':
                 // Revert to passing the whole page object
                 return <ScalesViewer page={currentPage as Page & { page_config: ScalesConfig }} />;
            case 'ranking':
                 // Revert to passing the whole page object
                 return <RankingViewer page={currentPage as Page & { page_config: RankingConfig }} />;
             case 'word-cloud':
                 // Revert to passing the whole page object
                 return <WordCloudViewer page={currentPage as Page & { page_config: WordCloudConfig }} />;
            default:
                console.warn(`Rendering GenericPageView for unhandled page type: ${currentPage.page_type}`);
                return <GenericPageView page={currentPage} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */} 
            <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-800 p-3 rounded-lg shadow border border-gray-200 dark:border-neutral-700">
                 {/* Display title and optional description */} 
                 <div className="flex-1 overflow-hidden mr-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate" title={title}>{title}</h2> 
                     {description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={description}>{description}</p>}
                 </div>
                <span className="text-lg font-semibold text-gray-700 dark:text-neutral-300 flex-shrink-0">Audience: {audienceCount}</span>
            </div>
            
            {/* Current Page View */} 
            <div className="page-viewer-container">
               {renderPageView()} 
            </div>

            {/* Summary (Optional Display) - REMOVED FOR AUDIENCE VIEW */} 
            {/* {currentSummary && (
                <div className="p-4 border-t border-gray-200 mt-4 bg-gray-50 rounded">
                    <h3 className="font-semibold text-gray-700 mb-2">Live Summary</h3>
                    <pre className="text-xs bg-white p-2 rounded border">{JSON.stringify(currentSummary, null, 2)}</pre>
                </div>
            )} */}

            {/* Questions (Optional Display) */} 
            {questions.length > 0 && (
                 <div className="p-4 border-t border-gray-200 mt-4 bg-gray-50 rounded">
                    <h3 className="font-semibold text-gray-700 mb-2">Questions ({questions.length})</h3>
                    <ul className="space-y-1">
                        {questions.map((q, index) => (
                            <li key={index} className="text-sm text-gray-800 bg-white p-2 border rounded">
                                {q.question.text}
                            </li>
                         ))}
                    </ul>
                </div>
            )}
        </div>
    );
});

// --- Main Presentation Page Component (Refactored for Zustand) ---
function PresentationPage() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialPresentationData = location.state?.presentation as Presentation | undefined;
  const hasProcessedInitialData = useRef(false);
  const isMounted = useRef(false);

  // Use selectors for reactive state
  const { 
      presentationId, presentation, currentPage, currentSummary, audienceCount, questions, 
      isConnected, isJoining, error 
  } = usePresentationStore(state => ({
      presentationId: state.presentationId,
      presentation: state.presentation,
      currentPage: state.currentPage,
      currentSummary: state.currentSummary,
      audienceCount: state.audienceCount,
      questions: state.questions,
      isConnected: state.isConnected,
      isJoining: state.isJoining,
      error: state.error
  }));

  // Get actions separately (they don't change)
  const initializeSocketAction = usePresentationStore(state => state.initializeSocket);
  const initializeJoinDataAction = usePresentationStore(state => state.initializeFromJoinData);
  const joinAction = usePresentationStore(state => state.joinPresentation);
  const leaveAction = usePresentationStore(state => state.leaveCurrentPresentation);

  useEffect(() => {
    isMounted.current = true; // Mark as mounted

    if (!routeId) {
      console.error('No presentation ID in route');
      navigate('/');
      return;
    }

    // Initialize socket listeners if not already done
    initializeSocketAction();

    // === Joining Logic ===
    // Process initial data if available and not yet processed
    if (initialPresentationData && !hasProcessedInitialData.current) {
      // Mark as processed IMMEDIATELY
      hasProcessedInitialData.current = true; 

      // If we have initial data from JoinPage and haven't processed it yet
      console.log(`Effect: Initializing from join data for route ${routeId}...`);
      initializeJoinDataAction(initialPresentationData);
      // Crucially, immediately trigger the join action as well, which handles connection/room join
      console.log(`Effect: Triggering join action after initializing data for ${initialPresentationData._id}`);
      joinAction(initialPresentationData._id).catch(err => {
          console.error("Error initiating join sequence after init data:", err);
      });
    } else if (!initialPresentationData && routeId !== presentationId) {
       // No initial data, and the route ID doesn't match the current store ID
       // This covers direct navigation / presenter flow / or re-join if ID changed
       console.log(`Effect: No initial data or ID mismatch. Calling joinPresentation for route ${routeId}...`);
       joinAction(routeId).catch(err => {
           console.error("Error initiating join sequence (no init data):", err);
       });
    } else if (routeId === presentationId && !currentPage) {
       // Logged in correctly, but maybe waiting for page
       console.log(`Effect: Already on correct presentation ID (${routeId}), but no current page.`);
    } else if (routeId === presentationId) {
       // All good
       console.log(`Effect: Already on correct presentation ID (${routeId}) and have a page.`);
    }

    // Cleanup: Leave the presentation only if the component is unmounting
    return () => {
      // Only run leave logic if the component is truly unmounting
      if (!isMounted.current) { 
          const storeIdOnUnmount = usePresentationStore.getState().presentationId;
          if (storeIdOnUnmount === routeId) { 
              console.log(`PresentationPage cleanup (Unmount): Leaving presentation ${routeId}`);
              leaveAction(); 
          } else {
              console.log(`PresentationPage cleanup (Unmount): Store ID (${storeIdOnUnmount}) differs from route ID (${routeId}), not leaving.`);
          }
      }
      // Mark as unmounted when cleanup runs
      isMounted.current = false;
    };
  }, [routeId, navigate, presentationId, initialPresentationData, initializeSocketAction, initializeJoinDataAction, joinAction, leaveAction]);

  // --- Render Logic ---
  const isLoading = isJoining || (isConnected && !currentPage && !error);

  return (
    <div className="container mx-auto p-4 min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-200">
        {/* Error Display */} 
        {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                
                <div className="mt-4">
                    <button 
                        onClick={() => navigate('/')} 
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm hover:bg-blue-700"
                    >
                        Back to Join Page
                    </button>
                </div>
            </div>
        )}

        {/* Loading / Connecting Display */} 
        {!error && (isJoining || !isConnected) && (
             <div className="bg-blue-100 dark:bg-blue-800/30 border border-blue-400 text-blue-700 dark:text-blue-200 px-4 py-3 rounded relative mb-4" role="status">
                <div className="flex items-center">
                    <svg className="animate-spin mr-3 h-5 w-5 text-blue-700 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-medium">{isJoining ? `Joining presentation...` : 'Connecting to presentation server...'}</span>
                </div>
                <div className="mt-2 text-sm">
                    Please wait while we connect you to the server. This may take a few moments.
                </div>
                <div className="mt-4 flex justify-between">
                    <button 
                        onClick={() => {
                            // Simpler Retry: Just try connecting/joining again
                            console.log('Retry button clicked');
                            const storeState = usePresentationStore.getState();
                            const socket = getSocket(); // Get socket instance from lib
                            
                            if (!socket.connected) {
                                console.log('Retry: Socket not connected, calling connectSocket()');
                                connectSocket(); // Attempt to reconnect
                            } else if (storeState.presentationId && !storeState.isJoining) {
                                // If connected but maybe join failed/stalled
                                console.log('Retry: Socket connected, calling joinPresentation() again for', storeState.presentationId);
                                storeState.joinPresentation(storeState.presentationId).catch(err => {
                                    console.error("Error during retry join:", err);
                                });
                            } else {
                                 console.log('Retry: Socket connected and already joining or no presentationId, doing nothing.');
                            }
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                        Retry Connection
                    </button>
                    <button 
                        onClick={() => navigate('/')}
                        className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )}

        {/* Content Display */} 
         {isConnected && !error && presentationId === routeId && (
            <PresentationContent 
                id={presentationId} 
                title={presentation?.title || 'Presentation'}
                description={presentation?.description}
                currentPage={currentPage} 
                currentSummary={currentSummary} 
                audienceCount={audienceCount} 
                questions={questions} 
            />
         )}
         
         {/* Placeholder while loading initial page */} 
         {isConnected && !error && presentationId === routeId && !currentPage && !isJoining && (
            <div className="bg-gray-100 dark:bg-neutral-800 p-4 rounded text-center text-gray-700 dark:text-gray-300">Waiting for presentation to start...</div>
         )}
    </div>
  );
}

export default PresentationPage; 