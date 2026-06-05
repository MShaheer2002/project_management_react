import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import type { ExportScope, ExportFormat, AnalyticsQueryParams } from '../../types';

interface ExportButtonProps {
  scope: ExportScope;
  scopeId?: string;
  params: AnalyticsQueryParams;
}

const formats: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
  { value: 'csv', label: 'CSV', icon: <FileSpreadsheet size={14} /> },
  { value: 'json', label: 'JSON', icon: <FileJson size={14} /> },
  { value: 'pdf', label: 'PDF', icon: <FileText size={14} /> },
];

export const ExportButton: React.FC<ExportButtonProps> = ({ scope, scopeId, params }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setLoading(true);
    setOpen(false);
    try {
      const blob = await analyticsService.exportAnalytics(scope, format, { ...params, scopeId });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${scope}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
      >
        <Download size={14} />
        {loading ? 'Exporting...' : 'Export'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-card-dark rounded-lg shadow-xl border border-gray-200 dark:border-border-dark py-1 z-50">
          {formats.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleExport(f.value)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-gray-400">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
