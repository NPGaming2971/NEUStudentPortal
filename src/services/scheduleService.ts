// Schedule Service - Class schedules and year/term data
import api from '@/lib/api';

export interface Term {
    TermID: string;
    TermName: string;
    CurrentTerm?: string;
}

export interface YearAndTermItem {
    YearStudy: string;
    CurrentYear: string;
    Terms: Term[];
}

export interface YearAndTermV2Data {
    items: YearAndTermItem[];
}

export interface YearAndTermData {
    CurrentYear: string;
    CurrentTerm: string;
    YearStudy: string[];
    Terms: Term[];
    items: YearAndTermItem[];
}

export interface Week {
    Week: number;
    WeekDisPlay: string;
    BeginDate: string;
    EndDate: string;
    CurrentWeek?: number;
}

export interface ScheduleItem {
    DayOfWeek: number;
    PeriodID: number;
    NumberOfPeriods: number;
    PeriodName: string;
    BeginTime: string;
    EndTime: string;
    CurriculumName: string;
    RoomID: string;
    BuildingName: string;
    Address: string;
    Color: string;
    GroupName: string;
    ClassStudent: string;
    ProfessorName: string;
    FullName: string;
    CampusName: string;
    Week: number;
    WeekScheduleID: number;
    ScheduleStudyUnitID: string;
    YearStudy: string;
    TermID: string;
    StartDate: string;
    EndDate: string;
    TKHHienThi: string;
}

export interface ScheduleData {
    TimeSchedule: string;
    TimeBeginDate: string;
    ResultDataSchedule: ScheduleItem[];
}

export const getYearAndTerm = async (): Promise<YearAndTermData> => {
    try {
        const response = await api.get('/student/YearAndTermV2');
        const data = response.data as YearAndTermV2Data;
        const items = data?.items ?? [];
        const current = items.find((item) => item.CurrentYear) ?? items[0];
        const terms = current?.Terms ?? [];
        const currentTerm =
            terms.find((term) => term.CurrentTerm) ?? terms[0];
        return {
            CurrentYear: current?.YearStudy ?? '',
            CurrentTerm: currentTerm?.TermID ?? '',
            YearStudy: items.map((item) => item.YearStudy),
            Terms: terms,
            items: items,
        };
    } catch (error) {
        console.error('Error fetching year and term:', error);
        throw error;
    }
};

export const getWeekSchedule = async (yearStudy: string): Promise<Week[]> => {
    try {
        const year = yearStudy.split("-")[0] ?? yearStudy;
        const response = await api.get('/student/getAllWeekHanhChinh', {
            params: { Year: year },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching week schedule:', error);
        throw error;
    }
};

export const getDrawingSchedules = async (yearStudy: string, termId: string, week: number): Promise<ScheduleData> => {
    try {
        const year = yearStudy.split("-")[0] ?? yearStudy;
        const response = await api.get('/student/DrawingSchedules', {
            params: { namhoc: year, hocky: termId, tuan: week },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching drawing schedules:', error);
        throw error;
    }
};

export interface PeriodScheduleItem {
    MaSV: string;
    HoTenSV: string;
    MaLHP: string;
    TenHP: string;
    SoTC: number;
    LoaiHP: string;
    SoLuong: number;
    Thu: string;
    CaHoc: string;
    TietHoc: string;
    Phong: string;
    TuanHoc: string;
    XepTKB: string;
    DayOfWeek: number;
    PeriodID: number;
    NumberOfPeriods: number;
    LopSV: string;
    MaGV: string;
    HoTenGV: string;
    CampusName: string;
    CampusAddress: string;
    TKBHienThi1: string;
    TKBHienThi: string;
}

export interface PeriorScheduleData {
    result: PeriodScheduleItem[];
    Sort: number;
}

export const getPeriorSchedules = async (yearStudy: string, termId: string): Promise<PeriorScheduleData> => {
    try {
        const response = await api.get('/student/DrawingStudentSchedule_Perior', {
            params: { namhoc: yearStudy, hocky: termId },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching perior schedules:', error);
        throw error;
    }
};

export interface ClassStudentOption {
    ClassStudentID: string;
    ClassStudentName: string;
}

export const getClassStudentForSchedules = async (yearStudy: string, termId: string): Promise<ClassStudentOption[]> => {
    try {
        const response = await api.get('/student/GetClassStudentForSChedules', {
            params: { namhoc: yearStudy, hocky: termId },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching class students for schedules:', error);
        throw error;
    }
};

export interface ClassScheduleItem {
    CurriculumName: string;
    WeekScheduleID: number;
    ScheduleStudyUnitID: string;
    Unit: number;
    PeriodID: number;
    NumberOfPeriods: number;
    DayOfWeek: number;
    Week: number;
    RoomID: string;
    Year: number;
    CampusName: string;
    ShiftName: string;
    Thu: string;
    Ngay: string;
    NgayHienTai: string;
    TuanHienTaiTrongNam: number;
    BeginTime: string;
    EndTime: string;
    FullName: string;
    StartDate: string;
    EndDate: string;
    Address: string;
    BuildingName: string;
    Color: string;
    PeriodName: string;
    YearStudy: string;
    TermID: string;
    TKHHienThi: string;
}

export const getDrawingClassSchedule = async (classStudentId: string, yearStudy: string, termId: string, week: number): Promise<ClassScheduleItem[]> => {
    try {
        const response = await api.get('/student/DrawingClassSchedule', {
            params: {
                ClassStudentID: classStudentId,
                namhoc: yearStudy,
                hocky: termId,
                tuan: week,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching drawing class schedule:', error);
        throw error;
    }
};
