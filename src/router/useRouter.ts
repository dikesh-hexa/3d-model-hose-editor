import { useState, useEffect, useCallback } from 'react';

const getNormalizedPath = (): string => {
  if (typeof window === 'undefined') return '/';
  
  // Support hash routing fallback (e.g. #/test or #test)
  if (window.location.hash.startsWith('#/')) {
    const hashPath = window.location.hash.slice(1);
    return hashPath.replace(/\/+$/, '') || '/';
  } else if (window.location.hash.startsWith('#') && window.location.hash.length > 1) {
    const hashPath = '/' + window.location.hash.slice(1);
    return hashPath.replace(/\/+$/, '') || '/';
  }

  // Standard pathname (e.g. /test or /test/)
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return path;
};

export const useRouter = () => {
  const [currentPath, setCurrentPath] = useState<string>(getNormalizedPath);

  useEffect(() => {
    const handleRouteUpdate = () => {
      setCurrentPath(getNormalizedPath());
    };

    window.addEventListener('popstate', handleRouteUpdate);
    window.addEventListener('hashchange', handleRouteUpdate);
    return () => {
      window.removeEventListener('popstate', handleRouteUpdate);
      window.removeEventListener('hashchange', handleRouteUpdate);
    };
  }, []);

  const navigate = useCallback((path: string) => {
    const normalized = path.replace(/\/+$/, '') || '/';
    if (getNormalizedPath() !== normalized) {
      window.history.pushState({}, '', normalized);
      setCurrentPath(normalized);
    }
  }, []);

  const isTest = currentPath === '/test' || currentPath.startsWith('/test');

  return {
    currentPath,
    navigate,
    isTestRoute: isTest,
  };
};
