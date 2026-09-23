import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, BookOpen, ChevronRight, BookMarked, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
	ClassAllowRegistGroup,
	ClassStudyUnitItem,
	RegisteredClass,
	RegistSemesterQuota
} from '@/services/registrationService';

interface AcademicCourseResult {
	CurriculumID: string;
	CurriculumName: string;
	Credits: string;
	DiemTK_10: string;
	DiemTK_4: string;
	DiemTK_Chu: string;
	IsPass: string;
	HPTuongDuong?: string;
	isEquivalentOf?: string;
}

interface AvailableCoursesListProps {
	allowedClasses: ClassAllowRegistGroup[];
	registeredClasses: RegisteredClass[];
	isLoadingClasses: boolean;
	isLoadingQuota: boolean;
	quota: RegistSemesterQuota | null;
	academicLookup: Map<string, AcademicCourseResult>;
	onSelectCourse: (course: ClassStudyUnitItem) => void;
	showInfo: (msg: string) => void;
	showError: (msg: string) => void;
}

const getGradeColor = (grade: string | null | undefined) => {
	if (!grade) return 'text-muted-foreground bg-muted';
	const g = grade.toUpperCase();
	if (g === 'A' || g === 'A+') return 'text-green-600 dark:text-green-400 bg-green-500/20';
	if (g === 'B' || g === 'B+') return 'text-blue-600 dark:text-blue-400 bg-blue-500/20';
	if (g === 'C' || g === 'C+') return 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/20';
	if (g === 'D' || g === 'D+') return 'text-orange-600 dark:text-orange-400 bg-orange-500/20';
	if (g.startsWith('F')) return 'text-red-600 dark:text-red-400 bg-red-500/20';
	return 'text-muted-foreground bg-muted';
};

export default function AvailableCoursesList({
	allowedClasses,
	registeredClasses,
	isLoadingClasses,
	isLoadingQuota,
	quota,
	academicLookup,
	onSelectCourse,
	showInfo,
	showError
}: AvailableCoursesListProps) {
	return (
		<div className="pt-4 pb-12">
			<h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-foreground">
				<BookOpen className="h-5 w-5 text-primary" />
				Học phần khả dụng
			</h2>

			<div className="space-y-4">
				{isLoadingClasses || isLoadingQuota ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : allowedClasses.length === 0 ? (
					<div className="text-center py-12 bg-secondary/20 rounded-lg border border-dashed">
						<BookMarked className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
						<p className="text-muted-foreground font-medium">Không có học phần nào</p>
						<p className="text-sm text-muted-foreground/70 mt-1">Đổi loại đăng ký hoặc kiểm tra lại sau</p>
					</div>
				) : (
					<Accordion
						type="multiple"
						className="w-full space-y-4"
						defaultValue={allowedClasses.map((_, i) => `group-${i}`)}
					>
						{allowedClasses.map((group, groupIndex) => (
							<AccordionItem
								key={groupIndex}
								value={`group-${groupIndex}`}
								className="border border-border/50 bg-secondary/5 rounded-xl overflow-hidden px-2 mb-2"
								style={{ borderBottomWidth: '1px' }}
							>
								<AccordionTrigger className="hover:no-underline py-4 px-2 hover:bg-secondary/20 transition-colors rounded-lg">
									<div className="flex items-center gap-3">
										<Badge
											variant={
												group.CurriculumTypeGroupName === 'Bắt buộc' ? 'default' : 'secondary'
											}
											className="px-4 py-0.5 rounded-full"
										>
											{group.CurriculumTypeGroupName}
										</Badge>
										<span className="text-sm text-muted-foreground font-medium">
											(
											{group.classStudyUnits?.reduce(
												(s, p) => s + (p.Selections?.length || 0),
												0
											) || 0}{' '}
											học phần)
										</span>
									</div>
								</AccordionTrigger>
								<AccordionContent className="pb-4 pt-2">
									<div className="space-y-4">
										{group.classStudyUnits?.map((studyUnitGroup, planIndex) => (
											<div key={planIndex}>
												{studyUnitGroup.SelectionName && (
													<p className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5">
														<Info className="w-4 h-4" />
														{studyUnitGroup.SelectionName}
													</p>
												)}
												<div className="grid gap-3 lg:grid-cols-2">
													{studyUnitGroup.Selections?.map(
														(course: ClassStudyUnitItem, courseIndex: number) => {
															const isRegisted = registeredClasses.some(
																(r) =>
																	r.StudyUnitID === course.StudyUnitID ||
																	r.CurriculumID === course.CurriculumID
															);
															return (
																<CourseCard
																	key={courseIndex}
																	course={course}
																	isRegisted={isRegisted}
																	quota={quota}
																	academicLookup={academicLookup}
																	onSelectCourse={onSelectCourse}
																	showInfo={showInfo}
																	showError={showError}
																/>
															);
														}
													)}
												</div>
											</div>
										))}
									</div>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				)}
			</div>
		</div>
	);
}

function CourseCard({
	course,
	isRegisted,
	quota,
	academicLookup,
	onSelectCourse,
	showInfo,
	showError
}: {
	course: ClassStudyUnitItem;
	isRegisted: boolean;
	quota: RegistSemesterQuota | null;
	academicLookup: Map<string, AcademicCourseResult>;
	onSelectCourse: (course: ClassStudyUnitItem) => void;
	showInfo: (msg: string) => void;
	showError: (msg: string) => void;
}) {
	return (
		<div
			className={cn(
				'p-4 rounded-lg border transition-all duration-300',
				isRegisted
					? 'bg-green-50/50 dark:bg-green-950/10 border-green-200/50'
					: 'bg-card hover:bg-white dark:hover:bg-secondary/30 hover:shadow-md cursor-pointer hover:border-primary/50'
			)}
			onClick={() => {
				if (!isRegisted && quota?.RegistAble && !quota?.isChanDSSVDK) {
					onSelectCourse(course);
				} else if (isRegisted) {
					showInfo('Học phần này đã được đăng ký.');
				} else {
					showError('Không thể đăng ký lúc này.');
				}
			}}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1">
					<div className="flex items-center flex-wrap gap-2 mb-2">
						<Badge variant="outline" className="text-xs bg-background">
							{course.CurriculumID}
						</Badge>
						<Badge variant="secondary" className="text-xs">
							{course.Credits} TC
						</Badge>
						{isRegisted && <Badge className="bg-green-600 text-white text-xs border-0">Đã đăng ký</Badge>}
						{(() => {
							if (!course.CurriculumID) return null;
							const key = String(course.CurriculumID).trim().toUpperCase();
							const academicData = academicLookup.get(key);
							if (!academicData) return null;

							const isEq = academicData.isEquivalentOf;
							const label = isEq ? `Đã học tương đương (${isEq})` : 'Đã học';

							return (
								<Badge
									className={cn(
										'text-xs border-0 gap-1.5 px-2 py-0.5 rounded-full shadow-sm',
										getGradeColor(academicData.DiemTK_Chu)
									)}
								>
									<Check className="w-3 h-3" />
									{label} ({academicData.DiemTK_10} • {academicData.DiemTK_Chu})
								</Badge>
							);
						})()}
					</div>
					<p
						className={cn(
							'font-medium',
							isRegisted ? 'text-green-700 dark:text-green-400 font-semibold' : ''
						)}
					>
						{course.CurriculumName}
					</p>
					{course.StudyUnitName && (
						<p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{course.StudyUnitName}</p>
					)}
				</div>
				{!isRegisted && quota?.RegistAble && !quota?.isChanDSSVDK && (
					<Button
						size="sm"
						className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
						asChild
					>
						<span>
							Chọn lịch <ChevronRight className="w-3 h-3 ml-1" />
						</span>
					</Button>
				)}
			</div>
		</div>
	);
}
