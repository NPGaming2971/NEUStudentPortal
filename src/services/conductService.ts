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
    BehaviorGroupOrder: number;
    BehaviorID: string;
    BehaviorName: string;
    BehaviorNameGroup: string;
    BehaviorDetailID: string;
    BehaviorDetailName: string;
    BehaviorDetailOrder: number | null;
    MaxScore: number;
    MaxScoreGroup: number;
    MaxScoreText?: string;
    IndividualScore: number | null;
    ClassScore: number | null;
    DepartmentScore: number | null;
    DiemCuoiSV: number | null;
    DiemCuoiLop: number | null;
    DiemCuoiGV: number | null;
    ReadOnly: string;
    UseCheck: boolean | null;
    IsAdd: boolean | null;
    GroupRadiobutton: string | null;
    Invisible: boolean | null;
    Orders: number | null;
    StudentID: string | null;
    YearStudy: string | null;
    TermID: string | null;
    GhiChu?: string | null;
    ListBehaviorName?: string | null;
    BehaviorDetailIDParent?: string | null;
    HinhAnh?: string | null;
    TotalBehaviorDiscussion?: number | null;
}

export interface BehaviorResult {
    Scores: number;
    BehaviorScoreRank: string;
}

export interface BehaviorData {
    ResultDataBangDanhGia: BehaviorDetailItem[];
    KetQuaDanhGia: BehaviorResult[];
    ThoiGianNhapDiem?: boolean;
    ThoiHanNhapDiemSinhVien?: boolean;
    IsSaveBehavior?: boolean;
    TermID?: string;
    YearStudy?: string;
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

export const saveBehaviorScore = async (
    yearStudy: string,
    termId: string,
    behaviors: BehaviorDetailItem[]
): Promise<void> => {
    try {
        await api.post(
            '/student/SaveBehavior',
            {
                YearStudy: yearStudy,
                TermID: termId,
                Behaviors: behaviors,
            },
            { headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error saving behavior score:', error);
        throw error;
    }
};

export const resourceUpload = async (file: File): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('FormFile', file);
        formData.append('FileName', file.name);
        formData.append('Type', 'DiemRenLuyen');
        const response = await api.post('/student/ResourceUpload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const fileName: string = response.data?.FileName ?? '';
        return `https://${fileName}`;
    } catch (error) {
        console.error('Error uploading resource:', error);
        throw error;
    }
};

export const insertBehaviorDetail = async (
    parentDetailId: string,
    note: string,
    imageUrl: string,
    yearStudy: string,
    termId: string
): Promise<void> => {
    try {
        await api.post('/student/InsertBehaviorDetail', {
            p1: parentDetailId,
            p2: note,
            p3: imageUrl,
            p4: yearStudy,
            p5: termId,
        });
    } catch (error) {
        console.error('Error inserting behavior detail:', error);
        throw error;
    }
};

export interface BehaviorDetailEvidence {
    MaTieuChi: string;
    TenTieuChi: string;
    HinhAnh: string | null;
    BehaviorDetailID: string;
    Diem: number | null;
    StudentID: string;
    YearStudy: string;
    TermID: string;
    PCTSV: string | null;
    MaHoatDong: string | null;
}

export const showEditBehaviorDetailForm = async (
    childDetailId: string,
    yearStudy: string,
    termId: string
): Promise<BehaviorDetailEvidence | null> => {
    try {
        const response = await api.post('/student/ShowEditBehaviorDetailForm', {
            p1: childDetailId,
            p2: yearStudy,
            p3: termId,
        });
        return response.data ?? null;
    } catch (error) {
        console.error('Error showing edit behavior detail form:', error);
        throw error;
    }
};

export interface BehaviorDiscussion {
    StudentID: string;
    YearStudy: string;
    TermID: string;
    BehaviorDetailID: string;
    Comment: string;
    UpdateStaff: string;
    UpdateDate: string;
    PathHinh: string;
    SenderName: string;
}

export const showBehaviorDiscussion = async (
    behaviorDetailId: string,
    yearStudy: string,
    termId: string
): Promise<BehaviorDiscussion[]> => {
    try {
        const response = await api.post('/student/ShowBehaviorDiscussion', {
            p1: behaviorDetailId,
            p2: yearStudy,
            p3: termId,
            p4: null,
            P5: null,
        });
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error showing behavior discussion:', error);
        throw error;
    }
};

export const insertBehaviorDiscussion = async (
    behaviorDetailId: string,
    comment: string,
    yearStudy: string,
    termId: string,
    studentId: string
): Promise<void> => {
    try {
        await api.post('/student/InsertBehaviorDiscussion', {
            p1: behaviorDetailId,
            p2: comment,
            p3: yearStudy,
            p4: termId,
            p5: studentId,
        });
    } catch (error) {
        console.error('Error inserting behavior discussion:', error);
        throw error;
    }
};

export const deleteBehaviorDetail = async (
    childDetailId: string,
    yearStudy: string,
    termId: string
): Promise<void> => {
    try {
        await api.post('/student/DeleteBehaviorDetail', {
            p1: childDetailId,
            p2: yearStudy,
            p3: termId,
            p4: '1',
        });
    } catch (error) {
        console.error('Error deleting behavior detail:', error);
        throw error;
    }
};
