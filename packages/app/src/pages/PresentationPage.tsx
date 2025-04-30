import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
// Removed socket library imports, now handled by store
import { Page, AudienceSummary, NewQuestionEvent, MultiChoiceConfig, Presentation } from '@presentx/shared';
import { usePresentationStore } from '@/store/presentationStore'; // Import the Zustand store
import MultiChoiceViewer from '@/components/viewers/MultiChoiceViewer'; // Import the specific viewer

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
const PresentationContent = React.memo(({ id, currentPage, currentSummary, audienceCount, questions }: {
    id: string;
    currentPage: Page | null;
    currentSummary: AudienceSummary | null;
    audienceCount: number;
    questions: NewQuestionEvent[];
}) => {

    const renderPageView = () => {
        if (!currentPage) {
            return <p className="text-center text-gray-500">Waiting for presentation content...</p>;
        }

        switch (currentPage.page_type) {
            case 'multi-choice':
                // Type assertion needed as TS doesn't automatically narrow based on page_type string
                return <MultiChoiceViewer page={currentPage as Page & { page_config: MultiChoiceConfig }} />;
            // TODO: Add cases for other page types (poll, word-cloud, etc.)
            // case 'word-cloud':
            //     return <WordCloudViewer page={currentPage as Page & { page_config: WordCloudConfig }} />;
            default:
                // Fallback for unknown or unhandled types
                return <GenericPageView page={currentPage} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */} 
            <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg shadow">
                <h2 className="text-xl font-bold text-gray-800">Presentation: {id}</h2>
                <span className="text-lg font-semibold text-gray-700">Audience: {audienceCount}</span>
            </div>
            
            {/* Current Page View */} 
            <div className="page-viewer-container">
               {renderPageView()} 
            </div>

            {/* Summary (Optional Display) */} 
            {currentSummary && (
                <div className="p-4 border-t border-gray-200 mt-4 bg-gray-50 rounded">
                    <h3 className="font-semibold text-gray-700 mb-2">Live Summary</h3>
                    {/* Improve summary rendering later based on type */}
                    <pre className="text-xs bg-white p-2 rounded border">{JSON.stringify(currentSummary, null, 2)}</pre>
                </div>
            )}

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
      presentationId, currentPage, currentSummary, audienceCount, questions, 
      isConnected, isJoining, error 
  } = usePresentationStore(state => ({
      presentationId: state.presentationId,
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
    <div className="container mx-auto p-4">
        {/* Error Display */} 
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
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
             <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4" role="status">
                <div className="flex items-center">
                    <svg className="animate-spin mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                            // Try reconnecting
                            const storeId = usePresentationStore.getState().presentationId;
                            if (storeId) {
                                leaveAction();
                                setTimeout(() => joinAction(storeId), 500);
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
                currentPage={currentPage} 
                currentSummary={currentSummary} 
                audienceCount={audienceCount} 
                questions={questions} 
            />
         )}
         
         {/* Placeholder while loading initial page */} 
         {isConnected && !error && presentationId === routeId && !currentPage && !isJoining && (
            <div className="bg-gray-100 p-4 rounded text-center">Waiting for presentation to start...</div>
         )}
    </div>
  );
}

export default PresentationPage; 