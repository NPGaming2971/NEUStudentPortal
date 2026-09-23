import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PageErrorProps {
	message: string;
	onRetry?: () => void;
}

export function PageError({ message, onRetry }: PageErrorProps) {
	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<Card className="max-w-md w-full border-destructive/50">
				<CardContent className="pt-6">
					<div className="text-center space-y-4">
						<AlertCircle className="w-12 h-12 text-destructive mx-auto" />
						<p className="text-destructive">{message}</p>
						{onRetry && (
							<Button onClick={onRetry} variant="outline">
								Thử lại
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
