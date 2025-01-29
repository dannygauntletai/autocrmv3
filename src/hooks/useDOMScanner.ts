import { useCallback } from 'react';

interface DOMElement {
  id: string;
  description: string;
  x: number;
  y: number;
  elementType: string;
  confidence: number;
  text: string;
  role: string;
  ariaLabel: string;
  path: string;
}

export const useDOMScanner = () => {
  const scanDOM = useCallback((): DOMElement[] => {
    console.log('Starting DOM scan...');
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, [role="button"], [role="link"], [role="menuitem"], [role="tab"], .clickable, [onClick]'
    );
    console.log('Found raw elements:', interactiveElements.length);

    // Keep track of seen paths to ensure uniqueness
    const seenPaths = new Set<string>();
    let uniqueCounter = 0;

    const elements = Array.from(interactiveElements)
      .map((element): DOMElement | null => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        // Skip hidden elements
        if (
          computedStyle.display === 'none' ||
          computedStyle.visibility === 'hidden' ||
          computedStyle.opacity === '0' ||
          rect.width === 0 ||
          rect.height === 0
        ) {
          console.log('Skipping hidden element:', element);
          return null;
        }

        // Get element text content
        const text = element.textContent?.trim() || '';
        const ariaLabel = element.getAttribute('aria-label') || '';
        const role = element.getAttribute('role') || element.tagName.toLowerCase();

        // Generate description based on available information
        let description = text || ariaLabel;
        if (!description) {
          if (element instanceof HTMLInputElement) {
            description = element.placeholder || element.name || element.type;
          } else if (element instanceof HTMLSelectElement) {
            description = element.name || 'dropdown';
          }
        }

        // Skip elements without meaningful interaction info
        if (!description) {
          console.log('Skipping element without description:', element);
          return null;
        }

        // Get DOM path and ensure uniqueness
        let path = getDOMPath(element);
        if (seenPaths.has(path)) {
          path = `${path}_${++uniqueCounter}`;
        }
        seenPaths.add(path);
        
        console.log('Processing element:', { path, description, text, role });

        // Calculate absolute position (including scroll)
        const x = Math.round(rect.left + rect.width / 2 + window.scrollX);
        const y = Math.round(rect.top + rect.height / 2 + window.scrollY);

        return {
          id: path,
          description,
          x,
          y,
          elementType: element.tagName.toLowerCase(),
          confidence: 1,
          text,
          role,
          ariaLabel,
          path
        };
      })
      .filter((element): element is DOMElement => element !== null);

    console.log('Final processed elements:', elements.length);
    return elements;
  }, []);

  // Helper function to get unique DOM path
  const getDOMPath = (element: Element): string => {
    const path: string[] = [];
    let current: Element | null = element;
    
    while (current) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break; // ID is unique, no need to go further up
      } else {
        const siblings = Array.from(current.parentElement?.children || []);
        const index = siblings.indexOf(current) + 1;
        if (siblings.length > 1) {
          selector += `:nth-child(${index})`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  };

  return { scanDOM };
}; 
