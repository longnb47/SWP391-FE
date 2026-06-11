import React, { useState } from 'react';
import type { FileItem } from '../../features/dashboard/dashboard.mock';
import Badge from '../common/Badge';

export interface FileListItemProps {
  item: FileItem;
  onItemClick?: (item: FileItem) => void;
  onActionClick?: (item: FileItem, action: string, e: React.MouseEvent) => void;
}

export const FileListItem: React.FC<FileListItemProps> = ({
  item,
  onItemClick,
  onActionClick,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const { name, type, fileType, icon, tags = [], owner, lastModified, size } = item;

  const handleRowClick = () => {
    if (onItemClick) onItemClick(item);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onActionClick) onActionClick(item, action, e);
  };

  // Get matching icon name and styling classes based on file type
  const getIconDetails = () => {
    if (type === 'folder') {
      return {
        name: 'folder',
        classes: 'text-secondary group-hover:text-primary transition-colors icon-fill',
      };
    }
    if (type === 'folder_shared') {
      return {
        name: 'folder_shared',
        classes: 'text-secondary group-hover:text-primary transition-colors icon-fill',
      };
    }
    
    // File types
    switch (fileType) {
      case 'image':
        return { name: icon || 'image', classes: 'text-primary/70 icon-fill' };
      case 'document':
        return { name: icon || 'description', classes: 'text-[#1b73e8] icon-fill' };
      default:
        return { name: icon || 'insert_drive_file', classes: 'text-secondary icon-fill' };
    }
  };

  const iconDetails = getIconDetails();

  return (
    <div
      onClick={handleRowClick}
      className="group flex items-center justify-between p-2.5 hover:bg-surface-container-high rounded-lg cursor-pointer transition-colors border border-transparent hover:border-outline-variant/30 relative"
    >
      {/* Title & Icons */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`material-symbols-outlined select-none text-[22px] ${iconDetails.classes}`}>
          {iconDetails.name}
        </span>
        <span className="font-body-md text-body-md text-on-surface font-medium truncate">
          {name}
        </span>
        
        {tags.length > 0 && (
          <div className="flex gap-1 ml-2 overflow-hidden flex-wrap max-h-5 hidden md:flex">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant={
                  tag === 'Urgent' ? 'error' : tag === 'Design' || tag === 'UI/UX' ? 'secondary' : 'primary'
                }
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Metadata (Hidden on Mobile) */}
      <div className="hidden sm:flex items-center gap-16 text-right select-none">
        <span className="font-body-md text-body-md text-secondary w-32 truncate">
          {owner}
        </span>
        <span className="font-body-md text-body-md text-secondary w-32 truncate">
          {lastModified}
        </span>
        <span className="font-body-md text-body-md text-secondary w-20 truncate">
          {size}
        </span>
      </div>

      {/* Row Action Controls */}
      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={handleMenuToggle}
          className="p-1 text-secondary hover:text-on-surface hover:bg-surface-container-highest rounded cursor-pointer select-none"
        >
          <span className="material-symbols-outlined text-[20px] select-none">
            more_vert
          </span>
        </button>

        {showMenu && (
          <>
            {/* Backdrop overlay to close menu */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
            {/* Action Popup */}
            <div className="absolute right-2 top-10 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1.5 w-40 z-50 animate-in fade-in zoom-in duration-100">
              <button
                onClick={(e) => handleAction('open', e)}
                className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span> Open
              </button>
              <button
                onClick={(e) => handleAction('rename', e)}
                className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span> Rename
              </button>
              <button
                onClick={(e) => handleAction('star', e)}
                className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">star</span> Star
              </button>
              <div className="border-t border-outline-variant/60 my-1" />
              <button
                onClick={(e) => handleAction('delete', e)}
                className="w-full text-left px-3 py-1.5 text-xs text-error hover:bg-error-container/30 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px] text-error">delete</span> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default FileListItem;
