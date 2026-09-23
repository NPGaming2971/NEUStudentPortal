import { useGlobalNotification, type Notification } from '@/hooks/useGlobalNotification';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const iconMap = {
	success: CheckCircle2,
	error: AlertCircle,
	warning: AlertTriangle,
	info: Info
};

const styleMap = {
	success: {
		container: 'bg-green-500/10 border-green-500/30',
		icon: 'text-green-600',
		text: 'text-green-600'
	},
	error: {
		container: 'bg-destructive/10 border-destructive/50',
		icon: 'text-destructive',
		text: 'text-destructive'
	},
	warning: {
		container: 'bg-amber-500/10 border-amber-500/30',
		icon: 'text-amber-600',
		text: 'text-amber-600'
	},
	info: {
		container: 'bg-blue-500/10 border-blue-500/30',
		icon: 'text-blue-600',
		text: 'text-blue-600'
	}
};

function NotificationItem({ notification, onRemove }: { notification: Notification; onRemove: () => void }) {
	const Icon = iconMap[notification.type];
	const styles = styleMap[notification.type];

	return (
		<div
			className={cn(
				'flex items-center gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm animate-in slide-in-from-right-full duration-300',
				styles.container
			)}
		>
			<Icon className={cn('w-5 h-5 shrink-0', styles.icon)} />
			<p className={cn('flex-1 text-sm font-medium', styles.text)}>{notification.message}</p>
			<button
				onClick={onRemove}
				className={cn('p-1 rounded-full hover:bg-black/10 transition-colors shrink-0', styles.text)}
			>
				<X className="w-4 h-4" />
			</button>
		</div>
	);
}

export default function GlobalNotification() {
	const { notifications, removeNotification } = useGlobalNotification();

	if (notifications.length === 0) return null;

	return (
		<div className="fixed top-4 right-4 z-100000 flex flex-col gap-2 max-w-md w-full pointer-events-auto">
			{notifications.map((notification) => (
				<NotificationItem
					key={notification.id}
					notification={notification}
					onRemove={() => removeNotification(notification.id)}
				/>
			))}
		</div>
	);
}
