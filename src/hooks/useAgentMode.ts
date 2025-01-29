import { useState, useCallback, useRef, useEffect } from 'react';
import { useDOMScanner } from './useDOMScanner';

export interface AgentAction {
  id: string;
  description: string;
  x: number;
  y: number;
  elementType: string;
  confidence: number;
}

export interface AgentModeState {
  isActive: boolean;
  isAnimating: boolean;
  isLoading: boolean;
  error: string | null;
  cursorPosition: { x: number; y: number };
  currentActions: AgentAction[];
}

const easeInOutCubic = (t: number) => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const useAgentMode = () => {
  console.log('useAgentMode hook initialized');
  
  const [state, setState] = useState<AgentModeState>({
    isActive: false,
    isAnimating: false,
    isLoading: false,
    error: null,
    cursorPosition: { x: 0, y: 0 },
    currentActions: [],
  });

  const animationRef = useRef<number>();
  const { scanDOM } = useDOMScanner();

  // Cleanup on unmount or when deactivated
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const updateSuggestions = useCallback(async (forceActive = false) => {
    console.log('updateSuggestions called, isActive:', state.isActive, 'forceActive:', forceActive);
    if (!state.isActive && !forceActive) {
      console.log('Skipping update - agent mode not active');
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Scan DOM for interactive elements
      console.log('Scanning DOM for elements...');
      const elements = scanDOM();
      console.log('Found elements:', elements.length, elements);

      if (elements.length === 0) {
        throw new Error('No interactive elements found on the page');
      }

      // Send elements to edge function for analysis
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-dom-actions`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      };
      const body = JSON.stringify({ elements });

      console.log('Calling edge function with:', {
        url,
        headers,
        bodyLength: body.length,
        elementCount: elements.length,
        firstElement: elements[0]
      });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        console.error('Edge function error response:', responseText);
        throw new Error(`Failed to get suggestions: ${response.status} ${response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Edge function response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      if (!data.actions || !Array.isArray(data.actions)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      if (data.actions.length === 0) {
        console.log('No actions returned from edge function');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        currentActions: data.actions,
        error: data.actions.length === 0 ? 'No actions available' : null,
      }));
      console.log('State updated with actions:', data.actions.length);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentActions: [],
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }));
    }
  }, [scanDOM, state.isActive]);

  const startAgentMode = useCallback(async () => {
    console.log('startAgentMode called, current state:', state);
    if (state.isActive) {
      console.log('Already in agent mode, skipping activation');
      return;
    }

    try {
      console.log('Setting initial state...');
      // Set initial cursor position to center of viewport
      setState(prev => ({
        ...prev,
        isActive: true,
        error: null,
        cursorPosition: {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        }
      }));
      console.log('Agent mode activated, getting suggestions...');

      // Force the update even though state.isActive might not be updated yet
      await updateSuggestions(true);
    } catch (error) {
      console.error('Error starting agent mode:', error);
      setState(prev => ({
        ...prev,
        isActive: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }));
    }
  }, [updateSuggestions, state.isActive]);

  const stopAgentMode = useCallback(() => {
    console.log('stopAgentMode called');
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setState({
      isActive: false,
      isAnimating: false,
      isLoading: false,
      error: null,
      cursorPosition: { x: 0, y: 0 },
      currentActions: [],
    });
  }, []);

  const animateCursor = useCallback((targetX: number, targetY: number, onComplete?: () => void) => {
    if (!state.isActive || state.isAnimating) return; // Prevent animation if not active or already animating

    const startX = state.cursorPosition.x;
    const startY = state.cursorPosition.y;
    const startTime = performance.now();
    const duration = 1000; // 1 second animation

    setState(prev => ({ ...prev, isAnimating: true }));
    console.log('Starting cursor animation to:', { targetX, targetY });

    const animate = (currentTime: number) => {
      if (!state.isActive) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      const x = startX + (targetX - startX) * eased;
      const y = startY + (targetY - startY) * eased;

      setState(prev => ({
        ...prev,
        cursorPosition: { x, y },
      }));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setState(prev => ({ ...prev, isAnimating: false }));
        console.log('Cursor animation complete');
        if (onComplete) onComplete();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [state.isActive, state.isAnimating, state.cursorPosition.x, state.cursorPosition.y]);

  const handleActionClick = useCallback(async (action: AgentAction) => {
    console.log('handleActionClick called with action:', action);
    if (!state.isActive || state.isAnimating || state.isLoading) return;

    // Clear previous actions before starting new action
    setState(prev => ({ ...prev, currentActions: [] }));

    await new Promise<void>((resolve) => {
      animateCursor(action.x, action.y, async () => {
        try {
          // Simulate click after animation
          const element = document.elementFromPoint(action.x, action.y);
          console.log('Found element at coordinates:', element);
          if (element instanceof HTMLElement) {
            element.click();
            console.log('Element clicked, waiting for DOM updates...');
            
            // Create a mutation observer to detect DOM changes
            const observer = new MutationObserver((mutations, obs) => {
              // Look for significant changes that indicate page updates
              const hasSignificantChanges = mutations.some(mutation => 
                mutation.type === 'childList' && 
                (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
              );
              
              if (hasSignificantChanges) {
                console.log('Significant DOM changes detected');
                obs.disconnect();
                // Wait a bit more for any async updates to settle
                setTimeout(async () => {
                  console.log('Updating suggestions after DOM changes...');
                  await updateSuggestions();
                }, 500);
              }
            });

            // Start observing the document with the configured parameters
            observer.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true,
              characterData: true
            });

            // Set a maximum wait time for DOM changes
            setTimeout(() => {
              observer.disconnect();
              updateSuggestions();
            }, 3000);

          } else {
            throw new Error('Target element not found at coordinates');
          }
        } catch (error) {
          console.error('Error performing action:', error);
          setState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Failed to perform action',
          }));
        }
        resolve();
      });
    });
  }, [state.isActive, state.isAnimating, state.isLoading, animateCursor, updateSuggestions]);

  // Log state changes
  useEffect(() => {
    console.log('Agent mode state updated:', state);
  }, [state]);

  return {
    ...state,
    startAgentMode,
    stopAgentMode,
    animateCursor,
    handleActionClick
  };
}; 
