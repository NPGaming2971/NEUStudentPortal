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

export const TERM_LABELS: Record<string, string> = {
    PHU: 'Kỳ thi phụ',
    HK03: 'Học kỳ Hè',
    HK02: 'Học kỳ Xuân',
    HK01: 'Học kỳ Thu',
};

export const getTermLabel = (termId: string): string => TERM_LABELS[termId] ?? termId;

const parseVNDate = (dateStr: string): Date => {
    const [d, m, y] = dateStr.trim().split('/');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

const DISCUSSION_SUFFIX = /_TL(?:_\d+)?$/i;

const getBiweeklyCodes = (items: SchedulePeriodItem[]): Set<string> => {
    const allCodes = new Set(items.map((item) => item.MaLHP));
    const biweekly = new Set<string>();
    items.forEach((item) => {
        if (!DISCUSSION_SUFFIX.test(item.MaLHP)) return;
        const theoryCode = item.MaLHP.replace(DISCUSSION_SUFFIX, '');
        if (theoryCode && allCodes.has(theoryCode)) {
            biweekly.add(item.MaLHP);
            biweekly.add(theoryCode);
        }
    });
    return biweekly;
};

const formatIcsDateTime = (dateObj: Date, timeStr: string): string => {
    const [hh, mm] = timeStr.split(':');
    const yyyy = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}${m}${d}T${hh}${mm}00`;
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
    SoTC?: number;
    CampusName?: string;
    CampusAddress?: string;
    PeriodID: number;
    NumberOfPeriods?: number;
    TuanHoc: string;
}

export type ScheduleTitleStyle = "subject" | "subjectType" | "codeSubject" | "subjectRoom";

export interface ScheduleExportOptions {
    reminderTrigger?: string | null;
    titleStyle?: ScheduleTitleStyle;
    courseCodes?: string[] | null;
    includeCourseCode?: boolean;
    includeLoaiHp?: boolean;
    includeCredits?: boolean;
    includeTeacher?: boolean;
    includeClass?: boolean;
    includeCampus?: boolean;
}

export const downloadSchedule = async (
    yearStudy: string,
    termId: string,
    options: ScheduleExportOptions = {},
): Promise<boolean> => {
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
        const allowedCodes = options.courseCodes?.length ? new Set(options.courseCodes) : null;
        const items = (data.result ?? []).filter(
            (item) => !allowedCodes || allowedCodes.has(item.MaLHP),
        );
        if (items.length === 0) {
            throw new Error('Không có dữ liệu lịch học');
        }

        const biweeklyCodes = getBiweeklyCodes(data.result ?? []);

        const calendarName = `Lịch học ${getTermLabel(termId)} ${yearStudy}`;
        const dtStamp = new Date()
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\..+/, 'Z');

        const lines: string[] = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//NEU Student Schedule Generator//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
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

        items.forEach((item, index) => {
            const maLhp = item.MaLHP;
            const tenHp = item.TenHP;
            const loaiHp = item.LoaiHP;
            const phong = item.Phong || '';
            const gv = item.HoTenGV || '';
            const lop = item.LopSV || '';
            const soTc = item.SoTC;
            const campus = [item.CampusName, item.CampusAddress]
                .filter(Boolean)
                .join(', ')
                .trim();
            const periodId = item.PeriodID;
            const numPeriods = item.NumberOfPeriods || 2;

            const tuanClean = item.TuanHoc.replace(')', '').trim();
            const [startDateStr, endDateStr] = tuanClean.split('->');
            if (!startDateStr || !endDateStr) return;
            const startDate = parseVNDate(startDateStr);
            const endDate = parseVNDate(endDateStr);

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

            const untilDate = [
                endDate.getFullYear(),
                String(endDate.getMonth() + 1).padStart(2, '0'),
                String(endDate.getDate()).padStart(2, '0'),
            ].join('');
            const untilStr = `${untilDate}T235959Z`;

            let summary: string;
            switch (options.titleStyle) {
                case 'codeSubject':
                    summary = [maLhp, tenHp].filter(Boolean).join(' - ');
                    break;
                case 'subjectRoom':
                    summary = [tenHp, phong].filter(Boolean).join(' - ');
                    break;
                case 'subject':
                    summary = tenHp;
                    break;
                default:
                    summary = [
                        tenHp,
                        options.includeLoaiHp && loaiHp ? ` (${loaiHp})` : '',
                    ].join('');
                    break;
            }

            const descriptionLines: string[] = [];
            if (options.includeCourseCode !== false && maLhp) {
                descriptionLines.push(`Mã lớp học phần: ${maLhp}`);
            }
            if (options.includeLoaiHp !== false && loaiHp) {
                descriptionLines.push(`Loại: ${loaiHp}`);
            }
            if (options.includeCredits !== false && soTc) {
                descriptionLines.push(`Số tín chỉ: ${soTc}`);
            }
            if (options.includeClass !== false && lop) {
                descriptionLines.push(`Lớp: ${lop}`);
            }
            if (options.includeTeacher !== false && gv) {
                descriptionLines.push(`Giảng viên: ${gv}`);
            }
            if (options.includeCampus !== false && campus) {
                descriptionLines.push(`Cơ sở: ${campus}`);
            }
            const description = descriptionLines.join('\n');

            const location = [
                phong,
                options.includeCampus !== false ? campus : '',
            ].filter(Boolean).join(', ');

            const interval = biweeklyCodes.has(maLhp) ? 2 : 1;

            lines.push(
                'BEGIN:VEVENT',
                `UID:${dtStamp}-schedule-${index}@neu`,
                `DTSTAMP:${dtStamp}`,
                `SUMMARY:${escapeIcsText(summary)}`,
                `LOCATION:${escapeIcsText(location)}`,
                `DESCRIPTION:${escapeIcsText(description)}`,
                `DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}`,
                `DTEND;TZID=Asia/Ho_Chi_Minh:${dtEnd}`,
                `RRULE:FREQ=WEEKLY;INTERVAL=${interval};UNTIL=${untilStr}`,
            );

            if (options.reminderTrigger !== undefined && options.reminderTrigger !== null) {
                lines.push(
                    'BEGIN:VALARM',
                    'ACTION:DISPLAY',
                    `DESCRIPTION:Nhắc nhở lịch học ${escapeIcsText(tenHp)}`,
                    `TRIGGER:-${escapeIcsText(options.reminderTrigger)}`,
                    'END:VALARM',
                );
            }

            lines.push('END:VEVENT');
        });

        lines.push('END:VCALENDAR');

        const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `LichHoc_${termId}_${yearStudy}.ics`;
        link.setAttribute('download', fileName);
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
