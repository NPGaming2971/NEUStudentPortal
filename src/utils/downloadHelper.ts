import axios, { type AxiosResponse } from 'axios';
import { getToken } from '@/services/authService';

const getFileNameFromResponse = (response: AxiosResponse): string | null => {
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
            return matches[1].replace(/['"]/g, '');
        }
    }
    return null;
};

export const downloadTranscript = async (studentId: string, studyProgramId: string | number): Promise<boolean> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const studentIdStr = String(studentId);
        const studyProgramIdStr = String(studyProgramId);
        const p2 = '1A' + studentIdStr[0] + studentIdStr[1] + studyProgramIdStr.substring(4, 8);

        const response = await axios({
            method: 'POST',
            url: 'https://portal_api.neu.edu.vn/api/student/DownLoadReport',
            responseType: 'blob',
            headers: {
                'Content-Type': 'application/json',
                apikey: 'pscRBF0zT2Mqo6vMw69YMOH43IrB2RtXBS0EHit2kzvL2auxaFJBvw==',
                Authorization: `Bearer ${token}`,
                clientid: 'neu',
            },
            data: {
                typeFile: 'pdf',
                typeReport: '2',
                fileName: 'BangDiem.pdf',
                p1: studentId,
                p2: p2,
                p3: 'ALL',
                p4: 'ALL',
            },
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileName = getFileNameFromResponse(response) || `BangDiem_${studentId}.pdf`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error downloading transcript:', error);
        throw error;
    }
};

export const downloadGraduationApplication = async (studyProgramId: string | number): Promise<boolean> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await axios({
            method: 'POST',
            url: 'https://portal_api.neu.edu.vn/api/student/PrintDonXetTotNghiep',
            params: {
                StudyProgramID: studyProgramId,
            },
            responseType: 'blob',
            headers: {
                'Content-Type': 'application/json',
                apikey: 'pscRBF0zT2Mqo6vMw69YMOH43IrB2RtXBS0EHit2kzvL2auxaFJBvw==',
                Authorization: `Bearer ${token}`,
                clientid: 'neu',
            },
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileName = getFileNameFromResponse(response) || 'DonXetTotNghiep.pdf';
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error downloading graduation application:', error);
        throw error;
    }
};
