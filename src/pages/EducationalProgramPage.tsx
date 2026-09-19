import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
	getStudyPrograms,
	getStudyProgramDetail,
	type StudyProgram,
	type KKTBlock,
	type StudyProgramCourse,
} from "@/services/programService";
import {
	Loader2,
	AlertCircle,
	GraduationCap,
	BookOpen,
	Library,
	Check,
} from "lucide-react";

const isMandatory = (course: StudyProgramCourse): boolean =>
	course.BatBuoc === "Bắt Buộc";

const semesterOf = (course: StudyProgramCourse): number =>
	parseInt(course.HocKy?.match(/\d+/)?.[0] || "0", 10);

const sortCourses = (courses: StudyProgramCourse[]): StudyProgramCourse[] =>
	[...courses].sort(
		(a, b) => semesterOf(a) - semesterOf(b) || a.MaHP.localeCompare(b.MaHP),
	);

function EducationalProgramPage() {
	const [selectedProgram, setSelectedProgram] = useState<StudyProgram | null>(
		null,
	);
	const [blocks, setBlocks] = useState<KKTBlock[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [detailError, setDetailError] = useState<string | null>(null);

	const fetchProgramDetail = useCallback(
		async (programId: string) => {
			setIsLoadingDetail(true);
			setDetailError(null);
			try {
				const data = await getStudyProgramDetail(programId);
				setBlocks(data?.tbStudyPrograms || []);
			} catch (err) {
				console.error("Error fetching program detail:", err);
				setDetailError(
					"Không thể tải danh sách học phần. Vui lòng thử lại sau.",
				);
			} finally {
				setIsLoadingDetail(false);
			}
		},
		[],
	);

	const fetchPrograms = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await getStudyPrograms();
			if (data.length > 0) {
				setSelectedProgram(data[0]);
				fetchProgramDetail(data[0].StudyProgramID);
			}
		} catch (err) {
			console.error("Error fetching programs:", err);
			setError(
				"Không thể tải chương trình đào tạo. Vui lòng thử lại sau.",
			);
		} finally {
			setIsLoading(false);
		}
	}, [fetchProgramDetail]);

	useEffect(() => {
		fetchPrograms();
	}, [fetchPrograms]);

	const allCourses = blocks.flatMap((block) =>
		block.ChuongTrinhDaoTaos.flatMap((group) => group.ChuongTrinhs),
	);

	const totalCredits = allCourses.reduce(
		(sum, course) => sum + (course.STC || 0),
		0,
	);
	const requiredCredits = allCourses
		.filter((course) => isMandatory(course))
		.reduce((sum, course) => sum + (course.STC || 0), 0);
	const electiveCredits = totalCredits - requiredCredits;

	if (isLoading) {
		return (
			<div className='flex items-center justify-center min-h-[60vh]'>
				<div className='text-center space-y-4'>
					<Loader2 className='w-12 h-12 animate-spin text-primary mx-auto' />
					<p className='text-muted-foreground'>
						Đang tải chương trình đào tạo...
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
							<Button variant='outline' onClick={fetchPrograms}>
								Thử lại
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{/* Page Header */}
			<div>
				<h1 className='text-2xl md:text-3xl font-bold text-foreground'>
					Chương trình đào tạo
				</h1>
				<p className='text-sm text-muted-foreground'>
					Xem danh sách học phần trong chương trình đào tạo của bạn
				</p>
			</div>

			{/* Program Info Card */}
			{selectedProgram && (
				<Card className='bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'>
					<CardContent className='py-4'>
						<div className='flex flex-col gap-4'>
							<div className='flex items-center gap-3'>
								<div className='w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0'>
									<GraduationCap className='w-5 h-5 md:w-6 md:h-6' />
								</div>
								<div className='min-w-0'>
									<h2 className='text-base md:text-lg font-bold leading-tight'>
										{selectedProgram.StudyProgramName}
									</h2>
									<p className='text-primary-foreground/80 text-xs md:text-sm'>
										Mã: {selectedProgram.StudyProgramID}
									</p>
								</div>
							</div>
							<div className='grid grid-cols-3 gap-2 md:gap-4'>
								<div className='text-center px-2 py-2 md:px-4 bg-white/10 rounded-lg'>
									<div className='text-lg md:text-xl font-bold'>
										{totalCredits}
									</div>
									<div className='text-primary-foreground/80 text-xs'>
										Tổng TC
									</div>
								</div>
								<div className='text-center px-2 py-2 md:px-4 bg-white/10 rounded-lg'>
									<div className='text-lg md:text-xl font-bold'>
										{requiredCredits}
									</div>
									<div className='text-primary-foreground/80 text-xs'>
										Bắt buộc
									</div>
								</div>
								<div className='text-center px-2 py-2 md:px-4 bg-white/10 rounded-lg'>
									<div className='text-lg md:text-xl font-bold'>
										{electiveCredits}
									</div>
									<div className='text-primary-foreground/80 text-xs'>
										Tự chọn
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Courses by Knowledge Block (KKT) */}
			{isLoadingDetail ?
				<div className='flex items-center justify-center py-12'>
					<Loader2 className='w-8 h-8 animate-spin text-primary' />
				</div>
				: detailError ?
					<div className='text-center py-8'>
						<p className='text-destructive mb-4'>
							{detailError}
						</p>
						<Button
							variant='outline'
							onClick={() =>
								selectedProgram &&
								fetchProgramDetail(selectedProgram.StudyProgramID)
							}
						>
							Thử lại
						</Button>
					</div>
				: <div>
					<h2 className='flex items-center gap-2 text-lg font-semibold mb-4'>
						<BookOpen className='h-5 w-5 text-primary' />
						Danh sách học phần theo khối kiến thức
					</h2>
					{blocks.length > 0 ?
						<Tabs defaultValue='0' className='w-full'>
							<div className='overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0'>
								<TabsList className='inline-flex md:flex md:flex-wrap h-auto gap-1 bg-muted/50 p-1 min-w-max md:min-w-0 md:w-full'>
									{blocks.map((block, index) => (
										<TabsTrigger
											key={index}
											value={String(index)}
											className='text-xs px-3 py-1.5 whitespace-nowrap'
										>
											{block.KKT}
										</TabsTrigger>
									))}
								</TabsList>
							</div>

							{blocks.map((block, index) => (
								<TabsContent
									key={index}
									value={String(index)}
									className='mt-4'
								>
									{block.ChuongTrinhDaoTaos.length > 0 ?
										block.ChuongTrinhDaoTaos.map(
											(group, groupIndex) => {
												const groupedCourses = sortCourses(
													group.ChuongTrinhs,
												);
												const groupCredits =
													groupedCourses.reduce(
														(sum, c) =>
															sum + (c.STC || 0),
														0,
													);
												return (
													<div
														key={groupIndex}
														className='mb-6'
													>
														<div className='flex items-center justify-between flex-wrap gap-2 mb-3'>
															<h3 className='font-semibold text-base'>
																{group.BatBuoc}
															</h3>
															<span className='text-xs text-muted-foreground'>
																{
																	groupedCourses.length
																}{" "}
																học phần •{" "}
																{groupCredits}{" "}
																TC
															</span>
														</div>

														{/* Desktop Table View */}
														<div className='hidden md:block overflow-x-auto'>
															<table className='w-full text-sm'>
																<thead>
																	<tr className='border-b bg-muted/50'>
																		<th className='text-center p-3 font-medium w-20'>
																			HK
																		</th>
																		<th className='text-left p-3 font-medium'>
																			Mã HP
																		</th>
																		<th className='text-left p-3 font-medium'>
																			Tên học phần
																		</th>
																		<th className='text-center p-3 font-medium'>
																			STC
																		</th>
																		<th className='text-center p-3 font-medium'>
																			Loại
																		</th>
																		<th className='text-center p-3 font-medium'>
																			Đạt
																		</th>
																		<th className='text-left p-3 font-medium'>
																			Học trước
																		</th>
																		<th className='text-left p-3 font-medium hidden lg:table-cell'>
																			Khoa/Bộ môn
																		</th>
																	</tr>
																</thead>
																<tbody>
																	{groupedCourses.map(
																		(
																			course,
																			index,
																		) => (
																			<tr
																				key={`${course.MaHP}-${index}`}
																				className='border-b hover:bg-muted/30 transition-colors'
																			>
																				<td className='p-3 text-center text-muted-foreground'>
																					{
																						course.HocKy
																					}
																				</td>
																				<td className='p-3 font-mono text-xs'>
																					{
																						course.MaHP
																					}
																				</td>
																				<td className='p-3'>
																					{
																						course.TenHP
																					}
																				</td>
																				<td className='p-3 text-center font-semibold'>
																					{
																						course.STC
																					}
																				</td>
																				<td className='p-3 text-center'>
																					<Badge
variant={
	isMandatory(
		course,
	) ?
		"default"
		: "outline"
}
																						className='text-xs'
																					>
																						{isMandatory(
																							course,
																						) ?
																							"BB"
																							: "TC"}
																					</Badge>
																				</td>
																				<td className='p-3 text-center'>
																					{course.IsPass ===
																					"1" ?
																						<Check className='w-4 h-4 text-green-600 dark:text-green-400 mx-auto' />
																						: <span className='text-muted-foreground'>
																							—
																						</span>}
																				</td>
																				<td className='p-3 text-muted-foreground'>
																					{course.HPHocTruoc ||
																						"—"}
																				</td>
																				<td className='p-3 text-muted-foreground hidden lg:table-cell text-xs'>
																					{course.Khoa ||
																						course.BoMon ||
																						"—"}
																				</td>
																			</tr>
																		),
																	)}
																</tbody>
															</table>
														</div>

														{/* Mobile Card View */}
														<div className='md:hidden space-y-3'>
															{groupedCourses.map(
																(
																	course,
																	index,
																) => (
																	<div
																		key={`${course.MaHP}-${index}`}
																		className='border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors'
																	>
																		<div className='flex items-start justify-between gap-2 mb-2'>
																			<div className='flex-1 min-w-0'>
																				<h4 className='font-medium text-sm leading-tight'>
																					{
																						course.TenHP
																					}
																				</h4>
																				<p className='text-xs text-muted-foreground font-mono mt-0.5'>
																					MaHP:{" "}
																					{
																						course.MaHP
																					}
																					{" "}
																					• HK{" "}
																					{
																						course.HocKy
																					}
																				</p>
																			</div>
																			<div className='flex items-center gap-2 flex-shrink-0'>
																				<Badge
																					variant={
																						isMandatory(
																							course,
																						) ?
																							"default"
																							: "secondary"
																					}
																					className='text-xs'
																				>
																					{isMandatory(
																						course,
																					) ?
																						"BB"
																						: "TC"}
																				</Badge>
																				<span className='text-sm font-bold text-primary'>
																					{course.STC}{" "}
																					TC
																				</span>
																			</div>
																		</div>
																		{course.IsPass ===
																			"1" && (
																			<div className='text-xs text-green-600 dark:text-green-400 border-t pt-2 mt-2'>
																				Đã đạt
																			</div>
																		)}
																		<div className='text-xs text-muted-foreground border-t pt-2 mt-2 space-y-1'>
																			{course.HPHocTruoc && (
																				<div>
																					<span className='font-medium'>
																						Học trước:
																					</span>{" "}
																					{
																						course.HPHocTruoc
																					}
																				</div>
																			)}
																			{(course.Khoa ||
																				course.BoMon) && (
																				<div>
																					<span className='font-medium'>
																						Khoa:
																					</span>{" "}
																					{course.Khoa ||
																						course.BoMon}
																				</div>
																			)}
																		</div>
																	</div>
																),
															)}
														</div>
													</div>
												);
											},
										)
										: <div className='text-center py-8 text-muted-foreground'>
											<p>Không có dữ liệu học phần</p>
										</div>}
								</TabsContent>
							))}
						</Tabs>
						: <div className='text-center py-8 text-muted-foreground'>
							<Library className='w-12 h-12 mx-auto mb-4 opacity-50' />
							<p>Không có dữ liệu học phần</p>
						</div>}
				</div>}
		</div>
	);
}

export default EducationalProgramPage;