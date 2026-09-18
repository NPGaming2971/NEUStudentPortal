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
}

export interface Week {
    Week: number;
    BeginDate: string;
    EndDate: string;
}

export interface ScheduleItem {
    DayOfWeek: number;
    BeginTime: string;
    EndTime: string;
    CurriculumName: string;
    RoomID: string;
    ProfessorName: string;
}

export interface ScheduleData {
    TimeSchedule: string;
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
        };
    } catch (error) {
        console.error('Error fetching year and term:', error);
        throw error;
    }
};

export const getWeekSchedule = async (yearStudy: string, termId: string): Promise<Week[]> => {
    try {
        const response = await api.get('/student/WeekSchedule', {
            params: { namhoc: yearStudy, hocky: termId },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching week schedule:', error);
        throw error;
    }
};

export const getDrawingSchedules = async (yearStudy: string, termId: string, week: number): Promise<ScheduleData> => {
    try {
        const response = await api.get('/student/DrawingSchedules', {
            params: { namhoc: yearStudy, hocky: termId, tuan: week },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching drawing schedules:', error);
        throw error;
    }
};
