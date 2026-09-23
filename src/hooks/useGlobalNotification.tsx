import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
	id: string;
	type: NotificationType;
	message: string;
	duration?: number;
}

interface GlobalNotificationContextType {
	notifications: Notification[];
	showNotification: (type: NotificationType, message: string, duration?: number) => void;
	showSuccess: (message: string, duration?: number) => void;
	showError: (message: string, duration?: number) => void;
	showWarning: (message: string, duration?: number) => void;
	showInfo: (message: string, duration?: number) => void;
	removeNotification: (id: string) => void;
	clearAll: () => void;
}

const GlobalNotificationContext = createContext<GlobalNotificationContextType | null>(null);

export function GlobalNotificationProvider({ children }: { children: ReactNode }) {
	const [notifications, setNotifications] = useState<Notification[]>([]);

	const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

	const removeNotification = useCallback((id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	}, []);

	const showNotification = useCallback(
		(type: NotificationType, message: string, duration = 5000) => {
			const id = generateId();
			const notification: Notification = { id, type, message, duration };

			setNotifications((prev) => [...prev, notification]);

			if (duration > 0) {
				setTimeout(() => {
					removeNotification(id);
				}, duration);
			}
		},
		[removeNotification]
	);

	const showSuccess = useCallback(
		(message: string, duration?: number) => {
			showNotification('success', message, duration);
		},
		[showNotification]
	);

	const showError = useCallback(
		(message: string, duration?: number) => {
			showNotification('error', message, duration ?? 8000);
		},
		[showNotification]
	);

	const showWarning = useCallback(
		(message: string, duration?: number) => {
			showNotification('warning', message, duration);
		},
		[showNotification]
	);

	const showInfo = useCallback(
		(message: string, duration?: number) => {
			showNotification('info', message, duration);
		},
		[showNotification]
	);

	const clearAll = useCallback(() => {
		setNotifications([]);
	}, []);

	return (
		<GlobalNotificationContext.Provider
			value={{
				notifications,
				showNotification,
				showSuccess,
				showError,
				showWarning,
				showInfo,
				removeNotification,
				clearAll
			}}
		>
			{children}
		</GlobalNotificationContext.Provider>
	);
}

export function useGlobalNotification() {
	const context = useContext(GlobalNotificationContext);
	if (!context) {
		throw new Error('useGlobalNotification must be used within a GlobalNotificationProvider');
	}
	return context;
}
