import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ClipboardCheck, GraduationCap, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RegistSemesterQuota } from '@/services/registrationService';

interface RegistrationHeaderProps {
	summary: {
		totalRegistered: number;
		totalCredits: number;
		totalAvailable: number;
	};
	quota: RegistSemesterQuota | null;
}

export default function RegistrationHeader({ summary, quota }: RegistrationHeaderProps) {
	return (
		<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
			<div className="space-y-1.5">
				<h1 className="text-3xl font-bold tracking-tight text-foreground">Đăng ký học phần</h1>
				<p className="text-muted-foreground">Đăng ký học phần tín chỉ, chọn thời khoá biểu chuyên nghiệp</p>
			</div>

			<div className="flex flex-col items-end gap-5 flex-shrink-0">
				<div className="grid grid-cols-3 gap-10">
					<div className="min-w-[100px]">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-xl bg-primary/10 text-primary">
								<ClipboardCheck className="w-5 h-5" />
							</div>
							<div className="overflow-hidden">
								<p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
									Đã đăng ký
								</p>
								<p className="text-2xl font-bold leading-tight">{summary.totalRegistered}</p>
							</div>
						</div>
					</div>
					<div className="min-w-[100px] border-l border-border pl-10">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
								<GraduationCap className="w-5 h-5" />
							</div>
							<div className="overflow-hidden">
								<p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
									Tín chỉ
								</p>
								<p className="text-2xl font-bold text-amber-600 leading-tight">
									{summary.totalCredits}
								</p>
							</div>
						</div>
					</div>
					<div className="min-w-[100px] border-l border-border pl-10">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-xl bg-green-500/10 text-green-600">
								<ListChecks className="w-5 h-5" />
							</div>
							<div className="overflow-hidden">
								<p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
									Môn khả dụng
								</p>
								<p className="text-2xl font-bold text-green-600 leading-tight">
									{summary.totalAvailable}
								</p>
							</div>
						</div>
					</div>
				</div>

				{quota && (
					<div className="flex flex-wrap items-center justify-end gap-3">
						<Badge
							className={cn(
								'px-3 py-1 text-xs font-semibold border-0',
								quota.RegistAble
									? 'bg-green-500 hover:bg-green-600 text-white'
									: 'bg-destructive text-destructive-foreground'
							)}
						>
							{quota.TermID} • {quota.YearStudy} •{' '}
							{quota.RegistAble ? 'Đang mở' : quota.RegistAbleDescr || 'Đã đóng'}
						</Badge>
						<div className="flex items-center gap-3 text-xs font-medium text-muted-foreground/80 bg-secondary/40 px-3 py-1.5 rounded-full">
							<div className="flex items-center gap-1.5">
								<Calendar className="w-3.5 h-3.5 text-primary" />
								<span>
									Bắt đầu:{' '}
									<span className="text-foreground font-semibold">
										{quota.BeginDate?.split(' ')?.[1]?.slice(0, 5)}{' '}
										{quota.BeginDate?.split(' ')?.[0]}
									</span>
								</span>
							</div>
							<div className="w-px h-3 bg-border" />
							<div className="flex items-center gap-1.5">
								<Clock className="w-3.5 h-3.5 text-primary" />
								<span>
									Kết thúc:{' '}
									<span className="text-foreground font-semibold">
										{quota.EndDate?.split(' ')?.[1]?.slice(0, 5)} {quota.EndDate?.split(' ')?.[0]}
									</span>
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
