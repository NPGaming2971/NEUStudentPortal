// Schedule Service - Class schedules and year/term data
import api from '@/lib/api';
import { Endpoints } from '@/lib/endpoints';
import { getTermLabel } from '@/lib/exportOptions';

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

// Normalizes the three year/term APIs (YearAndTermV2, YearAndTermScore,
// GetAllYearStudyAndTerm) — which return slightly different shapes — into a
// single YearAndTermData used by every year/term filter in the app.
export const normalizeYearAndTermData = (source: {
	items?: YearAndTermItem[];
	YearStudy?: string[];
	Terms?: Term[];
	YearStudys?: string[];
	TermIDs?: string[];
	CurrentYear?: string;
	CurrentTerm?: string;
	CurrentYearStudy?: string;
	CurrentTermID?: string;
}): YearAndTermData => {
	const items = Array.isArray(source?.items) ? source.items : [];
	const rawTerms = source?.Terms ?? items[0]?.Terms ?? [];
	const terms: Term[] =
		rawTerms.length > 0 && typeof rawTerms[0] === 'string'
			? (rawTerms as unknown as string[]).map((id) => ({ TermID: id, TermName: getTermLabel(id) }))
			: (rawTerms as Term[]);
	const yearList =
		items.length > 0 ? items.map((item) => item.YearStudy) : (source?.YearStudy ?? source?.YearStudys ?? []);
	const currentYearItem = items.find((item) => item.CurrentYear) ?? items[0];
	return {
		CurrentYear: currentYearItem?.YearStudy ?? source?.CurrentYear ?? source?.CurrentYearStudy ?? yearList[0] ?? '',
		CurrentTerm:
			currentYearItem?.Terms.find((term) => term.CurrentTerm)?.TermID ??
			currentYearItem?.Terms[0]?.TermID ??
			source?.CurrentTerm ??
			source?.CurrentTermID ??
			terms[0]?.TermID ??
			'',
		YearStudy: yearList,
		Terms: terms,
		items
	};
};

export const getYearAndTerm = async (): Promise<YearAndTermData> => {
	try {
		const response = await api.get(Endpoints.Student.YearAndTermV2);
		return normalizeYearAndTermData(response.data);
	} catch (error) {
		console.error('Error fetching year and term:', error);
		throw error;
	}
};

export const getWeekSchedule = async (yearStudy: string): Promise<Week[]> => {
	try {
		const year = yearStudy.split('-')[0] ?? yearStudy;
		const response = await api.get(Endpoints.Student.GetAllWeekHanhChinh, {
			params: { Year: year }
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching week schedule:', error);
		throw error;
	}
};

export const getDrawingSchedules = async (yearStudy: string, termId: string, week: number): Promise<ScheduleData> => {
	try {
		const year = yearStudy.split('-')[0] ?? yearStudy;
		const response = await api.get(Endpoints.Student.DrawingSchedules, {
			params: { namhoc: year, hocky: termId, tuan: week }
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
		const response = await api.get(Endpoints.Student.DrawingStudentSchedulePerior, {
			params: { namhoc: yearStudy, hocky: termId }
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
		const response = await api.get(Endpoints.Student.GetClassStudentForSChedules, {
			params: { namhoc: yearStudy, hocky: termId }
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

export const getDrawingClassSchedule = async (
	classStudentId: string,
	yearStudy: string,
	termId: string,
	week: number
): Promise<ClassScheduleItem[]> => {
	try {
		const response = await api.get(Endpoints.Student.DrawingClassSchedule, {
			params: {
				ClassStudentID: classStudentId,
				namhoc: yearStudy,
				hocky: termId,
				tuan: week
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching drawing class schedule:', error);
		throw error;
	}
};
