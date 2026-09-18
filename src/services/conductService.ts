// Conduct Score Service - Student behavior/conduct scores
import api from '@/lib/api';

export interface ConductScore {
    YearStudy: string;
    TermID: number;
    ClassStudentName: string;
    TongDiem: number;
    XepLoai: string;
}

export const getStudentConductScore = async (): Promise<ConductScore[]> => {
    try {
        const response = await api.get('/student/behaviorscoretotal');
        return response.data;
    } catch (error) {
        console.error('Error fetching student conduct score:', error);
        throw error;
    }
};

export interface YearTermScoreData {
    CurrentYear: string;
    CurrentTerm: string;
    YearStudy: string[];
    Terms: { TermID: string; TermName: string }[];
}

export interface BehaviorDetailItem {
    BehaviorGroupID: string;
    BehaviorGroupName: string;
    BehaviorDetailID: string;
    BehaviorDetailName: string;
    MaxScore: number;
    MaxScoreGroup: number;
    DiemCuoiSV: number | null;
}

export interface BehaviorResult {
    Scores: number;
    BehaviorScoreRank: string;
}

export interface BehaviorData {
    ResultDataBangDanhGia: BehaviorDetailItem[];
    KetQuaDanhGia: BehaviorResult[];
}

export const getYearAndTermScore = async (): Promise<YearTermScoreData> => {
    try {
        const response = await api.get('/student/YearAndTermScore');
        return response.data;
    } catch (error) {
        console.error('Error fetching year and term score:', error);
        throw error;
    }
};

export const getBehaviorScore = async (yearStudy: string, termId: string): Promise<BehaviorData> => {
    try {
        const response = await api.get('/student/BehaviorByStudent', {
            params: {
                namhoc: yearStudy,
                hocky: termId,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching behavior score:', error);
        throw error;
    }
};
