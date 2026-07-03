import React from 'react';
import type { FileItem } from '../../features/dashboard/dashboard.mock';
import FileListItem from './FileListItem';

export interface FileListProps {
  items: FileItem[];
  isLoading?: boolean;
  onItemClick?: (item: FileItem) => void;
  onItemActionClick?: (item: FileItem, action: string, e: React.MouseEvent) => void;
  isTrash?: boolean;
  isCommunity?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const FileList: React.FC<FileListProps> = ({
  items,
  isLoading = false,
  onItemClick,
  onItemActionClick,
  isTrash = false,
  isCommunity = false,
  emptyTitle = 'No documents yet',
  emptyDescription = 'Drag and drop files here, or use the Upload button to get started.',
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="font-body-md text-secondary select-none">Loading your files...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-xl border border-dashed border-outline-variant/60">
        <span className="material-symbols-outlined text-[48px] text-secondary/50 mb-3 select-none">
          folder_open
        </span>
        <h4 className="font-title-lg text-on-surface font-semibold select-none">{emptyTitle}</h4>
        <p className="font-body-md text-secondary mt-1 select-none">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <section>
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-surface-variant pb-2 mb-4 px-2.5 select-none">
        <div className="flex gap-4">
          <span className="font-label-md text-label-md text-secondary hover:text-on-surface cursor-pointer">
            Name
          </span>
          <span className="material-symbols-outlined text-[16px] text-secondary cursor-pointer select-none">
            arrow_downward
          </span>
        </div>
        
        <div className="hidden sm:flex gap-16 text-right">
          <span className="font-label-md text-label-md text-secondary w-32">Owner</span>
          <span className="font-label-md text-label-md text-secondary w-32">Last modified</span>
          <span className="font-label-md text-label-md text-secondary w-20">File size</span>
        </div>
      </div>

      {/* List Items */}
      <div className="space-y-1">
        {items.map((item) => (
          <FileListItem
            key={item.id}
            item={item}
            onItemClick={onItemClick}
            onActionClick={onItemActionClick}
            isTrash={isTrash}
            isCommunity={isCommunity}
          />
        ))}
      </div>
    </section>
  );
};
export default FileList;
