import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getStudentExams, type ExamItem } from "@/services/examService";
import type { YearAndTermItem } from "@/services/scheduleService";
import { downloadExamSchedule, type ExamExportOptions } from "@/utils/downloadHelper";
import {
	DEFAULT_EXAM_DURATION,
	DEFAULT_EXAM_REMINDER,
	getExamDurationMinutes,
	getTermLabel,
} from "@/lib/exportOptions";
import { useGlobalNotification } from "@/hooks/useGlobalNotification";
import IcsExportDialog, {
	type IcsExportDownloadPayload,
	type IcsExportIncludeField,
	type IcsExportItem,
	type IcsExportPanelBuilders,
} from "@/components/common/IcsExportDialog";

interface ExamExportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	yearItems: YearAndTermItem[];
	currentYear: string;
	currentTerm: string;
}

const INCLUDE_FIELDS: IcsExportIncludeField[] = [
	{ key: "includeExamCode", label: "Mã học phần" },
	{ key: "includeExamFormat", label: "Hình thức thi" },
	{ key: "includeAttempt", label: "Lần thi" },
	{ key: "includeCredits", label: "Số tín chỉ" },
	{ key: "includeStatus", label: "Trạng thái" },
];

const INCLUDE_DEFAULTS: Record<string, boolean> = {
	includeExamCode: true,
	includeExamFormat: true,
	includeAttempt: true,
	includeCredits: false,
	includeStatus: true,
};

function ExamExportDialog({
	open,
	onOpenChange,
	yearItems,
	currentYear,
	currentTerm,
}: ExamExportDialogProps) {
	const { showError, showSuccess } = useGlobalNotification();

	const [dialogYear, setDialogYear] = useState(currentYear);
	const [dialogTerm, setDialogTerm] = useState(currentTerm);
	const [examItems, setExamItems] = useState<IcsExportItem<ExamItem>[]>([]);
	const [isLoadingExams, setIsLoadingExams] = useState(false);
	const [examsError, setExamsError] = useState<string | null>(null);
	const [durationOverrides, setDurationOverrides] = useState<Record<string, string>>({});

	const handleSelectionChange = useCallback((year: string, term: string) => {
		setDialogYear(year);
		setDialogTerm(term);
	}, []);

	const typeDefaults = useMemo(() => {
		const defaults: Record<string, number> = {};
		examItems.forEach((item) => {
			const format = item.payload.HinhThucThi;
			if (!format || defaults[format] !== undefined) return;
			defaults[format] = getExamDurationMinutes(format, Number(DEFAULT_EXAM_DURATION));
		});
		return defaults;
	}, [examItems]);

	const examTypes = useMemo(() => Object.keys(typeDefaults), [typeDefaults]);

	const fetchExams = useCallback(async () => {
		if (!dialogYear || !dialogTerm) return;
		setIsLoadingExams(true);
		setExamsError(null);
		try {
			const list = await getStudentExams(dialogYear, dialogTerm);
			setExamItems(
				list.map((exam) => {
					const idParts = [
						exam.CurriculumID,
						exam.NgayThi,
						exam.GioThi,
						exam.PhongThi,
						exam.LanThi,
					];
					const id = idParts
						.join("_")
						.replace(/\s+/g, "-")
						.replace(/[^\w\-/:-]/g, "");
					const displayDate = (exam.NgayThi || "").split(" ")[0];
					return {
						id,
						title: exam.CurriculumName.trim() || exam.CurriculumID,
						subtitle: [
							exam.CurriculumID,
							exam.HinhThucThi,
							displayDate,
							exam.GioThi,
							exam.PhongThi ? `Phòng ${exam.PhongThi}` : "",
						]
							.filter(Boolean)
							.join(" • "),
						minutes: getExamDurationMinutes(exam.HinhThucThi, Number(DEFAULT_EXAM_DURATION)),
						payload: exam,
					};
				}),
			);
			setDurationOverrides({});
		} catch (err) {
			console.error("Error fetching exams for export:", err);
			setExamsError("Không thể tải lịch thi cho học kỳ này.");
			setExamItems([]);
			setDurationOverrides({});
		} finally {
			setIsLoadingExams(false);
		}
	}, [dialogYear, dialogTerm]);

	useEffect(() => {
		if (open) setDurationOverrides({});
	}, [open]);

	useEffect(() => {
		if (!open || !dialogYear || !dialogTerm) return;
		fetchExams();
	}, [open, dialogYear, dialogTerm, fetchExams]);

	const panel: IcsExportPanelBuilders<ExamItem> = {
		summary: () =>
			examTypes.length > 0 ? (
				<p className="text-xs text-muted-foreground">
					Thời lượng mặc định:{" "}
					{examTypes
						.map((type) => `${type} ${typeDefaults[type] ?? Number(DEFAULT_EXAM_DURATION)} phút`)
						.join(" · ")}
				</p>
			) : null,
		empty: "Không có lịch thi trong học kỳ này.",
		itemLabel: "môn thi",
		itemsLabel: "môn thi",
		itemSingular: "môn thi",
		loading: isLoadingExams,
		extraFields: (item) => (
			<div className="flex shrink-0 items-center gap-1">
				<Input
					type="number"
					min={15}
					step={5}
					value={
						durationOverrides[item.id] ??
						String(item.minutes ?? Number(DEFAULT_EXAM_DURATION))
					}
					onChange={(e) =>
						setDurationOverrides((prev) => ({ ...prev, [item.id]: e.target.value }))
					}
					className="h-7 w-16 px-2 text-xs"
				/>
				<span className="text-xs text-muted-foreground">phút</span>
			</div>
		),
	};

	const handleDownload = async ({
		year,
		term,
		reminderTrigger,
		include,
		selectedItems,
	}: IcsExportDownloadPayload<ExamItem>) => {
		const selected = selectedItems
			.filter(({ selected }) => selected)
			.map(({ item }) => {
				const parsed = Number(durationOverrides[item.id]);
				return {
					...item.payload,
					DurationMinutes:
						Number.isFinite(parsed) && parsed > 0
							? parsed
							: item.minutes ?? Number(DEFAULT_EXAM_DURATION),
				};
			});
		if (selected.length === 0) {
			showError("Vui lòng chọn ít nhất một môn thi để xuất.");
			return;
		}
		const semesterItem = yearItems.find((i) => i.YearStudy === year);
		const termName =
			semesterItem?.Terms.find((t) => t.TermID === term)?.TermName ?? getTermLabel(term);
		const options: ExamExportOptions = {
			calendarName: `Lịch thi ${termName} ${year}`,
			fileName: `LichThi_${term}_${year}.ics`,
			reminderTrigger,
			...include,
		};
		try {
			await downloadExamSchedule(selected, options);
			showSuccess("Đã tải file lịch thi (.ics)");
			onOpenChange(false);
		} catch (err) {
			console.error("Error downloading exam schedule:", err);
			showError("Không thể tải lịch thi. Vui lòng thử lại sau.");
		}
	};

	return (
		<IcsExportDialog<ExamItem>
			open={open}
			onOpenChange={onOpenChange}
			title="Xuất lịch thi (.ics)"
			description="Tải lịch thi dưới định dạng file .ics mà bạn có thể nhập vào lịch trên máy tính / điện thoại của bạn (Google Calendar, Outlook, Apple Calendar...)."
			icon={Calendar}
			yearItems={yearItems}
			currentYear={currentYear}
			currentTerm={currentTerm}
			onSelectionChange={handleSelectionChange}
			reminderLabel="Nhắc nhở trước giờ thi"
			reminderDefault={DEFAULT_EXAM_REMINDER}
			includeFields={INCLUDE_FIELDS}
			includeDefaults={INCLUDE_DEFAULTS}
			items={examItems}
			downloadDisabled={isLoadingExams || examsError !== null || examItems.length === 0}
			panel={panel}
			onDownload={handleDownload}
		/>
	);
}

export default ExamExportDialog;