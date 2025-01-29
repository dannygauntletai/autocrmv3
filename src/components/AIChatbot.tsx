import { useCallback } from 'react';
import { useAgentMode } from '../hooks/useAgentMode';
import { MousePointer, Loader } from 'lucide-react';

interface AIChatbotProps {
  onClose: () => void;
}

const AIChatbot = ({ onClose }: AIChatbotProps) => {
  const {
    isActive: isAgentModeActive,
    isAnimating,
    isLoading,
    error,
    cursorPosition,
    currentActions,
    startAgentMode,
    stopAgentMode,
    handleActionClick
  } = useAgentMode();

  const handleMessage = useCallback(async (message: string) => {
    const normalizedMessage = message.toLowerCase().trim();
    console.log('Handling message:', normalizedMessage);
    
    if (normalizedMessage === 'start agent mode') {
      console.log('Starting agent mode...');
      await startAgentMode();
      console.log('Agent mode started, isActive:', isAgentModeActive);
      return;
    }

    if (normalizedMessage === 'stop agent mode') {
      console.log('Stopping agent mode...');
      stopAgentMode();
      console.log('Agent mode stopped');
      return;
    }

    // Handle other messages...
  }, [startAgentMode, stopAgentMode, isAgentModeActive]);

  console.log('AIChatbot render state:', {
    isAgentModeActive,
    isLoading,
    error,
    actionsCount: currentActions.length
  });

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>

      {/* Chat messages would go here */}
      <div className="p-4 h-96 overflow-y-auto">
        {/* Messages content */}
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-gray-200">
        <input
          type="text"
          placeholder="Type 'start agent mode' to begin..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              console.log('Enter pressed with value:', e.currentTarget.value);
              handleMessage(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      {/* Agent Mode UI */}
      {isAgentModeActive && (
        <>
          {/* Cursor */}
          <div
            className="fixed w-6 h-6 pointer-events-none z-50 transition-transform duration-100"
            style={{
              transform: `translate(${cursorPosition.x - 12}px, ${cursorPosition.y - 12}px)`,
              opacity: isAnimating ? 1 : 0.7
            }}
          >
            <MousePointer className="w-full h-full text-blue-500" />
          </div>

          {/* Action Suggestions */}
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-40">
            {isLoading ? (
              <div className="px-3 py-1.5 bg-white rounded-full shadow-lg border border-gray-200">
                <Loader className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            ) : error ? (
              <div className="px-3 py-1.5 bg-white rounded-full shadow-lg border border-red-200 text-red-500 text-sm">
                {error}
              </div>
            ) : (
              currentActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  className="px-3 py-1.5 bg-white rounded-full shadow-lg border border-gray-200 text-sm hover:bg-gray-50"
                  disabled={isAnimating || isLoading}
                >
                  {action.description}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatbot; 
