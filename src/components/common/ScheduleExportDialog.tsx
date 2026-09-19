import { useCallback, useEffect, useMemo, useState } from "react";
import {
	BookOpen,
	Calendar,
	Repeat,
	GraduationCap,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getPeriorSchedules, type YearAndTermItem } from "@/services/scheduleService";
import {
	downloadSchedule,
	type ScheduleExportOptions,
	type ScheduleTitleStyle,
} from "@/utils/downloadHelper";
import { DEFAULT_SCHEDULE_REMINDER } from "@/lib/exportOptions";
import { useGlobalNotification } from "@/hooks/useGlobalNotification";
import IcsExportDialog, {
	type IcsExportDownloadPayload,
	type IcsExportIncludeField,
	type IcsExportItem,
	type IcsExportPanelBuilders,
} from "@/components/common/IcsExportDialog";

interface ScheduleExportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentYear: string;
	currentTerm: string;
	yearItems: YearAndTermItem[];
}

interface CoursePayload {
	MaLHP: string;
	TenHP: string;
	SoTC: number;
	sessions: number;
}

const TITLE_STYLE_OPTIONS: { value: ScheduleTitleStyle; label: string; example: string }[] = [
	{ value: "subject", label: "Tên môn học", example: "Kinh tế quốc tế 2" },
	{ value: "subjectType", label: "Tên môn học (Loại)", example: "Kinh tế quốc tế 2 (Thảo luận)" },
	{ value: "codeSubject", label: "Mã LHP - Tên môn", example: "TMKQ1111(126)_01 - Kinh tế quốc tế 2" },
	{ value: "subjectRoom", label: "Tên môn - Phòng", example: "Kinh tế quốc tế 2 - B-204" },
];

const INCLUDE_FIELDS: IcsExportIncludeField[] = [
	{ key: "includeCourseCode", label: "Mã lớp học phần" },
	{ key: "includeLoaiHp", label: "Loại học phần" },
	{ key: "includeCredits", label: "Số tín chỉ" },
	{ key: "includeClass", label: "Lớp" },
	{ key: "includeTeacher", label: "Giảng viên" },
	{ key: "includeCampus", label: "Cơ sở học" },
];

const INCLUDE_DEFAULTS: Record<string, boolean> = {
	includeCourseCode: true,
	includeLoaiHp: true,
	includeCredits: false,
	includeClass: true,
	includeTeacher: true,
	includeCampus: false,
};

function ScheduleExportDialog({
	open,
	onOpenChange,
	currentYear,
	currentTerm,
	yearItems,
}: ScheduleExportDialogProps) {
	const { showError, showSuccess } = useGlobalNotification();

	const [dialogYear, setDialogYear] = useState(currentYear);
	const [dialogTerm, setDialogTerm] = useState(currentTerm);
	const [titleStyle, setTitleStyle] = useState<ScheduleTitleStyle>("subjectType");
	const [courses, setCourses] = useState<IcsExportItem<CoursePayload>[]>([]);
	const [isSummaryLoading, setIsSummaryLoading] = useState(false);
	const [summaryError, setSummaryError] = useState<string | null>(null);

	const handleSelectionChange = useCallback((year: string, term: string) => {
		setDialogYear(year);
		setDialogTerm(term);
	}, []);

	const selectedTitleStyle = TITLE_STYLE_OPTIONS.find((o) => o.value === titleStyle);

	const fetchSummary = useCallback(async () => {
		if (!dialogYear || !dialogTerm) return;
		setIsSummaryLoading(true);
		setSummaryError(null);
		try {
			const data = await getPeriorSchedules(dialogYear, dialogTerm);
			const items = data?.result ?? [];
			const byCode = new Map<string, CoursePayload>();
			items.forEach((raw) => {
				const existing = byCode.get(raw.MaLHP);
				if (existing) {
					existing.sessions += 1;
				} else {
					byCode.set(raw.MaLHP, {
						MaLHP: raw.MaLHP,
						TenHP: raw.TenHP,
						SoTC: raw.SoTC ?? 0,
						sessions: 1,
					});
				}
			});
			setCourses(
				[...byCode.values()].map((course) => ({
					id: course.MaLHP,
					title: course.TenHP,
					subtitle: `${course.MaLHP} • ${course.SoTC} tín • ${course.sessions} buổi`,
					payload: course,
				})),
			);
		} catch (err) {
			console.error("Error fetching schedule summary:", err);
			setSummaryError("Không thể tải tóm tắt lịch học cho học kỳ này.");
			setCourses([]);
		} finally {
			setIsSummaryLoading(false);
		}
	}, [dialogYear, dialogTerm]);

	useEffect(() => {
		if (!open || !dialogYear || !dialogTerm) return;
		fetchSummary();
	}, [open, dialogYear, dialogTerm, fetchSummary]);

	const totalCredits = useMemo(
		() => courses.reduce((sum, course) => sum + (course.payload.SoTC || 0), 0),
		[courses],
	);

	const totalSessions = useMemo(
		() => courses.reduce((sum, course) => sum + (course.payload.sessions || 0), 0),
		[courses],
	);

	const panel: IcsExportPanelBuilders<CoursePayload> = {
		header: (_semester, _loading, total) => (
			<span className="text-xs text-muted-foreground">
				{total} môn • {totalSessions} buổi
			</span>
		),
		summary: () => (
			<div className="flex gap-4 text-xs">
				<span className="inline-flex items-center gap-1.5 text-muted-foreground">
					<BookOpen className="h-3.5 w-3.5" />
					{courses.length} môn
				</span>
				<span className="inline-flex items-center gap-1.5 text-muted-foreground">
					<Repeat className="h-3.5 w-3.5" />
					{totalSessions} buổi
				</span>
				<span className="inline-flex items-center gap-1.5 text-muted-foreground">
					<GraduationCap className="h-3.5 w-3.5" />
					{totalCredits} tín chỉ
				</span>
			</div>
		),
		empty: "Không có lịch học trong học kỳ này.",
		itemLabel: "lớp học phần",
		itemsLabel: "lớp học phần",
		itemSingular: "lớp học phần",
		loading: isSummaryLoading,
	};

	const handleDownload = async ({
		year,
		term,
		reminderTrigger,
		include,
		selectedItems,
	}: IcsExportDownloadPayload<CoursePayload>) => {
		const allSelected = selectedItems.every(({ selected }) => selected);
		if (selectedItems.filter(({ selected }) => selected).length === 0) {
			showError("Vui lòng chọn ít nhất một lớp học phần để xuất.");
			return;
		}
		const codes = selectedItems
			.filter(({ selected }) => selected)
			.map(({ item }) => item.payload.MaLHP);
		const options: ScheduleExportOptions = {
			reminderTrigger,
			titleStyle,
			courseCodes: allSelected ? null : codes,
			...include,
		};
		try {
			await downloadSchedule(year, term, options);
			showSuccess("Đã tải file lịch học (.ics)");
			onOpenChange(false);
		} catch (err) {
			console.error("Error downloading schedule:", err);
			showError("Không thể tải lịch học. Vui lòng thử lại sau.");
		}
	};

	return (
		<IcsExportDialog<CoursePayload>
			open={open}
			onOpenChange={onOpenChange}
			title="Xuất lịch học (.ics)"
			description="Tải lịch học dưới định dạng file .ics mà bạn có thể nhập vào lịch trên máy tính / điện thoại của bạn (Google Calendar, Outlook, Apple Calendar...)."
			icon={Calendar}
			yearItems={yearItems}
			currentYear={currentYear}
			currentTerm={currentTerm}
			onSelectionChange={handleSelectionChange}
			reminderLabel="Nhắc nhở trước buổi học"
			reminderDefault={DEFAULT_SCHEDULE_REMINDER}
			includeFields={INCLUDE_FIELDS}
			includeDefaults={INCLUDE_DEFAULTS}
			items={courses}
			downloadDisabled={
				isSummaryLoading || summaryError !== null || courses.length === 0
			}
			panel={panel}
			onDownload={handleDownload}
		>
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
					<p className="text-xs text-muted-foreground">VD: {selectedTitleStyle.example}</p>
				)}
			</div>
		</IcsExportDialog>
	);
}

export default ScheduleExportDialog;