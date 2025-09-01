import { useRef, useEffect } from 'react';

/**
 * Custom hook to track if a component is mounted
 * Helps prevent state updates after component unmount
 */
export const useIsMounted = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef.current;
};

/**
 * Custom hook for async operations with mounted check
 */
export const useAsyncOperation = () => {
  const isMounted = useIsMounted();

  const safeSetState = <T>(setter: (value: T) => void, value: T) => {
    if (isMounted) {
      setter(value);
    }
  };

  return { isMounted, safeSetState };
}; 