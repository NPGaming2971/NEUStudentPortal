// Academic Service - Study programs, grades, conduct score, course registration, graduation
import api from '@/lib/api';

export interface StudyProgram {
    StudentID?: string;
    StudyProgramID: string;
    StudyProgramName: string;
    Type?: number;
}

export interface CourseGrade {
    CurriculumID: string;
    StudyUnitID?: string;
    CurriculumName: string;
    CurriculumType?: number;
    CurriculumTypeName?: string;
    Credits: number;
    Mark10?: string | number | null;
    Mark4?: number | null;
    DiemTK_10: string | number | null;
    DiemTK_4: number | string | null;
    MarkLetter?: string | null;
    DiemTK_Chu: string | null;
    Ispass?: string; // "True" | "False" | ""
    IsPass?: string | number | boolean; // raw pass flag: "1" | "" | true | 0 ...
    ViewTongHocKy?: string;
    IsInUsed?: boolean;
    TermID?: string;
    YearStudy?: string;
    SemesterID?: string;
    SemesterName?: string;
    StudyProgramID?: string;
    StudyUnitTypeID?: number | null;
    GhiChu?: string | null;
    ScheduleStudyUnitID?: string | null;
    ListOfProfessorID?: string;
    ListOfProfessorName?: string;
    Info?: string;
    Note?: string;
    EnglishCurriculumName?: string;
    NotComputeAverageScore?: boolean;
}

export interface GradeAverageScore {
    StudyProgramID?: string;
    YearStudy?: string;
    TermID?: string;
    AverageScore: number | null;
    AverageScore4: number | null;
    MandatoryCredits?: string | null;
    SelectiveCredits?: string | null;
    TongSTC?: number;
    TongSTC_Dat?: number;
    TongSTC_KhongDat?: number;
    StudentID?: string;
    DiemTBTL?: number | null;
    DiemTBTL4?: number | null;
    STCTL?: number;
}

export interface WholeProgramAverage extends GradeAverageScore {
    XL_TN?: string;
    Diem_RL?: number | null;
    XL_RL?: string | null;
}

export interface GradeSemester {
    HocKy: string;
    DanhSachDiemHK?: CourseGrade[];
    AverageScore?: GradeAverageScore | null;
    Behavior?: unknown;
}

export interface GradeYear {
    NamHoc: string;
    DanhSachDiem?: GradeSemester[];
}

export interface StudyProgramResults {
    diem?: GradeYear[];
    diemToanKhoa?: WholeProgramAverage | null;
}

export interface DashboardClassAverage {
    StudentID: string;
    CurriculumID: string;
    CurriculumName: string;
    Credits: number;
    MaxMark10: number | null;
    AVGClass: number | null;
}

export interface DashboardCreditSummary {
    TotalGatherCrediits: number;
    MinGatherCredits: number;
}

export interface DashboardStudentInfo {
    StudentID: string;
    StudentName: string;
    Gender: boolean;
    ClassStudentName: string;
    CourseName: string;
    StudyTypeName: string;
}

export interface DashboardKetQuaHocTap {
    tb1?: DashboardClassAverage[];
    tb2?: DashboardCreditSummary[];
    info?: DashboardStudentInfo[];
}

export const getDashboardKetQuaHocTap = async (
    studyProgramId: string,
    yearStudy: string,
    termId: string
): Promise<DashboardKetQuaHocTap> => {
    try {
        const response = await api.post('/student/DashboardKetQuaHocTap', {
            p1: studyProgramId,
            p2: yearStudy,
            p3: termId,
        });
        return response.data as DashboardKetQuaHocTap;
    } catch (error) {
        console.error('Error fetching class average dashboard:', error);
        throw error;
    }
};

export interface AcademicYear {
    NamHoc: string;
    DanhSachCTDT?: Semester[];
}

export interface Semester {
    HocKy: string;
    DanhSachDiemHocPhan?: CourseGroup[];
}

export interface CourseGroup {
    DanhSachDiemChiTiet?: CourseGrade[];
}

export interface RegistrationResult {
    Status: number;
    TinhTrang: string;
    IsAccepted: number;
    ScheduleStudyUnitID: string;
    ScheduleStudyUnitAlias: string;
    StudyUnitID: string;
    StudyUnitAlias: string;
    CurriculumID: string;
    CurriculumName: string;
    CreditInfos: string;
    Credits: number;
    ProfessorName: string;
    ProfessorID: string;
    ClassStudentID: string;
    YearStudy: string;
    TermID: string;
    BeginDate: string;
    EndDate: string;
    StudyUnitTypeID: number;
    StudentID: string;
    UpdateDate: string;
    RegistDate: string;
    ListOfWeekSchedules: string;
    RegistType: string;
}

export const getStudyPrograms = async (): Promise<StudyProgram[]> => {
    try {
        const response = await api.get('/student/getstudyprogram');
        return response.data;
    } catch (error) {
        console.error('Error fetching study programs:', error);
        throw error;
    }
};

// The /student/marks endpoint returns two different shapes depending on `loai`:
//   - loai=SV    -> { diem: [{ NamHoc, DanhSachDiem: [{ HocKy, DanhSachDiemHK, AverageScore }] }], diemToanKhoa }
//   - loai=CTDT  -> { tbStudyPrograms: [{ NamHoc, DanhSachCTDT: [{ HocKy, DanhSachDiemHocPhan: [{ BatBuoc, DanhSachDiemChiTiet }] }] }], diemToanKhoa }
// These helpers normalize both into the `StudyProgramResults` shape consumed by the UI
// (diem[].DanhSachDiem[].DanhSachDiemHK[] with CurriculumName/Credits/Ispass fields).

interface RawMarksCourse {
    CurriculumID?: string;
    CurriculumName?: string;
    TenHP?: string;
    Credits?: number;
    STC?: number;
    Ispass?: string;
    IsPass?: string | number | boolean;
    [key: string]: unknown;
}

interface RawMarksSemester {
    [key: string]: unknown;
    HocKy?: string;
    DanhSachDiemHK?: RawMarksCourse[];
    DanhSachDiemHocPhan?: { DanhSachDiemChiTiet?: RawMarksCourse[] }[];
    AverageScore?: GradeAverageScore | null;
}

interface RawMarksYear {
    [key: string]: unknown;
    NamHoc?: string;
    DanhSachDiem?: RawMarksSemester[];
    DanhSachCTDT?: RawMarksSemester[];
}

const normalizeMarkCourse = (raw: Record<string, unknown>): CourseGrade => {
    const passed = raw.IsPass === '1' || raw.IsPass === true;
    const failed = raw.IsPass === '0' || raw.IsPass === false;
    const ispass = passed ? 'True' : failed ? 'False' : String(raw.Ispass ?? '');
    return {
        ...(raw as unknown as CourseGrade),
        CurriculumID: String(raw.CurriculumID ?? ''),
        CurriculumName: String(raw.CurriculumName ?? raw.TenHP ?? ''),
        Credits: Number(raw.Credits ?? raw.STC ?? 0),
        Ispass: ispass,
    };
};

const normalizeMarksResponse = (data: unknown): StudyProgramResults => {
    const raw = (data ?? {}) as { diem?: RawMarksYear[]; tbStudyPrograms?: RawMarksYear[]; diemToanKhoa?: WholeProgramAverage | null };
    const rawYears = raw.diem ?? raw.tbStudyPrograms ?? [];

    const diem: GradeYear[] = rawYears
        .filter((year) => year && typeof year === 'object')
        .map((year) => {
            const rawSemesters = year.DanhSachDiem ?? year.DanhSachCTDT ?? [];
            const semesters: GradeSemester[] = rawSemesters
                .filter((sem) => sem && typeof sem === 'object')
                .map((sem) => {
                    const flat = sem.DanhSachDiemHK ?? [];
                    const grouped = (sem.DanhSachDiemHocPhan ?? []).flatMap(
                        (group) => group?.DanhSachDiemChiTiet ?? [],
                    );
                    return {
                        HocKy: sem.HocKy ?? '',
                        DanhSachDiemHK: (flat.length > 0 ? flat : grouped).map(normalizeMarkCourse),
                        AverageScore: sem.AverageScore ?? null,
                    } satisfies GradeSemester;
                });
            return {
                NamHoc: year.NamHoc ?? '',
                DanhSachDiem: semesters,
            } satisfies GradeYear;
        });

    return {
        diem,
        diemToanKhoa: raw.diemToanKhoa ?? null,
    };
};

export const getStudyProgramResults = async (studyProgramId: string): Promise<StudyProgramResults> => {
    try {
        const response = await api.get('/student/marks', {
            params: { ctdt: studyProgramId, loai: 'SV' },
        });
        return normalizeMarksResponse(response.data);
    } catch (error) {
        console.error('Error fetching study program results:', error);
        throw error;
    }
};

export const getStudyProgramResultsByCurriculum = async (studyProgramId: string): Promise<StudyProgramResults> => {
    try {
        const response = await api.get('/student/marks', {
            params: { ctdt: studyProgramId, loai: 'CTDT' },
        });
        return normalizeMarksResponse(response.data);
    } catch (error) {
        console.error('Error fetching study program results by curriculum:', error);
        throw error;
    }
};

export const getCourseRegistrationResults = async (yearStudy: string, termId: string) => {
    try {
        const response = await api.get('/student/XemKetQuaDangKyHP', {
            params: { namhoc: yearStudy, hocky: termId },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching course registration results:', error);
        throw error;
    }
};

export interface GraduationLevel {
    GraduateLevelID: string;
    GraduateLevelName: string;
    GraduateLevelEngName?: string;
    StudyUnitCode?: string;
    GhiChu?: string | null;
    NoiDungThongBao?: string | null;
    ThongBaoNopChungChi?: string | null;
}

export interface GraduationPeriod {
    GraduationCourseID: string;
    GraduationCourseName: string;
    BeginDate: string;
    EndDate: string;
}

export interface GraduationResult {
    Result: number;
    UpdateDate: string;
    TenDot: string;
}

export interface GraduationCoursesData {
    objdata: GraduationPeriod[];
    objkq: GraduationResult[];
    objtb: GraduationLevel[];
}

export const getGraduationCourses = async (studyProgramId: string): Promise<GraduationCoursesData> => {
    try {
        const response = await api.get('/student/LoadGraduationCourses', {
            params: { StudyProgramID: studyProgramId },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching graduation courses:', error);
        throw error;
    }
};

export interface SaveGraduationResponse {
    Message: string;
}

export const saveGraduationCourses = async (
    graduationCourseId: string,
    studyProgramId: string,
    note: string = ''
): Promise<SaveGraduationResponse> => {
    try {
        const response = await api.post('/student/SaveGraduationCourses', {
            p1: graduationCourseId,
            p2: studyProgramId,
            p3: note,
        });
        return response.data;
    } catch (error) {
        console.error('Error saving graduation courses:', error);
        throw error;
    }
};

export const deleteGraduationCourses = async (
    graduationCourseId: string,
    studyProgramId: string
): Promise<SaveGraduationResponse> => {
    try {
        const response = await api.post('/student/DeleteGraduationCourses', {
            p1: graduationCourseId,
            p2: studyProgramId,
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting graduation courses:', error);
        throw error;
    }
};
