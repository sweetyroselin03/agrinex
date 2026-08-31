declare const process: any;

const getEnvApiUrl = (): string => {
  if (typeof process !== 'undefined' && process?.env) {
    if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (process.env.PUBLIC_API_URL) return process.env.PUBLIC_API_URL;
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    if (process.env.API_URL) return process.env.API_URL;
  }
  
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      if (metaEnv.VITE_API_URL) return metaEnv.VITE_API_URL;
      if (metaEnv.NEXT_PUBLIC_API_URL) return metaEnv.NEXT_PUBLIC_API_URL;
      if (metaEnv.PUBLIC_API_URL) return metaEnv.PUBLIC_API_URL;
      if (metaEnv.REACT_APP_API_URL) return metaEnv.REACT_APP_API_URL;
      if (metaEnv.API_URL) return metaEnv.API_URL;
    }
  } catch (_) {}

  return 'https://agrinex.onrender.com';
};

const rawUrl = getEnvApiUrl();
export const API_BASE_URL = rawUrl.replace(/\/+$/, '');

export const WS_BASE_URL = API_BASE_URL.replace(
  /^https?:\/\//,
  API_BASE_URL.startsWith('https') ? 'wss://' : 'ws://'
);
