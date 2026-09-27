/** Only web links can be opened, so a saved link can never run code (F-46, N-06). */
export const isWebLink = (url: string | null | undefined): url is string => {
  if (!url) return false;
  try {
    return ['http:', 'https:'].includes(new URL(url.trim()).protocol);
  } catch {
    return false;
  }
};
