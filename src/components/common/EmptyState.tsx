import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
	icon?: LucideIcon;
	title?: string;
	description?: string;
	className?: string;
	iconClassName?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	className = 'py-12',
	iconClassName = 'w-16 h-16 text-muted-foreground/30 mx-auto mb-4'
}: EmptyStateProps) {
	return (
		<div className={`text-center ${className}`}>
			{Icon ? <Icon className={iconClassName} /> : null}
			{title ? <p className="text-muted-foreground">{title}</p> : null}
			{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
		</div>
	);
}
