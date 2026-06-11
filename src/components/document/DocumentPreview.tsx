import React, { useState } from 'react';

export interface DocumentPreviewProps {
  fileName: string;
  fileSize: string;
  lastModified?: string;
  onDownloadClick?: () => void;
  onShareClick?: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  fileName,
  fileSize,
  lastModified = '2 hours ago',
  onDownloadClick,
  onShareClick,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = () => {
    if (zoomLevel < 150) setZoomLevel((prev) => prev + 10);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 70) setZoomLevel((prev) => prev - 10);
  };

  return (
    <section className="flex-[6] bg-surface flex flex-col border-r border-outline-variant relative z-10 h-full overflow-hidden">
      {/* Document Toolbar */}
      <div className="h-14 border-b border-surface-container-high flex items-center justify-between px-container-padding bg-surface-bright shrink-0 select-none">
        <div className="flex items-center gap-stack-md min-w-0">
          <div className="w-8 h-8 rounded bg-error-container text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px] select-none">picture_as_pdf</span>
          </div>
          <div className="min-w-0">
            <h2 className="font-title-lg text-title-lg text-on-surface line-clamp-1 truncate" title={fileName}>
              {fileName}
            </h2>
            <p className="font-mono-label text-mono-label text-secondary truncate">
              Updated {lastModified} • {fileSize === '--' ? 'Folder' : fileSize}
            </p>
          </div>
        </div>

        {/* Toolbar Zoom & File Actions */}
        <div className="flex items-center gap-2 select-none shrink-0">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-secondary hover:bg-surface-container rounded transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-[20px]">zoom_out</span>
          </button>
          <span className="font-mono-label text-mono-label text-secondary px-1 w-12 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-secondary hover:bg-surface-container rounded transition-colors cursor-pointer"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-[20px]">zoom_in</span>
          </button>
          
          <div className="w-px h-4 bg-outline-variant mx-2" />
          
          <button
            onClick={onDownloadClick}
            className="p-1.5 text-secondary hover:bg-surface-container rounded transition-colors cursor-pointer"
            title="Download Document"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
          </button>
          <button
            onClick={onShareClick}
            className="p-1.5 text-secondary hover:bg-surface-container rounded transition-colors cursor-pointer"
            title="Share Document"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        </div>
      </div>

      {/* Document Viewer Area */}
      <div className="flex-1 overflow-auto p-container-padding bg-surface-container-low flex justify-center custom-scrollbar">
        {/* Dynamic Zooming Canvas Wrapper */}
        <div 
          className="transition-transform duration-200 origin-top h-fit py-4"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {/* Faux PDF Page */}
          <div className="bg-surface w-full max-w-3xl min-h-[1056px] shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant rounded p-12 flex flex-col gap-8 select-text">
            <header className="border-b-2 border-primary pb-4 mb-4">
              <h1 className="font-display-lg text-display-lg text-on-surface mb-2">Q3 Strategic Outlook</h1>
              <p className="font-body-lg text-body-lg text-secondary uppercase tracking-wider">
                Confidential - Internal Distribution Only
              </p>
            </header>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-title-lg text-title-lg text-on-surface mb-2 font-bold">1. Executive Summary</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed text-justify">
                  The third quarter has presented significant opportunities for expansion in the enterprise sector. 
                  Despite macroeconomic headwinds, our core SaaS products have seen a 14% year-over-year growth. 
                  This document outlines the strategic pivot towards AI-integrated workflows to capitalize on emerging market demands. 
                  We anticipate this shift will require a reallocation of 20% of the R&D budget by Q4.
                </p>
              </div>

              {/* Hover Highlight Objective Section */}
              <div className="p-6 bg-surface-container rounded-lg border border-surface-container-high relative group transition-all duration-300">
                <div className="absolute -left-3 top-6 w-1 h-12 bg-primary rounded-full hidden group-hover:block transition-all animate-fade-in" />
                <h3 className="font-title-lg text-title-lg text-on-surface mb-2 font-bold">2. Key Objectives</h3>
                <ul className="list-disc pl-5 font-body-md text-body-md text-on-surface-variant space-y-2">
                  <li>Accelerate deployment of machine learning modules within the Aether platform.</li>
                  <li>Expand the sales task force in the EMEA region by 15 personnel.</li>
                  <li>Reduce customer churn by 2% through proactive engagement initiatives.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-title-lg text-title-lg text-on-surface mb-2 font-bold">3. Financial Projections</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-4 text-justify">
                  Revenue targets for Q3 are set aggressively at $42M, representing a strong quarter-over-quarter growth trajectory. 
                  Margin expansion remains a priority, driven by operational efficiencies in cloud infrastructure.
                </p>
                
                {/* Financial chart placeholder */}
                <div className="w-full h-48 bg-surface-container-high rounded flex items-center justify-center border border-outline-variant border-dashed select-none">
                  <span className="font-mono-label text-mono-label text-secondary">
                    [ Financial Chart Graphic ]
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default DocumentPreview;
