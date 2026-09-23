// Exam Service - Exam schedules
import api from '@/lib/api';

export interface ExamItem {
	CurriculumID: string;
	CurriculumName: string;
	Credits: number;
	HinhThucThi: string;
	NgayThi: string;
	GioThi: string;
	PhongThi: string;
	LanThi: number;
	Status: number;
}

export const getStudentExams = async (yearStudy: string, termId: string): Promise<ExamItem[]> => {
	try {
		const response = await api.get('/student/exam', {
			params: { namhoc: yearStudy, hocky: termId }
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching student exams:', error);
		throw error;
	}
};

export const getStudentFullExams = async (): Promise<ExamItem[]> => {
	try {
		const response = await api.get('/student/showexambytime');
		return response.data;
	} catch (error) {
		console.error('Error fetching full exam schedule:', error);
		throw error;
	}
};
