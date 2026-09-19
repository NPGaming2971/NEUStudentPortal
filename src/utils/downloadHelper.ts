import axios, { type AxiosResponse } from 'axios';
import { getToken } from '@/services/authService';
import { PORTAL_PROXY_URL } from '@/lib/proxyConfig';

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

export const downloadTranscript = async (studyProgramId: string | number): Promise<boolean> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await axios({
            method: 'GET',
            url: `${PORTAL_PROXY_URL}/student/PrintMarksGraduation`,
            params: {
                studyProgramID: studyProgramId,
            },
            responseType: 'blob',
            headers: {
                'Content-Type': 'application/json',
                apikey: 'neucqpscrbf0zt2mqo6vmw69ymoh43irb2rtxbs0ehit2kzvl2auxafjbvw==',
                Authorization: `Bearer ${token}`,
                clientid: 'neucq',
            },
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileName = getFileNameFromResponse(response) || `BangDiem_${studyProgramId}.pdf`;
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
            url: `${PORTAL_PROXY_URL}/student/PrintDonXetTotNghiep`,
            params: {
                StudyProgramID: studyProgramId,
            },
            responseType: 'blob',
            headers: {
                'Content-Type': 'application/json',
                apikey: 'neucqpscrbf0zt2mqo6vmw69ymoh43irb2rtxbs0ehit2kzvl2auxafjbvw==',
                Authorization: `Bearer ${token}`,
                clientid: 'neucq',
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

// ---- Schedule (ICS) export ----

// NEU official time table periods
const PERIOD_TIMES: Record<number, [string, string]> = {
    1: ['06:45', '08:00'],
    2: ['08:10', '09:25'],
    3: ['09:35', '10:50'],
    4: ['11:00', '12:15'],
    5: ['13:00', '14:15'],
    6: ['14:25', '15:40'],
    7: ['15:50', '17:05'],
    8: ['17:15', '18:30'],
    9: ['18:40', '19:55'],
};

const PE_TIMES: Record<number, [string, string]> = {
    1: ['07:00', '09:00'],
    3: ['09:30', '11:30'],
    5: ['13:30', '15:30'],
    7: ['15:45', '17:45'],
};

const parseVNDate = (dateStr: string): Date => {
    const [d, m, y] = dateStr.trim().split('/');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

const formatIcsDateTime = (dateObj: Date, timeStr: string): string => {
    const [hh, mm] = timeStr.split(':');
    const yyyy = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}${m}${d}T${hh}${mm}00`;
};

const getBaseCode = (maLhp: string): string => {
    const match = maLhp.match(/^([A-Za-z0-9]+)/);
    return match ? match[1] : maLhp;
};

const escapeIcsText = (value: string): string =>
    value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

interface SchedulePeriodItem {
    MaLHP: string;
    TenHP: string;
    LoaiHP: string;
    Phong?: string;
    HoTenGV?: string;
    HoTenSV?: string;
    LopSV?: string;
    PeriodID: number;
    NumberOfPeriods?: number;
    TuanHoc: string;
}

export const downloadSchedule = async (yearStudy: string, termId: string): Promise<boolean> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await axios({
            method: 'GET',
            url: `${PORTAL_PROXY_URL}/student/DrawingStudentSchedule_Perior`,
            params: { namhoc: yearStudy, hocky: termId },
            headers: {
                'Content-Type': 'application/json',
                apikey: 'neucqpscrbf0zt2mqo6vmw69ymoh43irb2rtxbs0ehit2kzvl2auxafjbvw==',
                Authorization: `Bearer ${token}`,
                clientid: 'neucq',
            },
        });

        const data: { result?: SchedulePeriodItem[] } = response.data ?? {};
        const items = data.result ?? [];
        if (items.length === 0) {
            throw new Error('Không có dữ liệu lịch học');
        }

        // Detect bi-weekly alternating courses (Repeat every 2 weeks)
        const grouped = new Map<string, SchedulePeriodItem[]>();
        items.forEach((item) => {
            const base = getBaseCode(item.MaLHP);
            const list = grouped.get(base) ?? [];
            list.push(item);
            grouped.set(base, list);
        });

        const alternatingMap = new Map<string, number>();
        grouped.forEach((list, base) => {
            if (list.length <= 1) return;
            const dates = list
                .map((i) => parseVNDate(i.TuanHoc.replace(')', '').split('->')[0]))
                .sort((a, b) => a.getTime() - b.getTime());

            for (let i = 0; i < dates.length - 1; i++) {
                const diffDays = Math.abs((dates[i + 1].getTime() - dates[i].getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 7) {
                    alternatingMap.set(base, 2);
                    break;
                }
            }
        });

        const studentName = items[0].HoTenSV || 'Student';
        const lines: string[] = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//NEU Student Schedule Generator//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            `X-WR-CALNAME:Lịch Học NEU - ${studentName}`,
            'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
            'BEGIN:VTIMEZONE',
            'TZID:Asia/Ho_Chi_Minh',
            'X-LIC-LOCATION:Asia/Ho_Chi_Minh',
            'BEGIN:STANDARD',
            'TZOFFSETFROM:+0700',
            'TZOFFSETTO:+0700',
            'TZNAME:+07',
            'DTSTART:19700101T000000',
            'END:STANDARD',
            'END:VTIMEZONE',
        ];

        items.forEach((item) => {
            const maLhp = item.MaLHP;
            const tenHp = item.TenHP;
            const loaiHp = item.LoaiHP;
            const phong = item.Phong || '';
            const gv = item.HoTenGV || '';
            const lop = item.LopSV || '';
            const periodId = item.PeriodID;
            const numPeriods = item.NumberOfPeriods || 2;

            // Date range from TuanHoc ("startDate->endDate (" format)
            const tuanClean = item.TuanHoc.replace(')', '').trim();
            const [startDateStr, endDateStr] = tuanClean.split('->');
            if (!startDateStr || !endDateStr) return;
            const startDate = parseVNDate(startDateStr);
            const endDate = parseVNDate(endDateStr);

            // Time slot determination (PE lessons use full slots)
            const isPE = maLhp.includes('GDTC') || tenHp.includes('Giáo dục thể chất');
            let startTimeStr: string;
            let endTimeStr: string;

            const peTime = PE_TIMES[periodId];
            const periodTime = PERIOD_TIMES[periodId];
            if (isPE && peTime) {
                startTimeStr = peTime[0];
                endTimeStr = peTime[1];
            } else if (periodTime) {
                startTimeStr = periodTime[0];
                const endPeriodId = periodId + numPeriods - 1;
                endTimeStr = (PERIOD_TIMES[endPeriodId] ?? periodTime)[1];
            } else {
                return;
            }

            const dtStart = formatIcsDateTime(startDate, startTimeStr);
            const dtEnd = formatIcsDateTime(startDate, endTimeStr);

            // RRULE until date
            const untilYyyy = endDate.getFullYear();
            const untilMm = String(endDate.getMonth() + 1).padStart(2, '0');
            const untilDd = String(endDate.getDate()).padStart(2, '0');
            const untilStr = `${untilYyyy}${untilMm}${untilDd}T235959Z`;

            const baseCode = getBaseCode(maLhp);
            const interval = alternatingMap.get(baseCode) || 1;

            let weekSuffix = '';
            if (interval === 2) {
                weekSuffix = startDate.getDate() > 10 ? ' (Tuần Chẵn)' : ' (Tuần Lẻ)';
            }

            const summary = `${tenHp} (${loaiHp})${weekSuffix}`;
            const description = [`Mã LHP: ${maLhp}`, `Lớp: ${lop}`, `Giảng viên: ${gv}`].join('\n');

            lines.push(
                'BEGIN:VEVENT',
                `SUMMARY:${escapeIcsText(summary)}`,
                `LOCATION:${escapeIcsText(phong)}`,
                `DESCRIPTION:${escapeIcsText(description)}`,
                `DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}`,
                `DTEND;TZID=Asia/Ho_Chi_Minh:${dtEnd}`,
                `RRULE:FREQ=WEEKLY;INTERVAL=${interval};UNTIL=${untilStr}`,
                'BEGIN:VALARM',
                'ACTION:DISPLAY',
                `DESCRIPTION:Nhắc nhở lịch học ${tenHp}`,
                'TRIGGER:-PT30M',
                'END:VALARM',
                'END:VEVENT',
            );
        });

        lines.push('END:VCALENDAR');

        const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `LichHoc_${yearStudy}.ics`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error downloading schedule:', error);
        throw error;
    }
};
