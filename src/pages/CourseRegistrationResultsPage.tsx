import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getYearAndTerm, type YearAndTermData } from '@/services/scheduleService';
import { getCourseRegistrationResults, type RegistrationResult } from '@/services/academicService';
import {
    Loader2,
    AlertCircle,
    BookOpen,
    Calendar,
    User,
    Hash,
    GraduationCap,
    ClipboardCheck,
    BookMarked,
} from 'lucide-react';


function CourseRegistrationResultsPage() {
    const [yearTermData, setYearTermData] = useState<YearAndTermData | null>(null);
    const [registrationResults, setRegistrationResults] = useState<RegistrationResult[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedTerm, setSelectedTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingResults, setIsLoadingResults] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultsError, setResultsError] = useState<string | null>(null);

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

    const fetchResults = useCallback(async () => {
        if (!selectedYear || !selectedTerm) return;
        setIsLoadingResults(true);
        setResultsError(null);
        try {
            const data = await getCourseRegistrationResults(selectedYear, selectedTerm);
            const results = Array.isArray(data) ? data : (data?.data || []);
            setRegistrationResults(results);
        } catch (err) {
            console.error('Error:', err);
            setResultsError('Không thể tải kết quả đăng ký học phần. Vui lòng thử lại sau.');
            setRegistrationResults([]);
        } finally {
            setIsLoadingResults(false);
        }
    }, [selectedYear, selectedTerm]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const summary = {
        totalCourses: registrationResults.length,
        totalCredits: registrationResults.reduce((sum, item) => sum + (item.Credits || 0), 0),
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md w-full border-destructive/50">
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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Kết quả đăng ký học phần
                </h1>
                <p className="text-sm text-muted-foreground">
                    Xem danh sách các học phần đã đăng ký
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Chọn năm học" />
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
                        <SelectValue placeholder="Chọn học kỳ" />
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

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/20">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-primary-foreground/70 text-xs">Số học phần</p>
                                <p className="text-2xl font-bold">{summary.totalCourses}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-lg bg-amber-500/10 border-amber-500/30">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                                <GraduationCap className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Tổng tín chỉ</p>
                                <p className="text-2xl font-bold text-amber-600">{summary.totalCredits}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Results Table */}
            <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    Danh sách học phần đã đăng ký
                </h2>
                {isLoadingResults ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : resultsError ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-80" />
                        <p className="text-destructive mb-4">{resultsError}</p>
                        <Button variant="outline" onClick={fetchResults}>
                            Thử lại
                        </Button>
                    </div>
                ) : registrationResults.length === 0 ? (
                    <div className="text-center py-12">
                        <BookMarked className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">Chưa có học phần nào được đăng ký</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Vui lòng chọn năm học và học kỳ khác
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">STT</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Mã HP</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Tên học phần</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Tín chỉ</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Giảng viên</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Loại ĐK</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrationResults.map((item, index) => (
                                        <tr
                                            key={`${item.ScheduleStudyUnitID}-${index}`}
                                            className="border-b border-border/50 transition-colors hover:bg-muted/50"
                                        >
                                            <td className="py-4 px-4 text-sm text-muted-foreground">
                                                {index + 1}
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="outline" className="font-mono">
                                                    {item.CurriculumID}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm font-medium text-foreground line-clamp-2">
                                                    {item.CurriculumName}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                    {item.ListOfWeekSchedules}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <Badge className="bg-primary/10 text-primary border-primary/30">
                                                    {item.Credits} TC
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-muted-foreground">
                                                {item.ProfessorName || '—'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-xs",
                                                        item.RegistType === 'Kế hoạch' && "border-green-500/50 text-green-600 bg-green-500/10",
                                                        item.RegistType === 'Học lại' && "border-amber-500/50 text-amber-600 bg-amber-500/10",
                                                        item.RegistType === 'Ngoài kế hoạch' && "border-blue-500/50 text-blue-600 bg-blue-500/10"
                                                    )}
                                                >
                                                    {item.RegistType}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <Badge
                                                    className={cn(
                                                        "text-xs",
                                                        item.Status === 4 && "bg-green-500/20 text-green-600 border-green-500/30",
                                                        item.Status === 6 && "bg-blue-500/20 text-blue-600 border-blue-500/30",
                                                        item.Status !== 4 && item.Status !== 6 && "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    {item.TinhTrang}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {registrationResults.map((item, index) => (
                                <div
                                    key={`${item.ScheduleStudyUnitID}-${index}`}
                                    className="p-4 rounded-xl border border-border bg-card"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {item.CurriculumID}
                                                </Badge>
                                                <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                                                    {item.Credits} TC
                                                </Badge>
                                                <Badge
                                                    className={cn(
                                                        "text-xs",
                                                        item.Status === 4 && "bg-green-500/20 text-green-600 border-green-500/30",
                                                        item.Status === 6 && "bg-blue-500/20 text-blue-600 border-blue-500/30",
                                                    )}
                                                >
                                                    {item.TinhTrang}
                                                </Badge>
                                            </div>
                                            <p className="font-semibold text-foreground line-clamp-2">
                                                {item.CurriculumName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        {item.ProfessorName && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <User className="w-4 h-4" />
                                                <span>{item.ProfessorName}</span>
                                            </div>
                                        )}
                                        {item.ListOfWeekSchedules && (
                                            <div className="flex items-start gap-2 text-muted-foreground">
                                                <Calendar className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span className="line-clamp-2">{item.ListOfWeekSchedules}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Hash className="w-4 h-4" />
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-xs",
                                                    item.RegistType === 'Kế hoạch' && "border-green-500/50 text-green-600 bg-green-500/10",
                                                    item.RegistType === 'Học lại' && "border-amber-500/50 text-amber-600 bg-amber-500/10",
                                                    item.RegistType === 'Ngoài kế hoạch' && "border-blue-500/50 text-blue-600 bg-blue-500/10"
                                                )}
                                            >
                                                {item.RegistType}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default CourseRegistrationResultsPage;
