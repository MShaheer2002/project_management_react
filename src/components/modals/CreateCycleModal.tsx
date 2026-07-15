import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Calendar, Users, RotateCcw } from 'lucide-react';
import { Modal } from './Modal';
import { useApp } from '../../AppContext';
import { useCreateCycle } from '@features/cycles';
import { useTeamOptions } from '@features/team';
import { getApiErrorMessage } from '@shared/services';

const todayIso = () => new Date().toISOString().slice(0, 10);

export const CreateCycleModal: React.FC = () => {
  const { activeModal, setActiveModal, showToast } = useApp();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState('');
  const [teamId, setTeamId] = useState('');
  const [carryOverUnfinished, setCarryOverUnfinished] = useState(true);
  const [notifyTeam, setNotifyTeam] = useState(true);
  const createCycle = useCreateCycle();
  const teamOptionsQuery = useTeamOptions({ limit: 100 });
  const teams = useMemo(
    () => teamOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [teamOptionsQuery.data]
  );

  useEffect(() => {
    if (!teamId && teams[0]?.id) {
      setTeamId(teams[0].id);
    }
  }, [teamId, teams]);

  const selectedTeam = useMemo(() => teams.find((team) => team.id === teamId), [teamId, teams]);
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  const resetForm = () => {
    setName('');
    setGoal('');
    setStartDate(todayIso());
    setEndDate('');
    setTeamId('');
    setCarryOverUnfinished(true);
    setNotifyTeam(true);
  };

  const handleClose = () => {
    setActiveModal(null);
  };

  const validate = () => {
    if (!name.trim()) {
      showToast('Cycle name is required.', 'error', 'Validation');
      return false;
    }
    if (!goal.trim()) {
      showToast('Cycle goal is required.', 'error', 'Validation');
      return false;
    }
    if (!teamId) {
      showToast('Team selection is required.', 'error', 'Validation');
      return false;
    }
    if (!startDate || !endDate) {
      showToast('Start and end dates are required.', 'error', 'Validation');
      return false;
    }
    if (new Date(startDate).getTime() >= new Date(endDate).getTime()) {
      showToast('End date must be after start date.', 'error', 'Validation');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await createCycle.mutateAsync({
        teamId,
        name: name.trim(),
        goal: goal.trim(),
        startsAt: new Date(startDate).toISOString(),
        endsAt: new Date(endDate).toISOString(),
        status: 'UPCOMING',
      });
      handleClose();
      resetForm();
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to create cycle.', 'error', 'Create failed');
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'create-cycle'}
      onClose={handleClose}
      title="Create Cycle"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-border-dark">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
            <RotateCcw size={13} />
            Cycle Details
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Cycle 16"
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Goal</label>
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="What should this cycle deliver?"
                rows={3}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03]"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Start Date</label>
            <div className="relative">
              <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03] [color-scheme:light] dark:[color-scheme:dark]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">End Date</label>
            <div className="relative">
              <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03] [color-scheme:light] dark:[color-scheme:dark]"
                required
              />
            </div>
          </div>
        </div>
        {startDate && endDate && (
          <div className="rounded-xl border border-gray-200 p-3 text-xs text-gray-500 dark:border-border-dark dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Duration</span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {durationDays > 0 ? `${durationDays} day${durationDays > 1 ? 's' : ''}` : 'Invalid date range'}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span>Status on creation</span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">Upcoming</span>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Team Scope</label>
          <div className="relative">
            <Users size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              className="w-full appearance-none rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-white/[0.03]"
            >
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-4 dark:border-border-dark">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Planning Defaults</div>
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Carry over unfinished issues on completion</span>
              <input
                type="checkbox"
                checked={carryOverUnfinished}
                onChange={(event) => setCarryOverUnfinished(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Notify team members when cycle starts</span>
              <input
                type="checkbox"
                checked={notifyTeam}
                onChange={(event) => setNotifyTeam(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-3 text-xs text-gray-500 dark:border-border-dark dark:text-gray-400">
          <div className="font-semibold text-gray-700 dark:text-gray-200">Cycle Preview</div>
          <div className="mt-1">
            {(name || 'Untitled cycle')} · {selectedTeam?.name || 'No team selected'} · {startDate || 'Start date'} to {endDate || 'End date'}
          </div>
          <div className="mt-1">{goal || 'Add cycle goal to define expected delivery outcome.'}</div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-border-dark">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createCycle.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {createCycle.isPending && <Loader2 size={14} className="animate-spin" />}
            Create Cycle
          </button>
        </div>
      </form>
    </Modal>
  );
};
