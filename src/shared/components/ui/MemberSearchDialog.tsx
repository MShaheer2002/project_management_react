import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useWorkspaceMemberOptions, type WorkspaceMemberOption } from '@features/workspace';
import { Modal } from './Modal';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 10;
const SCROLL_LOAD_THRESHOLD_PX = 48;

interface MemberSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (member: WorkspaceMemberOption) => void;
  excludeIds?: string[];
  title?: string;
  placeholder?: string;
}

/**
 * Global "search workspace members and pick one" dialog.
 * Debounced, paginated (10/page), infinite-scroll on the results list.
 */
export const MemberSearchDialog: React.FC<MemberSearchDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
  title = 'Add person',
  placeholder = 'Search people...',
}) => {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(input.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [input]);

  useEffect(() => {
    if (!isOpen) {
      setInput('');
      setQuery('');
    }
  }, [isOpen]);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useWorkspaceMemberOptions({ q: query, limit: PAGE_SIZE, sort: 'name:asc' }, { enabled: isOpen });

  const options = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const results = useMemo(() => options.filter((option) => !excludeIds.includes(option.id)), [options, excludeIds]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < SCROLL_LOAD_THRESHOLD_PX) {
      fetchNextPage();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-transparent py-2 pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary dark:border-border-dark"
        />
      </div>

      <div ref={listRef} onScroll={handleScroll} className="max-h-72 space-y-1 overflow-y-auto">
        {results.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.05]"
          >
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{option.name}</span>
            <span className="text-[11px] text-gray-400">{option.email}</span>
          </button>
        ))}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
            <Loader2 size={13} className="animate-spin" /> Searching...
          </div>
        )}

        {!isLoading && isFetching && !isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 py-2 text-[11px] text-gray-400">
            <Loader2 size={11} className="animate-spin" /> Searching...
          </div>
        )}

        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 py-2 text-[11px] text-gray-400">
            <Loader2 size={11} className="animate-spin" /> Loading more...
          </div>
        )}

        {!isLoading && !isFetching && results.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400">No matches.</p>
        )}
      </div>
    </Modal>
  );
};
