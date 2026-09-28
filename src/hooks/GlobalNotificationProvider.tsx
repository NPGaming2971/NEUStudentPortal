import { useCallback, useState, type ReactNode } from 'react';
import {
	GlobalNotificationContext,
	type Notification,
	type NotificationType,
	type GlobalNotificationContextType
} from './useGlobalNotification';

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

	const value: GlobalNotificationContextType = {
		notifications,
		showNotification,
		showSuccess,
		showError,
		showWarning,
		showInfo,
		removeNotification,
		clearAll
	};

	return <GlobalNotificationContext.Provider value={value}>{children}</GlobalNotificationContext.Provider>;
}
