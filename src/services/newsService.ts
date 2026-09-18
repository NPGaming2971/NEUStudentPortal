import api from '../lib/api';

export interface NewsGroup {
    MaNhomTin: number;
    TenNhomTin: string;
    ParentId?: number | null;
    TenNhomCha?: string | null;
    ThuTu?: number;
    HienThi?: boolean;
    He?: string | null;
}

export interface NewsItem {
    MaTin: number;
    TieuDe: string;
    MoTa?: string;
    NoiDung?: string;
    MaNhomTin?: number;
    TenNhomTin?: string;
    UpdateDate?: string | null;
    CreateDate: string;
    UpdateStaffName?: string;
    CreateStaff?: string;
}

export const getNewsGroups = async (): Promise<NewsGroup[]> => {
    try {
        const response = await api.get('/guest/GetNhomTin', {
            params: { maNhomTin: -1 },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching news groups:', error);
        throw error;
    }
};

export const getNewsItems = async (
    maNhomTin: number = 0,
    nhomTin: number = 0,
    currPage: number = 1
): Promise<NewsItem[]> => {
    try {
        const response = await api.get('/guest/GetTinTucHienThi', {
            params: { maNhomTin, nhomTin, currPage },
        });
        return response.data.tbTinTuc || [];
    } catch (error) {
        console.error('Error fetching news items:', error);
        throw error;
    }
};

export const getNewsById = async (newsId: number): Promise<NewsItem> => {
    try {
        const response = await api.get('/guest/GetTinTucTheoMaTin', {
            params: { maTin: newsId },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching news details:', error);
        throw error;
    }
};
