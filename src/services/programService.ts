// Program Service - Educational programs and study programs
import api from '@/lib/api';

export interface StudyProgram {
    StudyProgramID: string;
    StudyProgramName: string;
    Type?: number;
}

export interface StudyProgramCourse {
    MaCTDT: string;
    TenCTDT: string;
    TrinhDoDaoTao: string;
    ChuyenNganhDaoTao: string;
    HinhThucDaoTao: string;
    HocKy: string;
    KKT: string;
    BatBuoc: string;
    MaHP: string;
    TenHP: string;
    BoMon: string;
    Khoa: string;
    STC: number;
    TCHocPhan: string;
    LT: string;
    TH: string;
    TS: string;
    HPHocTruoc: string;
    HPTienQuyet: string;
    GhiChu: string;
    YearStudy: number;
    TermID: string;
    IsPass: string;
}

export interface StudyProgramGroup {
    BatBuoc: string;
    ChuongTrinhs: StudyProgramCourse[];
}

export interface KKTBlock {
    KKT: string;
    ChuongTrinhDaoTaos: StudyProgramGroup[];
}

export interface StudyProgramDetail {
    tbStudyPrograms: KKTBlock[];
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

export const getStudyProgramDetail = async (studyProgramId: string): Promise<StudyProgramDetail> => {
    try {
        const response = await api.get('/student/studyProgram', {
            params: { StudyProgramID: studyProgramId, tiendo: 1 },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching study program detail:', error);
        throw error;
    }
};