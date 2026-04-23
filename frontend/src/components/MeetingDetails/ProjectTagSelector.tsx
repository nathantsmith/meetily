"use client";

import { useState, useRef, useEffect } from 'react';
import { Tag, X, Plus, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ProjectTagSelectorProps {
  currentTag: string | null;
  allTags: string[];
  onTagChange: (tag: string | null) => Promise<void>;
  disabled?: boolean;
}

export function ProjectTagSelector({
  currentTag,
  allTags,
  onTagChange,
  disabled = false,
}: ProjectTagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setInputValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = allTags.filter(
    t => t.toLowerCase().includes(inputValue.toLowerCase())
  );
  const trimmed = inputValue.trim();
  const canCreate =
    trimmed.length > 0 &&
    !allTags.some(t => t.toLowerCase() === trimmed.toLowerCase());

  const select = async (tag: string | null) => {
    if (tag === currentTag) { setOpen(false); return; }
    setIsSaving(true);
    try {
      await onTagChange(tag);
    } finally {
      setIsSaving(false);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled || isSaving}
          className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border transition-colors
            disabled:opacity-50
            hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700
            data-[state=open]:border-blue-400 data-[state=open]:bg-blue-50 data-[state=open]:text-blue-700
            border-gray-200 text-gray-500 bg-white"
        >
          <Tag className="w-3 h-3 flex-shrink-0" />
          <span className="max-w-[140px] truncate">
            {isSaving ? 'Saving…' : currentTag || 'Add project'}
          </span>
          {currentTag && !isSaving && (
            <span
              role="button"
              aria-label="Remove project tag"
              onClick={(e) => { e.stopPropagation(); select(null); }}
              className="ml-0.5 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-2">
        {/* Search / create input */}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && trimmed) {
              select(trimmed);
            }
          }}
          placeholder="Search or create project…"
          className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 mb-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Existing tags */}
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filtered.length === 0 && !canCreate && (
            <p className="text-xs text-gray-400 text-center py-2">No projects yet</p>
          )}
          {filtered.map(tag => (
            <button
              key={tag}
              onClick={() => select(tag)}
              className="flex items-center gap-2 w-full text-left text-sm px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="flex-1 truncate">{tag}</span>
              {tag === currentTag && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
            </button>
          ))}
          {canCreate && (
            <button
              onClick={() => select(trimmed)}
              className="flex items-center gap-2 w-full text-left text-sm px-2.5 py-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors border-t border-gray-100 mt-1 pt-2"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Create &ldquo;{trimmed}&rdquo;</span>
            </button>
          )}
        </div>

        {/* Remove tag option */}
        {currentTag && (
          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={() => select(null)}
              className="flex items-center gap-2 w-full text-left text-xs px-2.5 py-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove project tag
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
