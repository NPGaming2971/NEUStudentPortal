import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getYearAndTerm } from '@/services/scheduleService';
import { getStudentAttendance, type AttendanceItem } from '@/services/attendanceService';
import { AlertCircle, UserCheck, BookOpen, Clock } from 'lucide-react';
import { PageLoader } from '@/components/common/PageLoader';
import { PageError } from '@/components/common/PageError';
import { InlineLoader } from '@/components/common/InlineLoader';
import { useYearAndTerm } from '@/hooks/useYearAndTerm';
import YearTermFilter from '@/components/common/YearTermFilter';

interface GroupedAttendance {
	MaLHP: string;
	TenHP: string;
	SoTC: number;
	SoTiet: number;
	SoTietVang: number;
	PhanTramVang: string;
}

const getAttendanceVariant = (percentage: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
	const percent = parseFloat(percentage);
	if (percent === 0) return 'default';
	if (percent <= 10) return 'secondary';
	if (percent <= 20) return 'outline';
	return 'destructive';
};

const getAttendanceColor = (percentage: string): string => {
	const percent = parseFloat(percentage);
	if (percent === 0) return 'text-green-600';
	if (percent <= 10) return 'text-yellow-600';
	if (percent <= 20) return 'text-orange-600';
	return 'text-red-600';
};

function AttendancePage() {
	const [attendanceData, setAttendanceData] = useState<AttendanceItem[]>([]);
	const [isLoadingData, setIsLoadingData] = useState(false);
	const [dataError, setDataError] = useState<string | null>(null);
	const {
		yearTermData,
		selectedYear,
		setSelectedYear,
		selectedTerm,
		setSelectedTerm,
		termsForSelectedYear,
		isLoading,
		error,
		retry
	} = useYearAndTerm(getYearAndTerm);

	// Group attendance data by course
	const groupedData = useMemo((): GroupedAttendance[] => {
		const grouped = attendanceData.reduce(
			(acc, item) => {
				const key = `${item.MaLHP}-${item.TenHP}`;
				if (!acc[key]) {
					acc[key] = {
						MaLHP: item.MaLHP,
						TenHP: item.TenHP,
						SoTC: item.SoTC,
						SoTiet: item.SoTiet,
						SoTietVang: item.SoTietVang,
						PhanTramVang: item.PhanTramVang
					};
				}
				return acc;
			},
			{} as Record<string, GroupedAttendance>
		);
		return Object.values(grouped);
	}, [attendanceData]);

	// Calculate summary
	const summary = useMemo(() => {
		const totalCourses = groupedData.length;
		const totalAbsent = groupedData.reduce((sum, item) => sum + item.SoTietVang, 0);
		const totalLessons = groupedData.reduce((sum, item) => sum + item.SoTiet, 0);
		const coursesWithIssues = groupedData.filter((item) => parseFloat(item.PhanTramVang) > 10).length;
		return { totalCourses, totalAbsent, totalLessons, coursesWithIssues };
	}, [groupedData]);

	// Fetch attendance when year/term changes
	const fetchAttendance = useCallback(async () => {
		if (!selectedYear || !selectedTerm) return;
		setIsLoadingData(true);
		setDataError(null);
		try {
			const data = await getStudentAttendance(selectedYear, selectedTerm);
			setAttendanceData(data || []);
		} catch (err) {
			console.error('Error:', err);
			setDataError('Không thể tải dữ liệu điểm danh. Vui lòng thử lại sau.');
			setAttendanceData([]);
		} finally {
			setIsLoadingData(false);
		}
	}, [selectedYear, selectedTerm]);

	useEffect(() => {
		fetchAttendance();
	}, [fetchAttendance]);

	if (isLoading) {
		return <PageLoader />;
	}

	if (error) {
		return <PageError message={error} onRetry={retry} />;
	}

	return (
		<div className="space-y-4">
			{/* Page Header */}
			<div>
				<h1 className="text-2xl md:text-3xl font-bold text-foreground">Điểm danh</h1>
				<p className="text-sm text-muted-foreground">Theo dõi tình hình điểm danh các môn học</p>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="py-4">
					<YearTermFilter
						selectedYear={selectedYear}
						onYearChange={setSelectedYear}
						selectedTerm={selectedTerm}
						onTermChange={setSelectedTerm}
						years={yearTermData?.YearStudy ?? []}
						terms={termsForSelectedYear}
						yearTriggerClassName="w-full sm:w-[180px]"
						termTriggerClassName="w-full sm:w-[150px]"
					/>
				</CardContent>
			</Card>

			{/* Summary Cards */}
			{!isLoadingData && groupedData.length > 0 && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					<Card>
						<CardContent className="py-4">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-primary/10">
									<BookOpen className="w-5 h-5 text-primary" />
								</div>
								<div>
									<p className="text-2xl font-bold">{summary.totalCourses}</p>
									<p className="text-xs text-muted-foreground">Môn học</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="py-4">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-blue-500/10">
									<Clock className="w-5 h-5 text-blue-500" />
								</div>
								<div>
									<p className="text-2xl font-bold">{summary.totalLessons}</p>
									<p className="text-xs text-muted-foreground">Tổng số tiết</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="py-4">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-orange-500/10">
									<UserCheck className="w-5 h-5 text-orange-500" />
								</div>
								<div>
									<p className="text-2xl font-bold">{summary.totalAbsent}</p>
									<p className="text-xs text-muted-foreground">Tiết vắng</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="py-4">
							<div className="flex items-center gap-3">
								<div
									className={cn(
										'p-2 rounded-lg',
										summary.coursesWithIssues > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
									)}
								>
									<AlertCircle
										className={cn(
											'w-5 h-5',
											summary.coursesWithIssues > 0 ? 'text-red-500' : 'text-green-500'
										)}
									/>
								</div>
								<div>
									<p className="text-2xl font-bold">{summary.coursesWithIssues}</p>
									<p className="text-xs text-muted-foreground">Môn cảnh báo</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Attendance Table */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<UserCheck className="h-5 w-5 text-primary" />
						Chi tiết điểm danh
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoadingData ? (
						<InlineLoader />
					) : dataError ? (
						<div className="text-center py-8">
							<AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-destructive" />
							<p className="text-destructive mb-4">{dataError}</p>
							<Button variant="outline" onClick={fetchAttendance}>
								Thử lại
							</Button>
						</div>
					) : groupedData.length > 0 ? (
						<>
							{/* Desktop Table */}
							<div className="hidden md:block overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/50">
											<th className="text-left p-3 font-medium">Mã LHP</th>
											<th className="text-left p-3 font-medium">Tên học phần</th>
											<th className="text-center p-3 font-medium">TC</th>
											<th className="text-center p-3 font-medium">Số tiết</th>
											<th className="text-center p-3 font-medium">Tiết vắng</th>
											<th className="text-center p-3 font-medium">Tỷ lệ vắng</th>
										</tr>
									</thead>
									<tbody>
										{groupedData.map((item, index) => (
											<tr key={index} className="border-b hover:bg-muted/30 transition-colors">
												<td className="p-3 font-mono text-xs">{item.MaLHP}</td>
												<td className="p-3">{item.TenHP}</td>
												<td className="p-3 text-center font-semibold">{item.SoTC}</td>
												<td className="p-3 text-center">{item.SoTiet}</td>
												<td className="p-3 text-center">{item.SoTietVang}</td>
												<td className="p-3 text-center">
													<Badge variant={getAttendanceVariant(item.PhanTramVang)}>
														{item.PhanTramVang}%
													</Badge>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Mobile Cards */}
							<div className="md:hidden space-y-3">
								{groupedData.map((item, index) => (
									<div
										key={index}
										className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors"
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<p className="font-medium line-clamp-2">{item.TenHP}</p>
												<p className="text-xs text-muted-foreground font-mono">{item.MaLHP}</p>
											</div>
											<Badge variant={getAttendanceVariant(item.PhanTramVang)}>
												{item.PhanTramVang}%
											</Badge>
										</div>

										<div className="grid grid-cols-3 gap-2 text-sm">
											<div className="text-center p-2 bg-muted/50 rounded">
												<p className="font-semibold">{item.SoTC}</p>
												<p className="text-xs text-muted-foreground">TC</p>
											</div>
											<div className="text-center p-2 bg-muted/50 rounded">
												<p className="font-semibold">{item.SoTiet}</p>
												<p className="text-xs text-muted-foreground">Số tiết</p>
											</div>
											<div
												className={cn(
													'text-center p-2 rounded',
													parseFloat(item.PhanTramVang) > 10 ? 'bg-red-500/10' : 'bg-muted/50'
												)}
											>
												<p
													className={cn(
														'font-semibold',
														getAttendanceColor(item.PhanTramVang)
													)}
												>
													{item.SoTietVang}
												</p>
												<p className="text-xs text-muted-foreground">Vắng</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							<UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
							<p>Không có dữ liệu điểm danh</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default AttendancePage;
