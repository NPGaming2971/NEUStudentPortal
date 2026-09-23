// Attendance Service - Student attendance records
import api from '@/lib/api';

export interface AttendanceItem {
	MaLHP: string;
	TenHP: string;
	SoTC: number;
	SoTiet: number;
	SoTietVang: number;
	PhanTramVang: string;
	NgayHoc: string;
	Thu: string;
	Phong: string;
	Tiet: string;
	DenLopTre: number;
	Vang: number;
}

export const getStudentAttendance = async (yearStudy: string, termId: string): Promise<AttendanceItem[]> => {
	try {
		const response = await api.get('/student/GetDiemDanhSinhVien', {
			params: { namhoc: yearStudy, hocky: termId }
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching student attendance:', error);
		throw error;
	}
};
