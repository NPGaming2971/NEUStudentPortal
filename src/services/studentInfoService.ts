// Student Info Service - Profile and personal information
import api from '@/lib/api';
import { Endpoints } from '@/lib/endpoints';

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
		const response = await api.get(Endpoints.Student.Avatar);
		return {
			data: normalizeAvatarDataUrl(response.data?.data ?? '')
		};
	} catch (error) {
		console.error('Error fetching student avatar:', error);
		throw error;
	}
};

export const getStudentInfo = async (): Promise<StudentInfoResponse> => {
	try {
		const response = await api.get(Endpoints.Student.Info);
		return response.data;
	} catch (error) {
		console.error('Error fetching student info:', error);
		throw error;
	}
};

export const getStudentUpdateInfo = async () => {
	try {
		const response = await api.get(Endpoints.Student.StudentInfoUpdate);
		return response.data;
	} catch (error) {
		console.error('Error fetching student update info:', error);
		throw error;
	}
};

export const updateStudent = async (studentData: Partial<StudentInfo>) => {
	try {
		const response = await api.post(Endpoints.Student.UpdateStudent, studentData);
		return response.data;
	} catch (error) {
		console.error('Error updating student info:', error);
		throw error;
	}
};

// Province, District, Reference data
export const getProvinces = async () => {
	try {
		const response = await api.get(Endpoints.Student.ProvincesSel);
		return response.data;
	} catch (error) {
		console.error('Error fetching provinces:', error);
		throw error;
	}
};

export const getDistricts = async (provinceId: number) => {
	try {
		const response = await api.get(Endpoints.Student.DistrictsSelProvinceID, {
			params: { ProvinceID: provinceId }
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching districts:', error);
		throw error;
	}
};

export const getCountries = async () => {
	try {
		const response = await api.get(Endpoints.Student.Countries);
		return response.data;
	} catch (error) {
		console.error('Error fetching countries:', error);
		throw error;
	}
};

export const getReligions = async () => {
	try {
		const response = await api.get(Endpoints.Student.Religions);
		return response.data;
	} catch (error) {
		console.error('Error fetching religions:', error);
		throw error;
	}
};

export const getEthnicGroups = async () => {
	try {
		const response = await api.get(Endpoints.Student.Ethnics);
		return response.data;
	} catch (error) {
		console.error('Error fetching ethnic groups:', error);
		throw error;
	}
};
