// Decision Service - Student decisions/resolutions
import api from '@/lib/api';

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
        const response = await api.get('/student/decision');
        return response.data;
    } catch (error) {
        console.error('Error fetching student decisions:', error);
        throw error;
    }
};
