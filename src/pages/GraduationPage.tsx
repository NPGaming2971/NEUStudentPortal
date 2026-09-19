import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    getStudyPrograms,
    getGraduationCourses,
    saveGraduationCourses,
    deleteGraduationCourses,
    type StudyProgram,
    type GraduationCoursesData,
    type GraduationPeriod,
} from '@/services/academicService';
import { downloadTranscript, downloadGraduationApplication } from '@/utils/downloadHelper';
import { useGlobalNotification } from '@/hooks/useGlobalNotification';
import { getStudentId } from '@/services/authService';
import {
    Loader2,
    GraduationCap,
    Download,
    BookOpen,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function GraduationPage() {
    const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
    const [graduationData, setGraduationData] = useState<GraduationCoursesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const { showSuccess, showError } = useGlobalNotification();

    const getStudyProgramIdString = (): string | null => {
        if (studyPrograms.length === 0) return null;
        // Convert StudyProgramID to the format used by the API (e.g., "1A222901")
        const studentId = getStudentId();
        if (!studentId) return null;
        return `1A${studentId.substring(0, 2)}${String(studyPrograms[0].StudyProgramID).substring(4, 8)}`;
    };

    const fetchGraduationData = async () => {
        const studyProgramIdStr = getStudyProgramIdString();
        if (!studyProgramIdStr) return;

        try {
            const data = await getGraduationCourses(studyProgramIdStr);
            setGraduationData(data);
        } catch (err) {
            console.error('Error fetching graduation data:', err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const programsData = await getStudyPrograms();
                setStudyPrograms(programsData);

                if (programsData.length > 0) {
                    const studentId = getStudentId();
                    if (studentId) {
                        const studyProgramIdStr = `1A${studentId.substring(0, 2)}${String(programsData[0].StudyProgramID).substring(4, 8)}`;
                        const data = await getGraduationCourses(studyProgramIdStr);
                        setGraduationData(data);
                    }
                }
            } catch (err) {
                console.error('Error:', err);
                showError('Không thể tải dữ liệu xét tốt nghiệp');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [showError]);

    const handleRegister = async (period: GraduationPeriod) => {
        const studyProgramIdStr = getStudyProgramIdString();
        if (!studyProgramIdStr) {
            showError('Không thể xác định chương trình đào tạo');
            return;
        }

        try {
            setIsRegistering(true);
            const result = await saveGraduationCourses(period.GraduationCourseID, studyProgramIdStr);
            showSuccess(result.Message);
            await fetchGraduationData();
        } catch (err) {
            console.error('Error:', err);
            showError('Không thể đăng ký xét tốt nghiệp. Vui lòng thử lại sau.');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleCancelRegistration = async (period: GraduationPeriod) => {
        const studyProgramIdStr = getStudyProgramIdString();
        if (!studyProgramIdStr) {
            showError('Không thể xác định chương trình đào tạo');
            return;
        }

        try {
            setIsRegistering(true);
            const result = await deleteGraduationCourses(period.GraduationCourseID, studyProgramIdStr);
            showSuccess(result.Message);
            await fetchGraduationData();
        } catch (err) {
            console.error('Error:', err);
            showError('Không thể hủy đăng ký xét tốt nghiệp. Vui lòng thử lại sau.');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleDownloadTranscript = async () => {
        if (studyPrograms.length === 0) {
            showError('Không có chương trình đào tạo để tải bảng điểm');
            return;
        }

        const studentId = getStudentId();
        if (!studentId) {
            showError('Không thể xác định mã sinh viên. Vui lòng đăng nhập lại.');
            return;
        }

        try {
            setIsDownloading(true);
            await downloadTranscript(studyPrograms[0].StudyProgramID);
        } catch (err) {
            console.error('Error:', err);
            showError('Không thể tải bảng điểm. Vui lòng thử lại sau.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadApplication = async () => {
        if (studyPrograms.length === 0) {
            showError('Không có chương trình đào tạo để tải đơn đăng ký');
            return;
        }

        try {
            setIsDownloading(true);
            await downloadGraduationApplication(studyPrograms[0].StudyProgramID);
        } catch (err) {
            console.error('Error:', err);
            showError('Không thể tải đơn đăng ký tốt nghiệp. Vui lòng thử lại sau.');
        } finally {
            setIsDownloading(false);
        }
    };

    const isPeriodActive = (period: GraduationPeriod): boolean => {
        const now = new Date();
        const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        };
        const begin = parseDate(period.BeginDate);
        const end = parseDate(period.EndDate);
        end.setHours(23, 59, 59);
        return now >= begin && now <= end;
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Xét tốt nghiệp
                </h1>
                <p className="text-sm text-muted-foreground">
                    Đăng ký và theo dõi xét tốt nghiệp
                </p>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    onClick={handleDownloadTranscript}
                    disabled={isDownloading}
                    className="gap-2"
                >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Tải bảng điểm
                </Button>
                <Button
                    variant="outline"
                    onClick={handleDownloadApplication}
                    disabled={isDownloading}
                    className="gap-2"
                >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Tải đơn đăng ký tốt nghiệp
                </Button>
            </div>

            {/* Registration Periods */}
            <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    Đợt đăng ký xét tốt nghiệp
                </h2>
                {!graduationData?.objdata || graduationData.objdata.length === 0 ? (
                    <div className="text-center py-8">
                        <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">Chưa có đợt đăng ký xét tốt nghiệp</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {graduationData.objdata.map((period) => {
                            const registrationResult = graduationData.objkq?.find(r => r.TenDot === period.GraduationCourseName);
                            const isActive = isPeriodActive(period);
                            const hasRegistered = !!registrationResult;

                            return (
                                <div
                                    key={period.GraduationCourseID}
                                    className={cn(
                                        "p-4 rounded-xl border transition-all",
                                        hasRegistered ? "bg-green-500/10 border-green-500/30" : "bg-muted/50 border-border"
                                    )}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-foreground">
                                                    {period.GraduationCourseName}
                                                </h3>
                                                {hasRegistered && (
                                                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Đã đăng ký
                                                    </Badge>
                                                )}
                                                {isActive && !hasRegistered && (
                                                    <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Đang mở
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>Từ: <span className="font-medium text-foreground">{period.BeginDate}</span></span>
                                                <span>Đến: <span className="font-medium text-foreground">{period.EndDate}</span></span>
                                            </div>
                                            {registrationResult && (
                                                <p className="text-sm text-green-600 mt-2">
                                                    Ngày đăng ký: {registrationResult.UpdateDate}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {isActive && (
                                                <>
                                                    {hasRegistered ? (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleCancelRegistration(period)}
                                                            disabled={isRegistering}
                                                            className="gap-1"
                                                        >
                                                            {isRegistering ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4" />
                                                            )}
                                                            Hủy đăng ký
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleRegister(period)}
                                                            disabled={isRegistering}
                                                            className="gap-1"
                                                        >
                                                            {isRegistering ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <GraduationCap className="w-4 h-4" />
                                                            )}
                                                            Đăng ký xét TN
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Study Programs Card */}
            <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Thông tin chương trình đào tạo
                </h2>
                {studyPrograms.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                        Chưa có thông tin chương trình đào tạo
                    </p>
                ) : (
                    <div className="space-y-3">
                        {studyPrograms.map((program) => (
                            <div
                                key={program.StudyProgramID}
                                className="p-4 rounded-lg bg-muted/50 flex items-center justify-between"
                            >
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Chương trình đào tạo</p>
                                    <p className="font-medium text-foreground">{program.StudyProgramName}</p>
                                </div>
                                <Badge variant="outline" className="font-mono">
                                    {program.StudyProgramID}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Graduation Levels */}
            {graduationData?.objtb && graduationData.objtb.length > 0 && (
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Bậc đào tạo
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {graduationData.objtb.map((level) => (
                            <div
                                key={level.GraduateLevelID}
                                className="p-3 rounded-lg bg-muted/50 text-center"
                            >
                                <p className="font-medium text-foreground text-sm">{level.GraduateLevelName}</p>
                                {level.GraduateLevelEngName && (
                                    <p className="text-xs text-muted-foreground">{level.GraduateLevelEngName}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GraduationPage;
