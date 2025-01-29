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
    
    // Enhanced selector to include icon elements and their containers
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, [role="button"], [role="link"], [role="menuitem"], [role="tab"], .clickable, [onClick], svg, img, [class*="icon"], [class*="Icon"]'
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

        // Get element text content and attributes
        const text = element.textContent?.trim() || '';
        const ariaLabel = element.getAttribute('aria-label') || '';
        const title = element.getAttribute('title') || '';
        const role = element.getAttribute('role') || element.tagName.toLowerCase();
        const dataTestId = element.getAttribute('data-testid') || '';

        // Check for icon-specific classes
        const classList = Array.from(element.classList);
        const isIcon = classList.some(cls => 
          cls.toLowerCase().includes('icon') || 
          cls.toLowerCase().includes('sparkle') ||
          cls.toLowerCase().includes('lucide')
        );

        // Get parent button or interactive container if this is an icon
        let contextElement = element;
        if (isIcon && element.parentElement && (
          element.parentElement.tagName === 'BUTTON' || 
          element.parentElement.getAttribute('role') === 'button' ||
          element.parentElement.onclick
        )) {
          contextElement = element.parentElement;
        }

        // Generate description based on available information
        let description = text || ariaLabel || title;
        
        // If no direct description, try to infer from context
        if (!description) {
          // Check for icon context
          if (isIcon) {
            const parentText = contextElement.textContent?.trim() || '';
            const parentAriaLabel = contextElement.getAttribute('aria-label') || '';
            const parentTitle = contextElement.getAttribute('title') || '';
            description = parentAriaLabel || parentTitle || parentText;
            
            // Try to infer meaning from classes and test IDs
            if (!description) {
              const iconClasses = classList.filter(cls => 
                cls.toLowerCase().includes('icon') || 
                cls.toLowerCase().includes('btn') || 
                cls.toLowerCase().includes('button')
              );
              if (iconClasses.length > 0) {
                description = iconClasses
                  .map(cls => cls.replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`))
                  .map(cls => cls.replace(/(icon|btn|button)/gi, ''))
                  .join(' ')
                  .trim();
              }
              if (!description && dataTestId) {
                description = dataTestId.replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`);
              }
            }

            // Add "button" context if it's a clickable icon
            if (description && contextElement.tagName === 'BUTTON') {
              description += ' button';
            }
          }
          
          // Handle form elements
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
        let path = getDOMPath(contextElement);
        if (seenPaths.has(path)) {
          path = `${path}_${++uniqueCounter}`;
        }
        seenPaths.add(path);
        
        console.log('Processing element:', { path, description, text, role, isIcon });

        // Calculate absolute position (including scroll)
        const contextRect = contextElement.getBoundingClientRect();
        const x = Math.round(contextRect.left + contextRect.width / 2 + window.scrollX);
        const y = Math.round(contextRect.top + contextRect.height / 2 + window.scrollY);

        return {
          id: path,
          description,
          x,
          y,
          elementType: contextElement.tagName.toLowerCase(),
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
