import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarClock, ClipboardCheck, Users } from 'lucide-react';
import type { RegisteredClass, RegistSemesterQuota } from '@/services/registrationService';

interface RegisteredClassesCardProps {
	registeredClasses: RegisteredClass[];
	quota: RegistSemesterQuota | null;
	cancelingClassId: string | null;
	onCancelCourse: (cls: RegisteredClass) => void;
}

export default function RegisteredClassesCard({
	registeredClasses,
	quota,
	cancelingClassId,
	onCancelCourse
}: RegisteredClassesCardProps) {
	if (registeredClasses.length === 0) return null;

	return (
		<Card className="border shadow-lg">
			<CardHeader className="pb-4">
				<CardTitle className="text-lg flex items-center gap-2">
					<ClipboardCheck className="w-5 h-5 text-green-600" />
					Đã đăng ký ({registeredClasses.length})
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-3">
					{registeredClasses.map((cls, idx) => (
						<div
							key={idx}
							className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
						>
							<div>
								<div className="flex items-center gap-2 mb-2">
									<Badge variant="outline" className="text-xs">
										{cls.ScheduleStudyUnitAlias}
									</Badge>
									<Badge className="bg-green-600 text-xs text-white border-0 hover:bg-green-600">
										Đã đăng ký
									</Badge>
									<Badge variant="secondary" className="text-xs">
										{cls.Credits} TC
									</Badge>
								</div>
								<p className="font-semibold">{cls.CurriculumName}</p>
								<div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
									<Users className="w-4 h-4" /> <span>GV: {cls.ProfessorName}</span>
								</div>
								<div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
									<CalendarClock className="w-4 h-4" />{' '}
									<span
										dangerouslySetInnerHTML={{
											__html: cls.Schedules
										}}
									/>
								</div>
							</div>
							{quota?.IsDelete && (
								<Button
									variant="destructive"
									size="sm"
									className="w-full md:w-auto flex-shrink-0 bg-red-500 hover:bg-red-600 text-white"
									onClick={() => onCancelCourse(cls)}
									disabled={cancelingClassId === cls.ScheduleStudyUnitID}
								>
									{cancelingClassId === cls.ScheduleStudyUnitID ? (
										<>
											<Loader2 className="w-4 h-4 mr-1 animate-spin" /> Đang hủy...
										</>
									) : (
										'Hủy đăng ký'
									)}
								</Button>
							)}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
