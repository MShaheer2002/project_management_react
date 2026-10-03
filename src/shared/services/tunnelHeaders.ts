/**
 * ngrok's free tier shows a warning page unless this header is sent. Only
 * send it when the API really is an ngrok tunnel, never to production (H-FE-20).
 */
const apiHost = new URL(process.env.BASE_URL || 'http://localhost:8000').hostname;

export const tunnelHeaders: Record<string, string> = /\.ngrok(-free)?\.(app|dev|io)$/.test(apiHost)
  ? { 'ngrok-skip-browser-warning': 'true' }
  : {};
