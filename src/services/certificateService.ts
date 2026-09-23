// Certificate Service - Student certificates management
import api from '@/lib/api';

export interface Certificate {
	CertificateType: string;
	ID: string | null;
	Mark: string | null;
	SoQuyetDinh: string | null;
	Request: string;
	Nop: boolean;
	CertificateNumber1: string | null;
	DateOfIssue1: string | null;
	PlaceOfIssue1: string | null;
	RecordNumber1: string | null;
}

export interface CertificateData {
	resultChungChi: Certificate[];
}

export interface CertificateType {
	MaLoaiChungChi: string;
	TenLoaiChungChi: string;
}

// Get student certificates
export const getStudentCertificates = async (): Promise<CertificateData> => {
	try {
		const response = await api.get('/student/ChungChiNgoaiNgu');
		return response.data;
	} catch (error) {
		console.error('Error fetching student certificates:', error);
		throw error;
	}
};

// Get certificate types for submission
export const getCertificateTypes = async (): Promise<CertificateType[]> => {
	try {
		const response = await api.get('/student/GetLoaiChungChi');
		return response.data;
	} catch (error) {
		console.error('Error fetching certificate types:', error);
		throw error;
	}
};

// Submit a new certificate
export const submitCertificate = async (formData: FormData): Promise<{ Message: string }> => {
	try {
		const response = await api.post('/student/ChungChi_Submit', formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error submitting certificate:', error);
		throw error;
	}
};
