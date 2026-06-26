import React, { useState } from 'react';
import type { FileItem } from '../../features/dashboard/dashboard.mock';
import Badge from '../common/Badge';
import { getFileIconDetails } from '../../lib/fileHelpers';

export interface FileListItemProps {
  item: FileItem;
  onItemClick?: (item: FileItem) => void;
  onActionClick?: (item: FileItem, action: string, e: React.MouseEvent) => void;
  isTrash?: boolean;
  isCommunity?: boolean;
}

export const FileListItem: React.FC<FileListItemProps> = ({
  item,
  onItemClick,
  onActionClick,
  isTrash = false,
  isCommunity = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const { name, type, tags = [], owner, lastModified, size, isPublic, tagDetails = [] } = item;

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

  const iconDetails = getFileIconDetails(name, type);
  const maxVisibleTags = 2;
  const visibleTags = tags.slice(0, maxVisibleTags);
  const extraTagsCount = tags.length - maxVisibleTags;

  const formatColorStyle = (colorCode: string) => {
    const cleanColor = colorCode.startsWith('#') ? colorCode : `#${colorCode}`;
    return {
      backgroundColor: `${cleanColor}15`, // ~8% opacity
      color: cleanColor,
      borderColor: `${cleanColor}30`, // ~18% opacity
    };
  };

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

        {/* Visibility indicator */}
        {type === 'file' && (
          <span 
            className="material-symbols-outlined text-[15px] text-secondary select-none shrink-0"
            title={isPublic ? 'Public Document' : 'Private Document'}
          >
            {isPublic ? 'public' : 'lock'}
          </span>
        )}
        
        {tags.length > 0 && (
          <div className="flex gap-1 ml-2 overflow-hidden flex-wrap max-h-5 hidden md:flex items-center">
            {visibleTags.map((tag) => {
              const details = tagDetails.find((t) => t.name.trim().toLowerCase() === tag.trim().toLowerCase());
              if (details && details.color) {
                const colorStyle = formatColorStyle(details.color);
                return (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-medium border select-none w-fit inline-flex items-center transition-colors"
                    style={colorStyle}
                  >
                    {tag}
                  </span>
                );
              }
              return (
                <Badge
                  key={tag}
                  variant={
                    tag === 'Urgent' ? 'error' : tag === 'Design' || tag === 'UI/UX' ? 'secondary' : 'primary'
                  }
                >
                  {tag}
                </Badge>
              );
            })}
            {extraTagsCount > 0 && (
              <Badge variant="secondary">
                +{extraTagsCount}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Metadata (Hidden on Mobile) */}
      <div className="hidden sm:flex items-center gap-16 text-right select-none">
        <span 
          className="font-body-md text-body-md text-secondary w-32 truncate"
          title={owner}
        >
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
        {/* Star Icon Button (Inline Toggle) */}
        {!isTrash && !isCommunity && (
          <button
            onClick={(e) => handleAction('toggle_star', e)}
            className={`p-1.5 rounded cursor-pointer transition-all duration-150 select-none ${
              item.isStarred
                ? 'text-[#f59e0b]'
                : 'text-secondary opacity-0 group-hover:opacity-100 hover:text-on-surface hover:bg-surface-container-highest'
            }`}
            title={item.isStarred ? 'Unstar' : 'Star'}
          >
            <span className={`material-symbols-outlined text-[18px] ${item.isStarred ? 'icon-fill' : ''}`}>
              star
            </span>
          </button>
        )}

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
            <div className="absolute right-2 top-10 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1.5 w-44 z-50 animate-in fade-in zoom-in duration-100">
              {isTrash ? (
                <>
                  <button
                    onClick={(e) => handleAction('restore', e)}
                    className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">restore</span> Restore
                  </button>
                  <button
                    onClick={(e) => handleAction('delete_permanent', e)}
                    className="w-full text-left px-3 py-1.5 text-xs text-error hover:bg-error-container/30 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px] text-error">delete_forever</span> Delete Permanently
                  </button>
                </>
              ) : isCommunity ? (
                <>
                  <button
                    onClick={(e) => handleAction('open', e)}
                    className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span> Open
                  </button>
                </>
              ) : (
                <>
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
                  
                  {type === 'file' && (
                    <>
                      <button
                        onClick={(e) => handleAction('share', e)}
                        className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">share</span> Share...
                      </button>
                      <button
                        onClick={(e) => handleAction('toggle_star', e)}
                        className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">star</span>
                        {item.isStarred ? 'Unstar' : 'Star'}
                      </button>
                      <button
                        onClick={(e) => handleAction('move_to', e)}
                        className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">drive_file_move</span> Move to Folder...
                      </button>
                      {item.folderId !== null && item.folderId !== undefined && (
                        <button
                          onClick={(e) => handleAction('move_out', e)}
                          className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">logout</span> Move out of Folder
                        </button>
                      )}
                      
                      <div className="border-t border-outline-variant/60 my-1" />
                      <div className="px-3 py-1 text-[10px] font-bold text-secondary uppercase tracking-wider select-none flex items-center gap-1">
                        <span>Visibility:</span>
                        <span className="text-on-surface">{isPublic ? 'Public 🌐' : 'Private 🔒'}</span>
                      </div>
                      <button
                        onClick={(e) => handleAction('toggle_visibility', e)}
                        className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isPublic ? 'lock' : 'public'}
                        </span>
                        {isPublic ? 'Make Private' : 'Make Public'}
                      </button>
                    </>
                  )}

                  {type === 'folder' && (
                    <button
                      onClick={(e) => handleAction('toggle_star', e)}
                      className="w-full text-left px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      {item.isStarred ? 'Unstar' : 'Star'}
                    </button>
                  )}

                  <div className="border-t border-outline-variant/60 my-1" />
                  <button
                    onClick={(e) => handleAction('delete', e)}
                    className="w-full text-left px-3 py-1.5 text-xs text-error hover:bg-error-container/30 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px] text-error">delete</span> Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default FileListItem;
