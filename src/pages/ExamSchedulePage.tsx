import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getYearAndTerm,
    type YearAndTermData,
} from '@/services/scheduleService';
import {
    getStudentExams,
    getStudentFullExams,
    type ExamItem,
} from '@/services/examService';
import {
    Loader2,
    AlertCircle,
    ClipboardList,
    Calendar,
    Clock,
    MapPin,
    Search,
    FileText,
} from 'lucide-react';

function ExamSchedulePage() {
    const [yearTermData, setYearTermData] = useState<YearAndTermData | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedTerm, setSelectedTerm] = useState<string>('');
    const [currentExams, setCurrentExams] = useState<ExamItem[]>([]);
    const [allExams, setAllExams] = useState<ExamItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
    const [isLoadingAll, setIsLoadingAll] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentError, setCurrentError] = useState<string | null>(null);
    const [allExamsError, setAllExamsError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        credits: 'all',
        status: 'all',
        examType: 'all',
        examAttempt: 'all',
    });

    // Fetch year and term data
    const fetchYearAndTerm = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getYearAndTerm();
            setYearTermData(data);
            setSelectedYear(data.CurrentYear);
            setSelectedTerm(data.CurrentTerm);
        } catch (err) {
            console.error('Error:', err);
            setError('Không thể tải dữ liệu năm học và học kỳ');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchYearAndTerm();
    }, [fetchYearAndTerm]);

    // Fetch current exams when year/term changes
    const fetchCurrentExams = useCallback(async () => {
        if (!selectedYear || !selectedTerm) return;
        setIsLoadingCurrent(true);
        setCurrentError(null);
        try {
            const data = await getStudentExams(selectedYear, selectedTerm);
            setCurrentExams(data || []);
        } catch (err) {
            console.error('Error:', err);
            setCurrentError('Không thể tải lịch thi học kỳ này. Vui lòng thử lại sau.');
            setCurrentExams([]);
        } finally {
            setIsLoadingCurrent(false);
        }
    }, [selectedYear, selectedTerm]);

    useEffect(() => {
        fetchCurrentExams();
    }, [fetchCurrentExams]);

    // Fetch all exams on mount
    const fetchAllExams = useCallback(async () => {
        setIsLoadingAll(true);
        setAllExamsError(null);
        try {
            const data = await getStudentFullExams();
            setAllExams(data || []);
        } catch (err) {
            console.error('Error:', err);
            setAllExamsError('Không thể tải toàn bộ lịch thi. Vui lòng thử lại sau.');
            setAllExams([]);
        } finally {
            setIsLoadingAll(false);
        }
    }, []);

    useEffect(() => {
        fetchAllExams();
    }, [fetchAllExams]);

    // Get unique values for filters
    const uniqueValues = useMemo(() => ({
        credits: [...new Set(allExams.map((exam) => exam.Credits))].sort((a, b) => a - b),
        examTypes: [...new Set(allExams.map((exam) => exam.HinhThucThi))].filter(Boolean),
        examAttempts: [...new Set(allExams.map((exam) => exam.LanThi))].sort((a, b) => a - b),
    }), [allExams]);

    // Filter all exams
    const filteredExams = useMemo(() => {
        return allExams.filter((exam) => {
            const matchesSearch = !searchTerm ||
                exam.CurriculumName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exam.CurriculumID?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCredits = filters.credits === 'all' || exam.Credits?.toString() === filters.credits;
            const matchesStatus = filters.status === 'all' ||
                (filters.status === '1' ? exam.Status === 1 : exam.Status !== 1);
            const matchesExamType = filters.examType === 'all' || exam.HinhThucThi === filters.examType;
            const matchesAttempt = filters.examAttempt === 'all' || exam.LanThi?.toString() === filters.examAttempt;

            return matchesSearch && matchesCredits && matchesStatus && matchesExamType && matchesAttempt;
        });
    }, [allExams, searchTerm, filters]);

    const renderExamCard = (exam: ExamItem, showCredits = false) => (
        <div className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight">{exam.CurriculumName}</h4>
                    {showCredits && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {exam.CurriculumID} • {exam.Credits} TC
                        </p>
                    )}
                </div>
                <Badge variant={exam.Status === 1 ? 'default' : 'secondary'} className="flex-shrink-0 text-xs">
                    {exam.Status === 1 ? 'Đã thi' : 'Chưa thi'}
                </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{exam.NgayThi || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{exam.GioThi || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    <span>{exam.PhongThi || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    <span>{exam.HinhThucThi} • Lần {exam.LanThi}</span>
                </div>
            </div>
        </div>
    );

    const renderExamTable = (exams: ExamItem[], showCredits = false) => (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            {showCredits && <th className="text-left p-3 font-medium">Mã HP</th>}
                            <th className="text-left p-3 font-medium">Môn học</th>
                            {showCredits && <th className="text-center p-3 font-medium">TC</th>}
                            <th className="text-left p-3 font-medium">Hình thức</th>
                            <th className="text-left p-3 font-medium">Ngày thi</th>
                            <th className="text-left p-3 font-medium">Giờ thi</th>
                            <th className="text-left p-3 font-medium">Phòng</th>
                            <th className="text-center p-3 font-medium">Lần</th>
                            <th className="text-center p-3 font-medium">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.map((exam, index) => (
                            <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                                {showCredits && (
                                    <td className="p-3 font-mono text-xs">{exam.CurriculumID}</td>
                                )}
                                <td className="p-3">{exam.CurriculumName}</td>
                                {showCredits && (
                                    <td className="p-3 text-center font-semibold">{exam.Credits}</td>
                                )}
                                <td className="p-3 text-muted-foreground text-xs">{exam.HinhThucThi}</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>{exam.NgayThi || '—'}</span>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>{exam.GioThi || '—'}</span>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>{exam.PhongThi || '—'}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-center">{exam.LanThi}</td>
                                <td className="p-3 text-center">
                                    <Badge variant={exam.Status === 1 ? 'default' : 'secondary'}>
                                        {exam.Status === 1 ? 'Đã thi' : 'Chưa thi'}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
                {exams.map((exam, index) => (
                    <div key={index}>{renderExamCard(exam, showCredits)}</div>
                ))}
            </div>
        </>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Đang tải lịch thi...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                            <p className="text-destructive">{error}</p>
                            <Button onClick={() => fetchYearAndTerm()} variant="outline">
                                Thử lại
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Lịch thi
                </h1>
                <p className="text-sm text-muted-foreground">
                    Xem lịch thi theo học kỳ và toàn khóa
                </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="current" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="current">Lịch thi hiện tại</TabsTrigger>
                    <TabsTrigger value="all">Tất cả lịch thi</TabsTrigger>
                </TabsList>

                {/* Current Exams Tab */}
                <TabsContent value="current" className="mt-4 space-y-4">
                    <div className="flex flex-col gap-4">
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            Lịch thi học kỳ
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Năm học" />
                                </SelectTrigger>
                                <SelectContent>
                                    {yearTermData?.YearStudy.map((year) => (
                                        <SelectItem key={year} value={year}>
                                            Năm học {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Học kỳ" />
                                </SelectTrigger>
                                <SelectContent>
                                    {yearTermData?.Terms.map((term) => (
                                        <SelectItem key={term.TermID} value={term.TermID}>
                                            {term.TermName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {isLoadingCurrent ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : currentError ? (
                        <div className="text-center py-8">
                            <p className="text-destructive mb-4">{currentError}</p>
                            <Button variant="outline" onClick={fetchCurrentExams}>
                                Thử lại
                            </Button>
                        </div>
                    ) : currentExams.length > 0 ? (
                        renderExamTable(currentExams)
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Không có lịch thi trong học kỳ này</p>
                        </div>
                    )}
                </TabsContent>

                {/* All Exams Tab */}
                <TabsContent value="all" className="mt-4 space-y-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        Lịch thi toàn khóa
                    </h2>
                    {/* Search and Filters */}
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm môn học..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="grid grid-cols-2 md:flex gap-2">
                            <Select value={filters.credits} onValueChange={(val) => setFilters(f => ({ ...f, credits: val }))}>
                                <SelectTrigger className="w-full md:w-[100px]">
                                    <SelectValue placeholder="TC" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả TC</SelectItem>
                                    {uniqueValues.credits.map((credit) => (
                                        <SelectItem key={credit} value={credit.toString()}>
                                            {credit} TC
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filters.status} onValueChange={(val) => setFilters(f => ({ ...f, status: val }))}>
                                <SelectTrigger className="w-full md:w-[130px]">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="1">Đã thi</SelectItem>
                                    <SelectItem value="0">Chưa thi</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.examType} onValueChange={(val) => setFilters(f => ({ ...f, examType: val }))}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="Hình thức" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    {uniqueValues.examTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filters.examAttempt} onValueChange={(val) => setFilters(f => ({ ...f, examAttempt: val }))}>
                                <SelectTrigger className="w-full md:w-[120px]">
                                    <SelectValue placeholder="Lần thi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    {uniqueValues.examAttempts.map((attempt) => (
                                        <SelectItem key={attempt} value={attempt.toString()}>
                                            Lần {attempt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Results */}
                    {isLoadingAll ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : allExamsError ? (
                        <div className="text-center py-8">
                            <p className="text-destructive mb-4">{allExamsError}</p>
                            <Button variant="outline" onClick={fetchAllExams}>
                                Thử lại
                            </Button>
                        </div>
                    ) : filteredExams.length > 0 ? (
                        <>
                            <div className="text-sm text-muted-foreground">
                                Hiển thị {filteredExams.length} / {allExams.length} môn thi
                            </div>
                            {renderExamTable(filteredExams, true)}
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>{searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Không có lịch thi'}</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default ExamSchedulePage;
