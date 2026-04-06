import { MOCK_ISSUES } from '../constants';
import { CreatedTask } from '../types';

const TASKS_STORAGE_KEY = 'created_tasks';

const parseIssueNumber = (id: string): number => {
  const match = id.match(/^LIN-(\d+)$/);
  return match ? Number(match[1]) : 0;
};

export const getStoredTasks = (): CreatedTask[] => {
  const raw = localStorage.getItem(TASKS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CreatedTask[];
  } catch (error) {
    console.error('Failed to parse stored tasks', error);
    return [];
  }
};

export const saveStoredTasks = (tasks: CreatedTask[]) => {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
};

export const saveCreatedTask = (task: CreatedTask) => {
  const tasks = getStoredTasks();
  saveStoredTasks([task, ...tasks]);
};

export const generateNextTaskId = (): string => {
  const maxMockId = MOCK_ISSUES.reduce((max, issue) => {
    return Math.max(max, parseIssueNumber(issue.id));
  }, 0);

  const maxStoredId = getStoredTasks().reduce((max, task) => {
    return Math.max(max, parseIssueNumber(task.id));
  }, 0);

  return `LIN-${Math.max(maxMockId, maxStoredId) + 1}`;
};
