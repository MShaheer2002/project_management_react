import React, { useRef } from 'react';
import { HardDrive } from 'lucide-react';
import { useDriveConnection } from '../hooks/useDriveData';

type DriveUploadButtonProps = {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * DriveUploadButton — File picker that uploads to Google Drive.
 *
 * Shows "Connect Drive" prompt if the user hasn't connected yet.
 * Otherwise opens a standard file picker — the actual upload to Drive
 * happens in the parent component (IssueAttachmentsField) using the
 * driveService.uploadFile function.
 */
export const DriveUploadButton: React.FC<DriveUploadButtonProps> = ({
  onFilesSelected,
  accept,
  multiple = true,
  disabled = false,
  className = '',
}) => {
  const { data: connection } = useDriveConnection();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    if (!connection?.connected) return;
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    event.target.value = '';
  };

  if (!connection?.connected) {
    return null;
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 disabled:opacity-50 ${className}`}
        title="Upload to your Google Drive"
      >
        <HardDrive size={14} />
        Upload to Drive
      </button>
    </>
  );
};
