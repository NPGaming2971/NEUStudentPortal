// Decision Service - Student decisions/resolutions
import api from '@/lib/api';
import { Endpoints } from '@/lib/endpoints';

export interface DecisionItem {
	StudentID: string;
	YearStudy: string;
	TermID: string;
	DecisionNumber: string;
	DecisionName: string;
	InfringeContentName: string;
	SignStaff: string;
	SignDate: string;
}

export const getStudentDecisions = async (): Promise<DecisionItem[]> => {
	try {
		const response = await api.get(Endpoints.Student.Decision);
		return response.data;
	} catch (error) {
		console.error('Error fetching student decisions:', error);
		throw error;
	}
};
