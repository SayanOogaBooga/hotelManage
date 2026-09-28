"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

export function FetchInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Handle server/gateway errors gracefully
        if (response.status >= 500) {
          toast.error("Server error occurred. Please refresh or try again later.", {
            id: "global-server-error", // Prevents spamming the exact same toast
            duration: 5000,
          });
        }
        
        return response;
      } catch (error: any) {
        // Handle pure network errors (e.g., completely offline, DNS failure)
        toast.error("Network error. Please check your connection and refresh.", {
          id: "global-network-error",
          duration: 5000,
        });
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
