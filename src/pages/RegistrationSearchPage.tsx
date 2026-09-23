import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Loader2, Search, AlertCircle, BookOpen, User, Calendar, Clock, Users, GraduationCap } from 'lucide-react';
import { initializeRegistrationSession } from '@/services/registrationAuthService';
import { searchScheduleStudyUnits, type ScheduleStudyUnitSearch } from '@/services/registrationService';
import { useGlobalNotification } from '@/hooks/useGlobalNotification';
import { PageLoader } from '@/components/common/PageLoader';

function RegistrationSearchPage() {
	const { showError, showInfo } = useGlobalNotification();

	// State
	const [isInitializing, setIsInitializing] = useState(true);
	const [isSearching, setIsSearching] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchType, setSearchType] = useState<'0' | '1'>('0');
	const [searchResults, setSearchResults] = useState<ScheduleStudyUnitSearch[]>([]);
	const [hasSearched, setHasSearched] = useState(false);

	// Initialize session
	useEffect(() => {
		const initialize = async () => {
			try {
				await initializeRegistrationSession();
			} catch (err) {
				console.error('Error initializing:', err);
				showError('Không thể kết nối đến hệ thống đăng ký');
			} finally {
				setIsInitializing(false);
			}
		};

		initialize();
	}, [showError]);

	// Handle search
	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			showInfo(
				searchType === '0' ? 'Vui lòng nhập mã học phần để tra cứu' : 'Vui lòng nhập tên học phần để tra cứu'
			);
			return;
		}

		setIsSearching(true);
		setHasSearched(true);
		try {
			const results = await searchScheduleStudyUnits(
				searchType === '0' ? searchQuery.trim().toUpperCase() : searchQuery.trim(),
				searchType
			);
			setSearchResults(results);
			if (results.length === 0) {
				showInfo('Không tìm thấy kết quả nào');
			}
		} catch (err) {
			console.error('Error searching:', err);
			showError('Không thể tra cứu học phần');
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	};

	// Handle key press
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

	const parseQuotas = (quotas: string) => {
		const parts = quotas.split('-');
		if (parts.length === 2) {
			return {
				current: parseInt(parts[0]) || 0,
				max: parseInt(parts[1]) || 0
			};
		}
		return { current: 0, max: 0 };
	};

	if (isInitializing) {
		return <PageLoader label="Đang kết nối hệ thống đăng ký..." />;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl md:text-3xl font-bold text-foreground">Tra cứu học phần</h1>
				<p className="text-sm text-muted-foreground">
					Tìm kiếm thông tin các lớp học phần theo mã hoặc tên học phần
				</p>
			</div>

			{/* Search Card */}
			<Card className="border-0 shadow-lg">
				<CardHeader className="pb-4">
					<CardTitle className="text-lg flex items-center gap-2">
						<Search className="w-5 h-5 text-primary" />
						Tìm kiếm
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="w-full sm:w-[180px]">
							<label className="text-xs text-muted-foreground mb-1 block">Loại tìm kiếm</label>
							<Select value={searchType} onValueChange={(v) => setSearchType(v as '0' | '1')}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="0">Theo mã học phần</SelectItem>
									<SelectItem value="1">Theo tên học phần</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex-1">
							<label className="text-xs text-muted-foreground mb-1 block">
								{searchType === '0' ? 'Mã học phần' : 'Tên học phần'}
							</label>
							<Input
								placeholder={
									searchType === '0'
										? 'Nhập mã học phần (VD: INT588, CS101...)'
										: 'Nhập tên học phần...'
								}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={handleKeyPress}
								className={searchType === '0' ? 'uppercase' : ''}
							/>
						</div>
						<div className="flex items-end">
							<Button onClick={handleSearch} disabled={isSearching} className="w-full sm:w-auto">
								{isSearching ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Đang tìm...
									</>
								) : (
									<>
										<Search className="w-4 h-4 mr-2" />
										Tra cứu
									</>
								)}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Results */}
			{hasSearched && (
				<Card className="border-0 shadow-lg">
					<CardHeader className="pb-4">
						<CardTitle className="text-lg flex items-center gap-2">
							<BookOpen className="w-5 h-5 text-primary" />
							Kết quả tra cứu
							{searchResults.length > 0 && (
								<Badge variant="secondary" className="ml-2">
									{searchResults.length} lớp học phần
								</Badge>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isSearching ? (
							<div className="flex items-center justify-center py-12">
								<Loader2 className="w-8 h-8 animate-spin text-primary" />
							</div>
						) : searchResults.length === 0 ? (
							<div className="text-center py-12">
								<AlertCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
								<p className="text-muted-foreground">
									Không tìm thấy lớp học phần nào với {searchType === '0' ? 'mã' : 'tên'} "
									{searchQuery}"
								</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="min-w-[200px]">Tên học phần</TableHead>
											<TableHead className="min-w-[120px]">Mã lớp</TableHead>
											<TableHead className="text-center">Số TC</TableHead>
											<TableHead className="min-w-[150px]">Giảng viên</TableHead>
											<TableHead className="min-w-[250px]">Lịch học</TableHead>
											<TableHead className="text-center">Sĩ số</TableHead>
											<TableHead className="min-w-[100px]">Ngày bắt đầu</TableHead>
											<TableHead className="min-w-[100px]">Ngày kết thúc</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{searchResults.map((result) => {
											const quotas = parseQuotas(result.StudentQuotas);
											const isFull = quotas.current >= quotas.max;

											return (
												<TableRow key={result.ScheduleStudyUnitID}>
													<TableCell>
														<div className="space-y-1">
															<div className="font-medium">
																{result.ScheduleStudyUnitName}
															</div>
															<div className="text-xs text-muted-foreground flex items-center gap-1">
																<GraduationCap className="w-3 h-3" />
																{result.StudyUnitTypeName}
															</div>
														</div>
													</TableCell>
													<TableCell>
														<div className="space-y-1">
															<Badge variant="outline">
																{result.ScheduleStudyUnitAlias}
															</Badge>
															<div className="text-xs text-muted-foreground">
																{result.ScheduleStudyUnitID}
															</div>
														</div>
													</TableCell>
													<TableCell className="text-center">
														<Badge variant="secondary">{result.Credits}</Badge>
													</TableCell>
													<TableCell>
														{result.ProfessorName?.trim() ? (
															<div className="flex items-center gap-1">
																<User className="w-3 h-3 text-muted-foreground" />
																<span>{result.ProfessorName.trim()}</span>
															</div>
														) : (
															<span className="text-muted-foreground">Chưa có</span>
														)}
													</TableCell>
													<TableCell>
														{result.Schedules?.trim() ? (
															<div className="flex items-start gap-1">
																<Clock className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
																<span className="text-sm">
																	{result.Schedules.trim()}
																</span>
															</div>
														) : (
															<span className="text-muted-foreground">Chưa có lịch</span>
														)}
													</TableCell>
													<TableCell className="text-center">
														<Badge
															variant={isFull ? 'destructive' : 'default'}
															className={cn(!isFull && 'bg-green-500 hover:bg-green-600')}
														>
															<Users className="w-3 h-3 mr-1" />
															{quotas.current}/{quotas.max}
														</Badge>
													</TableCell>
													<TableCell>
														{result.BeginDate ? (
															<div className="flex items-center gap-1 text-sm">
																<Calendar className="w-3 h-3 text-muted-foreground" />
																{result.BeginDate}
															</div>
														) : (
															<span className="text-muted-foreground">-</span>
														)}
													</TableCell>
													<TableCell>
														{result.EndDate ? (
															<div className="flex items-center gap-1 text-sm">
																<Calendar className="w-3 h-3 text-muted-foreground" />
																{result.EndDate}
															</div>
														) : (
															<span className="text-muted-foreground">-</span>
														)}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Help Card */}
			{!hasSearched && (
				<Card className="border-0 shadow-lg bg-gradient-to-br from-card to-secondary/10">
					<CardContent className="py-8">
						<div className="text-center space-y-4">
							<div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
								<Search className="w-12 h-12 text-primary" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">Tra cứu thông tin lớp học phần</h3>
								<p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
									Nhập mã hoặc tên học phần để xem danh sách các lớp đang mở, lịch học, giảng viên và
									số lượng sinh viên đã đăng ký.
								</p>
							</div>
							<div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
								<span className="text-muted-foreground">Mã HP:</span>
								<Badge variant="outline">INT588</Badge>
								<Badge variant="outline">CS101</Badge>
								<span className="text-muted-foreground ml-2">Tên HP:</span>
								<Badge variant="outline">Lập trình</Badge>
								<Badge variant="outline">Cơ sở dữ liệu</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

export default RegistrationSearchPage;
