import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudyProgram, StudyType } from '@/services/registrationService';

interface RegistrationFiltersProps {
	studyPrograms: StudyProgram[];
	selectedProgramId: string;
	onProgramChange: (value: string) => void;
	availableStudyTypes: StudyType[];
	selectedStudyType: string;
	onStudyTypeChange: (value: string) => void;
	onRefresh: () => void;
	isLoadingClasses: boolean;
}

export default function RegistrationFilters({
	studyPrograms,
	selectedProgramId,
	onProgramChange,
	availableStudyTypes,
	selectedStudyType,
	onStudyTypeChange,
	onRefresh,
	isLoadingClasses
}: RegistrationFiltersProps) {
	return (
		<div className="mt-2">
			<div className="flex flex-col lg:flex-row gap-6 items-end">
				<div className="lg:flex-[0.35] w-full">
					<label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
						Chương trình đào tạo
					</label>
					<Select value={selectedProgramId} onValueChange={onProgramChange}>
						<SelectTrigger className="w-full bg-secondary/30 border-0 h-11 px-4">
							<SelectValue placeholder="Chọn chương trình" />
						</SelectTrigger>
						<SelectContent>
							{studyPrograms.map((program) => (
								<SelectItem key={program.StudyProgramID} value={program.StudyProgramID}>
									{program.StudyProgramName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{availableStudyTypes.length > 0 && (
					<div className="lg:flex-[0.65] w-full">
						<label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block text-center lg:text-left">
							Loại đăng ký
						</label>
						<Tabs value={selectedStudyType} onValueChange={onStudyTypeChange} className="w-full">
							<TabsList className="w-full flex h-11 gap-1 bg-secondary/30 p-1 rounded-md border-0">
								{availableStudyTypes.map((type) => (
									<TabsTrigger
										key={type.ChucNangID}
										value={type.LoaiHinh}
										className="flex-1 h-full text-[11px] font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground transition-all duration-300 rounded-sm"
									>
										{type.TenChucNang}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>
					</div>
				)}

				<Button
					variant="outline"
					size="icon"
					className="bg-secondary/30 border-0 h-10 w-10 hover:bg-primary/20 hover:text-primary transition-all shrink-0"
					onClick={onRefresh}
					disabled={isLoadingClasses}
				>
					<RefreshCw className={cn('h-4 w-4', isLoadingClasses && 'animate-spin')} />
				</Button>
			</div>
		</div>
	);
}
