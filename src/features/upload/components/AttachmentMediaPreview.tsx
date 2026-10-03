import React, { useEffect, useState } from 'react';
import { FileVideo2, ImageIcon, Loader2 } from 'lucide-react';
import { uploadService } from '../services/uploadService';

type AttachmentMediaPreviewProps = {
  contentType: string;
  fileName: string;
  attachmentKey?: string | null;
  previewUrl?: string | null;
  className?: string;
  controls?: boolean;
};

// Media only ever loads from our own storage via the key. A stored assetUrl is
// member supplied, so loading it would tell its host who viewed the issue (FE-05).

const isImage = (contentType: string) => contentType.startsWith('image/');
const isVideo = (contentType: string) => contentType.startsWith('video/');

export const AttachmentMediaPreview: React.FC<AttachmentMediaPreviewProps> = ({
  contentType,
  fileName,
  attachmentKey,
  previewUrl,
  className = 'h-full w-full object-cover',
  controls = false,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(previewUrl ?? null);
  const [isLoading, setIsLoading] = useState(Boolean(attachmentKey && !previewUrl));

  useEffect(() => {
    let active = true;

    if (previewUrl) {
      setResolvedUrl(previewUrl);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    if (!attachmentKey) {
      setResolvedUrl(null);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    setResolvedUrl(null);

    void uploadService
      .getViewUrl(attachmentKey)
      .then((result) => {
        if (!active) return;
        setResolvedUrl(result.url);
      })
      .catch(() => {
        if (!active) return;
        setResolvedUrl(null);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attachmentKey, previewUrl]);

  if (isLoading && !resolvedUrl) {
    return <Loader2 size={18} className="animate-spin text-gray-400" aria-label={`Loading ${fileName}`} />;
  }

  if (isImage(contentType) && resolvedUrl) {
    return <img src={resolvedUrl} alt={fileName} className={className} />;
  }

  if (isVideo(contentType) && resolvedUrl) {
    return controls ? (
      <video src={resolvedUrl} className={className} controls autoPlay playsInline />
    ) : (
      <video src={resolvedUrl} className={className} muted playsInline />
    );
  }

  return isVideo(contentType) ? (
    <FileVideo2 size={18} className="text-gray-400" aria-hidden="true" />
  ) : (
    <ImageIcon size={18} className="text-gray-400" aria-hidden="true" />
  );
};
