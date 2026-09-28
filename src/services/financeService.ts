// Finance Service - Tuition and scholarship related
import api from '@/lib/api';
import { Endpoints } from '@/lib/endpoints';

export interface FinanceItem {
	HoTen: string;
	Lop: string;
	AccountID: string;
	TransactionID: number;
	FeeID: string;
	FeeName: string | null;
	DebtAmount: number;
	PaidDate: string | null;
	PaidAmount: number;
	PaidLeft: number;
	DaGiam: number;
	YearStudy: string;
	TermID: string;
	SoHoaDon: string | null;
	PTGiam: string | null;
	RegistType: string;
	TenHinhThucThanhToan: string | null;
	NoiDungThu: string | null;
	ConNo: number;
	OrderTerm: number;
}

export interface ScholarshipItem {
	YearStudy: string;
	TermID: string;
	TenMienGiam: string;
	PhanTramMienGiam: number;
	SoTienMienGiam: number;
	GhiChu?: string;
}

export const getStudentFinance = async (): Promise<FinanceItem[]> => {
	try {
		const response = await api.get(Endpoints.Student.AccountFeeHocPhan);
		return response.data;
	} catch (error) {
		console.error('Error fetching student finance:', error);
		throw error;
	}
};

export const getStudentScholarshipPolicy = async (): Promise<ScholarshipItem[]> => {
	try {
		const response = await api.get(Endpoints.Student.MienGiam);
		return response.data;
	} catch (error) {
		console.error('Error fetching scholarship policy:', error);
		throw error;
	}
};
