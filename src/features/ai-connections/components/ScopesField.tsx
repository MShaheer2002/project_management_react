import React, { useState } from 'react';
import { ADMIN_SCOPE, SCOPE_CATEGORIES } from '../scopes';

interface ScopesFieldProps {
  value: string[];
  onChange: (scopes: string[]) => void;
}

export const ScopesField: React.FC<ScopesFieldProps> = ({ value, onChange }) => {
  const isAdmin = value.length === 1 && value[0] === ADMIN_SCOPE;
  const [granular, setGranular] = useState<string[]>(isAdmin ? [] : value);

  const toggleAdmin = () => {
    if (isAdmin) {
      onChange(granular);
    } else {
      onChange([ADMIN_SCOPE]);
    }
  };

  const toggleScope = (scope: string) => {
    const next = granular.includes(scope) ? granular.filter((s) => s !== scope) : [...granular, scope];
    setGranular(next);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Access scopes</label>

      <label
        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
          isAdmin ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-black/20'
        }`}
      >
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">Admin — full access</div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Grants every scope below, plus anything added later. Recommended only for trusted, first-party use.
          </p>
        </div>
        <input
          type="checkbox"
          checked={isAdmin}
          onChange={toggleAdmin}
          className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
        />
      </label>

      <div className="rounded-xl border border-gray-200 dark:border-border-dark divide-y divide-gray-200 dark:divide-border-dark overflow-hidden">
        {SCOPE_CATEGORIES.map((category) => (
          <div key={category.label} className="px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{category.label}</span>
            <div className="flex items-center gap-4">
              {category.read && (
                <label className={`flex items-center gap-1.5 text-xs ${isAdmin ? 'opacity-50' : ''}`} title={category.read.description}>
                  <input
                    type="checkbox"
                    disabled={isAdmin}
                    checked={isAdmin || granular.includes(category.read.scope)}
                    onChange={() => toggleScope(category.read!.scope)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
                  />
                  read
                </label>
              )}
              {category.write && (
                <label className={`flex items-center gap-1.5 text-xs ${isAdmin ? 'opacity-50' : ''}`} title={category.write.description}>
                  <input
                    type="checkbox"
                    disabled={isAdmin}
                    checked={isAdmin || granular.includes(category.write.scope)}
                    onChange={() => toggleScope(category.write!.scope)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
                  />
                  write
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
