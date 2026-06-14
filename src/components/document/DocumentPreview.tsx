import React, { useState, useEffect, useRef } from 'react';
import * as docx from 'docx-preview';

export interface DocumentPreviewProps {
  fileName: string;
  fileSize: string;
  lastModified?: string;
  previewUrl: string | null;
  downloadUrl: string | null;
  contentType: string | null;
  onDownloadClick?: () => void;
  onShareClick?: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  fileName,
  fileSize,
  lastModified = '2 hours ago',
  previewUrl,
  contentType,
  onDownloadClick,
  onShareClick,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);

  const docxContainerRef = useRef<HTMLDivElement>(null);
  const [isDocxLoading, setIsDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);

  const handleZoomIn = () => {
    if (zoomLevel < 150) setZoomLevel((prev) => prev + 10);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 70) setZoomLevel((prev) => prev - 10);
  };

  const isPdf = contentType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isImage = contentType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(fileName);
  const isDocx = contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.toLowerCase().endsWith('.docx');
  const isUnsupported = !isPdf && !isImage && !isDocx;

  useEffect(() => {
    if (isDocx && previewUrl && docxContainerRef.current) {
      const renderDocxFile = async () => {
        setIsDocxLoading(true);
        setDocxError(null);
        try {
          const response = await fetch(previewUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = '';
            await docx.renderAsync(arrayBuffer, docxContainerRef.current, undefined, {
              className: 'docx-viewer',
              inWrapper: false,
            });
          }
        } catch (err) {
          console.error('Error rendering docx:', err);
          const errorMsg = err instanceof Error ? err.message : '';
          let userMessage = errorMsg || 'Lỗi khi giải nén và hiển thị tệp tin Word.';
          if (errorMsg === 'Failed to fetch' || errorMsg.includes('fetch') || (err instanceof TypeError && err.message.includes('fetch'))) {
            userMessage = 'Failed to fetch. Nguyên nhân phổ biến: Máy chủ S3/MinIO lưu trữ tệp tin chưa được cấu hình CORS để cho phép Frontend (http://localhost:5173) gọi hàm fetch().';
          }
          setDocxError(userMessage);
        } finally {
          setIsDocxLoading(false);
        }
      };
      renderDocxFile();
    }
  }, [previewUrl, isDocx]);

  const getFileIconInfo = () => {
    if (isPdf) return { icon: 'picture_as_pdf', bg: 'bg-error-container text-error' };
    if (isImage) return { icon: 'image', bg: 'bg-primary-container text-primary' };
    if (isDocx) return { icon: 'description', bg: 'bg-info-container text-info bg-[#e8f0fe] text-[#1a73e8]' };
    return { icon: 'draft', bg: 'bg-surface-container-high text-secondary' };
  };

  const iconInfo = getFileIconInfo();

  // Determine if we should show zoom controls
  const showZoomControls = !isUnsupported && !(isPdf && previewUrl);

  const renderContent = () => {
    // 1. PDF
    if (isPdf) {
      if (previewUrl) {
        return (
          <div className="w-full h-full bg-surface-container-low">
            <iframe
              src={previewUrl}
              title={fileName}
              className="w-full h-full border-none"
            />
          </div>
        );
      }
      
      // Fallback Faux PDF Page for mock data
      return (
        <div className="flex-1 overflow-auto p-container-padding bg-surface-container-low flex justify-center custom-scrollbar">
          <div 
            className="transition-transform duration-200 origin-top h-fit py-4"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
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
      );
    }

    // 2. Images
    if (isImage) {
      return (
        <div className="flex-1 overflow-auto p-container-padding bg-surface-container-low flex justify-center items-start custom-scrollbar">
          <div 
            className="transition-transform duration-200 origin-top h-fit py-4"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            <img
              src={previewUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800'}
              alt={fileName}
              className="bg-surface max-w-3xl shadow-lg border border-outline-variant rounded object-contain"
            />
          </div>
        </div>
      );
    }

    // 3. Word DOCX
    if (isDocx) {
      return (
        <div className="flex-1 overflow-auto p-container-padding bg-surface-container-low flex justify-center items-start custom-scrollbar">
          {/* Custom style overrides for docx-preview rendering to prevent displacement */}
          <style>{`
            .docx-viewer-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 100%;
              background-color: #ffffff !important;
            }
            .docx-viewer-wrapper .docx,
            .docx-viewer-wrapper .docx-viewer,
            .docx-viewer-wrapper section {
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              padding: 40px 48px !important;
              margin: 0 auto !important;
              box-sizing: border-box !important;
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            .docx-viewer-wrapper .docx p {
              margin-bottom: 0.5em !important;
              line-height: 1.6 !important;
            }
            .docx-viewer-wrapper .docx table {
              max-width: 100% !important;
              width: 100% !important;
              table-layout: auto !important;
            }
            @media (max-width: 640px) {
              .docx-viewer-wrapper .docx,
              .docx-viewer-wrapper .docx-viewer {
                padding: 20px 24px !important;
              }
            }
          `}</style>
          <div 
            className="transition-transform duration-200 origin-top h-fit py-4 w-full max-w-3xl flex flex-col items-center"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {isDocxLoading && (
              <div className="bg-surface w-full min-h-[400px] shadow border border-outline-variant rounded p-12 flex flex-col items-center justify-center gap-3">
                <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="font-body-md text-secondary select-none">Đang tải bản xem trước Word...</span>
              </div>
            )}

            {docxError && (
              <div className="bg-surface w-full min-h-[400px] shadow border border-outline-variant rounded p-12 flex flex-col items-center justify-center text-center gap-4">
                <span className="material-symbols-outlined text-error text-[48px]">warning</span>
                <div>
                  <h3 className="font-title-lg text-on-surface mb-1 font-bold">Không thể hiển thị tài liệu</h3>
                  <p className="font-body-md text-secondary max-w-md">{docxError}</p>
                </div>
              </div>
            )}

            <div 
              ref={docxContainerRef} 
              className={`docx-viewer-wrapper bg-surface w-full shadow border border-outline-variant rounded min-h-[800px] overflow-hidden ${
                isDocxLoading || docxError ? 'hidden' : 'block'
              }`}
            />

            {!previewUrl && !isDocxLoading && !docxError && (
              <div className="bg-surface w-full min-h-[600px] shadow border border-outline-variant rounded p-12 flex flex-col gap-6 select-text">
                <header className="border-b pb-4 mb-4">
                  <h1 className="font-display-lg text-display-lg text-on-surface mb-2">{fileName}</h1>
                  <p className="font-body-lg text-secondary uppercase tracking-wider">
                    Word Document (Mock Preview)
                  </p>
                </header>
                <div className="space-y-4 font-body-md text-on-surface-variant leading-relaxed">
                  <p className="font-bold text-on-surface text-lg">1. Tổng quan tài liệu</p>
                  <p>
                    Đây là bản giả lập hiển thị cho tệp Word: <strong>{fileName}</strong> ({fileSize}).
                  </p>
                  <p className="font-bold text-on-surface text-lg">2. Nội dung chi tiết</p>
                  <p>
                    Để xem đầy đủ định dạng và chỉnh sửa, vui lòng sử dụng nút Tải xuống ở góc trên bên phải thanh công cụ.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 4. Unsupported
    return (
      <div className="flex-1 overflow-auto p-container-padding bg-surface-container-low flex items-center justify-center custom-scrollbar">
        <div className="bg-surface w-full max-w-md shadow border border-outline-variant rounded-xl p-8 flex flex-col items-center text-center gap-6 mx-4">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[36px]">draft</span>
          </div>
          <div>
            <h3 className="font-title-lg text-title-lg text-on-surface mb-2 font-bold">Xem trước không khả dụng</h3>
            <p className="font-body-md text-secondary leading-relaxed">
              Hệ thống chưa hỗ trợ xem trước trực tiếp định dạng tệp tin này trên trình duyệt. Bạn có thể tải xuống máy để mở.
            </p>
          </div>
          <div className="flex gap-4 w-full">
            <button
              onClick={onDownloadClick}
              className="flex-1 py-2.5 px-4 bg-primary text-on-primary rounded-lg font-title-sm text-title-sm hover:shadow transition-shadow cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Tải xuống tệp tin
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="flex-[6] bg-surface flex flex-col border-r border-outline-variant relative z-10 h-full overflow-hidden">
      {/* Document Toolbar */}
      <div className="h-14 border-b border-surface-container-high flex items-center justify-between px-container-padding bg-surface-bright shrink-0 select-none">
        <div className="flex items-center gap-stack-md min-w-0">
          <div className={`w-8 h-8 rounded ${iconInfo.bg} flex items-center justify-center shrink-0`}>
            <span className="material-symbols-outlined text-[20px] select-none">{iconInfo.icon}</span>
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
          {showZoomControls && (
            <>
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
            </>
          )}

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
      {renderContent()}
    </section>
  );
};

export default DocumentPreview;

