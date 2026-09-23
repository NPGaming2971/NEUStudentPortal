import { createContext } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
	id: string;
	type: NotificationType;
	message: string;
	duration?: number;
}

export interface GlobalNotificationContextType {
	notifications: Notification[];
	showNotification: (type: NotificationType, message: string, duration?: number) => void;
	showSuccess: (message: string, duration?: number) => void;
	showError: (message: string, duration?: number) => void;
	showWarning: (message: string, duration?: number) => void;
	showInfo: (message: string, duration?: number) => void;
	removeNotification: (id: string) => void;
	clearAll: () => void;
}

export const GlobalNotificationContext = createContext<GlobalNotificationContextType | null>(null);
