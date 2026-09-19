export interface ReminderUnit {
    value: string;
    label: string;
    trigger: (value: number) => string;
}

export interface ReminderPreset {
    value: string;
    label: string;
    trigger: string | null;
}

export const REMINDER_UNITS: ReminderUnit[] = [
    { value: 'seconds', label: 'giây', trigger: (value) => `PT${value}S` },
    { value: 'minutes', label: 'phút', trigger: (value) => `PT${value}M` },
    { value: 'hours', label: 'giờ', trigger: (value) => `PT${value}H` },
    { value: 'days', label: 'ngày', trigger: (value) => `P${value}D` },
];

export const REMINDER_PRESETS: ReminderPreset[] = [
    { value: 'none', label: 'Không nhắc nhở', trigger: null },
    { value: '0', label: 'Vào lúc bắt đầu', trigger: 'PT0M' },
    { value: '5', label: '5 phút trước', trigger: 'PT5M' },
    { value: '10', label: '10 phút trước', trigger: 'PT10M' },
    { value: '30', label: '30 phút trước', trigger: 'PT30M' },
    { value: '60', label: '1 giờ trước', trigger: 'PT1H' },
    { value: '1440', label: '1 ngày trước', trigger: 'P1D' },
    { value: 'custom', label: 'Tùy chỉnh...', trigger: null },
];

export const DEFAULT_CUSTOM_REMINDER_VALUE = '60';
export const DEFAULT_CUSTOM_REMINDER_UNIT = 'minutes';

export const DEFAULT_SCHEDULE_REMINDER = '30';
export const DEFAULT_EXAM_REMINDER = '1440';

export const DURATION_OPTIONS: { value: string; label: string }[] = [
    { value: '60', label: '60 phút' },
    { value: '90', label: '90 phút' },
    { value: '120', label: '120 phút' },
    { value: '150', label: '150 phút' },
    { value: '180', label: '180 phút' },
];

export const DEFAULT_EXAM_DURATION = '90';

export const EXAM_FORMAT_DURATIONS: { keywords: string[]; minutes: number }[] = [
    { keywords: ['trac nghiem'], minutes: 60 },
    { keywords: ['tu luan'], minutes: 90 },
];

const normalizeText = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

export const getExamDurationMinutes = (examFormat: string, fallbackMinutes: number): number => {
    const normalized = normalizeText(examFormat || '');
    const match = EXAM_FORMAT_DURATIONS.find((rule) =>
        rule.keywords.some((keyword) => normalized.includes(keyword)),
    );
    return match ? match.minutes : fallbackMinutes;
};

export const buildReminderTrigger = (
    value: string,
    customValue: string,
    customUnit: string,
): string | null | undefined => {
    if (value === 'custom') {
        const num = Number(customValue);
        if (!Number.isFinite(num) || num < 0) return undefined;
        const unit = REMINDER_UNITS.find((u) => u.value === customUnit);
        return unit ? unit.trigger(num) : null;
    }
    return REMINDER_PRESETS.find((p) => p.value === value)?.trigger ?? null;
};

export const TERM_LABELS: Record<string, string> = {
    PHU: 'Kỳ thi phụ',
    HK03: 'Học kỳ Hè',
    HK02: 'Học kỳ Xuân',
    HK01: 'Học kỳ Thu',
};

export const getTermLabel = (termId: string): string => TERM_LABELS[termId] ?? termId;
