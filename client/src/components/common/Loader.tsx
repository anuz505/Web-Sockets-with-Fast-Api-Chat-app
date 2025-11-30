import React, { useEffect, memo } from "react";
import Navbar from "./Navbar";
import type LoaderProps from "../../types/utils-types";
const Loader: React.FC<LoaderProps> = memo(({ text = "" }) => {
  useEffect(() => {
    // Store original values for cleanup
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalDocumentOverflow = document.documentElement.style.overflow;
    const originalDocumentHeight = document.documentElement.style.height;

    // Prevent scrolling when loader is mounted
    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.height = "100%";

    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.overflow = originalDocumentOverflow;
      document.documentElement.style.height = originalDocumentHeight;
    };
  }, []);

  return (
    <>
      <Navbar></Navbar>
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999] px-4 overflow-hidden">
        {/* CSS spinner */}
        <div className="css-spinner"></div>
        <p className="mt-4 text-gray-600 text-lg">Loading {text}...</p>

        <style>{`
        .css-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #000000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </>
  );
});

Loader.displayName = "Loader";

export default Loader;
