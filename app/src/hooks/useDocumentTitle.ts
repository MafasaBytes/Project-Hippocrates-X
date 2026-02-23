import { useEffect } from "react";

const APP_TITLE = "Hippocrates X";

/**
 * Set document title for the current page. Resets to app title on unmount.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${APP_TITLE}` : APP_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
