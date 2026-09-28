import type { Term } from '@/services/scheduleService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface YearTermFilterProps {
	selectedYear: string;
	onYearChange: (year: string) => void;
	selectedTerm: string;
	onTermChange: (term: string) => void;
	years: string[];
	terms: Term[];
	className?: string;
	yearTriggerClassName?: string;
	termTriggerClassName?: string;
	showLabels?: boolean;
}

export default function YearTermFilter({
	selectedYear,
	onYearChange,
	selectedTerm,
	onTermChange,
	years,
	terms,
	className,
	yearTriggerClassName = 'w-[180px]',
	termTriggerClassName = 'w-[180px]',
	showLabels = false
}: YearTermFilterProps) {
	return (
		<div className={cn('flex flex-col sm:flex-row gap-3', className)}>
			<div className="flex items-center gap-2">
				{showLabels && (
					<label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Năm học</label>
				)}
				<Select value={selectedYear} onValueChange={onYearChange}>
					<SelectTrigger className={yearTriggerClassName}>
						<SelectValue placeholder="Chọn năm học" />
					</SelectTrigger>
					<SelectContent>
						{years.map((year) => (
							<SelectItem key={year} value={year}>
								Năm học {year}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="flex items-center gap-2">
				{showLabels && (
					<label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Học kỳ</label>
				)}
				<Select value={selectedTerm} onValueChange={onTermChange}>
					<SelectTrigger className={termTriggerClassName}>
						<SelectValue placeholder="Chọn học kỳ" />
					</SelectTrigger>
					<SelectContent>
						{terms.map((term) => (
							<SelectItem key={term.TermID} value={term.TermID}>
								{term.TermName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
