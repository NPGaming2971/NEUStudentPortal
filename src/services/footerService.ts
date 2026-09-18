import api from '../lib/api';

export interface FooterInfoItem {
    SettingName: string;
    SettingStringData: string;
}

export interface FooterInfo {
    collegeAlias: string;
    collegeNumber: string;
    schoolName: string;
    address: string;
    phone: string;
    fax: string;
    email: string;
    website: string;
    pageTitle: string;
    bannerUrl: string;
    loginLogoUrl: string;
}

export const getFooterInfo = async (): Promise<FooterInfo> => {
    try {
        const response = await api.get<FooterInfoItem[]>('/guest/footerinfor');
        const settings = response.data || [];

        const get = (name: string): string =>
            settings.find((s) => s.SettingName === name)?.SettingStringData || '';

        return {
            collegeAlias: get('CollegeAlias'),
            collegeNumber: get('CollegeNumber'),
            schoolName: get('TenTruong') || get('PageTitle'),
            address: get('DiaChiTruong'),
            phone: get('DienThoaiTruong'),
            fax: get('SoFax'),
            email: get('EmailTruong'),
            website: get('Website'),
            pageTitle: get('PageTitle'),
            bannerUrl: get('UrlBanner'),
            loginLogoUrl: get('LogoTrangDangNhap'),
        };
    } catch (error) {
        console.error('Error fetching footer info:', error);
        throw error;
    }
};