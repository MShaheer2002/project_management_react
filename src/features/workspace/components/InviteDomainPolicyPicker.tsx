import React, { useState } from 'react';
import type { InviteDomainPolicy } from '../services/workspaceService';

interface InviteDomainPolicyPickerProps {
  policy: InviteDomainPolicy;
  domains: string[];
  onChange: (policy: InviteDomainPolicy, domains: string[]) => void;
  /** Shown next to "Only my company's domain" — the domain that option will use. */
  companyDomainPreview?: string;
  /** CreateWorkspacePage sets this — reassures a first-time setter this isn't a one-shot, locked-in choice. Settings omits it, since you're already there. */
  showChangeLaterNote?: boolean;
}

const OPTIONS: { value: InviteDomainPolicy; label: string; description: string }[] = [
  { value: 'ANY', label: 'Any email domain', description: 'Invite anyone, regardless of their email address.' },
  { value: 'COMPANY_ONLY', label: "Only my company's domain", description: '' },
  { value: 'CUSTOM', label: 'Specific domains', description: 'Choose exactly which domains can be invited.' },
];

/**
 * Who can be invited to this workspace, by email domain. Shared between
 * CreateWorkspacePage (onboarding) and SettingsPage (change it later) so
 * the two never drift out of sync in behavior or copy.
 */
export const InviteDomainPolicyPicker: React.FC<InviteDomainPolicyPickerProps> = ({
  policy,
  domains,
  onChange,
  companyDomainPreview,
  showChangeLaterNote,
}) => {
  // Free-text buffer for the CUSTOM domain list, so the user can type
  // "trussen.app, partner.co" naturally without every keystroke needing to
  // already be a valid, comma-clean domain list.
  const [customDraft, setCustomDraft] = useState(domains.join(', '));

  const commitCustomDraft = (raw: string) => {
    const parsed = raw
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    onChange('CUSTOM', [...new Set(parsed)]);
  };

  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
        Who can be invited?
      </label>
      <div className="space-y-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value, opt.value === 'CUSTOM' ? domains : [])}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
              policy === opt.value
                ? 'border-primary bg-primary/10'
                : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.12]'
            }`}
          >
            <div className={`text-sm font-medium ${policy === opt.value ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
              {opt.label}
            </div>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {opt.value === 'COMPANY_ONLY'
                ? companyDomainPreview
                  ? `Only @${companyDomainPreview} email addresses.`
                  : 'Only email addresses matching your own domain.'
                : opt.description}
            </p>
          </button>
        ))}
      </div>

      {policy === 'CUSTOM' && (
        <input
          type="text"
          value={customDraft}
          onChange={(e) => setCustomDraft(e.target.value)}
          onBlur={(e) => commitCustomDraft(e.target.value)}
          placeholder="trussen.app, partner-agency.com"
          className="mt-2 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      )}

      {showChangeLaterNote && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          You can change this anytime from Settings — the workspace owner will find it there.
        </p>
      )}
    </div>
  );
};
