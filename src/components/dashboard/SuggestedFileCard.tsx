import React from 'react';
import type { SuggestedItem } from '../../features/dashboard/dashboard.mock';
import Badge from '../common/Badge';

export interface SuggestedFileCardProps {
  item: SuggestedItem;
  onAiActionClick?: (item: SuggestedItem, e: React.MouseEvent) => void;
  onClick?: (item: SuggestedItem) => void;
}

export const SuggestedFileCard: React.FC<SuggestedFileCardProps> = ({
  item,
  onAiActionClick,
  onClick,
}) => {
  const {
    name,
    type,
    icon,
    previewUrl,
    tags = [],
    statusText,
    description,
    metadata,
    avatars = [],
  } = item;

  const handleAiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAiActionClick) onAiActionClick(item, e);
  };

  const handleCardClick = () => {
    if (onClick) onClick(item);
  };

  // 1. Render Team Workspace (spans 2 columns, Bento style)
  if (type === 'workspace') {
    return (
      <div
        onClick={handleCardClick}
        className="group bg-surface rounded-xl border border-surface-variant shadow-[0px_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden cursor-pointer relative flex flex-col h-48 sm:col-span-2 lg:col-span-2"
      >
        <div className="absolute inset-0 z-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiM4ZTcxNjQiLz48L3N2Zz4=')]" />
        
        <div className="p-4 z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 bg-secondary-container/50 px-2 py-1 rounded w-fit">
              <span className="material-symbols-outlined text-[16px] text-secondary icon-fill select-none">
                {icon}
              </span>
              <span className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">
                {statusText}
              </span>
            </div>
            
            {avatars.length > 0 && (
              <div className="flex -space-x-2">
                {avatars.map((avatar, idx) => (
                  <div key={idx} className="w-6 h-6 rounded-full bg-surface border-2 border-surface overflow-hidden">
                    <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-title-lg text-title-lg font-bold text-on-surface group-hover:text-primary transition-colors truncate">
              {name}
            </h4>
            {description && (
              <p className="font-body-md text-body-md text-secondary mt-1 line-clamp-1">
                {description}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="font-mono-label text-[11px] text-secondary">
              {metadata}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Render normal file card (with either image preview or giant icon)
  return (
    <div
      onClick={handleCardClick}
      className="group bg-surface rounded-xl border border-surface-variant shadow-[0px_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden cursor-pointer relative flex flex-col h-48"
    >
      {previewUrl ? (
        // Preview image header
        <div className="h-28 bg-surface-container-low border-b border-surface-variant overflow-hidden relative">
          <img
            src={previewUrl}
            alt={name}
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
          <div className="absolute top-2 left-2 bg-surface/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono-label font-medium text-primary flex items-center gap-1 border border-outline-variant/30">
            <span className="material-symbols-outlined text-[14px] select-none">
              {icon}
            </span> 
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        </div>
      ) : (
        // Giant file icon header
        <div className="h-28 bg-surface-container-highest border-b border-surface-variant flex items-center justify-center">
          <span className="material-symbols-outlined text-display-lg text-primary/40 group-hover:text-primary/60 transition-colors icon-fill select-none">
            {icon}
          </span>
        </div>
      )}

      {/* Card Info Section */}
      <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
        <div>
          <h4 className="font-label-md text-label-md text-on-surface truncate group-hover:text-primary transition-colors">
            {name}
          </h4>
          {tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {tags.map((tag) => (
                <Badge key={tag} variant={tag === 'Urgent' ? 'error' : tag === 'Draft' ? 'secondary' : 'primary'}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="font-mono-label text-[10px] text-secondary truncate">
            {statusText}
          </span>
          <button
            onClick={handleAiClick}
            className="opacity-0 group-hover:opacity-100 p-1 text-tertiary hover:bg-tertiary-fixed/30 rounded transition-all select-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] select-none">
              smart_toy
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default SuggestedFileCard;
