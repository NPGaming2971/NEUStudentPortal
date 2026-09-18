import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { useGlobalNotification } from '@/hooks/useGlobalNotification';
import {
    getAllStudyPrograms,
    getRegistSemesterQuota,
    getAllStudyTypes,
    getAllClassRegisted,
    getAllClassAllowRegist,
    removeScheduleStudyUnit,
    type StudyProgram,
    type RegistSemesterQuota,
    type StudyType,
    type RegisteredClass,
    type ClassAllowRegistGroup,
    type ClassStudyUnitItem,
} from '@/services/registrationService';
import { initializeRegistrationSession } from '@/services/registrationAuthService';
import { getStudyProgramResultsByCurriculum, getStudyPrograms } from '@/services/academicService';

import RegistrationHeader from '@/components/common/RegistrationPage/RegistrationHeader';
import RegistrationFilters from '@/components/common/RegistrationPage/RegistrationFilters';
import RegisteredClassesCard from '@/components/common/RegistrationPage/RegisteredClassesCard';
import AvailableCoursesList from '@/components/common/RegistrationPage/AvailableCoursesList';
import ScheduleSelectionDialog from '@/components/common/RegistrationPage/ScheduleSelectionDialog';

interface AcademicCourseResult {
    CurriculumID: string;
    CurriculumName: string;
    Credits: string;
    DiemTK_10: string;
    DiemTK_4: string;
    DiemTK_Chu: string;
    IsPass: string;
    HPTuongDuong?: string;
    isEquivalentOf?: string;
}



function RegistrationPage() {
    const { showError, showInfo, showSuccess } = useGlobalNotification();

    const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [quota, setQuota] = useState<RegistSemesterQuota | null>(null);
    const [studyTypes, setStudyTypes] = useState<StudyType[]>([]);
    const [selectedStudyType, setSelectedStudyType] = useState<string>("");

    const [registeredClasses, setRegisteredClasses] = useState<RegisteredClass[]>([]);
    const [allowedClasses, setAllowedClasses] = useState<ClassAllowRegistGroup[]>([]);

    const [selectedCourseForReg, setSelectedCourseForReg] = useState<ClassStudyUnitItem | null>(null);
    const [cancelingClassId, setCancelingClassId] = useState<string | null>(null);

    const [isInitializing, setIsInitializing] = useState(true);
    const [isLoadingQuota, setIsLoadingQuota] = useState(false);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);
    const [academicResults, setAcademicResults] = useState<
        { diem?: unknown[]; tbStudyPrograms?: unknown[] } | null
    >(null);

    const academicLookup = useMemo(() => {
        const map = new Map<string, AcademicCourseResult>();
        if (!academicResults) return map;

        // Extract courses from both the old shape (tbStudyPrograms → DanhSachCTDT)
        // and the new shape (diem → DanhSachDiem → DanhSachDiemHK)
        interface RawCourse {
            CurriculumID?: string;
            Ispass?: string;
            IsPass?: string;
            HPTuongDuong?: string;
        }
        interface RawSemester {
            DanhSachDiemHK?: RawCourse[];
            DanhSachDiemHocPhan?: { DanhSachDiemChiTiet?: RawCourse[] }[];
        }
        interface RawYear {
            DanhSachDiem?: RawSemester[];
            DanhSachCTDT?: RawSemester[];
        }

        const years: RawYear[] =
            (academicResults.diem as RawYear[] | undefined) ??
            (academicResults.tbStudyPrograms as RawYear[] | undefined) ??
            [];

        years.forEach((year: RawYear) => {
            (year.DanhSachDiem ?? year.DanhSachCTDT)?.forEach((semester: RawSemester) => {
                const flat = semester.DanhSachDiemHK ?? [];
                const grouped = (semester.DanhSachDiemHocPhan ?? []).flatMap(
                    (group) => group.DanhSachDiemChiTiet ?? [],
                );
                (flat.length ? flat : grouped).forEach((course: RawCourse) => {
                    const passed =
                        course.Ispass === "True" || course.IsPass === "1";
                    if (passed && course.CurriculumID) {
                        const mainCode = String(course.CurriculumID).trim().toUpperCase();
                        // Only set if not already set, or if we want to prioritize direct matches
                        if (!map.has(mainCode)) {
                            map.set(mainCode, course as AcademicCourseResult);
                        }
                        
                        if (course.HPTuongDuong) {
                            const equivalents = String(course.HPTuongDuong)
                                .split(',')
                                .map(s => s.trim().toUpperCase())
                                .filter(Boolean);
                                
                            equivalents.forEach(eq => {
                                if (!map.has(eq)) {
                                    map.set(eq, { ...course, isEquivalentOf: mainCode } as AcademicCourseResult);
                                }
                            });
                        }
                    }
                });
            });
        });
        return map;
    }, [academicResults]);

    const availableStudyTypes = useMemo(() => {
        if (!quota || !studyTypes.length) return [];
        return studyTypes.filter((type) => {
            if (!type.MapID) return false;
            const quotaKey = type.MapID as keyof RegistSemesterQuota;
            const value = quota[quotaKey];
            return value === true || value === 1;
        });
    }, [quota, studyTypes]);

    useEffect(() => {
        const initialize = async () => {
            try {
                await initializeRegistrationSession();
                const [programs, types] = await Promise.all([
                    getAllStudyPrograms(),
                    getAllStudyTypes(),
                ]);
                setStudyPrograms(programs);
                setStudyTypes(types);
                if (programs.length > 0) {
                    setSelectedProgramId(programs[0].StudyProgramID);
                }
            } catch (err) {
                console.error("Error initializing:", err);
                showError("Không thể kết nối đến hệ thống đăng ký");
            } finally {
                setIsInitializing(false);
            }
        };
        initialize();
    }, [showError]);

    useEffect(() => {
        if (!selectedProgramId) return;

        const fetchAcademicResults = async () => {
            try {
                const academicPrograms = await getStudyPrograms();
                if (academicPrograms && academicPrograms.length > 0) {
                    const academicProgramId = academicPrograms[0].StudyProgramID;
                    const results = await getStudyProgramResultsByCurriculum(academicProgramId);
                    setAcademicResults(results || null);
                }
            } catch (err) {
                console.error("Error fetching academic results:", err);
            }
        };

        const fetchQuota = async () => {
            setIsLoadingQuota(true);
            try {
                const quotaData = await getRegistSemesterQuota(selectedProgramId);
                setQuota(quotaData);
                if (quotaData) {
                    const firstAvailable = studyTypes.find((type) => {
                        if (!type.MapID) return false;
                        const quotaKey = type.MapID as keyof RegistSemesterQuota;
                        const value = quotaData[quotaKey];
                        return value === true || value === 1;
                    });
                    if (firstAvailable) {
                        setSelectedStudyType(firstAvailable.LoaiHinh);
                    }
                }
            } catch (err) {
                console.error("Error fetching quota:", err);
                showError("Không thể tải thông tin đợt đăng ký");
            } finally {
                setIsLoadingQuota(false);
            }
        };

        fetchAcademicResults();
        fetchQuota();
    }, [selectedProgramId, studyTypes, showError]);

    useEffect(() => {
        if (!selectedProgramId || !selectedStudyType || !quota?.YearStudy || !quota?.TermID || typeof quota.IdDot === "undefined") return;
        
        const fetchClasses = async () => {
            setIsLoadingClasses(true);
            try {
                const [registered, allowed] = await Promise.all([
                    getAllClassRegisted("0", quota.IdDot),
                    getAllClassAllowRegist(
                        selectedProgramId,
                        selectedStudyType,
                        quota.YearStudy,
                        quota.TermID,
                    ),
                ]);
                setRegisteredClasses(registered?.Rows || []);
                setAllowedClasses(allowed);
            } catch (err) {
                console.error("Error fetching classes:", err);
                showError("Không thể tải danh sách học phần");
            } finally {
                setIsLoadingClasses(false);
            }
        };
        fetchClasses();
    }, [selectedProgramId, selectedStudyType, quota?.YearStudy, quota?.TermID, quota?.IdDot, showError]);

    const summary = useMemo(() => {
        const totalRegistered = registeredClasses.length;
        const totalCredits = registeredClasses.reduce((sum, c) => sum + (c.Credits || 0), 0);
        const totalAvailable = allowedClasses.reduce((sum, group) =>
            sum + (group.classStudyUnits?.reduce((s, plan) => s + (plan.Selections?.length || 0), 0) || 0), 0);
        return { totalRegistered, totalCredits, totalAvailable };
    }, [registeredClasses, allowedClasses]);

    const handleRefresh = async () => {
        if (!selectedProgramId || !quota || typeof quota.IdDot === "undefined") return;
        setIsLoadingClasses(true);
        try {
            const [registered, allowed] = await Promise.all([
                getAllClassRegisted("0", quota.IdDot),
                getAllClassAllowRegist(selectedProgramId, selectedStudyType, quota.YearStudy, quota.TermID),
            ]);
            setRegisteredClasses(registered?.Rows || []);
            setAllowedClasses(allowed);
            showInfo("Đã làm mới dữ liệu");
        } catch {
            showError("Không thể làm mới dữ liệu");
        } finally {
            setIsLoadingClasses(false);
        }
    };

    const handleCancelCourse = async (registeredCls: RegisteredClass) => {
        if (!quota || typeof quota.IdDot === "undefined") {
            showError("Thiếu thông tin hủy đăng ký");
            return;
        }
        setCancelingClassId(registeredCls.ScheduleStudyUnitID);
        try {
            const message = await removeScheduleStudyUnit(
                quota.IdDot,
                selectedProgramId,
                registeredCls
            );
            showSuccess(typeof message === "string" ? message : `Đã hủy đăng ký ${registeredCls.CurriculumName}`);
            await handleRefresh();
        } catch (error) {
            const errName = error instanceof Error ? error.message : "Hủy đăng ký thất bại";
            showError(errName);
        } finally {
            setCancelingClassId(null);
        }
    };

    if (isInitializing) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <div className='text-center space-y-4'>
                    <Loader2 className='w-12 h-12 animate-spin text-primary mx-auto' />
                    <p className='text-muted-foreground'>Đang kết nối hệ thống đăng ký...</p>
                </div>
            </div>
        );
    }

    if (studyPrograms.length === 0) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Card className='max-w-md w-full border-destructive/50'>
                    <CardContent className='pt-6'>
                        <div className='text-center space-y-4'>
                            <AlertCircle className='w-12 h-12 text-destructive mx-auto' />
                            <p className='text-destructive'>Không tìm thấy chương trình đào tạo nào</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className='space-y-6 pb-10'>
            <RegistrationHeader summary={summary} quota={quota} />

            <RegistrationFilters
                studyPrograms={studyPrograms}
                selectedProgramId={selectedProgramId}
                onProgramChange={setSelectedProgramId}
                availableStudyTypes={availableStudyTypes}
                selectedStudyType={selectedStudyType}
                onStudyTypeChange={setSelectedStudyType}
                onRefresh={handleRefresh}
                isLoadingClasses={isLoadingClasses}
            />

            <RegisteredClassesCard
                registeredClasses={registeredClasses}
                quota={quota}
                cancelingClassId={cancelingClassId}
                onCancelCourse={handleCancelCourse}
            />

            <AvailableCoursesList
                allowedClasses={allowedClasses}
                registeredClasses={registeredClasses}
                isLoadingClasses={isLoadingClasses}
                isLoadingQuota={isLoadingQuota}
                quota={quota}
                academicLookup={academicLookup}
                onSelectCourse={setSelectedCourseForReg}
                showInfo={showInfo}
                showError={showError}
            />

            <ScheduleSelectionDialog
                course={selectedCourseForReg}
                studyProgramId={selectedProgramId}
                studyType={selectedStudyType}
                turnId={quota?.IdDot || 0}
                isOpen={!!selectedCourseForReg}
                onClose={() => setSelectedCourseForReg(null)}
                onSuccess={() => {
                    setSelectedCourseForReg(null);
                    handleRefresh();
                }}
            />
        </div>
    );
}

export default RegistrationPage;
