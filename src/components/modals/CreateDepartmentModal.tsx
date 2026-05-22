import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useCreateDepartment } from '@features/department';
import { useWorkspaceMemberOptions } from '@features/workspace';
import { getApiErrorCode, getApiErrorMessage, getApiFieldErrors } from '@shared/services';
import { Modal } from './Modal';

const DEPARTMENT_COLORS = ['#5f72ea', '#0f766e', '#ea5f5f', '#ea9b5f', '#5fea7b', '#1f2937'];
const RECENT_SELECTION_LIMIT = 3;
const RECENT_STORAGE_KEYS = {
  head: 'linearis:create-department:recent-heads',
  member: 'linearis:create-department:recent-members',
} as const;

type PickerKey = keyof typeof RECENT_STORAGE_KEYS;
type RecentMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const pickerButtonClassName =
  'w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-left transition-all hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]';

const readRecentItems = <T extends { id: string }>(key: PickerKey): T[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEYS[key]);
    const parsed = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is T => Boolean(item) && typeof item.id === 'string')
      .slice(0, RECENT_SELECTION_LIMIT);
  } catch {
    return [];
  }
};

const writeRecentItems = <T extends { id: string }>(key: PickerKey, items: T[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    RECENT_STORAGE_KEYS[key],
    JSON.stringify(items.slice(0, RECENT_SELECTION_LIMIT))
  );
};

const rememberRecentItem = <T extends { id: string }>(items: T[], item: T) =>
  [item, ...items.filter((current) => current.id !== item.id)].slice(0, RECENT_SELECTION_LIMIT);

const renderFieldError = (errors: Record<string, string[]>, field: string) =>
  errors[field]?.[0] ? <p className="mt-1 text-xs text-red-500">{errors[field][0]}</p> : null;

export const CreateDepartmentModal: React.FC = () => {
  const { activeModal, setActiveModal, showToast } = useApp();
  const createDepartment = useCreateDepartment();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [headId, setHeadId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState(DEPARTMENT_COLORS[0]);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isDefault, setIsDefault] = useState(false);
  const [headSearch, setHeadSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [openPicker, setOpenPicker] = useState<PickerKey | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [recentHeads, setRecentHeads] = useState<RecentMember[]>(() => readRecentItems<RecentMember>('head'));
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>(() => readRecentItems<RecentMember>('member'));

  const headPickerRef = useRef<HTMLDivElement | null>(null);
  const memberPickerRef = useRef<HTMLDivElement | null>(null);
  const deferredHeadSearch = useDeferredValue(headSearch);
  const deferredMemberSearch = useDeferredValue(memberSearch);

  const headOptionsQuery = useWorkspaceMemberOptions(
    {
      q: deferredHeadSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: activeModal === 'create-department' && openPicker === 'head' }
  );
  const memberOptionsQuery = useWorkspaceMemberOptions(
    {
      q: deferredMemberSearch.trim() || undefined,
      sort: 'name:asc',
      limit: 10,
    },
    { enabled: activeModal === 'create-department' && openPicker === 'member' }
  );

  const headOptions = headOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const memberOptions = memberOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const selectedHead = headOptions.find((option) => option.id === headId) ?? recentHeads.find((option) => option.id === headId) ?? null;
  const selectedMemberPreview = selectedMemberIds
    .map((memberId) => memberOptions.find((option) => option.id === memberId) ?? recentMembers.find((option) => option.id === memberId) ?? null)
    .filter((item): item is RecentMember => Boolean(item))
    .slice(0, 3);

  useEffect(() => {
    if (!openPicker) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const refs: Record<PickerKey, React.RefObject<HTMLDivElement | null>> = {
        head: headPickerRef,
        member: memberPickerRef,
      };
      const activeRef = refs[openPicker];
      if (activeRef.current && !activeRef.current.contains(target)) {
        setOpenPicker(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [openPicker]);

  const storeRecentHead = (item: RecentMember) => {
    setRecentHeads((current) => {
      const next = rememberRecentItem(current, item);
      writeRecentItems('head', next);
      return next;
    });
  };

  const storeRecentMember = (item: RecentMember) => {
    setRecentMembers((current) => {
      const next = rememberRecentItem(current, item);
      writeRecentItems('member', next);
      return next;
    });
  };

  const handleHeadSelect = (item: RecentMember | null) => {
    setHeadId(item?.id ?? '');
    if (item) {
      storeRecentHead(item);
    }
    setOpenPicker(null);
  };

  const handleToggleMember = (item: RecentMember) => {
    if (!selectedMemberIds.includes(item.id)) {
      storeRecentMember(item);
    }

    setSelectedMemberIds((current) =>
      current.includes(item.id)
        ? current.filter((value) => value !== item.id)
        : [...current, item.id]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    try {
      await createDepartment.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        headId: headId || null,
        color: selectedColor,
        visibility,
        isDefault,
        memberIds: selectedMemberIds,
      });
      showToast('Department created successfully.', 'success');
      setActiveModal(null);
      setName('');
      setDescription('');
      setHeadId('');
      setSelectedMemberIds([]);
      setSelectedColor(DEPARTMENT_COLORS[0]);
      setVisibility('PUBLIC');
      setIsDefault(false);
      setFieldErrors({});
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'DEPARTMENT_NAME_TAKEN') {
        setFieldErrors({ name: ['A department with this name already exists.'] });
        return;
      }
      if (code === 'HEAD_NOT_WORKSPACE_MEMBER') {
        setFieldErrors({ headId: ['Selected head is not a member of this workspace.'] });
        return;
      }
      if (code === 'MEMBER_NOT_WORKSPACE_MEMBER') {
        setFieldErrors({ memberIds: ['One or more selected members are no longer in this workspace.'] });
        return;
      }

      const validationErrors = getApiFieldErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        return;
      }

      showToast(getApiErrorMessage(error) || 'Failed to create department.', 'error', 'Create failed');
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'create-department'}
      onClose={() => setActiveModal(null)}
      title="Create new department"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Department name</label>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Engineering"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-black/20"
          />
          {renderFieldError(fieldErrors, 'name')}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What does this department own?"
            className="min-h-[88px] w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-black/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div ref={headPickerRef} className="relative space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Department head</label>
            <button
              type="button"
              onClick={() => setOpenPicker((current) => (current === 'head' ? null : 'head'))}
              className={pickerButtonClassName}
            >
              <p className="truncate text-[13px] font-semibold">{selectedHead?.name || 'No head assigned'}</p>
              <p className="truncate text-[11px] text-gray-400">{selectedHead?.email || 'Optional'}</p>
            </button>
            {renderFieldError(fieldErrors, 'headId')}

            {openPicker === 'head' && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-border-dark dark:bg-card-dark">
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={headSearch}
                    onChange={(event) => setHeadSearch(event.target.value)}
                    placeholder="Search head"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                  />
                </div>

                {recentHeads.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {recentHeads.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleHeadSelect(item)}
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition-all ${
                          headId === item.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 dark:border-border-dark'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleHeadSelect(null)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                    headId === ''
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                  }`}
                >
                  <p className="text-sm font-semibold">No head assigned</p>
                  <p className="text-[11px] text-gray-400">Create the department without a head</p>
                </button>

                <div className="max-h-[200px] space-y-1 overflow-y-auto pr-1">
                  {headOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleHeadSelect(item)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                        headId === item.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                      }`}
                    >
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="truncate text-[11px] text-gray-400">{item.email} · {item.role}</p>
                    </button>
                  ))}
                </div>

                {headOptionsQuery.hasNextPage && (
                  <button
                    type="button"
                    onClick={() => headOptionsQuery.fetchNextPage()}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-border-dark"
                  >
                    {headOptionsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Visibility</label>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as 'PUBLIC' | 'PRIVATE')}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-black/20"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Theme color</label>
          <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-gray-50/80 p-3 dark:border-border-dark dark:bg-white/[0.03]">
            {DEPARTMENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`h-6 w-6 rounded-full transition-all ${
                  selectedColor === color ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-card-dark' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          {renderFieldError(fieldErrors, 'color')}
        </div>

        <div ref={memberPickerRef} className="relative space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Members</label>
          <button
            type="button"
            onClick={() => setOpenPicker((current) => (current === 'member' ? null : 'member'))}
            className={pickerButtonClassName}
          >
            <p className="truncate text-[13px] font-semibold">
              {selectedMemberIds.length === 0
                ? 'Select members'
                : `${selectedMemberIds.length} member${selectedMemberIds.length === 1 ? '' : 's'} selected`}
            </p>
            <p className="truncate text-[11px] text-gray-400">
              {selectedMemberPreview.length > 0
                ? selectedMemberPreview.map((item) => item.name).join(', ')
                : 'Search by name, email, or role'}
            </p>
          </button>
          {renderFieldError(fieldErrors, 'memberIds')}

          {openPicker === 'member' && (
            <div className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-30 space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-border-dark dark:bg-card-dark">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search member"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/5"
                />
              </div>

              {recentMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {recentMembers.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleMember(item)}
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold transition-all ${
                        selectedMemberIds.includes(item.id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 dark:border-border-dark'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-[220px] space-y-1 overflow-y-auto pr-1">
                {memberOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleMember(item)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                      selectedMemberIds.includes(item.id)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 bg-white hover:border-primary/40 dark:border-border-dark dark:bg-white/[0.03]'
                    }`}
                  >
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="truncate text-[11px] text-gray-400">{item.email} · {item.role}</p>
                  </button>
                ))}
              </div>

              {memberOptionsQuery.hasNextPage && (
                <button
                  type="button"
                  onClick={() => memberOptionsQuery.fetchNextPage()}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-border-dark"
                >
                  {memberOptionsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
                </button>
              )}
            </div>
          )}
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm font-medium text-gray-600 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-300">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
          />
          Make this the default department
        </label>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-border-dark">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createDepartment.isPending || !name.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {createDepartment.isPending && <Loader2 size={16} className="animate-spin" />}
            Create department
          </button>
        </div>
      </form>
    </Modal>
  );
};
