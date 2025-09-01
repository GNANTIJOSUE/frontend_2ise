/**
 * Safely removes a child node from its parent
 * Prevents the "Failed to execute 'removeChild' on 'Node'" error
 */
export const safeRemoveChild = (parent: Node, child: Node): boolean => {
  try {
    if (parent && child && parent.contains(child)) {
      parent.removeChild(child);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Safe removeChild failed:', error);
    return false;
  }
};

/**
 * Safely removes an element by its ID
 */
export const safeRemoveElementById = (id: string) => {
  try {
    const element = document.getElementById(id);
    if (element && element.parentNode) {
      return safeRemoveChild(element.parentNode, element);
    }
    return false;
  } catch (error) {
    console.warn('Safe removeElementById failed:', error);
    return false;
  }
};

/**
 * Checks if a DOM element is still attached to the document
 */
export const isElementAttached = (element: Element | null): boolean => {
  if (!element) return false;
  return document.body.contains(element);
};

/**
 * Global error handler for removeChild errors
 * This function patches the native removeChild method to prevent errors
 */
export const patchRemoveChild = () => {
  if (typeof window !== 'undefined') {
    const originalRemoveChild = Node.prototype.removeChild;
    
    // @ts-ignore - Ignorer les erreurs de type pour le patch DOM
    Node.prototype.removeChild = function(child: Node): Node {
      try {
        if (this.contains(child)) {
          return originalRemoveChild.call(this, child);
        } else {
          console.warn('Attempted to remove child that is not a child of this node:', child);
          return child;
        }
      } catch (error) {
        console.warn('Safe removeChild fallback:', error);
        return child;
      }
    };
    
    console.log('[DOM UTILS] removeChild method patched successfully');
  }
};

/**
 * Initialize DOM error prevention
 */
export const initDOMErrorPrevention = () => {
  patchRemoveChild();
  
  // Also patch other problematic DOM methods
  if (typeof window !== 'undefined') {
    const originalInsertBefore = Node.prototype.insertBefore;
    
    // @ts-ignore - Ignorer les erreurs de type pour le patch DOM
    Node.prototype.insertBefore = function(newNode: Node, referenceNode: Node | null): Node {
      try {
        return originalInsertBefore.call(this, newNode, referenceNode);
      } catch (error) {
        console.warn('Safe insertBefore fallback:', error);
        return newNode;
      }
    };
    
    console.log('[DOM UTILS] DOM error prevention initialized');
  }
};

/**
 * Safely executes a function only if the component is still mounted
 */
export const createSafeCallback = <T extends (...args: any[]) => any>(
  callback: T,
  isMounted: () => boolean
): T => {
  return ((...args: Parameters<T>) => {
    if (isMounted()) {
      return callback(...args);
    }
  }) as T;
};

/**
 * Debounce function to prevent rapid state updates
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}; 