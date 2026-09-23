import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
	label?: string;
}

export function PageLoader({ label = 'Đang tải dữ liệu...' }: PageLoaderProps) {
	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<div className="text-center space-y-4">
				<Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
				<p className="text-muted-foreground">{label}</p>
			</div>
		</div>
	);
}
