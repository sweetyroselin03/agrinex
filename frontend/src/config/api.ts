const API_URL =
  (import.meta as any).env?.VITE_API_URL || 'https://agrinex.onrender.com';

export const API_BASE_URL = API_URL.replace(/\/+$/, '');

export const WS_BASE_URL = API_BASE_URL.replace(
  /^https?:\/\//,
  API_BASE_URL.startsWith('https') ? 'wss://' : 'ws://'
);
