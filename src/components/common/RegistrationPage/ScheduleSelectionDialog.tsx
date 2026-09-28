import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter
} from '@/components/ui/dialog';
import { Loader2, BookOpen, CalendarClock, BookMarked, Check, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTheoryCourseType } from '@/lib/courseType';
import { useGlobalNotification } from '@/hooks/useGlobalNotification';
import { InlineLoader } from '@/components/common/InlineLoader';
import { EmptyState } from '@/components/common/EmptyState';
import {
	getAllScheduleUnitAllowRegist,
	checkExitsRegist,
	registScheduleStudyUnit,
	type ClassStudyUnitItem,
	type ScheduleStudyUnit
} from '@/services/registrationService';

interface ScheduleSelectionDialogProps {
	course: ClassStudyUnitItem | null;
	studyProgramId: string;
	studyType: string;
	turnId: number;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function ScheduleSelectionDialog({
	course,
	studyProgramId,
	studyType,
	turnId,
	isOpen,
	onClose,
	onSuccess
}: ScheduleSelectionDialogProps) {
	const { showError, showSuccess } = useGlobalNotification();
	const [schedules, setSchedules] = useState<ScheduleStudyUnit[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedTheoryId, setSelectedTheoryId] = useState<string | null>(null);
	const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null);
	const [isRegistering, setIsRegistering] = useState(false);

	useEffect(() => {
		if (isOpen && course) {
			const fetchSchedules = async () => {
				setIsLoading(true);
				setSelectedTheoryId(null);
				setSelectedPracticeId(null);
				try {
					const data = await getAllScheduleUnitAllowRegist(studyProgramId, studyType, course.StudyUnitID);
					setSchedules(data);
				} catch {
					showError('Không thể tải danh sách lớp học');
					onClose();
				} finally {
					setIsLoading(false);
				}
			};
			fetchSchedules();
		}
	}, [isOpen, course, studyProgramId, studyType, onClose, showError]);

	// Derived states
	const theoryClasses = schedules.filter((s) => isTheoryCourseType(s.StudyUnitTypeID) || !s.ParentID);
	const selectedTheory = schedules.find((s) => s.CurriculumID === selectedTheoryId);
	const requiresPractice = selectedTheory && selectedTheory.NumberOfChilds > 0;
	const practiceClasses = selectedTheoryId ? schedules.filter((s) => s.ParentID === selectedTheoryId) : [];

	const canSubmit = selectedTheoryId && (!requiresPractice || selectedPracticeId);

	const handleRegister = async () => {
		if (!canSubmit || !selectedTheory) return;
		setIsRegistering(true);
		try {
			const payload: ScheduleStudyUnit[] = [{ ...selectedTheory, isOpen: true, isOpenChilrentTask: false }];

			if (requiresPractice && selectedPracticeId) {
				const selectedPractice = schedules.find((s) => s.CurriculumID === selectedPracticeId);
				if (selectedPractice) {
					payload.push({ ...selectedPractice, isOpen: false, isOpenChilrentTask: true });
				}
			}

			const checkOutcome = await checkExitsRegist(studyProgramId, payload);
			if (checkOutcome.IsConflict || checkOutcome.IsFull) {
				showError(checkOutcome.Message || 'Lớp học bị trùng lịch hoặc đã đầy');
				setIsRegistering(false);
				return;
			}

			const msg = await registScheduleStudyUnit(turnId, studyProgramId, payload);
			showSuccess(typeof msg === 'string' ? msg : `Đăng ký thành công ${course?.CurriculumName}`);
			onSuccess();
		} catch (err) {
			const error = err as Error;
			showError(error.message || 'Đăng ký thất bại');
		} finally {
			setIsRegistering(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
				<DialogHeader className="p-6 pb-4 border-b">
					<DialogTitle className="text-xl">Đăng ký lớp học: {course?.CurriculumName}</DialogTitle>
					<DialogDescription>
						Chọn lịch học lý thuyết {requiresPractice ? 'và thực hành ' : ''}của môn {course?.CurriculumID}
					</DialogDescription>
				</DialogHeader>

				<div className="p-6 bg-secondary/5 flex-1 overflow-y-auto">
					{isLoading ? (
						<InlineLoader label="Đang tải danh sách lịch học..." className="py-16" />
					) : schedules.length === 0 ? (
						<EmptyState
							icon={BookMarked}
							title="Không có lịch học nào cho môn này."
							className="py-16"
							iconClassName="w-12 h-12 text-muted-foreground/30 mx-auto mb-4"
						/>
					) : (
						<div className="space-y-6">
							{/* Theory Section */}
							<div className="space-y-3">
								<h3 className="font-semibold text-primary flex items-center gap-2">
									<BookOpen className="w-4 h-4" /> Chọn lớp Lý thuyết
								</h3>
								<div className="grid gap-3">
									{theoryClasses.map((cls) => (
										<div key={cls.CurriculumID} className="space-y-3">
											<div
												onClick={() => {
													if (
														cls.NumberRegistOfEmpty &&
														parseInt(cls.NumberRegistOfEmpty) > 0
													) {
														if (selectedTheoryId === cls.CurriculumID) {
															setSelectedTheoryId(null);
															setSelectedPracticeId(null);
														} else {
															setSelectedTheoryId(cls.CurriculumID);
															setSelectedPracticeId(null);
														}
													}
												}}
												className={cn(
													'p-4 rounded-lg border-2 transition-all cursor-pointer shadow-sm bg-card',
													selectedTheoryId === cls.CurriculumID
														? 'border-primary bg-primary/5 shadow-md'
														: 'border-transparent hover:border-primary/30',
													cls.NumberRegistOfEmpty && parseInt(cls.NumberRegistOfEmpty) <= 0
														? 'opacity-60 grayscale cursor-not-allowed'
														: ''
												)}
											>
												<div className="flex justify-between items-start gap-4">
													<div>
														<div className="flex items-center gap-2 mb-2">
															<Badge
																variant={
																	selectedTheoryId === cls.CurriculumID
																		? 'default'
																		: 'outline'
																}
															>
																{cls.ScheduleStudyUnitAlias}
															</Badge>
															<Badge variant="secondary" className="text-xs font-normal">
																Còn {cls.NumberRegistOfEmpty} chỗ
															</Badge>
															{cls.IsHocTrucTuyen === 'X' && (
																<Badge className="bg-blue-500 text-white border-0 text-[10px] px-1.5 py-0 h-4">
																	Online
																</Badge>
															)}
															{cls.NumberOfChilds > 0 && (
																<Badge
																	variant="outline"
																	className="text-primary border-primary/30 text-[10px]"
																>
																	Có lớp thực hành
																</Badge>
															)}
														</div>
														<p className="text-sm text-foreground flex items-start gap-2 mt-2">
															<Users className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
															<span>
																GV: <b>{cls.ProfessorName}</b>
															</span>
														</p>
														<div className="text-sm text-muted-foreground flex items-start gap-2 mt-2 break-words">
															<CalendarClock className="w-4 h-4 mt-0.5 flex-shrink-0" />
															<span
																dangerouslySetInnerHTML={{
																	__html: cls.Schedules
																}}
																className="leading-tight"
															/>
														</div>
													</div>
													<div className="mt-1 flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border border-primary/50 text-primary">
														{selectedTheoryId === cls.CurriculumID && (
															<Check className="w-4 h-4" />
														)}
													</div>
												</div>
											</div>

											{/* Nested Practice Classes */}
											{selectedTheoryId === cls.CurriculumID && requiresPractice && (
												<div className="pl-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
													<div className="flex items-center gap-2 mb-1 text-xs font-semibold text-primary uppercase tracking-wider">
														<div className="w-2 h-2 rounded-full bg-primary" />
														Chọn lớp Thực hành đi kèm
													</div>
													{practiceClasses.length === 0 ? (
														<p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md italic">
															Không tìm thấy lớp thực hành.
														</p>
													) : (
														<div className="grid gap-2 border-l-2 border-primary/20 pl-4 py-1">
															{practiceClasses.map((pCls) => (
																<div
																	key={pCls.CurriculumID}
																	onClick={() => {
																		if (
																			pCls.NumberRegistOfEmpty &&
																			parseInt(pCls.NumberRegistOfEmpty) > 0
																		) {
																			if (
																				selectedPracticeId === pCls.CurriculumID
																			) {
																				setSelectedPracticeId(null);
																			} else {
																				setSelectedPracticeId(
																					pCls.CurriculumID
																				);
																			}
																		}
																	}}
																	className={cn(
																		'p-3 rounded-lg border transition-all cursor-pointer bg-card/50',
																		selectedPracticeId === pCls.CurriculumID
																			? 'border-primary bg-primary/5 ring-1 ring-primary/20'
																			: 'border-transparent hover:bg-secondary/40',
																		pCls.NumberRegistOfEmpty &&
																			parseInt(pCls.NumberRegistOfEmpty) <= 0
																			? 'opacity-50 grayscale cursor-not-allowed'
																			: ''
																	)}
																>
																	<div className="flex justify-between items-center text-sm">
																		<div className="flex-1">
																			<div className="flex items-center gap-2 mb-1">
																				<Badge
																					variant={
																						selectedPracticeId ===
																						pCls.CurriculumID
																							? 'default'
																							: 'outline'
																					}
																					className="text-[10px] py-0 h-5"
																				>
																					{pCls.ScheduleStudyUnitAlias}
																				</Badge>
																				<span className="text-[10px] text-muted-foreground">
																					Còn {pCls.NumberRegistOfEmpty} chỗ
																				</span>
																			</div>
																			<p className="text-xs font-medium">
																				GV: {pCls.ProfessorName}
																			</p>
																			<p
																				className="text-[11px] text-muted-foreground"
																				dangerouslySetInnerHTML={{
																					__html: pCls.Schedules
																				}}
																			/>
																		</div>
																		{selectedPracticeId === pCls.CurriculumID && (
																			<Check className="w-3 h-3 text-primary ml-2" />
																		)}
																	</div>
																</div>
															))}
														</div>
													)}
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="p-4 border-t flex flex-row gap-3 justify-end items-center bg-background rounded-b-lg">
					<Button variant="ghost" onClick={onClose} disabled={isRegistering}>
						Hủy
					</Button>
					<Button
						onClick={handleRegister}
						disabled={!canSubmit || isRegistering}
						className={cn('transition-all', canSubmit ? 'opacity-100 hover:scale-[1.02]' : 'opacity-70')}
					>
						{isRegistering ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang kiểm tra...
							</>
						) : (
							<>
								<Check className="w-4 h-4 mr-2" /> Hoàn tất đăng ký
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
