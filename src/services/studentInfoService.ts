// Student Info Service - Profile and personal information
import api from '@/lib/api';

export interface StudentInfo {
    MaSinhVien: string;
    HoTen: string;
    GioiTinh: string;
    NgaySinh: string;
    CMND: string;
    DanToc: string;
    TonGiao: string;
    KhoaHoc: string;
    ChucVu: string | null;
    DoiTuong: string | null;
    THPTLop12: string | null;
    DoanVien: string | null;
    NgayVaoDoan: string | null;
    DangVien: string | null;
    NgayVaoDang: string | null;
    LoaiHinhDaoTao: string;
    CoVanHocTap: string;
    LienHeCoVHT: string;
    LopSinhVien: string;
    TinhTrangHoc: string;
    NienKhoa: string;
    QuocGia: string;
    TinhThanh: string;
    QuanHuyen: string | null;
    PhuongXa: string | null;
    DiDong: string;
    DienThoaiBan: string;
    EmailTruong: string;
    EmailCaNhan: string;
    DiaChi: string;
    HoTenNguoiLienHe: string;
    DiaChiNguoiLienHe: string;
    DienThoaiNguoiLienHe: string;
    NamHetHan: string;
    STK: string;
    TenNganHang: string;
}

export interface StudentInfoResponse {
    sinhVien: StudentInfo;
}

export interface StudentAvatarResponse {
    data: string;
}

const normalizeAvatarDataUrl = (dataUrl: string): string => {
    if (dataUrl.startsWith('data:jpg')) {
        return 'data:image/jpeg' + dataUrl.slice('data:jpg'.length);
    }
    return dataUrl;
};

export const getStudentAvatar = async (): Promise<StudentAvatarResponse> => {
    try {
        const response = await api.get('/student/GetAvatar');
        return {
            data: normalizeAvatarDataUrl(response.data?.data ?? ''),
        };
    } catch (error) {
        console.error('Error fetching student avatar:', error);
        throw error;
    }
};

export const getStudentInfo = async (): Promise<StudentInfoResponse> => {
    try {
        const response = await api.get('/student/info');
        return response.data;
    } catch (error) {
        console.error('Error fetching student info:', error);
        throw error;
    }
};

export const getStudentUpdateInfo = async () => {
    try {
        const response = await api.get('/student/StudentInfoUpdate');
        return response.data;
    } catch (error) {
        console.error('Error fetching student update info:', error);
        throw error;
    }
};

export const updateStudent = async (studentData: Partial<StudentInfo>) => {
    try {
        const response = await api.post('/student/UpdateStudent', studentData);
        return response.data;
    } catch (error) {
        console.error('Error updating student info:', error);
        throw error;
    }
};

// Province, District, Reference data
export const getProvinces = async () => {
    try {
        const response = await api.get('/student/Provinces_Sel');
        return response.data;
    } catch (error) {
        console.error('Error fetching provinces:', error);
        throw error;
    }
};

export const getDistricts = async (provinceId: number) => {
    try {
        const response = await api.get('/student/Districts_Sel_ProvinceID', {
            params: { ProvinceID: provinceId },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching districts:', error);
        throw error;
    }
};

export const getCountries = async () => {
    try {
        const response = await api.get('/student/Countries');
        return response.data;
    } catch (error) {
        console.error('Error fetching countries:', error);
        throw error;
    }
};

export const getReligions = async () => {
    try {
        const response = await api.get('/student/Religions');
        return response.data;
    } catch (error) {
        console.error('Error fetching religions:', error);
        throw error;
    }
};

export const getEthnicGroups = async () => {
    try {
        const response = await api.get('/student/Ethnics');
        return response.data;
    } catch (error) {
        console.error('Error fetching ethnic groups:', error);
        throw error;
    }
};
