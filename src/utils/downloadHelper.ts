import axios, { type AxiosResponse } from 'axios';
import { getToken } from '@/services/authService';
import { PORTAL_PROXY_URL, PORTAL_API_KEY, PORTAL_CLIENT_ID } from '@/lib/proxyConfig';
import { getExamDurationMinutes, getTermLabel } from '@/lib/exportOptions';

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

const downloadBlobFile = async (options: {
    method: 'GET' | 'POST';
    url: string;
    params?: Record<string, string | number>;
    defaultFileName: string;
    label: string;
}): Promise<boolean> => {
    try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await axios({
            method: options.method,
            url: options.url,
            params: options.params,
            responseType: 'blob',
            headers: {
                'Content-Type': 'application/json',
                apikey: PORTAL_API_KEY,
                Authorization: `Bearer ${token}`,
                clientid: PORTAL_CLIENT_ID,
            },
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileName = getFileNameFromResponse(response) || options.defaultFileName;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error(`Error downloading ${options.label}:`, error);
        throw error;
    }
};

export const downloadTranscript = async (studyProgramId: string | number): Promise<boolean> => {
    return downloadBlobFile({
        method: 'GET',
        url: `${PORTAL_PROXY_URL}/student/PrintMarksGraduation`,
        params: { studyProgramID: studyProgramId },
        defaultFileName: `BangDiem_${studyProgramId}.pdf`,
        label: 'transcript',
    });
};

export const downloadGraduationApplication = async (studyProgramId: string | number): Promise<boolean> => {
    return downloadBlobFile({
        method: 'POST',
        url: `${PORTAL_PROXY_URL}/student/PrintDonXetTotNghiep`,
        params: { StudyProgramID: studyProgramId },
        defaultFileName: 'DonXetTotNghiep.pdf',
        label: 'graduation application',
    });
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

export { TERM_LABELS, getTermLabel } from '@/lib/exportOptions';

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

const buildCalendarHeader = (calendarName: string): string[] => [
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

const appendReminder = (
    lines: string[],
    trigger: string | null | undefined,
    description: string,
): void => {
    if (trigger === undefined || trigger === null) return;
    lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeIcsText(description)}`,
        `TRIGGER:-${escapeIcsText(trigger)}`,
        'END:VALARM',
    );
};

const saveIcsFile = (fileName: string, lines: string[]): void => {
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

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
                apikey: PORTAL_API_KEY,
                Authorization: `Bearer ${token}`,
                clientid: PORTAL_CLIENT_ID,
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

        const lines: string[] = buildCalendarHeader(calendarName);

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

            appendReminder(lines, options.reminderTrigger, `Nhắc nhở lịch học ${tenHp}`);

            lines.push('END:VEVENT');
        });

        lines.push('END:VCALENDAR');

        saveIcsFile(`LichHoc_${termId}_${yearStudy}.ics`, lines);

        return true;
    } catch (error) {
        console.error('Error downloading schedule:', error);
        throw error;
    }
};

// ---- Exam schedule (ICS) export ----

export interface ExamScheduleItem {
    CurriculumID: string;
    CurriculumName: string;
    Credits: number;
    HinhThucThi: string;
    NgayThi: string;
    GioThi: string;
    PhongThi: string;
    LanThi: number;
    Status: number;
    DurationMinutes?: number;
}

export interface ExamExportOptions {
    calendarName?: string;
    fileName?: string;
    reminderTrigger?: string | null;
    durationByFormat?: Record<string, number>;
    durationMinutes?: number;
    includeExamCode?: boolean;
    includeExamFormat?: boolean;
    includeAttempt?: boolean;
    includeCredits?: boolean;
    includeStatus?: boolean;
}

const parseExamDate = (dateStr: string): Date | null => {
    const value = (dateStr || '').trim();
    if (!value) return null;

    let match = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/.exec(value);
    if (match) {
        const [, d, m, y] = match;
        const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        return isNaN(date.getTime()) ? null : date;
    }

    match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value);
    if (match) {
        const [, y, m, d] = match;
        const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        return isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
};

const parseExamTimes = (timeStr: string): { start: string; end?: string } | null => {
    const value = (timeStr || '').trim();
    if (!value) return null;

    const found: string[] = [];
    const pattern = /(\d{1,2})\s*[h:]\s*(\d{2})/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(value)) !== null) {
        found.push(`${match[1].padStart(2, '0')}:${match[2]}`);
        if (found.length === 2) break;
    }

    if (found.length === 0) return null;
    return { start: found[0], end: found[1] };
};

const timeToMinutes = (time: string): number => {
    const [hh, mm] = time.split(':').map(Number);
    return hh * 60 + mm;
};

const minutesToTime = (minutes: number): string => {
    const normalized = ((minutes % 1440) + 1440) % 1440;
    return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
};

const formatIcsDate = (dateObj: Date): string =>
    `${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getDate()).padStart(2, '0')}`;

export const downloadExamSchedule = async (
    exams: ExamScheduleItem[],
    options: ExamExportOptions = {},
): Promise<boolean> => {
    try {
        const calendarName = options.calendarName ?? 'Lịch thi';
        const fallbackDuration = options.durationMinutes ?? 90;
        const dtStamp = new Date()
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\..+/, 'Z');

        const lines: string[] = buildCalendarHeader(calendarName);
        let eventCount = 0;

        exams.forEach((exam) => {
            const examDate = parseExamDate(exam.NgayThi);
            if (!examDate) return;

            const times = parseExamTimes(exam.GioThi);
            const summary = exam.CurriculumName || exam.CurriculumID || 'Lịch thi';

            const descriptionLines: string[] = [];
            if (options.includeExamCode !== false && exam.CurriculumID) {
                descriptionLines.push(`Mã học phần: ${exam.CurriculumID}`);
            }
            if (options.includeExamFormat !== false && exam.HinhThucThi) {
                descriptionLines.push(`Hình thức thi: ${exam.HinhThucThi}`);
            }
            if (options.includeAttempt !== false && exam.LanThi) {
                descriptionLines.push(`Lần thi: ${exam.LanThi}`);
            }
            if (options.includeCredits !== false && exam.Credits) {
                descriptionLines.push(`Số tín chỉ: ${exam.Credits}`);
            }
            if (options.includeStatus !== false) {
                descriptionLines.push(`Trạng thái: ${exam.Status === 1 ? 'Đã thi' : 'Chưa thi'}`);
            }

            lines.push(
                'BEGIN:VEVENT',
                `UID:${dtStamp}-exam-${eventCount}@neu`,
                `DTSTAMP:${dtStamp}`,
                `SUMMARY:${escapeIcsText(summary)}`,
                `LOCATION:${escapeIcsText(exam.PhongThi || '')}`,
                `DESCRIPTION:${escapeIcsText(descriptionLines.join('\n'))}`,
            );

            if (times) {
                const duration =
                    exam.DurationMinutes ??
                    options.durationByFormat?.[exam.HinhThucThi] ??
                    getExamDurationMinutes(exam.HinhThucThi, fallbackDuration);
                const endTime = times.end ?? minutesToTime(timeToMinutes(times.start) + duration);
                lines.push(
                    `DTSTART;TZID=Asia/Ho_Chi_Minh:${formatIcsDateTime(examDate, times.start)}`,
                    `DTEND;TZID=Asia/Ho_Chi_Minh:${formatIcsDateTime(examDate, endTime)}`,
                );
            } else {
                const nextDay = new Date(examDate.getTime() + 86400000);
                lines.push(
                    `DTSTART;VALUE=DATE:${formatIcsDate(examDate)}`,
                    `DTEND;VALUE=DATE:${formatIcsDate(nextDay)}`,
                );
            }

            appendReminder(lines, options.reminderTrigger, `Nhắc nhở lịch thi ${summary}`);
            lines.push('END:VEVENT');
            eventCount += 1;
        });

        if (eventCount === 0) {
            throw new Error('Không có dữ liệu lịch thi');
        }

        lines.push('END:VCALENDAR');
        saveIcsFile(options.fileName ?? 'LichThi.ics', lines);

        return true;
    } catch (error) {
        console.error('Error downloading exam schedule:', error);
        throw error;
    }
};
