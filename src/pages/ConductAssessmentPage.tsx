import { useState, useEffect, useRef, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getYearAndTermScore,
	getBehaviorScore,
	saveBehaviorScore,
	resourceUpload,
	insertBehaviorDetail,
	deleteBehaviorDetail,
	showBehaviorDiscussion,
	insertBehaviorDiscussion,
	showEditBehaviorDetailForm,
	type YearTermScoreData,
	type BehaviorData,
	type BehaviorDetailItem,
	type BehaviorDiscussion,
} from "@/services/conductService";
import { getToken } from "@/services/authService";
import { useGlobalNotification } from "@/hooks/useGlobalNotification";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Loader2,
	ClipboardCheck,
	Award,
	ChevronRight,
	Star,
	Save,
	Lock,
	Minus,
	Plus,
	Upload,
	Trash2,
	Paperclip,
	MessageSquare,
	Send,
	AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupSection {
	name: string;
	items: BehaviorDetailItem[];
}

interface BehaviorGroup {
	id: string;
	order: number;
	name: string;
	maxScore: number;
	sections: GroupSection[];
}

const isRadioItem = (item: BehaviorDetailItem): boolean =>
	Boolean(item.GroupRadiobutton) && item.GroupRadiobutton !== "0" && item.GroupRadiobutton !== "00";

const isCheckItem = (item: BehaviorDetailItem): boolean =>
	item.UseCheck === true;

const deriveRadioSelection = (items: BehaviorDetailItem[]): Record<string, string | null> => {
	const selection: Record<string, string | null> = {};
	for (const item of items) {
		if (!isRadioItem(item)) continue;
		const group = item.GroupRadiobutton ?? "";
		if (group && Number(item.IndividualScore) === Number(item.MaxScore) && Number(item.MaxScore) !== 0) {
			selection[group] = item.BehaviorDetailID;
		} else if (!(group in selection)) {
			selection[group] = null;
		}
	}
	return selection;
};

const renderHtml = (content: string): { __html: string } => ({
	__html: content || "",
});

const isEmptyTermData = (items: BehaviorDetailItem[]): boolean =>
	!items || items.length === 0 || items.every((item) => item.BehaviorGroupID === null);

function getConductRankFromScore(score: number): string {
	if (score >= 90) return "Xuất sắc";
	if (score >= 80) return "Tốt";
	if (score >= 65) return "Khá";
	if (score >= 50) return "Trung bình";
	if (score >= 35) return "Kém";
	return "Yếu";
}

const clampScore = (value: number, max: number): number =>
	Math.max(0, Math.min(value, Math.max(0, max)));

const getStudentId = (): string => {
	try {
		const token = getToken();
		if (!token) return "";
		const payload = JSON.parse(atob(token.split(".")[1]));
		return payload.Id || payload.StudentID || "";
	} catch {
		return "";
	}
};

function ConductAssessmentPage() {
	const [yearTermData, setYearTermData] = useState<YearTermScoreData | null>(null);
	const [behaviorData, setBehaviorData] = useState<BehaviorData | null>(null);
	const [scores, setScores] = useState<Record<string, number>>({});
	const [radioSelected, setRadioSelected] = useState<Record<string, string | null>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedTerm, setSelectedTerm] = useState("");
	const { showError, showSuccess } = useGlobalNotification();
	const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

	// Fetch year and term data
	useEffect(() => {
		const fetchYearTermData = async () => {
			try {
				const data = await getYearAndTermScore();
				setYearTermData(data);
				setSelectedYear(data.CurrentYear);
				setSelectedTerm(data.CurrentTerm);
			} catch (err) {
				console.error("Error:", err);
				showError("Không thể tải dữ liệu năm học");
			}
		};
		fetchYearTermData();
	}, [showError]);

	// Fetch behavior data when year/term changes
	useEffect(() => {
		const fetchBehaviorData = async () => {
			if (!selectedYear || !selectedTerm) return;

			setIsLoading(true);
			try {
				const data = await getBehaviorScore(selectedYear, selectedTerm);
				setBehaviorData(data);
				const nextScores: Record<string, number> = {};
				const items = data.ResultDataBangDanhGia ?? [];
				items.forEach((item) => {
					nextScores[item.BehaviorDetailID] =
						typeof item.IndividualScore === "number" ? item.IndividualScore : 0;
				});
				setScores(nextScores);
				setRadioSelected(deriveRadioSelection(items));
			} catch (err) {
				console.error("Error:", err);
				showError("Không thể tải dữ liệu đánh giá điểm rèn luyện");
			} finally {
				setIsLoading(false);
			}
		};

		fetchBehaviorData();
	}, [selectedYear, selectedTerm, showError]);

	// Group behavior items by BehaviorGroupID then by BehaviorName (section)
	const getGroupedData = (items: BehaviorDetailItem[]): BehaviorGroup[] => {
		const groups: BehaviorGroup[] = [];
		const byGroup = new Map<string, BehaviorGroup>();

		for (const item of items) {
			if (item.BehaviorGroupID === null) continue;
			let group = byGroup.get(item.BehaviorGroupID);
			if (!group) {
				group = {
					id: item.BehaviorGroupID,
					order: Number(item.BehaviorGroupOrder) || 0,
					name: item.BehaviorGroupName,
					maxScore: Number(item.MaxScoreGroup) || 0,
					sections: [],
				};
				byGroup.set(item.BehaviorGroupID, group);
				groups.push(group);
			}
			let section = group.sections.find((s) => s.name === item.BehaviorName);
			if (!section) {
				section = { name: item.BehaviorName, items: [] };
				group.sections.push(section);
			}
			section.items.push(item);
		}

		groups.sort((a, b) => a.order - b.order);
		return groups;
	};

	const editable =
		(behaviorData?.ThoiGianNhapDiem ?? false) &&
		(behaviorData?.ThoiHanNhapDiemSinhVien ?? false) &&
		!(behaviorData?.IsSaveBehavior ?? false);

	const groups = behaviorData ? getGroupedData(behaviorData.ResultDataBangDanhGia ?? []) : [];
	const groupedItems = behaviorData?.ResultDataBangDanhGia ?? [];

	// Live computed totals
	const effectivelySaved = Boolean(behaviorData?.IsSaveBehavior);
	const finalResult = behaviorData?.KetQuaDanhGia?.[0];
	const showSavedResult = !editable && Boolean(finalResult);
	const liveTotal = clampScore(
		groupedItems.reduce(
			(sum, item) => sum + Number(scores[item.BehaviorDetailID] ?? 0),
			0,
		),
		100,
	);
	const displayTotal = clampScore(
		showSavedResult ? Number(finalResult?.Scores) || 0 : liveTotal,
		100,
	);
	const displayRank =
		showSavedResult && finalResult
			? finalResult.BehaviorScoreRank
			: getConductRankFromScore(displayTotal);

	const scrollToSection = (groupId: string) => {
		sectionRefs.current[groupId]?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	const getRankColor = (rank: string) => {
		switch (rank) {
			case "Xuất sắc":
				return "bg-gradient-to-r from-yellow-400 to-amber-500 text-white";
			case "Tốt":
				return "bg-gradient-to-r from-green-400 to-emerald-500 text-white";
			case "Khá":
				return "bg-gradient-to-r from-blue-400 to-cyan-500 text-white";
			case "Trung bình":
				return "bg-gradient-to-r from-gray-400 to-slate-500 text-white";
			case "Yếu":
				return "bg-gradient-to-r from-orange-400 to-red-500 text-white";
			case "Kém":
				return "bg-gradient-to-r from-orange-400 to-red-500 text-white";
			default:
				return "bg-muted text-muted-foreground";
		}
	};

	const updateScore = (id: string, raw: string) => {
		const value = raw === "" || raw === "-" ? 0 : Number(raw);
		setScores((prev) => ({ ...prev, [id]: Number.isFinite(value) ? value : 0 }));
	};

	const updateRadioGroup = (selectedId: string, items: BehaviorDetailItem[]) => {
		setScores((prev) => {
			const next = { ...prev };
			items.forEach((item) => {
				next[item.BehaviorDetailID] =
					item.BehaviorDetailID === selectedId ? Number(item.MaxScore) || 0 : 0;
			});
			return next;
		});
		const group = items[0]?.GroupRadiobutton;
		if (group) {
			setRadioSelected((prev) => ({ ...prev, [group]: selectedId }));
		}
	};

	const updateCheckScore = (id: string, checked: boolean, item: BehaviorDetailItem) => {
		setScores((prev) => ({
			...prev,
			[id]: checked ? Number(item.MaxScore) || 0 : 0,
		}));
	};

	const handleSave = async () => {
		if (!behaviorData || !selectedYear || !selectedTerm) return;
		setIsSaving(true);
		try {
			const behaviors = groupedItems
				.filter((item) => !item.BehaviorDetailIDParent)
				.map((item) => {
					const isEditable = item.ReadOnly !== "1";
					return {
						...item,
						IndividualScore: isEditable
							? Number(scores[item.BehaviorDetailID] ?? 0)
							: item.IndividualScore,
					};
				});
			await saveBehaviorScore(selectedYear, selectedTerm, behaviors);
			showSuccess("Đã lưu đánh giá điểm rèn luyện thành công");
			const data = await getBehaviorScore(selectedYear, selectedTerm);
			setBehaviorData(data);
			const nextScores: Record<string, number> = {};
			const savedItems = data.ResultDataBangDanhGia ?? [];
			savedItems.forEach((i) => {
				nextScores[i.BehaviorDetailID] =
					typeof i.IndividualScore === "number" ? i.IndividualScore : 0;
			});
			setScores(nextScores);
			setRadioSelected(deriveRadioSelection(savedItems));
		} catch (err) {
			console.error("Save error:", err);
			showError("Không thể lưu đánh giá điểm rèn luyện. Vui lòng thử lại.");
		} finally {
			setIsSaving(false);
		}
	};

	const reloadBehaviorData = async (): Promise<boolean> => {
		if (!selectedYear || !selectedTerm) return false;
		try {
			const data = await getBehaviorScore(selectedYear, selectedTerm);
			setBehaviorData(data);
			const nextScores: Record<string, number> = {};
			const items = data.ResultDataBangDanhGia ?? [];
			items.forEach((i) => {
				nextScores[i.BehaviorDetailID] =
					typeof i.IndividualScore === "number" ? i.IndividualScore : 0;
			});
			setScores(nextScores);
			setRadioSelected(deriveRadioSelection(items));
			return true;
		} catch (err) {
			console.error("Reload error:", err);
			showError("Không thể tải lại dữ liệu. Vui lòng tải lại trang.");
			return false;
		}
	};

	const [pendingEvidence, setPendingEvidence] = useState<Record<string, File | null>>({});
	const [evidenceNote, setEvidenceNote] = useState<Record<string, string>>({});
	const [evidenceBusy, setEvidenceBusy] = useState<Record<string, boolean>>({});
	const [evidenceImages, setEvidenceImages] = useState<Record<string, string>>({});

	const loadEvidenceImages = async (items: BehaviorDetailItem[]) => {
		if (!selectedYear || !selectedTerm) return;
		const children = items.filter((i) => i.BehaviorDetailIDParent);
		const images: Record<string, string> = {};
		let failed = 0;
		for (const child of children) {
			try {
				const data = await showEditBehaviorDetailForm(child.BehaviorDetailID, selectedYear, selectedTerm);
				if (data?.HinhAnh) {
					images[child.BehaviorDetailID] = data.HinhAnh;
				}
			} catch (err) {
				console.error("Evidence image error:", err);
				failed += 1;
			}
		}
		setEvidenceImages((prev) => ({ ...prev, ...images }));
		if (failed > 0) {
			showError(failed === children.length
				? "Không thể tải hình ảnh minh chứng. Vui lòng thử lại."
				: `Không tải được ${failed} hình ảnh minh chứng.`);
		}
	};

	useEffect(() => {
		if (groupedItems.length > 0 && selectedYear && selectedTerm && behaviorData) {
			loadEvidenceImages(groupedItems);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedYear, selectedTerm, behaviorData?.IsSaveBehavior, behaviorData?.ResultDataBangDanhGia?.length]);

	const handleAttachEvidence = async (parentId: string) => {
		if (!selectedYear || !selectedTerm) return;
		const file = pendingEvidence[parentId];
		const note = (evidenceNote[parentId] ?? "").trim();
		if (!file) {
			showError("Vui lòng chọn ảnh minh chứng trước khi đính kèm.");
			return;
		}
		if (!note) {
			showError("Vui lòng nhập nội dung minh chứng.");
			return;
		}
		const allowedTypes = ["image/png", "image/jpeg"];
		if (!allowedTypes.includes(file.type) && !/\.(png|jpe?g)$/i.test(file.name)) {
			showError("Chỉ được đính kèm ảnh định dạng PNG hoặc JPG.");
			return;
		}
		setEvidenceBusy((prev) => ({ ...prev, [parentId]: true }));
		try {
			const imageUrl = await resourceUpload(file);
			await insertBehaviorDetail(parentId, note, imageUrl, selectedYear, selectedTerm);
			setPendingEvidence((prev) => ({ ...prev, [parentId]: null }));
			setEvidenceNote((prev) => ({ ...prev, [parentId]: "" }));
			showSuccess("Đã đính kèm minh chứng thành công");
			await reloadBehaviorData();
		} catch (err) {
			console.error("Attach error:", err);
			showError("Không thể đính kèm minh chứng. Vui lòng thử lại.");
		} finally {
			setEvidenceBusy((prev) => ({ ...prev, [parentId]: false }));
		}
	};

	const handleRemoveEvidence = async (childId: string) => {
		if (!selectedYear || !selectedTerm) return;
		setEvidenceBusy((prev) => ({ ...prev, [`del-${childId}`]: true }));
		try {
			await deleteBehaviorDetail(childId, selectedYear, selectedTerm);
			showSuccess("Đã xóa minh chứng thành công");
			await reloadBehaviorData();
		} catch (err) {
			console.error("Remove error:", err);
			showError("Không thể xóa minh chứng. Vui lòng thử lại.");
		} finally {
			setEvidenceBusy((prev) => ({ ...prev, [`del-${childId}`]: false }));
		}
	};

	const [discussionsByItem, setDiscussionsByItem] = useState<Record<string, BehaviorDiscussion[]>>({});
	const [discussionItemId, setDiscussionItemId] = useState<string | null>(null);
	const [discussionDraft, setDiscussionDraft] = useState<string>("");
	const [discussionLoading, setDiscussionLoading] = useState(false);
	const [discussionError, setDiscussionError] = useState<string | null>(null);

	const openDiscussion = async (itemId: string) => {
		setDiscussionItemId(itemId);
		setDiscussionDraft("");
		setDiscussionError(null);
		if (!discussionsByItem[itemId] && selectedYear && selectedTerm) {
			setDiscussionLoading(true);
			try {
				const data = await showBehaviorDiscussion(itemId, selectedYear, selectedTerm);
				setDiscussionsByItem((prev) => ({ ...prev, [itemId]: data }));
			} catch (err) {
				console.error("Discussion load error:", err);
				setDiscussionError("Không thể tải thảo luận. Vui lòng thử lại.");
			} finally {
				setDiscussionLoading(false);
			}
		}
	};

	const handleSubmitDiscussion = async (itemId: string) => {
		const content = discussionDraft.trim();
		if (!selectedYear || !selectedTerm || !content) return;
		const studentId = getStudentId();
		if (!studentId) {
			showError("Không xác định được mã sinh viên.");
			return;
		}
		setDiscussionLoading(true);
		setDiscussionError(null);
		try {
			await insertBehaviorDiscussion(itemId, content, selectedYear, selectedTerm, studentId);
			setDiscussionDraft("");
			const data = await showBehaviorDiscussion(itemId, selectedYear, selectedTerm);
			setDiscussionsByItem((prev) => ({ ...prev, [itemId]: data }));
			await reloadBehaviorData();
			showSuccess("Bình luận thành công");
		} catch (err) {
			console.error("Discussion error:", err);
			setDiscussionError("Không thể gửi bình luận. Vui lòng thử lại.");
			showError("Không thể gửi bình luận. Vui lòng thử lại.");
		} finally {
			setDiscussionLoading(false);
		}
	};

	const activeDiscussionItem = discussionItemId
		? groupedItems.find((i) => i.BehaviorDetailID === discussionItemId) ?? null
		: null;

	if (!yearTermData) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center space-y-4">
					<Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
					<p className="text-muted-foreground">Đang tải dữ liệu...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl md:text-3xl font-bold text-foreground">Đánh giá điểm rèn luyện</h1>
				<p className="text-sm text-muted-foreground">Tự đánh giá điểm rèn luyện theo từng học kỳ</p>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-4">
				<div className="flex items-center gap-2">
					<label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
						Năm học
					</label>
					<Select value={selectedYear} onValueChange={setSelectedYear}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Chọn năm học" />
						</SelectTrigger>
						<SelectContent>
							{yearTermData.YearStudy.map((year) => (
								<SelectItem key={year} value={year}>
									Năm học {year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
						Học kỳ
					</label>
					<Select value={selectedTerm} onValueChange={setSelectedTerm}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Chọn học kỳ" />
						</SelectTrigger>
						<SelectContent>
							{yearTermData.Terms.map((term) => (
								<SelectItem key={term.TermID} value={term.TermID}>
									{term.TermName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{behaviorData && (
					<div className="flex items-center gap-2">
						{effectivelySaved ? (
							<Badge variant="outline" className="gap-1">
								<Lock className="h-3 w-3" /> Đã nộp đánh giá
							</Badge>
						) : editable ? (
							<Badge variant="outline" className="border-green-500/50 text-green-600">
								Đang mở đánh giá
							</Badge>
						) : (
							<Badge variant="outline" className="text-muted-foreground">
								Đánh giá chưa mở
							</Badge>
						)}
					</div>
				)}
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-8 h-8 animate-spin text-primary" />
				</div>
			) : (
				<>
					{/* Locked / closed notice */}
					{behaviorData && !editable && !effectivelySaved && (
						<Card className="border-0 shadow-lg bg-muted/30">
							<CardContent className="py-3 flex items-center gap-2 text-sm text-muted-foreground">
								<Lock className="h-4 w-4" />
								Học kỳ này chưa mở đánh giá hoặc đã hết hạn nhập điểm. Bạn chỉ có thể xem dữ liệu.
							</CardContent>
						</Card>
					)}

					{isEmptyTermData(groupedItems) ? (
						<Card className="border-0 shadow-lg">
							<CardContent className="py-12">
								<div className="text-center">
									<ClipboardCheck className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
									<p className="text-muted-foreground">
										Chưa có dữ liệu đánh giá điểm rèn luyện cho học kỳ này
									</p>
								</div>
							</CardContent>
						</Card>
					) : (
						<>
							{/* Final Result Card */}
							<Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
								<CardHeader className="pb-2">
									<CardTitle className="flex items-center gap-2 text-lg">
										<Award className="h-5 w-5 text-primary" />
										Kết quả đánh giá
									</CardTitle>
								</CardHeader>
								<CardContent>
									{/* Score breakdown - clickable to scroll */}
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
										{groups.map((group) => {
											const groupTotal = clampScore(
												group.sections
													.flatMap((s) => s.items)
													.reduce((sum, item) => sum + Number(scores[item.BehaviorDetailID] ?? 0), 0),
												group.maxScore,
											);
											return (
												<button
													key={group.id}
													onClick={() => scrollToSection(group.id)}
													className="p-3 rounded-lg bg-background/80 hover:bg-background transition-colors text-left group"
												>
													<p className="text-xs text-muted-foreground truncate mb-1 group-hover:text-primary transition-colors">
															<span dangerouslySetInnerHTML={renderHtml(group.name)} />
														</p>
													<div className="flex items-center justify-between">
														<span
															className={cn(
																"font-bold text-lg",
																groupTotal > 0
																	? "text-green-600"
																	: groupTotal < 0
																		? "text-red-600"
																		: "text-foreground",
															)}
														>
															{groupTotal}/{group.maxScore}
														</span>
														<ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
													</div>
												</button>
											);
										})}
									</div>

									{/* Total Score */}
									<div className="flex items-center justify-between p-4 rounded-xl bg-background">
										<div className="flex items-center gap-3">
											<Star className="w-8 h-8 text-primary" />
											<div>
												<p className="text-sm text-muted-foreground">
													{showSavedResult ? "Tổng điểm rèn luyện" : "Tổng điểm tự đánh giá"}
												</p>
												<Badge className={cn("mt-1", getRankColor(displayRank))}>
													{displayRank}
												</Badge>
											</div>
										</div>
										<span className="text-4xl font-bold text-primary">{displayTotal}</span>
									</div>
								</CardContent>
							</Card>

							{/* Score Groups */}
							{groups.map((group) => {
								const groupItems = group.sections.flatMap((s) => s.items);
								const groupTotal = clampScore(
									groupItems.reduce(
										(sum, item) => sum + Number(scores[item.BehaviorDetailID] ?? 0),
										0,
									),
									group.maxScore,
								);
								return (
									<Card
										key={group.id}
										ref={(el) => {
											sectionRefs.current[group.id] = el;
										}}
										id={`section-${group.id}`}
										className="border-0 shadow-lg scroll-mt-4"
									>
										<CardHeader className="pb-2">
											<div className="flex items-center justify-between">
												<CardTitle className="flex items-center gap-2 text-lg">
													<ClipboardCheck className="h-5 w-5 text-primary" />
													<span dangerouslySetInnerHTML={renderHtml(group.name)} />
												</CardTitle>
												<div className="flex items-center gap-3">
													<Badge
														variant="outline"
														className={cn(
															"font-mono font-bold",
															groupTotal > 0
																? "text-green-600 border-green-600/50"
																: groupTotal < 0
																	? "text-red-600 border-red-600/50"
																	: "text-foreground",
														)}
													>
														{groupTotal}/{group.maxScore}
													</Badge>
												</div>
											</div>
										</CardHeader>
										<CardContent className="space-y-4">
											{group.sections.map((section) => {
												const sectionItems = section.items.filter((i) => !i.BehaviorDetailIDParent);
												const radioItems = sectionItems.filter(isRadioItem);
												const checkItems = sectionItems.filter((i) => !isRadioItem(i) && isCheckItem(i));
												const normalItems = sectionItems.filter((i) => !isRadioItem(i) && !isCheckItem(i));
												const showTitle =
													section.items.length > 1 ||
													(section.items.length === 1 &&
														!(
															normalItems.length === 1 &&
															normalItems[0].BehaviorDetailName === section.name
														));

												return (
													<div
														key={section.name}
														className="overflow-hidden rounded-lg border border-border"
													>
														{showTitle && (
															<div
																className="px-3 py-2 bg-muted/40 font-semibold text-sm text-foreground border-b border-border"
																dangerouslySetInnerHTML={renderHtml(section.name)}
															/>
														)}
														<div className="overflow-x-auto">
															<table className="w-full text-sm">
																<colgroup>
																	<col className="w-[45%]" />
																	<col className="w-[15%]" />
																	<col className="w-[40%]" />
																</colgroup>
																<tbody>
																	{normalItems.map((item, index) => {
																		const rowDisabled = !editable || item.ReadOnly === "1";
																		const cellBg =
																			!editable || item.ReadOnly === "1"
																				? "bg-blue-50 dark:bg-blue-950/30"
																				: "bg-white dark:bg-transparent";
																		const childEvidence = item.IsAdd === true
																			? groupedItems.filter((i) => i.BehaviorDetailIDParent === item.BehaviorDetailID)
																			: [];
																		return (
																			<Fragment key={item.BehaviorDetailID}>
																				<tr
																					key={item.BehaviorDetailID}
																					className={cn(
																						"border-b border-border/50",
																						index === normalItems.length - 1 && "border-b-0",
																						"hover:bg-muted/30",
																						cellBg,
																					)}
																				>
																				<td className="py-2 px-3 text-foreground">
																					<div className="flex items-center justify-between gap-2">
																						<span className="inline-flex min-w-0 items-center gap-1.5">
																							{rowDisabled && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
																							<span className="min-w-0" dangerouslySetInnerHTML={renderHtml(item.BehaviorDetailName)} />
																						</span>
																						<button
																							type="button"
																							onClick={() => openDiscussion(item.BehaviorDetailID)}
																							className="inline-flex shrink-0 items-center gap-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
																							title="Xem thảo luận của điều kiện"
																						>
																							<MessageSquare className="h-4 w-4" />
																							{item.TotalBehaviorDiscussion ? (
																								<span className="text-xs font-semibold">
																									{Number(item.TotalBehaviorDiscussion)}
																								</span>
																							) : null}
																						</button>
																					</div>
																				</td>
																				<td className="py-2 px-3 text-center text-muted-foreground">
																					{item.MaxScore}
																				</td>
																				<td className="py-2 px-3 text-center">
																					<div
																						className={cn(
																							"inline-flex items-center rounded-lg border border-border bg-background",
																							rowDisabled && "opacity-60",
																						)}
																					>
																						<button
																							type="button"
																							disabled={rowDisabled}
																							onClick={() =>
																								updateScore(
																									item.BehaviorDetailID,
																									String(
																										Math.max(
																											Math.min(item.MaxScore, 0),
																											Number(scores[item.BehaviorDetailID] ?? 0) - 1,
																										),
																									),
																								)
																							}
																							title="Giảm điểm"
																							className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
																						>
																							<Minus className="h-4 w-4" />
																						</button>
																						<span className="min-w-10 px-1 text-center font-mono font-bold">
																							{scores[item.BehaviorDetailID] ?? 0}
																						</span>
																						<button
																							type="button"
																							disabled={rowDisabled}
																							onClick={() =>
																								updateScore(
																									item.BehaviorDetailID,
																									String(
																										Math.min(
																											Math.max(item.MaxScore, 0),
																											Number(scores[item.BehaviorDetailID] ?? 0) + 1,
																										),
																									),
																								)
																							}
																							title="Tăng điểm"
																							className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
																						>
																							<Plus className="h-4 w-4" />
																						</button>
																					</div>
																				</td>
																			</tr>
																			{item.IsAdd === true && (
																				<tr key={`evidence-${item.BehaviorDetailID}`} className="border-b border-border/50 bg-muted/20">
																					<td colSpan={3} className="py-2 px-3">
																						<div className="space-y-2">
																							{childEvidence.length > 0 && (
																								<div className="space-y-1">
																									<p className="text-xs font-medium text-muted-foreground">
																										Minh chứng đã đính kèm ({childEvidence.length})
																									</p>
																									{childEvidence.map((child) => (
																										<div
																											key={child.BehaviorDetailID}
																											className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-sm"
																										>
																											{evidenceImages[child.BehaviorDetailID] ? (
																												<a
																													href={evidenceImages[child.BehaviorDetailID]}
																													target="_blank"
																													rel="noopener noreferrer"
																													title="Mở ảnh minh chứng"
																													className="inline-flex shrink-0 items-center gap-1.5 text-primary hover:underline"
																												>
																													<img
																														src={evidenceImages[child.BehaviorDetailID]}
																														alt="Minh chứng"
																														className="h-9 w-12 rounded border border-border object-cover"
																													/>
																												</a>
																											) : (
																												<Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
																											)}
																											<span className="flex-1 truncate text-muted-foreground">
																												{child.BehaviorDetailName.replace(/^\s*=>\s*/, "") || child.BehaviorDetailName}
																											</span>
																											{editable && (
																												<button
																													type="button"
																													disabled={!!evidenceBusy[`del-${child.BehaviorDetailID}`]}
																													onClick={() => handleRemoveEvidence(child.BehaviorDetailID)}
																													title="Xóa minh chứng"
																													className="p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
																												>
																													<Trash2 className="h-3.5 w-3.5" />
																												</button>
																											)}
																										</div>
																									))}
																								</div>
																							)}
																							{editable && (
																								<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
																									<div className="flex-1">
																										<label className="mb-1.5 block text-xs font-medium text-muted-foreground">
																											Nội dung minh chứng <span className="text-destructive">*</span>
																										</label>
																										<Input
																											placeholder="Mô tả nội dung minh chứng..."
																											value={evidenceNote[item.BehaviorDetailID] ?? ""}
																											onChange={(e) =>
																												setEvidenceNote((prev) => ({
																													...prev,
																													[item.BehaviorDetailID]: e.target.value,
																												}))
																											}
																											className="h-9"
																										/>
																									</div>
																									<label className="block">
																										<span className="mb-1.5 block text-xs font-medium text-muted-foreground">
																											Ảnh minh chứng <span className="text-destructive">*</span>
																										</span>
																										<span className="flex h-9 items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
																											<Upload className="h-4 w-4" />
																											<span className="max-w-40 truncate">
{pendingEvidence[item.BehaviorDetailID]
																												? pendingEvidence[item.BehaviorDetailID]?.name
																												: "Chọn ảnh..."}
																											</span>
																										</span>
																										<input
																											type="file"
																											accept=".png,.jpg,.jpeg,image/png,image/jpeg"
																											className="hidden"
																											onChange={(e) => {
																												const file = e.target.files?.[0] ?? null;
																												if (file && !/image\/(png|jpe?g)/.test(file.type) && !/\.(png|jpe?g)$/i.test(file.name)) {
																													showError("Chỉ được đính kèm ảnh định dạng PNG hoặc JPG.");
																													e.target.value = "";
																													return;
																												}
																												setPendingEvidence((prev) => ({
																													...prev,
																													[item.BehaviorDetailID]: file,
																												}));
																											}}
																										/>
																									</label>
																									<Button
																										type="button"
																										disabled={!!evidenceBusy[item.BehaviorDetailID]}
																										onClick={() => handleAttachEvidence(item.BehaviorDetailID)}
																										className="h-9 gap-1.5"
																									>
																										{evidenceBusy[item.BehaviorDetailID] ? (
																											<Loader2 className="h-4 w-4 animate-spin" />
																										) : (
																											<Paperclip className="h-4 w-4" />
																										)}
Đính kèm
																									</Button>
																								</div>
																							)}
																						</div>
																					</td>
																					</tr>
																				)}
																		</Fragment>
																);
															})}
																	{checkItems.map((item, index) => {
																		const rowDisabled = !editable || item.ReadOnly === "1";
																		const cellBg =
																			!editable || item.ReadOnly === "1"
																				? "bg-blue-50 dark:bg-blue-950/30"
																				: "bg-white dark:bg-transparent";
																		const checked =
																			Number(scores[item.BehaviorDetailID] ?? 0) ===
																			Number(item.MaxScore);
																		return (
																			<Fragment key={item.BehaviorDetailID}>
																				<tr
																					key={item.BehaviorDetailID}
																					className={cn(
																						"border-b border-border/50",
																						index === checkItems.length - 1 && "border-b-0",
																						"hover:bg-muted/30",
																						cellBg,
																					)}
																				>
																				<td className="py-2 px-3 text-foreground">
																					<div className="flex items-center justify-between gap-2">
																						<span className="inline-flex min-w-0 items-center gap-1.5">
																							{rowDisabled && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
																							<span className="min-w-0" dangerouslySetInnerHTML={renderHtml(item.BehaviorDetailName)} />
																						</span>
																						<button
																							type="button"
																							onClick={() => openDiscussion(item.BehaviorDetailID)}
																							className="inline-flex shrink-0 items-center gap-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
																							title="Xem thảo luận của điều kiện"
																						>
																							<MessageSquare className="h-4 w-4" />
																							{item.TotalBehaviorDiscussion ? (
																								<span className="text-xs font-semibold">
																									{Number(item.TotalBehaviorDiscussion)}
																								</span>
																							) : null}
																						</button>
																					</div>
																				</td>
																				<td className="py-2 px-3 text-center text-muted-foreground">
																					{item.MaxScore}
																				</td>
<td className="py-2 px-3 text-center">
																					<div className="flex items-center justify-center gap-2">
																					<label
																			className={cn(
																				"inline-flex items-center gap-2 cursor-pointer",
																				rowDisabled && "cursor-not-allowed",
																			)}
																		>
<Checkbox
																					checked={checked}
																					disabled={rowDisabled}
																					onCheckedChange={(val) =>
																						updateCheckScore(
																							item.BehaviorDetailID,
																							val === true,
																							item,
																						)
																					}
																				/>
																			</label>
																					</div>
																				</td>
																			</tr>
																		</Fragment>
																	);
																})}
																	{radioItems.length > 0 && (
																		<tr className="border-b border-border/50">
																			<td colSpan={3} className="p-2 px-3">
																				<div className="space-y-1">
{radioItems.map((item) => {
																		const checked =
																			radioSelected[item.GroupRadiobutton ?? ""] ===
																			item.BehaviorDetailID;
																						return (
<label
																								key={item.BehaviorDetailID}
																								className={cn(
																									"flex items-start gap-3 rounded-md px-2 py-1 cursor-pointer",
																									checked && "bg-primary/10",
																									!editable && "cursor-not-allowed",
																								)}
																							>
																								<Checkbox
																									checked={checked}
																									disabled={!editable}
																									onCheckedChange={() =>
																										updateRadioGroup(
																											item.BehaviorDetailID,
																											radioItems,
																										)
																									}
																									className="size-5 rounded-full mt-0.5"
																								/>
<span className="flex-1 text-sm text-foreground">
																									<span className="inline-flex items-center gap-1.5">
																										{!editable && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
																										<span dangerouslySetInnerHTML={renderHtml(item.BehaviorDetailName)} />
																									</span>
																								</span>
																								<span className="text-sm text-muted-foreground">
																									{item.MaxScore}
																								</span>
																							</label>
																						);
																					})}
																				</div>
																			</td>
																		</tr>
																	)}
																</tbody>
															</table>
														</div>
													</div>
												);
											})}
										</CardContent>
									</Card>
								);
							})}

							{/* Save Action */}
							{(editable || effectivelySaved) && (
								<div className="sticky bottom-0 z-10 bg-background/90 backdrop-blur-sm border border-border/60 rounded-xl shadow-lg px-4 py-3 space-y-3">
									{groups.length > 0 && (
										<div className="flex items-center gap-3">
											<span className="text-sm text-muted-foreground shrink-0">Nhóm:</span>
											<div className="flex items-center gap-1.5 overflow-x-auto flex-1">
												{groups.map((group, index) => (
													<button
														key={group.id}
														onClick={() => scrollToSection(group.id)}
														title={group.name.replace(/<[^>]*>/g, "")}
														className={cn(
															"shrink-0 w-8 h-8 rounded-lg text-sm font-semibold border transition-colors",
															"hover:bg-primary hover:text-primary-foreground hover:border-primary",
														)}
													>
														{index + 1}
													</button>
												))}
											</div>
										</div>
									)}
									<div className="flex items-center justify-between gap-4">
										<div className="flex items-center gap-4">
											<div className="flex items-center gap-2">
												<span className="text-sm text-muted-foreground">Tổng điểm:</span>
												<span
													className={cn(
														"text-2xl font-bold",
														liveTotal > 0
															? "text-green-600"
															: liveTotal < 0
																? "text-red-600"
																: "text-foreground",
													)}
												>
													{liveTotal}
												</span>
											</div>
											<Badge
												className={cn(
													"hidden sm:inline-flex",
													getRankColor(getConductRankFromScore(liveTotal)),
												)}
											>
												{getConductRankFromScore(liveTotal)}
											</Badge>
										</div>
										{editable && (
											<Button onClick={handleSave} disabled={isSaving} className="gap-2">
												{isSaving ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Save className="h-4 w-4" />
												)}
												{isSaving ? "Đang lưu..." : "Lưu đánh giá"}
											</Button>
										)}
										{effectivelySaved && (
											<Button variant="outline" disabled>
												<Lock className="h-4 w-4" />
												Đã nộp
											</Button>
										)}
									</div>
								</div>
							)}
						</>
					)}
				</>
			)}

			{/* Discussion Dialog */}
			<Dialog open={Boolean(activeDiscussionItem)} onOpenChange={(open) => !open && setDiscussionItemId(null)}>
				<DialogContent className="sm:max-w-xl flex flex-col max-h-[85vh]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<MessageSquare className="h-4 w-4 text-primary" />
							Thảo luận của điều kiện
						</DialogTitle>
						<DialogDescription className="line-clamp-2">
							{activeDiscussionItem
								? activeDiscussionItem.BehaviorDetailName.replace(/<[^>]+>/g, "")
								: ""}
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-3 min-h-0 flex-1">
						{discussionError && (
							<div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
								<AlertCircle className="h-4 w-4 shrink-0" />
								<span className="flex-1">{discussionError}</span>
								<button
									type="button"
									onClick={() => discussionItemId && openDiscussion(discussionItemId)}
									className="shrink-0 font-semibold underline-offset-2 hover:underline"
								>
									Thử lại
								</button>
							</div>
						)}
						<div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-0">
							{discussionLoading ? (
								<div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
									<Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
								</div>
							) : (discussionsByItem[discussionItemId ?? ""] ?? []).length === 0 ? (
								<div className="py-8 text-center">
									<MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
									<p className="text-sm text-muted-foreground">Chưa có bình luận nào.</p>
								</div>
							) : (
								(discussionsByItem[discussionItemId ?? ""] ?? []).map((d, i) => (
									<div key={i} className="rounded-lg border border-border bg-card px-3 py-2.5">
										<div className="flex items-center justify-between gap-2">
											<span className="flex items-center gap-2 text-xs font-semibold text-foreground">
												<span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
													{(d.SenderName || "?").charAt(0).toUpperCase()}
												</span>
												{d.SenderName}
											</span>
											<span className="text-xs text-muted-foreground">
												{new Date(d.UpdateDate).toLocaleString("vi-VN")}
											</span>
										</div>
										<p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">{d.Comment}</p>
									</div>
								))
							)}
						</div>

						<div className="flex items-center gap-2 border-t border-border pt-3">
							<Input
								placeholder="Nhập bình luận..."
								value={discussionDraft}
								onChange={(e) => setDiscussionDraft(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										if (discussionItemId) handleSubmitDiscussion(discussionItemId);
									}
								}}
								disabled={discussionLoading}
								className="h-9 flex-1"
							/>
							<Button
								type="button"
								disabled={discussionLoading || !discussionDraft.trim()}
								onClick={() => discussionItemId && handleSubmitDiscussion(discussionItemId)}
								className="gap-1.5"
							>
								{discussionLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Send className="h-4 w-4" />
								)}
								Gửi
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default ConductAssessmentPage;
