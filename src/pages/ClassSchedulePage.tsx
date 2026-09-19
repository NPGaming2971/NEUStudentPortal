import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	type YearAndTermData,
	type Week,
	type ScheduleData,
	type ScheduleItem,
} from "@/services/scheduleService";
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
	Star,
	Download,
} from "lucide-react";
import { downloadSchedule } from "@/utils/downloadHelper";
import { useGlobalNotification } from "@/hooks/useGlobalNotification";

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

function ClassSchedulePage() {
	const [yearTermData, setYearTermData] = useState<YearAndTermData | null>(
		null,
	);
	const [weeks, setWeeks] = useState<Week[]>([]);
	const [schedule, setSchedule] = useState<ScheduleData | null>(null);
	const [selectedYear, setSelectedYear] = useState<string>("");
	const [selectedTerm, setSelectedTerm] = useState<string>("");
	const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
	const [currentWeekNum, setCurrentWeekNum] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
	const [scheduleError, setScheduleError] = useState<string | null>(null);
	const [isDownloading, setIsDownloading] = useState(false);
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
		fetchSchedule();
	}, [fetchSchedule]);

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

	const handleDownloadSchedule = async () => {
		if (!selectedYear || !selectedTerm) {
			showError("Vui lòng chọn năm học và học kỳ");
			return;
		}
		try {
			setIsDownloading(true);
			await downloadSchedule(selectedYear, selectedTerm);
		} catch (err) {
			console.error("Error downloading schedule:", err);
			showError("Không thể tải lịch học. Vui lòng thử lại sau.");
		} finally {
			setIsDownloading(false);
		}
	};

	const getScheduleItemsForDayAndBlock = (
		dayIndex: number,
		blockType: keyof typeof TIME_BLOCKS,
	): ScheduleItem[] => {
		if (!schedule?.ResultDataSchedule?.length) return [];
		const { start, end } = TIME_BLOCKS[blockType];
		return schedule.ResultDataSchedule.filter(
			(item) =>
				item.DayOfWeek === dayIndex + 1 &&
				item.PeriodID >= start &&
				item.PeriodID <= end,
		);
	};

	const getScheduleItemsForDay = (dayIndex: number): ScheduleItem[] => {
		if (!schedule?.ResultDataSchedule?.length) return [];
		return schedule.ResultDataSchedule.filter(
			(item) => item.DayOfWeek === dayIndex + 1,
		).sort((a, b) => a.PeriodID - b.PeriodID);
	};

	const getBlockType = (lessonNumber: number): keyof typeof TIME_BLOCKS => {
		if (lessonNumber <= 2) return "B1_2";
		if (lessonNumber <= 4) return "B3_4";
		if (lessonNumber <= 6) return "B5_6";
		if (lessonNumber <= 8) return "B7_8";
		return "B9_10";
	};

	const getPeriodLabel = (item: ScheduleItem): string => {
		const start = item.PeriodID;
		const end = start + (item.NumberOfPeriods || 1) - 1;
		return `${start}-${end}`;
	};

	const getTooltipField = (item: ScheduleItem, key: string): string => {
		const line = item.TKHHienThi?.split(/<br\s*\/?>/i).find((l) =>
			l.trim().startsWith(`-${key}:`),
		);
		return line ? line.replace(`-${key}:`, "").trim() : "";
	};

	const getTeacherName = (item: ScheduleItem): string =>
		getTooltipField(item, "GV") || item.ProfessorName || "—";

	const getRoomName = (item: ScheduleItem): string => {
		const room = item.RoomID?.replace(/<br\s*\/?>/i, " - ") || "—";
		const building = item.BuildingName?.trim();
		if (!building || building === room) return room;
		return `${building} - ${room}`;
	};

	const renderScheduleItem = (item: ScheduleItem) => {
		return (
			<div className='bg-primary/10 border border-primary/20 rounded-lg p-2 text-xs space-y-1'>
				<div className='font-semibold text-foreground line-clamp-2'>
					{item.CurriculumName}
				</div>
				<div className='flex items-center gap-1 text-muted-foreground'>
					<Clock className='w-3 h-3' />
					<span>
						Tiết{" "}
						{item.PeriodName || getPeriodLabel(item)}
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

	return (
		<div className='space-y-4'>
			{/* Page Header */}
			<div className='flex flex-wrap items-start justify-between gap-3'>
				<div>
					<h1 className='text-2xl md:text-3xl font-bold text-foreground'>
						Thời khóa biểu
					</h1>
					<p className='text-sm text-muted-foreground'>
						Xem lịch học theo tuần
					</p>
				</div>
				<Button
					variant='outline'
					onClick={handleDownloadSchedule}
					disabled={isDownloading || !selectedYear || !selectedTerm}
					className='gap-2'
				>
					{isDownloading ? (
						<Loader2 className='w-4 h-4 animate-spin' />
					) : (
						<Download className='w-4 h-4' />
					)}
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
							{yearTermData?.Terms.map((term) => (
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

				{/* Week Navigation */}
				<div className='flex items-center gap-2 w-full md:w-auto md:ml-auto'>
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
			</div>

			{/* Schedule Table */}
			<Card>
				<CardHeader className='pb-3'>
					<CardTitle className='flex items-center gap-2 text-base'>
						<Calendar className='h-5 w-5 text-primary' />
						{currentWeekData && (
							<span>
								Tuần {selectedWeek} ({currentWeekData.BeginDate}{" "}
								- {currentWeekData.EndDate})
							</span>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoadingSchedule ?
						<div className='flex items-center justify-center py-12'>
							<Loader2 className='w-8 h-8 animate-spin text-primary' />
						</div>
						: scheduleError ?
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
						: <>
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
															const items =
																getScheduleItemsForDayAndBlock(
																	dayIndex,
																	block as keyof typeof TIME_BLOCKS,
																);
															return (
																<td
																	key={
																		dayIndex
																	}
																	className='p-1 border align-top'
																>
																	<div className='space-y-1'>
																		{items.map(
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
										getScheduleItemsForDay(dayIndex);
									const hasClasses = dayItems.length > 0;

									return (
										<div
											key={dayIndex}
											className='border rounded-lg overflow-hidden'
										>
											<div
												className={cn(
													"px-3 py-2 font-medium text-sm",
													hasClasses ?
														"bg-primary text-primary-foreground"
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
												{hasClasses ?
													<div className='space-y-2'>
														{dayItems.map(
															(item) => {
																const blockType =
																	getBlockType(
																		item.PeriodID,
																	);
																const blockInfo =
																	TIME_BLOCKS[
																	blockType
																	];

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
																						getPeriodLabel(item)}
																				</span>
																			</div>
																			<div className='flex items-center gap-1.5'>
																				<MapPin className='w-3 h-3' />
																				<span>
																					{getRoomName(item)}
																				</span>
																			</div>
																		</div>
																		<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
																			<User className='w-3 h-3' />
																			<span>
																				{getTeacherName(item)}
																			</span>
																		</div>
																	</div>
																);
															},
														)}
													</div>
													: <div className='text-center py-4 text-sm text-muted-foreground'>
														Không có lịch học
													</div>
												}
											</div>
										</div>
									);
								})}
							</div>
						</>
					}
				</CardContent>
			</Card>
		</div>
	);
}

export default ClassSchedulePage;
