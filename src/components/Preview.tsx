// File: components/Preview.tsx

import React, { useEffect, useRef } from 'react';

interface PreviewProps {
  htmlContent: string;
}

export default function Preview({ htmlContent }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const document = iframeRef.current.contentDocument;
      if (document) {
        document.open();
        document.write(htmlContent);
        document.close();
      }
    }
  }, [htmlContent]);

  return (
    <div className="h-full border-l border-editor-border">
      <iframe
        ref={iframeRef}
        title="Preview"
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full"
      />
    </div>
  );
}
