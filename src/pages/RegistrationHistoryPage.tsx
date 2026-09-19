import {useState, useEffect, useMemo, useCallback} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {cn} from "@/lib/utils";
import {
	Loader2,
	History,
	AlertCircle,
	Calendar,
	Clock,
	CheckCircle2,
	XCircle,
	RefreshCw,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {initializeRegistrationSession} from "@/services/registrationAuthService";
import {
	getAllYearStudyAndTerm,
	getAllRegistrationHistory,
	type YearStudyAndTerm,
	type RegistrationHistory,
} from "@/services/registrationService";
import {useGlobalNotification} from "@/hooks/useGlobalNotification";

function RegistrationHistoryPage() {
	const {showError, showInfo} = useGlobalNotification();

	// State
	const [isInitializing, setIsInitializing] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [yearStudyAndTerm, setYearStudyAndTerm] =
		useState<YearStudyAndTerm | null>(null);
	const [selectedYearStudy, setSelectedYearStudy] = useState<string>("");
	const [selectedTermId, setSelectedTermId] = useState<string>("");
	const [historyData, setHistoryData] = useState<RegistrationHistory[]>([]);

	// Initialize session and fetch year/term data
	const initialize = useCallback(async () => {
		setIsInitializing(true);
		try {
			await initializeRegistrationSession();
			const data = await getAllYearStudyAndTerm();
			setYearStudyAndTerm(data);
			setSelectedYearStudy(data.CurrentYearStudy);
			setSelectedTermId(data.CurrentTermID);
		} catch (err) {
			console.error("Error initializing:", err);
			showError("Không thể kết nối đến hệ thống đăng ký");
		} finally {
			setIsInitializing(false);
		}
	}, [showError]);

	useEffect(() => {
		initialize();
	}, [initialize]);

	useEffect(() => {
		if (!selectedYearStudy || !selectedTermId) return;

		const fetchHistory = async () => {
			setIsLoading(true);
			try {
				const data = await getAllRegistrationHistory(
					selectedYearStudy,
					selectedTermId,
				);
				setHistoryData(data);
			} catch (err) {
				console.error("Error fetching history:", err);
				showError("Không thể tải lịch sử đăng ký");
				setHistoryData([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchHistory();
	}, [selectedYearStudy, selectedTermId, showError]);

	const getTermName = (termId: string) => {
		switch (termId) {
			case "HK01":
				return "Học kỳ 1";
			case "HK02":
				return "Học kỳ 2";
			case "HK03":
				return "Học kỳ hè";
			default:
				return termId;
		}
	};

	const handleRefresh = async () => {
		if (!selectedYearStudy || !selectedTermId) return;
		setIsLoading(true);
		try {
			const data = await getAllRegistrationHistory(
				selectedYearStudy,
				selectedTermId,
			);
			setHistoryData(data);
			showInfo("Đã làm mới dữ liệu");
		} catch {
			showError("Không thể làm mới dữ liệu");
		} finally {
			setIsLoading(false);
		}
	};

	// Summary stats
	const summary = useMemo(() => {
		const total = historyData.length;
		const registered = historyData.filter((h) => h.Status === 1).length;
		const canceled = historyData.filter((h) => h.Status === 0).length;
		return {total, registered, canceled};
	}, [historyData]);

	if (isInitializing) {
		return (
			<div className='flex items-center justify-center min-h-[60vh]'>
				<div className='text-center space-y-4'>
					<Loader2 className='w-12 h-12 animate-spin text-primary mx-auto' />
					<p className='text-muted-foreground'>
						Đang kết nối hệ thống đăng ký...
					</p>
				</div>
			</div>
		);
	}

	if (!yearStudyAndTerm) {
		return (
			<div className='flex items-center justify-center min-h-[60vh]'>
				<Card className='max-w-md w-full border-destructive/50'>
					<CardContent className='pt-6'>
						<div className='text-center space-y-4'>
							<AlertCircle className='w-12 h-12 text-destructive mx-auto' />
							<p className='text-destructive'>
								Không thể tải thông tin năm học và học kỳ
							</p>
							<Button onClick={() => initialize()} variant='outline'>
								Thử lại
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div>
				<h1 className='text-2xl md:text-3xl font-bold text-foreground'>
					Lịch sử đăng ký
				</h1>
				<p className='text-sm text-muted-foreground'>
					Xem lịch sử đăng ký và hủy đăng ký học phần
				</p>
			</div>

			{/* Filter Card */}
			<Card className='border-0 shadow-lg'>
				<CardHeader className='pb-4'>
					<CardTitle className='text-lg flex items-center gap-2'>
						<Calendar className='w-5 h-5 text-primary' />
						Bộ lọc
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col sm:flex-row gap-4'>
						<div className='flex-1 sm:max-w-[200px]'>
							<label className='text-xs text-muted-foreground mb-1 block'>
								Năm học
							</label>
							<Select
								value={selectedYearStudy}
								onValueChange={setSelectedYearStudy}
							>
								<SelectTrigger>
									<SelectValue placeholder='Chọn năm học' />
								</SelectTrigger>
								<SelectContent>
									{yearStudyAndTerm.YearStudys.map((year) => (
										<SelectItem key={year} value={year}>
											{year}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='flex-1 sm:max-w-[180px]'>
							<label className='text-xs text-muted-foreground mb-1 block'>
								Học kỳ
							</label>
							<Select
								value={selectedTermId}
								onValueChange={setSelectedTermId}
							>
								<SelectTrigger>
									<SelectValue placeholder='Chọn học kỳ' />
								</SelectTrigger>
								<SelectContent>
									{yearStudyAndTerm.TermIDs.map((term) => (
										<SelectItem key={term} value={term}>
											{getTermName(term)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='flex items-end'>
							<Button
								variant='outline'
								onClick={handleRefresh}
								disabled={isLoading}
							>
								<RefreshCw
									className={cn(
										"w-4 h-4 mr-2",
										isLoading && "animate-spin",
									)}
								/>
								Làm mới
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Summary */}
			<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
				<Card className='border-0 shadow-lg'>
					<CardContent className='pt-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-muted-foreground'>
									Tổng thao tác
								</p>
								<p className='text-2xl font-bold'>
									{summary.total}
								</p>
							</div>
							<div className='p-3 rounded-full bg-primary/10'>
								<History className='w-6 h-6 text-primary' />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className='border-0 shadow-lg'>
					<CardContent className='pt-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-muted-foreground'>
									Đăng ký
								</p>
								<p className='text-2xl font-bold text-green-600'>
									{summary.registered}
								</p>
							</div>
							<div className='p-3 rounded-full bg-green-100 dark:bg-green-900/30'>
								<CheckCircle2 className='w-6 h-6 text-green-600' />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className='border-0 shadow-lg'>
					<CardContent className='pt-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-muted-foreground'>
									Hủy đăng ký
								</p>
								<p className='text-2xl font-bold text-orange-600'>
									{summary.canceled}
								</p>
							</div>
							<div className='p-3 rounded-full bg-orange-100 dark:bg-orange-900/30'>
								<XCircle className='w-6 h-6 text-orange-600' />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* History Table */}
			<Card className='border-0 shadow-lg'>
				<CardHeader className='pb-4'>
					<CardTitle className='text-lg flex items-center gap-2'>
						<History className='w-5 h-5 text-primary' />
						Chi tiết lịch sử
						{historyData.length > 0 && (
							<Badge variant='secondary' className='ml-2'>
								{historyData.length} bản ghi
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ?
						<div className='flex items-center justify-center py-12'>
							<Loader2 className='w-8 h-8 animate-spin text-primary' />
						</div>
					: historyData.length === 0 ?
						<div className='text-center py-12'>
							<AlertCircle className='w-16 h-16 text-muted-foreground/30 mx-auto mb-4' />
							<p className='text-muted-foreground'>
								Không có lịch sử đăng ký trong{" "}
								{getTermName(selectedTermId)} năm{" "}
								{selectedYearStudy}
							</p>
						</div>
					:	<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='min-w-[160px]'>
											Thời gian
										</TableHead>
										<TableHead className='min-w-[120px]'>
											Thao tác
										</TableHead>
										<TableHead className='min-w-[100px]'>
											Mã HP
										</TableHead>
										<TableHead className='min-w-[250px]'>
											Thông tin
										</TableHead>
										<TableHead className='min-w-[120px]'>
											Người thực hiện
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{historyData.map((item, index) => (
										<TableRow key={index}>
											<TableCell>
												<div className='flex items-center gap-2'>
													<Clock className='w-4 h-4 text-muted-foreground' />
													<span className='text-sm'>
														{item.UpdateDate}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														item.Status === 1 ?
															"default"
														:	"secondary"
													}
													className={cn(
														item.Status === 1 ?
															"bg-green-500 hover:bg-green-600"
														:	"bg-orange-500 hover:bg-orange-600 text-white",
													)}
												>
													{item.Status === 1 ?
														<CheckCircle2 className='w-3 h-3 mr-1' />
													:	<XCircle className='w-3 h-3 mr-1' />
													}
													{item.Task}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge variant='outline'>
													{item.CurriculumID}
												</Badge>
											</TableCell>
											<TableCell>
												<span className='text-sm'>
													{item.Info}
												</span>
											</TableCell>
											<TableCell>
												<span className='text-sm text-muted-foreground'>
													{item.UpdateStaff}
												</span>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					}
				</CardContent>
			</Card>
		</div>
	);
}

export default RegistrationHistoryPage;
