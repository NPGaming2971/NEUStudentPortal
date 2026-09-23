import { Loader2 } from 'lucide-react';

interface InlineLoaderProps {
	label?: string;
	className?: string;
}

export function InlineLoader({ label, className = 'py-12' }: InlineLoaderProps) {
	return (
		<div className={`flex items-center justify-center gap-2 ${className}`}>
			<Loader2 className="w-8 h-8 animate-spin text-primary" />
			{label ? <span className="text-sm text-muted-foreground">{label}</span> : null}
		</div>
	);
}
