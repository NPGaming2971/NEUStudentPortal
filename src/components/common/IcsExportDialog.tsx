import { type ReactNode, useEffect, useMemo, useState } from "react";
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
import { Download, Loader2, SlidersHorizontal, type LucideIcon } from "lucide-react";
import {
	buildReminderTrigger,
	DEFAULT_CUSTOM_REMINDER_UNIT,
	DEFAULT_CUSTOM_REMINDER_VALUE,
	getTermLabel,
	REMINDER_PRESETS,
	REMINDER_UNITS,
} from "@/lib/exportOptions";
import type { YearAndTermItem } from "@/services/scheduleService";
import { useGlobalNotification } from "@/hooks/useGlobalNotification";

export interface IcsExportItem<T = unknown> {
	id: string;
	title: string;
	subtitle?: string;
	badges?: string[];
	minutes?: number;
	payload: T;
}

export interface IcsExportSelectedItem<T> {
	item: IcsExportItem<T>;
	selected: boolean;
}

export interface IcsExportIncludeField {
	key: string;
	label: string;
}

export interface IcsExportDownloadPayload<T> {
	year: string;
	term: string;
	reminderTrigger: string | null | undefined;
	include: Record<string, boolean>;
	selectedItems: IcsExportSelectedItem<T>[];
	selectedCount: number;
}

export interface IcsExportSemesterState {
	year: string;
	term: string;
	label: string;
}

export interface IcsExportPanelBuilders<T> {
	header?: (semester: IcsExportSemesterState, loading: boolean, total: number) => ReactNode;
	summary?: (semester: IcsExportSemesterState, count: number, total: number) => ReactNode;
	empty: string;
	itemLabel: string;
	itemsLabel: string;
	itemSingular?: string;
	extraFields?: (item: IcsExportItem<T>) => ReactNode;
	showMinutesBadge?: boolean;
	loading?: boolean;
}

export interface IcsExportDialogProps<T> {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	icon: LucideIcon;
	yearItems: YearAndTermItem[];
	currentYear: string;
	currentTerm: string;
	onSelectionChange: (year: string, term: string) => void;
	reminderLabel: string;
	reminderDefault: string;
	includeFields?: IcsExportIncludeField[];
	includeDefaults?: Record<string, boolean>;
	items: IcsExportItem<T>[];
	downloadDisabled?: boolean;
	panel?: IcsExportPanelBuilders<T>;
	children?: ReactNode;
	onDownload: (payload: IcsExportDownloadPayload<T>) => Promise<void>;
}

function IcsExportDialog<T>({
	open,
	onOpenChange,
	title,
	description,
	icon: Icon,
	yearItems,
	currentYear,
	currentTerm,
	onSelectionChange,
	reminderLabel,
	reminderDefault,
	includeFields: includeFieldsProp = [],
	includeDefaults: includeDefaultsProp = {},
	items,
	downloadDisabled,
	panel,
	children,
	onDownload,
}: IcsExportDialogProps<T>) {
	const { showError } = useGlobalNotification();

	const [useCurrentSemester, setUseCurrentSemester] = useState(true);
	const [customYear, setCustomYear] = useState(currentYear);
	const [customTerm, setCustomTerm] = useState(currentTerm);
	const [reminderValue, setReminderValue] = useState(reminderDefault);
	const [customReminderValue, setCustomReminderValue] = useState(DEFAULT_CUSTOM_REMINDER_VALUE);
	const [customReminderUnit, setCustomReminderUnit] = useState(DEFAULT_CUSTOM_REMINDER_UNIT);
	const [include, setInclude] = useState<Record<string, boolean>>({ ...includeDefaultsProp });
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [openCustomize, setOpenCustomize] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);

	const customTerms = yearItems.find((i) => i.YearStudy === customYear)?.Terms ?? [];
	const resolvedCustomTerm = customTerms.some((t) => t.TermID === customTerm)
		? customTerm
		: customTerms.find((t) => t.CurrentTerm)?.TermID ?? customTerms[0]?.TermID ?? "";

	const effectiveYear = useCurrentSemester ? currentYear : customYear;
	const effectiveTerm = useCurrentSemester ? currentTerm : resolvedCustomTerm;

	const effectiveTermName = useMemo(() => {
		const item = yearItems.find((i) => i.YearStudy === effectiveYear);
		return (
			item?.Terms.find((t) => t.TermID === effectiveTerm)?.TermName ??
			getTermLabel(effectiveTerm)
		);
	}, [yearItems, effectiveYear, effectiveTerm]);

	const semesterState: IcsExportSemesterState = {
		year: effectiveYear,
		term: effectiveTerm,
		label: `${effectiveTermName} • Năm ${effectiveYear}`,
	};

	useEffect(() => {
		onSelectionChange(effectiveYear, effectiveTerm);
	}, [effectiveYear, effectiveTerm, onSelectionChange]);

	useEffect(() => {
		setSelectedIds(items.map((item) => item.id));
		setOpenCustomize(false);
	}, [items]);

	useEffect(() => {
		if (open) {
			setIsDownloading(false);
			setOpenCustomize(false);
		}
	}, [open]);

	const selectedCount = items.filter((item) => selectedIds.includes(item.id)).length;
	const allSelected = items.length > 0 && selectedCount === items.length;

	const handleToggle = (id: string, checked: boolean) => {
		setSelectedIds((prev) =>
			checked ? [...new Set([...prev, id])] : prev.filter((i) => i !== id),
		);
	};

	const toggleAll = (checked: boolean) => {
		setSelectedIds(checked ? items.map((item) => item.id) : []);
	};

	const handleDownload = async () => {
		if (!effectiveYear || !effectiveTerm) {
			showError("Vui lòng chọn năm học và học kỳ");
			return;
		}
		const reminderTrigger = buildReminderTrigger(
			reminderValue,
			customReminderValue,
			customReminderUnit,
		);
		if (reminderTrigger === undefined) {
			showError("Vui lòng nhập thời gian nhắc nhở hợp lệ (lớn hơn hoặc bằng 0).");
			return;
		}
		if (selectedCount === 0) {
			showError(`Vui lòng chọn ít nhất một ${panel?.itemSingular ?? "mục"} để xuất.`);
			return;
		}
		setIsDownloading(true);
		try {
			await onDownload({
				year: effectiveYear,
				term: effectiveTerm,
				reminderTrigger,
				include,
				selectedItems: items.map((item) => ({
					item,
					selected: selectedIds.includes(item.id),
				})),
				selectedCount,
			});
		} catch (err) {
			console.error("Error exporting calendar:", err);
			showError("Không thể tải file lịch. Vui lòng thử lại sau.");
		} finally {
			setIsDownloading(false);
		}
	};

	const renderItemBadges = (item: IcsExportItem<T>): ReactNode => {
		const badges = [...(item.badges ?? [])];
		if (panel?.showMinutesBadge && item.minutes !== undefined) {
			badges.push(`${item.minutes} phút`);
		}
		if (badges.length === 0) return null;
		return (
			<span className="flex flex-wrap items-center gap-1">
				{badges.map((badge, index) => (
					<span
						key={`${item.id}-${index}-${badge}`}
						className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
					>
						{badge}
					</span>
				))}
			</span>
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Icon className="h-5 w-5 text-primary" />
						{title}
					</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
						<Checkbox
							id="ics-use-current-semester"
							checked={useCurrentSemester}
							onCheckedChange={(checked) => setUseCurrentSemester(!!checked)}
						/>
						<Label htmlFor="ics-use-current-semester" className="cursor-pointer">
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
									value={resolvedCustomTerm}
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

				{children}

				{panel && (
					<div className="rounded-lg border border-border p-3 space-y-2">
						<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
							<span className="font-medium text-foreground">{semesterState.label}</span>
							{panel.header?.(semesterState, isDownloading, items.length) ?? (
								<span className="text-xs text-muted-foreground">
									{items.length} {panel.itemsLabel}
								</span>
							)}
						</div>

						{panel.loading ? (
							<div className="space-y-1.5">
								<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
									Đang tải...
								</p>
							</div>
						) : items.length === 0 ? (
							<div className="space-y-1.5">
								<p className="text-sm text-muted-foreground">{panel.empty}</p>
							</div>
						) : (
							<div className="space-y-2">
								<div className="flex items-center justify-between gap-2 text-xs">
									<span className="text-muted-foreground">
										Đã chọn {selectedCount}/{items.length} {panel.itemLabel}
									</span>
									{!openCustomize && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => setOpenCustomize(true)}
											className="gap-1.5"
										>
											<SlidersHorizontal className="h-3.5 w-3.5" />
											Tùy chỉnh
										</Button>
									)}
								</div>

								{panel.summary?.(semesterState, selectedCount, items.length)}

								{openCustomize && (
									<div className="space-y-2">
										<div className="flex items-center justify-between border-t border-border pt-2">
											<span className="text-xs font-medium text-muted-foreground">
												Chọn {panel.itemLabel}
											</span>
											<label className="flex items-center gap-1.5 text-xs cursor-pointer">
												<Checkbox
													checked={allSelected}
													onCheckedChange={(c) => toggleAll(!!c)}
												/>
												Chọn tất cả
											</label>
										</div>
										<ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
											{items.map((item) => {
												const selected = selectedIds.includes(item.id);
												return (
													<li key={item.id} className="flex items-start gap-2">
														<label className="flex min-w-0 flex-1 items-start gap-2 cursor-pointer text-xs">
															<Checkbox
																checked={selected}
																onCheckedChange={(c) => handleToggle(item.id, !!c)}
																className="mt-0.5"
															/>
															<span className="min-w-0 flex-1">
																<span className="block truncate text-foreground">
																	{item.title}
																</span>
																{item.subtitle && (
																	<span className="block text-muted-foreground">
																		{item.subtitle}
																	</span>
																)}
																{renderItemBadges(item)}
															</span>
														</label>
														{panel.extraFields?.(item)}
													</li>
												);
											})}
										</ul>
										<div className="flex justify-end">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setOpenCustomize(false)}
											>
												Ẩn tùy chỉnh
											</Button>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				)}

				<div className="grid gap-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>{reminderLabel}</Label>
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
					</div>

					{includeFieldsProp.length > 0 && (
						<div className="space-y-1.5">
							<Label>Dữ liệu ghi vào sự kiện</Label>
							<div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
								{includeFieldsProp.map((field) => (
									<label
										key={field.key}
										className="flex items-center gap-2 cursor-pointer"
									>
										<Checkbox
											checked={include[field.key] ?? false}
											onCheckedChange={(c) =>
												setInclude((prev) => ({ ...prev, [field.key]: !!c }))
											}
										/>
										{field.label}
									</label>
								))}
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDownloading}
					>
						Hủy
					</Button>
					<Button
						onClick={handleDownload}
						disabled={isDownloading || downloadDisabled}
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

export default IcsExportDialog;