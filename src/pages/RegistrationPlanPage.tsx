import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
	Loader2,
	AlertCircle,
	BookOpen,
	Calendar,
	GraduationCap,
	ClipboardCheck,
	BookMarked,
	Check,
	RefreshCw,
	Info,
	Clock,
	ListChecks
} from 'lucide-react';
import { initializeRegistrationSession } from '@/services/registrationAuthService';
import {
	getAllStudyProgramsForPlan,
	getPlanRegistSemesterQuota,
	getAllStudyTypes,
	getAllClassesRegisteredPlan,
	getAllClassesAllowedPlan,
	insertScheduleStudyUnitPlan,
	removeScheduleStudyUnitPlan,
	type StudyProgram,
	type RegistSemesterQuota,
	type StudyType,
	type CurriculumTypeGroup,
	type RegisteredClass,
	type ClassStudyUnitPlan
} from '@/services/registrationService';
import { useGlobalNotification } from '@/hooks/useGlobalNotification';

function RegistrationPlanPage() {
	const { showError, showInfo, showSuccess } = useGlobalNotification();

	// State for data
	const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
	const [selectedProgramId, setSelectedProgramId] = useState<string>('');
	const [quota, setQuota] = useState<RegistSemesterQuota | null>(null);
	const [studyTypes, setStudyTypes] = useState<StudyType[]>([]);
	const [selectedStudyType, setSelectedStudyType] = useState<string>('');
	const [registeredClasses, setRegisteredClasses] = useState<RegisteredClass[]>([]);
	const [allowedClasses, setAllowedClasses] = useState<CurriculumTypeGroup[]>([]);
	const [registeringCourseId, setRegisteringCourseId] = useState<string | null>(null);
	const [cancelingCourseId, setCancelingCourseId] = useState<string | null>(null);

	// Loading states
	const [isInitializing, setIsInitializing] = useState(true);
	const [isLoadingQuota, setIsLoadingQuota] = useState(false);
	const [isLoadingClasses, setIsLoadingClasses] = useState(false);

	// Filter available study types based on quota settings
	const availableStudyTypes = useMemo(() => {
		if (!quota || !studyTypes.length) return [];

		return studyTypes.filter((type) => {
			if (!type.MapID) return false;
			// Check if the study type is enabled in quota
			const quotaKey = type.MapID as keyof RegistSemesterQuota;
			const value = quota[quotaKey];
			// Handle both boolean and number (1/0) values
			return value === true || value === 1;
		});
	}, [quota, studyTypes]);

	// Initialize session and fetch programs
	useEffect(() => {
		const initialize = async () => {
			try {
				await initializeRegistrationSession();

				const [programs, types] = await Promise.all([getAllStudyProgramsForPlan(), getAllStudyTypes()]);

				setStudyPrograms(programs);
				setStudyTypes(types);

				if (programs.length > 0) {
					setSelectedProgramId(programs[0].StudyProgramID);
				}
			} catch (err) {
				console.error('Error initializing:', err);
				showError('Không thể kết nối đến hệ thống đăng ký');
			} finally {
				setIsInitializing(false);
			}
		};

		initialize();
	}, [showError]);

	// Fetch quota when program changes
	useEffect(() => {
		if (!selectedProgramId) return;

		const fetchQuota = async () => {
			setIsLoadingQuota(true);
			try {
				const quotaData = await getPlanRegistSemesterQuota(selectedProgramId);
				setQuota(quotaData);

				// Auto-select first available study type
				if (quotaData) {
					const firstAvailable = studyTypes.find((type) => {
						if (!type.MapID) return false;
						const quotaKey = type.MapID as keyof RegistSemesterQuota;
						const value = quotaData[quotaKey];
						return value === true || value === 1;
					});
					if (firstAvailable) {
						setSelectedStudyType(firstAvailable.LoaiHinh);
					}
				}
			} catch (err) {
				console.error('Error fetching quota:', err);
				showError('Không thể tải cấu hình đăng ký');
			} finally {
				setIsLoadingQuota(false);
			}
		};

		fetchQuota();
	}, [selectedProgramId, studyTypes, showError]);

	useEffect(() => {
		if (!selectedProgramId || !selectedStudyType || !quota?.YearStudy || !quota?.TermID) return;

		const fetchClasses = async () => {
			setIsLoadingClasses(true);
			try {
				const [registered, allowed] = await Promise.all([
					getAllClassesRegisteredPlan(quota.YearStudy, quota.TermID),
					getAllClassesAllowedPlan(selectedProgramId, selectedStudyType, quota.YearStudy, quota.TermID)
				]);

				setRegisteredClasses(registered);
				setAllowedClasses(allowed);
			} catch (err) {
				console.error('Error fetching classes:', err);
				showError('Không thể tải danh sách học phần');
			} finally {
				setIsLoadingClasses(false);
			}
		};

		fetchClasses();
	}, [selectedProgramId, selectedStudyType, quota?.YearStudy, quota?.TermID, showError]);

	// Calculate summary
	const summary = useMemo(() => {
		const totalRegistered = registeredClasses.length;
		const totalCredits = registeredClasses.reduce((sum, c) => sum + (c.Credits || 0), 0);
		const totalAvailable = allowedClasses.reduce(
			(sum, group) => sum + group.ClassStudyUnitPlans.reduce((s, plan) => s + plan.Selections.length, 0),
			0
		);

		return { totalRegistered, totalCredits, totalAvailable };
	}, [registeredClasses, allowedClasses]);

	const handleRefresh = async () => {
		if (!selectedProgramId || !quota) return;
		setIsLoadingClasses(true);
		try {
			const [registered, allowed] = await Promise.all([
				getAllClassesRegisteredPlan(quota.YearStudy, quota.TermID),
				getAllClassesAllowedPlan(selectedProgramId, selectedStudyType, quota.YearStudy, quota.TermID)
			]);
			setRegisteredClasses(registered);
			setAllowedClasses(allowed);
			showInfo('Đã làm mới dữ liệu');
		} catch {
			showError('Không thể làm mới dữ liệu');
		} finally {
			setIsLoadingClasses(false);
		}
	};

	// Handle course registration
	const handleRegisterCourse = async (course: ClassStudyUnitPlan) => {
		if (!quota || !selectedProgramId || !selectedStudyType) {
			showError('Thiếu thông tin đăng ký');
			return;
		}

		setRegisteringCourseId(course.CurriculumID);
		try {
			const message = await insertScheduleStudyUnitPlan(
				[course],
				selectedStudyType,
				quota.YearStudy,
				quota.TermID,
				selectedProgramId
			);
			showSuccess(typeof message === 'string' ? message : `Đã đăng ký ${course.CurriculumName}`);

			// Refresh data after successful registration
			const [registered, allowed] = await Promise.all([
				getAllClassesRegisteredPlan(quota.YearStudy, quota.TermID),
				getAllClassesAllowedPlan(selectedProgramId, selectedStudyType, quota.YearStudy, quota.TermID)
			]);
			setRegisteredClasses(registered);
			setAllowedClasses(allowed);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Đăng ký thất bại';
			showError(errorMessage);
		} finally {
			setRegisteringCourseId(null);
		}
	};

	// Handle course cancellation
	const handleCancelCourse = async (course: ClassStudyUnitPlan) => {
		if (!quota || !selectedProgramId || !selectedStudyType) {
			showError('Thiếu thông tin hủy đăng ký');
			return;
		}

		setCancelingCourseId(course.CurriculumID);
		try {
			const message = await removeScheduleStudyUnitPlan(
				[
					{
						CurriculumID: course.CurriculumID,
						CurriculumName: course.CurriculumName,
						Credits: course.Credits,
						IsDelete: true,
						IsRegisted: true
					}
				],
				selectedStudyType,
				quota.YearStudy,
				quota.TermID,
				selectedProgramId
			);
			showSuccess(typeof message === 'string' ? message : `Đã hủy đăng ký ${course.CurriculumName}`);

			// Refresh data after successful cancellation
			const [registered, allowed] = await Promise.all([
				getAllClassesRegisteredPlan(quota.YearStudy, quota.TermID),
				getAllClassesAllowedPlan(selectedProgramId, selectedStudyType, quota.YearStudy, quota.TermID)
			]);
			setRegisteredClasses(registered);
			setAllowedClasses(allowed);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Hủy đăng ký thất bại';
			showError(errorMessage);
		} finally {
			setCancelingCourseId(null);
		}
	};

	if (isInitializing) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center space-y-4">
					<Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
					<p className="text-muted-foreground">Đang kết nối hệ thống đăng ký...</p>
				</div>
			</div>
		);
	}

	if (studyPrograms.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Card className="max-w-md w-full border-destructive/50">
					<CardContent className="pt-6">
						<div className="text-center space-y-4">
							<AlertCircle className="w-12 h-12 text-destructive mx-auto" />
							<p className="text-destructive">Không tìm thấy chương trình đào tạo nào</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl md:text-3xl font-bold text-foreground">Đăng ký kế hoạch học tập</h1>
				<p className="text-sm text-muted-foreground">Đăng ký học phần theo kế hoạch đào tạo</p>
			</div>

			{/* Filters */}
			<Card className="border-0 shadow-lg">
				<CardContent className="py-4">
					<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
						<div className="flex-1 min-w-[200px]">
							<label className="text-xs text-muted-foreground mb-1 block">Chương trình đào tạo</label>
							<Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
								<SelectTrigger className="w-full">
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

						<Button
							variant="outline"
							size="icon"
							className="mt-5"
							onClick={handleRefresh}
							disabled={isLoadingClasses}
						>
							<RefreshCw className={cn('h-4 w-4', isLoadingClasses && 'animate-spin')} />
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Study Type Tabs */}
			{availableStudyTypes.length > 0 && (
				<Tabs value={selectedStudyType} onValueChange={setSelectedStudyType} className="w-full">
					<TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
						{availableStudyTypes.map((type) => (
							<TabsTrigger
								key={type.ChucNangID}
								value={type.LoaiHinh}
								className="flex-1 min-w-[120px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
							>
								{type.TenChucNang}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			)}

			{/* Quota Info */}
			{quota && (
				<Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
					<CardContent className="py-4">
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4 text-primary" />
								<div>
									<p className="text-xs text-muted-foreground">Năm học</p>
									<p className="font-semibold">{quota.YearStudy}</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<BookOpen className="w-4 h-4 text-primary" />
								<div>
									<p className="text-xs text-muted-foreground">Học kỳ</p>
									<p className="font-semibold">{quota.TermID}</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Clock className="w-4 h-4 text-primary" />
								<div>
									<p className="text-xs text-muted-foreground">Bắt đầu</p>
									<p className="font-semibold text-sm">{quota.BeginDate?.split(' ')[0]}</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Clock className="w-4 h-4 text-primary" />
								<div>
									<p className="text-xs text-muted-foreground">Kết thúc</p>
									<p className="font-semibold text-sm">{quota.EndDate?.split(' ')[0]}</p>
								</div>
							</div>
						</div>

						{!quota.RegistAble && (
							<div className="mt-4 p-3 bg-destructive/10 rounded-lg flex items-center gap-2">
								<AlertCircle className="w-4 h-4 text-destructive" />
								<p className="text-sm text-destructive">
									{quota.RegistAbleDescr || 'Hiện không trong thời gian đăng ký'}
								</p>
							</div>
						)}

						{quota.RegistAble && (
							<div className="mt-4 p-3 bg-green-500/10 rounded-lg flex items-center gap-2">
								<Check className="w-4 h-4 text-green-600" />
								<p className="text-sm text-green-600">Hệ thống đang mở đăng ký</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Summary Cards */}
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

			{/* Available Classes */}
			<Card className="border-0 shadow-lg">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="h-5 w-5 text-primary" />
						Học phần có thể đăng ký
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoadingClasses || isLoadingQuota ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="w-8 h-8 animate-spin text-primary" />
						</div>
					) : allowedClasses.length === 0 ? (
						<div className="text-center py-12">
							<BookMarked className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
							<p className="text-muted-foreground">Không có học phần nào</p>
							<p className="text-sm text-muted-foreground mt-1">Vui lòng chọn loại đăng ký khác</p>
						</div>
					) : (
						<Accordion
							type="multiple"
							className="w-full"
							defaultValue={allowedClasses.map((_, i) => `group-${i}`)}
						>
							{allowedClasses.map((group, groupIndex) => (
								<AccordionItem key={groupIndex} value={`group-${groupIndex}`}>
									<AccordionTrigger className="hover:no-underline">
										<div className="flex items-center gap-2">
											<Badge
												variant={
													group.CurriculumTypeGroupName === 'Bắt buộc'
														? 'default'
														: 'secondary'
												}
											>
												{group.CurriculumTypeGroupName}
											</Badge>
											<span className="text-sm text-muted-foreground">
												(
												{group.ClassStudyUnitPlans.reduce((s, p) => s + p.Selections.length, 0)}{' '}
												học phần)
											</span>
										</div>
									</AccordionTrigger>
									<AccordionContent>
										<div className="space-y-3 pt-2">
											{group.ClassStudyUnitPlans.map((plan, planIndex) => (
												<div key={planIndex}>
													{plan.SelectionName && (
														<p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
															<Info className="w-3 h-3" />
															{plan.SelectionName}
														</p>
													)}
													<div className="grid gap-2">
														{plan.Selections.map(
															(course: ClassStudyUnitPlan, courseIndex: number) => (
																<CourseCard
																	key={courseIndex}
																	course={course}
																	registrable={
																		quota?.RegistAble && !quota?.isChanDSSVDK
																	}
																	cancelable={quota?.IsDelete}
																	onRegister={handleRegisterCourse}
																	onCancel={handleCancelCourse}
																	isRegistering={
																		registeringCourseId === course.CurriculumID
																	}
																	isCanceling={
																		cancelingCourseId === course.CurriculumID
																	}
																/>
															)
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
				</CardContent>
			</Card>
		</div>
	);
}

// Course Card Component
interface CourseCardProps {
	course: ClassStudyUnitPlan;
	registrable?: boolean;
	cancelable?: boolean;
	onRegister?: (course: ClassStudyUnitPlan) => void;
	onCancel?: (course: ClassStudyUnitPlan) => void;
	isRegistering?: boolean;
	isCanceling?: boolean;
}

function CourseCard({
	course,
	registrable,
	cancelable,
	onRegister,
	onCancel,
	isRegistering,
	isCanceling
}: CourseCardProps) {
	return (
		<div
			className={cn(
				'p-4 rounded-lg border transition-colors',
				course.IsRegisted
					? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
					: 'bg-card hover:bg-secondary/50'
			)}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-1">
						<Badge variant="outline" className="text-xs">
							{course.CurriculumID}
						</Badge>
						<Badge variant="secondary" className="text-xs">
							{course.Credits} TC
						</Badge>
						{course.IsRegisted && <Badge className="bg-green-600 text-xs">Đã đăng ký</Badge>}
					</div>
					<p className="font-medium">{course.CurriculumName}</p>
					{course.TenChuyenNganh && (
						<p className="text-sm text-muted-foreground mt-1">Chuyên ngành: {course.TenChuyenNganh}</p>
					)}
				</div>

				{!course.IsRegisted && course.IsInsert && registrable && (
					<Button
						size="sm"
						className="flex-shrink-0"
						onClick={() => onRegister?.(course)}
						disabled={isRegistering}
					>
						{isRegistering ? (
							<>
								<Loader2 className="w-4 h-4 mr-1 animate-spin" />
								Đang đăng ký...
							</>
						) : (
							'Đăng ký'
						)}
					</Button>
				)}

				{course.IsRegisted && cancelable && (
					<Button
						variant="destructive"
						size="sm"
						className="flex-shrink-0"
						onClick={() => onCancel?.(course)}
						disabled={isCanceling}
					>
						{isCanceling ? (
							<>
								<Loader2 className="w-4 h-4 mr-1 animate-spin" />
								Đang hủy...
							</>
						) : (
							'Hủy đăng ký'
						)}
					</Button>
				)}
			</div>
		</div>
	);
}

export default RegistrationPlanPage;
