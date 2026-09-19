import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Loader2,
	Calendar,
	AlertCircle,
	BookOpen,
	GraduationCap,
	Repeat,
	Download,
} from "lucide-react";
import { getPeriorSchedules, type YearAndTermItem } from "@/services/scheduleService";
import {
	downloadSchedule,
	getTermLabel,
	type ScheduleExportOptions,
	type ScheduleTitleStyle,
} from "@/utils/downloadHelper";
import { useGlobalNotification } from "@/hooks/useGlobalNotification";

interface ScheduleExportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentYear: string;
	currentTerm: string;
	yearItems: YearAndTermItem[];
}

const TITLE_STYLE_OPTIONS: { value: ScheduleTitleStyle; label: string; example: string }[] = [
	{ value: "subject", label: "Tên môn học", example: "Kinh tế quốc tế 2" },
	{ value: "subjectType", label: "Tên môn học (Loại)", example: "Kinh tế quốc tế 2 (Thảo luận)" },
	{ value: "codeSubject", label: "Mã LHP - Tên môn", example: "TMKQ1111(126)_01 - Kinh tế quốc tế 2" },
	{ value: "subjectRoom", label: "Tên môn - Phòng", example: "Kinh tế quốc tế 2 - B-204" },
];

const REMINDER_UNITS: { value: string; label: string; trigger: (v: number) => string }[] = [
	{ value: "seconds", label: "giây", trigger: (v) => `PT${v}S` },
	{ value: "minutes", label: "phút", trigger: (v) => `PT${v}M` },
	{ value: "hours", label: "giờ", trigger: (v) => `PT${v}H` },
	{ value: "days", label: "ngày", trigger: (v) => `P${v}D` },
];

const REMINDER_PRESETS: { value: string; label: string; trigger: string | null }[] = [
	{ value: "none", label: "Không nhắc nhở", trigger: null },
	{ value: "0", label: "Vào lúc bắt đầu", trigger: "PT0M" },
	{ value: "5", label: "5 phút trước", trigger: "PT5M" },
	{ value: "10", label: "10 phút trước", trigger: "PT10M" },
	{ value: "30", label: "30 phút trước", trigger: "PT30M" },
	{ value: "60", label: "1 giờ trước", trigger: "PT1H" },
	{ value: "1440", label: "1 ngày trước", trigger: "P1D" },
	{ value: "custom", label: "Tùy chỉnh...", trigger: null },
];

const INCLUDE_FIELDS: { key: string; label: string }[] = [
	{ key: "includeCourseCode", label: "Mã lớp học phần" },
	{ key: "includeLoaiHp", label: "Loại học phần" },
	{ key: "includeCredits", label: "Số tín chỉ" },
	{ key: "includeClass", label: "Lớp" },
	{ key: "includeTeacher", label: "Giảng viên" },
	{ key: "includeCampus", label: "Cơ sở học" },
];

interface SemesterSummary {
	mounCount: number;
	sessionCount: number;
	creditTotal: number;
	courses: { MaLHP: string; TenHP: string; SoTC: number; sessions: number }[];
}

const buildSummary = (items: { MaLHP: string; TenHP: string; SoTC: number }[]): SemesterSummary => {
	const byCode = new Map<string, { MaLHP: string; TenHP: string; SoTC: number; sessions: number }>();
	items.forEach((item) => {
		const existing = byCode.get(item.MaLHP);
		if (existing) {
			existing.sessions += 1;
		} else {
			byCode.set(item.MaLHP, { ...item, sessions: 1 });
		}
	});
	const courses = [...byCode.values()];
	const creditTotal = courses.reduce((sum, c) => sum + (c.SoTC || 0), 0);
	return {
		mounCount: courses.length,
		sessionCount: items.length,
		creditTotal,
		courses,
	};
};

function ScheduleExportDialog({
	open,
	onOpenChange,
	currentYear,
	currentTerm,
	yearItems,
}: ScheduleExportDialogProps) {
	const { showError, showSuccess } = useGlobalNotification();

	const [useCurrentSemester, setUseCurrentSemester] = useState(true);
	const [customYear, setCustomYear] = useState(currentYear);
	const [customTerm, setCustomTerm] = useState(currentTerm);

	const [reminderValue, setReminderValue] = useState("30");
	const [customReminderValue, setCustomReminderValue] = useState("60");
	const [customReminderUnit, setCustomReminderUnit] = useState("minutes");
	const [titleStyle, setTitleStyle] = useState<ScheduleTitleStyle>("subjectType");
	const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
	const [include, setInclude] = useState<Record<string, boolean>>({
		includeCourseCode: true,
		includeLoaiHp: true,
		includeCredits: true,
		includeClass: true,
		includeTeacher: true,
		includeCampus: true,
	});

	const [summary, setSummary] = useState<SemesterSummary | null>(null);
	const [isSummaryLoading, setIsSummaryLoading] = useState(false);
	const [summaryError, setSummaryError] = useState<string | null>(null);
	const [isDownloading, setIsDownloading] = useState(false);

	const effectiveYear = useCurrentSemester ? currentYear : customYear;
	const effectiveTerm = useCurrentSemester ? currentTerm : customTerm;

	const effectiveTermName = useMemo(() => {
		const item = yearItems.find((i) => i.YearStudy === effectiveYear);
		const name = item?.Terms.find((t) => t.TermID === effectiveTerm)?.TermName;
		return name || getTermLabel(effectiveTerm);
	}, [yearItems, effectiveYear, effectiveTerm]);

	const customTerms = useMemo(() => {
		const item = yearItems.find((i) => i.YearStudy === customYear);
		return item?.Terms ?? [];
	}, [yearItems, customYear]);

	const selectedTitleStyle = TITLE_STYLE_OPTIONS.find((o) => o.value === titleStyle);

	useEffect(() => {
		if (!open) return;
		setUseCurrentSemester(true);
		setCustomYear(currentYear);
		setCustomTerm(currentTerm);
		setSummary(null);
		setSummaryError(null);
		setIsDownloading(false);
	}, [open, currentYear, currentTerm]);

	useEffect(() => {
		const item = yearItems.find((i) => i.YearStudy === customYear);
		const fallbackTerm = item?.Terms.find((t) => t.TermID === customTerm)?.TermID
			? customTerm
			: item?.Terms.find((t) => t.CurrentTerm)?.TermID ?? item?.Terms[0]?.TermID ?? "";
		setCustomTerm(fallbackTerm);
	}, [yearItems, customYear, customTerm]);

	const fetchSummary = useCallback(async () => {
		if (!effectiveYear || !effectiveTerm) {
			setSummary(null);
			return;
		}
		setIsSummaryLoading(true);
		setSummaryError(null);
		try {
			const data = await getPeriorSchedules(effectiveYear, effectiveTerm);
			const items = data?.result ?? [];
			if (items.length === 0) {
				setSummary(null);
				setSelectedCourses([]);
				return;
			}
			const next = buildSummary(items);
			setSummary(next);
			setSelectedCourses(next.courses.map((c) => c.MaLHP));
		} catch (err) {
			console.error("Error fetching schedule summary:", err);
			setSummaryError("Không thể tải tóm tắt lịch học cho học kỳ này.");
		} finally {
			setIsSummaryLoading(false);
		}
	}, [effectiveYear, effectiveTerm]);

	useEffect(() => {
		if (!open || !effectiveYear || !effectiveTerm) return;
		fetchSummary();
	}, [open, effectiveYear, effectiveTerm, fetchSummary]);

	const allCoursesSelected =
		!!summary && summary.courses.length > 0 && selectedCourses.length === summary.courses.length;

	const toggleCourse = (code: string, checked: boolean) => {
		setSelectedCourses((prev) =>
			checked ? [...new Set([...prev, code])] : prev.filter((c) => c !== code),
		);
	};

	const toggleAllCourses = (checked: boolean) => {
		setSelectedCourses(checked && summary ? summary.courses.map((c) => c.MaLHP) : []);
	};

	const buildReminderTrigger = (): string | null | undefined => {
		if (reminderValue === "custom") {
			const value = Number(customReminderValue);
			if (!Number.isFinite(value) || value < 0) return undefined;
			const unit = REMINDER_UNITS.find((u) => u.value === customReminderUnit);
			return unit ? unit.trigger(value) : null;
		}
		return REMINDER_PRESETS.find((p) => p.value === reminderValue)?.trigger ?? null;
	};

	const handleDownload = async () => {
		if (!effectiveYear || !effectiveTerm) {
			showError("Vui lòng chọn năm học và học kỳ");
			return;
		}
		const reminderTrigger = buildReminderTrigger();
		if (reminderTrigger === undefined) {
			showError("Vui lòng nhập thời gian nhắc nhở hợp lệ (lớn hơn hoặc bằng 0).");
			return;
		}
		if (summary && selectedCourses.length === 0) {
			showError("Vui lòng chọn ít nhất một lớp học phần để xuất.");
			return;
		}
		const options: ScheduleExportOptions = {
			reminderTrigger,
			titleStyle,
			courseCodes: allCoursesSelected ? null : selectedCourses,
			...include,
		};
		try {
			setIsDownloading(true);
			await downloadSchedule(effectiveYear, effectiveTerm, options);
			showSuccess("Đã tải file lịch học (.ics)");
			onOpenChange(false);
		} catch (err) {
			console.error("Error downloading schedule:", err);
			showError("Không thể tải lịch học. Vui lòng thử lại sau.");
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5 text-primary" />
						Xuất lịch học (.ics)
					</DialogTitle>
					<DialogDescription>
						Tải lịch học dưới định dạng file .ics mà bạn có thể nhập vào lịch trên máy tính / điện thoại của bạn (Google
						Calendar, Outlook, Apple Calendar...).
					</DialogDescription>
				</DialogHeader>

				{/* Semester selection */}
				<div className="space-y-3">
					<div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
						<Checkbox
							id="use-current-semester"
							checked={useCurrentSemester}
							onCheckedChange={(checked) => setUseCurrentSemester(!!checked)}
						/>
						<Label htmlFor="use-current-semester" className="cursor-pointer">
							Dùng năm học / học kỳ đang chọn
						</Label>
					</div>

					{!useCurrentSemester && (
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label>Năm học</Label>
								<Select value={customYear} onValueChange={setCustomYear}>
									<SelectTrigger>
										<SelectValue placeholder="Năm học" />
									</SelectTrigger>
									<SelectContent>
										{yearItems.map((item) => (
											<SelectItem key={item.YearStudy} value={item.YearStudy}>
												Năm học {item.YearStudy}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<Label>Học kỳ</Label>
								<Select
									value={customTerm}
									onValueChange={setCustomTerm}
									disabled={customTerms.length === 0}
								>
									<SelectTrigger>
										<SelectValue placeholder="Học kỳ" />
									</SelectTrigger>
									<SelectContent>
										{customTerms.map((term) => (
											<SelectItem key={term.TermID} value={term.TermID}>
												{term.TermName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					)}
				</div>

				{/* Semester summary + course selection */}
				<div className="rounded-lg border border-border p-3 space-y-2">
					<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
						<span className="font-medium text-foreground">
							{effectiveTermName} • Năm {effectiveYear}
						</span>
						{isSummaryLoading && (
							<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
								Đang tải...
							</span>
						)}
					</div>

					{summaryError && (
						<div className="flex items-center gap-2 text-sm text-destructive">
							<AlertCircle className="h-4 w-4 shrink-0" />
							<span>{summaryError}</span>
						</div>
					)}

					{!isSummaryLoading && !summaryError && summary && (
						<div className="space-y-2">
							<div className="flex gap-4 text-xs">
								<span className="inline-flex items-center gap-1.5 text-muted-foreground">
									<BookOpen className="h-3.5 w-3.5" />
									{summary.mounCount} môn
								</span>
								<span className="inline-flex items-center gap-1.5 text-muted-foreground">
									<Repeat className="h-3.5 w-3.5" />
									{summary.sessionCount} buổi
								</span>
								<span className="inline-flex items-center gap-1.5 text-muted-foreground">
									<GraduationCap className="h-3.5 w-3.5" />
									{summary.creditTotal} tín chỉ
								</span>
							</div>
							<div className="flex items-center justify-between border-t border-border pt-2">
								<span className="text-xs font-medium text-muted-foreground">
									Chọn lớp học phần
								</span>
								<label className="flex items-center gap-1.5 text-xs cursor-pointer">
									<Checkbox
										checked={allCoursesSelected}
										onCheckedChange={(c) => toggleAllCourses(!!c)}
									/>
									Chọn tất cả
								</label>
							</div>
							<ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
								{summary.courses.map((course) => (
									<li key={course.MaLHP}>
										<label className="flex items-start gap-2 cursor-pointer text-xs">
											<Checkbox
												checked={selectedCourses.includes(course.MaLHP)}
												onCheckedChange={(c) => toggleCourse(course.MaLHP, !!c)}
												className="mt-0.5"
											/>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-foreground">
													{course.TenHP}
												</span>
												<span className="text-muted-foreground">
													{course.MaLHP} • {course.SoTC} tín • {course.sessions} buổi
												</span>
											</span>
										</label>
									</li>
								))}
							</ul>
						</div>
					)}

					{!isSummaryLoading && !summaryError && !summary && (
						<p className="text-sm text-muted-foreground">
							Không có lịch học trong học kỳ này.
						</p>
					)}
				</div>

				{/* Export options */}
				<div className="grid gap-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>Nhắc nhở trước buổi học</Label>
							<Select value={reminderValue} onValueChange={setReminderValue}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{REMINDER_PRESETS.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{reminderValue === "custom" && (
								<div className="flex items-center gap-2 pt-1">
									<Input
										type="number"
										min={0}
										value={customReminderValue}
										onChange={(e) => setCustomReminderValue(e.target.value)}
										className="w-24"
									/>
									<Select
										value={customReminderUnit}
										onValueChange={setCustomReminderUnit}
									>
										<SelectTrigger className="w-28">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{REMINDER_UNITS.map((unit) => (
												<SelectItem key={unit.value} value={unit.value}>
													{unit.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<span className="text-sm text-muted-foreground">trước</span>
								</div>
							)}
						</div>
						<div className="space-y-1.5">
							<Label>Kiểu tiêu đề sự kiện</Label>
							<Select
								value={titleStyle}
								onValueChange={(v) => setTitleStyle(v as ScheduleTitleStyle)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TITLE_STYLE_OPTIONS.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{selectedTitleStyle && (
								<p className="text-xs text-muted-foreground">
									VD: {selectedTitleStyle.example}
								</p>
							)}
						</div>
					</div>

					<div className="space-y-1.5">
						<Label>Dữ liệu ghi vào sự kiện</Label>
						<div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
							{INCLUDE_FIELDS.map((field) => (
								<label key={field.key} className="flex items-center gap-2 cursor-pointer">
									<Checkbox
										checked={include[field.key]}
										onCheckedChange={(c) =>
											setInclude((prev) => ({ ...prev, [field.key]: !!c }))
										}
									/>
									{field.label}
								</label>
							))}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDownloading}>
						Hủy
					</Button>
					<Button
						onClick={handleDownload}
						disabled={
							isDownloading ||
							!effectiveYear ||
							!effectiveTerm ||
							summaryError !== null
						}
						className="gap-2"
					>
						{isDownloading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Download className="w-4 h-4" />
						)}
						Tải xuống (.ics)
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default ScheduleExportDialog;
