import React from 'react';
import type { StorageUsage } from '../../features/dashboard/dashboard.mock';

export interface StorageUsageCardProps {
  storage?: StorageUsage;
}

export const StorageUsageCard: React.FC<StorageUsageCardProps> = ({ storage }) => {
  if (!storage) return null;

  const { usedPercentage, formattedUsed, formattedTotal } = storage;

  return (
    <div className="px-4 py-3 mb-2 bg-surface-container-highest/30 rounded-lg border border-outline-variant/50">
      <div className="flex justify-between items-center font-label-md text-label-md text-on-surface-variant mb-2">
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] select-none">cloud_queue</span> 
          Storage
        </span>
        <span className="font-mono-label text-mono-label text-on-surface-variant">
          {usedPercentage}% used
        </span>
      </div>
      <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-500" 
          style={{ width: `${usedPercentage}%` }}
        />
      </div>
      <p className="text-[10px] text-secondary mt-2">{formattedUsed} / {formattedTotal} total</p>
    </div>
  );
};
export default StorageUsageCard;
