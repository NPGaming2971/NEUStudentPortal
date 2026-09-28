export const StorageKeys = {
	AuthorizationData: 'authorizationData',
	RegistToken: 'registToken'
} as const;

export const getStoredAuthorizationData = (): unknown | null => {
	const raw = localStorage.getItem(StorageKeys.AuthorizationData);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
};

export const getStoredToken = (): string | null => {
	const data = getStoredAuthorizationData();
	if (!data || typeof data !== 'object' || !('Token' in data)) return null;
	const token = (data as { Token: unknown }).Token;
	return typeof token === 'string' && token ? token : null;
};

export const setStoredAuthorizationData = (data: unknown): void => {
	localStorage.setItem(StorageKeys.AuthorizationData, JSON.stringify(data));
};

export const getRegistToken = (): string | null => localStorage.getItem(StorageKeys.RegistToken);

export const setRegistToken = (token: string): void => {
	localStorage.setItem(StorageKeys.RegistToken, token);
};

export const clearAuthStorage = (): void => {
	localStorage.removeItem(StorageKeys.AuthorizationData);
	localStorage.removeItem(StorageKeys.RegistToken);
};
