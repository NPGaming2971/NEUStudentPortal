const WORKER_URL = (import.meta.env.VITE_WORKER_URL as string | undefined) ?? "";

export const PORTAL_PROXY_URL = `${WORKER_URL}/portal`;

export const REGIST_PROXY_URL = `${WORKER_URL}/regist`;