import { MOCK_ISSUES } from '../constants';
import { Issue } from '../types';

const ISSUES_STORAGE_KEY = 'created_issues';

const parseIssueNumber = (id: string): number => {
  const match = id.match(/^LIN-(\d+)$/);
  return match ? Number(match[1]) : 0;
};

export const getStoredIssues = (): Issue[] => {
  const raw = localStorage.getItem(ISSUES_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Issue[];
  } catch (error) {
    console.error('Failed to parse stored issues', error);
    return [];
  }
};

export const saveStoredIssues = (issues: Issue[]) => {
  localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
};

export const saveCreatedIssue = (issue: Issue) => {
  const issues = getStoredIssues();
  saveStoredIssues([issue, ...issues]);
};

export const updateStoredIssue = (updatedIssue: Issue) => {
  const issues = getStoredIssues();
  const index = issues.findIndex(i => i.id === updatedIssue.id);
  
  if (index !== -1) {
    const newIssues = [...issues];
    newIssues[index] = updatedIssue;
    saveStoredIssues(newIssues);
  } else {
    // If it's a mock issue being updated for the first time, save it to storage
    saveStoredIssues([updatedIssue, ...issues]);
  }
  
  // Dispatch storage event for cross-tab/component sync
  window.dispatchEvent(new StorageEvent('storage', {
    key: ISSUES_STORAGE_KEY,
    newValue: JSON.stringify(getStoredIssues())
  }));
};

export const generateNextIssueId = (): string => {
  const maxMockId = MOCK_ISSUES.reduce((max, issue) => {
    return Math.max(max, parseIssueNumber(issue.id));
  }, 0);

  const maxStoredId = getStoredIssues().reduce((max, issue) => {
    return Math.max(max, parseIssueNumber(issue.id));
  }, 0);

  return `LIN-${Math.max(maxMockId, maxStoredId) + 1}`;
};
