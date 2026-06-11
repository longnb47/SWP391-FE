import React from 'react';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearchChange?: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  className = '',
  placeholder = 'Search files, folders, or ask AI...',
  onSearchChange,
  onChange,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  return (
    <div className="relative w-full focus-within:shadow-sm transition-shadow rounded-xl">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary select-none">
        search
      </span>
      <input
        type="text"
        className={`w-full h-12 pl-10 pr-4 bg-surface-container-high focus:bg-surface border border-transparent focus:border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-secondary focus:ring-2 focus:ring-primary/20 outline-none transition-all ${className}`}
        placeholder={placeholder}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
};
export default SearchInput;
