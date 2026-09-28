import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck, GraduationCap, ListChecks } from 'lucide-react';
import type { RegistrationSummary } from '@/services/registrationService';

export default function RegistrationSummaryCards({ summary }: { summary: RegistrationSummary }) {
	return (
		<div className="grid grid-cols-3 gap-4">
			<Card className="border-0 shadow-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-white/20">
							<ClipboardCheck className="w-5 h-5" />
						</div>
						<div>
							<p className="text-primary-foreground/70 text-xs">Đã đăng ký</p>
							<p className="text-2xl font-bold">{summary.totalRegistered}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border shadow-lg bg-amber-500/10 border-amber-500/30">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-amber-500/20">
							<GraduationCap className="w-5 h-5 text-amber-600" />
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Tổng tín chỉ</p>
							<p className="text-2xl font-bold text-amber-600">{summary.totalCredits}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border shadow-lg bg-green-500/10 border-green-500/30">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-green-500/20">
							<ListChecks className="w-5 h-5 text-green-600" />
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Có thể đăng ký</p>
							<p className="text-2xl font-bold text-green-600">{summary.totalAvailable}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
