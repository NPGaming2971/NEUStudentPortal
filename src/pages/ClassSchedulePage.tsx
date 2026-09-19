import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
	getYearAndTerm,
	getWeekSchedule,
	getDrawingSchedules,
	getPeriorSchedules,
	getClassStudentForSchedules,
	getDrawingClassSchedule,
	type YearAndTermData,
	type YearAndTermItem,
	type Term,
	type Week,
	type ScheduleData,
	type PeriodScheduleItem,
	type ClassStudentOption,
	type ClassScheduleItem,
} from "@/services/scheduleService";
import { getStudentInfo } from "@/services/studentInfoService";
import {
	Loader2,
	AlertCircle,
	Calendar,
	ChevronLeft,
	ChevronRight,
	CalendarDays,
	Clock,
	MapPin,
	User,
	Users,
	List,
	LayoutGrid,
	Star,
	Download,
	BookOpen,
	GraduationCap,
} from "lucide-react";
import ScheduleExportDialog from "@/components/common/ScheduleExportDialog";
import { useGlobalNotification } from "@/hooks/useGlobalNotification";

type ViewMode = "week" | "period" | "class";

const TIME_BLOCKS = {
	B1_2: {
		start: 1,
		end: 2,
		label: "Tiết 1-2",
		time: "06:45 - 09:25",
		color: "bg-amber-500/10 border-amber-500/30",
	},
	B3_4: {
		start: 3,
		end: 4,
		label: "Tiết 3-4",
		time: "09:35 - 12:15",
		color: "bg-amber-500/10 border-amber-500/30",
	},
	B5_6: {
		start: 5,
		end: 6,
		label: "Tiết 5-6",
		time: "13:00 - 15:40",
		color: "bg-blue-500/10 border-blue-500/30",
	},
	B7_8: {
		start: 7,
		end: 8,
		label: "Tiết 7-8",
		time: "15:50 - 18:30",
		color: "bg-blue-500/10 border-blue-500/30",
	},
	B9_10: {
		start: 9,
		end: 10,
		label: "Tiết 9-10",
		time: "18:40 - 21:10",
		color: "bg-purple-500/10 border-purple-500/30",
	},
};

const DAYS_OF_WEEK = [
	"Thứ 2",
	"Thứ 3",
	"Thứ 4",
	"Thứ 5",
	"Thứ 6",
	"Thứ 7",
	"CN",
];

const VIEW_OPTIONS: { key: ViewMode; label: string; Icon: typeof Calendar }[] = [
	{ key: "week", label: "Theo tuần", Icon: LayoutGrid },
	{ key: "period", label: "Theo kỳ", Icon: List },
	{ key: "class", label: "Theo lớp", Icon: Users },
];

interface GridItem {
	DayOfWeek: number;
	PeriodID: number;
	NumberOfPeriods: number;
	PeriodName?: string;
	CurriculumName: string;
	RoomID?: string;
	BuildingName?: string;
	ProfessorName?: string;
	FullName?: string;
	TKHHienThi?: string;
	WeekScheduleID: number;
	Color?: string;
}

const findStudentClass = (
	options: ClassStudentOption[],
	lopSinhVien: string,
): ClassStudentOption | undefined => {
	const target = lopSinhVien.trim().toLowerCase();
	if (!target) return undefined;
	return options.find(
		(option) =>
			option.ClassStudentName.trim().toLowerCase() === target,
	);
};

function ClassSchedulePage() {
	const [yearTermData, setYearTermData] = useState<YearAndTermData | null>(
		null,
	);
	const [yearItems, setYearItems] = useState<YearAndTermItem[]>([]);
	const [terms, setTerms] = useState<Term[]>([]);
	const [weeks, setWeeks] = useState<Week[]>([]);
	const [schedule, setSchedule] = useState<ScheduleData | null>(null);
	const [selectedYear, setSelectedYear] = useState<string>("");
	const [selectedTerm, setSelectedTerm] = useState<string>("");
	const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
	const [currentWeekNum, setCurrentWeekNum] = useState<number | null>(null);
	const [viewMode, setViewMode] = useState<ViewMode>("week");

	const [periodSchedule, setPeriodSchedule] = useState<PeriodScheduleItem[]>(
		[],
	);
	const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);

	const [classOptions, setClassOptions] = useState<ClassStudentOption[]>([]);
	const [selectedClass, setSelectedClass] = useState<string>("");
	const [classSchedule, setClassSchedule] = useState<ClassScheduleItem[]>([]);
	const [isLoadingClasses, setIsLoadingClasses] = useState(false);
	const [isLoadingClassSchedule, setIsLoadingClassSchedule] = useState(false);
	const [classError, setClassError] = useState<string | null>(null);

	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
	const [scheduleError, setScheduleError] = useState<string | null>(null);
	const [exportOpen, setExportOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { showError } = useGlobalNotification();

	const parseDate = (dateStr: string): Date => {
		const [day, month, year] = dateStr.split("/").map(Number);
		return new Date(year, month - 1, day);
	};

	const findCurrentWeek = useCallback((weeksList: Week[]): Week | null => {
		const marked = weeksList.find(
			(week) => week.Week === week.CurrentWeek,
		);
		if (marked) {
			setCurrentWeekNum(marked.Week);
			return marked;
		}

		const today = new Date();
		const activeWeek = weeksList.find((week) => {
			const beginDate = parseDate(week.BeginDate);
			const endDate = parseDate(week.EndDate);
			return today >= beginDate && today <= endDate;
		});

		if (activeWeek) {
			setCurrentWeekNum(activeWeek.Week);
			return activeWeek;
		}

		const futureWeeks = weeksList.filter(
			(week) => parseDate(week.BeginDate) > today,
		);
		if (futureWeeks.length > 0) {
			setCurrentWeekNum(futureWeeks[0].Week);
			return futureWeeks[0];
		}

		if (weeksList.length > 0) {
			setCurrentWeekNum(weeksList[0].Week);
			return weeksList[0];
		}

		return null;
	}, []);

	const fetchYearAndTerm = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await getYearAndTerm();
			setYearTermData(data);
			setYearItems(
				data.items ?? [
					{
						YearStudy: data.CurrentYear,
						CurrentYear: data.CurrentYear,
						Terms: data.Terms,
					},
				],
			);
			setTerms(data.Terms ?? []);
			setSelectedYear(data.CurrentYear);
			setSelectedTerm(data.CurrentTerm);
		} catch (err) {
			console.error("Error:", err);
			setError("Không thể tải dữ liệu năm học và học kỳ");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchYearAndTerm();
	}, [fetchYearAndTerm]);

	// Reload term list + reset selected term when the year changes
	useEffect(() => {
		if (!selectedYear) return;
		const item = yearItems.find((i) => i.YearStudy === selectedYear);
		if (!item) return;
		setTerms(item.Terms ?? []);
		const fallbackTerm =
			item.Terms.find((t) => t.CurrentTerm)?.TermID ??
			item.Terms[0]?.TermID ??
			"";
		setSelectedTerm((prev) =>
			item.Terms.some((t) => t.TermID === prev) ? prev : fallbackTerm,
		);
	}, [selectedYear, yearItems]);

	useEffect(() => {
		if (!selectedYear || !selectedTerm) return;

		const fetchWeeks = async () => {
			try {
				const data = await getWeekSchedule(selectedYear);
				setWeeks(data);
				const currentWeek = findCurrentWeek(data);
				if (currentWeek) {
					setSelectedWeek(currentWeek.Week);
				}
			} catch (err) {
				console.error("Error:", err);
			}
		};
		fetchWeeks();
	}, [selectedYear, selectedTerm, findCurrentWeek]);

	// Week view
	const fetchSchedule = useCallback(async () => {
		if (!selectedYear || !selectedTerm || !selectedWeek) return;
		setIsLoadingSchedule(true);
		setScheduleError(null);
		try {
			const data = await getDrawingSchedules(
				selectedYear,
				selectedTerm,
				selectedWeek,
			);
			setSchedule(data);
		} catch (err) {
			console.error("Error:", err);
			setScheduleError("Không thể tải lịch học. Vui lòng thử lại sau.");
		} finally {
			setIsLoadingSchedule(false);
		}
	}, [selectedYear, selectedTerm, selectedWeek]);

	useEffect(() => {
		if (viewMode !== "week") return;
		fetchSchedule();
	}, [fetchSchedule, viewMode]);

	// Period (whole term) view
	useEffect(() => {
		if (viewMode !== "period" || !selectedYear || !selectedTerm) return;
		setIsLoadingPeriod(true);
		getPeriorSchedules(selectedYear, selectedTerm)
			.then((data) => setPeriodSchedule(data?.result ?? []))
			.catch((err) => {
				console.error("Error fetching perior schedules:", err);
				setPeriodSchedule([]);
				showError("Không thể tải lịch học theo kỳ. Vui lòng thử lại sau.");
			})
			.finally(() => setIsLoadingPeriod(false));
	}, [viewMode, selectedYear, selectedTerm, showError]);

	// Class view - class dropdown
	useEffect(() => {
		if (viewMode !== "class" || !selectedYear || !selectedTerm) return;
		setIsLoadingClasses(true);
		setClassError(null);
		getClassStudentForSchedules(selectedYear, selectedTerm)
			.then(async (data) => {
				const list = data ?? [];
				setClassOptions(list);

				let defaultId = list[0]?.ClassStudentID ?? "";
				try {
					const info = await getStudentInfo();
					const match = findStudentClass(
						list,
						info?.sinhVien?.LopSinhVien ?? "",
					);
					if (match) defaultId = match.ClassStudentID;
				} catch (err) {
					console.error("Error fetching student info:", err);
				}

				setSelectedClass((prev) =>
					prev && list.some((c) => c.ClassStudentID === prev)
						? prev
						: defaultId,
				);
			})
			.catch((err) => {
				console.error("Error fetching classes:", err);
				setClassOptions([]);
				setClassError("Không thể tải danh sách lớp. Vui lòng thử lại sau.");
			})
			.finally(() => setIsLoadingClasses(false));
	}, [viewMode, selectedYear, selectedTerm, showError]);

	// Class view - class schedule for selected class + week
	const fetchClassSchedule = useCallback(async () => {
		if (
			viewMode !== "class" ||
			!selectedYear ||
			!selectedTerm ||
			!selectedClass ||
			!selectedWeek
		)
			return;
		setIsLoadingClassSchedule(true);
		try {
			const data = await getDrawingClassSchedule(
				selectedClass,
				selectedYear,
				selectedTerm,
				selectedWeek,
			);
			setClassSchedule(data ?? []);
		} catch (err) {
			console.error("Error fetching class schedule:", err);
			setClassSchedule([]);
			showError("Không thể tải lịch học của lớp. Vui lòng thử lại sau.");
		} finally {
			setIsLoadingClassSchedule(false);
		}
	}, [viewMode, selectedYear, selectedTerm, selectedClass, selectedWeek, showError]);

	useEffect(() => {
		fetchClassSchedule();
	}, [fetchClassSchedule]);

	const handlePrevWeek = () => {
		const currentIndex = weeks.findIndex(
			(week) => week.Week === selectedWeek,
		);
		if (currentIndex > 0) {
			setSelectedWeek(weeks[currentIndex - 1].Week);
		}
	};

	const handleNextWeek = () => {
		const currentIndex = weeks.findIndex(
			(week) => week.Week === selectedWeek,
		);
		if (currentIndex < weeks.length - 1) {
			setSelectedWeek(weeks[currentIndex + 1].Week);
		}
	};

	const goToCurrentWeek = () => {
		if (currentWeekNum) {
			setSelectedWeek(currentWeekNum);
		}
	};

	const handleDownloadSchedule = () => {
		if (!selectedYear || !selectedTerm) {
			showError("Vui lòng chọn năm học và học kỳ");
			return;
		}
		setExportOpen(true);
	};

	const getScheduleItemsForDayAndBlock = (
		items: GridItem[],
		dayIndex: number,
		blockType: keyof typeof TIME_BLOCKS,
	): GridItem[] => {
		const { start, end } = TIME_BLOCKS[blockType];
		return items.filter(
			(item) =>
				item.DayOfWeek === dayIndex + 1 &&
				item.PeriodID >= start &&
				item.PeriodID <= end,
		);
	};

	const getScheduleItemsForDay = (items: GridItem[], dayIndex: number): GridItem[] => {
		return items
			.filter((item) => item.DayOfWeek === dayIndex + 1)
			.sort((a, b) => a.PeriodID - b.PeriodID);
	};

	const getPeriodLabel = (item: GridItem): string => {
		const start = item.PeriodID;
		const end = start + (item.NumberOfPeriods || 1) - 1;
		return `${start}-${end}`;
	};

	const getTooltipField = (item: GridItem, key: string): string => {
		const line = item.TKHHienThi?.split(/<br\s*\/?>/i).find((l) =>
			l.trim().startsWith(`-${key}:`),
		);
		return line ? line.replace(`-${key}:`, "").trim() : "";
	};

	const getTeacherName = (item: GridItem): string =>
		getTooltipField(item, "GV") ||
		item.ProfessorName ||
		item.FullName ||
		"—";

	const getRoomName = (item: GridItem): string => {
		const room = item.RoomID?.replace(/<br\s*\/?>/i, " - ") || "—";
		const building = item.BuildingName?.trim();
		if (!building || building === room) return room;
		return `${building} - ${room}`;
	};

	const renderScheduleItem = (item: GridItem) => {
		return (
			<div className='bg-primary/10 border border-primary/20 rounded-lg p-2 text-xs space-y-1'>
				<div className='font-semibold text-foreground line-clamp-2'>
					{item.CurriculumName}
				</div>
				<div className='flex items-center gap-1 text-muted-foreground'>
					<Clock className='w-3 h-3' />
					<span>
						Tiết {item.PeriodName || getPeriodLabel(item)}
					</span>
				</div>
				<div className='flex items-center gap-1 text-muted-foreground'>
					<MapPin className='w-3 h-3' />
					<span>{getRoomName(item)}</span>
				</div>
				<div className='flex items-center gap-1 text-muted-foreground'>
					<User className='w-3 h-3' />
					<span>{getTeacherName(item)}</span>
				</div>
			</div>
		);
	};

	const renderGrid = (items: GridItem[], weekLabel: string) => (
		<Card>
			<CardHeader className='pb-3'>
				<CardTitle className='flex items-center gap-2 text-base'>
					<Calendar className='h-5 w-5 text-primary' />
					<span>{weekLabel}</span>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{items.length === 0 ? (
					<div className='text-center py-12 text-sm text-muted-foreground'>
						Không có lịch học trong tuần này
					</div>
				) : (
					<>
						{/* Desktop Table View */}
						<div className='hidden md:block overflow-x-auto'>
							<table className='w-full text-sm border-collapse'>
								<thead>
									<tr className='bg-muted/50'>
										<th className='p-2 text-left font-medium border w-24'>
											Buổi
										</th>
										{DAYS_OF_WEEK.map((day, index) => (
											<th
												key={index}
												className='p-2 text-center font-medium border min-w-[120px]'
											>
												{day}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{Object.entries(TIME_BLOCKS).map(
										([block, { label, time, color }]) => (
											<tr key={block}>
												<td
													className={cn(
														"p-2 border font-medium",
														color,
													)}
												>
													<div>{label}</div>
													<div className='text-xs text-muted-foreground'>
														({time})
													</div>
												</td>
												{DAYS_OF_WEEK.map(
													(_, dayIndex) => {
														const blockItems =
															getScheduleItemsForDayAndBlock(
																items,
																dayIndex,
																block as keyof typeof TIME_BLOCKS,
															);
														return (
															<td
																key={dayIndex}
																className='p-1 border align-top'
															>
																<div className='space-y-1'>
																	{blockItems.map(
																		(
																			item,
																			idx,
																		) => (
																			<div
																				key={
																					idx
																				}
																			>
																				{renderScheduleItem(
																					item,
																				)}
																			</div>
																		),
																	)}
																</div>
															</td>
														);
													},
												)}
											</tr>
										),
									)}
								</tbody>
							</table>
						</div>

						{/* Mobile View - Daily Cards */}
						<div className='md:hidden space-y-4'>
							{DAYS_OF_WEEK.map((day, dayIndex) => {
								const dayItems =
									getScheduleItemsForDay(items, dayIndex);
								const hasClasses = dayItems.length > 0;

								return (
									<div
										key={dayIndex}
										className='border rounded-lg overflow-hidden'
									>
										<div
											className={cn(
												"px-3 py-2 font-medium text-sm",
												hasClasses
													? "bg-primary text-primary-foreground"
													: "bg-muted text-muted-foreground",
											)}
										>
											{day}
											{hasClasses && (
												<span className='ml-2 text-xs opacity-80'>
													({dayItems.length} môn)
												</span>
											)}
										</div>
										<div className='p-2'>
											{hasClasses ? (
												<div className='space-y-2'>
													{dayItems.map((item) => {
														const blockType =
															item.PeriodID <= 2
																? "B1_2"
																: item.PeriodID <= 4
																	? "B3_4"
																	: item.PeriodID <= 6
																		? "B5_6"
																		: item.PeriodID <= 8
																			? "B7_8"
																			: "B9_10";
														const blockInfo =
															TIME_BLOCKS[blockType];

														return (
															<div
																key={
																	item.WeekScheduleID
																}
																className={cn(
																	"border rounded-lg p-3 space-y-2",
																	blockInfo.color,
																)}
															>
																<div className='flex items-start justify-between gap-2'>
																	<h4 className='font-semibold text-sm leading-tight flex-1'>
																		{
																			item.CurriculumName
																		}
																	</h4>
																	<span className='text-xs px-2 py-0.5 bg-background/50 rounded font-medium flex-shrink-0'>
																		{
																			blockInfo.label
																		}
																	</span>
																</div>
																<div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
																	<div className='flex items-center gap-1.5'>
																		<Clock className='w-3 h-3' />
																		<span>
																			Tiết{" "}
																			{item.PeriodName ||
																				getPeriodLabel(
																					item,
																				)}
																		</span>
																	</div>
																	<div className='flex items-center gap-1.5'>
																		<MapPin className='w-3 h-3' />
																		<span>
																			{getRoomName(
																				item,
																			)}
																		</span>
																	</div>
																</div>
																<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
																	<User className='w-3 h-3' />
																	<span>
																		{getTeacherName(
																			item,
																		)}
																	</span>
																</div>
															</div>
														);
													})}
												</div>
											) : (
												<div className='text-center py-4 text-sm text-muted-foreground'>
													Không có lịch học
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);

	const renderPeriodSchedule = () => {
		if (isLoadingPeriod) {
			return (
				<div className='flex items-center justify-center py-12'>
					<Loader2 className='w-8 h-8 animate-spin text-primary' />
				</div>
			);
		}

		if (periodSchedule.length === 0) {
			return (
				<Card>
					<CardContent className='py-12 text-center text-sm text-muted-foreground'>
						Không có lịch học trong học kỳ này
					</CardContent>
				</Card>
			);
		}

		const courses = periodSchedule.reduce<
			Record<string, { MaLHP: string; TenHP: string; SoTC: number; sessions: PeriodScheduleItem[] }>
		>((acc, session) => {
			const key = session.MaLHP;
			if (!acc[key]) {
				acc[key] = {
					MaLHP: session.MaLHP,
					TenHP: session.TenHP,
					SoTC: session.SoTC,
					sessions: [],
				};
			}
			acc[key].sessions.push(session);
			return acc;
		}, {});

		const courseList = Object.values(courses);

		const getLoaiBadge = (type: string) => {
			if (!type) return null;
			return (
				<Badge
					variant='outline'
					className={cn(
						"shrink-0 border-0 px-2 py-0.5 text-xs font-medium",
						type === "Thảo luận"
							? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
							: type === "Thực hành"
								? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
								: "bg-green-500/10 text-green-600 dark:text-green-400",
					)}
				>
					{type}
				</Badge>
			);
		};

		const cleanTuanHoc = (value: string): string =>
			value.replace(/\s*\)\s*$/, "").trim() || "—";

		const getTeacher = (session: PeriodScheduleItem): string =>
			session.HoTenGV
				?.replace(/\(Email:[^)]*\)/i, "")
				.trim() || "—";

		return (
			<div className='space-y-4'>
				{/* Summary */}
				<div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
					<Card>
						<CardContent className='flex items-center gap-3 p-4'>
							<span className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
								<BookOpen className='h-5 w-5 text-primary' />
							</span>
							<div>
								<p className='text-2xl font-bold text-foreground'>
									{courseList.length}
								</p>
								<p className='text-xs text-muted-foreground'>
									Môn học
								</p>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className='flex items-center gap-3 p-4'>
							<span className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
								<GraduationCap className='h-5 w-5 text-primary' />
							</span>
							<div>
								<p className='text-2xl font-bold text-foreground'>
									{courseList.reduce(
										(sum, c) => sum + (c.SoTC || 0),
										0,
									)}
								</p>
								<p className='text-xs text-muted-foreground'>
									Tổng tín chỉ
								</p>
							</div>
						</CardContent>
					</Card>
					<Card className='col-span-2 md:col-span-1'>
						<CardContent className='flex items-center gap-3 p-4'>
							<span className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
								<Calendar className='h-5 w-5 text-primary' />
							</span>
							<div>
								<p className='text-2xl font-bold text-foreground'>
									{periodSchedule.length}
								</p>
								<p className='text-xs text-muted-foreground'>
									Buổi học
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{courseList.map((course) => (
					<Card key={course.MaLHP} className='overflow-hidden'>
						<CardHeader className='border-b border-border/60 py-3.5'>
							<div className='flex items-center justify-between gap-3'>
								<div className='flex items-center gap-3 min-w-0'>
									<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
										<BookOpen className='h-5 w-5' />
									</span>
									<div className='min-w-0'>
										<CardTitle className='truncate text-base'>
											{course.TenHP}
										</CardTitle>
										<p className='truncate text-xs text-muted-foreground'>
											{course.MaLHP} · {course.SoTC}{" "}
											tín chỉ
										</p>
									</div>
								</div>
								<Badge variant='secondary' className='shrink-0'>
									{course.sessions.length} buổi
								</Badge>
							</div>
						</CardHeader>

						{/* Desktop table */}
						<div className='hidden md:block'>
							<div className='grid grid-cols-[130px_96px_160px_1fr_200px] gap-3 border-b border-border/60 bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
								<span>Ngày / ca</span>
								<span>Loại</span>
								<span>Phòng</span>
								<span>Thời gian học</span>
								<span>Giảng viên</span>
							</div>
							<ul>
								{course.sessions.map((session, idx) => (
									<li
										key={idx}
										className='grid grid-cols-[130px_96px_160px_1fr_200px] items-center gap-3 border-b border-border/40 px-4 py-3 text-sm last:border-0 hover:bg-muted/20 transition-colors'
									>
										<div>
											<p className='font-medium text-foreground'>
												{session.Thu || "—"}
											</p>
											<p className='text-xs text-muted-foreground'>
												Ca {session.CaHoc || "—"}
											</p>
										</div>
										<div>{getLoaiBadge(session.LoaiHP)}</div>
										<div className='flex items-center gap-1.5 text-muted-foreground'>
											<MapPin className='h-3.5 w-3.5 shrink-0' />
											<span className='truncate'>
												{session.Phong || "—"}
											</span>
										</div>
										<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
											<Calendar className='h-3.5 w-3.5 shrink-0' />
											<span className='truncate'>
												{cleanTuanHoc(session.TuanHoc)}
											</span>
										</div>
										<div className='flex items-center gap-1.5 text-muted-foreground'>
											<User className='h-3.5 w-3.5 shrink-0' />
											<span className='truncate'>
												{getTeacher(session)}
											</span>
										</div>
									</li>
								))}
							</ul>
						</div>

						{/* Mobile cards */}
						<div className='md:hidden space-y-2 p-3'>
							{course.sessions.map((session, idx) => (
								<div
									key={idx}
									className='rounded-lg border border-border bg-card p-3 space-y-2'
								>
									<div className='flex items-center justify-between gap-2'>
										<div>
											<p className='text-sm font-medium text-foreground'>
												{session.Thu || "—"}
											</p>
											<p className='text-xs text-muted-foreground'>
												Ca {session.CaHoc || "—"}
											</p>
										</div>
										{getLoaiBadge(session.LoaiHP)}
									</div>
									<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
										<MapPin className='h-3.5 w-3.5 shrink-0' />
										<span>{session.Phong || "—"}</span>
									</div>
									<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
										<Calendar className='h-3.5 w-3.5 shrink-0' />
										<span>{cleanTuanHoc(session.TuanHoc)}</span>
									</div>
									<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
										<User className='h-3.5 w-3.5 shrink-0' />
										<span>{getTeacher(session)}</span>
									</div>
								</div>
							))}
						</div>
					</Card>
				))}
			</div>
		);
	};

	const renderClassSchedule = () => {
		if (isLoadingClasses) {
			return (
				<div className='flex items-center justify-center py-12'>
					<Loader2 className='w-8 h-8 animate-spin text-primary' />
				</div>
			);
		}

		if (classError) {
			return (
				<Card>
					<CardContent className='py-12 text-center'>
						<p className='text-destructive mb-4'>{classError}</p>
						<Button
							variant='outline'
							onClick={() => {
								setViewMode("period");
								setTimeout(() => setViewMode("class"), 0);
							}}
						>
							Thử lại
						</Button>
					</CardContent>
				</Card>
			);
		}

		if (classOptions.length === 0) {
			return (
				<Card>
					<CardContent className='py-12 text-center text-sm text-muted-foreground'>
						Không có danh sách lớp cho học kỳ này
					</CardContent>
				</Card>
			);
		}

		const weekLabel =
			weeks.find((w) => w.Week === selectedWeek)
				? `Tuần ${selectedWeek} (${weeks.find((w) => w.Week === selectedWeek)?.BeginDate} - ${weeks.find((w) => w.Week === selectedWeek)?.EndDate})`
				: "";

		return (
			<div className='space-y-4'>
				<Select
					value={selectedClass}
					onValueChange={setSelectedClass}
				>
					<SelectTrigger className='w-full md:w-[380px]'>
						<SelectValue placeholder='Chọn lớp' />
					</SelectTrigger>
					<SelectContent>
						{classOptions.map((option) => (
							<SelectItem
								key={option.ClassStudentID}
								value={option.ClassStudentID}
							>
								{option.ClassStudentName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{selectedClass && selectedWeek && (
					<div className='relative'>
						{isLoadingClassSchedule ? (
							<div className='flex items-center justify-center py-12'>
								<Loader2 className='w-8 h-8 animate-spin text-primary' />
							</div>
						) : (
							renderGrid(classSchedule, weekLabel)
						)}
					</div>
				)}
			</div>
		);
	};

	if (isLoading) {
		return (
			<div className='flex items-center justify-center min-h-[60vh]'>
				<div className='text-center space-y-4'>
					<Loader2 className='w-12 h-12 animate-spin text-primary mx-auto' />
					<p className='text-muted-foreground'>
						Đang tải thời khóa biểu...
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex items-center justify-center min-h-[60vh]'>
				<Card className='max-w-md w-full'>
					<CardContent className='pt-6'>
						<div className='text-center space-y-4'>
							<AlertCircle className='w-12 h-12 text-destructive mx-auto' />
							<p className='text-destructive'>{error}</p>
							<Button
								onClick={() => fetchYearAndTerm()}
								variant='outline'
							>
								Thử lại
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const currentWeekData = weeks.find((w) => w.Week === selectedWeek);
	const showWeekNav = viewMode === "week" || viewMode === "class";

	return (
		<div className='space-y-4'>
			{/* Page Header */}
			<div className='flex flex-wrap items-start justify-between gap-3'>
				<div>
					<h1 className='text-2xl md:text-3xl font-bold text-foreground'>
						Thời khóa biểu
					</h1>
					<p className='text-sm text-muted-foreground'>
						Xem lịch học theo tuần, theo kỳ hoặc theo lớp
					</p>
				</div>
				<Button
					variant='outline'
					onClick={handleDownloadSchedule}
					disabled={!selectedYear || !selectedTerm}
					className='gap-2'
				>
					<Download className='w-4 h-4' />
					Tải lịch học (.ics)
				</Button>
			</div>

			{/* Filters */}
			<div className='flex flex-col md:flex-row gap-4'>
				{/* Year and Term Selectors */}
				<div className='flex flex-col sm:flex-row gap-3 shrink-0'>
					<Select
						value={selectedYear}
						onValueChange={setSelectedYear}
					>
						<SelectTrigger className='w-full sm:w-[180px]'>
							<SelectValue placeholder='Chọn năm học' />
						</SelectTrigger>
						<SelectContent>
							{yearTermData?.YearStudy.map((year) => (
								<SelectItem key={year} value={year}>
									Năm học {year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={selectedTerm}
						onValueChange={setSelectedTerm}
					>
						<SelectTrigger className='w-full sm:w-[150px]'>
							<SelectValue placeholder='Chọn học kỳ' />
						</SelectTrigger>
						<SelectContent>
							{terms.map((term) => (
								<SelectItem
									key={term.TermID}
									value={term.TermID}
								>
									{term.TermName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* View Mode Switcher */}
				<div className='flex items-center rounded-lg border border-border bg-muted/40 p-0.5 w-full sm:w-auto sm:ml-auto'>
					{VIEW_OPTIONS.map(({ key, label, Icon }) => (
						<button
							key={key}
							type='button'
							onClick={() => setViewMode(key)}
							className={cn(
								"flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
								viewMode === key
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon className='w-4 h-4' />
							<span className='hidden sm:inline'>{label}</span>
						</button>
					))}
				</div>
			</div>

			{/* Week Navigation (week & class views) */}
			{showWeekNav && (
				<div className='flex items-center gap-2 w-full md:w-auto'>
					<Button
						variant='outline'
						size='icon'
						onClick={goToCurrentWeek}
						disabled={selectedWeek === currentWeekNum}
						title='Về tuần hiện tại'
						className='flex-shrink-0'
					>
						<CalendarDays className='w-4 h-4' />
					</Button>
					<Button
						variant='outline'
						size='icon'
						onClick={handlePrevWeek}
						disabled={
							weeks.findIndex(
								(w) => w.Week === selectedWeek,
							) === 0
						}
						className='flex-shrink-0'
					>
						<ChevronLeft className='w-4 h-4' />
					</Button>

					<Select
						value={selectedWeek?.toString() || ""}
						onValueChange={(val) =>
							setSelectedWeek(parseInt(val))
						}
					>
						<SelectTrigger className='flex-1 md:w-[280px] md:flex-none min-w-0'>
							<SelectValue placeholder='Chọn tuần' />
						</SelectTrigger>
						<SelectContent>
							{weeks.map((week) => (
								<SelectItem
									key={week.Week}
									value={week.Week.toString()}
								>
									<span className='flex items-center gap-1'>
										Tuần {week.Week} (
										{week.WeekDisPlay})
										{week.Week ===
											currentWeekNum && (
											<Star className='w-3 h-3 fill-amber-400 text-amber-400' />
										)}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button
						variant='outline'
						size='icon'
						onClick={handleNextWeek}
						disabled={
							weeks.findIndex(
								(w) => w.Week === selectedWeek,
							) ===
							weeks.length - 1
						}
						className='flex-shrink-0'
					>
						<ChevronRight className='w-4 h-4' />
					</Button>
				</div>
			)}

			{/* Content by view */}
			{viewMode === "week" && (
				<>
					{isLoadingSchedule ? (
						<div className='flex items-center justify-center py-12'>
							<Loader2 className='w-8 h-8 animate-spin text-primary' />
						</div>
					) : scheduleError ? (
						<div className='text-center py-12'>
							<p className='text-destructive mb-4'>
								{scheduleError}
							</p>
							<Button
								variant='outline'
								onClick={fetchSchedule}
							>
								Thử lại
							</Button>
						</div>
					) : (
						renderGrid(
							schedule?.ResultDataSchedule ?? [],
							currentWeekData
								? `Tuần ${selectedWeek} (${currentWeekData.BeginDate} - ${currentWeekData.EndDate})`
								: `Tuần ${selectedWeek}`,
						)
					)}
				</>
			)}

			{viewMode === "period" && renderPeriodSchedule()}

			{viewMode === "class" && renderClassSchedule()}

			<ScheduleExportDialog
				open={exportOpen}
				onOpenChange={setExportOpen}
				currentYear={selectedYear}
				currentTerm={selectedTerm}
				yearItems={yearItems}
			/>
		</div>
	);
}

export default ClassSchedulePage;