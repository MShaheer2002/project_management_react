/** Only web links can be opened, so a saved link can never run code (F-46, N-06). */
export const isWebLink = (url: string | null | undefined): url is string => {
  if (!url) return false;
  try {
    return ['http:', 'https:'].includes(new URL(url.trim()).protocol);
  } catch {
    return false;
  }
};

/** An https link on exactly one of these hosts, so `evil.com/drive.google.com` never passes (H-FE-03). */
export const isHttpsLinkOn = (url: string | null | undefined, hosts: string[]): url is string => {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' && hosts.includes(parsed.hostname);
  } catch {
    return false;
  }
};

export const isDriveLink = (url: string | null | undefined): url is string => isHttpsLinkOn(url, ['drive.google.com']);

/** Where each connect flow may send the browser (H-FE-11). */
export const OAUTH_HOSTS = {
  drive: ['accounts.google.com'],
  github: ['github.com'],
  slack: ['slack.com'],
};
